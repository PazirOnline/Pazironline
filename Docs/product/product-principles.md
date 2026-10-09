# Product Principles

These are the rules that constrain every product, design, and engineering decision. If a design
conflicts with a principle here, the design is wrong — or the principle needs an explicit, logged
reversal.

Each principle carries a status. `DECIDED` principles are **load-bearing**: violating them is a defect.

---

## P1 — This is a restaurant workflow system, not a digital menu

`DECIDED`

The menu is the entry point, not the product. The product is the operational chain:

> Menu → Table → Customer Session → Approval → Order → Preparation → Delivery → Bill → Payment

**Consequence:** a proposal that only improves the menu's appearance, and adds nothing to the chain,
must justify itself against a future restaurant-management platform. Conversely, a proposal that adds
chain complexity the restaurants cannot operate yet is out of scope.

---

## P2 — Backend enforces tenant isolation; frontend is never a security boundary

`DECIDED`

Tenant A must never read or write tenant B's data — not menus, tables, orders, staff, sessions,
reports, or subscription.

**Consequence:** every data access path is tenant-scoped at the persistence layer, not filtered
"usually" in application code. Hidden UI elements are a UX convenience, never a control.

See [`../platform/multi-tenancy.md`](../platform/multi-tenancy.md), [`../platform/security.md`](../platform/security.md).

---

## P3 — Approval is the anti-abuse gate, not location

`DECIDED`

Scanning a QR grants **menu browsing only**. Ordering requires staff approval of the table's session.

**Explicitly rejected alternatives:** GPS geofencing, mandatory restaurant Wi-Fi. These are *not* the
primary security mechanism and must not be introduced as a substitute for approval.

**Why:** someone with a photo of a table QR must not be able to submit fake orders from home.

---

## P4 — Approve once per session, not per order

`DECIDED`

A table session is approved **once**. All orders during that session proceed without repeated
approval. Staff must not be asked to approve every individual order.

```
14:20 request access  →  14:21 approved
14:22 order #1021  14:40 order #1022  14:55 order #1023
```

**Consequence:** "approve" is a session-level state transition, not an order-level gate.

---

## P5 — Frictionless entry: scan → browse → order

`DECIDED`

- Menu browsing requires **no** registration, login, or permission.
- Ordering requires **no account creation**. Name and phone are **optional** at submission.
- One person scans for the whole table. Other diners need not scan.

**Consequence:** no forced sign-up anywhere in the customer flow. Anonymous identity is a first-class
concept, not a hack.

---

## P6 — Static QR identity, dynamic session state

`DECIDED`

A table's QR code is **static identity** and must not need reprinting when a new customer sits down.
Orderable state is a **Table Session**, which is dynamic.

**Consequence:** QR encodes an opaque random public token identifying restaurant + table. Never a
sequential database ID. Never session data.

See [`../technical/qr-system.md`](../technical/qr-system.md).

---

## P7 — Historical data never mutates

`DECIDED`

When a product's price, name, or availability changes, **existing orders do not change**. Order line
items store a snapshot of the product's name, price, options, and modifiers at submission time.

**Consequence:** no historical order may ever depend on a live product row for its displayed values.
Availability must be handled by a flag/archival, never destructive deletion that breaks history.

See [`../domain/order-system.md`](../domain/order-system.md) §Snapshots, [`../domain/menu-system.md`](../domain/menu-system.md) §Deletion.

---

## P8 — Domain model is extensible, features are not

`DECIDED`

The **data model** must accommodate variants, modifiers, add-ons, choices, stations, branches,
discounts, taxes, split bills, and custom domains without redesign.

The **feature set** must not implement what is not required yet.

**Consequence:** favour reserved/nullable columns and correct relationships over premature features.
"When we add modifiers we will not need a migration that loses data" is the test.

---

## P9 — Offline is out of scope

`DECIDED`

No offline-first design. No sync engine. No conflict resolution. The product assumes a live internet
connection.

**Consequence:** no local write queues, no reconciliation jobs, no local-first database. Reconnection
handling is limited to graceful retry + clear user messaging.

See [`../technical/offline-and-sync.md`](../technical/offline-and-sync.md).

---

## P10 — Duplicate submissions must never create duplicate orders

`DECIDED`

A slow network must not turn a double tap into two real orders. Order submission is idempotent.

**Consequence:** client-generated idempotency key per submit attempt; server enforces uniqueness and
returns the original order on replay.

See [`../technical/idempotency.md`](../technical/idempotency.md).

---

## P11 — The customer interface is a premium product surface

`DECIDED`

The customer-facing menu must **not** look like a generic admin template, a CRUD app, an AI-generated
landing page, or a copied restaurant template. Visual quality is a core product requirement, not
polish.

It must be Persian, RTL, mobile-first, fast, and immediately convincing to a restaurant owner.

**Consequence:** the first implementation deliverable is the **customer menu demo** — before any
backend, auth, or admin dashboard. See [`../product/roadmap.md`](../product/roadmap.md).

