# Customer Flow

The complete customer-side journey, from QR scan to bill.

Related: [`user-flows.md`](user-flows.md) · [`ordering-flow.md`](ordering-flow.md) ·
[`../domain/approval-system.md`](../domain/approval-system.md) ·
[`../domain/customer-sessions.md`](../domain/customer-sessions.md)

---

## 1. What it is

The flow a diner in a restaurant experiences on their own phone. It is the surface that determines
whether a restaurant believes the product is worth paying for.

**Who uses it:** the customer. **Interface:** mobile browser, Persian, RTL.
**Language:** Persian throughout (`DECIDED`).

---

## 2. Why it exists

- It delivers the menu with zero friction — that is the hook.
- It is the ordering channel that makes the product more than a menu website.
- It removes the need for a waiter to take every order verbally.

**Non-goal:** it is not a customer account, a loyalty app, or a payment channel.

---

## 3. Entry — scanning the QR

### 3.1 The two QR types

| Type | URL | Result |
|---|---|---|
| Entrance / general | `ourdomain.ir/r/{slug}` | Menu only, no table context |
| Table | `ourdomain.ir/r/{slug}/t/{tableToken}` | Menu + table context |

`DECIDED` — table QR additionally establishes which table. It does **not** grant ordering permission.

### 3.2 What happens on landing

`DECIDED`

1. Tenant resolved from slug (or host, in the custom-domain future).
2. Menu data fetched (categories, products, availability, prices).
3. A Customer Session is established for this device/visit.
4. If a table token is present, the table is resolved and bound to the session.
5. The menu renders — **with no permission prompt of any kind.**

### 3.3 Edge cases

| Case | Behaviour | Status |
|---|---|---|
| Unknown slug | Friendly Persian "restaurant not found" page | `PROPOSED` |
| Tenant suspended | Depends on the subscription decision — `OPEN QUESTION` | `OPEN QUESTION` |
| Menu empty | "Menu is being prepared" empty state | `PROPOSED` |
| Invalid/retired table token | "This table is not currently in use" | `PROPOSED` |
| Customer scans the entrance QR but wants to order | Must be told they need a table QR, or the staff can attach them to a table — `OPEN QUESTION` | `OPEN QUESTION` |

---

## 4. Browsing the menu

`DECIDED` requirements, from UX principles C1–C8.

| Requirement | Detail |
|---|---|
| Fast | Images optimised, lazy-loaded, first content fast (C2) |
| Persian RTL | Native RTL layout, Persian numerals in prices (C3) |
| Identity visible | Restaurant name/cover/logo immediately |
| Category access | Sticky category bar, one gesture away (C6) |
| Product card minimum | Image, name, price, availability (C6) |
| Detail one tap away | Larger image, description, options, add-to-cart (C6) |
| Availability explicit | «ناموجود» clear and non-orderable (C8) |
| Touch friendly | Large targets, no mis-taps (C7) |
| No admin chrome | Never looks like a dashboard (C5) |
| No registration | Not even a soft prompt (C4) |

**Search / filter:** `PROPOSED` — useful for large menus; scope to confirm.

---

## 5. Requesting ordering access — the approval gate

This is the most product-defining step. Full detail:
[`../domain/approval-system.md`](../domain/approval-system.md).

### 5.1 The flow

```
Customer taps "شروع سفارش" / "Order"
        ↓
System checks: is there an active Table Session for this table?
        ├── yes, APPROVED  → go straight to ordering
        └── no             → create access request
        ↓
Customer Session state → PENDING_APPROVAL
        ↓
Customer sees: «در انتظار تأیید»
        ↓
Staff approve (one tap, ONE time)
        ↓
Customer Session state → APPROVED  →  customer is notified → ordering unlocked
```

`DECIDED`

### 5.2 What the customer sees while waiting

`DECIDED` (label) · `PROPOSED` (exact copy and layout)

Required content:

- The state is unmistakable (C9).
- Explanation of what is being waited on — a staff member approving the table.
- Reassurance that they do **not** need to re-scan or re-request (S9).
- Some indication of the table they are on.
- An escape/cancel-request option — `OPEN QUESTION`.

### 5.3 What the customer must NOT face

`DECIDED` (from principles)

- A registration form.
- A form with required fields.
- Location permission prompts (GPS is explicitly rejected as the mechanism).
- A Wi-Fi requirement.
- Repeated approval requests per order (P4).

### 5.4 Anti-abuse notes

`DECIDED`

The gate exists because a photo of a table QR must not enable fake orders from outside the restaurant.
Therefore:

- Browsing remains open (menu is public info).
- Ordering requires a human decision.

**Accepted risk (`DECIDED` by the founders):** once approved, a customer *could* leave the restaurant
and keep ordering. Approval is a soft, human gate, not a hard physical constraint. Mitigations
(abuse detection, session expiry, rate limits) are `FUTURE`/`OPEN QUESTION`.

---

## 6. Ordering

Full detail: [`ordering-flow.md`](ordering-flow.md). Summary:

| Step | Customer action | Notes |
|---|---|---|
| 1 | Tap a product | Detail view |
| 2 | Choose quantity, options | Options engine is `FUTURE`; demo shows the pattern |
| 3 | Add to cart | Cart persists across refresh |
| 4 | Review cart / order preview | Items, quantities, per-line totals, grand total |
| 5 | Optional name + phone | **Both optional** (`DECIDED`) |
| 6 | Submit | Idempotent — a double tap cannot create two orders |

### 6.1 Multiple orders per session

`DECIDED`

The customer may submit many orders during one approved session without re-approval:

```
14:20 access approved
14:22 order #1021
14:40 order #1022
14:55 order #1023
```

