from sqlalchemy import create_engine, Column, Integer, String, JSON, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime

# 1. Define your connection string
DATABASE_URL = "postgresql://detector:securepassword@localhost:5432/object_detection_db"

# 2. Create engine and session
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 3. Create base class for models
Base = declarative_base()

# 4. Define the Detection table
class Detection(Base):
    __tablename__ = "detections"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    detections = Column(JSON, nullable=False)  # JSON list of detected objects
    annotated_image = Column(String, nullable=True)  # ✅ Path to image with bounding boxes
    timestamp = Column(DateTime, default=datetime.utcnow)

# 5. Create the table in the database
def init_db():
    Base.metadata.create_all(bind=engine)
    print(" Database tables created.")

# Only run if this file is executed directly
if __name__ == "__main__":
    init_db()
