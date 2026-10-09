# Customer Menu Demo — Build Brief

**This is the first implementation deliverable.** `DECIDED` — the menu demo comes before any backend,
auth, admin dashboard, or database.

Related: [`roadmap.md`](roadmap.md) · [`design-system.md`](design-system.md) ·
[`ux-principles.md`](ux-principles.md) · [`../flows/customer-flow.md`](../flows/customer-flow.md)

---

## 1. The mandate

`DECIDED`

> The first implementation, whenever implementation begins, MUST be the customer menu preview/demo. Do NOT
> begin by building the admin dashboard, the backend, or authentication.

### 1.1 Explicitly NOT the first steps

- ❌ Admin dashboard
- ❌ Authentication
- ❌ Database
- ❌ Backend CRUD
- ❌ Subscription management

### 1.2 The gate

> Only after the customer menu experience is **approved** does implementation move to the broader
> application. (`DECIDED`)

---

## 2. Why the demo is first

`PROPOSED` reasoning — recorded so it isn't "corrected" later:

1. **It is the sales asset.** The demo is what a restaurant owner judges. If it isn't convincing, nothing
   after it matters.
2. **It de-risks the UX.** Customer-facing flows are the most expensive to change late.
3. **It needs no backend.** Realistic local fixture data means it can be built and reviewed immediately.
4. **It establishes the visual language** everything else inherits.
5. **It tests the hardest requirement** — premium, distinctive, Persian, RTL, mobile-first design.

---

## 3. What makes this a demo, not a prototype

`DECIDED` (from the brief)

The demo must be **realistically interactive** and **commercially believable**. It must be:

- Exceptional
- Unique
- Eye-catching
- Premium
- Modern
- Mobile-first
- Persian RTL
- Restaurant-oriented

**And it must NOT look like:** a generic admin template, a boring QR menu, a basic CRUD app, an
AI-generated generic landing page, or a copied restaurant template.

> *"Do not use generic placeholder design just to 'finish the frontend'."* — `DECIDED`

**Visual quality is a core product requirement.**

---

## 4. Scope

### 4.1 Must have — the demo's core

| # | Deliverable | Notes |
|---|---|---|
| D1 | Restaurant identity header | Cover image, name, short descriptor |
| D2 | Category navigation | Sticky, one-gesture access |
| D3 | Product cards | Image, name, price, availability |
| D4 | Product detail view | Large image, description, options pattern, quantity, add |
| D5 | Cart / order preview | Draft contents, totals, submit |
| D6 | Table context indicator | Which table, session state |
| D7 | Approval waiting state | «در انتظار تأیید» — explain + reassure |
| D8 | Order status view | Realistic progression, customer-friendly Persian |
| D9 | Bill view | Items, quantities, prices, discount line, total |
| D10 | Persian RTL throughout | Native RTL, Persian numerals, proper typography |
| D11 | Responsive | Excellent on phone, graceful on desktop |

### 4.2 Should have

| # | Deliverable | Notes |
|---|---|---|
| S1 | Search / filter | `PROPOSED` — include if it fits the design language |
| S2 | Unavailable product treatment | Strong «ناموجود» presentation |
| S3 | Empty cart state | |
| S4 | Modifier/options picker | Shows the pattern; the engine is `FUTURE` |
| S5 | Connection-error messaging | Per P9, graceful failure |
| S6 | Smooth transition between menu and order states | |

### 4.3 Explicitly out of scope

- ❌ A backend of any kind
- ❌ Authentication or login screens
- ❌ Admin/staff screens
- ❌ Real ordering to a database
- ❌ Making the demo "technically complete"

---

## 5. Demo data

`PROPOSED`

The fixture data **is** the design test. Requirements:

| Property | Requirement |
|---|---|
| Realistic Persian | Real-sounding café menu, not lorem ipsum |
| Realistic imagery | **Appetising food photography, not placeholder boxes** |
| Realistic prices | Plausible Iranian café pricing in the chosen unit |
| Realistic categories | ~4–7 categories |
| Realistic size | 20–40 products — enough to test scrolling and category navigation |
| Realistic edge cases | Include an unavailable product, a long name, a no-description item |
| Name/description variety | Persian names, Latin names, mixed |

