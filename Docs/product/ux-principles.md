# UX Principles

Two audiences with opposite needs:
- **The customer** — standing/sitting in a restaurant, one hand on a phone, possibly rushed, Persian.
- **The staff** — behind a counter, possibly with wet hands, possibly many concurrent orders, noisy.

Both are Persian, RTL, mobile-first. Both must be fast.

---

## Part A — Customer experience principles

### C1 — Mobile-first, not mobile-only-reduced

`DECIDED`

The primary surface is a phone browser. Design phone-first, but do not degrade on tablet/desktop —
widen layout gracefully.

**Why:** restaurant owners will evaluate the demo on their own laptop. A mobile-only demo fails the
sales conversation; a broken desktop layout also fails it.

### C2 — Extremely fast load

`DECIDED`

The customer is on restaurant Wi-Fi or mobile data. Every avoidable byte costs conversions.

- Menu images must be optimised, lazy-loaded, and sized for the viewport.
- The first meaningful content must render before heavy assets finish.
- No blocking third-party scripts on the critical path.
- Target: usable interactive menu quickly on mid-range Android over slow 4G. (Exact performance budget
  is `OPEN QUESTION` — see `governance/open-questions.md#ux`.)

**Why:** the menu demo must open fast on the founder's own phone at a café.

### C3 — Persian and RTL as the native form

`DECIDED`

- All customer-facing copy is Persian.
- Layout is RTL-native: mirroring, logical start/end sides, Persian numerals in prices.
- Typography must be a good Persian webfont with correct Persian glyph shaping.
- Latin text (brand names, some product names) must still render correctly inside RTL containers.

**Anti-pattern:** an LTR layout with Persian text dumped into it. Persian users notice instantly and it
reads as foreign.

### C4 — Registration is never forced

`DECIDED`

Scan → browse → request access → order. No sign-up wall, ever, anywhere in the customer flow.

Name/phone are optional at submission. If a flow needs personal information to function, that flow is
wrong. See P5/P18 in [`product-principles.md`](product-principles.md).

### C5 — No admin chrome

`DECIDED`

The customer UI must not resemble an admin dashboard: no sidebars, no dense tables, no "management"
navigation, no kebab menus of system functions.

**Why:** the product's premium perception lives or dies here. An admin-looking customer page
undermines the entire pitch.

### C6 — Clear product hierarchy

`DECIDED`

- Restaurant identity is immediately visible (name, logo/cover, ambience hints).
- Categories are reachable in one gesture — sticky category bar or horizontal scroller.
- Each product card shows, at minimum: image, name, price, availability.
- Product detail (description, larger image, options) is one tap away.

### C7 — Large touch targets

`DECIDED`

Primary actions sized for a thumb, comfortably exceeding accidental-tap thresholds. Quantity
steppers, add-to-cart, and tab bars must be thumb-friendly and spaced to prevent mis-taps.

**Why:** mis-taps cause wrong orders, which cause refunds, which cost the restaurant money.

### C8 — Price and availability are never ambiguous

`DECIDED`

- Price is always visible without an extra tap.
- Unavailable products display «ناموجود» clearly and are non-orderable, with a distinct visual
  treatment (not merely greyed out — must read as intentional).
- Do not show a price for an unavailable item as if it were orderable.

### C9 — Ordering state must be unmistakable

`DECIDED`

The customer must always be able to tell, without inference, which of these they are in:

1. Browsing the menu
2. Requested access, waiting for approval («در انتظار تأیید»)
3. Approved and able to order
4. Has an active order with a live status

**Why:** ambiguity here generates "do I need to ask the waiter?" — the exact friction approval was
designed around.

### C10 — Status updates arrive without effort

`DECIDED`

Once an order is placed, the customer sees its status progress without manually refreshing. Exact
mechanism is `OPEN QUESTION`; the *capability* is decided. See
[`../technical/realtime.md`](../technical/realtime.md).

### C11 — Minimal friction between scan and order

`DECIDED`

Steps from scanning to a submitted order must be as few as physically reasonable. Every additional tap
in this path is a lost order for a busy restaurant.

### C12 — Session continuity

`DECIDED`

The customer's session must survive page refresh and reopening the menu during an active visit, as
appropriate. An open browser tab must **not** be required for the order to keep existing.

**Consequence:** the session identity must be recoverable from the device (and/or re-establishable
from the table QR), not held only in memory. See
[`../domain/customer-sessions.md`](../domain/customer-sessions.md).

### C13 — One person orders for the table

`DECIDED`

The customer experience assumes a single ordering device per table. Do not design the UX around
requiring every diner to join, vote, or confirm.

