export interface CheckoutInput {
  orderId: string;
  amount: number;
  email: string;
  metadata?: Record<string, string>;
  callbackUrl?: string;
}

export interface PaymentSession {
  authorizationUrl: string;
  reference: string;
  accessCode: string;
  provider: 'paystack';
}

export interface WebhookEvent {
  type: 'charge.success' | 'charge.failed';
  reference: string;
  amount: number;
  metadata: Record<string, unknown>;
}

export interface PaymentStatus {
  reference: string;
  status: 'pending' | 'paid' | 'failed';
  amount: number;
}

export interface PaymentProvider {
  readonly name: string;
  initializeCheckout(input: CheckoutInput): Promise<PaymentSession>;
  verifyWebhook(rawBody: Buffer, signature: string): Promise<WebhookEvent>;
  verifyTransaction(reference: string): Promise<PaymentStatus>;
}

export interface CacheProvider {
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: unknown, ttlSeconds?: number): Promise<void>;
  del(key: string | string[]): Promise<void>;
  delByPattern(pattern: string): Promise<void>;
  exists(key: string): Promise<boolean>;
}

export interface UploadResult {
  publicId: string;
  secureUrl: string;
  width: number;
  height: number;
  format: string;
}

export interface UploadOptions {
  folder?: string;
  maxBytes?: number;
  allowedMimeTypes?: string[];
}

export interface StorageProvider {
  uploadStream(
    stream: NodeJS.ReadableStream,
    options: UploadOptions
  ): Promise<UploadResult>;
  delete(publicId: string): Promise<void>;
}

export type UserRole = 'buyer' | 'vendor' | 'admin';
export type ProductCategory = 'hoodies' | 'keycaps' | 'desk-pads';
export type PaymentStatusType = 'pending' | 'paid' | 'failed' | 'refunded';
export type OrderStatusType = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export interface AuthUser {
  id: string;
  role: UserRole;
}
