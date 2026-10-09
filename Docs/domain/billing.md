# Billing

Bill structure, calculation, settlement recording, and the future of split bills.

Related: [`../flows/ordering-flow.md`](../flows/ordering-flow.md) §7 ·
[`../flows/staff-flow.md`](../flows/staff-flow.md) §8 ·
[`order-system.md`](order-system.md)

---

## 1. What it is

How the money is calculated for a table session, shown to the customer, and settled at the cashier.

**Who uses it:** the customer (reads the bill), the cashier (settles it), the owner (reports on it).

---

## 2. Why it exists

The order tells you *what* was ordered. The bill tells you *how much is owed* — and it must be
trustworthy, because it is the moment the restaurant and the customer settle their relationship.

---

## 3. Scope

`DECIDED`

- The customer **may view** the bill.
- Payment is made **physically at the restaurant's cashier**.
- The system **records** the payment/settlement state.
- **No online payment** in the initial product.

### 3.1 Non-goals

- ❌ Online payment, card, wallet, or gateway integration
- ❌ Receipt printing (format undefined — see [`../technical/printing.md`](../technical/printing.md))
- ❌ Tips (not mentioned in the brief)
- ❌ Split payment (multiple payers) — `FUTURE`
- ❌ Customer-applied discounts (`DECIDED` — the customer cannot modify the bill)

---

## 4. Bill calculation structure

`DECIDED` (principle P17)

```
Subtotal
  + Add-ons
  − Discounts
  + Other applicable charges (tax, service charge)
  = Grand Total
```

**Rule:** billing logic must not be hard-coded in a way that prevents discounts, taxes, service charges,
or fees later. Today's charges may all be zero — the structure must still exist.

### 4.1 Calculation order

`PROPOSED`

1. Sum each order line's **snapshotted** unit price × quantity → per-line totals.
2. Add snapshotted modifier/add-on prices into the line total.
3. Sum line totals across **all non-cancelled, non-rejected orders in the session** → **Subtotal**.
4. Apply order-level then bill-level **discounts**.
5. Add **charges** (tax, service).
6. Compute **Grand Total**.

**Critical:** step 1 uses snapshots, never live product prices (P7). See
[`order-system.md`](order-system.md) §5.5.

### 4.2 Money representation

`DECIDED`

- Integers only. No floating point, ever.
- Currency unit: `OPEN QUESTION` (Toman vs. Rial — unresolved; affects display and storage scale).

---

## 5. What the customer sees

`DECIDED` (contents) · `PROPOSED` (presentation)

Required content:

- Ordered items
- Quantities
- Item prices
- Discounts, if applicable
- Total

Persian, RTL, with Persian digits and clear grouping (design-system §4.3).

**The customer cannot** edit anything, apply a discount, or mark the bill paid (ux-principles C14).

---

## 6. Settlement

`DECIDED`

The customer goes to the cashier. The cashier records that payment was received.

### 6.1 Settlement flow

```
Customer finishes  →  asks for the bill (in the app or verbally)
        ↓
Cashier opens the table session's bill
        ↓
Cashier confirms items with the customer
        ↓
[Apply discount — permitted roles only: OPEN QUESTION]
        ↓
Cashier records payment received (cash / card at their own terminal)
        ↓
Orders → PAID
        ↓
Cashier closes the table session → session CLOSED
        ↓
Table becomes AVAILABLE again
```

### 6.2 Settlement record

`PROPOSED`

| Field | Notes |
|---|---|
| Tenant, table session | Scoping |
| Gross amount | From the bill |
| Discount applied + by whom + reason | Audited (P19) |
| Net amount | What was actually collected |
| Payment method(s) | `OPEN QUESTION` — cash/card/other |
| Amount received (cash) | For change calculation |
| Change given | Restaurant-side arithmetic |
| Recorded by (staff) | Attribution |
| Recorded at | Timestamp |

**Note:** the platform records *that* settlement happened. It does not process the money — the
restaurant's own POS/terminal does that.

---

## 7. Discounts

**Mechanism exists (`DECIDED` as a structural component) but the product rules are `OPEN QUESTION`.**

