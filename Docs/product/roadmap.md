# Roadmap

`DECIDED` — the implementation order below is mandated by the founders and must not be reordered
without an explicit decision-log entry.

---

## Current phase: documentation

**Status: IN PROGRESS.**

| Item | Status |
|---|---|
| Requirements organised | Done |
| `Docs/` system created | Done |
| Decision log created | Done |
| Open questions identified | Done |
| Contradictions & risks recorded | Done |
| Founders' answers to open questions | **PENDING** |

**Exit criteria for this phase:**

1. Founders have answered the blocking open questions (see §4 below).
2. Contradictions in the brief are resolved and reflected in docs.
3. Explicit instruction to begin implementation.

No application code may be written before all three.

---

## Phase 1 — Customer menu demo (FIRST implementation work)

`DECIDED` — *"The first implementation, whenever implementation begins, MUST be: the customer menu
preview/demo."*

**Explicitly NOT the first steps** (`DECIDED`):

- ❌ Admin dashboard
- ❌ Authentication
- ❌ Backend CRUD
- ❌ Database
- ❌ Subscription management

### Why this is first (rationale, recorded so it isn't "corrected" later)

1. **It is the sales asset.** The demo is what a restaurant owner sees. If it isn't convincing, nothing
   else matters.
2. **It de-risks the UX.** Customer-facing flows are the most expensive to redesign late.
3. **It establishes the visual language** that everything else inherits.
4. **It needs no backend.** Data can be local fixtures — so it can be built and judged immediately.
5. **It tests the hardest requirement**: premium, distinctive, Persian, RTL, mobile-first design.

### Deliverables

| # | Deliverable | Success criteria |
|---|---|---|
| 1.1 | Restaurant identity header (cover, name, descriptor) | Immediately reads as *this restaurant's* menu |
| 1.2 | Sticky category navigation | Category reachable in one gesture from anywhere |
| 1.3 | Product cards (image, name, price, availability) | Consistent, appetising, fast-loading |
| 1.4 | Product detail view | Large image, description, options area, quantity, add |
| 1.5 | Cart / order preview | Draft state, correct totals, clear submit |
| 1.6 | Table & session context indicator | Customer can tell which table they're on |
| 1.7 | Approval waiting state («در انتظار تأیید») | Explains the wait, reassures, no re-scan needed |
| 1.8 | Order status view | Realistic status progression, customer-friendly wording |
| 1.9 | Bill view | Items, quantities, prices, discounts line, grand total |
| 1.10 | Persian RTL throughout | Native RTL, correct numerals, correct type |
| 1.11 | Search / filter (if it fits the language) | `PROPOSED`, scope to confirm |
| 1.12 | Responsive behaviour | Excellent on phone; graceful on desktop |

### Explicit constraints on the demo

- It is a **demo**: data may be realistic local fixtures. Do **not** build a backend to support it.
- It must be **realistically interactive** — real state transitions, not static mockups.
- It must use **realistic imagery**, not placeholder boxes. See
  [`design-system.md`](design-system.md) §8.
- It must **not** be shipped with placeholder visuals "just to finish it".

### Exit gate

`DECIDED` — *"Only after we approve this customer menu experience should the implementation move into
the broader application."*

Explicit written approval from the founders on the menu demo. Passing my own judgement is not approval.

---

## Phase 2 — Platform foundations

`PROPOSED` sequence. Exact order and scope depend on unresolved open questions.

| Step | Scope |
|---|---|
| 2.1 | Tech stack decision (not yet made — see `governance/open-questions.md#architecture`) |
| 2.2 | Tenant model, slug resolution, `/r/{slug}` routing |
| 2.3 | Data model per [`../technical/data-model.md`](../technical/data-model.md) |
| 2.4 | Customer-facing read API: menu, categories, products, availability |
| 2.5 | Customer Session mechanism (anonymous, device-persistent) |
| 2.6 | Staff authentication (method `OPEN QUESTION`) |
| 2.7 | RBAC foundation |

**Sequencing note:** Phase 2's stack choice is blocked on unanswered questions. Do not guess it.

---

## Phase 3 — Core workflow

| Step | Scope |
|---|---|
| 3.1 | Tables CRUD + table states |
| 3.2 | QR generation & the QR system |
| 3.3 | Table Session lifecycle |
| 3.4 | Approval flow + staff approval queue |
| 3.5 | Order submission with idempotency |
| 3.6 | Order snapshots |
| 3.7 | Order state machine + staff actions |
| 3.8 | Real-time status delivery (transport `OPEN QUESTION`) |
| 3.9 | Bill calculation + settlement recording |
| 3.10 | Audit log |

---

## Phase 4 — Operations

| Step | Scope |
|---|---|
| 4.1 | Staff order board |
| 4.2 | Station routing (Kitchen / Bar) |
| 4.3 | Kitchen/bar queue views |
| 4.4 | Printing integration (**founder-supplied solution**) |
| 4.5 | Order cancellation & resolution |
| 4.6 | Subscription lifecycle gating |

---

## Phase 5 — Hardening & launch

| Step | Scope |
|---|---|
| 5.1 | Rate limiting & abuse prevention |
| 5.2 | Tenant isolation verification & penetration pass |
| 5.3 | Performance pass on real devices |
| 5.4 | Image pipeline (resize, CDN, storage) |
| 5.5 | Observability |
| 5.6 | Backup & restore |

---

## Phase 6+ — Future features

`FUTURE`. See [`../governance/future-features.md`](../governance/future-features.md).

Each item must respect the constraint documented there:

| Feature | Constraint it places on today's design |
|---|---|
| Modifiers/variants | Product model must not be permanently `name/price/description/image` |
| Multiple stations | Item→station routing must be expressible |
| Multiple printers | Ticketing must be per-station, not global |
| Multi-branch | Tenant/branch relationship must not be hard-coded |
| Split bill | Bill model must not assume one payer per session |
| Discounts/taxes | Bill must be structural, not a single total field |
| Custom domains | Tenant resolution must be domain-based, not path-only |
| Analytics | Clean structured data must be preserved now |
| Inventory | Product availability must eventually be derivable from stock |
| Table merge/split | Session↔table binding must not be immutable |

---

## Milestones summary

| Milestone | Meaning | Gate |
|---|---|---|
| M0 | Documentation complete | Founders answer blocking questions |
| M1 | **Menu demo approved** | **Explicit founder approval — hard gate** |
| M2 | Platform foundations | Menu demo integrated with real tenant data |
| M3 | End-to-end order flow works | A real restaurant could take a real order |
| M4 | Staff operations usable | Staff can approve, prepare, deliver, settle |
| M5 | Production launch | Security/perf/abuse hardened |

---

## What is NOT on this roadmap and why

| Not planned | Why |
|---|---|
| Native iOS/Android apps | Mobile web first; PWA is the cheaper path |
| Online payments | Explicit non-goal; settlement is at the cashier |
| Offline mode | Explicit non-goal (P9) |
| Inventory | Non-goal for MVP |
| Delivery/courier | Non-goal for MVP |
| POS hardware integration | Non-goal for MVP |
| Analytics dashboards | Preserve the data now, build later |
| Custom domains | `FUTURE`; architecture accommodates it |