from typing import List, Dict, Tuple
import torch
import cv2
import os

# Load YOLOv5s model once at startup
model = torch.hub.load('ultralytics/yolov5', 'yolov5s', pretrained=True)
model.eval()

def run_object_detection(image_path: str) -> Tuple[List[Dict], str]:
    """
    Detect objects in the image and draw bounding boxes with labels & confidence.

    Returns:
        detections: List of dicts
        result_path: Path to saved annotated image
    """
    img = cv2.imread(image_path)
    if img is None:
        raise ValueError(f"Could not read image at: {image_path}")

    img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    results = model(img_rgb)

    detections = []
    for *box, conf, cls in results.xyxy[0].tolist():
        label = model.names[int(cls)]
        x1, y1, x2, y2 = map(int, box)

        # Append to result list
        detections.append({
            "label": label,
            "confidence": round(conf, 2),
            "box": [x1, y1, x2, y2]
        })

        # Draw bounding box
        cv2.rectangle(img, (x1, y1), (x2, y2), (0, 255, 0), 2)

        # Put label and confidence
        text = f"{label} {round(conf, 2)}"
        cv2.putText(img, text, (x1, y1 - 10),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)

    # Save annotated image
    result_path = os.path.join("uploads", f"predicted_{os.path.basename(image_path)}")
    cv2.imwrite(result_path, img)

    return detections, result_path
