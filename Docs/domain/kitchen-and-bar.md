# Kitchen and Bar Workflow

How orders reach the people who make them, without assuming any particular hardware.

Related: [`../technical/printing.md`](../technical/printing.md) ·
[`../flows/staff-flow.md`](../flows/staff-flow.md) §7 ·
[`../domain/order-state-machine.md`](../domain/order-state-machine.md)

---

## 1. What it is

The production side: an order becomes a work item, it is routed to the right station, someone makes it,
and it goes back to the table.

**Who uses it:** kitchen staff, baristas, waiters.

---

## 2. Why it exists

Without it, orders sit in a queue that only the cashier can see, and the kitchen has no reliable work
list. This is where "it went to the wrong place" problems are born.

---

## 3. The neutrality principle

`DECIDED` (principle P16) — **this is the most important rule in this document.**

> The product must work for a restaurant that has a kitchen monitor, a restaurant that has only a
> thermal printer, and a restaurant that has both. **No design may assume a monitor exists.**

| Restaurant setup | What must work |
|---|---|
| Monitor only | Kitchen/bar see a live queue on screen |
| Printer only | Kitchen/bar get printed tickets; the app still tracks status |
| Both | Printer for the pass, screen for the queue |
| Neither (bare minimum) | The cashier/waiter manages status in the app |

**Failure mode to avoid:** designing the status model so that "kitchen marks ready" only exists because a
monitor exists. The state machine must be drivable by any role with permission, on any device.

---

## 4. Stations

`DECIDED` in concept · `FUTURE` in configuration

### 4.1 The example routing

From the brief:

```
Pizza     → Kitchen
Burger    → Kitchen
Cappuccino → Bar
Americano  → Bar
```

### 4.2 Station entity

`PROPOSED`

| Field | Notes |
|---|---|
| Tenant | Scoping |
| Name / type | `KITCHEN`, `BAR`, `DESSERT`, `GRILL`, custom |
| Description | Displayed on tickets/displays |
| Active | Reserved |
| Assigned staff | Roles bound to stations (`FUTURE`) |

### 4.3 Item → station routing

`FUTURE` (mechanism undecided) · `DECIDED` (the concept must be expressible)

| Configuration approach | Notes |
|---|---|
| Per product | Most precise; verbose for restaurants with many items |
| Per category | Simple; assumes a category maps to one station |
| Per product with category default | **Recommended `PROPOSED`** — covers 95% of cases with little admin |

**`OPEN QUESTION`:** how routing is configured, and whether an order can span multiple stations (it can —
a burger + cappuccino order has one kitchen item and one bar item).

### 4.4 Snapshot at submission

`DECIDED` — the station assignment is **frozen when the order is submitted**, not resolved live. If the
restaurant re-routes Cappuccino to the Kitchen next month, yesterday's orders still say "Bar".

Rationale: same reasoning as price snapshots (P7). Historical records must be truthful.

---

## 5. Dispatch mechanism

The three supported shapes.

### 5.1 A — Kitchen Display System (monitor)

`DECIDED` as supported, `FUTURE` as a detail

```
Order accepted
   → routed items appear on the station's queue display
   → ordered by arrival time (oldest first)
   → one tap: "started" / "ready"
```

| Concern | Requirement |
|---|---|
| Legibility | Readable at 2–3 m from a wall-mounted screen (S8) |
| Distinguishability | Order number + table must be readable at a glance |
| Update mechanism | Real-time (`OPEN QUESTION` transport) |
| Sound/attention cue | `OPEN QUESTION` — noise is a real design factor in kitchens |
| Stale order handling | An order sitting for 20 minutes must be visually obvious |

### 5.2 B — Printer / tickets

`DECIDED` as supported · `FUTURE` in implementation detail

```
Order accepted
   → ticket(s) printed, routed per station
   → kitchen works the paper
   → someone updates status in the app (or the system marks it at print time)
```

