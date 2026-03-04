from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from datetime import datetime
import pytz
from app.orchestrator import run_scrape_load_pipeline, run_predictions, run_cleanup
from app.database import get_logs_collection

tz = pytz.timezone("Asia/Kolkata")

scheduler = BackgroundScheduler(timezone=tz)


def log_job_execution(job_name: str, func):
    def wrapper(*args, **kwargs):
        logs_collection = get_logs_collection()
        logs_collection.insert_one({
            "level": "INFO",
            "component": "scheduler",
            "message": f"Starting scheduled job: {job_name}",
            "timestamp": datetime.now()
        })
        try:
            result = func(*args, **kwargs)
            logs_collection.insert_one({
                "level": "INFO",
                "component": "scheduler",
                "message": f"Completed scheduled job: {job_name}",
                "metadata": {"result": result},
                "timestamp": datetime.now()
            })
            return result
        except Exception as e:
            logs_collection.insert_one({
                "level": "ERROR",
                "component": "scheduler",
                "message": f"Failed scheduled job: {job_name}",
                "metadata": {"error": str(e)},
                "timestamp": datetime.now()
            })
            raise
    return wrapper


def setup_jobs():
    scheduler.add_job(
        log_job_execution("scrape_and_load", run_scrape_load_pipeline),
        CronTrigger(hour=0, minute=0),
        id="scrape_and_load",
        name="Scrape and Load",
        replace_existing=True
    )

    scheduler.add_job(
        log_job_execution("generate_predictions", run_predictions),
        CronTrigger(hour=0, minute=30),
        id="generate_predictions",
        name="Generate Predictions",
        replace_existing=True
    )

    scheduler.add_job(
        log_job_execution("cleanup_old_logs", run_cleanup),
        CronTrigger(day_of_week="sunday", hour=2, minute=0),
        id="cleanup_old_logs",
        name="Cleanup Old Logs",
        replace_existing=True
    )


def start_scheduler():
    if not scheduler.running:
        setup_jobs()
        scheduler.start()
        print("Scheduler started successfully")


def stop_scheduler():
    if scheduler.running:
        scheduler.shutdown()
        print("Scheduler stopped")


def get_scheduler_status():
    jobs = scheduler.get_jobs()
    return {
        "running": scheduler.running,
        "jobs": [
            {
                "id": job.id,
                "name": job.name,
                "next_run": job.next_run_time.isoformat() if job.next_run_time else None
            }
            for job in jobs
        ]
    }
