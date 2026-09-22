import multer from 'multer';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdirSync } from 'node:fs';

const root = path.dirname(fileURLToPath(import.meta.url));
export const uploadDir = path.join(root, '..', 'uploads');
mkdirSync(uploadDir, { recursive: true });

export const upload = multer({
  dest: uploadDir,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, done) => done(null, ['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype))
});
