from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import List, Dict
import os
import shutil
from datetime import datetime

from database import SessionLocal, Detection
from detect import run_object_detection  # ✅ YOLOv5 detection logic

app = FastAPI()

# ─────────────────────────────
# Pydantic Schema for Response
# ─────────────────────────────
class DetectionOut(BaseModel):
    id: int
    filename: str
    detections: List[Dict]  # JSON list

    class Config:
        orm_mode = True

class DetectionCreate(BaseModel):
    filename: str
    detections: Dict

# ─────────────────────────────
# Health Check Endpoint
# ─────────────────────────────
@app.get("/")
def read_root():
    return {"status": "FastAPI is working"}

# ─────────────────────────────
# Uploads Folder
# ─────────────────────────────
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# ─────────────────────────────
# Dependency: DB Session
# ─────────────────────────────
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ─────────────────────────────
# 1. Upload Image & Run Detection
# ─────────────────────────────
@app.post("/upload-image/", response_model=DetectionOut)
async def upload_image(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image files are allowed.")

    timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
    filename = f"{timestamp}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        detections = run_object_detection(file_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Detection failed: {e}")

    new_entry = Detection(
        filename=filename,
        detections=detections
    )
    db.add(new_entry)
    db.commit()
    db.refresh(new_entry)

    return new_entry

# ─────────────────────────────
# 2. Get All Detections
# ─────────────────────────────
@app.get("/detections/", response_model=List[DetectionOut])
def get_all_detections(db: Session = Depends(get_db)):
    return db.query(Detection).all()

# ─────────────────────────────
# 3. Get Detection by ID
# ─────────────────────────────
@app.get("/detections/{id}/", response_model=DetectionOut)
def get_detection_by_id(id: int, db: Session = Depends(get_db)):
    detection = db.query(Detection).filter(Detection.id == id).first()
    if not detection:
        raise HTTPException(status_code=404, detail="Detection not found")
    return detection

# ─────────────────────────────
# 4. Manually Add Detection (Optional)
# ─────────────────────────────
@app.post("/detections/", response_model=DetectionOut)
def create_detection(data: DetectionCreate, db: Session = Depends(get_db)):
    new_detection = Detection(
        filename=data.filename,
        detections=data.detections
    )
    db.add(new_detection)
    db.commit()
    db.refresh(new_detection)
    return new_detection