**Which station's printer receives which items** is the central routing question. If an order contains
pizza + cappuccino, does it print one ticket to a kitchen printer and one to a bar printer?

`OPEN QUESTION` — depends on the founder-supplied printing solution.

**`FUTURE`:** multiple printers per station; printer failure handling; ticket reprinting.

### 5.3 C — Both

The most common real-world setup eventually. The app is the source of truth; the printer is a paper
projection of it.

**Architectural requirement (`DECIDED` in principle):** printed output is **derived** state, never the
source of truth. A lost ticket must never mean a lost order.

---

## 6. Queue views

`DECIDED` requirements (ux-principles S3, S5)

| Requirement | Why |
|---|---|
| Queue-first, not dashboard-first | It's a working surface |
| Oldest / most urgent first | Urgency ordering |
| Only the role's station items | Kitchen sees kitchen, bar sees bar |
| Order number + table prominent | Identification |
| Line item quantities and **modifiers prominently** | Remake prevention (S4) |
| One-tap status progression | Speed |
| Large targets and readable type | Wet hands, urgency, distance |
| Time since order | Staff triage |

**Explicitly not required:** charts, KPIs, or analytics on these screens.

---

## 7. Item-level vs. order-level status

`OPEN QUESTION` — **this is the most consequential design question in this document.**

### 7.1 The problem

Real restaurant reality: a table orders a burger and a cappuccino. The cappuccino comes out in 2
minutes, the burger in 12. An order-level status forces the customer to see "در حال آماده‌سازی" even
though half their items are ready.

### 7.2 Options

| Model | Pros | Cons |
|---|---|---|
| **Order-level only** | Simple; matches the given lifecycle | Lying by omission; customers ask "where's my drink?" |
| **Item-level status** | Truthful; enables "everything ready" | More complex; the customer's mental model gets noisier |
| **Hybrid** — order-level summary + per-item detail | Best of both | Requires care in presentation |

### 7.3 Recommendation

`PROPOSED` — a **hybrid**:

- Each order line carries its own status (`PENDING`/`PREPARING`/`READY`/`DELIVERED`).
- The order's status is **derived**: if any item is preparing → `PREPARING`; if all ready → `READY`;
  etc.
- The customer sees a simple headline status plus, optionally, per-item detail.
- A "some items ready" signal is honest and reduces friction.

**This does not contradict the given order lifecycle** — it enriches it. The order-level statuses in
[`order-state-machine.md`](order-state-machine.md) remain valid as the aggregate.

