import time
import json
import logging
import asyncio
import re
from typing import List, Dict, Any, Optional
from urllib.parse import urlparse, parse_qs, urlencode, urlunparse
import pandas as pd
from playwright.async_api import async_playwright, Page, Response, Request
from bs4 import BeautifulSoup
import google.generativeai as genai

from scraper.config import get_llm
from scraper.models import MandiSource, Endpoint, HtmlMapping, SchemaMapping, DiscoveryOutput, Pagination
from scraper.utils import is_internal_link, normalize_link

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Constants for Table Detection
TABLE_INDICATORS = {
    "MANDI": ["mandi", "market", "apmc", "yard", "center", "centre"],
    "COMMODITY": ["commodity", "crop", "variety", "item", "agricultural", "name"],
    "PRICE": ["price", "rate", "min", "max", "modal", "model", "msp", "quotation"],
    "DATE": ["date", "arrival", "time", "day"],
    "LOCATION": ["district", "state", "region", "tehsil", "taluka"]
}

# Constants for URL Scoring
URL_SCORING_RULES = {
    "HIGH_PRIORITY": {
        "keywords": ["mandi", "market", "price", "rate", "report", "daily", "agmarknet", "arrival", "bhav", "dashboard"],
        "score": 10
    },
    "MEDIUM_PRIORITY": {
        "keywords": ["list", "search", "view", "data", "commodity", "crop", "xml", "json"],
        "score": 5
    },
    "NEGATIVE_PRIORITY": {
        "keywords": ["about", "contact", "tender", "notice", "gallery", "login", "register", "press", "map", "auth", "signin", "signup", "terms", "policy"],
        "score": -15
    }
}

