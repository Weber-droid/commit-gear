# Security

Security controls and requirements for Commit Gear.

## HTTP Security Headers

Via `helmet` middleware:

| Header | Value |
|--------|-------|
| `Content-Security-Policy` | `default-src 'self'; img-src 'self' https://res.cloudinary.com; script-src 'self'` |
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` |
| `X-XSS-Protection` | `0` (disabled; CSP preferred) |

## CORS

```typescript
cors({
  origin: config.CORS_ORIGINS, // ['https://commitgear.com', 'http://localhost:5173']
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});
```

## Rate Limiting

| Route Group | Limit | Window | Key |
|-------------|-------|--------|-----|
| `/auth/*` | 100 | 15 min | IP |
| `/products`, `/categories` | 300 | 15 min | IP |
| `/orders/checkout` | 10 | 15 min | User ID |
| `/uploads/*` | 20 | 15 min | User ID |
| Global fallback | 1000 | 15 min | IP |

Use Redis-backed store for distributed rate limiting across API nodes.

## Input Sanitization

| Library | Purpose |
|---------|---------|
| `express-mongo-sanitize` | Prevent NoSQL injection (`$gt`, `$where` in body) |
| `xss-clean` | Strip HTML/script from string inputs |
| Zod validators | Schema validation on all route inputs |

## Authentication Security

| Control | Implementation |
|---------|----------------|
| Password hashing | bcrypt, cost factor 12 |
| Access token lifetime | 15 minutes |
| Refresh token storage | HttpOnly, Secure, SameSite=Strict cookie |
| Refresh token server storage | SHA-256 hash only |
| Token rotation | Single-use refresh tokens |
| JWT payload | `sub` + `role` only (no PII) |
| Failed login lockout | 10 attempts per 15 min per email |

## Paystack Webhook Security

```typescript
function verifyPaystackSignature(rawBody: Buffer, signature: string): boolean {
  const hash = crypto
    .createHmac('sha512', config.PAYSTACK_WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex');
  return hash === signature;
}
```

| Rule | Detail |
|------|--------|
| Verify signature | Before any processing |
| Idempotent processing | Duplicate `charge.success` is no-op |
| Amount validation | Webhook amount must match order `totalAmount` |
| Raw body parsing | Use `express.raw()` for webhook route only |

## Authorization

- Role-based access per [roles-and-permissions.md](../auth/roles-and-permissions.md)
- Resource ownership checks (vendor owns product, buyer owns order)
- Admin routes behind `authorize('admin')` middleware

## Data Protection

| Data | Protection |
|------|------------|
| Passwords | bcrypt hash, `select: false`, never in responses |
| Refresh tokens | Hash stored, raw never logged |
| Payment references | Stored on order, not in client localStorage |
| PII (email, address) | HTTPS only, not in JWT |

## File Upload Security

| Control | Value |
|---------|-------|
| Max file size | 5 MB |
| Allowed MIME types | `image/jpeg`, `image/png`, `image/webp` |
| Magic byte validation | Verify file header matches declared MIME |
| Upload auth | Vendor or admin only |
| Storage | Cloudinary (no local disk persistence) |

## Error Response Security

- Production 500 responses: generic message, no stack trace
- Stack traces logged server-side only
- Operational errors (4xx): safe messages, no internal paths

## Dependency Security

- `npm audit` in CI pipeline
- Dependabot enabled on GitHub repository
- Pin major versions in `package.json`

## Secrets Management

| Secret | Storage |
|--------|---------|
| `JWT_SECRET` | Environment variable / secrets manager |
| `PAYSTACK_SECRET_KEY` | Environment variable / secrets manager |
| `PAYSTACK_WEBHOOK_SECRET` | Environment variable / secrets manager |
| `MONGODB_URI` | Environment variable / secrets manager |
| `REDIS_PASSWORD` | Environment variable / secrets manager |
| `CLOUDINARY_API_SECRET` | Environment variable / secrets manager |

Never commit secrets to the repository. `.env` files are gitignored.

## Related

- [Double-Token Auth](../auth/double-token-flow.md)
- [Roles & Permissions](../auth/roles-and-permissions.md)
- [Performance SLA](performance-sla.md)