**Decision needed before implementing the order board** — recorded in
[`../governance/open-questions.md`](../governance/open-questions.md#product).

---

## 8. Business rules

| # | Rule | Status |
|---|---|---|
| KB1 | No feature assumes a monitor exists | `DECIDED` |
| KB2 | Items route to stations; the concept must be expressible | `DECIDED` |
| KB3 | Station assignment is frozen at order submission | `DECIDED` |
| KB4 | Station views show only the role's items | `DECIDED` |
| KB5 | Any role with permission may drive status; it is not hardware-gated | `DECIDED` |
| KB6 | Modifiers are shown prominently in queue views | `DECIDED` |
| KB7 | Printed output is derived, never the source of truth | `DECIDED` |
| KB8 | An order may span multiple stations | `PROPOSED` |
| KB9 | Status is driven by the app, not the printer | `DECIDED` |
| KB10 | Queue ordering is by urgency/age | `DECIDED` |

---

## 9. Edge cases

| Edge case | Handling | Status |
|---|---|---|
| Restaurant has no kitchen/bar separation | Single station | `PROPOSED` |
| Restaurant has neither monitor nor printer | Cashier manages status in the app | `DECIDED` |
| Printer jams / is out of paper | Fallback: app queue + manual status. Notification `OPEN QUESTION` | `OPEN QUESTION` |
| Station device loses network | No offline mode (P9); show "no connection", orders still arrive when restored | `DECIDED` |
| One person covers both kitchen and bar | Staff can have multiple station roles | `FUTURE` |
| Same product routed to two stations | Allowed (`PROPOSED`) | `PROPOSED` |
| Item needs no preparation (water) | Skip production — routing must allow bypass | `PROPOSED` |
| Rush: 40 orders at once | Queue must stay usable; sorting and compactness | `PROPOSED` |
| Wrong item prepared | No correction flow in MVP | `OPEN QUESTION` |
| Order cancelled mid-preparation | Kitchen must be notified | `OPEN QUESTION` |
| Ticket reprinted | Must not create a new order | `DECIDED` (idempotent) |
| Item-level status without a display | Staff app per item | `PROPOSED` |
| Product has no station assigned | Default station | `PROPOSED` |

---

## 10. Security considerations

| Concern | Control | Status |
|---|---|---|
| Kitchen staff marking an order paid | Role permission blocks it | `DECIDED` |
| Kitchen viewing other tenants' orders | Tenant scoping | `DECIDED` |
| Tampering with the printed ticket | Ticket is derived; the app is the record | `DECIDED` |
| Forged status advancement | Server-side transition validation | `DECIDED` |
| Shared kitchen tablet attribution | Per-action actor recording (P19); auth method `OPEN QUESTION` | `OPEN QUESTION` |
| Customer name displayed in the kitchen | Only if provided; avoid unnecessary display | `DECIDED` (privacy) |

---

## 11. Data implications

| Entity | Key fields |
|---|---|
| **Station** (`FUTURE`) | id, tenant_id, type, name, is_active |
| **Product → station mapping** (`FUTURE`) | product_id, station_id (with category default) |
| **Order line** | `station_snapshot` (`DECIDED` — frozen), `status` (`FUTURE` — if item-level) |
| **Printer / print job** (`FUTURE`) | tenant_id, station_id, order_id, printed_at, status |

**Indexes:** `(tenant_id, station_id, status)` for a station queue; `(tenant_id, station_id, placed_at)`
for age ordering.

**Printing implementation is deliberately unspecified** — see
[`../technical/printing.md`](../technical/printing.md).

---

## 12. Current decision summary

`DECIDED`

Stations exist as a concept (Kitchen, Bar, …) and items route to them. Station assignment is frozen at
order submission. KDS displays, printed tickets, and app-only operation must all be supported — nothing
may assume a monitor. Station views are queue-first, role-scoped, with prominent modifiers. Printed
output is derived, never authoritative.

**Not decided:** routing configuration model, item-level status, printer architecture, sound cues,
printer failure handling.

---

## 13. Future considerations

| Feature | Constraint on today's model |
|---|---|
| Multiple stations per tenant | Station entity must exist |
| Multiple printers per station | Print jobs must be per station, not per tenant |
| Printer failure/retry | Print job status must be tracked independently of the order |
| Item-level status | Line items need a status field |
| Kitchen display themes per tenant | Display must be configurable |
| Preparation time analytics | Requires per-item timestamps |
| Ingredient depletion from preparation | Inventory integration |
| Order splitting by station (partial send) | Per-item send tracking |
| Expo / pass screen | A derived view |

---

## 14. Open questions

| # | Question | Blocking? |
|---|---|---|
| Q1 | Item-level vs. order-level status | **Yes — affects order model** |
| Q2 | Station routing configuration model | **Yes — product model** |
| Q3 | Printer architecture (founder-owned solution) | **Yes — blocks printing work** |
| Q4 | Does ticket printing advance the order status? | **Yes** |
| Q5 | Per-station vs. per-order tickets for multi-station orders | **Yes** |
| Q6 | Printer failure notification and fallback | Yes |
| Q7 | Sound/alert cues on displays | No |
| Q8 | Are "no preparation" items supported? | No |

Full register: [`../governance/open-questions.md`](../governance/open-questions.md).