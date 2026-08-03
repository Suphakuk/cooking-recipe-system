"""
Real YOLOv8 object-detection microservice for the cooking-recipe-system.

This is a genuine model (not a mock) — it loads the actual YOLOv8n weights
pretrained by Ultralytics on the COCO dataset (80 general object classes)
and runs real inference on uploaded images.

IMPORTANT — honest limitation: COCO's 80 classes are general everyday objects
(person, car, banana, carrot, broccoli, ...). Only a handful overlap with
Thai cooking ingredients (e.g. "carrot"). Most Thai ingredients (garlic,
chili, lemongrass, kaffir lime leaf, fish sauce, ...) are NOT in COCO and
will never be detected by this pretrained model. To recognize those, the
model needs to be fine-tuned on a labeled Thai-ingredient dataset — see
/docs/AI-MODEL.md for the training + evaluation notebook that does this
properly, with a real measured mAP, once you have a dataset.

Run:
    pip install -r requirements.txt
    uvicorn app:app --host 0.0.0.0 --port 8000

Then point the Node backend at it:
    DETECTION_PROVIDER=yolo
    YOLO_SERVICE_URL=http://localhost:8000
"""

import io
import time

from fastapi import FastAPI, File, UploadFile
from PIL import Image
from ultralytics import YOLO

app = FastAPI(title="cooking-recipe-system YOLO detection service")

# Loads the real pretrained YOLOv8n weights (downloaded once from Ultralytics'
# GitHub releases, then cached locally). This is a real model doing real
# inference — not a random-label mock.
model = YOLO("yolov8n.pt")


@app.get("/health")
def health():
    return {"status": "ok", "model": "yolov8n", "num_classes": len(model.names)}


@app.post("/detect")
async def detect(file: UploadFile = File(...)):
    start = time.time()
    image_bytes = await file.read()
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")

    results = model(image, verbose=False)[0]
    img_w, img_h = image.size

    objects = []
    for box in results.boxes:
        cls_id = int(box.cls[0])
        confidence = float(box.conf[0])
        x1, y1, x2, y2 = [float(v) for v in box.xyxy[0]]
        objects.append(
            {
                "label": model.names[cls_id],
                "confidence": round(confidence, 4),
                # Normalized 0..1, to match the app's existing bbox convention
                "bbox": {
                    "x": round(x1 / img_w, 4),
                    "y": round(y1 / img_h, 4),
                    "w": round((x2 - x1) / img_w, 4),
                    "h": round((y2 - y1) / img_h, 4),
                },
            }
        )

    process_ms = round((time.time() - start) * 1000)

    return {
        "modelName": "yolov8n-coco-pretrained",
        "processMs": process_ms,
        "objects": objects,
    }
