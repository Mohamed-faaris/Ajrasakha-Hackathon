"""
File scraper.

Extracts data from downloaded PDF and Excel files.
"""

from __future__ import annotations

import io
import logging
from typing import Any

import httpx
import pandas as pd

from app.core.context import RunContext

logger = logging.getLogger("mandi-agent")

_DEFAULT_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/131.0.0.0 Safari/537.36"
    ),
}


async def scrape_file(
    ctx: RunContext,
    file_url: str,
    *,
    file_type: str = "",
) -> list[dict[str, Any]]:
    """
    Download and extract data from a PDF or Excel file.

    Args:
        ctx: Run context.
        file_url: URL of the file to download.
        file_type: File type hint ('pdf', 'excel'). Auto-detected from URL if empty.

    Returns:
        List of row dicts.
    """
    # Auto-detect file type from URL
    if not file_type:
        url_lower = file_url.lower()
        if url_lower.endswith(".pdf"):
            file_type = "pdf"
        elif url_lower.endswith((".xlsx", ".xls")):
            file_type = "excel"
        elif url_lower.endswith(".csv"):
            file_type = "csv"
        else:
            ctx.add_error(file_url, "Cannot determine file type")
            return []

    # Download the file
    try:
        async with httpx.AsyncClient(
            timeout=httpx.Timeout(60.0),
            follow_redirects=True,
        ) as client:
            response = await client.get(file_url, headers=_DEFAULT_HEADERS)
            response.raise_for_status()
            content = response.content

    except httpx.HTTPError as exc:
        ctx.add_error(file_url, f"Download error: {exc}")
        return []

    # Extract data based on file type
    if file_type == "pdf":
        return _extract_pdf(content, file_url, ctx)
    elif file_type == "excel":
        return _extract_excel(content, file_url, ctx)
    elif file_type == "csv":
        return _extract_csv(content, file_url, ctx)
    else:
        ctx.add_error(file_url, f"Unsupported file type: {file_type}")
        return []


def _extract_pdf(content: bytes, file_url: str, ctx: RunContext) -> list[dict[str, Any]]:
    """Extract tables from a PDF file using pdfplumber."""
    try:
        import pdfplumber
    except ImportError:
        ctx.add_error(file_url, "pdfplumber not installed")
        return []

    all_records: list[dict[str, Any]] = []

    try:
        with pdfplumber.open(io.BytesIO(content)) as pdf:
            for page_num, page in enumerate(pdf.pages, 1):
                tables = page.extract_tables()
                for table in tables:
                    if not table or len(table) < 2:
                        continue

                    # First row as headers
                    headers = [
                        str(h).strip() if h else f"col_{i}"
                        for i, h in enumerate(table[0])
                    ]

                    for row in table[1:]:
                        if not row or all(cell is None for cell in row):
                            continue
                        record = {}
                        for i, cell in enumerate(row):
                            if i < len(headers):
                                record[headers[i]] = str(cell).strip() if cell else ""
                        if any(record.values()):
                            all_records.append(record)

        logger.info("Extracted %d rows from PDF %s", len(all_records), file_url)

    except Exception as exc:
        ctx.add_error(file_url, f"PDF extraction error: {exc}")

    return all_records


def _extract_excel(content: bytes, file_url: str, ctx: RunContext) -> list[dict[str, Any]]:
    """Extract data from an Excel file using pandas + openpyxl."""
    try:
        df = pd.read_excel(
            io.BytesIO(content),
            engine="openpyxl",
        )
        df = df.dropna(how="all")
        for col in df.select_dtypes(include=["object"]).columns:
            df[col] = df[col].astype(str).str.strip()

        records = df.to_dict(orient="records")
        logger.info("Extracted %d rows from Excel %s", len(records), file_url)
        return records

    except Exception as exc:
        ctx.add_error(file_url, f"Excel extraction error: {exc}")
        return []


def _extract_csv(content: bytes, file_url: str, ctx: RunContext) -> list[dict[str, Any]]:
    """Extract data from a CSV file using pandas."""
    try:
        # Try common encodings
        for encoding in ("utf-8", "latin-1", "cp1252"):
            try:
                df = pd.read_csv(io.BytesIO(content), encoding=encoding)
                break
            except UnicodeDecodeError:
                continue
        else:
            ctx.add_error(file_url, "Cannot decode CSV with known encodings")
            return []

        df = df.dropna(how="all")
        records = df.to_dict(orient="records")
        logger.info("Extracted %d rows from CSV %s", len(records), file_url)
        return records

    except Exception as exc:
        ctx.add_error(file_url, f"CSV extraction error: {exc}")
        return []
