# Data Models

Mongoose model contracts for Commit Gear. Field names and types must match OpenAPI schemas in [`../api/openapi.yaml`](../api/openapi.yaml).

## User

Collection: `users`

| Field | Mongoose Type | Validation | Notes |
|-------|---------------|------------|-------|
| `name` | `String` | required, trim, min 2, max 100 | Display name |
| `email` | `String` | required, unique, lowercase, trim | Indexed unique |
| `password` | `String` | required, min 8, `select: false` | bcrypt hash (cost factor 12) |
| `role` | `String` | enum: `buyer`, `vendor`, `admin` | Default: `buyer` |
| `emailVerified` | `Boolean` | default: `false` | |
| `refreshTokens` | `[RefreshTokenSubdoc]` | max 5 active tokens | See subdocument below |
| `createdAt` | `Date` | timestamps | |
| `updatedAt` | `Date` | timestamps | |

### RefreshToken Subdocument

| Field | Type | Notes |
|-------|------|-------|
| `tokenHash` | `String` | SHA-256 hash of raw refresh token |
| `expiresAt` | `Date` | TTL index for automatic cleanup |
| `createdAt` | `Date` | default: `Date.now` |

### Indexes

```javascript
{ email: 1 }                           // unique
{ 'refreshTokens.expiresAt': 1 }       // TTL: expireAfterSeconds on subdoc (optional)
```

### Password Rules

- Minimum 8 characters
- Hashed with `bcrypt` before save (pre-save hook)
- Never returned in API responses or JWT payload

---

## Product

Collection: `products`

| Field | Mongoose Type | Validation | Notes |
|-------|---------------|------------|-------|
| `title` | `String` | required, trim, max 200 | Text index |
| `description` | `String` | required, max 5000 | Text index |
| `price` | `Number` | required, min 1, integer | Minor units (kobo) |
| `category` | `String` | enum: `hoodies`, `keycaps`, `desk-pads` | |
| `images` | `[String]` | required, min 1, max 10 | Cloudinary URLs |
| `inventory` | `Number` | required, min 0, integer | Atomic decrement target |
| `vendorId` | `ObjectId` | required, ref: `User` | |
| `isActive` | `Boolean` | default: `true` | Soft delete flag |
| `createdAt` | `Date` | timestamps | |
| `updatedAt` | `Date` | timestamps | |

### Indexes

See [`indexes.md`](indexes.md) for compound and text index definitions.

---

## Cart

Collection: `carts`

| Field | Mongoose Type | Validation | Notes |
|-------|---------------|------------|-------|
| `userId` | `ObjectId` | required, unique, ref: `User` | One cart per user |
| `items` | `[CartItemSubdoc]` | | |
| `updatedAt` | `Date` | timestamps | |

### CartItem Subdocument

| Field | Type | Notes |
|-------|------|-------|
| `productId` | `ObjectId` | ref: `Product` |
| `quantity` | `Number` | min 1, max 99 |

Price, title, and image are **not stored** on cart items — resolved at read time from Product collection for freshness.

### Indexes

```javascript
{ userId: 1 }  // unique
```

---

## Order

Collection: `orders`

| Field | Mongoose Type | Validation | Notes |
|-------|---------------|------------|-------|
| `userId` | `ObjectId` | required, ref: `User` | |
| `items` | `[OrderItemSnapshot]` | required, min 1 | Immutable after creation |
| `totalAmount` | `Number` | required, integer | Sum at checkout time |
| `paymentStatus` | `String` | enum: `pending`, `paid`, `failed`, `refunded` | |
| `paymentProvider` | `String` | enum: `paystack` | |
| `paymentReference` | `String` | sparse, unique | Paystack reference |
| `status` | `String` | enum: `pending`, `processing`, `shipped`, `delivered`, `cancelled` | |
| `shippingAddress` | `ShippingAddressSubdoc` | required | |
| `createdAt` | `Date` | timestamps | |
| `updatedAt` | `Date` | timestamps | |

### OrderItemSnapshot Subdocument

Immutable snapshot frozen at checkout:

| Field | Type | Notes |
|-------|------|-------|
| `productId` | `ObjectId` | ref: `Product` |
| `title` | `String` | Product title at checkout |
| `priceAtPurchase` | `Number` | Unit price in minor units |
| `quantity` | `Number` | min 1 |
| `imageSnapshot` | `String` | Primary image URL at checkout |

### ShippingAddress Subdocument

| Field | Type | Required |
|-------|------|----------|
| `fullName` | `String` | yes |
| `line1` | `String` | yes |
| `line2` | `String` | no |
| `city` | `String` | yes |
| `state` | `String` | yes |
| `country` | `String` | yes (ISO 3166-1 alpha-2) |
| `postalCode` | `String` | yes |

### Indexes

```javascript
{ userId: 1, createdAt: -1 }
{ paymentReference: 1 }              // sparse unique
{ paymentStatus: 1, status: 1 }      // admin queries
```

---

## Category

Collection: `categories`

| Field | Mongoose Type | Validation | Notes |
|-------|---------------|------------|-------|
| `slug` | `String` | required, unique, enum: `hoodies`, `keycaps`, `desk-pads` | |
| `name` | `String` | required, max 100 | |
| `description` | `String` | max 500 | |
| `productCount` | `Number` | default: 0 | Denormalized; updated on product CRUD |
| `createdAt` | `Date` | timestamps | |
| `updatedAt` | `Date` | timestamps | |

### Indexes

```javascript
{ slug: 1 }  // unique
```

---

## Schema Alignment Checklist

| OpenAPI Schema | Mongoose Collection | Aligned |
|----------------|---------------------|---------|
| `User` | `users` | yes |
| `Product` | `products` | yes |
| `Order` / `OrderItemSnapshot` | `orders` | yes |
| `Cart` / `CartItem` | `carts` | yes (CartItem resolved at read) |
| `Category` | `categories` | yes |
