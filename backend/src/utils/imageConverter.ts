import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';
import { logger } from './logger';

// Longest side cap — matches the widest real render target in the app (the
// course/lesson hero banner, fluid up to ~1150px, at 2x retina). Anything
// smaller is left at its native size (withoutEnlargement) so small
// thumbnails never get upscaled/blurred.
const MAX_DIMENSION_PX = 1920;
const WEBP_QUALITY = 80;

export interface ConvertedImage {
  /** New filename on disk (always .webp), replacing the original file. */
  filename: string;
  mimeType: 'image/webp';
  sizeBytes: number;
  sizeKB: number;
}

/**
 * Converts an uploaded image in place: re-encodes to WebP, caps its longest
 * side at MAX_DIMENSION_PX, and deletes the original file once the .webp
 * replacement is written. Every image uploaded through the app (course
 * banners, lesson blocks, image/text thumbnails) goes through this so
 * storage stays small and every learner gets a fast-loading, consistently
 * formatted image regardless of what the content creator originally uploaded.
 */
export async function convertImageToWebp(uploadsDir: string, originalFilename: string): Promise<ConvertedImage> {
  const originalPath = path.join(uploadsDir, originalFilename);
  const webpFilename = `${path.parse(originalFilename).name}.webp`;
  const webpPath = path.join(uploadsDir, webpFilename);
  // Write to a distinct temp path first — sharp can't safely read and write
  // the same file (it happens when the upload was already a .webp), and a
  // rename is atomic so a crash mid-conversion never leaves a half-written file.
  const tempPath = path.join(uploadsDir, `${path.parse(originalFilename).name}.converting.webp`);

  await sharp(originalPath)
    .resize({
      width: MAX_DIMENSION_PX,
      height: MAX_DIMENSION_PX,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .webp({ quality: WEBP_QUALITY })
    .toFile(tempPath);

  if (originalPath !== webpPath) {
    await fs.unlink(originalPath).catch((err) => {
      logger.warn('Failed to remove pre-conversion original upload', {
        file: originalFilename,
        message: err instanceof Error ? err.message : 'unknown error',
      });
    });
  }
  await fs.rename(tempPath, webpPath);

  const { size } = await fs.stat(webpPath);

  return {
    filename: webpFilename,
    mimeType: 'image/webp',
    sizeBytes: size,
    sizeKB: Math.round((size / 1024) * 10) / 10,
  };
}
