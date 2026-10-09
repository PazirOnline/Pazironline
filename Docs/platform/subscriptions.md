# Subscriptions

Tenant lifecycle states and how they affect the product.

Related: [`../product/business-model.md`](../product/business-model.md) ·
[`multi-tenancy.md`](multi-tenancy.md)

---

## 1. What it is

The lifecycle state of a tenant's subscription and its consequences for what the product does.

**Who uses it:** the restaurant owner (their state), the platform (enforcement).

---

## 2. Why it exists

`DECIDED`

Restaurants are paying subscribers. The platform must know whether a tenant is in good standing,
because the subscription is the product's revenue.

---

## 3. States

`DECIDED` (the states exist) · `OPEN QUESTION` (every rule attached to them)

```
  ┌────────┐
  │ TRIAL  │  evaluating
  └────┬───┘
       │ trial ends / first payment
       ▼
  ┌────────┐
  │ ACTIVE │  paid and in good standing
  └────┬───┘
       │ payment fails
       ▼
  ┌───────────────┐
  │ GRACE_PERIOD  │  warning window
  └────┬──────────┘
       │ grace expires
       ▼
  ┌───────────┐
  │ SUSPENDED │  not serving customers
  └────┬──────┘
       │ payment resolved → back to ACTIVE
       └──────────────────────────────┐
                                       ▼
  ┌────────────┐              ┌────────┐
  │ CANCELLED  │◄─────────────│ ACTIVE │
  └────────────┘   cancel     └────────┘
```

| State | Meaning | Status |
|---|---|---|
| `TRIAL` | Evaluating the product | `DECIDED` as a state; duration `OPEN QUESTION` |
| `ACTIVE` | Paid, in good standing | `DECIDED` |
| `GRACE_PERIOD` | Payment failed; a warning window | `DECIDED` as a state; length `OPEN QUESTION` |
| `SUSPENDED` | Not serving | `DECIDED`; behaviour `OPEN QUESTION` |
| `CANCELLED` | Terminated | `DECIDED`; data retention `OPEN QUESTION` |

---

## 4. Enforcement point

`PROPOSED`

```
Incoming request
      ↓
Resolve tenant
      ↓
Load tenant subscription state
      ↓
Apply policy for this state  ← single choke point
      ↓
Proceed
```

**Rule:** subscription policy is evaluated in **one place** at the platform boundary, not scattered
through features. Adding plan limits later should not require touching every feature.

---

## 5. Behaviour per state — the unresolved core

**`OPEN QUESTION` — this is the most consequential product decision in this document.**

### 5.1 The tension

| Option | Suspended behaviour | Consequence |
|---|---|---|
| A. Menu stays live | Customers see the menu; staff app limited | Existing customers are unaffected; we provide value we're not being paid for |
| B. Menu goes dark | Customers see "temporarily unavailable" | Stronger commercial leverage; **punishes the restaurant's customers** |
| C. Read-only everywhere | Menu live, ordering disabled | Half-hearted; confusing for customers and staff |

### 5.2 Questions to decide

| # | Question |
|---|---|
| SB1 | What does a **suspended** tenant's customer-facing menu show? |
| SB2 | Does a suspended tenant's staff app work at all? Read-only? Locked? |
| SB3 | What does a **grace period** tenant see? A warning banner in the staff app? |
| SB4 | Does a **trial** tenant get every feature, or a limited subset? |
| SB5 | What happens on reactivation — is everything restored? |
| SB6 | Is data deleted on cancellation, or retained? For how long? |
| SB7 | Can a cancelled tenant reactivate? |
| SB8 | Does suspension stop an active session mid-meal? (**Strongly recommended: no**) |

### 5.3 Recommendation (`PROPOSED` — not decided)

| State | Staff app | Customer menu |
|---|---|---|
| `TRIAL` | Full (or trial-scoped) | Full |
| `ACTIVE` | Full | Full |
| `GRACE_PERIOD` | Full + visible warning banner | **Unchanged** |
| `SUSPENDED` | Read-only + upgrade prompt | **Unchanged but banner: «در حال به‌روزرسانی»** — never block a customer mid-meal |
| `CANCELLED` | Locked, data export available | A simple closed page |

**Reasoning:** the restaurant's customers are not our negotiating leverage. Turning off a café's menu
because *their owner* missed a payment damages the café's business and generates support calls from the
wrong people. The pressure belongs on the restaurant owner, in the staff app.

**This is a recommendation only. It is a business decision.**

---

## 6. Billing

`DO NOT ASSUME` — nothing about billing is decided. See
[`../product/business-model.md`](../product/business-model.md) §5.

| Unknown |
|---|
| Price, currency, plan tiers, trial length, grace length |
| Payment rails in Iran (gateway choice, instalments) |
| Invoice/receipt requirements |
| Automatic vs. manual collection |
| Proration, refunds, failed-payment retry |

