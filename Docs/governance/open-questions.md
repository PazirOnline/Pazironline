# Open Questions

Every decision the documentation could not make. Grouped, prioritised, and honest.

**Rule:** these are not gaps to be filled by guessing. Answer them or leave them explicitly open.

Related: [`decision-log.md`](decision-log.md) · [`contradictions-and-risks.md`](contradictions-and-risks.md)

---

## How to read this

| Marker | Meaning |
|---|---|
| 🔴 **BLOCKING** | Cannot start implementation of the affected area without an answer |
| 🟡 **NEEDED BEFORE LAUNCH** | Can build without it, but the product is incomplete or unsafe without it |
| 🟢 **CAN WAIT** | Genuinely deferrable |

---

# 🔴 BLOCKING — must be answered before implementation begins

## Architecture

| # | Question | Why blocking | Recommendation |
|---|---|---|---|
| A-1 | **What is the technology stack?** Language, framework, database, hosting, deployment | Nothing can be built | — |
| A-2 | Is a backend-as-a-service acceptable, or must the backend be self-hosted? | Constrains everything; also a data-residency question | Self-hosted or a local-region BaaS, given Iranian data residency concerns |
| A-3 | **Tenant = restaurant, or tenant = brand with branches?** | Blocks the schema; see contradictions §4 | Include a location dimension now that degrades to one implicit location |
| A-4 | What is the real-time transport? | Blocks the status delivery design | Build the event abstraction first; choose after hosting is decided |
| A-5 | Where will data be hosted — inside Iran? | Legal/compliance, may constrain providers | Confirm before selecting hosting |
| A-6 | Image pipeline: storage provider, CDN, transformation approach | Blocks menu performance work | Object storage + CDN + resizing; provider depends on hosting |

## Security

| # | Question | Why blocking | Recommendation |
|---|---|---|---|
| S-1 | **What is the staff authentication method?** | Blocks all staff-side implementation | See options below |
| S-2 | **How long does an approved session remain orderable?** (idle + absolute) | Defines the entire abuse model; see contradictions §2 | Idle timeout + a long absolute cap, with graceful re-approval |
| S-3 | Session token transport: HttpOnly cookie, localStorage, or URL? | Security + architecture | HttpOnly cookie; **never** in URLs |
| S-4 | Exact rate limits for order submission and approval requests | Abuse prevention | Set before launch; propose conservative starting values |

**Staff auth options (S-1):**

| Option | Pros | Cons |
|---|---|---|
| Password | Standard, revocable | Shared tablets; password sharing |
| PIN per staff | Fastest | Weak attribution |
| Phone OTP | Strong attribution | Per-user phone; friction; cost |
| Passkey/biometric | Strong + fast | Device loss; setup |

**Recommendation:** password for role-holders, a **short numeric PIN for shared kitchen/tablet devices with
per-action attribution recorded**. Needs a founder decision.

## Business

| # | Question | Why blocking | Recommendation |
|---|---|---|---|
| B-1 | **Currency unit — Toman or Rial?** | Blocks the schema semantics and every display | Decide now; migrating later means rewriting every monetary value |
| B-2 | **What happens to a suspended tenant's customer-facing menu?** | Customer-facing behaviour; blocks the entitlement gate | Keep serving; warn the **owner** in the staff app. See subscriptions §5.3 |
| B-3 | Is split bill in the MVP? | Decides whether the bill-allocation model ships now (D-037) | If yes, allocate now |
| B-4 | Which roles may apply discounts? | Blocks RBAC and billing | Cashier ≤ a manager-set cap, Manager unlimited — needs a founder call |
| B-5 | Pricing, plans, trial length, grace length, payment rails | Blocks monetisation | — |

## Product

| # | Question | Why blocking | Recommendation |
|---|---|---|---|
| P-1 | **Is there a `CANCELLED` state? A separate `REJECTED`?** | Blocks the order state machine; see contradictions §1 | Yes to both |
| P-2 | **Is `PENDING → CONFIRMED` automatic or staff-confirmed?** | Blocks the staff UX and order board | Auto-confirm, with a fast reject path |
| P-3 | **Menu draft/publish, or immediate live edits?** | Blocks the schema and staff UX | Draft/publish; restaurants edit during service |
| P-4 | **What is the exact role permission matrix?** | Blocks RBAC | A proposal exists in roles-and-permissions §4 — needs founder approval |
| P-5 | Second customer scans an already-active table QR | Blocks session conflict handling | Do not hand over the approved session; explain or start fresh |
| P-6 | Entrance-QR customer wants to order | Blocks the entry flow | Prompt to scan the table QR |
| P-7 | Station routing configuration model | Blocks the menu/product model | Per product with a category default |
| P-8 | Does ticket printing advance the order status? | Blocks printing + state machine | No — the app is the source of truth |

## UX

| # | Question | Why blocking | Recommendation |
|---|---|---|---|
| U-1 | **Which Persian typefaces?** | The design depends on typography; blocks demo work | Shortlist Vazirmatn / Estedad / Shabnam and compare in context |
| U-2 | **Demo imagery source and licensing** | Placeholder imagery fails the quality bar | Licensed stock, or founder photography |
| U-3 | Does the demo use a real or invented restaurant brand? | Affects believability | Invented but thoroughly realistic |

## Legal / compliance

