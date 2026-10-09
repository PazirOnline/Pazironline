# Decision Log

Every major decision, why it was made, what was rejected, and what it costs us.

**Rules:** never silently reverse an entry. If a decision must change, add a new entry that supersedes
the old one and record why. Update the affected docs in the same change. Update `changelog.md`.

**Statuses:** `DECIDED` (settled by founders) · `PROPOSED` (documented, awaiting approval) ·
`SUPERSEDED` (replaced by a later decision)

---

## Index

| ID | Decision | Status | Date |
|---|---|---|---|
| [D-001](#d-001) | Product scope: restaurant workflow SaaS, not a QR menu | `DECIDED` | 2026-10-07 |
| [D-002](#d-002) | Multi-tenant SaaS with hard backend isolation | `DECIDED` | 2026-10-07 |
| [D-003](#d-003) | Central domain with `/r/{slug}`; no per-restaurant hosting | `DECIDED` | 2026-10-07 |
| [D-004](#d-004) | Static QR identity; dynamic table session | `DECIDED` | 2026-10-07 |
| [D-005](#d-005) | Opaque random tokens; no internal IDs in URLs/QR | `DECIDED` | 2026-10-07 |
| [D-006](#d-006) | Menu open; ordering requires staff approval | `DECIDED` | 2026-10-07 |
| [D-007](#d-007) | Approval is anti-abuse; GPS/Wi-Fi explicitly rejected | `DECIDED` | 2026-10-07 |
| [D-008](#d-008) | Approve once per session, not per order | `DECIDED` | 2026-10-07 |
| [D-009](#d-009) | No mandatory customer registration | `DECIDED` | 2026-10-07 |
| [D-010](#d-010) | Name and phone are optional | `DECIDED` | 2026-10-07 |
| [D-011](#d-011) | Session survives refresh and reopen; not tab-bound | `DECIDED` | 2026-10-07 |
| [D-012](#d-012) | One device orders for the whole table | `DECIDED` | 2026-10-07 |
| [D-013](#d-013) | Order lifecycle with explicit states | `DECIDED` | 2026-10-07 |
| [D-014](#d-014) | Customer wording decoupled from internal status | `DECIDED` | 2026-10-07 |
| [D-015](#d-015) | Role-based staff access; no single "accountant" model | `DECIDED` | 2026-10-07 |
| [D-016](#d-016) | Print/KDS neutrality | `DECIDED` | 2026-10-07 |
| [D-017](#d-017) | Offline operation out of scope | `DECIDED` | 2026-10-07 |
| [D-018](#d-018) | Idempotent order submission | `DECIDED` | 2026-10-07 |
| [D-019](#d-019) | Prices and product data snapshotted on orders | `DECIDED` | 2026-10-07 |
| [D-020](#d-020) | Soft delete / archive instead of product deletion | `DECIDED` | 2026-10-07 |
| [D-021](#d-021) | Extensible product model (variants/modifiers reserved) | `DECIDED` | 2026-10-07 |
| [D-022](#d-022) | Tenant-defined tables with a state machine | `DECIDED` | 2026-10-07 |
| [D-023](#d-023) | Structural bill calculation; payment at the cashier | `DECIDED` | 2026-10-07 |
| [D-024](#d-024) | Audit logging as a system requirement | `DECIDED` | 2026-10-07 |
| [D-025](#d-025) | Tenant subscription lifecycle states | `DECIDED` | 2026-10-07 |
| [D-026](#d-026) | Multi-branch must remain possible; MVP needs no UI | `DECIDED` | 2026-10-07 |
| [D-027](#d-027) | Preserve structured data for future analytics; build nothing now | `DECIDED` | 2026-10-07 |
| [D-028](#d-028) | Customer UI is Persian, RTL, mobile-first | `DECIDED` | 2026-10-07 |
| [D-029](#d-029) | Premium visual quality is a requirement, not polish | `DECIDED` | 2026-10-07 |
| [D-030](#d-030) | **Customer menu demo is the first implementation deliverable** | `DECIDED` | 2026-10-07 |
| [D-031](#d-031) | Documentation is part of the product | `DECIDED` | 2026-10-07 |
| [D-032](#d-032) | Do not over-engineer the MVP | `DECIDED` | 2026-10-07 |
| [D-033](#d-033) | Privacy-conscious data collection | `DECIDED` | 2026-10-07 |
| [D-034](#d-034) | Custom domains deferred but architecturally accommodated | `DECIDED` | 2026-10-07 |
| [D-035](#d-035) | Real-time capability required; transport undecided | `DECIDED` (capability) | 2026-10-07 |
| [D-036](#d-036) | English internals, Persian product surface | `DECIDED` | 2026-10-07 |
| [D-037](#d-037) | Recommend bill-allocation model for future split bills | `PROPOSED` | 2026-10-07 |
| [D-038](#d-038) | Persian README as the documentation entry point | `DECIDED` | 2026-10-07 |
| [D-039](#d-039) | Bilingual READMEs must mirror section-for-section, English canonical | `DECIDED` | 2026-10-08 |

---

## D-001 — Product scope: restaurant workflow SaaS, not a QR menu

**Decision:** The product is a complete restaurant workflow system — *Menu → Table → Customer Session →
Approval → Order → Preparation → Delivery → Bill → Payment* — with the menu as its front door.

**Reason:** A digital menu alone is trivially copyable and has no recurring operational value. The
workflow chain is what a restaurant pays for and cannot easily replicate.

**Alternatives considered:**
- *Build a QR menu product* — rejected: commoditised, no defensibility, weak subscription justification.
- *Build a full POS* — rejected: enormous scope, hardware integration, outruns the team.

**Why this won:** It targets the highest-value part (ordering + billing) while staying far smaller than a
POS.

**Consequences:** Every domain doc maps to a chain link. A feature that improves only the menu's
appearance must justify itself. Scope discipline is enforced by D-032.

---

## D-002 — Multi-tenant SaaS with hard backend isolation

**Decision:** One central platform; each restaurant is an isolated tenant; isolation is enforced by the
backend at the data layer.

**Reason:** The brief is explicit. Tenant A must never access tenant B's data. A shared platform is what
makes the SaaS economics work.

**Alternatives considered:**
- *Separate deployment per restaurant* — rejected: operationally impossible at scale; per-tenant cost.
- *Isolation by convention (remember to filter)* — rejected: guarantees future data leaks.

**Why this won:** Shared schema with mandatory tenant scoping is the standard SaaS shape and supports
platform-wide reporting.

**Consequences:** Every entity carries `tenant_id`; every query is scoped; unscoped access must be
structurally hard. Cross-tenant access tests become a release requirement.

---

## D-003 — Central domain with `/r/{slug}`

**Decision:** One domain. Tenant URLs are `ourdomain.ir/r/{restaurant-slug}`. No per-restaurant hosting
or domain purchase.

**Reason:** Operational and economic simplicity. Separate domains multiply cost and configuration.

**Alternatives considered:**
- *Subdomain per restaurant (`cafe-novin.ourdomain.ir`)* — viable; more attractive branding, but needs
  wildcard TLS and complicates the mobile browser's address bar.
- *Separate domains per restaurant* — deferred to premium (D-034).

**Why this won:** Simplest thing that works, and it keeps custom domains as a clean future add without
rework.

**Consequences:** Tenant resolution must be host-capable from day one (see D-034). Slugs become
long-lived printed artifacts — see D-005's immutability note.

---

## D-004 — Static QR identity, dynamic table session

**Decision:** A table's QR code is permanent static identity. Orderable state lives in a **Table
Session**.

**Reason:** Reprinting QR codes on every new customer is operationally impossible. The distinction is
what makes physical QR deployment viable at all.

**Alternatives considered:**
- *Dynamic QR that changes per customer* — rejected: requires reprinting or a display.
- *Encoding session state in the QR* — rejected: same problem.

**Why this won:** Separating identity from state is the only approach that lets a physical artifact stay
physical.

**Consequences:** The data model must have a first-class Table Session entity with a lifecycle.

---

## D-005 — Opaque random tokens; no internal IDs in URLs or QR

**Decision:** Table URLs use a random public token (`/r/cafe-novin/t/8FJ29KX72Q`), never
`/restaurant/42/table/7`.

**Reason:** Sequential IDs leak business scale, enable enumeration, and invite cross-tenant probing.

**Alternatives considered:**
- *Obfuscated sequential IDs* — rejected: reversible and enumerable.
- *Short numeric codes* — rejected: brute-forceable.

**Why this won:** Random tokens are standard practice and cost nothing.

**Consequences:** Tokens must be unguessable, regenerable per table, and rate-limited at lookup.

**Related sub-decision (`PROPOSED`):** slugs should be **immutable** after first use, because printed QR
cards embed them. A slug change silently breaks every physical artifact in the restaurant.

---

## D-006 — Menu browsing is open; ordering requires staff approval

**Decision:** Scanning a QR grants menu access only. Submitting an order requires an approved table
session.

**Reason:** It preserves the zero-friction menu experience while gating the commercially sensitive action.

**Alternatives considered:**
- *Login/registration before ordering* — rejected: D-009.
- *Payment before ordering* — rejected: no online payment in scope.

**Why this won:** It satisfies both "no friction to browse" and "orders must be genuine".

**Consequences:** Two distinct states in the customer UI; the approval queue becomes a critical staff
path (D-008).

---

## D-007 — Approval is the anti-abuse mechanism; GPS and Wi-Fi are rejected

**Decision:** The primary defence against fake orders is a human approving the table. GPS geofencing and
mandatory restaurant Wi-Fi are **explicitly rejected** as the primary mechanism.

**Reason:** A photo of a table QR must not enable ordering from home. Location is unreliable, spoofable,
expensive in battery, requires permissions customers distrust, and many Iranian cafés have no
guest Wi-Fi.

**Alternatives considered:**
- *GPS within X metres of the restaurant* — rejected: spoofable, indoor accuracy is poor, bad UX,
  permission fatigue.
- *Require restaurant Wi-Fi SSID* — rejected: most cafés don't offer it; guests use mobile data;
  connection is unreliable; customers may consider it surveillance.
- *No gate at all* — rejected: fake orders are a real financial problem.

**Why this won:** A human decision is trustworthy, cheap, and already part of restaurant workflow.

**Consequences:** Approval speed is critical to adoption (S1). The accepted residual risk — an approved
customer could order from anywhere — is bounded by an **expiry policy that is still an open question**.

---

## D-008 — Approve once per session, not per order

**Decision:** Staff approve the table's ordering session once. Every subsequent order in that session
proceeds without further approval.

**Reason:** Requiring approval per order would make the product slower than shouting at a waiter, and
staff would bypass it.

**Alternatives considered:**
- *Approve every order* — rejected: defeats the purpose; unacceptable operational load.
- *Approve per table per day* — rejected: too long a window; weak control.

**Why this won:** One approval per visit is operationally sensible and still requires a human.

**Consequences:** Approval is a session-level state transition, not an order gate. Order confirmation is
a **separate, later** question (see open-questions §product).

---

## D-009 — No mandatory customer registration

**Decision:** No account is required anywhere in the customer flow. Identity is an anonymous, device-bound
session.

**Reason:** Registration is the single biggest conversion killer in consumer ordering, and the customer
gains nothing from an account in the MVP.

**Alternatives considered:**
- *Phone OTP login* — rejected: friction, cost, and no value to the customer.
- *Account for order history* — rejected: `FUTURE`, and must be addable without changing the flow.

**Why this won:** The customer is standing in a café. Every extra step loses the order.

**Consequences:** The system must attribute orders without accounts (Customer Session). The billing and
fraud model must not assume identity.

---

## D-010 — Name and phone are optional

**Decision:** At order submission the customer **may** provide name and phone. Neither is required.

**Reason:** Staff benefit from identifying "the Cappuccino for Table 8", but the product must not
penalise the customer for privacy.

**Alternatives considered:**
- *Required phone* — rejected: friction, privacy, and the product doesn't need it.
- *No collection at all* — rejected: loses a genuinely useful operational signal.

**Why this won:** Collect only what's useful, and never mandate it.

**Consequences:** Both fields are nullable; the UI must not imply they are required. Privacy implications
are tracked under compliance.

---

## D-011 — Session survives refresh and reopen; not bound to an open tab

**Decision:** The customer session persists across page refreshes and across closing and reopening the
menu during the active visit. Order existence never depends on an open browser tab.

**Reason:** Explicit in the brief. Customers switch apps constantly; losing the session mid-meal is
unacceptable.

**Alternatives considered:**
- *In-memory session only* — rejected: breaks on every refresh.
- *Session bound to the tab* — rejected: explicitly ruled out.

**Why this won:** Explicit product requirement.

**Consequences:** The session needs device-persistent storage and server-side truth. **The exact
mechanism is an open question** — and it has a known security hazard (tokens in URLs), documented in
[`../domain/customer-sessions.md`](../domain/customer-sessions.md) §5.3.

---

## D-012 — One device orders for the whole table

**Decision:** One person scans and orders for everyone. Other diners need not scan.

**Reason:** Requiring every diner to scan creates coordination friction nobody wants.

**Alternatives considered:**
- *Per-diner accounts with shared bills* — rejected: `FUTURE`, heavy friction now.

**Why this won:** Matches how tables actually behave.

**Consequences:** "Split bill per person" becomes a `FUTURE` feature needing real identities — noted as a
constraint in [`../domain/billing.md`](../domain/billing.md) §9.2.

---

## D-013 — Order lifecycle with explicit states

**Decision:** Orders have explicit states: `PENDING → CONFIRMED → PREPARING → READY → DELIVERED → PAID
→ CLOSED`.

**Reason:** The product must know what stage an order is at, for the customer, staff, and reporting.

**Alternatives considered:**
- *A boolean "done"* — rejected: insufficient.

**Why this won:** Explicit states make the pipeline testable and reportable.

**Consequences:** Only defined transitions are legal. **The absence of a cancellation state is a
specification gap** — see [contradictions §1](../governance/contradictions-and-risks.md). Recorded
honestly rather than silently patched.

---

## D-014 — Customer wording decoupled from internal status

**Decision:** Internal statuses and customer-facing Persian wording are two layers. Customers never see
technical status names.

**Reason:** «در حال آماده‌سازی» is friendly; `PREPARING` is not. Coupling them would make every copy change
a code change.

**Alternatives considered:**
- *Show internal statuses* — rejected: reads as a machine, not a restaurant.
- *One status for both* — rejected: loses information.

**Why this won:** Presentation freedom without logic churn.

**Consequences:** A mapping layer is required; statuses not shown to customers (e.g. `CLOSED`) are
explicitly handled.

---

## D-015 — Role-based staff access; not built around one "accountant" role

**Decision:** Staff access is role-based. Roles include Owner, Manager, Cashier, Waiter, Kitchen, Barista.
Roles restrict both permissions and default views.

**Reason:** Explicit in the brief. Different employees do different things; the product must not assume a
single operator.

**Alternatives considered:**
- *Single admin role* — rejected: unusable in a real café.
- *Fully custom roles from day one* — rejected: complexity; needs a product decision first (open
  question §product).

**Why this won:** It is the minimum that makes the product usable in a real restaurant.

**Consequences:** A permission model is required. **The exact matrix is an open question** — a proposal is
in [`../platform/roles-and-permissions.md`](../platform/roles-and-permissions.md) §4.

---

## D-016 — Print/KDS neutrality

**Decision:** The product must work with a monitor, with only a printer, and with both. Nothing may assume
a monitor exists.

**Reason:** Restaurant hardware varies enormously. Assuming a monitor would exclude a large segment.

**Alternatives considered:**
- *KDS-first design* — rejected: excludes printer-only restaurants.
- *Printer-first design* — rejected: excludes screen-only restaurants and adds a hardware dependency.

**Why this won:** Neutrality is the only design that serves everyone.

**Consequences:** Order status must be drivable by any permitted role on any device. The printing
implementation itself is **explicitly undecided and founder-owned**.

---

## D-017 — Offline operation out of scope

**Decision:** No offline-first design, no sync engine, no conflict resolution.

**Reason:** Explicit in the brief. Offline support is a large, ongoing complexity cost.

**Alternatives considered:**
- *Offline-first local database* — rejected: huge complexity; outruns the team.
- *Offline write queue only* — rejected: still requires reconciliation.

**Why this won:** Explicit scope decision.

**Consequences:** The product assumes connectivity and must degrade with clear messaging. **Retry-safety is
still in scope** — that is good online behaviour, not offline mode.

---

## D-018 — Idempotent order submission

**Decision:** A repeated submission of the same attempt must not create a second order.

**Reason:** Slow networks cause double taps. A duplicate order is a direct cost to the restaurant.

**Alternatives considered:**
- *Server-side time-window deduplication* — rejected: would also drop legitimate repeat orders.
- *Client-side debounce only* — rejected: insufficient; retries and races still duplicate.

**Why this won:** Client-generated idempotency keys are standard, precise, and correct.

**Consequences:** An idempotency record is part of the schema and must commit atomically with the order.

---

## D-019 — Prices and product data are snapshotted on orders

**Decision:** Order line items store the product name, unit price, and options as they were at submission.
Menu changes never alter historical orders.

**Reason:** The example in the brief: an item ordered at 100,000 must stay 100,000 when the price becomes
120,000. Revenue history must be truthful.

**Alternatives considered:**
- *Live joins to current product prices* — rejected: corrupts history and reports.
- *Full historical versioning of products* — rejected: unnecessary; snapshots suffice.

**Why this won:** Snapshots are the minimal correct solution.

**Consequences:** This is the most likely data-integrity bug in the product. It is called out as an
explicit anti-pattern in [`../domain/order-system.md`](../domain/order-system.md) §5.5 and must be
reviewed at every order-read site.

---

## D-020 — Archive rather than hard-delete products

**Decision:** Products become unavailable or archived; they are not hard-deleted once ordered.

**Reason:** Deletion would compromise historical order data and reports.

**Alternatives considered:**
- *Hard delete with cascade* — rejected: destroys history.

**Why this won:** Preserves the record.

**Consequences:** `archived_at` fields; order line items keep snapshots so even archived products display
correctly.

---

## D-021 — Extensible product model (variants/modifiers reserved)

**Decision:** The product model must not be permanently `name/price/description/image`. Room must exist
for variants, modifiers, add-ons, and choices.

**Reason:** Explicit in the brief. Modifiers are table stakes in restaurant ordering; retrofitting them
later risks data loss.

**Alternatives considered:**
- *Ship only simple products* — rejected: as a permanent model.
- *Build the full modifier engine in the MVP* — rejected: complexity without current need.

**Why this won:** Extensible shape, minimal feature set.

**Consequences:** The option-modelling approach is an **open question** that blocks the schema.

---

## D-022 — Tenant-defined tables with a state machine

**Decision:** Each restaurant defines its own tables with explicit states.

**Reason:** Tables anchor orders, approvals, and bills.

**Alternatives considered:**
- *Implicit "the current table" with no entities* — rejected: no way to manage occupancy or QR codes.

**Why this won:** Required by the QR design (D-004).

**Consequences:** A table state machine is needed. **Abandoned-session policy is an open question**, and
there is a known tension with future table merge (see contradictions §3).

---

## D-023 — Structural bill calculation; payment at the cashier

**Decision:** Bills are computed as `Subtotal + Add-ons − Discounts + Other charges = Grand Total`. Payment
is taken physically at the cashier; the system records settlement. No online payment.

**Reason:** Explicit in the brief. Hard-coding a single total would prevent discounts and taxes later.

**Alternatives considered:**
- *Online payment gateway* — rejected: out of scope, and Iranian payment rails add significant scope.
- *A single `total` column with no structure* — rejected: forecloses the obvious future needs.

**Why this won:** The structure costs little now and prevents a rewrite later.

**Consequences:** Typed charge lines and discount records. **Iranian tax treatment is an open question,
deferred for legal research.**

---

## D-024 — Audit logging as a system requirement

**Decision:** Security- and money-relevant actions are audited: order cancellation, status changes, price
changes, product disabling, permission changes, session closure, discount application.

**Reason:** Explicit in the brief. Cash and food leave the building; actions must be attributable.

**Alternatives considered:**
- *Logging only errors* — rejected: doesn't answer "who did this".

**Why this won:** Accountability is non-negotiable for a business product.

**Consequences:** An append-only audit entity. **Retention periods are an open question** with legal
implications.

---

## D-025 — Tenant subscription lifecycle states

**Decision:** Tenants have a lifecycle: `TRIAL`, `ACTIVE`, `GRACE_PERIOD`, `SUSPENDED`, `CANCELLED`.

**Reason:** Restaurants are paying subscribers; the platform must know standing.

**Alternatives considered:**
- *A simple active/inactive flag* — rejected: insufficient for payment failure handling.

**Why this won:** Covers the real-world payment lifecycle.

**Consequences:** **All business rules are undecided**, especially what a suspended tenant's customers see
(open questions §business). No pricing has been invented.

---

## D-026 — Multi-branch must remain possible; MVP needs no multi-branch UI

**Decision:** The data model must not make future expansion unnecessarily difficult. The MVP does not
need a sophisticated multi-branch UI.

**Reason:** Explicit in the brief. Chains exist and are a natural growth segment.

**Alternatives considered:**
- *Full multi-branch support in the MVP* — rejected: premature complexity.
- *Ignore it entirely* — rejected: risks a costly redesign.

**Why this won:** Extensible shape, minimal feature set.

**Consequences:** **A branch dimension is a schema-blocking open question** — the tenant/brand boundary is
unresolved (contradictions §4).

---

## D-027 — Preserve structured data for future analytics; build nothing now

**Decision:** The system must preserve enough clean structured data for future reporting. No analytics
system in the MVP.

**Reason:** Explicit in the brief. Founders expect daily sales, best sellers, peak hours, revenue trends,
product views vs. orders, and branch comparisons.

**Alternatives considered:**
- *Build dashboards now* — rejected: not requested; premature.
- *Ignore it* — rejected: data lost at capture time cannot be recovered.

**Why this won:** Capture now, build later.

**Consequences:** Snapshots (D-019) and per-milestone timestamps must be stored even though nothing reads
them yet. Product-view tracking is an **open question**.

---

## D-028 — Customer UI is Persian, RTL, mobile-first

**Decision:** The customer interface is Persian, RTL, and designed mobile-first.

**Reason:** Explicit in the brief. Iranian users read Persian; a translated English layout reads as
foreign and undermines the premium perception.

**Alternatives considered:**
- *English UI with an i18n layer* — rejected: Persian-first is the product.
- *Bilingual toggle* — rejected: adds complexity for no current need.

**Why this won:** The customers are Persian speakers.

**Consequences:** RTL must be structural, not mirrored. Persian numerals in prices. A high-quality Persian
webfont is a **blocking prerequisite** for the demo.

---

## D-029 — Premium visual quality is a requirement, not polish

**Decision:** The customer-facing menu must not look like a generic admin template, a boring QR menu, a
basic CRUD app, an AI-generated landing page, or a copied template. Visual quality is a core product
requirement.

**Reason:** Explicit in the brief, repeatedly. The menu demo is the sales asset.

**Alternatives considered:**
- *Ship a functional menu and restyle later* — rejected: the demo's entire purpose is the visual pitch.

**Why this won:** This is the product's differentiator against commodity QR menus.

**Consequences:** Design effort is scheduled **before** backend work. Placeholder imagery is not acceptable
in the demo.

---

## D-030 — Customer menu demo is the first implementation deliverable

**Decision:** The first implementation work is the customer-facing menu demo — before the admin
dashboard, backend, authentication, or database. Work proceeds to the broader application only after
explicit approval of the demo.

**Reason:** Explicit in the brief. It is the fastest way to validate the product's core value and the most
expensive thing to get wrong.

**Alternatives considered:**
- *Backend first, UI after* — rejected: delays the highest-risk assumption (the visual pitch).
- *Admin dashboard first* — rejected: the customer never sees it; it doesn't validate value.

**Why this won:** Fastest validation of the highest-risk assumption.

**Consequences:** The demo runs on local fixture data. The tech stack choice is a prerequisite and is
**still open**.

---

## D-031 — Documentation is part of the product

**Decision:** The `Docs/` tree is the long-term source of truth. Documentation must stay synchronized with
the project's actual decisions.

**Reason:** Explicit in the brief. Future agents and developers must be able to reconstruct full context.

**Alternatives considered:**
- *Wiki or issue tracker* — rejected: not versioned with the code; not portable.

**Why this won:** It lives with the repository and travels with it.

**Consequences:** Every decision gets a log entry; docs change in the same commit as the decision.

---

## D-032 — Do not over-engineer the MVP

**Decision:** Simple MVP + clean architecture + clear documentation + expandable foundation.

**Reason:** Explicit in the brief. Premature abstraction is the main way products like this die.

**Alternatives considered:**
- *Build the full restaurant OS now* — rejected: unfinishable.

**Why this won:** Balance.

**Consequences:** Every abstraction must name the current requirement that needs it. Future features are
recorded in [`future-features.md`](future-features.md), not built.

---

## D-033 — Privacy-conscious data collection

**Decision:** Collect only what is needed; no forced registration; no unnecessary tracking.

**Reason:** Explicit in the brief. Over-collection creates legal exposure and no value.

**Alternatives considered:**
- *Collect phone for "future features"* — rejected: speculative collection.

**Why this won:** Minimal, defensible collection.

**Consequences:** Every field must be justifiable by a flow. Data residency and retention are **open
questions**.

---

## D-034 — Custom domains deferred but architecturally accommodated

**Decision:** Custom domains are a future premium feature. Tenant resolution must nonetheless be
**host-capable** so the feature can be added without reworking routing.

**Reason:** Explicit in the brief: not MVP, but the architecture should permit it.

**Alternatives considered:**
- *Slug-only resolution* — rejected: retrofitting host-based resolution means reworking every route.
- *Custom domains now* — rejected: TLS provisioning, host validation, and cookie scoping are
  substantial scope.

**Why this won:** The architectural accommodation is cheap; the feature is not needed yet.

**Consequences:** Implement tenant resolution as a single function of (host, path) from day one.

---

## D-035 — Real-time capability required; transport undecided

**Decision:** Customers and staff must see status updates without manual refreshing. The transport is
explicitly undecided.

**Reason:** Explicit in the brief: the capability is required, the technology is a later decision.

**Alternatives considered:**
- *Fixing WebSocket now* — rejected: premature; hosting and data residency constrain the choice.

**Why this won:** The domain model should not depend on the transport.

**Consequences:** Build the event publish/subscribe abstraction first; keep the transport reversible. UI
must work against a polling fallback.

---

## D-036 — English internals, Persian product surface

**Decision:** UI copy and design are Persian. Code identifiers, schema, API fields, and internal
documentation are English.

**Reason:** Persian users must have a Persian-native product; but Persian identifiers in code make the
system unmaintainable by any international engineer.

**Alternatives considered:**
- *Persian identifiers throughout* — rejected: tooling and maintenance costs.
- *English UI with translation* — rejected: contradicts D-028.

**Why this won:** Both audiences are served.

**Consequences:** i18n-aware UI layer with English-stable internal contracts.

---

## D-037 — Recommend a bill-allocation model for future split bills

**Decision (`PROPOSED` — awaiting approval):** Model bills with an explicit allocation table linking bills
to order line items, rather than a `bill.total` column.

**Reason:** Split bills are a stated future requirement. Retrofitting them onto a total-only model
requires reworking order and bill relationships plus migrating historical bills.

**Alternatives considered:**
- *Bill with a computed total only* — rejected: makes the stated future requirement a redesign.
- *Split bill in the MVP* — rejected: scope.

**Why this won:** Low cost now, saves a redesign later.

**Consequences:** If approved, allocate today. **Open question:** is split bill actually MVP? If yes, this
becomes `DECIDED` and must be built.

---

## D-038 — Persian README as the documentation entry point

**Decision:** Maintain a full Persian entry point at `Docs/README.fa.md` alongside the canonical English
`Docs/README.md`. The English tree stays canonical; the Persian file mirrors the index, product summary,
folder map, glossary, and review checklist.

**Reason:** Founder instruction. The team is Persian-speaking, and requiring every member to read English
docs before starting is a real adoption barrier. D-036 already established that the *product* is Persian;
this extends the same logic to the project's front door.

**Alternatives considered:**
- *Translate the entire `Docs/` tree* — rejected: doubles the maintenance surface, and translation drift
  means a future agent may read a stale Persian page as authoritative.
- *Persian README as the only entry point* — rejected: non-Persian engineers and agents would be blocked.
- *No Persian docs* — rejected by founder instruction.

**Why this won:** One extra file buys full access for Persian-speaking team members while keeping a single
canonical source of truth.

**Consequences:**

1. `README.fa.md` is an **index**, not a fork. It must never become a place where decisions are made.
2. Any change to `Docs/README.md` must be mirrored in `README.fa.md` in the same change.
3. Section numbering is anchored to the English file's structure, so drift is easy to detect.
4. Status labels (`DECIDED`, `PROPOSED`, `FUTURE`, `OPEN QUESTION`, `DO NOT ASSUME`) stay **in English**
   across all docs, including Persian ones, so they remain greppable and unambiguous.
5. Path names, file names, code identifiers, and URLs stay Latin (consistent with D-036).

**Reversal cost:** low, but the file must be deleted in the same commit as the cross-references, or the
docs will point at a missing entry point.

---

## D-039 — Bilingual READMEs must mirror section-for-section

**Decision:** `README.md` (English) is canonical. `README.fa.md` must contain the same sections in the
same order. Either file may carry extra value, but a change to one that is not mirrored in the other is
incomplete. Both files must list each other as entry points.

**Reason:** D-038 created the Persian entry point and required it to be kept in sync, but never defined
what "in sync" means. An audit found seven sections present only in `README.fa.md` (product summary,
glossary, implementation status, top-five blocking questions, review rules, forbidden terms, useful
links) while the English file — the one the rules designate canonical — omitted them. A Persian-reading
member and an English-reading member were therefore learning different things about project status,
including whether implementation had been authorised.

**Alternatives considered:**
- *Index-only mirror (the state D-038 actually produced)* — rejected: the divergence is precisely what
  let the files drift.
- *Drop the Persian file* — rejected: violates D-038 and removes its stated benefit.
- *Translate the entire tree* — rejected: doubles the maintenance surface and creates stale-copy risk.

**Why this won:** Mirroring at the index level is cheap and makes drift *detectable* — an auditor can
compare section lists in seconds. The English file was brought up to parity rather than trimming the
Persian one, because the missing content was substantive (implementation status, the blocking
questions), not decoration.

**Consequences:**
1. A new section in either README must be added to the other in the same change.
2. A section-count comparison is now a valid drift check.
3. `changelog.md` records README changes under D-039.

---

## Unresolved — no decision made

These are recorded here so that nobody later mistakes them for decisions:

| # | Topic | Status |
|---|---|---|
| U-01 | Technology stack | `OPEN QUESTION` |
| U-02 | Staff authentication method | `OPEN QUESTION` |
| U-03 | Approved-session expiry policy | `OPEN QUESTION` |
| U-04 | Currency unit (Toman vs. Rial) | `OPEN QUESTION` |
| U-05 | Subscription pricing, plans, payment rails | `OPEN QUESTION` |
| U-06 | Suspended-tenant customer-facing behaviour | `OPEN QUESTION` |
| U-07 | Tenant vs. brand / branch data model | `OPEN QUESTION` |
| U-08 | Menu draft/publish model | `OPEN QUESTION` |
| U-09 | Order cancellation/rejection states | `OPEN QUESTION` |
| U-10 | Printing implementation | `OPEN QUESTION` (founder-owned) |
| U-11 | Real-time transport | `OPEN QUESTION` |
| U-12 | Exact role permission matrix | `OPEN QUESTION` |
| U-13 | Session token transport | `OPEN QUESTION` |
| U-14 | Iranian tax requirements | `OPEN QUESTION` (legal research deferred) |

See [`open-questions.md`](open-questions.md) for the full register.