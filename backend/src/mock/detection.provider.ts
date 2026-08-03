/**
 * ============================================================
 *  AI Detection Service Interface
 * ============================================================
 *  This module defines the contract for the ingredient-detection
 *  model. The current implementation is a MOCK that returns random
 *  plausible results. To plug in a real YOLO/CNN model later:
 *
 *    1. Create a new class that implements `IDetectionProvider`.
 *    2. Call your model server (e.g. FastAPI/TorchServe) inside `detect()`.
 *    3. Return results in the same `DetectionResult` shape.
 *    4. Swap the exported `detectionProvider` at the bottom of this file.
 *
 *  Nothing else in the codebase needs to change.
 * ============================================================
 */

export interface DetectedObject {
  label: string; // detected class name, e.g. "tomato"
  confidence: number; // 0..1
  bbox?: { x: number; y: number; w: number; h: number }; // normalized 0..1
}

export interface DetectionResult {
  modelName: string;
  processMs: number;
  objects: DetectedObject[];
  raw?: unknown; // full/native model output
}

export interface IDetectionProvider {
  readonly name: string;
  // Accepts the raw image bytes (Buffer). A real provider would send these to a
  // model server; the mock ignores them.
  detect(image: Buffer): Promise<DetectionResult>;
}

// ------------------------------------------------------------
// Mock provider
// ------------------------------------------------------------
const MOCK_CLASSES = [
  'tomato',
  'egg',
  'onion',
  'garlic',
  'chicken',
  'pork',
  'carrot',
  'chili',
  'bell pepper',
  'mushroom',
  'basil',
  'rice',
  'shrimp',
  'lime',
  'cucumber',
];

function randomBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

export class MockDetectionProvider implements IDetectionProvider {
  public readonly name = 'mock-yolo-v1';

  async detect(_image: Buffer): Promise<DetectionResult> {
    const start = Date.now();

    // Simulate model latency
    await new Promise((r) => setTimeout(r, randomBetween(300, 800)));

    // Pick 2-5 random unique classes
    const count = Math.floor(randomBetween(2, 6));
    const shuffled = [...MOCK_CLASSES].sort(() => Math.random() - 0.5);
    const picked = shuffled.slice(0, count);

    const objects: DetectedObject[] = picked.map((label) => ({
      label,
      confidence: parseFloat(randomBetween(0.55, 0.98).toFixed(3)),
      bbox: {
        x: parseFloat(randomBetween(0, 0.6).toFixed(3)),
        y: parseFloat(randomBetween(0, 0.6).toFixed(3)),
        w: parseFloat(randomBetween(0.1, 0.4).toFixed(3)),
        h: parseFloat(randomBetween(0.1, 0.4).toFixed(3)),
      },
    }));

    return {
      modelName: this.name,
      processMs: Date.now() - start,
      objects,
      raw: { note: 'This is mock output. Replace with real model.', objects },
    };
  }
}

// ------------------------------------------------------------
// Real provider: calls the YOLOv8 microservice in /yolo-service
// ------------------------------------------------------------
export class YoloHttpProvider implements IDetectionProvider {
  public readonly name = 'yolov8n-coco-pretrained';
  constructor(private endpoint: string) {}

  async detect(image: Buffer): Promise<DetectionResult> {
    const form = new FormData();
    form.append('file', new Blob([image]), 'upload.jpg');

    const res = await fetch(`${this.endpoint}/detect`, { method: 'POST', body: form as any });
    if (!res.ok) {
      throw new Error(`YOLO service responded with ${res.status}`);
    }
    const data = (await res.json()) as {
      modelName: string;
      processMs: number;
      objects: { label: string; confidence: number; bbox: { x: number; y: number; w: number; h: number } }[];
    };

    return {
      modelName: data.modelName,
      processMs: data.processMs,
      objects: data.objects,
      raw: data,
    };
  }
}

// ------------------------------------------------------------
// Provider selection
// ------------------------------------------------------------
// Set DETECTION_PROVIDER=yolo and YOLO_SERVICE_URL=http://host:8000 in .env
// to use the real YOLOv8 model (see /yolo-service). Defaults to the mock so
// existing deployments keep working until the Python service is running.
function buildProvider(): IDetectionProvider {
  if (process.env.DETECTION_PROVIDER === 'yolo') {
    const endpoint = process.env.YOLO_SERVICE_URL;
    if (!endpoint) {
      throw new Error('YOLO_SERVICE_URL must be set when DETECTION_PROVIDER=yolo');
    }
    return new YoloHttpProvider(endpoint);
  }
  return new MockDetectionProvider();
}

export const detectionProvider: IDetectionProvider = buildProvider();
