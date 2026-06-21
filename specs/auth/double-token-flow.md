# Double-Token Authentication Flow

Detailed sequence for Commit Gear's access JWT + refresh cookie system.

## Token Summary

| Token | Lifetime | Storage | Rotation |
|-------|----------|---------|----------|
| Access JWT | 15 min | Client memory | Re-issued on `/auth/refresh` |
| Refresh token | 7 days | HttpOnly, Secure, SameSite=Strict cookie | Single-use; old hash removed on refresh |

## Registration Flow

```mermaid
sequenceDiagram
  participant C as Client
  participant A as API
  participant DB as MongoDB

  C->>A: POST /auth/register { name, email, password }
  A->>A: Hash password (bcrypt)
  A->>DB: Create user (role: buyer)
  A->>A: Generate access JWT + refresh token
  A->>DB: Store refresh token hash
  A-->>C: 201 { accessToken, expiresIn } + Set-Cookie refreshToken
```

## Login Flow

```mermaid
sequenceDiagram
  participant C as Client
  participant A as API
  participant DB as MongoDB

  C->>A: POST /auth/login { email, password }
  A->>DB: Find user by email (include password)
  A->>A: bcrypt.compare(password, hash)
  alt invalid credentials
    A-->>C: 401 INVALID_CREDENTIALS
  end
  A->>A: Generate access JWT + refresh token
  A->>DB: Push refresh token hash (max 5, evict oldest)
  A-->>C: 200 { accessToken, expiresIn } + Set-Cookie refreshToken
```

## Authenticated Request

```mermaid
sequenceDiagram
  participant C as Client
  participant A as API

  C->>A: GET /products Authorization Bearer accessToken
  A->>A: Verify JWT signature + expiry
  alt token valid
    A-->>C: 200 product list
  else token expired
    A-->>C: 401 UNAUTHORIZED
    Note over C: Client calls /auth/refresh
  end
```

## Token Refresh Flow

```mermaid
sequenceDiagram
  participant C as Client
  participant A as API
  participant DB as MongoDB

  C->>A: POST /auth/refresh (Cookie refreshToken)
  A->>A: Hash presented token
  A->>DB: Find user with matching tokenHash, not expired
  alt token invalid or expired
    A-->>C: 401 REFRESH_TOKEN_INVALID
  end
  A->>DB: Remove old tokenHash
  A->>A: Generate new access JWT + new refresh token
  A->>DB: Store new tokenHash
  A-->>C: 200 { accessToken, expiresIn } + Set-Cookie new refreshToken
```

## Logout Flow

```mermaid
sequenceDiagram
  participant C as Client
  participant A as API
  participant DB as MongoDB

  C->>A: POST /auth/logout (Bearer + Cookie)
  A->>A: Verify access JWT
  A->>DB: Remove refresh token hash from cookie
  A-->>C: 200 + Set-Cookie refreshToken=; Max-Age=0
```

## Cookie Configuration

```
Set-Cookie: refreshToken=<token>;
  HttpOnly;
  Secure;
  SameSite=Strict;
  Path=/api/v1/auth;
  Max-Age=604800
```

| Attribute | Value | Purpose |
|-----------|-------|---------|
| `HttpOnly` | true | Prevent XSS access |
| `Secure` | true | HTTPS only |
| `SameSite` | Strict | CSRF mitigation |
| `Path` | `/api/v1/auth` | Scope to auth endpoints only |
| `Max-Age` | 604800 (7 days) | Refresh lifetime |

## Client Implementation Notes (Phase 1)

1. Store access token in React context or memory — **not** localStorage
2. Axios interceptor: on 401, attempt `POST /auth/refresh` with `credentials: 'include'`
3. On refresh success: retry original request with new access token
4. On refresh failure: redirect to login
5. TanStack Query `queryClient.clear()` on logout

## Security Considerations

- Refresh token raw value never logged
- Token hash stored server-side (SHA-256)
- Rate limit `/auth/login` and `/auth/refresh` (100/15min per IP)
- Account lockout after 10 failed logins in 15 min (implementation detail, Phase 1)

## Related

- [ADR 003: Double-Token Auth](../architecture/adr/003-double-token-auth.md)
- [Roles & Permissions](roles-and-permissions.md)
- [Auth API](../api/domains/auth.yaml)
