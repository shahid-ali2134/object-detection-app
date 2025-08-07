from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def read_root():
    return {"status": "FastAPI is working"}

from fastapi import UploadFile, File, HTTPException
import os
import shutil
from datetime import datetime
from database import SessionLocal, Detection

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)  # Ensure folder exists

@app.post("/upload")
async def upload_image(file: UploadFile = File(...)):
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

    # Create DB entry (empty detection for now)
    db = SessionLocal()
    new_entry = Detection(
        filename=filename,
        detections=[],  # We'll update this after running object detection
    )
    db.add(new_entry)
    db.commit()
    db.refresh(new_entry)

    return {
        "id": new_entry.id,
        "filename": new_entry.filename,
        "path": file_path,
        "message": " Image uploaded and saved"
    }
