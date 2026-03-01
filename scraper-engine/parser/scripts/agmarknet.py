#!/usr/bin/env python3
"""
Agmarknet Parser - Fetches daily agricultural commodity prices from agmarknet.gov.in
Uses data.gov.in API for reliable data access.
"""

import argparse
import json
import logging
import os
import sys
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any

import requests

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("agmarknet_parser")

# Constants
BASE_DIR = Path(__file__).parent.parent
DATA_DIR = BASE_DIR / "data" / "agmarknet"
API_BASE_URL = "https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070"

# Default API key for public access (can be overridden)
DEFAULT_API_KEY = "579b464db66ec23bdd000001cdd3946e44ce4aad7209ff7b23ac571b"


def parse_date(date_str: str) -> datetime:
    """Parse date string in YYYY-MM-DD format."""
    try:
        return datetime.strptime(date_str, "%Y-%m-%d")
    except ValueError:
        raise ValueError(f"Invalid date format: {date_str}. Expected YYYY-MM-DD")


def fetch_agmarknet_data(date: datetime, api_key: str = DEFAULT_API_KEY) -> list[dict[str, Any]]:
    """
    Fetch daily price data from agmarknet via data.gov.in API.
    
    Args:
        date: The date to fetch data for
        api_key: API key for data.gov.in
        
    Returns:
        List of price records
    """
    formatted_date = date.strftime("%d-%m-%Y")
    logger.info(f"Fetching agmarknet data for date: {formatted_date}")
    
    params = {
        "api-key": api_key,
        "format": "json",
        "filters[date]": formatted_date,
        "limit": 10000,  # Maximum limit to get all records
    }
    
    try:
        response = requests.get(API_BASE_URL, params=params, timeout=60)
        response.raise_for_status()
        data = response.json()
        
        records = data.get("records", [])
        logger.info(f"Fetched {len(records)} records from agmarknet API")
        return records
        
    except requests.exceptions.RequestException as e:
        logger.error(f"Failed to fetch data from agmarknet API: {e}")
        raise


def transform_record(record: dict[str, Any], date_str: str) -> dict[str, Any] | None:
    """
    Transform an agmarknet record to the unified schema.
    
    Args:
        record: Raw record from API
        date_str: Date string in YYYY-MM-DD format
        
    Returns:
        Transformed record or None if invalid
    """
    try:
        # Extract fields from agmarknet record
        # Field names from data.gov.in API
        crop_name = record.get("commodity", "").strip()
        mandi_name = record.get("market", "").strip()
        state_name = record.get("state", "").strip()
        district = record.get("district", "").strip()
        variety = record.get("variety", "").strip()
        
        # Parse prices
        min_price = record.get("min_price", "0")
        max_price = record.get("max_price", "0")
        modal_price = record.get("modal_price", "0")
        
        # Clean and convert prices
        min_price_val = float(min_price) if min_price and min_price != "NR" else 0.0
        max_price_val = float(max_price) if max_price and max_price != "NR" else 0.0
        modal_price_val = float(modal_price) if modal_price and modal_price != "NR" else None
        
        # Get arrival quantity if available
        arrival = record.get("arrival_quantity", "0")
        arrival_val = float(arrival) if arrival else None
        
        # Construct full crop name with variety if available
        full_crop_name = crop_name
        if variety and variety.lower() != "other":
            full_crop_name = f"{crop_name} ({variety})"
        
        # Construct full mandi name with district
        full_mandi_name = mandi_name
        if district and district != mandi_name:
            full_mandi_name = f"{mandi_name}, {district}"
        
        transformed = {
            "cropName": full_crop_name,
            "mandiName": full_mandi_name,
            "stateName": state_name,
            "date": date_str,
            "minPrice": min_price_val,
            "maxPrice": max_price_val,
            "modalPrice": modal_price_val,
            "unit": "quintal",
            "arrival": arrival_val,
            "source": "agmarknet",
            "raw": record  # Keep raw data for reference
        }
        
        return transformed
        
    except (ValueError, TypeError) as e:
        logger.warning(f"Failed to transform record: {record}. Error: {e}")
        return None


def save_data(records: list[dict[str, Any]], date_str: str) -> Path:
    """
    Save parsed data to JSON file.
    
    Args:
        records: List of transformed records
        date_str: Date string in YYYY-MM-DD format
        
    Returns:
        Path to saved file
    """
    # Ensure data directory exists
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    
    output_file = DATA_DIR / f"{date_str}.json"
    
    output_data = {
        "source": "agmarknet",
        "date": date_str,
        "count": len(records),
        "records": records
    }
    
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(output_data, f, indent=2, ensure_ascii=False)
    
    logger.info(f"Saved {len(records)} records to {output_file}")
    return output_file


def main():
    parser = argparse.ArgumentParser(
        description="Parse agmarknet daily commodity prices"
    )
    parser.add_argument(
        "--date",
        type=str,
        help="Date in YYYY-MM-DD format (default: today)",
        default=datetime.now().strftime("%Y-%m-%d")
    )
    parser.add_argument(
        "--api-key",
        type=str,
        help="Data.gov.in API key",
        default=DEFAULT_API_KEY
    )
    
    args = parser.parse_args()
    
    # Parse and validate date
    try:
        target_date = parse_date(args.date)
    except ValueError as e:
        logger.error(e)
        sys.exit(1)
    
    date_str = target_date.strftime("%Y-%m-%d")
    logger.info(f"Processing agmarknet data for {date_str}")
    
    try:
        # Fetch data from API
        raw_records = fetch_agmarknet_data(target_date, args.api_key)
        
        if not raw_records:
            logger.warning(f"No data found for date: {date_str}")
            # Create empty output file
            save_data([], date_str)
            sys.exit(0)
        
        # Transform records
        transformed_records = []
        for record in raw_records:
            transformed = transform_record(record, date_str)
            if transformed:
                transformed_records.append(transformed)
        
        # Save data
        output_path = save_data(transformed_records, date_str)
        logger.info(f"Successfully parsed {len(transformed_records)} records")
        print(f"Output saved to: {output_path}")
        
    except Exception as e:
        logger.error(f"Failed to process agmarknet data: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
