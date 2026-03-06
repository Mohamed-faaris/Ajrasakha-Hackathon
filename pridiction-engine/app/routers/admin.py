from fastapi import APIRouter, Query, HTTPException
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
from datetime import datetime, timedelta
from typing import List, Optional
from app.database import get_logs_collection
from app.scheduler import get_scheduler_status
from app.orchestrator import Orchestrator

router = APIRouter(prefix="/admin", tags=["admin"])


class LogEntry(BaseModel):
    level: str
    component: str
    message: str
    metadata: dict
    timestamp: datetime


class JobTriggerResponse(BaseModel):
    success: bool
    message: str
    result: Optional[dict] = None


@router.get("/logs", response_model=List[LogEntry])
async def get_logs(
    level: Optional[str] = Query(None, description="Filter by level: INFO, ERROR, WARNING"),
    component: Optional[str] = Query(None, description="Filter by component"),
    limit: int = Query(50, ge=1, le=500),
    hours: int = Query(24, ge=1, le=168)
):
    logs_collection = get_logs_collection()
    
    query = {"timestamp": {"$gte": datetime.now() - timedelta(hours=hours)}}
    if level:
        query["level"] = level.upper()
    if component:
        query["component"] = component
    
    logs = list(logs_collection.find(query).sort("timestamp", -1).limit(limit))
    return [LogEntry(**{**log, "_id": str(log.get("_id", ""))}) for log in logs]


@router.post("/jobs/scrape-load", response_model=JobTriggerResponse)
async def trigger_scrape_load(date: Optional[str] = None):
    try:
        orch = Orchestrator()
        result = orch.scrape_and_load(date)
        return JobTriggerResponse(
            success=result.get("success", False),
            message=f"Scrape and load {'completed' if result.get('success') else 'failed'}",
            result=result
        )
    except Exception as e:
        return JobTriggerResponse(success=False, message=str(e))


@router.post("/jobs/parse-load", response_model=JobTriggerResponse)
async def trigger_parse_load(date: Optional[str] = None):
    try:
        orch = Orchestrator()
        result = orch.parse_and_load(date)
        return JobTriggerResponse(
            success=result.get("success", False),
            message=f"Parse and load {'completed' if result.get('success') else 'failed'}",
            result=result
        )
    except Exception as e:
        return JobTriggerResponse(success=False, message=str(e))


@router.post("/jobs/predictions", response_model=JobTriggerResponse)
async def trigger_predictions():
    try:
        orch = Orchestrator()
        result = orch.generate_all_predictions()
        return JobTriggerResponse(
            success=True,
            message=f"Generated {result.get('generated', 0)} predictions",
            result=result
        )
    except Exception as e:
        return JobTriggerResponse(success=False, message=str(e))


@router.post("/jobs/cleanup", response_model=JobTriggerResponse)
async def trigger_cleanup(days: int = 30):
    try:
        orch = Orchestrator()
        result = orch.cleanup_old_logs(days)
        return JobTriggerResponse(
            success=True,
            message=f"Cleaned up {result.get('deleted', 0)} logs",
            result=result
        )
    except Exception as e:
        return JobTriggerResponse(success=False, message=str(e))


@router.get("/scheduler")
async def get_scheduler_info():
    return get_scheduler_status()


