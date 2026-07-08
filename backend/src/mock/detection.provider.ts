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
// Example real provider stub (commented — for future use)
// ------------------------------------------------------------
/*
export class YoloHttpProvider implements IDetectionProvider {
  public readonly name = 'yolov8-http';
  constructor(private endpoint: string) {}

  async detect(image: Buffer): Promise<DetectionResult> {
    const start = Date.now();
    const form = new FormData();
    form.append('image', new Blob([image]), 'upload.jpg');
    const res = await fetch(this.endpoint, { method: 'POST', body: form as any });
    const data = await res.json();
    return {
      modelName: this.name,
      processMs: Date.now() - start,
      objects: data.predictions.map((p: any) => ({
        label: p.class,
        confidence: p.confidence,
        bbox: { x: p.x, y: p.y, w: p.w, h: p.h },
      })),
      raw: data,
    };
  }
}
*/

// The single provider used across the app. Swap this line to go live.
export const detectionProvider: IDetectionProvider = new MockDetectionProvider();
