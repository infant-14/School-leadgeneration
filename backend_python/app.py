import os
import sys
import asyncio
import logging
import threading
from typing import List, Optional
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel

# Add workspace root to sys.path so we can import scraper, sheets, main modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.database import init_db, save_or_update_lead, get_all_leads, update_lead_status, delete_lead
from main import run_lead_pipeline
from sheets import save_leads_to_excel, sync_to_google_sheets

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("backend_api")

app = FastAPI(title="LeadFlow API")

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database on startup
@app.on_event("startup")
def startup_event():
    init_db()

# WebSocket Manager to stream logs in real-time
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"WebSocket client connected. Total connections: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info(f"WebSocket client disconnected. Total connections: {len(self.active_connections)}")

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception as e:
                logger.error(f"Error broadcasting to client: {e}")

manager = ConnectionManager()

# Active scraping job tracking
class ScrapeJobState:
    is_running = False
    lock = threading.Lock()

job_state = ScrapeJobState()

class ScrapeRequest(BaseModel):
    area: str
    school_type: str = "matriculation schools"
    limit: int = 5

class ConfigUpdateRequest(BaseModel):
    gemini_api_key: Optional[str] = None
    google_sheet_id: Optional[str] = None

@app.get("/api/leads")
def list_leads(search: Optional[str] = None, status: Optional[str] = None):
    try:
        leads = get_all_leads(search_query=search, status_filter=status)
        return leads
    except Exception as e:
        logger.error(f"Error listing leads: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.patch("/api/leads/{lead_id}/status")
def patch_lead_status(lead_id: int, payload: dict):
    new_status = payload.get("status")
    if not new_status:
        raise HTTPException(status_code=400, detail="Status is required")
    success = update_lead_status(lead_id, new_status)
    if not success:
        raise HTTPException(status_code=404, detail="Lead not found")
    return {"message": "Status updated successfully"}

@app.delete("/api/leads/{lead_id}")
def remove_lead(lead_id: int):
    success = delete_lead(lead_id)
    if not success:
        raise HTTPException(status_code=404, detail="Lead not found")
    return {"message": "Lead deleted successfully"}

def background_scraper_task(area: str, school_type: str, limit: int, loop):
    # Callback to stream logs to web socket client
    def ws_log_callback(msg: str):
        asyncio.run_coroutine_threadsafe(manager.broadcast(msg), loop)
        
    try:
        # Run scraper pipeline
        leads = run_lead_pipeline(
            area=area,
            school_type=school_type,
            limit=limit,
            log_callback=ws_log_callback
        )
        
        # Save results to SQLite database
        asyncio.run_coroutine_threadsafe(manager.broadcast("Saving leads to database..."), loop)
        for lead in leads:
            save_or_update_lead(lead)
            
        asyncio.run_coroutine_threadsafe(manager.broadcast("Scrape job finished successfully!"), loop)
        
    except Exception as e:
        logger.error(f"Scraper job error: {e}")
        asyncio.run_coroutine_threadsafe(manager.broadcast(f"ERROR: Scraper job failed: {e}"), loop)
    finally:
        with job_state.lock:
            job_state.is_running = False

@app.post("/api/scrape")
def trigger_scrape(payload: ScrapeRequest, background_tasks: BackgroundTasks):
    with job_state.lock:
        if job_state.is_running:
            raise HTTPException(status_code=400, detail="A scraping job is already running")
        job_state.is_running = True

    # Start scraping in background
    loop = asyncio.get_event_loop()
    background_tasks.add_task(
        background_scraper_task,
        payload.area,
        payload.school_type,
        payload.limit,
        loop
    )
    return {"message": "Scrape job initiated successfully"}

@app.get("/api/scrape/status")
def get_scrape_status():
    return {"is_running": job_state.is_running}

@app.post("/api/sync-sheets")
def sync_sheets():
    sheet_id = os.getenv("GOOGLE_SHEET_ID")
    if not sheet_id:
        raise HTTPException(status_code=400, detail="GOOGLE_SHEET_ID not configured in workspace environment")
        
    leads = get_all_leads()
    if not leads:
        return {"message": "No leads found in database to sync"}
        
    success = sync_to_google_sheets(leads, sheet_id)
    if not success:
        raise HTTPException(status_code=500, detail="Google Sheet sync failed. Make sure credentials.json is configured.")
    return {"message": "Successfully synced to Google Sheets!"}

@app.get("/api/download-excel")
def download_excel():
    leads = get_all_leads()
    if not leads:
        raise HTTPException(status_code=404, detail="No leads to export")
        
    temp_filename = "school_leads_export.xlsx"
    excel_path = save_leads_to_excel(leads, temp_filename)
    if not excel_path or not os.path.exists(excel_path):
        raise HTTPException(status_code=500, detail="Failed to generate Excel file")
        
    return FileResponse(
        path=excel_path,
        filename="School_Leads_Report.xlsx",
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )

@app.get("/api/config")
def get_config():
    return {
        "gemini_api_key": os.getenv("GEMINI_API_KEY", "")[:10] + "..." if os.getenv("GEMINI_API_KEY") else "",
        "google_sheet_id": os.getenv("GOOGLE_SHEET_ID", "")
    }

@app.post("/api/config")
def update_config(payload: ConfigUpdateRequest):
    env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env")
    
    # Read existing env
    env_lines = []
    if os.path.exists(env_path):
        with open(env_path, "r") as f:
            env_lines = f.readlines()
            
    env_dict = {}
    for line in env_lines:
        if "=" in line and not line.strip().startswith("#"):
            k, v = line.strip().split("=", 1)
            env_dict[k.strip()] = v.strip()

    # Update keys
    if payload.gemini_api_key is not None:
        env_dict["GEMINI_API_KEY"] = payload.gemini_api_key
        os.environ["GEMINI_API_KEY"] = payload.gemini_api_key
        
    if payload.google_sheet_id is not None:
        env_dict["GOOGLE_SHEET_ID"] = payload.google_sheet_id
        os.environ["GOOGLE_SHEET_ID"] = payload.google_sheet_id

    # Write back to .env
    with open(env_path, "w") as f:
        for k, v in env_dict.items():
            f.write(f"{k}={v}\n")
            
    return {"message": "Configuration updated successfully"}

@app.websocket("/api/logs")
async def websocket_logs(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        # Keep connection open
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(websocket)
