# ADR 004: Redis Cache with Write-Through Eviction

## Status

Accepted

## Context

Commit Gear targets 100K concurrent users with 90% catalog read traffic. MongoDB alone cannot serve product listings at required p95 < 100ms under peak load. Product and category data changes infrequently relative to reads.

## Decision

Use **Redis as a read-through cache** with **explicit eviction on writes**:

| Data | TTL | Eviction Trigger |
|------|-----|------------------|
| Categories list | 3600s | Any category CRUD |
| Product list (per filter hash) | 300s | Any product write |
| Product detail (per ID) | 600s | That product's PATCH/DELETE |
| Cart (per user) | No TTL | Cart mutations (read-through, not cached long-term) |

### Eviction Strategy

On product write (`POST`, `PATCH`, `DELETE /products`):
```
DEL products:list:* 
DEL products:detail:{id}
```

On category write:
```
DEL categories:all
DEL products:list:*
```

Use `SCAN` + `DEL` for pattern eviction (never `KEYS` in production).

## Consequences

### Positive

- Catalog p95 < 100ms on cache hit
- Reduces MongoDB read load by estimated 85%+
- TTL provides eventual consistency safety net
- Explicit eviction prevents stale data after admin/vendor edits

### Negative

- Cache invalidation complexity on writes
- Redis becomes a critical dependency (mitigated by cache-aside fallback to MongoDB)
- Pattern-based eviction has brief window where old list keys may exist until TTL expires

## Alternatives Considered

| Alternative | Rejected Because |
|-------------|------------------|
| No caching | Cannot meet p95 SLA at 100K concurrent |
| MongoDB only with read replicas | Higher latency than Redis; more expensive at scale |
| Write-through cache (sync on write) | Adds write latency; overkill for catalog |
| CDN cache for API responses | Cannot handle personalized/auth endpoints; stale risk |

## Compliance

- All catalog read endpoints check cache before MongoDB
- All product/category write endpoints trigger eviction
- `CacheProvider` interface allows Redis swap (see [`provider-abstractions.md`](../provider-abstractions.md))
- Cache miss must still return correct data (graceful degradation)

## Related

- [Redis Strategy](../../caching/redis-strategy.md)
- [Cache Key Catalog](../../caching/cache-key-catalog.md)
