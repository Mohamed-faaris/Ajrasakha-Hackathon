"""
Loader module for Mandi AI Scraper.

This module loads parsed data from the parser module and prepares it for the mapper.
"""

# Lazy imports to avoid loading heavy dependencies on CLI startup
def __getattr__(name):
    if name == "DataLoader":
        from loader.data_loader import DataLoader
        return DataLoader
    elif name == "RawPriceRecord":
        from loader.schema import RawPriceRecord
        return RawPriceRecord
    elif name == "ValidatedRecord":
        from loader.schema import ValidatedRecord
        return ValidatedRecord
    elif name == "DataLoadResult":
        from loader.schema import DataLoadResult
        return DataLoadResult
    elif name in ("normalize_date", "normalize_price", "clean_string", "detect_duplicates", "normalize_unit"):
        from loader import processor
        return getattr(processor, name)
    raise AttributeError(f"module '{__name__}' has no attribute '{name}'")

__all__ = [
    "DataLoader",
    "RawPriceRecord",
    "ValidatedRecord",
    "DataLoadResult",
    "normalize_date",
    "normalize_price",
    "clean_string",
    "detect_duplicates",
    "normalize_unit",
]
