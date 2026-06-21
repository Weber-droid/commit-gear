# ADR 001: Hybrid Spec-Driven Development

## Status

Accepted

## Context

Commit Gear is a greenfield e-commerce platform with complex requirements: 100K concurrent users, double-token auth, Paystack payments, Redis caching, and a bespoke premium UI. We need a development approach that prevents API drift, documents cross-cutting concerns, and gates implementation quality.

## Decision

Adopt a **hybrid spec-driven development** approach:

1. **OpenAPI 3.1** as the source of truth for all public HTTP boundaries (`specs/api/`)
2. **Markdown specs** for architecture, data models, auth flows, caching, UI design system, and NFRs
3. **Automated validation** via Spectral + Redocly in CI before any `backend/` or `frontend/` code merges
4. **Contract tests** (Schemathesis) added in Phase 1 once the API is implemented

## Consequences

### Positive

- API contract is reviewable before implementation begins
- Frontend and backend teams can work in parallel against the same OpenAPI spec
- Cross-cutting concerns (caching eviction, auth rotation) are documented outside code
- CI catches spec regressions early

### Negative

- Spec maintenance overhead — every API change requires spec update first
- OpenAPI cannot express all runtime behavior (e.g., cache TTLs, webhook idempotency) — markdown specs fill the gap
- Initial Phase 0 takes longer before any runnable code exists

## Alternatives Considered

| Alternative | Rejected Because |
|-------------|------------------|
| Code-first (generate OpenAPI from code) | Drift risk; cross-cutting specs have no home |
| OpenAPI-only (no markdown) | Cannot capture caching, auth sequences, UI tokens |
| Full code generation from OpenAPI | Over-constrains Express patterns; poor fit for Mongoose |

## Compliance

- No route handler without corresponding OpenAPI path
- No Mongoose model field without entry in `specs/data/models.md`
- PRs touching `backend/` or `frontend/` must reference spec sections
