#!/usr/bin/env python3
"""
Krishimaratavahini Parser - Fetches daily agricultural commodity prices 
from Karnataka government's krishimaratavahini portal (krama.karnataka.gov.in)
"""

import argparse
import json
import logging
import re
import sys
from datetime import datetime
from pathlib import Path
from typing import Any
from urllib.parse import urlencode, parse_qs, urlparse

import requests
from bs4 import BeautifulSoup

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("krishimaratavahini_parser")

# Constants
BASE_DIR = Path(__file__).parent.parent
DATA_DIR = BASE_DIR / "data" / "krishimaratavahini"
BASE_URL = "https://krama.karnataka.gov.in"
HOME_URL = f"{BASE_URL}/"
PRICE_REPORT_URL = f"{BASE_URL}/MainPage/DailyMrktPriceRep2.aspx"


def parse_date(date_str: str) -> datetime:
    """Parse date string in YYYY-MM-DD format."""
    try:
        return datetime.strptime(date_str, "%Y-%m-%d")
    except ValueError:
        raise ValueError(f"Invalid date format: {date_str}. Expected YYYY-MM-DD")


def extract_commodity_links(html: str, target_date: datetime) -> list[dict[str, str]]:
    """
    Extract commodity links and their metadata from the homepage price table.
    
    Args:
        html: HTML content of the homepage
        target_date: Target date for the query
        
    Returns:
        List of commodity info dicts with name, code, variety code, etc.
    """
    soup = BeautifulSoup(html, "html.parser")
    commodities = []
    
    # Find all links that open price reports
    # Pattern: onclick="window.open('MainPage/DailyMrktPriceRep2.aspx?Rep=Com&...')"
    links = soup.find_all("a", onclick=re.compile(r"DailyMrktPriceRep2"))
    
    for link in links:
        onclick_attr = link.get("onclick", "")
        
        # Extract URL from onclick
        match = re.search(r"window\.open\('([^']+)'", onclick_attr)
        if match:
            url_path = match.group(1)
            full_url = f"{BASE_URL}/{url_path}"
            
            # Parse query parameters
            parsed = urlparse(full_url)
            params = parse_qs(parsed.query)
            
            commodity_name = link.get_text(strip=True)
            
            # Skip variety-level links (we want commodity-level only)
            if params.get("Rep", [""])[0] == "Com":
                commodity_info = {
                    "name": commodity_name,
                    "comm_code": params.get("CommCode", [""])[0],
                    "var_code": params.get("VarCode", [""])[0],
                    "url": full_url,
                }
                commodities.append(commodity_info)
    
    return commodities


def fetch_commodity_prices(commodity_info: dict[str, str], target_date: datetime) -> list[dict[str, Any]]:
    """
    Fetch price data for a specific commodity.
    
    Args:
        commodity_info: Dict with commodity name, code, etc.
        target_date: Date to fetch prices for
        
    Returns:
        List of price records for the commodity
    """
    date_str = target_date.strftime("%d/%m/%Y")
    
    # Build URL with date parameter
    params = {
        "Rep": "Com",
        "CommCode": commodity_info["comm_code"],
        "VarCode": commodity_info["var_code"],
        "Date": date_str,
        "CommName": commodity_info["name"].split("/")[0].strip(),
    }
    
    url = f"{PRICE_REPORT_URL}?{urlencode(params)}"
    logger.debug(f"Fetching: {url}")
    
    try:
        response = requests.get(url, timeout=30)
        response.raise_for_status()
        return parse_price_table(response.text, commodity_info["name"])
    except requests.exceptions.RequestException as e:
        logger.error(f"Failed to fetch {commodity_info['name']}: {e}")
        return []


