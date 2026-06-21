# Migrations & Seed Data

Ordered steps for initializing a fresh Commit Gear database.

## Prerequisites

- MongoDB 6.0+
- Redis 7.0+ (cache layer, not persisted in MongoDB)
- Environment variables configured (see Phase 1 `backend/.env.example`)

## Rollout Order

### Step 1: Index Sync

Run `syncIndexes()` on all models in this order:

1. `User`
2. `Category`
3. `Product`
4. `Cart`
5. `Order`

Verify with:
```javascript
db.products.getIndexes()
db.orders.getIndexes()
```

### Step 2: Seed Categories

Insert canonical categories (idempotent upsert by `slug`):

```javascript
const categories = [
  { slug: 'hoodies', name: 'Hoodies', description: 'Premium developer hoodies', productCount: 0 },
  { slug: 'keycaps', name: 'Keycaps', description: 'Mechanical keyboard keycap sets', productCount: 0 },
  { slug: 'desk-pads', name: 'Desk Pads', description: 'Extended mouse pads for your battlestation', productCount: 0 },
];

for (const cat of categories) {
  await Category.findOneAndUpdate({ slug: cat.slug }, cat, { upsert: true, new: true });
}
```

### Step 3: Seed Admin User

Create initial admin (only if no admin exists):

| Field | Value |
|-------|-------|
| name | Commit Gear Admin |
| email | From `SEED_ADMIN_EMAIL` env var |
| password | From `SEED_ADMIN_PASSWORD` env var (hashed) |
| role | `admin` |
| emailVerified | `true` |

**Security:** Seed script must refuse to run in production without explicit `ALLOW_PRODUCTION_SEED=true`.

### Step 4: Seed Demo Products (Development Only)

Optional demo catalog for local development:

| Title | Category | Price (kobo) | Inventory |
|-------|----------|--------------|-----------|
| Commit Gear Hoodie — Graphite | hoodies | 4500000 | 42 |
| Mechanical Keycap Set — Terminal | keycaps | 2800000 | 100 |
| Desk Pad — Dark Mode | desk-pads | 1500000 | 75 |

Products require a valid `vendorId`. In dev seed, use the admin user or a seeded vendor.

After insert, update `productCount` on each category:
```javascript
await Category.updateOne(
  { slug: 'hoodies' },
  { $set: { productCount: await Product.countDocuments({ category: 'hoodies', isActive: true }) } }
);
```

### Step 5: Redis Warm-Up (Optional)

Pre-populate cache after seed:

```bash
# Triggered by seed script or first API request
GET /api/v1/categories   # warms categories:all
GET /api/v1/products     # warms products:list:{hash}
```

## Rollback

| Action | Command |
|--------|---------|
| Drop all collections | `db.dropDatabase()` (dev only) |
| Remove seed products | `Product.deleteMany({ vendorId: seedVendorId })` |
| Clear Redis cache | `FLUSHDB` on cache Redis instance |

## Production Notes

- No demo products in production
- Categories seeded once at deploy
- Admin created via secure bootstrap, not hardcoded passwords
- Index sync runs as part of deployment health check before traffic shift
