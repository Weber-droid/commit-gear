import { z } from 'zod';

export const objectIdSchema = z.string().regex(/^[a-f0-9]{24}$/);

export const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const productListSchema = paginationSchema.extend({
  category: z.enum(['hoodies', 'keycaps', 'desk-pads']).optional(),
  minPrice: z.coerce.number().int().min(0).optional(),
  maxPrice: z.coerce.number().int().min(0).optional(),
  q: z.string().max(200).optional(),
});

export const createProductSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(5000),
  price: z.number().int().min(1),
  category: z.enum(['hoodies', 'keycaps', 'desk-pads']),
  images: z.array(z.string().url()).min(1).max(10),
  inventory: z.number().int().min(0),
});

export const updateProductSchema = createProductSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export const createCategorySchema = z.object({
  slug: z.enum(['hoodies', 'keycaps', 'desk-pads']),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
});

export const updateCategorySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
});

export const cartItemSchema = z.object({
  productId: objectIdSchema,
  quantity: z.number().int().min(1).max(99),
});

export const updateCartItemSchema = z.object({
  quantity: z.number().int().min(1).max(99),
});

export const shippingAddressSchema = z.object({
  fullName: z.string().min(1).max(100),
  line1: z.string().min(1).max(200),
  line2: z.string().max(200).optional(),
  city: z.string().min(1).max(100),
  state: z.string().min(1).max(100),
  country: z.string().length(2),
  postalCode: z.string().min(1).max(20),
});

export const checkoutSchema = z.object({
  shippingAddress: shippingAddressSchema,
});

export const paymentInitSchema = z.object({
  orderId: objectIdSchema,
  callbackUrl: z.string().url().optional(),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(['pending', 'processing', 'shipped', 'delivered', 'cancelled']),
});

export const inventoryOverrideSchema = z.object({
  inventory: z.number().int().min(0),
  reason: z.string().max(500).optional(),
});