def parse_price_table(html: str, commodity_name: str) -> list[dict[str, Any]]:
    """
    Parse the price table from the HTML response.
    
    Args:
        html: HTML content
        commodity_name: Name of the commodity
        
    Returns:
        List of price records
    """
    soup = BeautifulSoup(html, "html.parser")
    records = []
    
    # Find the price table
    # The table has id like _ctl0_MainContent_Table1
    table = soup.find("table", {"id": re.compile(r"Table1")})
    
    if not table:
        logger.warning(f"No price table found for {commodity_name}")
        return records
    
    # Get all rows (skip header row)
    rows = table.find_all("tr")[1:]
    
    for row in rows:
        cells = row.find_all("td")
        if len(cells) >= 7:
            try:
                mandi = cells[0].get_text(strip=True)
                date_text = cells[1].get_text(strip=True)
                variety = cells[2].get_text(strip=True)
                arrival = cells[3].get_text(strip=True).replace(",", "")
                min_price = cells[4].get_text(strip=True).replace(",", "")
                max_price = cells[5].get_text(strip=True).replace(",", "")
                modal_price = cells[6].get_text(strip=True).replace(",", "")
                
                # Parse date
                try:
                    record_date = datetime.strptime(date_text, "%d/%m/%Y")
                    date_iso = record_date.strftime("%Y-%m-%d")
                except ValueError:
                    date_iso = None
                
                # Clean and convert numeric values
                def parse_number(val: str) -> float | None:
                    try:
                        return float(val) if val else None
                    except ValueError:
                        return None
                
                record = {
                    "cropName": f"{commodity_name} ({variety})" if variety else commodity_name,
                    "mandiName": mandi,
                    "stateName": "Karnataka",
                    "date": date_iso,
                    "minPrice": parse_number(min_price),
                    "maxPrice": parse_number(max_price),
                    "modalPrice": parse_number(modal_price),
                    "unit": "quintal",
                    "arrival": parse_number(arrival),
                    "source": "krishimaratavahini",
                    "variety": variety,
                    "commodity": commodity_name,
                }
                
                records.append(record)
                
            except Exception as e:
                logger.warning(f"Failed to parse row: {e}")
                continue
    
    return records


def fetch_all_prices(target_date: datetime) -> list[dict[str, Any]]:
    """
    Fetch all commodity prices for the given date.
    
    Args:
        target_date: Date to fetch prices for
        
    Returns:
        List of all price records
    """
    logger.info(f"Fetching krishimaratavahini prices for {target_date.strftime('%Y-%m-%d')}")
    
    # First, fetch the homepage to get commodity list
    try:
        response = requests.get(HOME_URL, timeout=30)
        response.raise_for_status()
    except requests.exceptions.RequestException as e:
        logger.error(f"Failed to fetch homepage: {e}")
        raise
    
    # Extract commodity links
    commodities = extract_commodity_links(response.text, target_date)
    logger.info(f"Found {len(commodities)} commodities")
    
    if not commodities:
        logger.warning("No commodities found on homepage")
        return []
    
    # Fetch prices for each commodity
    all_records = []
    for i, commodity in enumerate(commodities, 1):
        logger.info(f"[{i}/{len(commodities)}] Fetching prices for {commodity['name']}")
        records = fetch_commodity_prices(commodity, target_date)
        all_records.extend(records)
        logger.info(f"  -> Got {len(records)} records")
    
    return all_records


def save_data(records: list[dict[str, Any]], date_str: str) -> Path:
    """
    Save parsed data to JSON file.
    
    Args:
        records: List of price records
        date_str: Date string in YYYY-MM-DD format
        
    Returns:
        Path to saved file
    """
    # Ensure data directory exists
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    
    output_file = DATA_DIR / f"{date_str}.json"
    
    output_data = {
        "source": "krishimaratavahini",
        "date": date_str,
        "count": len(records),
        "state": "Karnataka",
        "records": records
    }
    
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(output_data, f, indent=2, ensure_ascii=False)
    
    logger.info(f"Saved {len(records)} records to {output_file}")
    return output_file


def main():
    parser = argparse.ArgumentParser(
        description="Parse krishimaratavahini daily commodity prices"
    )
    parser.add_argument(
        "--date",
        type=str,
        help="Date in YYYY-MM-DD format (default: today)",
        default=datetime.now().strftime("%Y-%m-%d")
    )
    
    args = parser.parse_args()
    
    # Parse and validate date
    try:
        target_date = parse_date(args.date)
    except ValueError as e:
        logger.error(e)
        sys.exit(1)
    
    date_str = target_date.strftime("%Y-%m-%d")
    logger.info(f"Processing krishimaratavahini data for {date_str}")
    
    try:
        # Fetch all prices
        records = fetch_all_prices(target_date)
        
        if not records:
            logger.warning(f"No data found for date: {date_str}")
        
        # Save data
        output_path = save_data(records, date_str)
        logger.info(f"Successfully parsed {len(records)} records")
        print(f"Output saved to: {output_path}")
        
    except Exception as e:
        logger.error(f"Failed to process krishimaratavahini data: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