class MandiScrapeAI:
    def __init__(self, entry_url: str):
        self.entry_url = entry_url
        self.base_url = f"{urlparse(entry_url).scheme}://{urlparse(entry_url).netloc}"
        self.visited_urls = set()
        self.queue = [(entry_url, 10)] # (url, priority)
        self.api_candidates = []
        self.table_candidates = []
        self.file_candidates = []
        self.max_pages = 15  # Reduced to avoid getting lost
        self.max_runtime = 180
        self.start_time = time.time()
        self.llm = get_llm()
        
        # Regex patterns
        self.date_pattern = re.compile(r'\d{2}[-/]\d{2}[-/]\d{4}|\d{4}[-/]\d{2}[-/]\d{2}')
        self.price_pattern = re.compile(r'\b(price|rate|min|max|modal)\b', re.IGNORECASE)
        self.mandi_pattern = re.compile(r'\b(mandi|market|apmc)\b', re.IGNORECASE)

    async def run(self) -> Dict[str, Any]:
        async with async_playwright() as p:
            # Launch with specific args to avoid detection
            browser = await p.chromium.launch(
                headless=True,
                args=["--disable-blink-features=AutomationControlled"]
            )
            context = await browser.new_context(
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                viewport={'width': 1280, 'height': 800}
            )
            
            # Stealth scripts
            await context.add_init_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
            
            page = await context.new_page()

            # Step 1: Process Entry URL
            logger.info(f"Starting discovery on: {self.entry_url}")
            await self._process_page(page, self.entry_url)

            # Step 2 & 3: Visit Priority Queue
            while self.queue and len(self.visited_urls) < self.max_pages:
                if time.time() - self.start_time > self.max_runtime:
                    logger.warning("Max runtime exceeded.")
                    break

                self.queue.sort(key=lambda x: x[1], reverse=True)
                url, priority = self.queue.pop(0)

                if url in self.visited_urls:
                    continue

                logger.info(f"Visiting: {url} (Priority: {priority})")
                await self._process_page(page, url)

            await browser.close()

        # Step 4, 5, 6: Analyze Findings
        return await self._generate_config()

    async def _process_page(self, page: Page, url: str):
        self.visited_urls.add(url)
        
        # Capture network requests
        page.on("response", self._handle_response)

        try:
            # Smart wait strategy
            response = await page.goto(url, timeout=20000, wait_until="domcontentloaded")
            if not response or response.status >= 400:
                logger.warning(f"Failed to load {url} - Status: {response.status if response else 'Unknown'}")
                return
            
            await page.wait_for_load_state("networkidle", timeout=5000)
        except Exception as e:
            logger.error(f"Error loading {url}: {str(e)}")
            return

        # 1. Extract Links for crawling
        links = await page.evaluate("""() => {
            return Array.from(document.querySelectorAll('a'))
                .map(a => ({ href: a.href, text: a.innerText }))
        }""")

        for link_obj in links:
            href = link_obj['href']
            text = link_obj['text']
            normalized = normalize_link(self.base_url, href)
            
            # Check for Files (PDF/XLS)
            if self._is_file_link(normalized):
                self.file_candidates.append({
                    "url": normalized,
                    "text": text,
                    "source_page": url
                })
                continue

            if is_internal_link(self.base_url, normalized) and normalized not in self.visited_urls:
                score = self._score_url(normalized, text)
                if score > 0:
                    # Check if already in queue to update priority? (Simplified: just append)
                    self.queue.append((normalized, score))

        # 2. Check for HTML Tables
        await self._analyze_html_tables(page, url)

    async def _analyze_html_tables(self, page: Page, url: str):
        content = await page.content()
        soup = BeautifulSoup(content, 'html.parser')
        tables = soup.find_all('table')
        
        for i, table in enumerate(tables):
            rows = table.find_all('tr')
            if len(rows) < 3: # Ignore tiny tables
                continue
                
            # Extract headers
            headers = []
            header_row = table.find('thead')
            if header_row:
                headers = [th.get_text(strip=True).lower() for th in header_row.find_all(['th', 'td'])]
            else:
                # Try first row
                headers = [td.get_text(strip=True).lower() for td in rows[0].find_all(['th', 'td'])]

            # Analyze headers against constants
            header_text = " ".join(headers)
            matches = {
                category: any(k in header_text for k in keywords)
                for category, keywords in TABLE_INDICATORS.items()
            }
            
            # Calculate Score based on category matches
            # 1 point for each matched category (MANDI, PRICE, COMMODITY, etc.)
            base_score = sum(1 for v in matches.values() if v)
            
            # Additional heuristic: Price is critical
            if matches["PRICE"]:
                base_score += 1

            # Threshold Logic:
            # Score >= 3: Strong candidate (e.g. Commodity + Price + Date)
            # Score == 2: Marginal candidate (e.g. Commodity + Price), potentially useful, rely on LLM mapping later
            
            if base_score >= 2:
                # Extract a sample row
                sample_row_data = []
                if len(rows) > 1:
                    sample_row_data = [td.get_text(strip=True) for td in rows[1].find_all('td')]

                # Check for pagination in HTML
                pagination_info = await self._detect_html_pagination(page, table)

                self.table_candidates.append({
                    "url": url,
                    "table_index": i,
                    "headers": headers,
                    "row_count": len(rows),
                    "sample_row": sample_row_data,
                    "pagination": pagination_info,
                    "score": base_score,
                    "matches": matches
                })

    async def _detect_html_pagination(self, page: Page, table_element) -> dict:
        # Simple heuristic: Look for "Next", ">>", "2", "3" links near the table
        # This is hard to do robustly without visual analysis, but we can look for keywords in <a> tags
        return {"type": "unknown", "detected": False}

    def _is_file_link(self, url: str) -> bool:
        lower = url.lower()
        return lower.endswith(('.pdf', '.xls', '.xlsx', '.csv'))

    async def _handle_response(self, response: Response):
        # We only care about XHR/Fetch returning JSON
        if "json" not in response.headers.get("content-type", ""):
            return
            
        url = response.url
        request = response.request
        
        # Filter junk
        if any(x in url for x in ["google", "facebook", "analytics", "tracking", "hotjar", "sentry"]):
            return
        
        # Ignore empty responses
        try:
            text = await response.text()
            if not text: return
            json_data = json.loads(text)
        except:
            return

        # Check structure
        is_candidate = False
        sample_record = None
        
        if isinstance(json_data, list) and len(json_data) > 0:
            if isinstance(json_data[0], dict):
                sample_record = json_data[0]
                is_candidate = self._validate_json_record(sample_record)
                
        elif isinstance(json_data, dict):
            # Recursively search for a list of dicts
            for key, val in json_data.items():
                if isinstance(val, list) and len(val) > 0 and isinstance(val[0], dict):
                    if self._validate_json_record(val[0]):
                        sample_record = val[0]
                        is_candidate = True
                        break
        
        if is_candidate:
            # Check pagination in Query Params
            parsed = urlparse(url)
            qs = parse_qs(parsed.query)
            
            pagination = {"type": "none"}
            if any(k in qs for k in ['page', 'p', 'pageIndex']):
                pagination = {
                    "type": "page", 
                    "param": next(k for k in qs if k in ['page', 'p', 'pageIndex']),
                    "limitParam": next((k for k in qs if k in ['size', 'limit', 'pageSize']), None)
                }
            elif any(k in qs for k in ['offset', 'start', 'skip']):
                 pagination = {
                    "type": "offset", 
                    "param": next(k for k in qs if k in ['offset', 'start', 'skip']),
                    "limitParam": next((k for k in qs if k in ['size', 'limit', 'pageSize']), None)
                }

            self.api_candidates.append({
                "url": url,
                "method": request.method,
                "headers": request.headers,
                "post_data": request.post_data,
                "sample": sample_record,
                "pagination": pagination,
                "timestamp": time.time()
            })

    def _validate_json_record(self, record: dict) -> bool:
        keys = " ".join(record.keys()).lower()
        # Must have at least a price/rate AND a commodity/crop/mandi
        has_price = any(k in keys for k in ['price', 'rate', 'min', 'max', 'modal'])
        has_entity = any(k in keys for k in ['mandi', 'market', 'commodity', 'crop', 'variety'])
        return has_price and has_entity

    def _score_url(self, url: str, text: str = "") -> int:
        score = 5
        text = text.lower()
        url_lower = url.lower()
        
        # Iterate over rules to dynamically adjust score
        for rule_name, rule_data in URL_SCORING_RULES.items():
            keywords = rule_data["keywords"]
            adjustment = rule_data["score"]
            
            if any(k in url_lower or k in text for k in keywords):
                score += adjustment
                
        return score

    async def _generate_config(self) -> Dict[str, Any]:
        # 1. API Strategy (Preferred)
        if self.api_candidates:
            # Sort by "completeness" (number of keys matching schema)
            # For now, just take the most recent one that looks good
            best_api = self.api_candidates[-1]
            
            logger.info("Generating Schema Mapping for API...")
            mapping = await self._llm_schema_map(best_api['sample'], "API")
            
            return {
                "type": "API",
                "confidence": 0.95,
                "bestUrl": self.entry_url,
                "endpoint": {
                    "url": best_api['url'],
                    "method": best_api['method'],
                    "headers": {k:v for k,v in best_api['headers'].items() if k.lower() in ['content-type', 'authorization', 'x-api-key']},
                    "bodyTemplate": json.loads(best_api['post_data']) if best_api['post_data'] else None,
                    "pagination": best_api['pagination']
                },
                "schemaMapping": mapping,
                "reasoningSummary": "Discovered hidden API endpoint providing structured JSON data.",
                "nextAction": "SAVE_CONFIG"
            }

        # 2. HTML Table Strategy
        if self.table_candidates:
            # Sort by Score (high to low) and then by row count
            # This prioritizes tables that match more keywords (e.g. Price + Commodity + Date)
            best_table = max(self.table_candidates, key=lambda x: (x.get('score', 0), x['row_count']))
            
            logger.info(f"Selected Best Table (Score: {best_table.get('score', 0)})")
            
            # If the score is marginal (e.g. 2), the reasoning summary should reflect that we rely on LLM
            confidence = 0.8 if best_table.get('score', 0) >= 3 else 0.5
            
            logger.info("Generating Schema Mapping for HTML Table...")
            mapping = await self._llm_schema_map({k: "index_"+str(i) for i, k in enumerate(best_table['headers'])}, "HTML", context=f"Headers: {best_table['headers']}")
            
            return {
                "type": "HTML_TABLE",
                "confidence": confidence,
                "bestUrl": best_table['url'],
                "htmlMapping": {
                    "tableSelector": f"table:nth-of-type({best_table['table_index'] + 1})", 
                    "rowSelector": "tr",
                    "columns": {k: i for i, k in enumerate(best_table['headers'])} 
                },
                "schemaMapping": mapping,
                "reasoningSummary": f"Found data table with {best_table['row_count']} rows. Score: {best_table.get('score', 0)}. Matches: {best_table.get('matches', {})}",
                "nextAction": "SAVE_CONFIG"
            }

        # 3. PDF/Excel Strategy
        if self.file_candidates:
            # Group by similarity pattern
            # For now, just return the most promising one
            best_file = self.file_candidates[0]
            
            return {
                "type": "PDF" if best_file['url'].endswith('.pdf') else "EXCEL",
                "confidence": 0.6,
                "bestUrl": best_file['url'],
                "schemaMapping": {},
                "reasoningSummary": "Found downloadable reports.",
                "nextAction": "MANUAL_REQUIRED" # usually requires custom parsing logic
            }

        return {
            "type": "UNDEFINED",
            "confidence": 0.0,
            "bestUrl": self.entry_url,
            "reasoningSummary": "Crawled multiple pages but found no structured data.",
            "nextAction": "MANUAL_REQUIRED"
        }

    async def _llm_schema_map(self, sample_data: Any, source_type: str, context: str = "") -> Dict[str, str]:
        prompt = f"""
        Act as a Data Engineer. Map the Source Fields to the Unified Schema.
        
        Unified Schema Fields:
        - date (YYYY-MM-DD)
        - state
        - district
        - mandi (Market Name)
        - crop (Commodity)
        - variety
        - min_price
        - max_price
        - modal_price
        - unit (e.g., Quintal, Kg)

        Source Type: {source_type}
        Context: {context}
        Source Data Sample:
        {json.dumps(sample_data, indent=2)}

        Instructions:
        1. Identify which field in Source Data corresponds to the Unified Schema.
        2. If a Unified Schema field is missing in Source, omit it.
        3. If multiple fields look similar (e.g., 'Arrival_Date' vs 'Report_Date'), prefer the one indicating the price date.
        
        Output JSON only:
        {{
            "date": "Source_Field_Name",
            "mandi": "Source_Field_Name",
            ...
        }}
        """
        
        try:
            response = await self.llm.generate_content_async(prompt)
            # Cleanup Markdown
            text = response.text.replace("```json", "").replace("```", "").strip()
            return json.loads(text)
        except Exception as e:
            logger.error(f"LLM Mapping failed: {e}")
            return {}
