# Data Model

Entity-level model and the rules the schema must satisfy. Field lists are `PROPOSED` unless marked.

Related: [`architecture.md`](architecture.md) · [`../domain/`](../domain) ·
[`../platform/multi-tenancy.md`](../platform/multi-tenancy.md)

---

## 1. What this document is

The conceptual model — entities, relationships, and the invariants the schema must enforce.

**It is a model, not DDL.** No database has been chosen.

---

## 2. Global rules

`DECIDED`

| # | Rule |
|---|---|
| D1 | Every tenant-owned entity has `tenant_id`, indexed |
| D2 | Every query is tenant-scoped |
| D3 | Money is an integer in the tenant's currency unit |
| D4 | Timestamps are stored in UTC |
| D5 | Internal IDs are never exposed to customers |
| D6 | Customer-facing references use opaque random tokens |
| D7 | Order line items store immutable snapshots |
| D8 | Entities referenced by historical records are never hard-deleted |
| D9 | Soft delete via `archived_at` / `disabled_at` |
| D10 | Per-tenant uniqueness for human-facing codes |
| D11 | Slug is globally unique |

---

## 3. Entity map

```
Platform
└── Tenant ─────────────────────────────── isolation boundary
    ├── Subscription
    ├── Category ──────┐
    │   └── Product ───┤ 1:1 snapshot source
    │       ├── ProductImage
    │       └── [OptionGroup → Option]      FUTURE
    │       └── [ProductStation]            FUTURE
    ├── Table
    │   └── TableSession
    │       ├── OrderingAccessRequest
    │       ├── CustomerSession (0..n)
    │       ├── Order (1..n)
    │       │   └── OrderLineItem (1..n)
    │       └── Bill
    │           ├── BillAllocation         PROPOSED
    │           ├── BillCharge             PROPOSED
    │           └── Settlement
    ├── StaffMember ──── Role (m:n)
    ├── Station                               FUTURE
    ├── Printer                              FUTURE
    └── AuditEvent

CustomerSession ──── (anonymous, device-bound)
IdempotencyRecord
```

---

## 4. Entities

### 4.1 Tenant

| Field | Type | Notes |
|---|---|---|
| `id` | id | |
| `slug` | string | **Globally unique**, immutable (recommended) |
| `name` | string | Display |
| `status` | enum | Active / archived |
| `timezone` | string | `PROPOSED` |
| `currency_unit` | string | `OPEN QUESTION` — Toman/Rial |
| `logo_ref`, `cover_ref` | string? | Object storage refs |
| `description` | text? | |
| `created_at`, `archived_at` | timestamp | |

### 4.2 Subscription

| Field | Notes |
|---|---|
| `id`, `tenant_id` | |
| `state` | `TRIAL`/`ACTIVE`/`GRACE_PERIOD`/`SUSPENDED`/`CANCELLED` |
| `plan_key`? | `FUTURE` |
| `trial_ends_at?`, `grace_ends_at?`, `started_at?`, `ended_at?` | |
| `external_ref?` | Payment provider reference |

### 4.3 Category

| Field | Notes |
|---|---|
| `id`, `tenant_id` | |
| `name` | |
| `description`? | |
| `display_order` | |
| `is_active` | |
| `icon_ref`? | `PROPOSED` |
| `archived_at`? | |
| *(reserved)* `branch_id`, `available_from/to` | `FUTURE` / `OPEN QUESTION` |

### 4.4 Product

| Field | Notes |
|---|---|
| `id`, `tenant_id`, `category_id` | |
| `name`, `description`? | |
| `current_price` | integer — **the live price only** |
| `is_available` | «موجود» / «ناموجود» |
| `display_order` | |
| `sort_priority`? | `PROPOSED` — featured items |
| `archived_at`, `archived_by`, `archive_reason`? | `PROPOSED` |
| *(reserved)* `cost_price`?, `tax_code`?, `default_station_id`? | `OPEN QUESTION` / `FUTURE` |
| *(reserved)* option groups, variants | `FUTURE` (P8) |

### 4.5 ProductImage

`id`, `product_id`, `tenant_id`, `storage_key`, `display_order`, `alt_text?`

### 4.6 Table

| Field | Notes |
|---|---|
| `id`, `tenant_id` | |
| `code` | Human label «میز ۸» — unique **per tenant** |
| `qr_token` | Random opaque — unique **per tenant** |
| `section`? | `PROPOSED` |
| `capacity`? | `OPEN QUESTION` |
| `is_active`, `archived_at`? | |
| *(reserved)* `position_x/y` | `FUTURE` |

### 4.7 TableSession

