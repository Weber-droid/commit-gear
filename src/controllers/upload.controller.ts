import { Readable } from 'stream';
import type { Request, Response, NextFunction } from 'express';
import type { Container } from '../container.js';
import { ValidationError } from '../utils/AppError.js';
import { sendSuccess } from '../utils/response.js';

export function createUploadController(container: Container) {
  const { uploadService } = container;

  return {
    uploadImage: async (req: Request, res: Response, next: NextFunction) => {
      try {
        if (!req.file) {
          return next(new ValidationError('File is required'));
        }
        const result = await uploadService.uploadImage(
          Readable.from(req.file.buffer),
          req.file.mimetype,
          (req.body.folder as string) || 'products'
        );
        sendSuccess(
          res,
          {
            publicId: result.publicId,
            secureUrl: result.secureUrl,
            width: result.width,
            height: result.height,
            format: result.format,
          },
          201
        );
      } catch (e) {
        next(e);
      }
    },
  };
}
