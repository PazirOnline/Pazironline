# Changelog

Dated log of documentation changes, newest first. The project's memory of how the thinking changed.

Related: [`decision-log.md`](decision-log.md)

---

## Format

```
## YYYY-MM-DD — Title
**Type:** `DECISION` | `DOC` | `CONTRADICTION` | `CORRECTION` | `SCOPE`
**Changed:** files touched
**Decision:** (if Type is DECISION) the decision-log ID
**Summary:** what changed and why
**Impact:** who needs to act
```

---

## 2026-10-07 — Persian README added

**Type:** `DECISION` · `DOC`

**Decision:** [D-038](decision-log.md#d-038)

**Changed:**
- `Docs/README.fa.md` **(new)** — full Persian entry point: index, status-label legend, 12-question
  template, editing rules, product summary, the `DECIDED` decision table, complete folder map, quick
  start, Persian↔English glossary, technical conventions, implementation status, the five top blocking
  questions, a review checklist, and a forbidden-terms list.
- `Docs/README.md` — added a Persian cross-link at the top and documented the exception to the
  English-internals rule in §4.
- `Docs/governance/decision-log.md` — added D-038.
- `Docs/governance/changelog.md` — this entry.

**Summary:** The team is Persian-speaking; requiring every member to read English documentation before
starting was an unnecessary barrier. `README.fa.md` mirrors the English index so anyone can navigate the
tree immediately, while the English docs remain canonical.

**Rationale for index-only (not a full translation):** translating all 40 files would double the
maintenance surface and create drift — a future agent could read a stale Persian page and treat it as
authoritative. An entry point has one job (point at the right file) and is far easier to keep in sync.

**Rules established:**

1. `README.fa.md` is an index, never a place where decisions are made.
2. Changes to `README.md` must be mirrored in `README.fa.md` in the same change.
3. Status labels stay in English everywhere so they remain greppable.
4. File names, paths, and code identifiers stay Latin.

**Impact:** Persian-speaking team members have an entry point. Any future edit to the English index needs
a matching Persian edit.

---

## 2026-10-07 — Initial documentation system created

**Type:** `DOC`

**Changed:** Created the entire `Docs/` tree. No prior documentation existed; the repository was empty.

**Files created:**

```
Docs/
├── README.md                                  Documentation index and how to use it
├── product/
│   ├── product-overview.md                    What the product is, value chain, non-goals
│   ├── product-principles.md                  20 binding principles (P1–P20)
│   ├── terminology.md                         Canonical vocabulary, Persian ↔ English
│   ├── business-model.md                      Subscription concepts (no pricing invented)
│   ├── roadmap.md                             Phases + the mandated build order
│   ├── ux-principles.md                       Customer + staff UX rules
│   ├── design-system.md                       Visual direction for the menu demo
│   └── menu-demo-brief.md                     The first implementation deliverable
├── flows/
│   ├── user-flows.md                          Master end-to-end flow map
│   ├── customer-flow.md                       Scan → browse → order → status → bill
│   ├── ordering-flow.md                       Cart, submission, idempotency, status
│   └── staff-flow.md                          Auth, approval, orders, settlement
├── domain/
│   ├── menu-system.md                         Categories, products, availability, archiving
│   ├── table-management.md                    Tables, state machine, session binding
│   ├── customer-sessions.md                   Anonymous identity and its lifecycle
│   ├── approval-system.md                     The anti-abuse gate
│   ├── order-system.md                        Order structure, snapshots, cancellation
│   ├── order-state-machine.md                 Every valid/invalid transition
│   ├── billing.md                             Bill structure, settlement, future split bills
│   └── kitchen-and-bar.md                     Stations, routing, KDS vs. printed tickets
├── platform/
│   ├── multi-tenancy.md                       Tenant model, isolation, URL strategy
│   ├── roles-and-permissions.md               Roles, permission matrix proposal, RBAC
│   ├── security.md                            Consolidated security requirements
│   ├── audit-log.md                           What is audited and how
│   ├── subscriptions.md                       Tenant lifecycle and its consequences
│   └── analytics.md                           Data preservation for future reporting
├── technical/
│   ├── architecture.md                        Required system shape (stack undecided)
│   ├── data-model.md                          Entity model and invariants
│   ├── api-concepts.md                        API surface concepts and guarantees
│   ├── realtime.md                            Status propagation (transport undecided)
│   ├── qr-system.md                           QR tokens, types, lifecycle
│   ├── idempotency.md                         Duplicate-order protection
│   ├── printing.md                            Deliberately unspecified — founder-owned
│   └── offline-and-sync.md                    Why offline is excluded
└── governance/
    ├── decision-log.md                        37 decisions + 14 recorded as unresolved
    ├── contradictions-and-risks.md            7 spec contradictions + 30 risks
    ├── open-questions.md                      Grouped, prioritised register
    ├── future-features.md                     Anticipated scope + design constraints
    └── changelog.md                           This file
```

**Summary:** Full requirements from the founding brief were organised, analysed, and documented from
scratch. 37 decisions were recorded with reasons, rejected alternatives, and consequences. 14 topics were
explicitly recorded as *unresolved* rather than invented.

**Key conclusions:**

1. The product is a **restaurant workflow system**, not a QR menu (D-001).
2. The **menu demo is the first implementation deliverable**, before backend or admin (D-030).
3. **Tenant isolation** must be backend-enforced at the data layer (D-002).
4. **Approval is the anti-abuse gate**; GPS and Wi-Fi are explicitly rejected (D-007).
5. **Snapshots on order lines** are the hardest constraint to preserve and the easiest to break (D-019).
6. The **technology stack is undecided** and blocks all implementation.

**Contradictions found (not silently resolved):**

| # | Contradiction | Status |
|---|---|---|
| 1 | The order lifecycle has no cancellation state, yet audit requires it | Awaiting decision |
| 2 | Approve-once-per-session weakens the anti-abuse gate's purpose | Awaiting decision |
| 3 | One-open-session-per-table conflicts with future table merge | Recommendation proposed |
| 4 | Tenant = restaurant vs. brand = restaurant (multi-branch) | Awaiting decision |
| 5 | GPS rejected, yet "customer is inside" is assumed throughout | Accepted trade-off |
| 6 | Don't over-engineer vs. don't make the future impossible | Resolved: extensible shape, minimal features |
| 7 | Entrance QR customers cannot order (no table) | Awaiting decision |

**Highest-priority unresolved items:** technology stack; approved-session expiry policy; currency unit
(Toman vs. Rial); cancellation/rejection states; menu draft/publish; tenant vs. brand; staff
authentication; Persian typeface; demo imagery licensing.

**Impact:** No implementation may begin. The founders should answer the 🔴 blocking questions in
[`governance/open-questions.md`](open-questions.md).

---

## Template — copy for future entries

```
## YYYY-MM-DD — <short title>
**Type:** DECISION | DOC | CONTRADICTION | CORRECTION | SCOPE
**Changed:** <files>
**Decision:** D-0xx (if applicable)
**Summary:** <what changed and why>
**Impact:** <who needs to act>
```