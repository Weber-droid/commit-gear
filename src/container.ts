import { env } from './config/env.js';
import { RedisCacheProvider } from './providers/RedisCacheProvider.js';
import { NullCacheProvider } from './providers/NullCacheProvider.js';
import {
  PaystackProvider,
  MockPaystackProvider,
} from './providers/PaystackProvider.js';
import {
  CloudinaryStorageProvider,
  MockStorageProvider,
} from './providers/CloudinaryStorageProvider.js';
import { AuthService } from './services/AuthService.js';
import { ProductService } from './services/ProductService.js';
import { CategoryService } from './services/CategoryService.js';
import { CartService } from './services/CartService.js';
import { OrderService } from './services/OrderService.js';
import { PaymentService } from './services/PaymentService.js';
import { UploadService } from './services/UploadService.js';
import { UserRepository } from './repositories/UserRepository.js';
import type { CacheProvider, PaymentProvider, StorageProvider } from './types/index.js';

export interface Container {
  cache: CacheProvider;
  paymentProvider: PaymentProvider;
  storageProvider: StorageProvider;
  authService: AuthService;
  productService: ProductService;
  categoryService: CategoryService;
  cartService: CartService;
  orderService: OrderService;
  paymentService: PaymentService;
  uploadService: UploadService;
  userRepo: UserRepository;
  redis?: RedisCacheProvider;
}

export async function createContainer(): Promise<Container> {
  let cache: CacheProvider;
  let redis: RedisCacheProvider | undefined;

  if (env.REDIS_URL) {
    redis = new RedisCacheProvider(env.REDIS_URL);
    await redis.connect();
    cache = redis;
  } else {
    cache = new NullCacheProvider();
  }

  const paymentProvider: PaymentProvider =
    env.PAYSTACK_SECRET_KEY && env.PAYSTACK_WEBHOOK_SECRET
      ? new PaystackProvider({
          secretKey: env.PAYSTACK_SECRET_KEY,
          webhookSecret: env.PAYSTACK_WEBHOOK_SECRET,
        })
      : new MockPaystackProvider();

  const storageProvider: StorageProvider =
    env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET
      ? new CloudinaryStorageProvider({
          cloudName: env.CLOUDINARY_CLOUD_NAME,
          apiKey: env.CLOUDINARY_API_KEY,
          apiSecret: env.CLOUDINARY_API_SECRET,
        })
      : new MockStorageProvider();

  const userRepo = new UserRepository();
  const authService = new AuthService(userRepo);
  const productService = new ProductService(undefined, undefined, cache);
  const categoryService = new CategoryService(undefined, undefined, cache);
  const cartService = new CartService();
  const orderService = new OrderService();
  const paymentService = new PaymentService(paymentProvider, orderService);
  const uploadService = new UploadService(storageProvider);

  return {
    cache,
    paymentProvider,
    storageProvider,
    authService,
    productService,
    categoryService,
    cartService,
    orderService,
    paymentService,
    uploadService,
    userRepo,
    redis,
  };
}
