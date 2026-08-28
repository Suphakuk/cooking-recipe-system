/**
 * ============================================================
 *  AI Detection Service Interface
 * ============================================================
 *  This module defines the contract for the ingredient-detection
 *  model. Three providers are available:
 *
 *    - MockDetectionProvider   : random fake results (default/fallback)
 *    - YoloHttpProvider        : calls a self-hosted YOLOv8 microservice
 *    - RoboflowDetectionProvider: calls Roboflow's hosted detection API
 *
 *  Swap providers via the DETECTION_PROVIDER env var at the bottom
 *  of this file. Nothing else in the codebase needs to change.
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
// Real provider: calls Roboflow's hosted detection API
// ------------------------------------------------------------
// Model used: "FOOD-INGREDIENTS detection" (food-ingredients-detection-6ce7j/1)
// mAP@50 ~92%. Some Roboflow class names differ from our internal nameEn
// values, so we map them here before returning results.
const ROBOFLOW_LABEL_MAP: Record<string, string> = {
  Capsicum: 'bell pepper',
  'Onion Leaves': 'green onion',
  'Chili Pepper -Khursani-': 'chili',
  'Akabare Khursani': 'chili',
  'Lime -Kagati-': 'lime',
};

interface RoboflowPrediction {
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
  class: string;
}

interface RoboflowResponse {
  image: { width: number; height: number };
  predictions: RoboflowPrediction[];
}

export class RoboflowDetectionProvider implements IDetectionProvider {
  public readonly name = 'roboflow-food-ingredients-v1';
  constructor(private apiKey: string, private modelId: string) {}

  async detect(image: Buffer): Promise<DetectionResult> {
    const start = Date.now();
    const base64Image = image.toString('base64');

    const res = await fetch(`https://detect.roboflow.com/${this.modelId}?api_key=${this.apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: base64Image,
    });

    if (!res.ok) {
      throw new Error(`Roboflow API responded with ${res.status}`);
    }

    const data = (await res.json()) as RoboflowResponse;
    const imgW = data.image.width;
    const imgH = data.image.height;

    const objects: DetectedObject[] = data.predictions.map((p) => {
      const mappedLabel = ROBOFLOW_LABEL_MAP[p.class] ?? p.class;
      return {
        label: mappedLabel.toLowerCase(),
        confidence: parseFloat(p.confidence.toFixed(3)),
        bbox: {
          x: parseFloat(((p.x - p.width / 2) / imgW).toFixed(3)),
          y: parseFloat(((p.y - p.height / 2) / imgH).toFixed(3)),
          w: parseFloat((p.width / imgW).toFixed(3)),
          h: parseFloat((p.height / imgH).toFixed(3)),
        },
      };
    });

    return {
      modelName: this.name,
      processMs: Date.now() - start,
      objects,
      raw: data,
    };
  }
}

// ------------------------------------------------------------
// Provider selection
// ------------------------------------------------------------
// Set in backend/.env:
//   DETECTION_PROVIDER=yolo      + YOLO_SERVICE_URL=http://host:8000
//   DETECTION_PROVIDER=roboflow  + ROBOFLOW_API_KEY=... + ROBOFLOW_MODEL_ID=...
// Defaults to the mock so existing deployments keep working until a real
// provider is configured.
function buildProvider(): IDetectionProvider {
  if (process.env.DETECTION_PROVIDER === 'yolo') {
    const endpoint = process.env.YOLO_SERVICE_URL;
    if (!endpoint) {
      throw new Error('YOLO_SERVICE_URL must be set when DETECTION_PROVIDER=yolo');
    }
    return new YoloHttpProvider(endpoint);
  }

  if (process.env.DETECTION_PROVIDER === 'roboflow') {
    const apiKey = process.env.ROBOFLOW_API_KEY;
    const modelId = process.env.ROBOFLOW_MODEL_ID;
    if (!apiKey || !modelId) {
      throw new Error('ROBOFLOW_API_KEY and ROBOFLOW_MODEL_ID must be set when DETECTION_PROVIDER=roboflow');
    }
    return new RoboflowDetectionProvider(apiKey, modelId);
  }

  return new MockDetectionProvider();
}

export const detectionProvider: IDetectionProvider = buildProvider();
