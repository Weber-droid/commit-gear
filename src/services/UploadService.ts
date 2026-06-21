import type { StorageProvider } from '../types/index.js';

import { ValidationError } from '../utils/AppError.js';

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);

export class UploadService {
  constructor(private readonly storage: StorageProvider) {}

  async uploadImage(stream: NodeJS.ReadableStream, mimeType: string, folder = 'products') {
    if (!ALLOWED_MIME.has(mimeType)) {
      throw new ValidationError('Invalid file type');
    }

    return this.storage.uploadStream(stream, {
      folder,
      maxBytes: 5 * 1024 * 1024,
      allowedMimeTypes: [...ALLOWED_MIME],
    });
  }
}
