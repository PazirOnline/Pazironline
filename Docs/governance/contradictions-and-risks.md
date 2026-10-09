# Contradictions and Risks

Two things are recorded here:

1. **Contradictions** — places where the specification conflicts with itself or with a principle.
2. **Risks** — failure modes we can foresee.

**Nothing here has been silently "fixed".** Each item states the conflict and asks for a decision.

Related: [`decision-log.md`](decision-log.md) · [`open-questions.md`](open-questions.md)

---

# Part 1 — Contradictions in the brief

## §1 — The order lifecycle has no cancellation state

**The conflict:**

| Source | Says |
|---|---|
| §11 (Order Lifecycle) | `PENDING → CONFIRMED → PREPARING → READY → DELIVERED → PAID → CLOSED` — no cancellation state |
| §25 (Audit Log) | *"Order #5821 — Cancelled by: Ali"* as an audit example |
| §36 (Future Problems) | Lists "order cancellation" as a concern |
| §13 (Order Management) | Staff "should be able to progress the order through its workflow" — no mention of declining |

**Why it matters:** If cancellation is auditable, it must be possible. As written, the state machine
cannot represent a cancelled order.

**Options:**

| Option | Consequence |
|---|---|
| A. Add `CANCELLED` as a terminal state | Cancelled orders are representable; excluded from the bill |
| B. Add both `CANCELLED` and `REJECTED` | Distinguishes "declined" from "withdrawn" — more accurate |
| C. Model cancellation outside the status field | Weak: the status would lie |

**Recommendation (`PROPOSED`, not applied):** **Option B** — `REJECTED` for declining before production
starts, `CANCELLED` for withdrawing after.

**Status: awaiting founder decision.** Implementation of the order state machine is blocked on this.

---

## §2 — "Approve once per session" vs. the approval gate's security purpose

**The tension:**

- The approval gate exists so a **human confirms a genuine diner** at the table (D-007).
- Approval lasts for the whole session (D-008).

**The conflict:** after approval, the customer can submit orders from anywhere — home, the street — until
the session closes. The gate protects the *start* of a session but not its duration.

**Related tension with D-011:** the session deliberately survives closing and reopening the menu. A
customer who is approved, leaves, and returns days later still holds ordering permission.

**Options:**

| Option | Trade-off |
|---|---|
| A. Absolute session expiry (e.g. N hours) | Bounds exposure; needs a graceful mid-meal re-approval path |
| B. Idle timeout only | Weak: an attacker keeps the tab open |
| C. No expiry | Maximum exposure |
| D. Both, with a long absolute cap | Best balance |

**Recommendation (`PROPOSED`):** **D** — idle timeout + a long absolute cap, with a clear re-approval
path. Requires care so a 3-hour lunch isn't interrupted mid-order.

**Status: awaiting founder decision.** This is the highest-priority open question.

---

## §3 — One open session per table vs. future table merge

**The conflict:**

| Source | Says |
|---|---|
| Table management (§21) | Table states are singular; a table has one occupancy |
| Future requirements (§21) | Tables may need **merge** |
| Future requirements (§24) | Bills may need **merge**; orders may **transfer** between tables |

**Why it matters:** Merging two table sessions into one bill requires, at some point, two sessions
associated with one bill — or a single session owning orders from two tables. A hard "one open session per
table" constraint at the database level would block it.

**Options:**

| Option | Consequence |
|---|---|
| A. Hard constraint now | Merge becomes a schema-violating operation later |
| B. No database constraint; enforce in application logic | Merge is possible; the invariant is weaker |
| C. Design merge into the session model now | Over-engineering (D-032) |

**Recommendation (`PROPOSED`):** **B** — enforce one-open-session-per-table in the application layer, not
as a database uniqueness constraint. Costs nothing today; preserves future flexibility.

**Status: architectural recommendation, awaiting confirmation.**

---

## §4 — Tenant = restaurant vs. brand = restaurant

**The conflict:**

| Source | Says |
|---|---|
| §3 (Multi-Tenant Architecture) | "Each restaurant is an isolated tenant" |
| §27 (Multi-Branch) | "A restaurant/brand may eventually have multiple branches", each with "tables, staff, orders, menu availability, printers/stations, settings" |

