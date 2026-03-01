"""
Command-line interface for the loader module.

Usage:
    python -m loader --source agmarknet --date 2024-01-15
    python -m loader --all --date 2024-01-15
    python -m loader --list-sources
    python -m loader --source agmarknet --list-dates
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Optional

from loader.data_loader import DataLoader, DEFAULT_DATA_PATH
from loader.schema import DataLoadResult


def create_parser() -> argparse.ArgumentParser:
    """Create the argument parser."""
    parser = argparse.ArgumentParser(
        prog="loader",
        description="Load and validate parsed data from the Mandi AI Scraper",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python -m loader --source agmarknet --date 2024-01-15
  python -m loader --all --date 2024-01-15 --output data.json
  python -m loader --list-sources
  python -m loader --source agmarknet --list-dates
        """
    )
    
    parser.add_argument(
        "--source",
        type=str,
        help="Source name to load data from (e.g., agmarknet)"
    )
    
    parser.add_argument(
        "--date",
        type=str,
        help="Date to load data for (YYYY-MM-DD format)"
    )
    
    parser.add_argument(
        "--all",
        action="store_true",
        help="Load data from all available sources"
    )
    
    parser.add_argument(
        "--output",
        type=str,
        help="Output file path for JSON export (optional)"
    )
    
    parser.add_argument(
        "--list-sources",
        action="store_true",
        help="List all available sources"
    )
    
    parser.add_argument(
        "--list-dates",
        action="store_true",
        help="List all available dates for a source (requires --source)"
    )
    
    parser.add_argument(
        "--data-path",
        type=str,
        default=str(DEFAULT_DATA_PATH),
        help=f"Path to parser data directory (default: {DEFAULT_DATA_PATH})"
    )
    
    parser.add_argument(
        "--pretty",
        action="store_true",
        help="Pretty print JSON output"
    )
    
    parser.add_argument(
        "--stats-only",
        action="store_true",
        help="Only output statistics, not the full data"
    )
    
    return parser


def print_result(result: DataLoadResult, pretty: bool = False) -> None:
    """Print result to stdout."""
    data = result.to_dict()
    
    indent = 2 if pretty else None
    json_output = json.dumps(data, indent=indent, default=str)
    print(json_output)


def print_sources(loader: DataLoader) -> None:
    """Print available sources."""
    sources = loader.get_available_sources()
    output = {
        "sources": sources,
        "count": len(sources),
        "data_path": str(loader.data_path)
    }
    print(json.dumps(output, indent=2))


def print_dates(loader: DataLoader, source: str) -> None:
    """Print available dates for a source."""
    dates = loader.get_available_dates(source)
    output = {
        "source": source,
        "dates": dates,
        "count": len(dates)
    }
    print(json.dumps(output, indent=2))


def main(args: Optional[list[str]] = None) -> int:
    """
    Main entry point for the CLI.
    
    Args:
        args: Command line arguments
        
    Returns:
        Exit code (0 for success, 1 for error)
    """
    parser = create_parser()
    parsed_args = parser.parse_args(args)
    
    # Initialize loader
    try:
        loader = DataLoader(data_path=parsed_args.data_path)
    except Exception as e:
        print(f"Error initializing loader: {e}", file=sys.stderr)
        return 1
    
    # Handle list-sources
    if parsed_args.list_sources:
        print_sources(loader)
        return 0
    
    # Handle list-dates
    if parsed_args.list_dates:
        if not parsed_args.source:
            print("Error: --list-dates requires --source", file=sys.stderr)
            return 1
        print_dates(loader, parsed_args.source)
        return 0
    
    # Validate required arguments for loading
    if not parsed_args.date:
        print("Error: --date is required", file=sys.stderr)
        return 1
    
    # Load data
    try:
        if parsed_args.all:
            # Load from all sources
            results = loader.load_all(parsed_args.date)
            
            # Aggregate into single result
            aggregated = DataLoadResult(date=parsed_args.date)
            for source_result in results.values():
                aggregated.data.extend(source_result.data)
                aggregated.stats.total_records += source_result.stats.total_records
                aggregated.stats.valid_records += source_result.stats.valid_records
                aggregated.stats.invalid_records += source_result.stats.invalid_records
                aggregated.stats.duplicate_records += source_result.stats.duplicate_records
                aggregated.stats.filtered_records += source_result.stats.filtered_records
                aggregated.stats.sources_processed.extend(source_result.stats.sources_processed)
                aggregated.errors.extend(source_result.errors)
            
            result = aggregated
        elif parsed_args.source:
            # Load from single source
            result = loader.load_source(parsed_args.source, parsed_args.date)
        else:
            print("Error: Either --source or --all must be specified", file=sys.stderr)
            return 1
        
        # Handle stats-only output
        if parsed_args.stats_only:
            stats_output = {
                "stats": result.stats.to_dict(),
                "errors": result.errors,
                "source": result.source,
                "date": result.date,
            }
            print(json.dumps(stats_output, indent=2 if parsed_args.pretty else None))
            return 0
        
        # Output to file or stdout
        if parsed_args.output:
            output_data = result.to_dict()
            with open(parsed_args.output, 'w', encoding='utf-8') as f:
                json.dump(output_data, f, indent=2 if parsed_args.pretty else None, default=str)
            print(f"Output written to {parsed_args.output}")
            print(f"Stats: {result.stats.valid_records} valid / {result.stats.total_records} total records")
        else:
            print_result(result, pretty=parsed_args.pretty)
        
        return 0
        
    except Exception as e:
        print(f"Error loading data: {e}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
