# System Overview

Commit Gear is a MERN-stack e-commerce platform for premium developer merchandise. This document defines service boundaries, data flows, and the backend layering contract.

## Topology

```mermaid
flowchart TB
  subgraph client [Client Tier]
    Browser[React_Vite_SPA]
  end

  subgraph edge [Edge]
    LB[Load_Balancer]
    CDN[Cloudinary_CDN]
  end

  subgraph api [API Tier]
    Node1[Express_Node_1]
    Node2[Express_Node_N]
  end

  subgraph data [Data Tier]
    Redis[Redis_Cache]
    Mongo[(MongoDB_Replica_Set)]
  end

  subgraph external [External Services]
    Paystack[Paystack_Gateway]
  end

  Browser -->|HTTPS_REST| LB
  Browser -->|Image_delivery| CDN
  LB --> Node1
  LB --> Node2
  Node1 --> Redis
  Node2 --> Redis
  Node1 --> Mongo
  Node2 --> Mongo
  Node1 --> Paystack
  Node2 --> Paystack
  Paystack -->|Webhook| LB
  Node1 -->|Stream_upload| CDN
```

## Service Boundaries

| Service | Responsibility | Stateful? |
|---------|----------------|-----------|
| React SPA | UI, client cache (TanStack Query), optimistic cart | No |
| Express API | Business logic, auth, validation, orchestration | No (stateless) |
| MongoDB | Persistent data (users, products, orders, carts) | Yes |
| Redis | Read-through cache for catalog | Yes (ephemeral) |
| Cloudinary | Image storage and CDN delivery | Yes |
| Paystack | Payment processing and webhooks | External |

## Backend Layering Contract

Implementation in `backend/` must follow strict separation:

```
src/
├── routes/           # HTTP mapping only — no business logic
├── validators/       # Zod schemas derived from OpenAPI
├── controllers/      # Request/response orchestration
├── services/         # Business logic and transaction boundaries
├── repositories/     # Mongoose queries and persistence
├── providers/        # Swappable adapters (Paystack, Redis, Cloudinary)
├── middleware/       # Auth, error handler, rate limit, sanitize
├── config/           # Environment and connection config
└── utils/            # Logger, AppError, helpers
```

### Dependency Flow

```mermaid
flowchart TD
  Routes --> Validators
  Routes --> Controllers
  Controllers --> Services
  Services --> Repositories
  Services --> Providers
  Repositories --> Mongo[(MongoDB)]
  Providers --> Redis[Redis]
  Providers --> Paystack[Paystack]
  Providers --> Cloudinary[Cloudinary]
```

**Rules:**
- Routes never import repositories directly
- Controllers never contain Mongoose queries
- Services receive providers via constructor injection (DI container)
- Providers implement interfaces defined in [`provider-abstractions.md`](provider-abstractions.md)

## Request Lifecycle

```mermaid
sequenceDiagram
  participant C as Client
  participant M as Middleware
  participant V as Validator
  participant Ctrl as Controller
  participant Svc as Service
  participant Cache as Redis
  participant DB as MongoDB

  C->>M: HTTP Request
  M->>M: helmet, cors, rateLimit, sanitize
  M->>V: validate payload
  V->>Ctrl: parsed input
  Ctrl->>Svc: business call
  alt cache hit
    Svc->>Cache: get key
    Cache-->>Svc: cached data
  else cache miss
    Svc->>DB: query
    DB-->>Svc: result
    Svc->>Cache: set key with TTL
  end
  Svc-->>Ctrl: result
  Ctrl-->>C: JSON envelope
```

## Global Error Handling

All errors flow through a single middleware:

```json
{
  "success": false,
  "message": "Human-readable message",
  "error": {
    "code": "MACHINE_READABLE_CODE",
    "details": {}
  }
}
```

- Operational errors (validation, not found, conflict): log at `warn`, return appropriate 4xx
- Programming errors: log at `error` with stack trace, return 500 without leaking internals

## API Versioning

- Current version: `v1` (prefix `/api/v1`)
- Breaking changes require new version prefix; old version maintained for deprecation period

## Related Documents

- [Scaling Strategy](scaling-100k.md)
- [Provider Abstractions](provider-abstractions.md)
- [OpenAPI Contract](../api/openapi.yaml)
- [Double-Token Auth](../auth/double-token-flow.md)