The customer's order view must therefore show **all** of the session's orders, not just the last one.
`PROPOSED` — grouping by order with a session total.

---

## 7. Watching the order

`DECIDED` — capability. `OPEN QUESTION` — transport.

| Requirement | Detail |
|---|---|
| Live status | No manual refresh (C10) |
| Customer wording | Persian, friendly — never internal status names (P10) |
| Which orders | All orders in the session |
| Staff actions to reflect | Accept/reject, start preparing, ready, delivered |

See [`../domain/order-state-machine.md`](../domain/order-state-machine.md) for the mapping.

---

## 8. The bill

`DECIDED`

After eating, the customer can view the bill: ordered items, quantities, item prices, discounts if
applicable, and the total. Payment happens physically at the cashier. The customer does not apply
discounts or mark anything paid (C14).

See [`../domain/billing.md`](../domain/billing.md).

---

## 9. Session persistence

`DECIDED` (from C12 / §10 of the brief)

- The session survives page refresh.
- The session survives closing and reopening the menu during the active visit.
- An open browser tab is **not** required for the order to continue existing.

**Mechanism:** `OPEN QUESTION` — see [`../domain/customer-sessions.md`](../domain/customer-sessions.md)
§Mechanism. This is an architecture-relevant open question.

---

## 10. Business rules

| # | Rule | Status |
|---|---|---|
| CR1 | Browsing requires no permission | `DECIDED` |
| CR2 | Ordering requires an approved table session | `DECIDED` |
| CR3 | Approval happens once per session | `DECIDED` |
| CR4 | One device orders for the whole table | `DECIDED` |
| CR5 | No mandatory registration | `DECIDED` |
| CR6 | Name and phone are optional | `DECIDED` |
| CR7 | Session survives refresh and reopen | `DECIDED` |
| CR8 | No GPS or Wi-Fi requirement | `DECIDED` |
| CR9 | Order submission is idempotent | `DECIDED` |
| CR10 | Historical order prices are frozen | `DECIDED` |
| CR11 | Customer cannot apply discounts or mark paid | `DECIDED` |
| CR12 | All session orders remain visible to the customer | `PROPOSED` |

---

## 11. Edge cases

| Edge case | Proposed handling |
|---|---|
| Session state unknown while loading the page | Don't flash the wrong state; resolve before showing approval-dependent UI |
| Session expired server-side while the page is open | Clear Persian message + offer to re-request approval |
| Table session closed by staff while the customer is mid-order | Warn before submission; block submission after closure |
| Product unavailable between add-to-cart and submit | Block submission, highlight the affected item, keep the rest |
| Price changed between add-to-cart and submit | Show the current price at confirmation; snapshot at submit |
| Order rejected by staff | Show a friendly rejection with next action (ask staff / modify) |
| Slow network + double tap | Idempotency key → one order (CR9) |
| Session reused across two different tables in one visit | `OPEN QUESTION` — should the customer be able to switch tables? |
| Customer scans a different table's QR mid-session | `OPEN QUESTION` — see contradictions register |

---

## 12. Security considerations

| Concern | Mitigation | Status |
|---|---|---|
| Table QR photo used from outside | Ordering blocked until staff approve | `DECIDED` |
| Session hijacking | Session token must be unguessable, device-bound, revocable | `PROPOSED` |
| Enumeration of table tokens | Tokens are random and high-entropy; rate limit | `DECIDED` |
| Customer impersonating another session | Token secrecy is the control; no account to bypass | `DECIDED` |
| Repeated approval requests as an abuse vector | Rate limit per table/tenant/session | `OPEN QUESTION` (exact limits) |
| Personal data leakage | Optional collection only; no cross-tenant exposure (P2) | `DECIDED` |
| Stale approved session abused later | Session expiry policy — `OPEN QUESTION` | `OPEN QUESTION` |
| Menu scraping | Rate limiting; not fully preventable; menu content is not secret | `DECIDED` |

---

## 13. Data implications

Entities touched by this flow:

| Entity | Write | Notes |
|---|---|---|
| Customer Session | create / update | Per device per visit |
| Table Session | read, possibly create | Bound via table token |
| Ordering access request | create | One per session |
| Order | create | With snapshot line items |
| Audit event | create | On access request, approval, order submission |

Customer-entered personal data (name, phone) is stored **only** if provided, and only on the order.

---

## 14. Current decision summary

`DECIDED`

- Menu browsing is open; ordering requires approval.
- No registration; name/phone optional.
- One device per table; repeated orders without re-approval.
- Session survives refresh/reopen.
- Persian RTL, mobile-first, fast, premium.
- Customer wording is separate from internal statuses.

---

## 15. Future considerations

- Multiple devices joining one table session.
- Pre-order / scheduled orders.
- Customer-facing order history across visits.
- Loyalty/rewards.
- Order splitting/paying a subset.
- Item-level status (kitchen ready, bar ready) shown separately.
- Availability driven by inventory.
- Waiter-assisted ordering from the customer's phone.
- Reordering a previous item.

Constraints each places on today's design: see
[`../governance/future-features.md`](../governance/future-features.md).

---

## 16. Open questions

| # | Question | Blocking? |
|---|---|---|
| Q1 | Approved session validity duration | **Yes — defines the security model** |
| Q2 | Customer Session recovery mechanism across full browser close | **Yes — architecture** |
| Q3 | Can one device move between tables in one visit? | Yes |
| Q4 | Exact waiting-state copy and whether the customer can cancel the request | No |
| Q5 | Rejection UX and retry policy | No |
| Q6 | Search/filter in MVP | No |
| Q7 | Entrance-QR customers wanting to order | Yes (product decision) |
| Q8 | Age/health warnings for restricted items | No |

Full register: [`../governance/open-questions.md`](../governance/open-questions.md).