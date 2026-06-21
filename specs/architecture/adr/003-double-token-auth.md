# ADR 003: Double-Token Authentication

## Status

Accepted

## Context

Commit Gear requires secure authentication for buyers, vendors, and admins. Short-lived access tokens limit exposure if intercepted. Long-lived sessions need refresh without re-login. Refresh tokens must not be accessible to JavaScript (XSS protection).

## Decision

Implement a **double-token authentication system**:

| Token | Lifetime | Storage | Transport |
|-------|----------|---------|-----------|
| Access JWT | 15 minutes | Client memory (React state / TanStack Query) | `Authorization: Bearer` header |
| Refresh token | 7 days | HttpOnly, Secure, SameSite=Strict cookie | Automatic cookie on `/auth/*` |

### Rotation Policy

- Each `POST /auth/refresh` invalidates the presented refresh token
- A new refresh token is issued in the response cookie (single-use rotation)
- Maximum 5 active refresh tokens per user (oldest evicted on 6th login)
- `POST /auth/logout` removes the token hash and clears the cookie

### JWT Payload

```json
{
  "sub": "507f1f77bcf86cd799439011",
  "role": "buyer",
  "iat": 1719000000,
  "exp": 1719000900
}
```

No email, name, or password in JWT.

## Consequences

### Positive

- Access token theft window is 15 minutes max
- Refresh token immune to XSS (HttpOnly)
- CSRF mitigated by SameSite=Strict on refresh cookie
- Server-side revocation via refresh token hash removal

### Negative

- Cross-origin SPA requires `credentials: 'include'` on refresh/logout requests
- Cookie + header auth is more complex than single-token
- Mobile clients (future) need alternative refresh transport

## Alternatives Considered

| Alternative | Rejected Because |
|-------------|------------------|
| Single long-lived JWT | No server-side revocation; large theft window |
| Refresh token in localStorage | Vulnerable to XSS |
| Session cookies only | Doesn't work well with API-first / mobile future |
| OAuth-only (Google/GitHub) | Adds dependency; email/password needed for marketplace |

## Compliance

- Access token never stored in localStorage or sessionStorage
- Refresh token never in JSON response body (cookie only)
- Password field `select: false` on User model
- bcrypt cost factor 12

## Related

- [Double-Token Flow Spec](../../auth/double-token-flow.md)
- [Roles & Permissions](../../auth/roles-and-permissions.md)
