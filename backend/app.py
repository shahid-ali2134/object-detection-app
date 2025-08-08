from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import List, Dict, Optional
import os
import re
import shutil
from datetime import datetime

from database import SessionLocal, Detection
from detect import run_object_detection  # returns (detections: List[Dict], annotated_path: str)

app = FastAPI()

# ─────────────────────────────
# CORS (allow React dev servers)
# ─────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─────────────────────────────
# Serve /uploads as static files
# ─────────────────────────────
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# ─────────────────────────────
# Pydantic Schemas
# ─────────────────────────────
class DetectionOut(BaseModel):
    id: int
    filename: str
    detections: List[Dict]
    annotated_image: str
    annotated_image_url: Optional[str] = None  # absolute URL for the browser

    class Config:
        orm_mode = True

class DetectionCreate(BaseModel):
    filename: str
    detections: Dict

# ─────────────────────────────
# DB Session Dependency
# ─────────────────────────────
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ─────────────────────────────
# Utils
# ─────────────────────────────
def sanitize_filename(name: str) -> str:
    """Replace spaces and odd chars so URLs are clean."""
    return re.sub(r"[^A-Za-z0-9._-]+", "_", name)

def to_out(row: Detection, request: Request) -> Dict:
    """Convert ORM row to API response with absolute URL."""
    base = str(request.base_url).rstrip("/")
    web_path = row.annotated_image.replace("\\", "/") if row.annotated_image else ""
    return {
        "id": row.id,
        "filename": row.filename,
        "detections": row.detections,
        "annotated_image": web_path,
        "annotated_image_url": f"{base}/{web_path}" if web_path else None,
    }

# ─────────────────────────────
# Health Check
# ─────────────────────────────
@app.get("/")
def read_root():
    return {"status": " FastAPI is working"}

# ─────────────────────────────
# 1) Upload → Detect → Save annotated → Persist in DB
# ─────────────────────────────
@app.post("/upload-image/", response_model=DetectionOut)
async def upload_image(
    request: Request,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image files are allowed.")

    timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
    safe_name = sanitize_filename(file.filename)
    filename = f"{timestamp}_{safe_name}"
    file_path = os.path.join(UPLOAD_DIR, filename)

    # Save original upload
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Run detection & get annotated image path
    try:
        detections, annotated_path = run_object_detection(file_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Detection failed: {e}")

    # Normalize path for web
    annotated_web_path = annotated_path.replace("\\", "/")

    # Persist
    new_entry = Detection(
        filename=filename,
        detections=detections,
        annotated_image=annotated_web_path,  # e.g. "uploads/annotated_<filename>.jpg"
    )
    db.add(new_entry)
    db.commit()
    db.refresh(new_entry)

    return to_out(new_entry, request)

# ─────────────────────────────
# 2) Get all detections
# ─────────────────────────────
@app.get("/detections/", response_model=List[DetectionOut])
def get_all_detections(request: Request, db: Session = Depends(get_db)):
    rows = db.query(Detection).all()
    return [to_out(r, request) for r in rows]

# ─────────────────────────────
# 3) Get detection by id
# ─────────────────────────────
@app.get("/detections/{id}/", response_model=DetectionOut)
def get_detection_by_id(id: int, request: Request, db: Session = Depends(get_db)):
    detection = db.query(Detection).filter(Detection.id == id).first()
    if not detection:
        raise HTTPException(status_code=404, detail="Detection not found")
    return to_out(detection, request)

# ─────────────────────────────
# 4) Optional: manually create a record
# ─────────────────────────────
@app.post("/detections/", response_model=DetectionOut)
def create_detection(data: DetectionCreate, request: Request, db: Session = Depends(get_db)):
    # normalize path if caller provides a path
    annotated_web_path = f"uploads/predicted_{sanitize_filename(data.filename)}"
    new_detection = Detection(
        filename=sanitize_filename(data.filename),
        detections=data.detections,
        annotated_image=annotated_web_path,
    )
    db.add(new_detection)
    db.commit()
    db.refresh(new_detection)
    return to_out(new_detection, request)
