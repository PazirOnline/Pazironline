# Documentation Index

> **فارسی:** برای نسخهٔ فارسی این راهنما به [`README.fa.md`](README.fa.md) مراجعه کنید.

This directory is the **source of truth** for the project. It is part of the product, not an afterthought.

If you are a new AI agent, developer, designer, or a replacement team: read this file, then read
`product/product-overview.md` and `product/product-principles.md` before anything else.

**Status of the project: documentation phase. NO APPLICATION CODE HAS BEEN WRITTEN YET. Do not start
implementation until explicitly instructed.** See [`product/roadmap.md`](product/roadmap.md) for
the mandated implementation order.

---

## How to use this documentation

### 1. Status labels are mandatory

Every non-trivial statement in these docs carries one of the following labels. Never remove a label.

| Label | Meaning |
|---|---|
| `DECIDED` | Settled by the founders. Do not change without an explicit new decision + decision-log entry. |
| `PROPOSED` | Suggested by documentation/architecture, not yet approved. Treat as a hypothesis. |
| `FUTURE` | Explicitly out of MVP scope. May be built later. Must not be blocked by current design. |
| `OPEN QUESTION` | Requires a product/business/technical decision. Listed in `governance/open-questions.md`. |
| `DO NOT ASSUME` | Tempting inference that is **not** decided. Do not build on it. |

### 2. The 12-question mechanic template

Deep-dive docs (`domain/*`, `platform/*`, some `technical/*`) follow a fixed structure so that any single
mechanic can be understood in isolation:

1. What it is
2. Why it exists
3. Who uses it
4. How it works
5. User flow
6. Business rules
7. Edge cases
8. Security considerations
9. Data implications
10. Current decision
11. Future considerations
12. Open questions

### 3. Rules for agents and humans editing these docs

- **Never silently reverse a `DECIDED` item.** If you find a contradiction, record it in
  `governance/contradictions-and-risks.md`, do not "fix" the doc.
- **Never invent business decisions.** If something is unspecified, label it `OPEN QUESTION` and add it
  to `governance/open-questions.md`.
- **Every new major decision gets a row** in `governance/decision-log.md` (IDs `D-0xx`).
- **[`changelog.md`](governance/changelog.md) records every meaningful doc change**, newest first, with
  a date.
- If docs and code ever disagree, **the docs are updated first** (or the code is wrong).

### 4. Product language

- Customer-facing product, UI copy, and all design work: **Persian, RTL, mobile-first**. `DECIDED`
- Internal documentation in this repo: **English**, with Persian terms introduced where they matter.
  Rationale: the docs must be usable by any engineer regardless of language; the *product* is Persian.
