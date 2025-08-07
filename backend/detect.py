# detect.py

from typing import List, Dict
import torch
import cv2

# Load YOLOv5s model once at startup
model = torch.hub.load('ultralytics/yolov5', 'yolov5s', pretrained=True)
model.eval()

def run_object_detection(image_path: str) -> List[Dict]:
    """
    Detect objects in the image at the given path.

    Returns:
        A list of dicts with format:
        [
            {
                "label": "person",
                "confidence": 0.98,
                "box": [x1, y1, x2, y2]
            },
            ...
        ]
    """
    # Read image with OpenCV
    img = cv2.imread(image_path)
    if img is None:
        raise ValueError(f"Could not read image at: {image_path}")

    # Convert to RGB
    img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

    # Inference
    results = model(img_rgb)

    # Parse results
    detections = []
    for *box, conf, cls in results.xyxy[0].tolist():
        label = model.names[int(cls)]
        detections.append({
            "label": label,
            "confidence": round(conf, 2),
            "box": [int(box[0]), int(box[1]), int(box[2]), int(box[3])]
        })

    return detections