@router.get("/ui", response_class=HTMLResponse)
async def admin_ui():
    return """<!DOCTYPE html>
<html>
<head>
    <title>Prediction Engine Admin</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f0f0f; color: #e0e0e0; padding: 20px; }
        .container { max-width: 1200px; margin: 0 auto; }
        h1 { color: #00d4aa; margin-bottom: 20px; }
        h2 { color: #00d4aa; margin: 20px 0 10px; border-bottom: 1px solid #333; padding-bottom: 8px; }
        .card { background: #1a1a1a; border-radius: 8px; padding: 20px; margin-bottom: 20px; border: 1px solid #333; }
        .btn { background: #00d4aa; color: #000; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: 600; margin-right: 10px; margin-bottom: 10px; }
        .btn:hover { background: #00b894; }
        .btn:disabled { background: #555; cursor: not-allowed; }
        .btn.error { background: #e74c3c; color: white; }
        .btn.warning { background: #f39c12; color: black; }
        .logs { background: #0d0d0d; border-radius: 6px; padding: 15px; max-height: 400px; overflow-y: auto; font-family: 'Monaco', 'Menlo', monospace; font-size: 13px; }
        .log-entry { padding: 6px 0; border-bottom: 1px solid #222; }
        .log-entry:last-child { border-bottom: none; }
        .log-time { color: #666; }
        .log-level { padding: 2px 6px; border-radius: 3px; margin-right: 8px; font-size: 11px; font-weight: bold; }
        .log-level.INFO { background: #00d4aa; color: #000; }
        .log-level.ERROR { background: #e74c3c; color: white; }
        .log-level.WARNING { background: #f39c12; color: black; }
        .log-component { color: #00b894; margin-right: 8px; }
        .log-message { color: #ccc; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; }
        .stat { background: #252525; padding: 15px; border-radius: 6px; text-align: center; }
        .stat-value { font-size: 24px; font-weight: bold; color: #00d4aa; }
        .stat-label { color: #888; font-size: 12px; margin-top: 5px; }
        .job-status { display: inline-block; width: 10px; height: 10px; border-radius: 50%; margin-right: 8px; }
        .job-status.running { background: #00d4aa; }
        .job-status.stopped { background: #e74c3c; }
        #logContainer { white-space: pre-wrap; }
    </style>
</head>
<body>
    <div class="container">
        <h1>⚙️ Prediction Engine Admin</h1>
        
        <div class="card">
            <h2>📊 Scheduler Status</h2>
            <div id="schedulerStatus">Loading...</div>
        </div>
        
        <div class="card">
            <h2>▶️ Manual Triggers</h2>
            <button class="btn" onclick="triggerJob('scrape-load')">Scrape + Load</button>
            <button class="btn" onclick="triggerJob('predictions')">Generate Predictions</button>
            <button class="btn warning" onclick="triggerJob('cleanup')">Cleanup Logs</button>
            <div id="jobResult" style="margin-top: 15px; color: #888;"></div>
        </div>
        
        <div class="card">
            <h2>📝 Recent Logs</h2>
            <div style="margin-bottom: 15px;">
                <button class="btn" onclick="loadLogs()">Refresh</button>
                <select id="levelFilter" onchange="loadLogs()" style="padding: 8px; background: #252525; color: #ccc; border: 1px solid #444; border-radius: 4px;">
                    <option value="">All Levels</option>
                    <option value="INFO">INFO</option>
                    <option value="ERROR">ERROR</option>
                    <option value="WARNING">WARNING</option>
                </select>
                <select id="componentFilter" onchange="loadLogs()" style="padding: 8px; background: #252525; color: #ccc; border: 1px solid #444; border-radius: 4px;">
                    <option value="">All Components</option>
                    <option value="scraper">Scraper</option>
                    <option value="loader">Loader</option>
                    <option value="prediction">Prediction</option>
                    <option value="scheduler">Scheduler</option>
                    <option value="orchestrator">Orchestrator</option>
                </select>
            </div>
            <div class="logs">
                <div id="logContainer">Loading logs...</div>
            </div>
        </div>
    </div>
    
    <script>
        async function loadSchedulerStatus() {
            try {
                const res = await fetch('/admin/scheduler');
                const data = await res.json();
                const statusHtml = data.running 
                    ? '<span class="job-status running"></span>Running' 
                    : '<span class="job-status stopped"></span>Stopped';
                let jobsHtml = '<div class="grid" style="margin-top: 15px;">';
                data.jobs.forEach(job => {
                    jobsHtml += `<div class="stat">
                        <div class="stat-value" style="font-size: 16px;">${job.name}</div>
                        <div class="stat-label">${job.next_run ? new Date(job.next_run).toLocaleString('en-IN', {timeZone: 'Asia/Kolkata'}) : 'N/A'}</div>
                    </div>`;
                });
                jobsHtml += '</div>';
                document.getElementById('schedulerStatus').innerHTML = statusHtml + jobsHtml;
            } catch (e) {
                document.getElementById('schedulerStatus').innerText = 'Error loading status';
            }
        }
        
        async function loadLogs() {
            const level = document.getElementById('levelFilter').value;
            const component = document.getElementById('componentFilter').value;
            let url = '/admin/logs?limit=100';
            if (level) url += '&level=' + level;
            if (component) url += '&component=' + component;
            
            try {
                const res = await fetch(url);
                const logs = await res.json();
                const container = document.getElementById('logContainer');
                if (logs.length === 0) {
                    container.innerText = 'No logs found';
                    return;
                }
                container.innerHTML = logs.map(log => {
                    const time = new Date(log.timestamp).toLocaleString('en-IN', {timeZone: 'Asia/Kolkata', hour12: false});
                    return `<div class="log-entry">
                        <span class="log-time">${time}</span>
                        <span class="log-level ${log.level}">${log.level}</span>
                        <span class="log-component">[${log.component}]</span>
                        <span class="log-message">${log.message}</span>
                    </div>`;
                }).join('');
            } catch (e) {
                document.getElementById('logContainer').innerText = 'Error loading logs';
            }
        }
        
        async function triggerJob(type) {
            const btn = event.target;
            btn.disabled = true;
            const resultDiv = document.getElementById('jobResult');
            resultDiv.innerText = 'Running...';
            
            try {
                let endpoint = '/admin/jobs/' + type;
                if (type === 'cleanup') endpoint += '?days=30';
                
                const res = await fetch(endpoint, { method: 'POST' });
                const data = await res.json();
                
                if (data.success) {
                    resultDiv.innerText = '✓ ' + data.message;
                    resultDiv.style.color = '#00d4aa';
                } else {
                    resultDiv.innerText = '✗ ' + data.message;
                    resultDiv.style.color = '#e74c3c';
                }
                loadLogs();
            } catch (e) {
                resultDiv.innerText = '✗ Error: ' + e.message;
                resultDiv.style.color = '#e74c3c';
            }
            
            btn.disabled = false;
        }
        
        loadSchedulerStatus();
        loadLogs();
        setInterval(loadLogs, 30000);
    </script>
</body>
</html>"""