- **Exception:** [`README.fa.md`](README.fa.md) is a full Persian entry point (index, product summary,
  folder map, glossary, review checklist) so Persian-speaking team members can start without translating
  the whole tree. It is an **entry point**, not a replacement — the English docs remain canonical and
  `README.fa.md` must be kept in sync with this file, section for section.
  `DECIDED` by founder instruction, 2026-10-07 — see [D-038](governance/decision-log.md#d-038).

---

## Directory map

### Product layer — read these first

| File | Purpose |
|---|---|
| [`product/product-overview.md`](product/product-overview.md) | What the product is, who it serves, the value chain, non-goals |
| [`product/product-principles.md`](product/product-principles.md) | The 20 rules (P1–P20) that constrain every design and code decision |
| [`product/terminology.md`](product/terminology.md) | Canonical vocabulary (Persian ↔ English). Prevents naming drift |
| [`product/business-model.md`](product/business-model.md) | Subscription concepts, tenant lifecycle. Pricing explicitly **not** invented |
| [`product/roadmap.md`](product/roadmap.md) | Phases, and the **mandated build order** (menu demo first) |
| [`product/ux-principles.md`](product/ux-principles.md) | Customer + staff UX rules (Persian/RTL, speed, friction, touch targets) |
| [`product/design-system.md`](product/design-system.md) | Visual language direction, typography, color, components — for the menu demo |
| [`product/menu-demo-brief.md`](product/menu-demo-brief.md) | **The first implementation deliverable**: scope, demo data, exit criteria |

### Flows — the narrative of the product

| File | Purpose |
|---|---|
| [`flows/user-flows.md`](flows/user-flows.md) | Master end-to-end flow map for all actors |
| [`flows/customer-flow.md`](flows/customer-flow.md) | Scan → browse → request access → order → status → bill |
| [`flows/ordering-flow.md`](flows/ordering-flow.md) | Cart, order submission, duplicate protection, multiple orders per session |
| [`flows/staff-flow.md`](flows/staff-flow.md) | Staff login, approval, order triage, fulfilment, settlement, KDS |

### Domain mechanics — the 12-question deep dives

| File | Purpose |
|---|---|
| [`domain/menu-system.md`](domain/menu-system.md) | Categories, products, images, pricing, availability, archiving, publishing |
| [`domain/table-management.md`](domain/table-management.md) | Tables, table state machine, transfer/merge/split (future), session↔table binding |
| [`domain/customer-sessions.md`](domain/customer-sessions.md) | Anonymous session identity, persistence, one-device-per-table, token lifecycle |
| [`domain/approval-system.md`](domain/approval-system.md) | Staff approval as the anti-abuse gate. Explicitly **not** GPS/Wi-Fi |
| [`domain/order-system.md`](domain/order-system.md) | Order structure, line items, snapshots, numbering, cancellation |
| [`domain/order-state-machine.md`](domain/order-state-machine.md) | Internal statuses vs. customer-facing wording, every valid/invalid transition |
| [`domain/billing.md`](domain/billing.md) | Bill calculation structure, settlement recording, split bill (future) |
| [`domain/kitchen-and-bar.md`](domain/kitchen-and-bar.md) | Stations, item→station routing, KDS vs. printed tickets vs. both |

### Platform layer

| File | Purpose |
|---|---|
| [`platform/multi-tenancy.md`](platform/multi-tenancy.md) | Tenant model, isolation enforcement, URL/slug resolution, future custom domains |
| [`platform/roles-and-permissions.md`](platform/roles-and-permissions.md) | Owner/Manager/Cashier/Waiter/Kitchen/Barista, permission matrix, RBAC approach |
| [`platform/security.md`](platform/security.md) | Tenant isolation, authn/authz, QR token security, rate limits, abuse, session security |
| [`platform/audit-log.md`](platform/audit-log.md) | What is audited, retention concepts, actor/action/target model |
| [`platform/subscriptions.md`](platform/subscriptions.md) | Tenant lifecycle states, grace period behaviour, effect on customer-facing menu |
| [`platform/analytics.md`](platform/analytics.md) | Which clean data must be preserved now for future reporting |

### Technical layer — architecture **intent**, not a locked implementation

| File | Purpose |
|---|---|
| [`technical/architecture.md`](technical/architecture.md) | System shape, components, tenancy isolation strategy, scaling posture |
| [`technical/data-model.md`](technical/data-model.md) | Entity-level model, key rules, snapshot fields, soft delete, indexes that matter |
| [`technical/api-concepts.md`](technical/api-concepts.md) | API surface concepts, versioning, idempotency, errors, pagination |
| [`technical/realtime.md`](technical/realtime.md) | Status push to customer + staff. **Technology explicitly undecided** |
| [`technical/qr-system.md`](technical/qr-system.md) | QR token design, static identity vs. dynamic session, print artifacts, lifecycle |
| [`technical/printing.md`](technical/printing.md) | Printer/ticketing concepts. **Explicit placeholder** — founders own this solution |
| [`technical/idempotency.md`](technical/idempotency.md) | Duplicate-order protection in depth |
| [`technical/offline-and-sync.md`](technical/offline-and-sync.md) | Why offline is out of scope, and what that implies |

### Governance — decisions, risks, questions

| File | Purpose |
|---|---|
| [`governance/decision-log.md`](governance/decision-log.md) | Every major decision: reason, alternatives, why it won, consequences |
| [`governance/contradictions-and-risks.md`](governance/contradictions-and-risks.md) | Detected conflicts in the brief + likely future failure modes |
| [`governance/open-questions.md`](governance/open-questions.md) | Grouped unanswered questions, prioritised by blocking impact |
| [`governance/future-features.md`](governance/future-features.md) | Everything anticipated but out of scope, with the constraint it must respect |
| [`governance/changelog.md`](governance/changelog.md) | Dated log of documentation changes |

---

## 5. Product summary at a glance

`DECIDED`

> **A multi-tenant SaaS for Iranian cafés and restaurants** providing a **Persian, RTL,
> mobile-first digital menu** with **table-based ordering** gated by a **human approval step**.

The product chain:

```
Menu → Table → Customer Session → Approval → Order → Preparation → Delivery → Bill → Payment
```

| Key principle | Decision |
|---|---|
| Browsing the menu needs no permission | `DECIDED` |
| Ordering requires staff approval | `DECIDED` |
| Approve once per session, not per order | `DECIDED` |
| No mandatory customer registration; name and phone optional | `DECIDED` |
| Product name/price are snapshotted onto the order | `DECIDED` |
| GPS and restaurant Wi-Fi are **not** the security mechanism | `DECIDED` |
| Offline operation is out of scope | `DECIDED` |
| Order submission must be idempotent | `DECIDED` |
| Tenant isolation is enforced in the backend and data layer | `DECIDED` |
| First implementation deliverable: **the customer menu demo** | `DECIDED` |

Full detail: [`product/product-overview.md`](product/product-overview.md) and
[`product/product-principles.md`](product/product-principles.md).

---

## 6. Quick start for a new agent

```
1. README.md                                   (this file)
2. product/product-overview.md                 (what/why)
3. product/product-principles.md               (the rules you must not break)
4. product/terminology.md                      (the words)
5. flows/user-flows.md                         (the story)
6. domain/*.md                                 (the mechanics, one at a time)
7. platform/multi-tenancy.md + platform/security.md   (the non-negotiables)
8. technical/architecture.md + technical/data-model.md
9. governance/decision-log.md                  (what is already settled)
10. governance/open-questions.md               (what is NOT settled — ask, do not assume)
```

---

## 7. Common Persian terms

| Persian | English | Meaning |
|---|---|---|
| مستأجر (Tenant) | Tenant | One restaurant as an isolated platform customer |
| منو | Menu | The set of categories and products |
| دسته‌بندی | Category | A menu grouping (e.g. «نوشیدنی‌ها») |
| محصول / آیتم | Product | An orderable item |
| میز | Table | A physical restaurant table |
| نشست میز | Table Session | Time-boxed occupancy of a table; owns the orders and the bill |
| نشست مشتری | Customer Session | Anonymous device identity for the duration of a visit |
| درخواست دسترسی سفارش | Ordering Access Request | The request for permission to order |
| تأیید | Approval | The staff action that grants ordering access |
| در انتظار تأیید | Pending Approval | Customer-facing wording while waiting |
| سبد خرید | Cart | The pre-submission client-side draft |
| سفارش | Order | A submitted, trackable request |
| ردیف سفارش | Line Item | One product + quantity within an order |
| تصویر سفارش | Order Snapshot | Frozen name/price/options at submit time |
| ایستگاه | Station | Kitchen, bar, … — where an item is prepared |
| صورت‌حساب | Bill | The payable summary of a table session |
| تسویه | Settlement | Recording payment received at the cashier |
| مجوز | Permission | An atomic capability |
| نقش | Role | A named bundle of permissions |
| توکن عمومی | Public Token | A random, unguessable string surfaced in URLs/QR codes |
| گزارش ممیزی | Audit Log | Immutable record of significant actions |

Full glossary: [`product/terminology.md`](product/terminology.md).

---

## 8. Implementation status

| Phase | Status |
|---|---|
| Documentation | **In progress** |
| Phase 1 — customer menu demo | **Awaiting explicit instruction to implement** |
| Phase 2 — platform foundations | Not started |
| Phase 3 — core order workflow | Not started |
| Phase 4 — restaurant operations | Not started |

**Hard gate:** broader implementation begins only after the customer menu demo is **explicitly
approved** (`DECIDED`).

Items that must **not** be the first steps (`DECIDED`): admin dashboard, authentication, database,
backend CRUD, subscription management.

---

## 9. What is missing before implementation starts

Blocking questions are in [`governance/open-questions.md`](governance/open-questions.md). The top five:

| # | Question | What it blocks |
|---|---|---|
| 1 | **Technology stack** (language, framework, database, hosting) | Everything |
| 2 | **Persian typeface** + **demo imagery source** | The demo — the first deliverable |
| 3 | **Currency unit: Toman or Rial** | The whole data model |
| 4 | **Cancellation / rejection statuses** | The order state machine |
| 5 | **Staff auth method** + **approved-session expiry** | All staff work; the security model |

Also blocking the schema: "menu draft/publish or live edits?" and "tenant = restaurant or brand?".

---

## 10. Quick review rules

Before approving any change, ask yourself:

1. Is tenant isolation enforced in the backend, not just the frontend?
2. Are prices resolved server-side and never accepted from the client?
3. Do order line items carry snapshots, so history never mutates?
4. Is order submission idempotent?
5. Is the customer UI Persian and RTL?
6. Is a significant action audited?
7. Has anything been designed that *assumes* a printer or kitchen monitor exists? **It should not be.**
8. Has anything been built beyond what is currently required? [P20]

---

## 11. Words that must not be used

| Do not use | Use instead |
|---|---|
| "user" for a diner | **customer** / **customer session** |
| "user account" for customer identity | **customer session** (no account) |
| "shop" / "store" | **restaurant** / **café** |
| "guest" | **customer** |
| "basket"/"cart" for a submitted order | **order** (cart is only the pre-submit draft) |
| "guest login" | **approval** |
| "admin panel" | **staff application** |
| "billing engine" | **bill calculation** |

---

## 12. Useful links

- Start: [`README.md`](README.md) · [`README.fa.md`](README.fa.md) ·
  [`product/product-overview.md`](product/product-overview.md)
- Rules: [`product/product-principles.md`](product/product-principles.md)
- Decisions: [`governance/decision-log.md`](governance/decision-log.md)
- Open questions: [`governance/open-questions.md`](governance/open-questions.md)
- Changes: [`governance/changelog.md`](governance/changelog.md)

---

## Conventions used in this repo

- **Persian numbers**: prices are integers in the smallest unit the tenant operates in. The unit
  itself (Toman vs. Rial) is an `OPEN QUESTION` — see `governance/open-questions.md#business`.
- **Money**: integers only, no floating point. See [`domain/billing.md`](domain/billing.md).
- **IDs**: every domain entity has a stable internal ID and, where it is customer-facing, a separate
  opaque public token. Never expose sequential internal IDs in URLs or QR codes.
- **Time**: all timestamps stored in UTC, rendered in the restaurant's local timezone (Asia/Tehran
  assumed; per-tenant timezone configurable is `PROPOSED`).
- **Product entry points**: the customer menu at `/r/{restaurant-slug}`; a table QR at
  `/r/{slug}/t/{tableToken}`. See [`technical/qr-system.md`](technical/qr-system.md).