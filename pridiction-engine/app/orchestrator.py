import subprocess
import os
import sys
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from app.database import get_logs_collection, get_prices_collection, get_predictions_collection
from app.models import PricePredictor

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SCRAPER_DIR = os.path.join(PROJECT_ROOT, "scraper-engine", "endpoint-discovery")
LOADER_DIR = os.path.join(PROJECT_ROOT, "scraper-engine", "loader")
PARSER_DIR = os.path.join(PROJECT_ROOT, "scraper-engine", "parser")


class Orchestrator:
    def __init__(self):
        self.logs_collection = get_logs_collection()
        self.prices_collection = get_prices_collection()
        self.predictions_collection = get_predictions_collection()

    def save_log(self, level: str, component: str, message: str, metadata: Optional[Dict] = None):
        doc = {
            "level": level,
            "component": component,
            "message": message,
            "metadata": metadata or {},
            "timestamp": datetime.now()
        }
        self.logs_collection.insert_one(doc)

    def trigger_scraper(self, date: str = None) -> Dict[str, Any]:
        self.save_log("INFO", "scraper", f"Starting scraper (mode: scrape)")

        try:
            cmd = [sys.executable, "main.py", "--mode", "scrape"]
            result = subprocess.run(
                cmd,
                cwd=SCRAPER_DIR,
                capture_output=True,
                text=True,
                timeout=3600
            )

            success = result.returncode == 0
            if success:
                self.save_log("INFO", "scraper", f"Scraper completed successfully", {"output": result.stdout[-1000:]})
            else:
                self.save_log("ERROR", "scraper", f"Scraper failed", {"error": result.stderr[-500:]})

            return {
                "success": success,
                "stdout": result.stdout,
                "stderr": result.stderr,
                "returncode": result.returncode
            }
        except subprocess.TimeoutExpired:
            self.save_log("ERROR", "scraper", "Scraper timed out after 1 hour")
            return {"success": False, "error": "timeout"}
        except Exception as e:
            self.save_log("ERROR", "scraper", f"Scraper exception: {str(e)}")
            return {"success": False, "error": str(e)}

    def run_parsers(self, date: str = None) -> Dict[str, Any]:
        if date is None:
            date = datetime.now().strftime("%Y-%m-%d")

        sources = ["agmarknet", "msamb", "krishimaratavahini"]
        results = {}

        for source in sources:
            self.save_log("INFO", "parser", f"Running parser for {source}")
            try:
                cmd = ["bun", "run", f"scripts/{source}/index.ts"]
                result = subprocess.run(
                    cmd,
                    cwd=PARSER_DIR,
                    capture_output=True,
                    text=True,
                    timeout=1800
                )
                success = result.returncode == 0
                results[source] = {
                    "success": success,
                    "stdout": result.stdout[-500:] if result.stdout else "",
                    "stderr": result.stderr[-500:] if result.stderr else ""
                }
                if success:
                    self.save_log("INFO", "parser", f"Parser {source} completed")
                else:
                    self.save_log("ERROR", "parser", f"Parser {source} failed", {"error": result.stderr[-300:]})
            except subprocess.TimeoutExpired:
                self.save_log("ERROR", "parser", f"Parser {source} timed out")
                results[source] = {"success": False, "error": "timeout"}
            except FileNotFoundError:
                self.save_log("ERROR", "parser", f"Bun not found")
                results[source] = {"success": False, "error": "bun not found"}
            except Exception as e:
                self.save_log("ERROR", "parser", f"Parser {source} exception: {str(e)}")
                results[source] = {"success": False, "error": str(e)}

        all_success = all(r.get("success", False) for r in results.values())
        return {"success": all_success, "date": date, "results": results}

    def run_loader(self, date: str = None) -> Dict[str, Any]:
        if date is None:
            date = datetime.now().strftime("%Y-%m-%d")

        self.save_log("INFO", "loader", f"Starting loader for date: {date}")

        try:
            cmd = ["bun", "run", "src/index.ts", "-d", date, "-s", "all"]
            result = subprocess.run(
                cmd,
                cwd=LOADER_DIR,
                capture_output=True,
                text=True,
                timeout=1800
            )

            success = result.returncode == 0
            if success:
                self.save_log("INFO", "loader", f"Loader completed successfully", {"output": result.stdout[-1000:]})
            else:
                self.save_log("ERROR", "loader", f"Loader failed", {"error": result.stderr[-500:]})

            return {
                "success": success,
                "stdout": result.stdout,
                "stderr": result.stderr,
                "returncode": result.returncode
            }
        except subprocess.TimeoutExpired:
            self.save_log("ERROR", "loader", "Loader timed out after 30 minutes")
            return {"success": False, "error": "timeout"}
        except FileNotFoundError:
            self.save_log("ERROR", "loader", "Bun not found - is it installed?")
            return {"success": False, "error": "bun not found"}
        except Exception as e:
            self.save_log("ERROR", "loader", f"Loader exception: {str(e)}")
            return {"success": False, "error": str(e)}

    def scrape_and_load(self, date: str = None) -> Dict[str, Any]:
        if date is None:
            date = datetime.now().strftime("%Y-%m-%d")

        self.save_log("INFO", "orchestrator", f"Starting scrape and load pipeline for {date}")

        scraper_result = self.trigger_scraper(date)
        if not scraper_result.get("success"):
            return {
                "success": False,
                "stage": "scraper",
                "result": scraper_result
            }

        loader_result = self.run_loader(date)
        if not loader_result.get("success"):
            return {
                "success": False,
                "stage": "loader",
                "result": loader_result
            }

        self.save_log("INFO", "orchestrator", f"Scrape and load pipeline completed for {date}")
        return {"success": True, "date": date}

    def parse_and_load(self, date: str = None) -> Dict[str, Any]:
        if date is None:
            date = datetime.now().strftime("%Y-%m-%d")

        self.save_log("INFO", "orchestrator", f"Starting parse and load pipeline for {date}")

        parser_result = self.run_parsers(date)
        if not parser_result.get("success"):
            self.save_log("WARNING", "orchestrator", "Some parsers failed, continuing with loader")

        loader_result = self.run_loader(date)
        if not loader_result.get("success"):
            return {
                "success": False,
                "stage": "loader",
                "result": loader_result
            }

        self.save_log("INFO", "orchestrator", f"Parse and load pipeline completed for {date}")
        return {"success": True, "date": date, "parser_results": parser_result.get("results", {})}

    def get_unique_crop_mandi_pairs(self) -> List[tuple]:
        pipeline = [
            {"$sort": {"date": -1}},
            {"$group": {
                "_id": {"cropId": "$cropId", "mandiId": "$mandiId"},
                "cropName": {"$first": "$cropName"},
                "mandiName": {"$first": "$mandiName"}
            }},
            {"$limit": 100}
        ]
        
        results = list(self.prices_collection.aggregate(pipeline))
        return [
            (r["_id"]["cropId"], r["_id"]["mandiId"], r.get("cropName", ""), r.get("mandiName", ""))
            for r in results
        ]

    def generate_prediction(self, crop_id: str, mandi_id: str) -> Optional[Dict]:
        try:
            start_date = datetime.now() - timedelta(days=90)
            historical = list(self.prices_collection.find(
                {"cropId": crop_id, "mandiId": mandi_id, "date": {"$gte": start_date}},
                {"modalPrice": 1, "date": 1, "_id": 0}
            ).sort("date", 1))

            if len(historical) < 3:
                return None

            prices = [doc["modalPrice"] for doc in historical]
            dates = [doc["date"] for doc in historical]

            predictor = PricePredictor(prices, dates)
            forecast_results = predictor.calculate_arima_forecast(days=7)

            predictions = []
            base_date = datetime.now()
            for i, result in enumerate(forecast_results):
                predictions.append({
                    "date": base_date + timedelta(days=i),
                    "predictedPrice": round(result.price, 2),
                    "confidence": round(result.confidence, 1)
                })

            predicted_prices = [p["predictedPrice"] for p in predictions]
            trend = predictor.determine_trend(predicted_prices)

            now = datetime.now()
            expires_at = now + timedelta(hours=24)

            prediction_doc = {
                "cropId": crop_id,
                "mandiId": mandi_id,
                "predictions": predictions,
                "trend": trend,
                "generatedAt": now,
                "expiresAt": expires_at,
                "updatedAt": now
            }

            self.predictions_collection.update_one(
                {"cropId": crop_id, "mandiId": mandi_id},
                {"$set": prediction_doc},
                upsert=True
            )

            return prediction_doc
        except Exception as e:
            self.save_log("ERROR", "prediction", f"Failed to generate prediction for {crop_id}/{mandi_id}: {str(e)}")
            return None

    def generate_all_predictions(self) -> Dict[str, Any]:
        self.save_log("INFO", "prediction", "Starting batch prediction generation")

        pairs = self.get_unique_crop_mandi_pairs()
        self.save_log("INFO", "prediction", f"Found {len(pairs)} crop/mandi pairs to process")

        success_count = 0
        fail_count = 0

        for crop_id, mandi_id, crop_name, mandi_name in pairs:
            result = self.generate_prediction(crop_id, mandi_id)
            if result:
                success_count += 1
            else:
                fail_count += 1

        self.save_log("INFO", "prediction", f"Generated {success_count} predictions, {fail_count} failed")

        return {
            "success": True,
            "total_pairs": len(pairs),
            "generated": success_count,
            "failed": fail_count
        }

    def cleanup_old_logs(self, days: int = 30) -> Dict[str, Any]:
        self.save_log("INFO", "cleanup", f"Cleaning up logs older than {days} days")

        cutoff = datetime.now() - timedelta(days=days)
        result = self.logs_collection.delete_many({"timestamp": {"$lt": cutoff}})

        self.save_log("INFO", "cleanup", f"Deleted {result.deleted_count} old log entries")

        return {
            "success": True,
            "deleted": result.deleted_count
        }


def run_scrape_load_pipeline():
    orch = Orchestrator()
    return orch.scrape_and_load()


def run_predictions():
    orch = Orchestrator()
    return orch.generate_all_predictions()


def run_cleanup():
    orch = Orchestrator()
    return orch.cleanup_old_logs()