Multi-device joining is a `FUTURE` convenience, not an MVP flow.

### C14 — Bills are read, not manipulated

`DECIDED`

The customer views the bill (items, quantities, prices, discounts, total). They do not edit it, apply
discounts, or mark it paid. Payment happens at the cashier.

---

## Part B — Staff experience principles

### S1 — Fast approval queue

`DECIDED`

Approving a waiting table must be possible in **one tap** from a list. Staff approve many times an
hour; this is the highest-frequency staff action in the product.

**Why:** if approval is slow, staff will stop doing it, and the anti-abuse gate becomes theatre.

### S2 — The approval list answers "who is waiting at which table, and how long?"

`DECIDED`

An approval entry must show, at a glance: table, elapsed waiting time, and (if provided) a customer
name. Elapsed time matters — staff triage by urgency.

### S3 — Kitchen/bar views are queue-first, not dashboard-first

`DECIDED`

Kitchen and barista screens are working surfaces: what needs to be made, by whom, since when.
They are not analytics screens.

Layout must prioritise:
- Oldest/most urgent order first
- Item names and modifiers at readable size
- One-tap status progression
- Large targets (wet hands, urgency)

### S4 — Order content is unambiguous

`DECIDED`

A staff order view must show table, order number, every line item with quantity and **modifiers
prominently** ("2× Cappuccino — بدون شکر"), and the total.

Modifiers must never be buried in small secondary text; getting a modifier wrong causes a remake.

### S5 — Station-appropriate filtering

`DECIDED`

Kitchen sees kitchen items; baristas see beverage items. Roles constrain not just permissions but
**what the default working view shows**.

### S6 — Staff authentication must be low-friction but real

`DECIDED`

Staff authenticate. The method is `OPEN QUESTION` (password, PIN, OTP — see
`governance/open-questions.md#security`). Whatever it is, a shared kitchen tablet must not require
frequent re-login while remaining attributable for audit.

**Tension to resolve:** fast switching between roles/stations vs. strong per-person attribution.

### S7 — Every destructive action is confirmable and attributable

`DECIDED`

Cancelling an order, closing a session, or reversing a settlement must require explicit confirmation
and record who did it.

### S8 — Staff UI in Persian, RTL, mobile-first — but honest about tablets

`DECIDED`

Same language obligations as the customer side. Where a restaurant has a wall-mounted tablet/monitor
for the kitchen, the layout must be usable at that distance — larger type, fewer columns, higher
contrast.

### S9 — No dead-end screens

`DECIDED`

Every waiting/loading/error state must say what is happening and what the user can do. Especially the
customer's «در انتظار تأیید» screen — it must explain what they're waiting for and reassure them they
don't need to re-scan.

---

## Part C — Cross-cutting

### X1 — Bilingual mental model: Persian UI, English internals

`DECIDED`

UI copy and design assets are Persian. Code identifiers, API field names, database columns, and
internal documentation are English. Translating code identifiers into Persian makes the system
unmaintainable by any international engineer; Persian UI is non-negotiable because that's the customer.

### X2 — Numbers and currency formatting

`DECIDED`

- Prices render with Persian/Arabic-Indic digits and proper thousand separators.
- The currency unit and its label are an `OPEN QUESTION` (Toman vs. Rial). Format must be centralised
  so this is a one-line change when decided.

### X3 — Accessibility floor

`PROPOSED`

Minimum contrast for text, focusable interactive elements, and respect for reduced-motion. Not
specified in the brief; recommended so the demo doesn't fail a basics check with restaurant owners who
may have accessibility needs. Confirm before committing effort.

### X4 — Consistency across customer and staff surfaces

`DECIDED`

Same design tokens, type scale, and status vocabulary on both sides. A customer who screenshots
«در حال آماده‌سازی» and shows the waiter must match what the waiter sees.

---

## Anti-patterns to reject in review

| Anti-pattern | Why rejected |
|---|---|
| Sign-up wall before browsing | Violates P5/C4 |
| LTR layout with Persian text | Violates C3 |
| Admin-style customer page | Violates C5/C11 |
| Customer sees internal status names in English | Violates P10/presentation layer split |
| Greyed-out unavailable product with no label | Violates C8 |
| Small quantity steppers packed together | Violates C7 |
| Approval requiring form-filling or notes | Violates S1 |
| Modifiers hidden in tiny text | Violates S4 |
| Polling-as-realtime with a spinners every second | Violates C10/C2 |
| Session lost on page refresh | Violates C12 |
| Discount applied by the customer | Violates C14 |
| Offline queue/local-first database | Violates P9 |