---

## 7. Plan tiers and feature gating

`FUTURE` / `OPEN QUESTION`

Nothing is defined. But architecturally:

| Requirement | Rationale |
|---|---|
| A single entitlement check point | Adding tiers shouldn't touch every feature |
| Entitlements as data, not code branches | Plan changes without a deploy |
| Which features gate which plans | Product decision |

---

## 8. Business rules

| # | Rule | Status |
|---|---|---|
| SU1 | Every tenant has exactly one subscription state | `DECIDED` |
| SU2 | State changes are audited | `PROPOSED` |
| SU3 | State changes are server-side only | `DECIDED` |
| SU4 | Policy is enforced at a single choke point | `PROPOSED` |
| SU5 | An active customer session is not broken by a state change | `PROPOSED` |
| SU6 | Data retention on cancellation | `OPEN QUESTION` |
| SU7 | Reactivation restores prior state | `OPEN QUESTION` |

---

## 9. Edge cases

| Edge case | Handling | Status |
|---|---|---|
| Payment fails mid-meal service | Do not interrupt; warn the owner | `PROPOSED` |
| Grace expires while an order is in preparation | Do not suspend mid-service | `PROPOSED` |
| Tenant cancels but has unsettled bills | Settlement must remain possible | `PROPOSED` |
| Tenant wants to leave and take their data | Export capability `OPEN QUESTION` | `OPEN QUESTION` |
| Trial ends and no payment method exists | Fall back to suspended with a clear message | `OPEN QUESTION` |
| Reactivation after 6 months | Restore everything | `OPEN QUESTION` |
| Staff logs into a suspended tenant's app | Read-only or locked — `OPEN QUESTION` | `OPEN QUESTION` |
| Tenant exceeds a plan limit | Notification vs. hard block | `OPEN QUESTION` |
| Chargeback | `FUTURE` | `FUTURE` |

**The "don't break a live service" rule matters.** A restaurant doing a Friday-night rush must never have
ordering fail because of a billing hiccup.

---

## 10. Security considerations

| Concern | Control | Status |
|---|---|---|
| Client setting its own subscription state | Server-side only | `DECIDED` |
| Tenant viewing another tenant's billing | Tenant scoping | `DECIDED` |
| Escalating a plan by tampering | Server-side entitlement check | `DECIDED` |
| Bypassing limits by API manipulation | Limits enforced server-side | `DECIDED` |
| Subscription state as a denial-of-service vector | Do not break live sessions (SU5) | `PROPOSED` |

---

## 11. Data implications

| Entity | Key fields |
|---|---|
| **Subscription** | id, tenant_id, state, plan_key?, trial_ends_at?, grace_ends_at?, started_at, ended_at, external_customer_ref?, external_subscription_ref? |
| **Subscription state change** | id, tenant_id, from_state, to_state, reason, actor, occurred_at |
| *(reserved)* | plan, entitlements, invoices, payments |

**Indexes:** `tenant_id` unique; `(state)` for platform-wide operations (e.g. finding suspended tenants).

State-change history should be recorded separately from the current state so the lifecycle is
reconstructable.

---

## 12. Current decision summary

`DECIDED`

Tenants have a subscription lifecycle: `TRIAL`, `ACTIVE`, `GRACE_PERIOD`, `SUSPENDED`, `CANCELLED`. The
platform enforces subscription state at a single boundary. Pricing, plans, and business rules are not
decided.

**Not decided:** per-state behaviour (especially what a suspended tenant's customers see), retention on
cancellation, reactivation, trial/grace lengths, plan definitions, payment rails.

---

## 13. Future considerations

| Feature | Constraint on today's model |
|---|---|
| Plan tiers | Entitlements as data |
| Usage limits (products, staff, orders) | Counting queries must be cheap |
| Annual billing / instalments | Billing adapter |
| Invoicing | Invoice entity |
| Multi-branch billing | Billing unit vs. branch boundary (see multi-tenancy §8) |
| Coupons/referrals | Discount/coupon entity |

---

## 14. Open questions

| # | Question | Blocking? |
|---|---|---|
| Q1 | **What does a suspended tenant's customer menu show?** | **Yes — customer-facing UX** |
| Q2 | Does suspension block the staff app? | **Yes** |
| Q3 | Trial length and trial feature scope | Yes |
| Q4 | Grace period length | Yes |
| Q5 | Data retention on cancellation | **Yes — legal** |
| Q6 | Reactivation semantics | No |
| Q7 | Plan tiers and gated features | **Yes — before monetisation** |
| Q8 | Payment rails in Iran | **Yes — before monetisation** |

Full register: [`../governance/open-questions.md`](../governance/open-questions.md).