import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createUploadController } from '../../src/controllers/upload.controller.js';
import { createMockContainer } from '../helpers/container.js';
import { createMockReq, createMockRes, createMockNext, expectSuccess } from '../helpers/http.js';

describe('UploadController', () => {
  const container = createMockContainer();
  const controller = createUploadController(container);
  const { uploadService } = container;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('uploadImage', () => {
    it('uploads image and returns metadata with 201', async () => {
      const uploadResult = {
        publicId: 'products/abc',
        secureUrl: 'https://cdn.example/abc.jpg',
        width: 800,
        height: 600,
        format: 'jpg',
      };
      vi.mocked(uploadService.uploadImage).mockResolvedValue(uploadResult);
      const req = createMockReq({
        file: {
          buffer: Buffer.from('fake-image'),
          mimetype: 'image/jpeg',
          originalname: 'photo.jpg',
          size: 1024,
        } as Express.Multer.File,
        body: { folder: 'products' },
      });
      const res = createMockRes();

      await controller.uploadImage(req, res, createMockNext());

      expect(uploadService.uploadImage).toHaveBeenCalledWith(
        expect.any(Object),
        'image/jpeg',
        'products'
      );
      expectSuccess(res, uploadResult, 201);
    });

    it('defaults folder to products when not provided', async () => {
      vi.mocked(uploadService.uploadImage).mockResolvedValue({
        publicId: 'products/abc',
        secureUrl: 'https://cdn.example/abc.jpg',
        width: 800,
        height: 600,
        format: 'jpg',
      });
      const req = createMockReq({
        file: {
          buffer: Buffer.from('fake-image'),
          mimetype: 'image/png',
        } as Express.Multer.File,
        body: {},
      });

      await controller.uploadImage(req, createMockRes(), createMockNext());

      expect(uploadService.uploadImage).toHaveBeenCalledWith(expect.any(Object), 'image/png', 'products');
    });

    it('returns validation error when file is missing', async () => {
      const next = createMockNext();

      await controller.uploadImage(createMockReq({ file: undefined }), createMockRes(), next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 400, code: 'VALIDATION_ERROR', message: 'File is required' })
      );
      expect(uploadService.uploadImage).not.toHaveBeenCalled();
    });
  });
});
