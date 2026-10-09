# Design System — Direction

This document defines the **direction and constraints** of the visual system. It is not a component
library spec (that is produced during implementation), and it is not a copy of any existing design
system.

The bar, quoted from the brief: *exceptional, unique, eye-catching, premium, modern, mobile-first,
Persian RTL, restaurant-oriented, commercially believable* — good enough to show a real restaurant
owner and immediately communicate value.

**Status of all specifics:** `PROPOSED` unless marked `DECIDED`. The *requirement* for exceptional,
distinctive, non-generic, Persian-RTL, mobile-first design is `DECIDED`.

---

## 1. Why this document exists

The single largest failure mode for a product like this is shipping a competent-but-generic interface.
Generic design is not a neutral outcome here — it is the failure the founders explicitly called out
("must NOT look like a generic admin template / a boring QR menu / a basic CRUD application /
an AI-generated landing page / a copied restaurant template").

So the constraints below are intentionally opinionated. They are the minimum bar, not a ceiling.

---

## 2. Design north star

**"A printed menu brought to life, engineered for a phone."**

Interpretation:

- Restaurants invest enormous care in physical menus — typography, photography, paper stock, layout.
- The digital menu should inherit that care and add what paper cannot: instant availability, live
  status, ordering.
- It should not look like software. It should look like *the restaurant's menu*, that happens to be
  interactive.

This north star resolves most visual debates. When in doubt: does this look like a beautiful menu, or
like a dashboard?

---

## 3. Aesthetic direction — what we are and are not

### We are aiming for

| Trait | Meaning |
|---|---|
| **Editorial** | Menu items presented with typographic care, hierarchy, and rhythm — like a good printed menu |
| **Warm hospitality** | Warmth, invitation, appetite. Not cold enterprise SaaS |
| **Confident typography** | Persian type treated as a design material, not a default rendering |
| **Photography-forward** | Food imagery is the hero; the UI recedes |
| **Calm and fast** | No animation theatre. Motion is purposeful and short |
| **Native Persian** | Designed in RTL from the first pixel, not mirrored later |

### We are explicitly not aiming for

| Rejected | Why |
|---|---|
| Dark neon cyberpunk | Wrong hospitality register; hurts food photography |
| Glassmorphism | Trend-chasing, hurts legibility and load time |
| Material Design clone | Reads as generic; makes us indistinguishable |
| Purple/blue SaaS gradient | Category error for a restaurant |
| Over-decorated illustration | Competes with food photography |
| Skeuomorphic paper texture simulation | Fails on small screens and looks kitsch |
| Heavy shadows/gradients everywhere | Cheapens; hurts C2 performance budget |

---

## 4. Typography

### 4.1 Persian font

`DECIDED` — Persian typography must be excellent. Specific face is `OPEN QUESTION`.

Requirements for the chosen face:

- Complete, well-hinted Persian glyph set including Persian/Arabic digits
- Correct joining behaviour for all Persian letter combinations
- Multiple weights (at least 400 / 500 / 600 / 700) for hierarchy without faux-bolding
- Reasonable Persian metrics — Persian needs more vertical room than Latin; line-height must be tuned
  upward
- Self-hosted and subset (C2 performance) — no render-blocking external font CDN

Candidate categories to evaluate during implementation: **Vazirmatn**, **Estedad**, **Morabba**,
**Shabnam**, **Gandom**, or a licensed display face for headings.

> Do not select a Latin-first aesthetic font and accept its Persian fallback. The Persian face is the
> design.

### 4.2 Type scale

`PROPOSED`

Modular scale anchored to a mobile-first base. The key constraint: **Persian text is visually larger
and denser than Latin at the same nominal size**. Sizes must be tuned to Persian, then scaled.

Rough roles:

| Role | Notes |
|---|---|
| Display | Restaurant name / hero |
| Title | Section titles, product detail name |
| Body | Descriptions, supporting text |
| Label | Buttons, tabs, badges |
| Price | Distinct tabular treatment, always legible |

### 4.3 Numerals

`DECIDED`

Prices use Persian digits (`۱۲۰٬۰۰۰`). Price must use a tabular/fixed-width treatment so numbers align
in lists and totals.

Currency unit label placement (e.g. «تومان» inline vs. suffix) — `OPEN QUESTION`, see
`governance/open-questions.md#ux`.

### 4.4 Latin inside RTL

`DECIDED` (from C3)

Product names and brand names are frequently Latin (`Cappuccino`, `Espresso`, `Menu`). They must render
correctly inside RTL layout, with correct bidi ordering and no mangled punctuation.

---

## 5. Colour

### 5.1 Strategy

`DECIDED` in principle (warm, food-forward, not generic SaaS), specifics `PROPOSED`.

Two coherent surfaces are needed:

1. **Customer menu** — must serve food photography. Photography is the only thing allowed to be truly
   loud. The UI around it stays quiet and warm so food pops.
2. **Staff application** — functional, higher information density, still on-brand and recognisably the
   same product.

### 5.2 Roles to define

- **Background / surface / raised surface** — the quiet base
- **Text primary / secondary / tertiary / inverse**
- **Accent / brand** — the single brand colour, used sparingly
- **Status colours** — one per order state family, shared with customer status wording (X4)
- **Availability state** — the "sold out" treatment
- **Semantic** — success (approved), warning (waiting), danger (cancelled)

### 5.3 Constraint: status colours must be distinguishable without relying on colour alone

`PROPOSED` (accessibility floor, aligns with X3)

Waiting / preparing / ready are all "in-progress-ish". They must be distinguishable by **icon + label +
colour**, never colour alone. Colour-blind users and low-quality restaurant displays exist.

### 5.4 Dark mode

`OPEN QUESTION`

The customer menu in a dim restaurant at night is a plausible use case. But dark mode doubles the
visual QA surface and can hurt food photography contrast. Recommend: **not MVP**; design tokens
should not preclude it.

---

## 6. Layout and composition

### 6.1 Structure of the customer menu

Required regions (from UX principles C6, and the demo brief):

| Region | Content |
|---|---|
| **Restaurant identity** | Name, logo/cover imagery, short descriptor |
| **Sticky category navigation** | Fast access to categories; keeps context while scrolling |
| **Product list/grid** | Cards: image, name, price, availability |
| **Product detail** | Larger image, description, options, quantity, add |
| **Cart / order preview** | Draft contents and total before submit |
| **Session context** | Table identification, ordering access state |
| **Order status** | Live status of submitted orders |

### 6.2 RTL is structural

`DECIDED`

Layout is designed RTL-first. Logical properties (start/end) are used rather than physical
left/right. Nothing is mirrored after the fact.

### 6.3 Mobile-first grid

`PROPOSED`

- Product list: single column on phones. Larger cards = bigger imagery = more appetite.
- On wider screens, widen into a two-column grid rather than centring a narrow column in whitespace.

### 6.4 Density

| Surface | Density |
|---|---|
| Customer menu | Generous. Air = premium. |
| Customer cart | Compact but touch-friendly. |
| Staff order queue | Compact, information-dense, high legibility. |

---

## 7. Components — the required inventory

### Customer-facing

| Component | Notes | Priority for demo |
|---|---|---|
| Restaurant header / cover | Identity, imagery | **MVP** |
| Sticky category bar | Horizontal, snap-scrolling | **MVP** |
| Product card | Image, name, price, availability state | **MVP** |
| Product detail sheet/page | Large image, description, options, add-to-cart | **MVP** |
| Availability badge | «ناموجود» treatment | **MVP** |
| Price display | Persian digits, unit, tabular | **MVP** |
| Cart preview / bar | Draft total, item count, review action | **MVP** |
| Session / table indicator | Which table, what state | **MVP** |
| Approval waiting state | «در انتظار تأیید» + reassurance | **MVP** |
| Quantity stepper | Large touch targets | **MVP** |
| Order status view | Live progress + item list | **MVP** |
| Bill view | Items, quantities, prices, discounts, total | **MVP** |
| Search / filter | Only if it fits the design language | `PROPOSED` for demo |
| Modifier picker | Structure only; full engine is `FUTURE` | Demo can show the pattern |
| Offline / connection banner | Only as graceful messaging (P9) | `PROPOSED` |

### Staff-facing (not built in the demo phase)

| Component | Notes |
|---|---|
| Approval queue list | Table, wait time, one-tap approve |
| Order board | Per-status lanes or list |
| Order detail | Line items, modifiers prominent, actions |
| Station queue | Kitchen / bar filtered view |
| Table grid | Status overview |
| Bill / settlement view | Total, record payment |
| Staff login | Method `OPEN QUESTION` |

---

## 8. Imagery

### 8.1 Why it matters

`DECIDED` (from the brief) — the menu must demonstrate strong visual presentation. Food photography is
the primary reason a customer chooses item X over item Y.

**The demo must use realistic, appetising food imagery, not grey placeholder boxes.** Placeholder
imagery would fail the "commercially believable" bar even with excellent typography.

### 8.2 Requirements

| Concern | Rule |
|---|---|
| Aspect ratio | Consistent per context (e.g. cards 4:3, detail 16:10) to avoid layout shift |
| Lazy loading | Off-screen images must not compete with first paint (C2) |
| Sizing | Serve appropriately sized variants, never a 4000px original to a phone |
| Quality | Well-lit, appetising, consistent colour temperature across the menu |
| Placeholder | Progressive: blurred tiny placeholder or solid tone while loading. Never a broken icon |
| Failure | If an image is missing, fall back to a typographic card, not a broken image |

### 8.3 Demo imagery sourcing

`OPEN QUESTION`

Where legal demo imagery comes from (licensed stock, founder photography, generated) is unresolved and
has licensing implications. Flagged in `governance/open-questions.md#legal-compliance`.

---

## 9. Motion

| Rule | Detail |
|---|---|
| Purpose only | Motion communicates state change or spatial relationship. Nothing decorative-looping. |
| Short | ~150–300ms for transitions. Anything slower feels broken to a waiting customer. |
| Respect reduced motion | `PROPOSED` per X3 |
| No entrance animation on first paint | Hurts C2; the menu must be readable immediately |
| Status change should be noticeable | A subtle, non-alarming indicator when an order advances |

**Note:** a status change *should* be perceptible — the customer is not staring at the screen. Balance
with `PROPOSED: never auto-playing attention-grabbing animation`.

---

## 10. Design tokens

`PROPOSED` — the system should be driven by tokens, so custom domains, multiple restaurants, and any
future theming are configuration, not a fork.

Token categories:

| Category | Purpose |
|---|---|
| Colour | Surfaces, text, accent, status |
| Typography | Family, sizes, weights, line heights |
| Spacing | A consistent spacing scale |
| Radius | Corner radii — a strong part of the visual signature |
| Elevation | Shadows/overlays |
| Motion | Durations, easings |
| Breakpoints | Mobile-first widths |

**Tenant theming** (per-restaurant colour accent / cover) is `FUTURE` but token architecture must not
prevent it. Do not hard-code colours in components.

---

## 11. How to judge a design

`PROPOSED` — a review checklist for the menu demo.

| # | Question |
|---|---|
| 1 | Would a café owner look at this and think "this is for a place like mine"? |
| 2 | Does it look like a designed menu, or like an app with a menu inside it? |
| 3 | Is the Persian typography genuinely well-set, or merely translated? |
| 4 | Does any screen look like a generic admin panel? |
| 5 | Is every product's price and availability instantly readable? |
| 6 | Can you order from the menu with one thumb, without mis-taps? |
| 7 | Does the "waiting for approval" state explain and reassure? |
| 8 | Does it load fast on a real phone on mobile data? |
| 9 | Is it distinctive from the 5 QR-menu competitors it will be judged against? |
| 10 | Is it Persian-first rather than English-first-with-Persian-text? |

If any answer is "no", the demo is not ready to be shown to a restaurant owner.

---

## 12. Anti-goals for the design

`DECIDED` (from the brief) — explicitly rejected visual targets:

- Generic admin template
- Boring QR menu
- Basic CRUD application look
- AI-generated generic landing page
- Copied restaurant template
- Placeholder design used "just to finish the frontend"

---

## 13. Open questions for design

See [`../governance/open-questions.md`](../governance/open-questions.md#ux). Summary:

- Which Persian typefaces? (blocking for implementation start)
- Currency unit label treatment.
- Dark mode: yes/no for MVP.
- Imagery licensing source for the demo.
- Does the brand need a name/identity, or is it still white-label?
- Search/filter: in or out of the demo?
- Staff application design: do we extend the customer design language or diverge for density?