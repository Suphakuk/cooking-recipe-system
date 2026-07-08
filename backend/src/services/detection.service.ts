import { prisma } from '../config/prisma';
import { ApiError } from '../utils/ApiError';
import { detectionProvider } from '../mock/detection.provider';
import { fileToDataUrl } from '../middlewares/upload.middleware';
import { getPagination, buildMeta } from '../utils/helpers';

export const DetectionService = {
  /**
   * Run detection on an uploaded image.
   * 1. Converts the in-memory upload to a base64 data URL (stored in DB).
   * 2. Calls the (mock) detection provider.
   * 3. Tries to map each detected label to a known ingredient (by nameEn or name).
   * 4. Persists the detection + items.
   * 5. Returns detected ingredients so the client can request recommendations.
   */
  async detectFromUpload(userId: number | undefined, file: Express.Multer.File) {
    const imageUrl = fileToDataUrl(file);

    // Create a PENDING record first
    const detection = await prisma.detection.create({
      data: { userId, imageUrl, status: 'PENDING' },
    });

    try {
      // The mock provider returns random labels; it doesn't read pixels, so we
      // pass the raw image buffer for a real provider to use later if needed.
      const result = await detectionProvider.detect(file.buffer);

      // Map labels to ingredients
      const labels = result.objects.map((o) => o.label.toLowerCase());
      const ingredients = await prisma.ingredient.findMany({
        where: {
          OR: [
            { nameEn: { in: labels } },
            { name: { in: labels } },
          ],
        },
      });

      const byLabel = new Map<string, number>();
      for (const ing of ingredients) {
        if (ing.nameEn) byLabel.set(ing.nameEn.toLowerCase(), ing.id);
        byLabel.set(ing.name.toLowerCase(), ing.id);
      }

      // Persist items + update detection
      const updated = await prisma.detection.update({
        where: { id: detection.id },
        data: {
          status: 'COMPLETED',
          modelName: result.modelName,
          processMs: result.processMs,
          rawResult: result.raw as object,
          items: {
            create: result.objects.map((o) => ({
              label: o.label,
              confidence: o.confidence,
              ingredientId: byLabel.get(o.label.toLowerCase()) ?? null,
              bboxX: o.bbox?.x ?? null,
              bboxY: o.bbox?.y ?? null,
              bboxW: o.bbox?.w ?? null,
              bboxH: o.bbox?.h ?? null,
            })),
          },
        },
        include: { items: { include: { ingredient: true } } },
      });

      const matchedIngredients = updated.items
        .filter((it) => it.ingredient)
        .map((it) => ({
          id: it.ingredient!.id,
          name: it.ingredient!.name,
          nameEn: it.ingredient!.nameEn,
          confidence: it.confidence,
        }));

      const unmatchedLabels = updated.items
        .filter((it) => !it.ingredient)
        .map((it) => ({ label: it.label, confidence: it.confidence }));

      return {
        detectionId: updated.id,
        imageUrl,
        modelName: updated.modelName,
        processMs: updated.processMs,
        matchedIngredients,
        unmatchedLabels,
      };
    } catch (err) {
      await prisma.detection.update({
        where: { id: detection.id },
        data: { status: 'FAILED' },
      });
      throw ApiError.internal('Detection failed');
    }
  },

  async history(userId: number | undefined, query: Record<string, unknown>) {
    const { page, limit, skip } = getPagination(query);
    const where = userId ? { userId } : {};
    const [items, total] = await Promise.all([
      prisma.detection.findMany({
        where,
        include: { items: { include: { ingredient: true } } },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.detection.count({ where }),
    ]);
    return { items, meta: buildMeta(total, page, limit) };
  },
};
