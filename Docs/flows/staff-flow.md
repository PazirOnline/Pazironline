# Staff Flow

The restaurant-side journey. This is where the product either saves the restaurant money or adds to its
work.

Related: [`user-flows.md`](user-flows.md) · [`../domain/approval-system.md`](../domain/approval-system.md) ·
[`../domain/kitchen-and-bar.md`](../domain/kitchen-and-bar.md) ·
[`../platform/roles-and-permissions.md`](../platform/roles-and-permissions.md)

---

## 1. What it is

Everything a restaurant employee does in the system: authenticate, approve table sessions, receive
orders, prepare them, deliver them, take payment, close the session, and manage the menu.

**Who uses it:** Owner, Manager, Cashier, Waiter, Kitchen, Barista.
**Interface:** mobile web app first; tablets for station displays.
**Language:** Persian, RTL.

---

## 2. Why it exists

- Staff need a fast way to know *who is waiting at which table*.
- The kitchen/bar need an unambiguous work queue.
- The cashier needs an authoritative total.
- The owner needs an operational picture and, later, reports.

**Non-goal:** it is not a full POS. It does not replace a cash register; it records settlement.

---

## 3. Staff authentication

### 3.1 What is decided

`DECIDED`

- Staff authenticate. Anonymous staff access is not acceptable.
- Authentication must be attributable, because actions are audited (P19).
- A shared kitchen tablet must not require constant re-login, but actions must still be attributable.

### 3.2 What is not decided

`OPEN QUESTION` — the method:

| Option | Advantage | Disadvantage |
|---|---|---|
| Email/phone + password | Standard, revocable | Shared tablets need long sessions; password sharing |
| PIN per staff member | Very fast for a busy counter | PIN sharing when the owner isn't watching |
| Phone OTP | No shared secret; strong attribution | Requires a phone per user; friction; SMS/OTP cost in Iran |
| Device-bound passkey/biometric | Strong and fast | Device loss; setup complexity |

