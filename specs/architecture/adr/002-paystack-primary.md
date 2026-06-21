# ADR 002: Paystack as Primary Payment Provider

## Status

Accepted

## Context

Commit Gear needs a payment gateway for the Nigerian market (NGN/kobo). The architecture requires a swappable payment provider interface to avoid vendor lock-in. Stripe and Paystack were both candidates.

## Decision

**Paystack** is the primary payment provider for Phase 1. All payment endpoints, webhook handlers, and order `paymentProvider` fields target Paystack.

A `PaymentProvider` interface (see [`provider-abstractions.md`](../provider-abstractions.md)) abstracts:
- `initializeCheckout`
- `verifyWebhook`
- `verifyTransaction`

## Consequences

### Positive

- Native NGN support with kobo-precision amounts
- Hosted checkout page reduces PCI scope
- Webhook-based payment confirmation is reliable
- Provider interface allows future Stripe addition without endpoint changes

### Negative

- Paystack-specific webhook signature verification (`x-paystack-signature` HMAC SHA512)
- International expansion may require additional providers
- Sandbox testing requires Paystack test keys

## Implementation Notes

| Concern | Paystack Detail |
|---------|-----------------|
| Amount unit | Kobo (integer minor units) |
| Initialize | `POST https://api.paystack.co/transaction/initialize` |
| Verify | `GET https://api.paystack.co/transaction/verify/:reference` |
| Webhook events | `charge.success`, `charge.failed` |
| Signature header | `x-paystack-signature` |
| Idempotency | Duplicate `charge.success` for same reference is no-op |

## Alternatives Considered

| Alternative | Rejected Because |
|-------------|------------------|
| Stripe primary | Less native NGN support for target market |
| Both from day one | Doubles integration and test surface for Phase 1 |
| Direct bank transfer | Poor UX for e-commerce checkout |

## Compliance

- `paymentProvider` field on Order is always `paystack` in Phase 1
- Webhook endpoint must verify signature before processing
- Payment amounts must match order `totalAmount` (kobo)
