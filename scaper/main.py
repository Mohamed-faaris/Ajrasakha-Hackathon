import argparse
import asyncio
import json
import logging
import os
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
    try:
        result = await agent.run()
        
        print(json.dumps(result, indent=2))
        
        if result.get("nextAction") == "SAVE_CONFIG":
            # Save to MongoDB
            collection = get_db_collection()
            source_doc = MandiSource(
                name=args.name,
                state=args.state,
                baseUrl=args.url, # Ideally normalize this
                entryUrl=args.url,
                type=result.get("type"),
                discovery={
                    "status": "AI_FOUND",
                    "method": "API" if result.get("type") == "API" else "HTML",
                    "confidence": result.get("confidence", 0.0)
                },
                endpoint=result.get("endpoint"),
                htmlMapping=result.get("htmlMapping"),
                schemaMapping=result.get("schemaMapping", {})
            )
            
            # Upsert
            collection.replace_one(
                {"entryUrl": args.url},
                source_doc.model_dump(),
                upsert=True
            )
            logger.info(f"Configuration saved to MongoDB for {args.name}")
            
    except Exception as e:
        logger.error(f"Discovery failed: {e}")

if __name__ == "__main__":
    asyncio.run(main())
