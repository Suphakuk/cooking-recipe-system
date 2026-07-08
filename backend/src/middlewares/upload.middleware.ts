import multer from 'multer';
import { Request } from 'express';
import { env } from '../config/env';
import { ApiError } from '../utils/ApiError';

/**
 * Image uploads are handled in-memory (not written to disk) so the app works on
 * ephemeral cloud hosts (Render/Railway free tiers) that don't keep a persistent
 * filesystem between deploys or sleeps. The uploaded file is converted to a
 * base64 data URL and stored directly in the database.
 *
 * To switch to real cloud object storage later (S3, Cloudflare R2, etc.), replace
 * `fileToDataUrl` with an upload call that returns the public URL, and keep the
 * rest of the app unchanged.
 */

const storage = multer.memoryStorage();

const allowedMime = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

function fileFilter(
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) {
  if (allowedMime.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(ApiError.badRequest('Only image files (jpeg, png, webp, gif) are allowed'));
  }
}

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: env.upload.maxFileSizeMb * 1024 * 1024 },
});

/**
 * Convert an in-memory uploaded file to a base64 data URL, e.g.
 * "data:image/png;base64,iVBORw0K..." — safe to store in a text column and
 * render directly in an <img src>.
 */
export function fileToDataUrl(file: Express.Multer.File): string {
  const base64 = file.buffer.toString('base64');
  return `data:${file.mimetype};base64,${base64}`;
}