| Question | Notes |
|---|---|
| Discount type — percentage or fixed amount? | Both may be needed |
| Scope — whole bill, or specific items? | Affects the calculation structure |
| Who may apply a discount? | Cashier? Manager only? Owner only? |
| Reason required? | Auditability (P19) |
| Can the customer request a discount? | The customer can't apply one themselves |
| Discount codes / promotions? | `FUTURE` |

**Recommendation (`PROPOSED`):** implement bill-level discount as a typed amount with a recorded reason
and actor; restrict application to authorised roles; never allow the customer to set it.

---

## 8. Taxes and service charges

`OPEN QUESTION` — **explicitly deferred by the brief.**

The brief states: *"The exact legal/tax requirements for Iran should be researched separately when
implementation reaches that stage."*

| Question | Notes |
|---|---|
| Is VAT applicable to restaurant food in Iran, and at what rate? | Requires legal research |
| Is there a service charge expectation? | Some cafés add one informally |
| Is tax per-item or on the bill? | Affects the model |
| Must tax appear as a separate line? | Likely yes if applicable |
| Who is responsible for tax correctness? | Usually the restaurant |

**Architectural requirement regardless:** the bill must be able to carry **typed, additive charge lines**
so that when tax is researched, no calculation rewrite is required.

---

## 9. Split bill

`FUTURE` — documented, not built.

### 9.1 The stated scenario

> Four people share a table. Total: 1,000,000 تومان. They want to split the bill.

Potential future capabilities:

- Split the bill evenly
- Pay only selected items
- Merge bills
- Transfer orders between tables

### 9.2 Constraints this places on today's model

`DECIDED` as architecture guidance

| Future feature | Constraint on the bill model |
|---|---|
| Split bill | **An order cannot be an indivisible billing unit.** Line items must be allocatable to a bill. |
| Split evenly | A bill must be able to exist without owning lines — i.e. a bill can hold an allocated *amount* |
| Pay selected items | Requires a bill↔line-item allocation relation, not just `order_id` on the bill |
| Merge bills | The bill must be separable from the table session |
| Transfer orders | Already supported by session-based design |

**Recommended now (`PROPOSED`):** model the bill as a **separate entity with an allocation table**
(`bill_allocations` linking bills to order line items with amounts), rather than a `bill` row with a
`total` column. This costs almost nothing today and makes split bills an additive feature rather than a
redesign.

**This is one of the few "future-proofing" costs that pays for itself** — see P8.

### 9.3 Also future

| Feature | Notes |
|---|---|
| Split by person | Needs per-person identity — a device session is insufficient |
| Multiple payers per bill | Needs a settlement-per-payer model |
| Tip / service charge entered at settlement | Additive charge lines |
| Comped items | Discount lines with a reason |

---

## 10. Business rules

| # | Rule | Status |
|---|---|---|
| BL1 | Bill aggregates all non-cancelled orders in the table session | `DECIDED` |
| BL2 | Line prices come from snapshots, never live products | `DECIDED` |
| BL3 | Money is stored as integers | `DECIDED` |
| BL4 | The bill is customer-viewable but not customer-editable | `DECIDED` |
| BL5 | Settlement is recorded at the cashier; no online payment | `DECIDED` |
| BL6 | The calculation is structural (subtotal/discount/charges/total) | `DECIDED` |
| BL7 | Discounts are attributed and audited | `DECIDED` |
| BL8 | Cancelled/rejected orders never contribute | `PROPOSED` |
| BL9 | A session may have only one settlement (MVP) | `PROPOSED` |
| BL10 | Charges are typed and extensible | `PROPOSED` |

---

## 11. Edge cases

