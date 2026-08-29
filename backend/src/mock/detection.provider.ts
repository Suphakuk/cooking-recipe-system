/**
 * ============================================================
 *  AI Detection Service Interface
 * ============================================================
 *  This module defines the contract for the ingredient-detection
 *  model. Providers available:
 *
 *    - MockDetectionProvider    : random fake results (default/fallback)
 *    - YoloHttpProvider         : calls a self-hosted YOLOv8 microservice
 *    - RoboflowDetectionProvider: calls Roboflow's hosted detection API
 *                                 (model: ingredients-agbcq/1), filtered
 *                                 down to only the ingredients this app
 *                                 actually knows about.
 *
 *  Swap providers via the DETECTION_PROVIDER env var at the bottom
 *  of this file. Nothing else in the codebase needs to change.
 *
 *  DEBUG NOTE: RoboflowDetectionProvider logs full error details with
 *  console.error before rethrowing, so failures are visible in Render
 *  logs even if the calling controller only returns a generic message
 *  to the client. Safe to leave in permanently — it only logs, never
 *  changes the response sent to the user.
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
  detect(image: Buffer): Promise<DetectionResult>;
}

// ------------------------------------------------------------
// Ingredients this app actually knows about (its nameEn values).
// Any detection that doesn't map to one of these is dropped, so
// noise from irrelevant classes (e.g. "bottle", "can", "sandwich",
// "cake") never reaches the user.
// ------------------------------------------------------------
const ALLOWED_INGREDIENTS = [
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
  'fish sauce',
  'sugar',
  'soy sauce',
  'vegetable oil',
  'green onion',
  'milk',
];

// ------------------------------------------------------------
// Mock provider
// ------------------------------------------------------------
function randomBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

export class MockDetectionProvider implements IDetectionProvider {
  public readonly name = 'mock-yolo-v1';

  async detect(_image: Buffer): Promise<DetectionResult> {
    const start = Date.now();
    await new Promise((r) => setTimeout(r, randomBetween(300, 800)));

    const count = Math.floor(randomBetween(2, 6));
    const shuffled = [...ALLOWED_INGREDIENTS].sort(() => Math.random() - 0.5);
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
// Model used: "ingredients" by Wonkeun Jung (ingredients-agbcq/1)
// 244 classes, mixed-case duplicates exist (e.g. "tomato" and "Tomato" are
// separate classes) — we lowercase everything before mapping so both collapse
// into the same internal name. Results are then filtered down to
// ALLOWED_INGREDIENTS so only ingredients this app actually supports
// are ever returned.
const ROBOFLOW_LABEL_MAP: Record<string, string> = {
  chilli: 'chili',
  bell_pepper: 'bell pepper',
  'bell pepper': 'bell pepper',
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
  public readonly name = 'roboflow-ingredients-agbcq-v1';
  constructor(private apiKey: string, private modelId: string) {}

  async detect(image: Buffer): Promise<DetectionResult> {
    const start = Date.now();

    try {
      const base64Image = image.toString('base64');

      const res = await fetch(`https://detect.roboflow.com/${this.modelId}?api_key=${this.apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: base64Image,
      });

      if (!res.ok) {
        // Read the response body too — Roboflow usually explains *why*
        // the request failed (bad key, bad model id, quota exceeded, etc.)
        const bodyText = await res.text().catch(() => '(could not read response body)');
        console.error('[RoboflowDetectionProvider] API error', {
          status: res.status,
          statusText: res.statusText,
          body: bodyText,
          modelId: this.modelId,
        });
        throw new Error(`Roboflow API responded with ${res.status}`);
      }

      const data = (await res.json()) as RoboflowResponse;
      const imgW = data.image.width;
      const imgH = data.image.height;

      const objects: DetectedObject[] = data.predictions
        .map((p) => {
          const lowerClass = p.class.toLowerCase();
          const mappedLabel = ROBOFLOW_LABEL_MAP[lowerClass] ?? lowerClass;
          return {
            label: mappedLabel,
            confidence: parseFloat(p.confidence.toFixed(3)),
            bbox: {
              x: parseFloat(((p.x - p.width / 2) / imgW).toFixed(3)),
              y: parseFloat(((p.y - p.height / 2) / imgH).toFixed(3)),
              w: parseFloat((p.width / imgW).toFixed(3)),
              h: parseFloat((p.height / imgH).toFixed(3)),
            },
          };
        })
        .filter((obj) => ALLOWED_INGREDIENTS.includes(obj.label));

      console.log('[RoboflowDetectionProvider] success', {
        rawPredictionCount: data.predictions.length,
        filteredCount: objects.length,
      });

      return {
        modelName: this.name,
        processMs: Date.now() - start,
        objects,
        raw: data,
      };
    } catch (err) {
      // Log full details regardless of what the caller does with this error.
      console.error('[RoboflowDetectionProvider] detect() threw', err);
      throw err;
    }
  }
}

// ------------------------------------------------------------
// Provider selection
// ------------------------------------------------------------
// Set in backend/.env:
//   DETECTION_PROVIDER=yolo      + YOLO_SERVICE_URL=http://host:8000
//   DETECTION_PROVIDER=roboflow  + ROBOFLOW_API_KEY=... + ROBOFLOW_MODEL_ID=ingredients-agbcq/1
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