**Why it matters:** If a chain has 5 branches and we treat each as an independent tenant, the owner has 5
subscriptions, 5 logins, and 5 separate reports — and cannot answer "how did my chain do this month?" If
we treat the brand as one tenant, branch-scoped isolation is required everywhere.

**This is unresolved and it blocks the schema.**

**Options:**

| Option | Consequence |
|---|---|
| A. Tenant = branch/location | Simple now; chains are awkward |
| B. Tenant = brand; branches are sub-entities | Correct long-term; more complex now |
| C. Tenant = restaurant, with an optional parent-group field | Middle ground |

**Recommendation (`PROPOSED`):** **C or B** — include a location dimension now that degrades to a single
implicit location per tenant. The MVP stays simple; the door stays open.

**Status: awaiting founder decision. Blocks the data model.**

---

## §5 — §7 rejects GPS/Wi-Fi, but "the customer is inside the restaurant" is assumed throughout

**The tension:**

- D-007 rejects location verification as a security mechanism.
- The entire product premise is that the customer is *inside* the restaurant.

**The conflict:** we have removed the only technical control that would verify the premise, and rely
entirely on a human noticing.

**Assessment:** this is a **deliberate, accepted** trade-off by the founders, not an oversight. It is
recorded here because it is the product's largest residual risk: a careless approval defeats the gate.

**Mitigations (none decided):** approval queue shows table + wait time; audit trail; rate limits; future
anomaly detection.

**Status: accepted. No change proposed.**

---

## §6 — "Avoid premature implementation" vs. "architecture must not make future requirements impossible"

**The tension:** D-032 (don't over-engineer) vs. D-021/D-026/D-027 (leave room for modifiers, branches,
analytics).

**Why it isn't a real conflict:** the resolution is "extensible shape, minimal features". Concretely:
add reserved columns and correct relationships; don't build the feature.

**Where this rule has already been applied (and should be reviewed):**

| Future requirement | What's added now | Why it isn't over-engineering |
|---|---|---|
| Modifiers (D-021) | Reserved option structure | Retrofitting risks data loss |
| Split bills (D-037) | Bill allocation model | Saves a redesign |
| Analytics (D-027) | Snapshots + milestone timestamps | Cannot be backfilled |
| Branches (D-026) | A location dimension | A schema change later is expensive |
| Custom domains (D-034) | Host-capable tenant resolution | Retrofitting means reworking routes |
| Cancellation (§1 above) | Terminal states | Already implied by the audit requirement |

---

## §7 — Approval vs. entrance QR

**The conflict:** D-006 requires an approved table session to order. But the entrance QR (D-003/§5)
identifies no table.

**The gap:** an entrance-QR customer who wants to order has nothing to attach orders to.

**Options:** prompt them to scan the table QR; let staff attach them to a table; or define a "general"
table per restaurant.

**Status: awaiting product decision.**

---

# Part 2 — Foreseeable risks

