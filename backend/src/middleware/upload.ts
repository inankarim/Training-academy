import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import fs from 'fs';
import { randomUUID } from 'crypto';
import { Request } from 'express';

// Local disk storage — the project has no external storage provider (S3,
// Cloudinary, etc.) configured, and course/lesson content only ever stores a
// reference/URL, never binary data, so this is the "existing architecture"
// to follow rather than introducing a new dependency.
export const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const ALLOWED_MIME_PREFIXES = ['image/', 'video/'];
const ALLOWED_EXACT_MIME_TYPES = ['application/pdf'];
const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50MB — comfortably covers course banners, short videos, PDFs

function isAllowedMimeType(mimeType: string): boolean {
  return ALLOWED_MIME_PREFIXES.some((prefix) => mimeType.startsWith(prefix)) || ALLOWED_EXACT_MIME_TYPES.includes(mimeType);
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${randomUUID()}${ext}`);
  },
});

function fileFilter(_req: Request, file: Express.Multer.File, cb: FileFilterCallback) {
  if (!isAllowedMimeType(file.mimetype)) {
    cb(new Error('Unsupported file type. Only images, videos, and PDFs are allowed.'));
    return;
  }
  cb(null, true);
}

export const uploadMedia = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
});
