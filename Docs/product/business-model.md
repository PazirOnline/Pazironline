# Business Model

`DECIDED` — restaurants are **paying subscribers**.
`DO NOT ASSUME` — any specific price, plan tier, trial length, feature limit, or payment gateway.

---

## 1. What is decided

| Question | Answer | Status |
|---|---|---|
| Are customers paying? | Yes, subscription | `DECIDED` |
| Is pricing known? | No | `OPEN QUESTION` |
| Is the plan structure known? | No | `OPEN QUESTION` |
| Is a free trial known? | Implied by `TRIAL` state, length unknown | `OPEN QUESTION` |
| Are there multiple tiers? | Unknown | `OPEN QUESTION` |
| What is a "feature"? | Unknown | `OPEN QUESTION` |
| How is payment collected? | Unknown (Iranian payment rails) | `OPEN QUESTION` |
| Does a tenant lifecycle exist? | Yes: TRIAL / ACTIVE / GRACE_PERIOD / SUSPENDED / CANCELLED | `DECIDED` (states) |
| Are lifecycle business rules defined? | No | `OPEN QUESTION` |

---

## 2. Where the money comes from

`PROPOSED` — the reasoning, not a decision:

1. **Subscription is the primary revenue.** A restaurant pays a recurring fee for the platform.
2. **Advertising on the customer menu** is a plausible secondary stream — restaurants may pay to boost
   a product or appear in a "featured" slot. `PROPOSED`, **not decided**, and it must not degrade the
   menu's premium feel. See `governance/future-features.md`.
3. **Premium add-ons** (custom domain, analytics, extra branches, KDS hardware support) are plausible
   `FUTURE` upsells.

Only #1 is `DECIDED`.

---

## 3. Why subscription (not one-off setup fee)

`PROPOSED` reasoning:

- Menus change weekly (prices, availability, new items). A static site goes stale and the restaurant
  stops trusting it.
- Staff change. A one-off site with no admin is useless to them.
- Recurring value (orders, reports, time savings) must justify a recurring fee.
- Central SaaS lets us ship improvements to all tenants simultaneously — impossible with one-off builds.

---

## 4. Tenant lifecycle

`DECIDED` (states) — full detail in [`../platform/subscriptions.md`](../platform/subscriptions.md).

```
TRIAL ──► ACTIVE ──► GRACE_PERIOD ──► SUSPENDED
  │          │                            │
  └──────────┴────────────► CANCELLED ◄──┘
```

| State | Meaning | Status |
|---|---|---|
| `TRIAL` | Evaluating the product | `DECIDED` as a state; duration `OPEN QUESTION` |
| `ACTIVE` | Paid and in good standing | `DECIDED` |
| `GRACE_PERIOD` | Payment failed, limited grace before suspension | `DECIDED` as a state; length `OPEN QUESTION` |
| `SUSPENDED` | Not serving customers | `DECIDED`; behaviour of the live menu is `OPEN QUESTION` |
| `CANCELLED` | Terminated | `DECIDED`; data retention is `OPEN QUESTION` |

**Unresolved and consequential:**

- What happens to a restaurant's live menu when suspended? Hide it? Show a "temporarily unavailable"
  page? This has a real cost/UX tension and needs a product decision.
- Does the tenant keep read-only access to their data while suspended?
- Cancellation → is data deleted, archived, or retained indefinitely?
- Does reactivation restore everything?

---

## 5. Pricing

`DO NOT ASSUME` — pricing is **not decided** and must not be invented anywhere in code, docs, or UI.

Questions that must be answered before pricing:

| Question | Why it matters |
|---|---|
| Price per month? per year? both? | Revenue model |
| Per-table, per-location, or flat? | Drives perceived value and scales with the restaurant's size |
| Tier differentiation — what is a paid feature? | Only a feature you can gate creates a tier |
| Trial length | Affects conversion |
| Limits per plan (products, staff, orders/month)? | Creates upgrade pressure; also a real technical gate |
| Onboarding/setup fee? | Covers manual menu entry support |
| Local payment rails? | Iranian gateways have specific integration constraints |
| Currency and instalments? | Affects affordability |
| Discounts for early tenants / referral? | Growth lever |

---

## 6. Unit economics questions

`OPEN QUESTION` — relevant to whether the model works at all:

| Question |
|---|
| How much does support cost per tenant per month? |
| Who enters the menu for the restaurant — them, us, or an agency? (Onboarding cost) |
| What is the realistic churn rate for cafés? |
| What is the ARPU target? |
| What is the infrastructure cost per tenant? (images, storage, traffic) |
| Is support in-app or WhatsApp/Telegram? (Likely the latter in Iran — `OPEN QUESTION`) |

---

## 7. Go-to-market hypotheses

`PROPOSED` — **all speculative**, recorded so future agents don't mistake them for strategy:

- The menu demo doubles as the sales tool (hence Phase 1).
- Onboarding friction is the main risk: an empty menu is a bad demo. Bulk menu entry support may be
  essential.
- Direct sales to independent cafés and small chains, possibly in-person.
- QR stickers/table tents need physical production and distribution — a real operational cost.

**None of this is decided. Do not build for any of it.**

---

## 8. Relationship between subscription state and the product

`PROPOSED` — architectural constraint only:

Subscription state must be a **gate on tenant capability**, evaluated at the platform boundary, not
scattered through business logic. This keeps entitlement logic in one place so plan limits, when they
exist, can be added without touching every feature.

**Decision needed:** whether the customer-facing menu is affected by subscription state at all, and if
so how. Recorded in `governance/open-questions.md#business`.

---

## 9. Non-goals

- ❌ Marketplace/takeaway platform fees (commission) — `DO NOT ASSUME`, not discussed.
- ❌ Charging the end customer — the customer pays at the restaurant's cashier.
- ❌ Advertising revenue in the MVP.

---

## 10. Open questions

All business questions are grouped in
[`../governance/open-questions.md`](../governance/open-questions.md#business). The blocking ones:

1. Does a suspended tenant's menu go dark for customers? (affects UX + implementation)
2. What is the billing currency and which payment rail?
3. What features define a paid tier, if tiers exist?
4. What happens to data on cancellation?
5. Who populates the menu during onboarding — the restaurant, us, or an agency?

---

## 11. Cross-references

- [`../platform/subscriptions.md`](../platform/subscriptions.md) — lifecycle implementation concepts
- [`../platform/multi-tenancy.md`](../platform/multi-tenancy.md) — who a tenant is
- [`../governance/open-questions.md`](../governance/open-questions.md#business) — the unanswered list
- [`../governance/future-features.md`](../governance/future-features.md) — plan-gated future features