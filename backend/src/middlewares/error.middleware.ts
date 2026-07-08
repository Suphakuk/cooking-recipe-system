import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { ApiError } from '../utils/ApiError';
import { sendError } from '../utils/apiResponse';
import { env } from '../config/env';

// Detect a Prisma known-request error without importing the class directly
// (keeps this working even before `prisma generate` has run).
function isPrismaKnownError(err: unknown): err is { code: string; meta?: Record<string, unknown> } {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    typeof (err as { code: unknown }).code === 'string' &&
    (err as { code: string }).code.startsWith('P')
  );
}

export function notFoundHandler(req: Request, res: Response) {
  return sendError(res, `Route not found: ${req.method} ${req.originalUrl}`, 404);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  // Zod validation errors
  if (err instanceof ZodError) {
    const details = err.errors.map((e) => ({
      path: e.path.join('.'),
      message: e.message,
    }));
    return sendError(res, 'Validation failed', 400, details);
  }

  // Custom API errors
  if (err instanceof ApiError) {
    return sendError(res, err.message, err.statusCode, err.details);
  }

  // Prisma known errors (detected by code shape)
  if (isPrismaKnownError(err)) {
    if (err.code === 'P2002') {
      const target = (err.meta?.target as string[])?.join(', ') ?? 'field';
      return sendError(res, `Duplicate value for unique field: ${target}`, 409);
    }
    if (err.code === 'P2025') {
      return sendError(res, 'Record not found', 404);
    }
    return sendError(res, `Database error: ${err.code}`, 400);
  }

  // Fallback
  const message = err instanceof Error ? err.message : 'Internal server error';
  if (!env.isProd) {
    // eslint-disable-next-line no-console
    console.error('[ERROR]', err);
  }
  return sendError(res, env.isProd ? 'Internal server error' : message, 500);
}
