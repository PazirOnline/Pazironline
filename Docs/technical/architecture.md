# Architecture

**Intent, not a locked implementation.** The tech stack is not chosen. This document defines the shape
the system must have, the constraints it must satisfy, and the decisions that are still open.

Related: [`data-model.md`](data-model.md) · [`api-concepts.md`](api-concepts.md) ·
[`../platform/multi-tenancy.md`](../platform/multi-tenancy.md) · [`../platform/security.md`](../platform/security.md)

---

## 1. What this document is / is not

| Is | Is not |
|---|---|
| The system's required shape | A technology selection |
| The constraints architecture must satisfy | An implementation plan |
| A record of what is decided and what isn't | An invitation to guess |

`OPEN QUESTION` — **the technology stack is not chosen.** See
[`../governance/open-questions.md`](../governance/open-questions.md#architecture).

---

## 2. Required properties

`DECIDED` (derived from principles) — any architecture that cannot satisfy these is wrong.

| # | Property | Source |
|---|---|---|
| A1 | Multi-tenant with hard backend isolation | P2 |
| A2 | Host/path-based tenant resolution | multi-tenancy §5.5 |
| A3 | Server-side price resolution and immutable snapshots | P7 |
| A4 | Idempotent order submission | P10 |
| A5 | Near-real-time status propagation to customer and staff | P12 |
| A6 | Stateless application tier (horizontal scaling) | `PROPOSED` |
| A7 | Works without assuming a monitor or printer | P16 |
| A8 | No offline/sync component | P9 |
| A9 | Every significant action audited | P19 |
| A10 | Extensible to branches, stations, modifiers, custom domains | P13, P8 |
| A11 | Customer experience is fast on mobile | C2 |

---

## 3. Component shape

`PROPOSED` — a conventional, deliberately boring shape.

```
                          ┌──────────────────────────┐
   Customer (phone)  ───► │  Customer Web App        │  static/edge-cached
   Staff (phone/tablet)──►│  Staff Web App           │
                          └────────────┬─────────────┘
                                       │ HTTPS (JSON) + real-time channel
                          ┌────────────▼─────────────┐
                          │  API / Application Tier  │  stateless
                          │  ├ tenant resolution     │
                          │  ├ authentication        │
                          │  ├ authorization (RBAC)  │
                          │  ├ domain services       │
                          │  ├ entitlement gate      │
                          │  └ audit writer          │
                          └───────┬─────────┬────────┘
                                  │         │
                    ┌─────────────▼──┐   ┌──▼──────────────┐
                    │  Primary DB    │   │  Cache / Pub-Sub│
                    │  (tenant data) │   │  (sessions,     │
                    └───────┬────────┘   │   real-time fan)│
                            │            └─────────────────┘
                    ┌───────▼────────┐
                    │  Object storage│  images
                    └───────┬────────┘
                            │
                    ┌───────▼────────┐
                    │  Print worker  │  (FUTURE / founder-supplied)
                    └────────────────┘
```

### 3.1 Why separate customer and staff front ends

`PROPOSED`

- They are genuinely different products: a marketing-grade menu vs. a dense operational console.
- They have different security postures: anonymous vs. authenticated.
- They load differently: the customer menu must be edge-cacheable and instant; the staff app is
  authenticated and dynamic.
- Separate bundles keep the customer payload tiny (C2).

They share design tokens, not necessarily code.

---

## 4. Tenant isolation strategy

`DECIDED` (the requirement) · `PROPOSED` (the mechanism)

Options:

| Approach | Isolation strength | Cost | Notes |
|---|---|---|---|
| **Shared schema, `tenant_id` column** | Depends on discipline | Low | Standard SaaS choice; requires rigorous enforcement |
| Shared schema + DB row-level security | Strong | Low–medium | Defense in depth |
| Schema per tenant | Strong | High (migrations ×N) | Impractical at scale |
| Database per tenant | Very strong | Very high | Overkill; complicates platform analytics |

**Recommendation (`PROPOSED`):** **shared schema with a mandatory `tenant_id`**, enforced by a repository
layer that requires tenant context, plus automated cross-tenant access tests, plus optional DB
row-level security as defense in depth.

**Why:** it is the standard approach for this scale, keeps platform-wide reporting simple, and the
safety comes from making unscoped access structurally hard — not from the database topology.

---

## 5. Customer-facing read path

`DECIDED` (requirements) · `PROPOSED` (mechanism)

The menu is the hottest, most latency-sensitive path. It is also **public, non-sensitive, per-tenant**
data.

```
Customer → CDN/edge (cached menu JSON per tenant, short TTL)
        → API (tenant resolution from slug)
        → DB (single indexed query)
```

| Requirement | Rationale |
|---|---|
| Cacheable per tenant | The menu changes rarely; orders happen constantly |
| Short TTL or explicit invalidation on menu edit | Price changes must appear promptly |
| No authentication | Browsing needs no permission |
| Images via CDN with resizing | C2 performance |
| Never cache order/session endpoints | Correctness and privacy |

**Recommendation (`PROPOSED`):** cache the rendered menu payload (or its constituent parts) keyed by
`tenant_id + menu_version`. Bump `menu_version` on any menu write — a clean invalidation strategy.

---

## 6. Write path

`PROPOSED`

Writes are infrequent relative to reads, and correctness matters more than throughput.

```
Order submission:
  1. Authenticate customer session
  2. Load tenant + table session; verify APPROVED and open
  3. Verify idempotency key → if seen, return the original order
  4. Load products; verify availability; resolve prices
  5. Allocate order number
  6. Write order + line items (with snapshots) in ONE transaction
  7. Write audit event
  8. Publish status-change event
  9. Return 201
```

**Rule (P7/P10):** the transaction boundary must include the order and all its line items. A partial
order is worse than no order.

---

## 7. Real-time

`DECIDED` (capability) · `OPEN QUESTION` (transport)

See [`realtime.md`](realtime.md). Architecturally:

- The application tier must be able to **publish** a domain event (e.g. `order.status_changed`) and
  **subscribe** to fan-out.
- The transport to the browser is a separate concern.
- Recommendation (`PROPOSED`): implement the event publish/subscribe abstraction first, so the transport
  choice stays reversible.

---

## 8. Consistency model

`PROPOSED`

| Concern | Approach |
|---|---|
| Order + line items | Strong, single transaction |
| Idempotency record + order | Same transaction |
| Audit event | Same transaction where critical, else best-effort + failure log |
| Real-time propagation | Eventual — seconds, acceptable |
| Menu cache invalidation | Eventual via version bump |
| Search (if any) | Eventual |

---

## 9. Scaling posture

`PROPOSED`

| Dimension | Approach |
|---|---|
| Customer menu reads | Edge/CDN caching absorbs the bulk |
| Order writes | Low volume per tenant; a busy restaurant is ~tens/hour |
| Real-time connections | Long-lived connections per active session — the real scaling concern |
| Staff app | Few devices per tenant |
| Images | Object storage + CDN; the biggest storage cost |
| Database | Single primary with replicas for reads; index by tenant |

**The honest scaling question:** a restaurant with a wall-mounted display keeps a connection open all
service. Real-time connection count, not order volume, is what grows.

---

## 10. Availability

`PROPOSED`

| Concern | Note |
|---|---|
| Single point of failure | Acceptable early; the product's revenue is subscriptions, not per-order fees |
| Staff app down | Orders still queue server-side and appear on next load |
| Customer app down | The restaurant falls back to manual ordering |
| Data loss | Backups + tested restore (pre-launch requirement) |
| Real-time down | Fallback to polling; order submission must not depend on it |

**Critical:** real-time is an enhancement. Order submission and status truth must never depend on the
push channel working.

---

## 11. Internationalisation and localisation

`DECIDED` (in part)

- Customer UI is **Persian and RTL** (`DECIDED`).
- Code identifiers, schema, and API field names are **English** (ux-principles X1).
- Multiple content languages for menus (`FUTURE`).

Consequences: RTL handled structurally (logical properties, not mirroring); time and number formatting
via a locale layer; the currency unit is unresolved (`OPEN QUESTION`).

---

## 12. Time

`PROPOSED`

- Store all timestamps in UTC.
- Render in the restaurant's local timezone.
- Per-tenant timezone configuration: `PROPOSED` (Iran is one timezone now, but don't hard-code it).
- "Daily" reporting boundaries must use restaurant-local days, not UTC days (analytics §Q6).

---

## 13. Technology stack

`OPEN QUESTION` — **not decided. Do not assume.**

Candidate considerations are recorded in
[`../governance/open-questions.md`](../governance/open-questions.md#architecture), including: language
and framework, database, real-time transport, hosting region and provider, object storage, image
pipeline, and whether a BaaS is acceptable.

---

## 14. Edge cases and required behaviours

| Scenario | Required behaviour | Status |
|---|---|---|
| Database temporarily unavailable | Fail cleanly with a clear message; never a partial order | `PROPOSED` |
| Real-time channel down | Order submission still works; status refreshes on reconnect | `DECIDED` |
| Cache stale after a price change | Short TTL / version bump | `PROPOSED` |
| Extremely large tenant menu | Paginated staff APIs; a single efficient customer read | `PROPOSED` |
| Two concurrent submits from one device | Idempotency resolves it | `DECIDED` |
| Order-number allocation at peak | Concurrency-safe allocation | `PROPOSED` |
| Clock skew between tiers | Server-assigned timestamps only | `DECIDED` |
| Region failure | Out of scope for MVP | `FUTURE` |

---

## 15. Security architecture

`PROPOSED` — the pipeline shape from
[`../platform/security.md`](../platform/security.md) §5:

```
Authenticate → Resolve tenant → Verify tenant binding → Authorize → Execute tenant-scoped → Audit
```

Plus:

- Strict input validation; prices and statuses never from the client.
- Rate limiting at the edge/API.
- Security headers, CSP, `Referrer-Policy`.
- Secrets only in server-side configuration.
- Automated cross-tenant isolation tests.

---

## 16. Current decision summary

`DECIDED`

Multi-tenant, backend-enforced isolation. Separate customer and staff front ends. Server-resolved prices
with immutable snapshots. Idempotent order submission. Real-time status capability with an undecided
transport. Stateless application tier. No offline component. Audit on significant actions. The model
stays extensible.

**Not decided:** language, framework, database, hosting, real-time transport, image pipeline, BaaS
usage.

---

## 17. Future considerations

| Future feature | Architectural constraint |
|---|---|
| Custom domains | Host-based tenant resolution at the edge |
| Multi-branch | Branch dimension in every scoped query |
| Split bills | Allocations as first-class data |
| Print integration | An async worker decoupled from request handling |
| Analytics | Structured transactional data; a read replica or warehouse later |
| Feature tiers | A single entitlement choke point |
| Regional hosting | Tenant-to-region affinity not hard-coded |
| Sharding | Tenant id as the shard key |

---

## 18. Open questions

| # | Question | Blocking? |
|---|---|---|
| Q1 | **Technology stack** | **YES — blocks all implementation** |
| Q2 | Shared-schema vs. stronger isolation | No (recommendation given) |
| Q3 | Real-time transport | **Yes — but design the abstraction first** |
| Q4 | Hosting provider and **data residency in Iran** | **Yes — legal** |
| Q5 | BaaS acceptable or self-hosted backend? | **Yes** |
| Q6 | Image pipeline approach | No |
| Q7 | Menu caching strategy | No |
| Q8 | Per-tenant timezone support now? | No |

Full register: [`../governance/open-questions.md`](../governance/open-questions.md).