**`OPEN QUESTION`:** where demo imagery comes from (licensing). See
[`../governance/open-questions.md`](../governance/open-questions.md#legal-compliance).

**Note:** placeholder imagery would fail the "commercially believable" bar even with excellent typography.

---

## 6. Required interactions

`DECIDED` (realistic interactions) · `PROPOSED` (specifics)

| Interaction | Notes |
|---|---|
| Scroll the menu | Lazy image loading must be visible |
| Switch categories | Smooth, sticky nav |
| Open a product detail | Large image, description, options |
| Change quantity | Large touch targets |
| Add to cart | Cart indicator updates |
| Review the cart | Line items, quantities, totals |
| Enter the waiting state | Simulate staff approval after a delay — or via a demo control |
| Submit an order | Order appears with a status |
| Watch status progress | Simulated progression through the state machine |
| View the bill | Full structure |
| Refresh the page | Session and cart persist |

**A demo control** (e.g. a subtle dev toggle to simulate approval) is `PROPOSED` and very useful for
showing a restaurant owner both states.

---

## 7. States that must be demonstrated

| State | Must show |
|---|---|
| Browsing | The menu |
| Cart with items | Bottom bar / preview |
| «در انتظار تأیید» | Explanation + reassurance, no re-scan needed |
| Approved / can order | Unlocked ordering |
| Order placed | Confirmation |
| Order preparing | «در حال آماده‌سازی» |
| Order ready | «آماده تحویل» |
| Order delivered | «تحویل شد» |
| Bill | Full breakdown |

Also: empty states, unavailable product, and error/no-connection messaging.

---

## 8. Quality bar

`PROPOSED` — from the review checklist in [`design-system.md`](design-system.md) §11:

| # | Question |
|---|---|
| 1 | Would a café owner think "this is for a place like mine"? |
| 2 | Does it look like a designed menu, or an app with a menu inside it? |
| 3 | Is the Persian typography genuinely well-set? |
| 4 | Does any screen look like a generic admin panel? |
| 5 | Is every price and availability instantly readable? |
| 6 | Can you order with one thumb without mis-taps? |
| 7 | Does the waiting state explain and reassure? |
| 8 | Does it load fast on a real phone on mobile data? |
| 9 | Is it distinctive from the QR-menu competitors? |
| 10 | Is it Persian-first rather than translated? |

---

## 9. Constraints

| Constraint | Detail |
|---|---|
| Persian and RTL | `DECIDED` |
| Mobile-first | `DECIDED` |
| Fast | `DECIDED` — test on a real phone on mobile data |
| Realistic data | `DECIDED` |
| No backend | `DECIDED` |
| No placeholder visuals to "finish" it | `DECIDED` |
| Tech stack | `OPEN QUESTION` — not yet chosen |
| Currency unit | `OPEN QUESTION` — Toman or Rial unresolved |

---

## 10. Exit criteria

`DECIDED` + `PROPOSED`

The demo is done when:

1. All §4.1 deliverables are present.
2. All §7 states are demonstrable.
3. The §8 quality bar passes on a real phone.
4. **The founders explicitly approve it.** (`DECIDED` — self-approval is not approval)
5. Any findings are recorded and the affected docs updated.

**After approval**, implementation moves to the platform foundations — see
[`roadmap.md`](roadmap.md) Phase 2.

---

## 11. Open questions to resolve before starting

| # | Question | Blocking? |
|---|---|---|
| Q1 | Technology stack for the demo | **YES — blocks all work** |
| Q2 | Persian typefaces to use | **YES — the design depends on it** |
| Q3 | Demo imagery source/licensing | **YES — placeholder imagery fails the bar** |
| Q4 | Currency unit for prices | No (easy to change) |
| Q5 | Does the demo need search/filter? | No |
| Q6 | Should the demo use a real or invented restaurant brand? | **Yes — affects believability** |
| Q7 | Which states are simulated vs. manually triggered? | No |
| Q8 | Should there be a dev/demo control for approval? | No |

Full register: [`../governance/open-questions.md`](../governance/open-questions.md).