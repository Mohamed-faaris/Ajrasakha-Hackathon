import time
import json
import logging
import asyncio
from typing import List, Dict, Any, Optional
from urllib.parse import urlparse, urljoin
import pandas as pd
from playwright.async_api import async_playwright, Page, Response, Request
from bs4 import BeautifulSoup
import google.generativeai as genai

from scraper.config import get_llm
from scraper.models import MandiSource, Endpoint, HtmlMapping, SchemaMapping, DiscoveryOutput, Pagination
from scraper.utils import is_internal_link, normalize_link

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class MandiScrapeAI:
    def __init__(self, entry_url: str):
        self.entry_url = entry_url
        self.base_url = f"{urlparse(entry_url).scheme}://{urlparse(entry_url).netloc}"
        self.visited_urls = set()
        self.queue = [(entry_url, 10)] # (url, priority)
        self.api_candidates = []
        self.table_candidates = []
        self.file_candidates = []
        self.max_pages = 20
        self.max_runtime = 180
        self.start_time = time.time()
        self.llm = get_llm()

    async def run(self) -> Dict[str, Any]:
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            context = await browser.new_context()
            page = await context.new_page()

            # Step 1: Open entry URL & Extract Links
            await self._process_page(page, self.entry_url)

            # Step 2 & 3: Visit Priority Queue
            while self.queue and len(self.visited_urls) < self.max_pages:
                if time.time() - self.start_time > self.max_runtime:
                    logger.info("Runtime exceeded.")
                    break

                self.queue.sort(key=lambda x: x[1], reverse=True)
                url, priority = self.queue.pop(0)

                if url in self.visited_urls:
                    continue

                logger.info(f"Visiting: {url} (Priority: {priority})")
                await self._process_page(page, url)

            await browser.close()

        # Step 4, 5, 6: Analyze Findings
        return self._generate_config()

    async def _process_page(self, page: Page, url: str):
        self.visited_urls.add(url)
        
        # Capture network requests
        page.on("response", self._handle_response)

        try:
            await page.goto(url, timeout=15000, wait_until="domcontentloaded")
            await asyncio.sleep(2) # Allow JS to load
        except Exception as e:
            logger.error(f"Failed to load {url}: {e}")
            return

        # Extract Links
        links = await page.evaluate("""() => {
            return Array.from(document.querySelectorAll('a')).map(a => a.href);
        }""")

        for link in links:
            normalized = normalize_link(self.base_url, link)
            if is_internal_link(self.base_url, normalized) and normalized not in self.visited_urls:
                score = self._score_url(normalized)
                if score > 0:
                    self.queue.append((normalized, score))

        # Check for HTML Tables
        content = await page.content()
        soup = BeautifulSoup(content, 'html.parser')
        tables = soup.find_all('table')
        

        #CODE SMELL - This is a very basic heuristic and can be improved significantly with LLM analysis of table content and structure. For now, we just check for presence of relevant keywords in headers and a minimum number of rows.
        for i, table in enumerate(tables):
            rows = table.find_all('tr')
            if len(rows) > 5:
                # Basic check for mandi keywords in headers
                headers = [th.get_text(strip=True).lower() for th in table.find_all('th')]
                if any(k in " ".join(headers) for k in ['mandi', 'market', 'commodity', 'crop', 'price', 'rate']):
                    self.table_candidates.append({
                        "url": url,
                        "table_index": i,
                        "headers": headers,
                        "row_count": len(rows),
                        "sample_row": [td.get_text(strip=True) for td in rows[1].find_all('td')] if len(rows) > 1 else []
                    })
        
        # Check for File Downloads (PDF/XLS)
        # (Simplified implementation for brevity)
        pass

    async def _handle_response(self, response: Response):
        try:
            if "json" in response.headers.get("content-type", ""):
                url = response.url
                # Filter out tracking/analytics
                if any(x in url for x in ["google", "facebook", "analytics", "tracking"]):
                    return
                
                try:
                    json_data = await response.json()
                    # Basic validation logic to see if it looks like mandi data
                    if isinstance(json_data, list) and len(json_data) > 0:
                        sample = json_data[0]
                        if isinstance(sample, dict):
                            keys = "".join(sample.keys()).lower()
                            if any(k in keys for k in ['mandi', 'market', 'commodity', 'crop', 'price', 'rate', 'min', 'max']):
                                self.api_candidates.append({
                                    "url": url,
                                    "method": response.request.method,
                                    "headers": response.request.headers,
                                    "sample": sample
                                })
                    elif isinstance(json_data, dict):
                        # Handle wrapped responses { data: [...] }
                        for key, value in json_data.items():
                             if isinstance(value, list) and len(value) > 0:
                                sample = value[0]
                                if isinstance(sample, dict):
                                    keys = "".join(sample.keys()).lower()
                                    if any(k in keys for k in ['mandi', 'market', 'commodity', 'crop', 'price', 'rate']):
                                        self.api_candidates.append({
                                            "url": url,
                                            "method": response.request.method,
                                            "headers": response.request.headers,
                                            "sample": sample,
                                            "wrapper_key": key
                                        })
                except:
                    pass
        except:
            pass

    #CODE SMELL - The scoring function is very basic 
    def _score_url(self, url: str) -> int:
        score = 5
        lower_url = url.lower()
        if any(k in lower_url for k in ['mandi', 'market', 'price', 'rate', 'report', 'daily']):
            score += 5
        if any(k in lower_url for k in ['about', 'contact', 'tender', 'notice', 'gallery', 'login']):
            score -= 10
        return score

    def _generate_config(self) -> Dict[str, Any]:
        # Prioritize API > HTML > PDF
        
        if self.api_candidates:
            best_api = self.api_candidates[0] # Simplification: take first valid one
            
            # Use LLM to map schema
            prompt = f"""
            Analyze this API response sample and map it to the following unified schema:
            Unified Schema: date, state, district, mandi, crop, variety, min_price, max_price, modal_price, unit.
            
            API Sample: {json.dumps(best_api['sample'])}
            
            Return JSON only: {{ "schemaMapping": {{ "unified_field": "api_field" }} }}
            """
            
            try:
                response = self.llm.generate_content(prompt)
                mapping = json.loads(response.text.strip().replace("```json", "").replace("```", ""))
            except:
                mapping = {}

            return {
                "type": "API",
                "confidence": 0.9,
                "bestUrl": self.entry_url,
                "endpoint": {
                    "url": best_api['url'],
                    "method": best_api['method'],
                    "headers": best_api['headers']
                },
                "schemaMapping": mapping.get("schemaMapping", {}),
                "reasoningSummary": "Found high-confidence API endpoint returning tabular market data.",
                "nextAction": "SAVE_CONFIG"
            }

        elif self.table_candidates:
            best_table = self.table_candidates[0]
            
            # Use LLM to generate selectors and map schema
            prompt = f"""
            Analyze this HTML table structure and map it to the unified schema.
            Headers: {best_table['headers']}
            Sample Row: {best_table['sample_row']}
            
            Unified Schema: date, state, district, mandi, crop, variety, min_price, max_price, modal_price, unit.
            
            Return JSON only: {{
                "htmlMapping": {{
                    "tableSelector": "table (index {best_table['table_index']})",
                    "rowSelector": "tr",
                    "columns": {{ "date": index, "mandi": index, ... }}
                }}
            }}
            """
             
            try:
                response = self.llm.generate_content(prompt)
                mapping = json.loads(response.text.strip().replace("```json", "").replace("```", ""))
            except:
                mapping = {}

            return {
                "type": "HTML_TABLE",
                "confidence": 0.7,
                "bestUrl": best_table['url'],
                "htmlMapping": mapping.get("htmlMapping"),
                "schemaMapping": {}, # Implied by column mapping
                "reasoningSummary": "Found HTML table with relevant headers.",
                "nextAction": "SAVE_CONFIG"
            }

        return {
            "type": "UNDEFINED",
            "confidence": 0.0,
            "bestUrl": self.entry_url,
            "reasoningSummary": "No suitable API or Table found.",
            "nextAction": "MANUAL_REQUIRED"
        }