---

## P12 — Real-time is a requirement; the technology is not decided

`DECIDED` that the customer and staff must see order status updates without manually refreshing.

`OPEN QUESTION` as to *how* (polling, SSE, WebSocket, push).

**Consequence:** the domain must be modelled so any transport satisfies it. Do not hard-code a
transport choice yet. See [`../technical/realtime.md`](../technical/realtime.md).

---

## P13 — The model is extensible to a larger restaurant-management SaaS

`DECIDED`

Design must not make the MVP unnecessarily complicated, but must not make the obvious next
requirements impossible.

Explicitly anticipated: multiple branches, multiple stations, multiple printers, table
transfer/merge/split, split bills, modifiers, inventory, discounts, richer permissions, subscription
expiry, custom domains, analytics, abuse prevention, cancellation, historical pricing, audit.

**Consequence:** document the constraint each future feature places on today's model, in
[`../governance/future-features.md`](../governance/future-features.md).

---

## P14 — Customer interface is not an admin dashboard

`DECIDED`

The customer is standing or sitting in a restaurant, on a phone, possibly with one hand and possibly
in a hurry.

Design priorities: extremely fast load, clear hierarchy, large touch targets, minimal friction, fast
category access, clear availability, clear pricing, clear order status.

Registration is never forced. No dense tables, no sidebars, no admin chrome.

---

## P15 — Documented decisions are binding

`DECIDED`

This `Docs/` tree is part of the product. It must stay synchronized with reality.

- New major decision → add to [`../governance/decision-log.md`](../governance/decision-log.md) **and**
  update the affected docs in the same change.
- Never silently reverse a decision. Record the conflict, ask, then update.
- Undecided things stay explicitly undecided. Do not fabricate requirements to fill a gap.

---

## P16 — Print/KDS neutrality

`DECIDED`

The product must work for a restaurant with a kitchen monitor, a restaurant with only a thermal
printer, and a restaurant with both. Item routing to stations (pizza→kitchen, cappuccino→bar) is a
modelled concept even if the routing engine ships later.

**Consequence:** no design decision may assume a monitor exists. See
[`../domain/kitchen-and-bar.md`](../domain/kitchen-and-bar.md), [`../technical/printing.md`](../technical/printing.md).

---

## P17 — Bill calculation is structural, not hard-coded

`DECIDED`

The bill must be computed as:

```
Subtotal + Add-ons − Discounts + Other charges (tax, service) = Grand Total
```

Today's charges may be zero. The **structure** must exist and be extensible.

Payment is recorded at the restaurant's cashier. Online payment is out of scope.

See [`../domain/billing.md`](../domain/billing.md).

---

## P18 — Privacy-conscious data collection

`DECIDED`

Collect only what is needed. Name and phone at order submission are **optional**. No mandatory
registration, no unnecessary tracking, no data collection that has no stated purpose.

**Consequence:** every field in the model should be justifiable by a flow that uses it.

---

## P19 — Auditability is a system requirement, not a nice-to-have

`DECIDED`

Security- and money-relevant actions must be auditable: order cancelled, status changed, price
changed, product disabled, staff permission changed, session closed, discount applied.

**Consequence:** an append-only audit entity with actor, action, target, before/after, timestamp, and
source. See [`../platform/audit-log.md`](../platform/audit-log.md).

---

## P20 — Do not over-engineer the MVP

`DECIDED`

> Simple MVP + clean architecture + clear documentation + expandable foundation.

Every proposed abstraction must answer: *which current requirement needs it?* If none, it belongs in
the future-features register, not the code.

---

## Quick reference: principle → doc

| Principle | Primary doc |
|---|---|
| P1 workflow chain | `product/product-overview.md` |
| P2 tenant isolation | `platform/multi-tenancy.md`, `platform/security.md` |
| P3 approval gate | `domain/approval-system.md` |
| P4 approve once per session | `domain/approval-system.md`, `domain/table-management.md` |
| P5 frictionless entry | `flows/customer-flow.md`, `platform/roles-and-permissions.md` |
| P6 static QR | `technical/qr-system.md` |
| P7 historical integrity | `domain/order-system.md`, `domain/menu-system.md` |
| P8 extensible model | `technical/data-model.md` |
| P9 offline out | `technical/offline-and-sync.md` |
| P10 idempotency | `technical/idempotency.md` |
| P11 premium UI | `product/design-system.md`, `product/ux-principles.md` |
| P12 real-time need | `technical/realtime.md` |
| P13 extensibility | `governance/future-features.md` |
| P14 no admin chrome | `product/ux-principles.md` |
| P15 docs binding | `README.md`, `governance/decision-log.md` |
| P16 print/KDS neutrality | `domain/kitchen-and-bar.md`, `technical/printing.md` |
| P17 bill structure | `domain/billing.md` |
| P18 privacy | `flows/ordering-flow.md` |
| P19 audit | `platform/audit-log.md` |
| P20 no over-engineering | `governance/future-features.md`, `governance/open-questions.md` |