# Cache Key Catalog

Complete registry of Redis keys used by Commit Gear.

## Key Registry

| Key | Type | TTL | Example | Set By | Invalidated By |
|-----|------|-----|---------|--------|----------------|
| `categories:all` | JSON array | 3600s | `categories:all` | `GET /categories` miss | Category CRUD |
| `products:list:{hash}` | JSON array + meta | 300s | `products:list:a3f8b2c1d4e5f6a7` | `GET /products` miss | Product/category write |
| `products:detail:{id}` | JSON object | 600s | `products:detail:507f1f77bcf86cd799439011` | `GET /products/:id` miss | Product PATCH/DELETE, admin inventory |

## Key Naming Convention

```
{domain}:{entity}:{identifier}
```

| Segment | Values |
|---------|--------|
| `domain` | `categories`, `products` |
| `entity` | `all`, `list`, `detail` |
| `identifier` | ObjectId or query hash |

## NOT Cached

| Data | Reason |
|------|--------|
| `cart:{userId}` | High write frequency; user-specific; low reuse |
| `orders:*` | User-specific; must be fresh |
| `auth:*` | Security-sensitive |
| `payments:*` | Transactional integrity |

## List Hash Inputs

The `{hash}` in `products:list:{hash}` is computed from:

```json
{
  "page": 1,
  "limit": 20,
  "category": "hoodies",
  "minPrice": null,
  "maxPrice": null,
  "q": null
}
```

Keys are sorted alphabetically before hashing for determinism.

## Memory Estimates

| Key Type | Avg Size | Max Keys (est.) | Total Memory |
|----------|----------|-----------------|--------------|
| `categories:all` | 2 KB | 1 | 2 KB |
| `products:list:{hash}` | 50 KB | 500 | 25 MB |
| `products:detail:{id}` | 5 KB | 1000 | 5 MB |

Total estimated: < 50 MB for catalog cache at scale.

## Debugging

```bash
# List all product list keys
redis-cli SCAN 0 MATCH products:list:* COUNT 100

# Inspect a key
redis-cli GET products:detail:507f1f77bcf86cd799439011

# Manual eviction (dev only)
redis-cli DEL categories:all
redis-cli --scan --pattern 'products:list:*' | xargs redis-cli DEL
```

## Related

- [Redis Strategy](redis-strategy.md)
