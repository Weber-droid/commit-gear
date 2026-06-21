import { Router } from 'express';
import multer from 'multer';
import type { Container } from '../container.js';
import { validate } from '../middleware/validate.js';
import { createAuthMiddleware, authorize } from '../middleware/auth.js';
import {
  createAuthController,
  createProductController,
  createCategoryController,
  createCartController,
  createOrderController,
  createPaymentController,
  createUploadController,
  createAdminController,
} from '../controllers/index.js';
import {
  registerSchema,
  loginSchema,
  paginationSchema,
  productListSchema,
  createProductSchema,
  updateProductSchema,
  createCategorySchema,
  updateCategorySchema,
  cartItemSchema,
  updateCartItemSchema,
  checkoutSchema,
  paymentInitSchema,
  updateOrderStatusSchema,
  inventoryOverrideSchema,
  objectIdSchema,
} from '../validators/schemas.js';
import { z } from 'zod';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

export function createApiRouter(container: Container): Router {
  const router = Router();
  const authenticate = createAuthMiddleware(container.authService);

  const auth = createAuthController(container);
  const products = createProductController(container);
  const categories = createCategoryController(container);
  const cart = createCartController(container);
  const orders = createOrderController(container);
  const payments = createPaymentController(container);
  const uploads = createUploadController(container);
  const admin = createAdminController(container);

  // Auth
  router.post('/auth/register', validate(registerSchema), auth.register);
  router.post('/auth/login', validate(loginSchema), auth.login);
  router.post('/auth/refresh', auth.refresh);
  router.post('/auth/logout', authenticate, auth.logout);
  router.get('/auth/me', authenticate, auth.me);

  // Products
  router.get('/products', validate(productListSchema, 'query'), products.list);
  router.get('/products/:id', validate(z.object({ id: objectIdSchema }), 'params'), products.getById);
  router.post('/products', authenticate, authorize('vendor', 'admin'), validate(createProductSchema), products.create);
  router.patch(
    '/products/:id',
    authenticate,
    authorize('vendor', 'admin'),
    validate(z.object({ id: objectIdSchema }), 'params'),
    validate(updateProductSchema),
    products.update
  );
  router.delete(
    '/products/:id',
    authenticate,
    authorize('vendor', 'admin'),
    validate(z.object({ id: objectIdSchema }), 'params'),
    products.delete
  );

  // Categories
  router.get('/categories', categories.list);
  router.get('/categories/:id', validate(z.object({ id: objectIdSchema }), 'params'), categories.getById);
  router.post('/categories', authenticate, authorize('admin'), validate(createCategorySchema), categories.create);
  router.patch(
    '/categories/:id',
    authenticate,
    authorize('admin'),
    validate(z.object({ id: objectIdSchema }), 'params'),
    validate(updateCategorySchema),
    categories.update
  );
  router.delete(
    '/categories/:id',
    authenticate,
    authorize('admin'),
    validate(z.object({ id: objectIdSchema }), 'params'),
    categories.delete
  );

  // Cart
  router.get('/cart', authenticate, authorize('buyer', 'vendor', 'admin'), cart.get);
  router.delete('/cart', authenticate, authorize('buyer', 'vendor', 'admin'), cart.clear);
  router.post('/cart/items', authenticate, authorize('buyer', 'vendor', 'admin'), validate(cartItemSchema), cart.addItem);
  router.patch(
    '/cart/items/:productId',
    authenticate,
    authorize('buyer', 'vendor', 'admin'),
    validate(z.object({ productId: objectIdSchema }), 'params'),
    validate(updateCartItemSchema),
    cart.updateItem
  );
  router.delete(
    '/cart/items/:productId',
    authenticate,
    authorize('buyer', 'vendor', 'admin'),
    validate(z.object({ productId: objectIdSchema }), 'params'),
    cart.removeItem
  );

  // Orders
  router.post('/orders/checkout', authenticate, authorize('buyer', 'vendor', 'admin'), validate(checkoutSchema), orders.checkout);
  router.get(
    '/orders',
    authenticate,
    authorize('buyer', 'vendor', 'admin'),
    validate(paginationSchema.extend({ status: z.enum(['pending', 'processing', 'shipped', 'delivered', 'cancelled']).optional() }), 'query'),
    orders.list
  );
  router.get(
    '/orders/:id',
    authenticate,
    authorize('buyer', 'vendor', 'admin'),
    validate(z.object({ id: objectIdSchema }), 'params'),
    orders.getById
  );
  router.patch(
    '/orders/:id/status',
    authenticate,
    authorize('admin'),
    validate(z.object({ id: objectIdSchema }), 'params'),
    validate(updateOrderStatusSchema),
    orders.updateStatus
  );

  // Payments
  router.post('/payments/initialize', authenticate, authorize('buyer', 'vendor', 'admin'), validate(paymentInitSchema), payments.initialize);
  router.post('/payments/webhook/paystack', payments.webhook);
  router.get(
    '/payments/verify/:reference',
    authenticate,
    authorize('buyer', 'vendor', 'admin'),
    payments.verify
  );

  // Uploads
  router.post(
    '/uploads/images',
    authenticate,
    authorize('vendor', 'admin'),
    upload.single('file'),
    uploads.uploadImage
  );

  // Admin
  router.get('/admin/vendors', authenticate, authorize('admin'), validate(paginationSchema, 'query'), admin.listVendors);
  router.post(
    '/admin/vendors/:id/approve',
    authenticate,
    authorize('admin'),
    validate(z.object({ id: objectIdSchema }), 'params'),
    admin.approveVendor
  );
  router.get(
    '/admin/orders',
    authenticate,
    authorize('admin'),
    validate(
      paginationSchema.extend({
        paymentStatus: z.enum(['pending', 'paid', 'failed', 'refunded']).optional(),
        status: z.enum(['pending', 'processing', 'shipped', 'delivered', 'cancelled']).optional(),
      }),
      'query'
    ),
    admin.listOrders
  );
  router.patch(
    '/admin/products/:id/inventory',
    authenticate,
    authorize('admin'),
    validate(z.object({ id: objectIdSchema }), 'params'),
    validate(inventoryOverrideSchema),
    admin.overrideInventory
  );

  return router;
}
