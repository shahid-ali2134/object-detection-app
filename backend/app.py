from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
import os
import shutil
from datetime import datetime

from database import SessionLocal, Detection

app = FastAPI()

# ─────────────────────────────
# Health Check Endpoint
# ─────────────────────────────
@app.get("/")
def read_root():
    return {"status": "FastAPI is working"}

# ─────────────────────────────
# Utility: Uploads Folder
# ─────────────────────────────
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)  # Ensure folder exists

# ─────────────────────────────
# Dependency to get DB Session
# ─────────────────────────────
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ─────────────────────────────
# 1. Upload Image & Save to DB
# ─────────────────────────────
@app.post("/upload-image/")
async def upload_image(file: UploadFile = File(...), db: Session = Depends(get_db)):
    # Validate file type
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image files are allowed.")

    # Generate safe filename
    timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
    filename = f"{timestamp}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, filename)

    # Save file locally
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Create DB entry (empty detections for now)
    new_entry = Detection(
        filename=filename,
        detections=[],  # Will update after detection model
    )
    db.add(new_entry)
    db.commit()
    db.refresh(new_entry)

    return {
        "id": new_entry.id,
        "filename": new_entry.filename,
        "path": file_path,
        "message": "✅ Image uploaded and saved"
    }

# ─────────────────────────────
# 2. Get All Detections
# ─────────────────────────────
@app.get("/detections/")
def get_all_detections(db: Session = Depends(get_db)):
    return db.query(Detection).all()

# ─────────────────────────────
# 3. Get Detection by ID
# ─────────────────────────────
@app.get("/detections/{id}/")
def get_detection_by_id(id: int, db: Session = Depends(get_db)):
    detection = db.query(Detection).filter(Detection.id == id).first()
    if not detection:
        raise HTTPException(status_code=404, detail="Detection not found")
    return detection

# ─────────────────────────────
# 4. (Optional) Manually Add Detection
# ─────────────────────────────
class DetectionCreate(BaseModel):
    filename: str
    detections: dict

@app.post("/detections/")
def create_detection(data: DetectionCreate, db: Session = Depends(get_db)):
    new_detection = Detection(
        filename=data.filename,
        detections=data.detections
    )
    db.add(new_detection)
    db.commit()
    db.refresh(new_detection)
    return new_detection