| # | Risk | Likelihood | Impact | Mitigation | Status |
|---|---|---|---|---|---|
| R-01 | **Approval fatigue** — staff find it slow and start skipping it, killing the anti-abuse gate | High | **Critical** | One-tap approval (S1); queue shows wait time; measure | `PROPOSED` |
| R-02 | **Duplicate orders** from slow networks | High | High (rework, refunds) | Idempotency keys (D-018) | `DECIDED` |
| R-03 | **Fake orders** from a QR photo outside the restaurant | Medium | High | Approval gate (D-007) + rate limits | `DECIDED` + `OPEN QUESTION` |
| R-04 | **Cross-tenant data leak** | Low | **Critical** | Mandatory tenant scoping; isolation tests; penetration test | `DECIDED` |
| R-05 | **Price snapshot regressions** — someone reads a live product price for a historical order | High | High (wrong bills, wrong reports) | Documented anti-pattern; code review rule | `DECIDED` |
| R-06 | **Menu demo looks generic** → restaurant owners see a commodity QR menu | Medium | **Critical** (fails the pitch) | Design as the first deliverable; quality bar; founder approval gate | `DECIDED` |
| R-07 | **Slow menu on mobile data** | Medium | High (abandonment) | CDN + optimised images + lazy loading; test on a real phone | `DECIDED` |
| R-08 | **Slug change breaks printed QR codes** | Low | High (every artifact in the restaurant) | Slug immutability | `PROPOSED` |
| R-09 | **Order number collisions at peak** | Medium | Medium | Concurrency-safe allocation | `PROPOSED` |
| R-10 | **Peak-hour order storms** overwhelm the kitchen queue | Medium | High | Station filtering; queue-first UI; real-time | `PROPOSED` |
| R-11 | **Printing solution doesn't match the data model** | Medium | High | Reserved print entities; founder-owned solution reviewed before build | `OPEN QUESTION` |
| R-12 | **Persian typography fails on thermal printers** | Medium | Medium | Test early; it's a known weak point | `OPEN QUESTION` |
| R-13 | **Subscription suspension takes a café's menu offline during service** | Low | High (customer-facing) | Warn the owner first; never break a live session | `PROPOSED` |
| R-14 | **Onboarding friction** — an empty menu is a bad demo, so restaurants don't go live | High | High (revenue) | Bulk import; assisted onboarding; templates | `OPEN QUESTION` |
| R-15 | **Staff permission mistakes** (e.g. cashier discounts too freely) | Medium | Medium | Restrict permissions; audit | `DECIDED` + matrix `OPEN QUESTION` |
| R-16 | **Shared kitchen tablets** erode attribution | High | Medium | Per-action actor; auth method decision | `OPEN QUESTION` |
| R-17 | **Session token leaks via URL/referrer** | Low | High (session hijack) | No session tokens in URLs; referrer policy | `PROPOSED` |
| R-18 | **Menu edits visible mid-service** leave customers seeing a broken menu | Medium | Medium | Draft/publish model | `OPEN QUESTION` |
| R-19 | **Currency unit chosen wrong**, forcing a migration of every monetary value | Medium | High | Decide before the schema is frozen | `OPEN QUESTION` |
| R-20 | **Real-time transport doesn't fit the hosting/data-residency constraints** | Medium | Medium | Abstract the transport first; polling fallback | `DECIDED` (D-035) |
| R-21 | **Legal/compliance gaps** (tax, personal data, data residency) | Medium | High | Legal research before launch | `OPEN QUESTION` |
| R-22 | **Customers perceive the approval gate as surveillance** | Low | Medium | Ask only for optional data; no GPS (D-007) | `DECIDED` |
| R-23 | **Wrong item prepared** because modifiers were misread | Medium | Medium | Prominent modifiers in staff views (S4) | `DECIDED` |
| R-24 | **Scope creep into a full POS** | Medium | High | D-032; non-goals list | `DECIDED` |
| R-25 | **Docs drift from the code** | High | Medium | D-031; update docs in the same change | `DECIDED` |
| R-26 | **A future agent reverses a decision** | Medium | High | Decision log; explicit reversal entries only | `DECIDED` |
| R-27 | **Split bill retrofitted badly** | Low | High | D-037 allocation model now | `PROPOSED` |
| R-28 | **Product hard-deleted, breaking history** | Low | High | Archive-only policy (D-020) | `DECIDED` |
| R-29 | **Half a table orders on two devices**, producing confusion | Low | Medium | Single-device assumption; session conflict handling `OPEN QUESTION` | `DECIDED` + `OPEN QUESTION` |
| R-30 | **Internet outage at the restaurant** stops all ordering | Medium | High (restaurant falls back to manual) | Accept; degrade with clear messaging | `DECIDED` (D-017) |

---

# Part 3 — What we are deliberately choosing not to defend yet

`DECIDED` — recorded so they aren't mistaken for oversights:

| Gap | Why accepted |
|---|---|
| No offline ordering | D-017 |
| No online payment | Non-goal |
| No inventory | Non-goal |
| No analytics dashboards | D-027 |
| No custom domains | D-034 |
| No multi-branch UI | D-026 |
| No full modifier engine | D-021 |
| No delivery/courier | Non-goal |
| No POS hardware integration | Non-goal |
| No native apps | Non-goal |
| Deterministic insider abuse prevention | Accepted; audit is the control |

---

# Part 4 — How to use this document

When you find a new conflict:

1. Write it here with the conflicting sources cited.
2. State the options and a recommendation.
3. **Do not change any other doc** until the decision is made.
4. When decided, update the affected docs **and** add a decision-log entry, then update `changelog.md`.