| Edge case | Handling | Status |
|---|---|---|
| Some orders cancelled, some not | Bill sums only valid orders | `PROPOSED` |
| Order delivered but customer disputes an item | No dispute flow in MVP | `OPEN QUESTION` |
| Session closed with unpaid orders | Blocked, or forced with a reason | `OPEN QUESTION` |
| Cashier records a wrong amount | Needs a correction/reversal concept — `OPEN QUESTION` | `OPEN QUESTION` |
| Cashier records more cash than the total | Change calculated staff-side | `DECIDED` |
| Discount larger than the subtotal | Validation must reject | `PROPOSED` |
| Zero-total bill (full discount) | Allowed? `OPEN QUESTION` | `OPEN QUESTION` |
| Customer asks for a printed receipt | Not defined | `OPEN QUESTION` |
| Rounding needed | Integers in the smallest unit avoid this; verify Toman has no subunit in practice | `PROPOSED` |
| Customer pays by card on the restaurant's own terminal | Platform only records the settlement | `DECIDED` |
| Bill viewed before all orders are delivered | Allowed; shows current orders | `PROPOSED` |
| Item added to cart but never submitted | Not on the bill | `DECIDED` |
| Currency unit mismatch between tenants | Each tenant's unit is explicit | `OPEN QUESTION` (unit unresolved) |
| Refund | `FUTURE` — needs a reversal, not a cancellation | `FUTURE` |

---

## 12. Security considerations

| Concern | Control | Status |
|---|---|---|
| Client-supplied totals | Ignored; computed server-side | `DECIDED` |
| Cashier granting an unauthorised large discount | Role permission + audit | `DECIDED` |
| Cross-tenant bill access | Tenant scoping on bill and allocation reads | `DECIDED` |
| Customer modifying the bill | No write path for customers | `DECIDED` |
| Settlement recorded without authority | Role check on the settlement endpoint | `DECIDED` |
| Settling an already-settled session | Idempotency / block | `PROPOSED` |
| Price changed to hide a revenue drop | Snapshots + audit log | `DECIDED` |
| Overwriting a settlement record | Append-only correction, never update-in-place | `PROPOSED` |

---

## 13. Data implications

| Entity | Key fields |
|---|---|
| **Bill** | id, tenant_id, table_session_id, subtotal, discount_total, charge_total, grand_total, currency_unit, status, created_at |
| **Bill allocation** (`PROPOSED`) | bill_id, order_line_item_id, amount |
| **Bill charge line** (`PROPOSED`) | bill_id, type (`TAX`/`SERVICE`/`OTHER`), label, amount, rate? |
| **Discount** (`PROPOSED`) | bill_id, type (`PERCENT`/`AMOUNT`), value, reason, applied_by, applied_at |
| **Settlement** | id, tenant_id, bill_id, gross, discount, net, method, cash_received, change_given, recorded_by, recorded_at |

**Indexes:** `(tenant_id, table_session_id)`; `(tenant_id, created_at)` for reports.

**Currency unit must be stored on the bill.** Even if the platform standardises on one unit, storing it
explicitly prevents a future unit change from silently rewriting history.

---

## 14. Current decision summary

`DECIDED`

A bill aggregates the session's orders, computed structurally as subtotal + add-ons − discounts +
charges = grand total, from snapshotted prices. The customer views it; payment happens at the cashier;
the system records settlement. No online payment. Money is integers. No currency unit decision yet.

**Not decided:** discount permissions, payment methods, taxes, tips, split bills, receipt format,
settlement correction policy.

---

## 15. Future considerations

| Feature | Constraint on today's model |
|---|---|
| Split bill | Bill↔line-item allocation must be possible |
| Multiple payers | Settlement must not be 1:1 with a bill |
| Tips | Additive charge line |
| Comps | Discount line with reason + actor |
| Tax | Typed charge line |
| Refunds | Reversal entries, never destructive updates |
| Receipts / thermal printing | Output format per station |
| Loyalty/discount codes | Discount code entity + validation rules |
| Multi-currency | Tenant currency unit |
| Export for accounting | Structured export of bills and settlements |

---

## 16. Open questions

| # | Question | Blocking? |
|---|---|---|
| Q1 | **Currency unit — Toman or Rial?** | **Yes — schema + all display** |
| Q2 | Which roles may apply discounts? | **Yes — RBAC** |
| Q3 | Iranian VAT applicability and rate | Yes (before launch, not before MVP) |
| Q4 | Payment methods to record | No |
| Q5 | Split-bill MVP or later? | **Yes — decides the bill model shape** |
| Q6 | Settlement correction policy | No |
| Q7 | Receipt printing format | No |
| Q8 | Tips supported? | No |
| Q9 | Full-discount zero-total bill allowed? | No |

Full register: [`../governance/open-questions.md`](../governance/open-questions.md).