| Field | Notes |
|---|---|
| `id`, `tenant_id`, `table_id` | |
| `status` | `PENDING_APPROVAL`/`APPROVED`/`REJECTED`/`CLOSED` (+ `SETTLING` `PROPOSED`) |
| `opened_at`, `closed_at`? | |
| `closed_by_staff_id`? | |
| `approved_by_staff_id`?, `approved_at`? | |
| `last_activity_at` | For idle expiry — `OPEN QUESTION` |
| `expires_at`? | `OPEN QUESTION` |
| *(reserved)* `merged_into_session_id`?, `split_from_session_id`? | `FUTURE` |

### 4.8 OrderingAccessRequest

`id`, `tenant_id`, `table_session_id`, `customer_session_id`, `status`, `requested_at`, `decided_at?`,
`decided_by_staff_id`?, `reason?`

### 4.9 CustomerSession

| Field | Notes |
|---|---|
| `id`, `tenant_id`, `table_session_id`? | |
| `state` | `ACTIVE`/`PENDING_APPROVAL`/`APPROVED`/`REJECTED`/`CLOSED`/`EXPIRED` |
| `token_hash` | **Hash only** — `PROPOSED` |
| `last_seen_at`, `expires_at`? | |
| `device_hint`? | `OPEN QUESTION` |

### 4.10 Order

| Field | Notes |
|---|---|
| `id`, `tenant_id`, `table_session_id` | |
| `order_number` | Sequential **per tenant** |
| `status` | See state machine |
| `customer_name?`, `customer_phone?` | **Optional** |
| `subtotal`, `total` | Integer |
| `currency_unit` | Stored explicitly |
| `placed_at` | Server-assigned |
| `confirmed_at?`, `preparing_at?`, `ready_at?`, `delivered_at?`, `paid_at?`, `closed_at?` | Per milestone |
| `cancelled_at?`, `cancelled_by_staff_id`?, `cancellation_reason`? | |
| `source`? | `PROPOSED` |
| `special_instructions`? | `OPEN QUESTION` |

### 4.11 OrderLineItem — the critical entity

| Field | Notes | Snapshot? |
|---|---|---|
| `id`, `order_id`, `tenant_id` | | |
| `product_id` | May point to an archived product | no |
| `quantity` | Positive integer | no |
| `unit_price` | **Snapshot** | **YES** |
| `name` | **Snapshot** | **YES** |
| `description`? | **Snapshot** | **YES** (`PROPOSED`) |
| `category_name`? | **Snapshot** | **YES** (`PROPOSED`, for analytics) |
| `options_snapshot`? | Options with their own prices | **YES** (reserved, P8) |
| `line_total` | | no |
| `station_snapshot`? | Frozen routing | **YES** (`FUTURE`) |
| `status`? | Item-level status | `FUTURE` |

**Invariant (D7/P7):** `unit_price`, `name`, and `options_snapshot` are written once and never updated.
Any report or bill reading item prices must read these fields, never `product.current_price`.

### 4.12 Bill

| Field | Notes |
|---|---|
| `id`, `tenant_id`, `table_session_id` | |
| `subtotal`, `discount_total`, `charge_total`, `grand_total` | Integer |
| `currency_unit` | Explicit |
| `status` | `OPEN`/`SETTLED`/`VOID` (`PROPOSED`) |
| `created_at` | |

### 4.13 BillAllocation — `PROPOSED`, recommended now

`id`, `bill_id`, `order_line_item_id`, `amount`

**Why include it now (billing §9.2):** split bills become an additive feature instead of a redesign. Cost
is low today; cost is high later.

### 4.14 BillCharge — `PROPOSED`

`id`, `bill_id`, `type` (`TAX`/`SERVICE`/`OTHER`), `label`, `amount`, `rate`?

### 4.15 Discount — `PROPOSED`

`id`, `bill_id`, `type` (`PERCENT`/`AMOUNT`), `value`, `reason`, `applied_by_staff_id`, `applied_at`

### 4.16 Settlement

`id`, `tenant_id`, `bill_id`, `gross`, `discount`, `net`, `method`, `cash_received`?, `change_given`?,
`recorded_by_staff_id`, `recorded_at`

### 4.17 StaffMember

`id`, `tenant_id`, `name`, `contact`, `status` (`INVITED`/`ACTIVE`/`DISABLED`), `invited_by?`,
`invited_at?`, `disabled_at?`, `auth_identity`? (depends on the `OPEN QUESTION` auth method)

### 4.18 Role / Permission

`Role`: `id`, `key`, `name_fa`, `is_system`
`Permission`: `key`, `description`
`RolePermission`: `role_id`, `permission_key`
`StaffRole`: `staff_id`, `role_id`

