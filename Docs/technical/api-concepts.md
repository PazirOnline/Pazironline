# API Concepts

The shape of the API surface, before any stack is chosen. Naming and transport specifics are
`PROPOSED`; the guarantees are `DECIDED`.

Related: [`idempotency.md`](idempotency.md) · [`realtime.md`](realtime.md) ·
[`../platform/security.md`](../platform/security.md)

---

## 1. Two surfaces

`DECIDED` (from the architecture)

| Surface | Audience | Auth | Notes |
|---|---|---|---|
| **Customer API** | Anonymous diners | Customer session | Small, cacheable, minimal attack surface |
| **Staff API** | Employees | Staff authentication | Full operational capability |

**Why split:** different security posture, different caching, different payloads. A leak in one does not
expose the other.

---

## 2. Conventions

`PROPOSED`

| Concern | Rule |
|---|---|
| Transport | HTTPS + JSON (`DECIDED`) |
| Versioning | Version in the path or a header — **version from day one** |
| Field naming | `snake_case` or `camelCase` — pick one, never mix |
| Identifiers | UUID/ULID for internal IDs; separate opaque tokens for public exposure |
| Money | Integer minor units; a `currency` field on monetary responses |
| Timestamps | ISO 8601 UTC |
| Errors | A consistent error envelope with a stable machine-readable code |
| Pagination | Cursor-based for lists (`DECIDED` — offsets break on live data like the order board) |
| Filtering | Explicit query parameters, no ad-hoc SQL passthrough |
| Idempotency | Header on all unsafe, client-initiated writes (`DECIDED`) |

---

## 3. Customer API concepts

| Operation | Method (proposed) | Auth | Notes |
|---|---|---|---|
| Resolve tenant by slug | `GET /r/{slug}/context` | Public | Tenant identity + branding + minimal config |
| Get menu | `GET /r/{slug}/menu` | Public | Cacheable; categories + products + availability |
| Resolve table | `GET /r/{slug}/tables/{qrToken}` | Public | Table identity only — never session data |
| Start/refresh customer session | `POST /r/{slug}/sessions` | Public | Issues a session token |
| Request ordering access | `POST /sessions/{id}/access-requests` | Session | Idempotent |
| Poll session state | `GET /sessions/{id}` | Session | Until real-time is settled |
| Get product detail | `GET /r/{slug}/products/{id}` | Public | Optional; the menu payload may suffice |
| Submit order | `POST /sessions/{id}/orders` | Session | **Idempotent**; server-priced |
| Get session orders | `GET /sessions/{id}/orders` | Session | All orders in the visit |
| Advance order (customer) | `POST /orders/{id}/actions` | Session | Only customer-permitted actions |
| Get bill | `GET /sessions/{id}/bill` | Session | Read-only |

### 3.1 Rules

`DECIDED`

| # | Rule |
|---|---|
| API1 | **Prices are never accepted from the client** |
| API2 | **Status is never settable by the customer** |
| API3 | `tenant_id` is never accepted from the client |
| API4 | Menu reads are cacheable per tenant |
| API5 | The table token grants only identity, never session access |
| API6 | The customer has no write path to the bill |
| API7 | Order submission is idempotent |

---

## 4. Staff API concepts

| Area | Operations (proposed) |
|---|---|
| Auth | Login, logout, refresh, session check, password/PIN change |
| Approval | List pending requests, approve, reject |
| Orders | List (by status/station/age), get detail, **named action endpoints** |
| Tables | List, create, update, archive, generate/regenerate QR, QR download |
| Sessions | Get session, close session, manual occupancy |
| Bills | Get bill, apply discount, record settlement |
| Menu | Categories CRUD, products CRUD, availability toggle, image upload |
| Staff | List, invite, update roles, disable |
| Reports | Basic aggregates (`FUTURE`) |
| Audit | Query audit events (permission-gated) |
| Subscription | Read state, manage plan (`FUTURE`) |

### 4.1 Named action endpoints, never a generic status setter

`DECIDED`

```
✅ POST /staff/orders/{id}/confirm
✅ POST /staff/orders/{id}/start-preparing
✅ POST /staff/orders/{id}/cancel      { reason }

❌ PATCH /staff/orders/{id}  { status: "PAID" }
```

**Why:** a generic setter means the authorization, validation, audit, and transition rules must all be
re-derived at runtime. Named endpoints make each action's rules explicit and testable.

### 4.2 Staff action permissions

`PROPOSED` — one permission per action endpoint, per
[`../platform/roles-and-permissions.md`](../platform/roles-and-permissions.md).

