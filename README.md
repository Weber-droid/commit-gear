# Commit Gear

Premium developer merchandise and swag marketplace — built for scale, crafted for engineers.

## Status

**Phase 0: Spec-Driven Development** — API contracts, architecture, and design specs are defined in [`specs/`](specs/). Implementation (`backend/`, `frontend/`) begins after spec review and CI validation pass.

## Quick Start (Specs)

```bash
cd specs/tooling
npm install
npm run validate:api
npm run lint:api
npm run bundle:api
```

## Documentation

| Document | Description |
|----------|-------------|
| [Specs README](specs/README.md) | SDD workflow, glossary, review checklist |
| [OpenAPI Contract](specs/api/openapi.yaml) | Public HTTP API source of truth |
| [Architecture](specs/architecture/system-overview.md) | MERN topology and service boundaries |
| [UI Design System](specs/ui/design-system.md) | Dark-first premium aesthetic tokens |

## Stack (Planned)

| Layer | Technology |
|-------|------------|
| API | Node.js, Express, Mongoose, Zod |
| Database | MongoDB |
| Cache | Redis |
| Payments | Paystack (provider abstraction for future swap) |
| Storage | Cloudinary |
| Client | React, Vite, Tailwind CSS, TanStack Query |

## License

Proprietary — Commit Gear
