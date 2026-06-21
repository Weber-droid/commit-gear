import { v2 as cloudinary } from 'cloudinary';
import type { StorageProvider, UploadOptions, UploadResult } from '../types/index.js';
import { AppError } from '../utils/AppError.js';

interface CloudinaryConfig {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
}

export class CloudinaryStorageProvider implements StorageProvider {
  constructor(config: CloudinaryConfig) {
    cloudinary.config({
      cloud_name: config.cloudName,
      api_key: config.apiKey,
      api_secret: config.apiSecret,
    });
  }

  uploadStream(streamIn: NodeJS.ReadableStream, options: UploadOptions = {}): Promise<UploadResult> {
    const folder = options.folder ?? 'products';
    const maxBytes = options.maxBytes ?? 5 * 1024 * 1024;

    return new Promise((resolve, reject) => {
      const upload = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'image',
          format: 'webp',
          transformation: [{ quality: 'auto' }],
        },
        (error, result) => {
          if (error || !result) {
            reject(new AppError('Image upload failed', 500, 'UPLOAD_FAILED'));
            return;
          }
          resolve({
            publicId: result.public_id,
            secureUrl: result.secure_url,
            width: result.width,
            height: result.height,
            format: result.format,
          });
        }
      );

      const stream = streamIn as NodeJS.ReadableStream & { destroy?: () => void };
      let bytes = 0;
      stream.on('data', (chunk: Buffer) => {
        bytes += chunk.length;
        if (bytes > maxBytes) {
          stream.destroy?.();
          reject(new AppError('File exceeds maximum size of 5MB', 400, 'FILE_TOO_LARGE'));
        }
      });

      stream.pipe(upload);
    });
  }

  async delete(publicId: string): Promise<void> {
    await cloudinary.uploader.destroy(publicId);
  }
}

export class MockStorageProvider implements StorageProvider {
  async uploadStream(_stream: NodeJS.ReadableStream, options: UploadOptions = {}): Promise<UploadResult> {
    const folder = options.folder ?? 'products';
    const publicId = `${folder}/mock-${Date.now()}`;
    return {
      publicId,
      secureUrl: `https://res.cloudinary.com/commitgear/image/upload/${publicId}.webp`,
      width: 1200,
      height: 1200,
      format: 'webp',
    };
  }

  async delete(): Promise<void> {}
}
