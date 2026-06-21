# Database Indexes

Compound and text indexes for Commit Gear MongoDB collections. All indexes are created at application startup via Mongoose `syncIndexes()` in a controlled migration step.

## Products

### Catalog Filter Index

```javascript
productSchema.index({ category: 1, price: 1, isActive: 1 });
```

**Rationale:** Supports `GET /products` with category filter and price range sort. `isActive` prefix filter avoids scanning deactivated products.

**Query pattern:**
```javascript
Product.find({
  isActive: true,
  category: 'hoodies',
  price: { $gte: minPrice, $lte: maxPrice }
}).sort({ price: 1 }).skip(skip).limit(limit);
```

### Full-Text Search Index

```javascript
productSchema.index({ title: 'text', description: 'text' });
```

**Rationale:** Powers `?q=` parameter on `GET /products`. Uses MongoDB text scoring.

**Query pattern:**
```javascript
Product.find(
  { $text: { $search: q }, isActive: true },
  { score: { $meta: 'textScore' } }
).sort({ score: { $meta: 'textScore' } });
```

### Vendor Dashboard Index

```javascript
productSchema.index({ vendorId: 1, createdAt: -1 });
```

**Rationale:** Vendor product listing sorted by newest first.

---

## Users

```javascript
userSchema.index({ email: 1 }, { unique: true });
```

---

## Orders

```javascript
orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ paymentReference: 1 }, { unique: true, sparse: true });
orderSchema.index({ paymentStatus: 1, status: 1 });
```

**Rationale:**
- User order history: `GET /orders`
- Paystack webhook lookup by reference
- Admin order filtering: `GET /admin/orders?paymentStatus=paid&status=processing`

---

## Carts

```javascript
cartSchema.index({ userId: 1 }, { unique: true });
```

---

## Categories

```javascript
categorySchema.index({ slug: 1 }, { unique: true });
```

---

## Atomic Inventory Pattern

Concurrent checkout must not oversell inventory. The spec mandates this exact update pattern — no table-level locks, no read-modify-write races.

### Single Product Decrement

```javascript
const updated = await Product.findOneAndUpdate(
  {
    _id: productId,
    inventory: { $gte: quantity },
    isActive: true,
  },
  { $inc: { inventory: -quantity } },
  { new: true }
);

if (!updated) {
  throw new InventoryConflictError(productId, quantity);
}
```

### Multi-Item Checkout (Transaction)

For orders with multiple items, wrap decrements in a MongoDB multi-document transaction:

```javascript
const session = await mongoose.startSession();
session.startTransaction();

try {
  for (const item of cartItems) {
    const updated = await Product.findOneAndUpdate(
      {
        _id: item.productId,
        inventory: { $gte: item.quantity },
        isActive: true,
      },
      { $inc: { inventory: -quantity } },
      { new: true, session }
    );

    if (!updated) {
      throw new InventoryConflictError(item.productId, item.quantity);
    }
  }

  const order = await Order.create([orderDoc], { session });
  await Cart.findOneAndUpdate(
    { userId },
    { $set: { items: [] } },
    { session }
  );

  await session.commitTransaction();
  return order[0];
} catch (error) {
  await session.abortTransaction();
  throw error;
} finally {
  session.endSession();
}
```

### Rollback on Payment Failure

If payment fails after checkout, inventory is **not** automatically restored. Admin or a scheduled job handles restocking for `cancelled` orders with `paymentStatus: failed` after a 30-minute grace period. This prevents inventory ping-pong during Paystack redirect flows.

---

## Index Rollout Order

1. `users.email` (unique) — required before auth
2. `categories.slug` (unique) — required before seed
3. `products` compound + text indexes — required before catalog
4. `carts.userId` (unique)
5. `orders` indexes — required before checkout

See [`migrations.md`](migrations.md) for seed data execution order.
