"""
Prompt templates for AI modes.

Contains prompt templates for:
  1. Discovery Mode: rank pages and select extraction method
  2. Mapping Mode: generate schema mapping from raw data
"""

from __future__ import annotations

from langchain_core.prompts import ChatPromptTemplate

# ── Discovery Mode Prompts ───────────────────────────────────────────────────

DISCOVERY_SYSTEM_PROMPT = """\
You are an expert web scraping analyst specializing in Indian agricultural \
market (mandi) data portals. Your job is to analyze crawled website data and \
determine the best way to extract commodity price information.

You will receive discovery results from a web crawler including:
- Pages visited with their titles and link counts
- API endpoints captured from network traffic (XHR/fetch calls)
- HTML tables found with their column headers and sample data
- Downloadable files (PDF, Excel) detected

Your task is to select the BEST extraction strategy with this priority order:
1. API endpoint (most reliable, fastest for daily scraping)
2. HTML table (if no API available)
3. PDF/Excel file (last resort)

Be precise and return structured JSON output."""

DISCOVERY_USER_PROMPT = """\
Analyze the following discovery results and recommend the best extraction \
strategy for getting daily mandi/commodity price data.

## Discovery Results
{discovery_context}

## Instructions
1. Evaluate all candidates (APIs, tables, files)
2. Select the best extraction type based on data quality and reliability
3. Provide specific configuration for the chosen method
4. Rate your confidence (0.0 to 1.0)

Return your analysis as JSON."""

DISCOVERY_PROMPT = ChatPromptTemplate.from_messages([
    ("system", DISCOVERY_SYSTEM_PROMPT),
    ("human", DISCOVERY_USER_PROMPT),
])

# ── Mapping Mode Prompts ────────────────────────────────────────────────────

MAPPING_SYSTEM_PROMPT = """\
You are a data mapping specialist. Your job is to map raw field names from \
Indian agricultural market (mandi) data sources to a unified schema.

The unified schema has these fields:
- cropName: Name of the crop/commodity (e.g., "Wheat", "Rice", "Onion")
- mandiName: Name of the APMC market (e.g., "Azadpur", "Vashi")
- stateName: Indian state name (e.g., "Maharashtra", "Delhi")
- date: Date of the price record
- minPrice: Minimum price in INR
- maxPrice: Maximum price in INR
- modalPrice: Modal (most common) price in INR
- unit: Price unit (should normalize to "quintal")
- arrival: Quantity arrived at the market
- source: Data source identifier
- cropId: Unique crop identifier (can be derived)
- mandiId: Unique mandi identifier (can be derived)
- stateId: Unique state identifier (can be derived)

You must also identify any unit conversions needed (e.g., kg to quintal = multiply by 100) \
and date format patterns.

Return structured JSON output."""

MAPPING_USER_PROMPT = """\
Map the following raw data fields to the unified mandi price schema.

## Raw Field Names
{raw_fields}

## Sample Data (first 3 records)
{sample_data}

## Source Info
Source URL: {source_url}
Extraction type: {extraction_type}

## Instructions
1. Map each raw field to the corresponding unified schema field
2. Identify any fields that need conversion (unit, date format, etc.)
3. Note any raw fields that have no mapping (they will be dropped)
4. Set confidence score (0.0 to 1.0)

Return your mapping as JSON."""

MAPPING_PROMPT = ChatPromptTemplate.from_messages([
    ("system", MAPPING_SYSTEM_PROMPT),
    ("human", MAPPING_USER_PROMPT),
])
