# Provider Abstractions

Swappable provider interfaces for payment, cache, and storage. Core business logic depends on these interfaces, not concrete implementations.

## Design Principles

- **Open/Closed:** Add new providers without modifying services
- **Dependency Injection:** Providers passed into services at construction
- **Interface Segregation:** Small, focused interfaces per capability

## Payment Provider

Primary implementation: **Paystack**. Future: Stripe, Paystack alternatives.

```typescript
interface CheckoutInput {
  orderId: string;
  amount: number;          // minor units (kobo)
  email: string;
  metadata?: Record<string, string>;
  callbackUrl?: string;
}

interface PaymentSession {
  authorizationUrl: string;
  reference: string;
  accessCode: string;
  provider: 'paystack';
}

interface WebhookEvent {
  type: 'charge.success' | 'charge.failed';
  reference: string;
  amount: number;
  metadata: Record<string, unknown>;
}

interface PaymentStatus {
  reference: string;
  status: 'pending' | 'paid' | 'failed';
  amount: number;
}

interface PaymentProvider {
  readonly name: string;
  initializeCheckout(input: CheckoutInput): Promise<PaymentSession>;
  verifyWebhook(rawBody: Buffer, signature: string): Promise<WebhookEvent>;
  verifyTransaction(reference: string): Promise<PaymentStatus>;
}
```

### Paystack Adapter Responsibilities

| Method | Paystack API |
|--------|--------------|
| `initializeCheckout` | `POST /transaction/initialize` |
| `verifyWebhook` | HMAC SHA512 of raw body with webhook secret |
| `verifyTransaction` | `GET /transaction/verify/:reference` |

### Registration (DI Container)

```typescript
container.register('paymentProvider', () => new PaystackProvider({
  secretKey: config.PAYSTACK_SECRET_KEY,
  webhookSecret: config.PAYSTACK_WEBHOOK_SECRET,
}));
```

---

## Cache Provider

Primary implementation: **Redis**. Future: Memcached.

```typescript
interface CacheProvider {
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: unknown, ttlSeconds?: number): Promise<void>;
  del(key: string | string[]): Promise<void>;
  delByPattern(pattern: string): Promise<void>;
  exists(key: string): Promise<boolean>;
}
```

### Redis Adapter Notes

- Serialization: JSON (`JSON.stringify` / `JSON.parse`)
- `delByPattern`: uses `SCAN` + `DEL` (never `KEYS` in production)
- Connection: `ioredis` with retry strategy and connection pooling

### Null Cache (Testing)

```typescript
class NullCacheProvider implements CacheProvider {
  async get() { return null; }
  async set() {}
  async del() {}
  async delByPattern() {}
  async exists() { return false; }
}
```

---

## Storage Provider

Primary implementation: **Cloudinary**. Future: S3, local filesystem (dev).

```typescript
interface UploadResult {
  publicId: string;
  secureUrl: string;
  width: number;
  height: number;
  format: string;
}

interface UploadOptions {
  folder?: string;
  maxBytes?: number;
  allowedMimeTypes?: string[];
}

interface StorageProvider {
  uploadStream(
    stream: NodeJS.ReadableStream,
    options: UploadOptions
  ): Promise<UploadResult>;
  delete(publicId: string): Promise<void>;
}
```

### Cloudinary Adapter Responsibilities

- Pipe incoming multipart stream to `cloudinary.uploader.upload_stream`
- Enforce 5MB max, JPEG/PNG/WebP MIME types
- Apply folder prefix: `products/`
- Return WebP-optimized URL when transformation applied

---

## Provider Factory

```typescript
interface ProviderRegistry {
  payment: PaymentProvider;
  cache: CacheProvider;
  storage: StorageProvider;
}

function createProviders(config: AppConfig): ProviderRegistry {
  return {
    payment: new PaystackProvider(config.paystack),
    cache: new RedisCacheProvider(config.redis),
    storage: new CloudinaryStorageProvider(config.cloudinary),
  };
}
```

## Testing Strategy

| Provider | Test Approach |
|----------|---------------|
| Payment | Mock `PaymentProvider` in unit tests; Paystack sandbox in integration |
| Cache | `NullCacheProvider` or `ioredis-mock` |
| Storage | Mock stream upload; Cloudinary test credentials for E2E |

## Related Documents

- [ADR 002: Paystack Primary](adr/002-paystack-primary.md)
- [ADR 004: Redis Cache Invalidation](adr/004-redis-cache-invalidation.md)
- [Payments API](../api/domains/payments.yaml)
