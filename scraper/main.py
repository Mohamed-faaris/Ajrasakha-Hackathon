import argparse
import asyncio
import json
import logging
import os
import signal
from datetime import datetime
from scraper.agent import MandiScrapeAI
from scraper.config import get_db_collection
from scraper.models import MandiSource

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def main():
    parser = argparse.ArgumentParser(description="MandiScrape-AI Discovery Agent")
    parser.add_argument("--url", type=str, required=True, help="Target Mandi Portal URL")
    parser.add_argument("--name", type=str, default="Unknown Mandi", help="Name of the Mandi")
    parser.add_argument("--state", type=str, default="Unknown", help="State of the Mandi")
    
    args = parser.parse_args()
    
    logger.info(f"Starting discovery for {args.name} ({args.state}) at {args.url}")
    
    agent = MandiScrapeAI(args.url)
    
    def handle_interrupt(sig, frame):
        logger.warning("Interrupted by user. Shutting down...")
        # Add graceful shutdown logic if needed (e.g. close browser context)
        # For now, just exit
        exit(0)
        
    signal.signal(signal.SIGINT, handle_interrupt)
    
    try:
        result = await agent.run()
        
        # Pretty print result
        print(json.dumps(result, indent=2))
        
        if result.get("nextAction") == "SAVE_CONFIG":
            # Save to MongoDB
            collection = get_db_collection()
            
            # Prepare the document
            discovery_status = "AI_FOUND"
            discovery_method = result.get("type", "UNKNOWN")
            
            source_doc = {
                "name": args.name,
                "state": args.state,
                "baseUrl": args.url,
                "entryUrl": args.url,
                "type": result.get("type"),
                "discovery": {
                    "status": discovery_status,
                    "method": discovery_method,
                    "confidence": result.get("confidence", 0.0),
                    "lastDiscoveryAt": datetime.utcnow()
                },
                "endpoint": result.get("endpoint"),
                "htmlMapping": result.get("htmlMapping"),
                "schemaMapping": result.get("schemaMapping", {})
            }
            
            # Upsert
            collection.replace_one(
                {"entryUrl": args.url},
                source_doc,
                upsert=True
            )
            logger.info(f"Configuration saved to MongoDB for {args.name}")
            
    except Exception as e:
        logger.error(f"Discovery failed: {e}")

if __name__ == "__main__":
    asyncio.run(main())
