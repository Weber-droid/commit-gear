# Components

Key UI components for Commit Gear with props contracts and behavior specs.

## Layout Components

### `Header`

| Prop | Type | Description |
|------|------|-------------|
| — | — | Reads cart count from `useCart()` hook |

**Behavior:**
- Sticky top, `bg-zinc-950/80 backdrop-blur-sm border-b border-zinc-800`
- Cart icon shows `itemCount` badge when > 0
- Auth: "Sign In" / user menu based on `useAuth()`

### `CartDrawer`

| Prop | Type | Description |
|------|------|-------------|
| `open` | `boolean` | Drawer visibility |
| `onClose` | `() => void` | Close handler |

**Behavior:**
- Slides from right, `w-full max-w-md`
- Lists cart items with quantity steppers
- Optimistic updates on quantity change (see [data-fetching.md](data-fetching.md))
- Subtotal displayed in tabular-nums
- "Checkout" CTA navigates to `/checkout`
- Empty state: mono text `// cart is empty`

### `PageSkeleton`

Loading fallback for `Suspense` boundaries. Pulsing zinc-800 blocks matching page layout.

---

## Product Components

### `ProductCard`

| Prop | Type | Description |
|------|------|-------------|
| `product` | `Product` | Product data from API |
| `onAddToCart` | `(id: string) => void` | Optional quick-add handler |

**Layout:**
```
┌─────────────────────────┐
│      [Product Image]    │  aspect-square
│                         │
├─────────────────────────┤
│ git commit -m "In Stock"│  TerminalBadge
│ Product Title           │  text-sm font-medium
│ ₦45,000                 │  text-lg font-semibold tabular-nums
│ [Add to Cart]           │  secondary button
└─────────────────────────┘
```

### `TerminalBadge`

| Prop | Type | Description |
|------|------|-------------|
| `status` | `'in-stock' \| 'low-stock' \| 'out-of-stock'` | Inventory status |

Renders `git commit -m "{status}"` per [design-system.md](design-system.md).

### `ProductGrid`

| Prop | Type | Description |
|------|------|-------------|
| `products` | `Product[]` | |
| `isLoading` | `boolean` | Shows skeleton grid |
| `onAddToCart` | `(id: string) => void` | |

Responsive grid per design system `grid-cols-shop`.

### `ProductDetail`

| Prop | Type | Description |
|------|------|-------------|
| `product` | `Product` | |

**Layout:** Two-column on desktop (image gallery left, info right). Image gallery with thumbnail strip. Quantity selector + "Add to Cart" primary CTA.

---

## Cart Components

### `CartItemRow`

| Prop | Type | Description |
|------|------|-------------|
| `item` | `CartItem` | |
| `onUpdateQuantity` | `(productId, qty) => void` | Optimistic |
| `onRemove` | `(productId) => void` | Optimistic |

**Behavior:**
- Quantity stepper: `-` / count / `+` buttons
- Remove: ghost icon button (trash)
- Line total: `price * quantity` in tabular-nums
- Disable `+` when `quantity >= inventoryAvailable`

### `QuantityStepper`

| Prop | Type | Description |
|------|------|-------------|
| `value` | `number` | Current quantity |
| `min` | `number` | Default 1 |
| `max` | `number` | inventoryAvailable or 99 |
| `onChange` | `(value: number) => void` | |

---

## Checkout Components

### `ShippingForm`

| Prop | Type | Description |
|------|------|-------------|
| `onSubmit` | `(address: ShippingAddress) => void` | |
| `isLoading` | `boolean` | |

Fields match `ShippingAddress` schema from OpenAPI. Zod validation client-side.

### `OrderSummary`

| Prop | Type | Description |
|------|------|-------------|
| `cart` | `Cart` | |
| `isProcessing` | `boolean` | Disables submit |

Displays line items, subtotal, "Place Order" button.

### `PaymentRedirect`

Shown after `POST /payments/initialize` succeeds. Displays loading state while redirecting to Paystack `authorizationUrl`.

---

## Auth Components

### `LoginForm` / `RegisterForm`

Standard forms with Zod validation. On success, store access token in auth context, TanStack Query invalidates `['auth', 'me']`.

### `ProtectedRoute`

Redirects to `/login` if no valid access token. Attempts silent refresh before redirect.

### `AdminRoute`

Requires `role === 'admin'`. Redirects to `/` otherwise.

---

## Admin Components

### `AdminSidebar`

Navigation: Orders, Products, Vendors. Active state with `border-l-2 border-zinc-100`.

### `DataTable`

Generic table with pagination controls. Uses `meta` from paginated API responses.

### `InventoryOverrideModal`

Admin form for `PATCH /admin/products/:id/inventory`. Requires `inventory` and optional `reason`.

---

## Shared Components

### `Button`

| Variant | Usage |
|---------|-------|
| `primary` | Main CTAs |
| `secondary` | Add to cart, filters |
| `ghost` | Icon buttons, nav |
| `destructive` | Remove, cancel order |

### `Input` / `Select`

`bg-zinc-900 border border-zinc-800 focus:border-zinc-500 focus:ring-0 rounded-sm`.

### `Toast`

Success/error notifications. Position: bottom-right. Auto-dismiss 4s.

## Related

- [Design System](design-system.md)
- [Data Fetching](data-fetching.md)