Recorded in [`../governance/open-questions.md`](../governance/open-questions.md#security).

### 3.3 Session behaviour

`PROPOSED`

- Long-lived sessions are necessary for shift-based work on shared devices.
- But every state-changing action must record the acting staff member.
- Session duration per role: `OPEN QUESTION` (kitchen screen may need a long session; cashier should
  re-authenticate more often).

---

## 4. Approval — the highest-frequency action

Full mechanics: [`../domain/approval-system.md`](../domain/approval-system.md).

### 4.1 Why this matters most

`DECIDED`

Approval happens many times an hour. If it is slow, staff stop doing it and the anti-abuse gate
becomes decorative — which removes the product's main defence against fake orders.

### 4.2 The approval queue

`DECIDED` requirements (UX principles S1, S2):

- A dedicated, always-reachable view of pending access requests.
- Each entry shows: **table**, **elapsed waiting time**, and the customer name if provided.
- **One tap** to approve. Reject is secondary.
- Sorted by longest wait first, so staff triage by urgency.

### 4.3 What approval does

`DECIDED`

- Transitions the table session from `PENDING_APPROVAL` → `APPROVED`.
- Unlocks ordering for that customer session.
- Notifies the customer.
- Records an audit event with the approving staff member.

**Explicitly not:** approving a single order, or approving every order. Approval is once per session
(P4).

---

## 5. Receiving and progressing orders

### 5.1 The order board

`DECIDED` requirements (UX principle S4):

Each order view must show:

| Element | Why |
|---|---|
| Order number | Reference across kitchen/customer/cashier |
| Table | The critical operational identifier |
| Line items with quantities | The actual work |
| **Modifiers prominently** | Wrong modifiers cause remakes |
| Total | Cashier context |
| Current status | Where it is in the pipeline |
| Time since creation | Urgency / staleness |

**Modifiers must not be small secondary text.** This is a hard requirement.

### 5.2 Staff actions

`DECIDED` (subject to the permission matrix)

| Action | Typical role | Effect |
|---|---|---|
| Confirm / accept | Cashier, Manager, Waiter | `PENDING` → `CONFIRMED` |
| Reject | Manager, Cashier | → rejected/cancelled state (`OPEN QUESTION` on exact status) |
| Start preparing | Kitchen, Barista, Waiter | `CONFIRMED` → `PREPARING` |
| Mark ready | Kitchen, Barista | `PREPARING` → `READY` |
| Mark delivered | Waiter, Cashier, Manager | `READY` → `DELIVERED` |
| Cancel | Manager, Cashier (+ reason) | → `CANCELLED` (state `OPEN QUESTION`) |

All actions are audited with the acting staff member (P19).

---

## 6. Delivery confirmation

`DECIDED` (UX principle S7 + order state machine)

- A staff member marks the order delivered.
- The customer sees «تحویل شد».
- Destructive actions require confirmation and attribution.

**Open:** what happens if a delivered item is later disputed (wrong item, missing item)? There is no
item-level dispute flow in the MVP. Recorded in
[`../governance/open-questions.md`](../governance/open-questions.md#product).

---

## 7. Kitchen and bar workflow

Full detail: [`../domain/kitchen-and-bar.md`](../domain/kitchen-and-bar.md).

### 7.1 The neutrality rule

`DECIDED` (P16)

The product must work for a restaurant that has a monitor, one that has only a printer, and one that
has both. **No design may assume a monitor exists.**

### 7.2 Station views

`DECIDED` in concept:

- Items route to stations (e.g. Pizza → Kitchen, Cappuccino → Bar).
- Kitchen staff see kitchen items; baristas see beverage items (S5).
- The view is queue-first: oldest/most urgent first, large readable type, one-tap progression (S3).

`FUTURE` / `OPEN QUESTION`: how routing is configured, and whether station assignment is per product,
per category, or per printer.

---

## 8. Bill and settlement

`DECIDED`

- The bill is computed from all orders in the table session.
- Structure: `Subtotal + Add-ons − Discounts + Other charges = Grand Total` (P17).
- Payment is taken **physically at the cashier**.
- The cashier records the settlement.
- The system records the payment/settlement state.

Staff flows:

| Step | Actor | Action |
|---|---|---|
| 1 | Cashier | Opens the table's bill |
| 2 | Cashier | Confirms items with the customer (verbal) |
| 3 | Cashier | Applies a discount if permitted — `OPEN QUESTION` on permissions |
| 4 | Cashier | Records payment received |
| 5 | Cashier | Closes the table session |

**Not in MVP:** online payment, receipt printing/format, tips, split payment. See
[`../domain/billing.md`](../domain/billing.md).

---

## 9. Table management

`DECIDED` in concept — full detail: [`../domain/table-management.md`](../domain/table-management.md).

- Each restaurant defines its own tables.
- Tables have states (available, occupied, waiting for approval, active session).
- Staff use the table view to know where customers are.

`FUTURE`: transfer, merge, split, reopen.

---

## 10. Menu management

`DECIDED` — full detail: [`../domain/menu-system.md`](../domain/menu-system.md).

Owner/Manager maintain categories, products, images, prices, descriptions, availability.

Key rules:

- Price changes **never** alter historical orders (P7).
- Products are archived, not destructively deleted (P7).
- Products can be marked unavailable («ناموجود») instantly.

**`OPEN QUESTION`:** is there a draft/published menu, or are changes immediately live? This is a
significant product decision affecting both staff UX and customer safety (an in-progress edit must not
be visible to customers). See `governance/open-questions.md#product`.

---

## 11. Business rules

| # | Rule | Status |
|---|---|---|
| SF1 | Staff must authenticate | `DECIDED` |
| SF2 | Every staff action is attributable and audited | `DECIDED` |
| SF3 | Approval is one tap, per session | `DECIDED` |
| SF4 | Roles restrict both permissions and default views | `DECIDED` |
| SF5 | Staff cannot exceed their role's permissions | `DECIDED` |
| SF6 | Modifiers are shown prominently in staff views | `DECIDED` |
| SF7 | Cancellation requires confirmation and records a reason | `DECIDED` |
| SF8 | Menu edits never affect historical orders | `DECIDED` |
| SF9 | Products are archived, not deleted | `DECIDED` |
| SF10 | Station views show only the role's items | `DECIDED` |
| SF11 | Settlement is recorded by a cashier, not the customer | `DECIDED` |
| SF12 | The system does not replace the physical cash register | `DECIDED` |

---

## 12. Edge cases

| Edge case | Handling | Status |
|---|---|---|
| Staff member leaves mid-shift on a shared tablet | Session timeout policy | `OPEN QUESTION` |
| Two staff approve the same table simultaneously | Idempotent state transition; second sees "already approved" | `PROPOSED` |
| Staff approves a request for a table that is already closed | Reject the transition; warn | `PROPOSED` |
| Kitchen staff try to settle a bill | Permission denied (role) | `DECIDED` |
| Cashier tries to edit the menu | Permission denied unless Manager/Owner | `DECIDED` |
| Order arrives while the staff app is closed | Order persists; appears on next load | `DECIDED` |
| Network outage for the staff app | No offline mode (P9); show a clear "no connection" state | `DECIDED` |
| Printer fails | Fallback path undefined | `OPEN QUESTION` — see [`../technical/printing.md`](../technical/printing.md) |
| Staff member removed while logged in | Session must be invalidated promptly | `PROPOSED` |
| Cashier records a partial payment | Not defined; MVP assumes full settlement | `OPEN QUESTION` |
| Same staff logged in on two devices | Permitted; actions attribute per action | `PROPOSED` |
| Very high order volume at peak | Scalability approach | `PROPOSED` |

---

## 13. Security considerations

| Concern | Mitigation | Status |
|---|---|---|
| Tenant A's staff accessing Tenant B | Tenant-scoped authentication and authorization at the data layer (P2) | `DECIDED` |
| Privilege escalation via role change | Authorization checked server-side on every action, never cached in the client | `DECIDED` |
| Shared-device impersonation | Long sessions + per-action attribution; PIN/OTP `OPEN QUESTION` | `OPEN QUESTION` |
| Removed staff retaining access | Session invalidation on staff status change | `PROPOSED` |
| Ex-employee access on a shared tablet | Mandatory logout / short session on shared devices | `OPEN QUESTION` |
| XSS in customer-entered name | Output encoding; the name is displayed in staff views | `PROPOSED` (standard) |
| Financial tampering (discount, settlement) | Permission restrictions + audit trail (P17, P19) | `DECIDED` |
| Approving a fake request | Approval is the control; request rate limits | `DECIDED` + `OPEN QUESTION` |
| Mass assignment of role/tenant fields | Strict server-side field allowlists | `DECIDED` (standard) |

---

## 14. Data implications

| Entity | Staff operations |
|---|---|
| Staff member | read (self), update (owner/manager) |
| Role / permission | read; role assignment is audited |
| Table session | read, state transitions |
| Ordering access request | read, approve/reject |
| Order | read, state transitions |
| Bill / settlement | read, create settlement |
| Product / category | read; write for Owner/Manager |
| Table | read; write for Owner/Manager |
| Audit event | append on every significant action |

---

## 15. Current decision summary

`DECIDED`

Role-based staff application in Persian; approval is one tap and once per session; order views show
table, items, and modifiers prominently; kitchen/bar are queue-first and station-scoped; settlement is
recorded by the cashier; every significant action is attributed and audited.

**Not decided:** the auth method, the exact permission matrix, menu draft/publish, printer behaviour.

---

## 16. Future considerations

- Item-level status (drink ready before the food).
- Order splitting across staff responsibilities.
- Shift management and clock-in/out.
- Performance reporting per staff member.
- Table transfer/merge/split UI.
- Bulk menu import (CSV/Excel) for onboarding.
- Ingredient/inventory depletion warnings.
- Customer-initiated cancellation requests.
- Kitchen display themes per tenant.

Constraints: [`../governance/future-features.md`](../governance/future-features.md).

---

## 17. Open questions

| # | Question | Blocking? |
|---|---|---|
| Q1 | Staff authentication method | **Yes — blocks Phase 2** |
| Q2 | Exact permission matrix per role | **Yes — blocks RBAC implementation** |
| Q3 | Menu draft/publish vs. immediate live | **Yes — affects data model and staff UX** |
| Q4 | Printer/ticket failure behaviour | Yes |
| Q5 | Session duration on shared devices | No |
| Q6 | Discount permissions by role | No |
| Q7 | Partial payments | No |
| Q8 | Station routing configuration model | Yes |
| Q9 | Staff invitation/reset flow | Yes |

Full register: [`../governance/open-questions.md`](../governance/open-questions.md).