---

## 5. Error handling

`PROPOSED`

Consistent envelope:

```json
{
  "error": {
    "code": "TABLE_SESSION_NOT_APPROVED",
    "message": "این میز هنوز تأیید نشده است",
    "message_en": "This table has not been approved yet",
    "details": { "table_session_id": "..." },
    "request_id": "..."
  }
}
```

| Rule | Detail |
|---|---|
| Stable machine code | Clients branch on `code`, never on prose |
| Persian message for the customer | `DECIDED` — customer-facing errors must be actionable in Persian |
| No internal detail leakage | No stack traces, no SQL, no table names |
| `request_id` | Correlates with logs; enables support |

### 5.1 Error codes that matter (`PROPOSED`)

| Code | Meaning | Customer-facing? |
|---|---|---|
| `TENANT_NOT_FOUND` | Unknown slug | Yes |
| `TABLE_TOKEN_INVALID` | Bad/regenerated QR | Yes |
| `TABLE_SESSION_NOT_FOUND` | No session | Yes |
| `TABLE_SESSION_NOT_APPROVED` | Ordering not yet permitted | Yes |
| `TABLE_SESSION_CLOSED` | Session ended | Yes |
| `ORDERING_ACCESS_PENDING` | Awaiting approval | Yes |
| `PRODUCT_UNAVAILABLE` | Sold out | Yes — name the item |
| `PRODUCT_NOT_FOUND` | Archived/removed | Yes |
| `IDEMPOTENCY_KEY_REUSED` | Key conflict | Yes |
| `RATE_LIMITED` | Too many requests | Yes |
| `PERMISSION_DENIED` | Role lacks capability | Yes |
| `SESSION_EXPIRED` | Customer session expired | Yes |
| `VALIDATION_FAILED` | Field-level issues | Yes |
| `INTERNAL_ERROR` | Unexpected | Generic Persian apology |

---

## 6. Idempotency

`DECIDED` — see [`idempotency.md`](idempotency.md).

| Rule | Detail |
|---|---|
| IP1 | Unsafe client-initiated writes accept an idempotency key |
| IP2 | A replay returns the original result with the same status code |
| IP3 | The key is scoped (tenant + principal + operation) |
| IP4 | Concurrent identical requests produce one result |
| IP5 | Fingerprint mismatch on replay → conflict error |

---

## 7. Rate limiting

`DECIDED` (capability) · `OPEN QUESTION` (values)

| Endpoint class | Scope |
|---|---|
| Public menu reads | Per IP |
| Session creation | Per IP |
| Access requests | Per session / per table / per tenant |
| Order submission | Per session |
| Staff auth | Per account / per IP |
| Staff mutations | Per staff member |

Responses should communicate retry timing.

---

## 8. Pagination

`PROPOSED`

- Cursor-based for anything that changes while the client pages (order board, audit log).
- Offset pagination acceptable for static-ish lists (menu categories) — but cursor is safer everywhere.
- Page size capped server-side.

---

## 9. Real-time

`OPEN QUESTION` (transport) — see [`realtime.md`](realtime.md).

Conceptually, the client subscribes to a channel and receives domain events:

| Event | Audience |
|---|---|
| `session.state_changed` | The customer |
| `order.status_changed` | The customer + relevant staff |
| `order.created` | Station staff |
| `bill.changed` | Customer + cashier |

**Design requirement:** events are **notifications to re-read state**, not the state itself. A client that
misses an event must still converge by fetching current state.

---

## 10. Security requirements

`DECIDED`

| # | Rule |
|---|---|
| AP1 | Every request authenticates a principal (customer session or staff session) |
| AP2 | The tenant is resolved server-side from the slug/host or the principal |
| AP3 | Authorization is checked per action |
| AP4 | Strict input validation; unknown fields rejected or ignored |
| AP5 | No price/status/role/tenant value is accepted from a client |
| AP6 | Security headers on all responses |
| AP7 | Errors leak no internals |

---

## 11. Open questions

| # | Question | Blocking? |
|---|---|---|
| Q1 | REST vs. RPC-style API shape | No |
| Q2 | Versioning scheme | No |
| Q3 | Field naming convention | No |
| Q4 | Rate limit values | Yes (before launch) |
| Q5 | Customer-facing error copy approval | No |
| Q6 | Whether the customer needs any order-mutation endpoint | Yes (depends on cancellation) |
| Q7 | Bilingual error messages or Persian-only | No |

Full register: [`../governance/open-questions.md`](../governance/open-questions.md).