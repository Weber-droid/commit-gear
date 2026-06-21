# Commit Gear — Spec-Driven Development

Commit Gear is a premium developer merchandise marketplace. This `/specs` directory is the **Phase 0 contract layer** that gates all implementation. No route handlers, Mongoose models, or React pages may be written until the corresponding spec exists and passes automated validation.

## Workflow

```
Write spec → Lint (Spectral + Redocly) → Human review → Implement backend/frontend → Contract tests
```

### Commands

From `specs/tooling/`:

```bash
npm install
npm run validate:api  # Redocly structural lint
npm run lint:api      # Bundle + Spectral custom rules
npm run bundle:api    # Produce openapi.bundled.yaml for docs/contract tests
```

CI runs these on every pull request via [`.github/workflows/specs.yml`](../.github/workflows/specs.yml).

## Directory Map

| Path | Purpose |
|------|---------|
| [`api/`](api/) | OpenAPI 3.1 contract — source of truth for all HTTP boundaries |
| [`data/`](data/) | Mongoose model field contracts, indexes, seed/migration order |
| [`architecture/`](architecture/) | System topology, scaling, provider interfaces, ADRs |
| [`auth/`](auth/) | Double-token JWT flow, role permission matrix |
| [`caching/`](caching/) | Redis key catalog, TTLs, eviction triggers |
| [`ui/`](ui/) | Design system, routes, components, TanStack Query conventions |
| [`nfr/`](nfr/) | Performance SLAs, security controls |
| [`tooling/`](tooling/) | Spectral + Redocly validation scripts |

## Glossary

| Term | Definition |
|------|------------|
| **Access token** | Short-lived JWT (15 min) sent via `Authorization: Bearer` header |
| **Refresh token** | Long-lived token (7 days) stored in HttpOnly cookie; rotated on each use |
| **Snapshot** | Frozen copy of product price/title at checkout time, stored on Order |
| **Provider** | Swappable adapter for payment, cache, or storage (Paystack, Redis, Cloudinary) |
| **Envelope** | Standard API response shape: `{ success, data?, meta?, message?, error? }` |

## Global API Conventions

| Concern | Decision |
|---------|----------|
| Base path | `/api/v1` |
| Success | `{ "success": true, "data": T, "meta?": PaginationMeta }` |
| Error | `{ "success": false, "message": string, "error?": { "code", "details" } }` |
| Auth | `Authorization: Bearer <accessToken>` |
| Pagination | `?page=1&limit=20` → `meta: { page, limit, total, totalPages }` |
| IDs | MongoDB ObjectId: `^[a-f0-9]{24}$` |
| Money | Integer minor units (kobo for NGN) |

## Spec Review Checklist

Before unlocking `backend/` or `frontend/` implementation, confirm:

- [ ] Every endpoint has request body (where applicable), all success/error responses, and at least one example
- [ ] `User`, `Product`, `Order` schemas match between [`api/openapi.yaml`](api/openapi.yaml) and [`data/models.md`](data/models.md)
- [ ] Paystack webhook + initialize flows documented with idempotency rules in [`api/domains/payments.yaml`](api/domains/payments.yaml)
- [ ] Cache keys and eviction triggers in [`caching/`](caching/) cover all product/category write paths
- [ ] Role matrix in [`auth/roles-and-permissions.md`](auth/roles-and-permissions.md) covers every secured operation
- [ ] UI routes in [`ui/routes.md`](ui/routes.md) map to API queries (no orphan pages)
- [ ] ADRs in [`architecture/adr/`](architecture/adr/) signed off for auth, payment, caching, and SDD approach

## Phase 1 (After Specs)

Implementation order once specs pass review:

1. `backend/` — core pipeline, DI, providers
2. Auth + User model
3. Products + Redis caching
4. Cart + atomic checkout + Paystack
5. `frontend/` — shell, design tokens, shop flow
6. Contract tests (Schemathesis) wired to CI

## Related Documents

- [System Overview](architecture/system-overview.md)
- [OpenAPI Entry Point](api/openapi.yaml)
- [Design System](ui/design-system.md)
- [Performance SLA](nfr/performance-sla.md)