| # | Question | Why blocking | When |
|---|---|---|---|
| L-1 | **Iranian VAT applicability and rate for restaurant food** | Blocks correct billing | Before launch |
| L-2 | **Data residency requirements for personal data** | May constrain hosting entirely | Before choosing hosting |
| L-3 | Personal-data retention obligations (orders, customer names/phones, audit logs) | Affects deletion policy | Before launch |
| L-4 | Does the restaurant need a legally formatted receipt? | Affects printing scope | Before launch |
| L-5 | Terms of service / privacy policy authorship | Launch blocker | Before launch |

---

# 🟡 NEEDED BEFORE LAUNCH

## Payments / Billing

| # | Question |
|---|---|
| PAY-1 | Which payment methods should settlement record? (cash, card, both) |
| PAY-2 | Is tipping supported? |
| PAY-3 | Receipt printing format and content |
| PAY-4 | Settlement correction policy (a cashier recorded the wrong amount) |
| PAY-5 | Can a zero-total bill exist (full discount)? |
| PAY-6 | Should partial payments be recordable? |

## Printing

All `OPEN QUESTION`, **founder-owned** — see [`../technical/printing.md`](../technical/printing.md).

| # | Question |
|---|---|
| PRINT-7 | What is the founder's printing solution? |
| PRINT-8 | Per-station or per-tenant printers? |
| PRINT-9 | Multi-station order → one ticket or two? |
| PRINT-10 | What happens on printer failure? |
| PRINT-11 | Does Persian render correctly on the target printer? |
| PRINT-12 | Who installs and maintains the hardware? |

## Product — before launch

| # | Question |
|---|---|
| PRD-13 | Order number format — daily reset? |
| PRD-14 | Are special instructions supported per line item? |
| PRD-15 | Can staff enter orders on behalf of customers? |
| PRD-16 | Maximum quantity / order size caps |
| PRD-17 | Item-level order status (kitchen ready before the food)? |
| PRD-18 | Can a customer cancel their own order? |
| PRD-19 | Can a table session be closed with undelivered orders? |
| PRD-20 | When is an unconfirmed order considered abandoned? |
| PRD-21 | Manual table occupancy for walk-ins who never scan |
| PRD-22 | Can a device move between tables in one visit? |

## UX — before launch

| # | Question |
|---|---|
| U-4 | Currency unit label treatment (inline «تومان» vs. suffix) |
| U-5 | Dark mode in the MVP? |
| U-6 | Is search/filter in the MVP? |
| U-7 | Does the staff app extend the customer design language or diverge for density? |
| U-8 | Exact waiting-state copy; can the customer cancel a request? |
| U-9 | Performance budget targets (LCP, payload size) |
| U-10 | Minimum accessibility bar (contrast, reduced motion, focus) |

## Security — before launch

| # | Question |
|---|---|
| S-5 | Session duration on shared staff devices |
| S-6 | Is device fingerprinting acceptable for abuse detection? (privacy) |
| S-7 | Staff invitation and reset flow |
| S-8 | Can a staff member hold multiple roles? |
| S-9 | Platform-operator access to tenant audit logs — policy? |
| S-10 | CSP strictness vs. third-party services |

## Analytics

| # | Question |
|---|---|
| A-7 | Track product views in the MVP? (needed for "views vs. orders") |
| A-8 | Price-change history table needed? |
| A-9 | Is the analytics audience only the restaurant owner, or also the platform? |
| A-10 | Are "daily" boundaries restaurant-local or UTC? (affects stored timestamps' meaning) |

## Business — before launch

| # | Question |
|---|---|
| B-6 | Trial length and whether trial tenants get all features |
| B-7 | Grace period length |
| B-8 | Data retention on cancellation; can a cancelled tenant reactivate? |
| B-9 | What are the plan tiers and which features gate them? |
| B-10 | Which Iranian payment rails for subscriptions? |
| B-11 | Support channel (in-app, WhatsApp, Telegram)? |
| B-12 | Is advertising/sponsored products a revenue line? |

---

# 🟢 CAN WAIT

| # | Question | Note |
|---|---|---|
| W-1 | Custom domain mechanics and redirect behaviour | `FUTURE` (D-034) |
| W-2 | Reserved slug list | Minor |
| W-3 | Persian slugs allowed? | Recommend no — keep URLs Latin |
| W-4 | Dark mode for staff | Minor |
| W-5 | Multiple languages for menus | `FUTURE` |
| W-6 | Custom roles | `FUTURE` |
| W-7 | Per-branch roles | `FUTURE` |
| W-8 | Duplicate product names allowed? | Minor |
| W-9 | Age/health warnings on products | Compliance `FUTURE` |
| W-10 | Product tags / dietary information | `FUTURE` |
| W-11 | Cost price for margin reporting | `FUTURE` |
| W-12 | Time-based availability (breakfast-only items) | `FUTURE` |
| W-13 | Table capacity / seats | Minor |
| W-14 | Notifications when the tab is closed | `FUTURE` |
| W-15 | Presence / typing indicators | `FUTURE` |

---

## The top five to answer first

Ranked by how much they unblock:

| Rank | Question | Unblocks |
|---|---|---|
| 1 | **A-1 Technology stack** | Everything |
| 2 | **U-1 + U-2 Persian font and demo imagery** | The menu demo — the first deliverable |
| 3 | **B-1 Currency unit** | The entire data model |
| 4 | **P-1 + P-2 Cancellation and confirmation** | The order state machine |
| 5 | **S-1 + S-2 Staff auth and session expiry** | All staff work; the security model |

Close behind: **P-3 menu draft/publish** and **A-3 tenant vs. brand** — both block the schema.