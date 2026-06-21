# Performance SLA

Non-functional performance requirements for Commit Gear.

## Latency Targets

| Endpoint Group | p50 | p95 | p99 | Condition |
|----------------|-----|-----|-----|-----------|
| `GET /categories` | 20ms | 50ms | 100ms | Cache hit |
| `GET /products` | 30ms | 100ms | 200ms | Cache hit |
| `GET /products` | 80ms | 250ms | 500ms | Cache miss |
| `GET /products/:id` | 20ms | 80ms | 150ms | Cache hit |
| `POST /auth/login` | 100ms | 300ms | 500ms | — |
| `POST /auth/refresh` | 50ms | 150ms | 300ms | — |
| `GET /cart` | 50ms | 150ms | 300ms | — |
| `POST /cart/items` | 80ms | 200ms | 400ms | — |
| `POST /orders/checkout` | 150ms | 500ms | 1000ms | Excl. Paystack |
| `POST /payments/initialize` | 200ms | 800ms | 1500ms | Includes Paystack API |
| `POST /payments/webhook/paystack` | 50ms | 200ms | 500ms | — |

## Throughput Targets

| Metric | Target |
|--------|--------|
| Concurrent connections | 100,000 |
| Catalog reads per second (aggregate) | 50,000 |
| Checkout transactions per second | 500 |
| Paystack webhooks per second | 200 |

## Availability

| Tier | Target |
|------|--------|
| API uptime | 99.9% (monthly) |
| MongoDB uptime | 99.95% |
| Redis uptime | 99.9% (graceful degradation on failure) |

## Frontend Performance

| Metric | Target |
|--------|--------|
| First Contentful Paint | < 1.5s (3G) |
| Largest Contentful Paint | < 2.5s (3G) |
| Initial JS bundle (gzipped) | < 150 KB |
| Time to Interactive | < 3.5s (3G) |
| Cumulative Layout Shift | < 0.1 |

## Scalability Design Points

1. **Stateless API** — horizontal scaling behind load balancer
2. **Redis cache** — 85%+ hit rate on catalog under normal load
3. **MongoDB connection pooling** — `maxPoolSize: 100` per node
4. **Compound indexes** — all catalog queries use indexed scans
5. **Atomic inventory** — no table locks; `$inc` with guard conditions
6. **Stream uploads** — no full-file buffering in Express memory
7. **Code splitting** — lazy-loaded routes in React SPA

## Load Testing Plan (Phase 1)

| Scenario | Tool | Pass Criteria |
|----------|------|---------------|
| Catalog browse | k6 | p95 < 100ms at 10K RPS with 85% cache hit |
| Concurrent checkout | k6 | 0 inventory oversell at 500 TPS |
| Auth storm | k6 | p95 < 300ms at 1K login/s |
| Soak test | k6 | No memory leak over 4 hours at 5K RPS |

## Monitoring Dashboards

| Dashboard | Key Panels |
|-----------|------------|
| API Overview | RPS, p50/p95/p99 latency, error rate |
| Cache | Hit rate, eviction count, Redis memory |
| Database | Connection pool, query duration, slow queries |
| Checkout | Checkout success rate, inventory conflicts, Paystack latency |
| Frontend | Core Web Vitals (RUM) |

## Related

- [Scaling Strategy](../architecture/scaling-100k.md)
- [Security](security.md)
- [Redis Strategy](../caching/redis-strategy.md)
