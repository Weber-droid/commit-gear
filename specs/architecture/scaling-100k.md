# Scaling for 100K Concurrent Users

Design constraints and implementation patterns for Commit Gear at scale.

## Capacity Assumptions

| Metric | Target |
|--------|--------|
| Concurrent connections | 100,000 |
| Catalog read ratio | 90% of traffic |
| Checkout write ratio | 5% of traffic |
| Auth/token refresh | 5% of traffic |
| Catalog p95 (cache hit) | < 100ms |
| Checkout p95 (excl. Paystack redirect) | < 500ms |

## Horizontal Scaling

Express API nodes are **stateless**. Session state lives in:
- JWT access tokens (client header)
- Refresh token hashes (MongoDB `users.refreshTokens`)
- Cart data (MongoDB `carts` collection)
- Catalog cache (Redis)

Deploy N API instances behind a load balancer. No sticky sessions required.

```
                    ┌─────────────┐
                    │ Load Balancer│
                    └──────┬──────┘
           ┌───────────────┼───────────────┐
           ▼               ▼               ▼
      ┌─────────┐    ┌─────────┐    ┌─────────┐
      │ API x1  │    │ API x2  │    │ API xN  │
      └────┬────┘    └────┬────┘    └────┬────┘
           └───────────────┼───────────────┘
                           ▼
              ┌────────────────────────┐
              │ Redis Cluster (cache)  │
              └────────────────────────┘
                           ▼
              ┌────────────────────────┐
              │ MongoDB Replica Set    │
              └────────────────────────┘
```

## MongoDB Connection Pooling

```javascript
mongoose.connect(MONGODB_URI, {
  maxPoolSize: 100,
  minPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
});
```

| Setting | Value | Rationale |
|---------|-------|-----------|
| `maxPoolSize` | 100 | Per-node ceiling; 10 nodes × 100 = 1000 total connections (within MongoDB limits) |
| `minPoolSize` | 10 | Warm connections for burst traffic |
| `socketTimeoutMS` | 45000 | Prevent hung queries from holding connections |

## Redis Caching Strategy

See [`../caching/redis-strategy.md`](../caching/redis-strategy.md) for key catalog and TTLs.

**Cache-aside pattern:**
1. Check Redis for key
2. On miss: query MongoDB, serialize, set with TTL
3. On product/category write: evict affected keys

**Target cache hit rate:** > 85% on catalog endpoints under normal load.

## Rate Limiting

| Endpoint group | Limit | Window |
|----------------|-------|--------|
| `/auth/*` | 100 requests | 15 minutes per IP |
| `/products`, `/categories` | 300 requests | 15 minutes per IP |
| `/orders/checkout` | 10 requests | 15 minutes per user |
| `/payments/webhook/paystack` | No limit | Paystack IP allowlist recommended |

Use `express-rate-limit` with Redis store for distributed rate limiting across nodes.

## Atomic Inventory (Concurrency Safety)

High-concurrency checkout requires atomic inventory decrements without pessimistic locking.

### Problem

Two users checkout the last item simultaneously. Read-modify-write causes overselling.

### Solution

MongoDB `findOneAndUpdate` with guard condition:

```javascript
const result = await Product.findOneAndUpdate(
  { _id: productId, inventory: { $gte: qty }, isActive: true },
  { $inc: { inventory: -qty } },
  { new: true }
);
// result === null means insufficient inventory
```

### Multi-Item Orders

Use MongoDB multi-document transactions (see [`../data/indexes.md`](../data/indexes.md)) to ensure all-or-nothing inventory decrements.

## Database Indexes

All catalog and order queries must use covered or indexed scans. See [`../data/indexes.md`](../data/indexes.md).

## File Upload Streaming

Product image uploads pipe directly to Cloudinary:

```
Client → multer (disk/memory stream) → Cloudinary upload_stream → response
```

Never buffer files > 1MB in Express process memory. Max upload: 5MB per spec.

## Monitoring (Phase 1 Implementation)

| Signal | Alert Threshold |
|--------|-----------------|
| API p95 latency | > 200ms for 5 min |
| MongoDB connection pool utilization | > 80% |
| Redis hit rate | < 70% for 10 min |
| Checkout inventory conflicts | > 50/min |
| Paystack webhook failures | > 5/min |

## Deployment Notes

- MongoDB: 3-node replica set minimum for production
- Redis: Sentinel or Cluster for HA
- API: auto-scale on CPU > 60% or request queue depth
- CDN: Cloudinary handles image delivery; API not in image path