### 4.19 Station — `FUTURE`

`id`, `tenant_id`, `type`, `name`, `is_active`, `description`
`ProductStation` (`FUTURE`): `product_id`, `station_id`

### 4.20 Printer / PrintJob — `FUTURE`

See [`printing.md`](printing.md). **Do not design yet** — the founder-supplied solution will drive it.

### 4.21 AuditEvent

See [`../platform/audit-log.md`](../platform/audit-log.md).

### 4.22 IdempotencyRecord

`key`, `tenant_id`, `scope`, `request_fingerprint`, `response_ref`, `created_at`, `expires_at`

### 4.23 MenuVersion — `PROPOSED`

`tenant_id`, `version`, `bumped_at`

Used for cache invalidation (architecture §5) and for the unresolved draft/publish model
(menu-system §7.2).

---

## 5. Indexes that matter

| Query | Index |
|---|---|
| Customer menu read | `(tenant_id, category_id, display_order)` on products |
| Customer menu by slug | `slug` unique on tenants |
| Table QR resolution | `(tenant_id, qr_token)` unique |
| Table grid | `(tenant_id, status)` |
| Approval queue | `(tenant_id, status='PENDING', requested_at)` |
| Staff order board | `(tenant_id, status, placed_at)` |
| Station queue | `(tenant_id, station_snapshot, status, placed_at)` |
| Session orders | `(tenant_id, table_session_id, placed_at)` |
| Bill | `(tenant_id, table_session_id)` |
| Reports | `(tenant_id, placed_at)` |
| Audit timeline | `(tenant_id, occurred_at)` + per-target and per-actor variants |
| Idempotency | `(tenant_id, scope, key)` unique |

---

## 6. Relationships and cardinality

| Rule | Status |
|---|---|
| Tenant → categories, products, tables, staff, orders: 1:n | `DECIDED` |
| Category → products: 1:n | `DECIDED` |
| Table → table sessions: 1:n over time | `DECIDED` |
| **Table → open table sessions: 1:1** | `PROPOSED` — conflicts with FUTURE merge |
| Table session → customer sessions: 1:n | `PROPOSED` (MVP is 1:1, multi-device is FUTURE) |
| Table session → orders: 1:n | `DECIDED` |
| Order → line items: 1:n (min 1) | `DECIDED` |
| Table session → bill: 1:1 in MVP | `PROPOSED` (split bills are FUTURE) |
| Product → station: n:m | `FUTURE` |
| Staff ↔ role: n:m | `PROPOSED` |

**The one-open-session-per-table rule is the notable tension** — see
[`../governance/contradictions-and-risks.md`](../governance/contradictions-and-risks.md) §3.

---

## 7. Invariants the database or application must enforce

| # | Invariant |
|---|---|
| I1 | Line item snapshots are immutable |
| I2 | Order total equals the sum of its line totals (computed server-side) |
| I3 | An order belongs to exactly one tenant, and its table session belongs to the same tenant |
| I4 | Only defined status transitions occur |
| I5 | `order_number` is unique per tenant |
| I6 | `qr_token` is unique per tenant |
| I7 | At least one line item per order |
| I8 | Quantities are positive integers |
| I9 | A product referenced by any order is never hard-deleted |
| I10 | Audit events are never updated or deleted |

---

## 8. Data not modelled (deliberately)

| Not modelled | Why |
|---|---|
| Offline queues | P9 |
| Sync metadata | P9 |
| Inventory | Non-goal |
| Customers (as accounts) | P5 |
| Payments/transactions | No online payment |
| Notifications (in-app/email/SMS) | `OPEN QUESTION` — real-time may suffice |
| Menu drafts / versioning | `OPEN QUESTION` — blocks the schema |
| Analytics events | `OPEN QUESTION` (analytics §5) |

---

## 9. Open questions that block the schema

| # | Question | Why it blocks |
|---|---|---|
| Q1 | Tenant = restaurant or brand (+ branch dimension) | Every scoped table may need a branch key |
| Q2 | Currency unit — Toman or Rial | Column semantics and display scale |
| Q3 | Options as relational entities or JSON | Decides 3–4 tables |
| Q4 | Item-level order status | Adds a line status + derivation rules |
| Q5 | Menu draft/publish | Versioning or draft tables |
| Q6 | Split bill in MVP? | Decides whether BillAllocation ships now |
| Q7 | Session expiry policy | `expires_at` semantics |
| Q8 | Staff auth method | `StaffMember.auth_identity` shape |

**Recommendation:** resolve Q1, Q2, Q3, Q4 before freezing the schema. The rest can be added later
without data loss.