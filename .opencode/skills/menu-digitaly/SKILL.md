---
name: menu-digitaly
description: Use when working in the MenuDigitaly project — a Persian/RTL multi-tenant restaurant SaaS (digital menu plus table-based ordering for Iranian cafés) whose source of truth is a Docs/ directory. Load before writing code, changing Docs/, designing UI, or answering questions about the menu demo, order lifecycle, approval gate, tenant isolation, billing, roles, or QR system. Contains the non-negotiable product principles, the current phase (docs-only, no code), and a routing table to the Docs/ files.
license: UNLICENSED
metadata:
  project: MenuDigitaly
  docs-root: Docs/
  docs-language: English
  entry-fa: Docs/README.fa.md
  status: documentation-phase
---

# MenuDigitaly — Project Knowledge

Persian-first, mobile-first, multi-tenant SaaS for cafés and restaurants in Iran.
**`Docs/` is the source of truth. Read before you change anything.**

Persian entry point: [`Docs/README.fa.md`](Docs/README.fa.md) · English: [`Docs/README.md`](Docs/README.md)

> **Path portability:** this skill contains **no absolute paths**. Every reference is relative to the
> project root (`Docs/...`). It works on any machine, in any folder, on Windows/Mac/Linux — as long as
> `Docs/` sits next to `.opencode/`. See §12 to relocate it.

---

## 1. Current phase — READ THIS FIRST

**The repository contains NO application code. Only `Docs/` (41 markdown files).**

- ❌ Do **not** start implementation unless the user explicitly says to.
- ❌ Do **not** create `opencode.json`, scaffolding, `package.json`, or folders outside `Docs/` and
  `.opencode/` without being asked.
- ✅ Documentation work, research, questions, and planning are always in scope.
- The gate to open: founders must answer the blocking open questions **and** explicitly instruct
  implementation.

If asked "can you start building?" → confirm the phase and ask before touching app code.

---

## 2. What the product is

`DECIDED`

Multi-tenant SaaS. One central platform, one domain, many isolated restaurants.

```
A restaurant subscribes
  → receives QR codes (entrance + one per table)
  → a customer inside scans a QR
  → browses the digital menu                ← NO permission needed
  → requests ordering access
  → staff approve the table session         ← the anti-abuse gate, ONCE
  → customer orders repeatedly for the table
  → kitchen/bar prepare → staff deliver
  → customer reviews the bill
  → customer pays at the cashier
  → session closed, data available for reports
```

**The product chain** — every domain doc maps to one link:

> Menu → Table → Customer Session → Approval → Order → Preparation → Delivery → Bill → Payment

**This is not a "QR menu website."** It is the beginning of a restaurant workflow system.
(menu → table → session → approval → order → prep → delivery → bill → payment)

---

## 3. HARD RULES — never violate these

These are `DECIDED` and load-bearing. Violating one is a defect, not a style choice.
Full text with rationale in [`Docs/product/product-principles.md`](Docs/product/product-principles.md).

| # | Rule | Why |
|---|---|---|
| 1 | **Menu browsing needs NO permission.** Ordering requires an approved table session | Two different thresholds |
| 2 | **Approval is the anti-abuse gate.** GPS and restaurant Wi-Fi are **explicitly rejected** as the primary mechanism | A QR photo must not enable ordering from home |
| 3 | **Approve ONCE per table session**, one tap. Never per order | Staff would bypass it otherwise |
| 4 | **No mandatory customer registration.** Name + phone are **optional** | Customer is standing in a café |
| 5 | **Order line items store immutable snapshots** (name, unit price, options, station). Menu edits never alter history | Revenue history must be truthful |
| 6 | **Tenant isolation is enforced in the backend/data layer.** Hiding things in the frontend is NEVER security | Restaurant A must never see B's data |
| 7 | **Order submission is idempotent** | Slow network + double tap ≠ two real orders |
| 8 | **Never expose sequential internal IDs** in URLs or QR codes. Use opaque random tokens | `/r/slug/t/8FJ29KX72Q`, never `/restaurant/42/table/7` |
| 9 | **QR = static identity. Session = dynamic state.** | QR must never need reprinting |
| 10 | **Customer-facing wording ≠ internal status names.** Persian, friendly («در حال آماده‌سازی» not `PREPARING`) | Presentation must not drive logic |
| 11 | **All money is integers.** Never floats. Client-supplied prices/totals are always ignored — server resolves them | Price tampering |
| 12 | **Products are archived, never hard-deleted**, once ordered | Historical orders must not break |
| 13 | **Offline is out of scope.** No local-first DB, no sync queue, no conflict resolution | Explicit scope decision |
| 14 | **Never assume a printer or kitchen monitor exists.** Both optional; must work with neither | Restaurant hardware varies |
| 15 | **The customer UI is Persian and RTL, structurally.** Not an LTR layout with Persian text | Users read Persian |
| 16 | **Every significant action is audited** (actor, action, target, time, reason) | Cash and food leave the building |
| 17 | **Extensible model, minimal features.** Reserve shape; don't build unneeded features | Don't over-engineer the MVP |
| 18 | **Docs are part of the product.** Update them in the same change as any decision | D-031/P15 |

---

## 4. First implementation deliverable

`DECIDED` — when implementation is authorized, build **the customer menu demo FIRST**.

**Explicitly NOT first:** admin dashboard ❌ · authentication ❌ · database ❌ · backend CRUD ❌ ·
subscription management ❌

The demo runs on **local fixture data**, must be **realistically interactive**, and must **not** look like
a generic admin template, boring QR menu, CRUD app, AI-generated landing page, or copied template.
Placeholder imagery fails the bar.

**Hard gate:** work proceeds only after the founders **explicitly approve the demo**. Self-approval is not
approval.

Brief: [`Docs/product/menu-demo-brief.md`](Docs/product/menu-demo-brief.md) ·
Visual direction: [`Docs/product/design-system.md`](Docs/product/design-system.md)

---

## 5. Status labels — mandatory

Every non-trivial statement in `Docs/` carries one. Never remove one.

| Label | Meaning | Your behaviour |
|---|---|---|
| `DECIDED` | Settled by founders | Obey. Changing it needs a new decision-log entry |
| `PROPOSED` | Suggested, not approved | Treat as a hypothesis. Say so |
| `FUTURE` | Out of MVP scope | Must not be blocked by today's design |
| `OPEN QUESTION` | Needs a product/business/tech decision | **Ask the user. Do not guess** |
| `DO NOT ASSUME` | Tempting but undecided | Do not build on it |

---

## 6. Routing table — which file answers which question

| Question | File |
|---|---|
| What is this product? | `Docs/product/product-overview.md` |
| What are the rules? | `Docs/product/product-principles.md` |
| What does this word mean? (Persian ↔ English) | `Docs/product/terminology.md` |
| How is it priced? | `Docs/product/business-model.md` |
| What gets built, in what order? | `Docs/product/roadmap.md` |
| How should it feel? | `Docs/product/ux-principles.md` |
| What should it look like? | `Docs/product/design-system.md` |
| What exactly is the demo? | `Docs/product/menu-demo-brief.md` |
| Show me the whole story | `Docs/flows/user-flows.md` |
| What does the customer do? | `Docs/flows/customer-flow.md` |
| How does ordering work? | `Docs/flows/ordering-flow.md` |
| What do staff do? | `Docs/flows/staff-flow.md` |
| Categories, products, prices, availability | `Docs/domain/menu-system.md` |
| Tables and their states | `Docs/domain/table-management.md` |
| Who is this customer (no account) | `Docs/domain/customer-sessions.md` |
| How does approval work? | `Docs/domain/approval-system.md` |
| Order structure and snapshots | `Docs/domain/order-system.md` |
| Every valid/invalid status change | `Docs/domain/order-state-machine.md` |
| Bills, totals, settlement | `Docs/domain/billing.md` |
| Kitchen, bar, stations, routing | `Docs/domain/kitchen-and-bar.md` |
| Tenants, slugs, isolation | `Docs/platform/multi-tenancy.md` |
| Roles and permissions | `Docs/platform/roles-and-permissions.md` |
| Security requirements | `Docs/platform/security.md` |
| What gets logged | `Docs/platform/audit-log.md` |
| Subscription lifecycle | `Docs/platform/subscriptions.md` |
| Data needed for future reports | `Docs/platform/analytics.md` |
| System shape / stack | `Docs/technical/architecture.md` |
| Entities and schema | `Docs/technical/data-model.md` |
| API surface | `Docs/technical/api-concepts.md` |
| Live status updates | `Docs/technical/realtime.md` |
| QR design | `Docs/technical/qr-system.md` |
| Duplicate-order protection | `Docs/technical/idempotency.md` |
| Printing | `Docs/technical/printing.md` |
| Why no offline | `Docs/technical/offline-and-sync.md` |
| What was decided and why | `Docs/governance/decision-log.md` (38 decisions) |
| What's contradictory / risky | `Docs/governance/contradictions-and-risks.md` |
| What's still undecided | `Docs/governance/open-questions.md` |
| What comes later | `Docs/governance/future-features.md` |
| What changed | `Docs/governance/changelog.md` |

---

## 7. How to work in this repo

### Documentation rules (`DECIDED`)

1. **Never silently reverse a `DECIDED` item.** Record the conflict in
   `Docs/governance/contradictions-and-risks.md`, then ask.
2. **Never invent business decisions.** Label it `OPEN QUESTION` and add it to
   `Docs/governance/open-questions.md`.
3. **Every major decision** gets a `D-0xx` entry in `Docs/governance/decision-log.md` with: decision,
   reason, alternatives considered, why the winner won, consequences.
4. **Every meaningful doc change** gets a dated entry in `Docs/governance/changelog.md`, newest first.
5. **Update the affected docs and the decision log in the same change.** Never one without the other.
6. **Deep-dive docs follow the 12-question template** (what/why/who/how/flow/rules/edges/security/data/
   decision/future/open).
7. **`README.fa.md` must mirror `README.md`** in the same change.
8. Use the terminology in `Docs/product/terminology.md`. Anti-terms are listed there — e.g. never call a
   customer a "user", never call a submitted order a "cart".

### Language rules

- **Docs:** English, with Persian terms where relevant.
- **UI copy, design, product:** Persian, RTL. Non-negotiable.
- **Code identifiers, schema, API fields:** English.
- **Status labels:** English everywhere, even in Persian docs, so they stay greppable.

### When the user changes their mind

1. Add a **new** decision-log entry (e.g. `D-039`) that supersedes the old one. Never edit history.
2. Update every doc that references the old decision.
3. Add a `changelog.md` entry.
4. Note the reversal's consequences.

---

## 8. DO NOT ASSUME — the tempting inferences

| Do not assume | Reality |
|---|---|
| GPS or Wi-Fi verification exists | Explicitly rejected as the security mechanism |
| A printer or kitchen monitor exists | Both optional; must work with neither |
| Prices are in Toman | **Unresolved** (Toman vs. Rial) |
| There's a subscription price or plan tiers | **Unresolved.** Never invent pricing |
| Every diner at a table scans | One device orders for the table |
| Customers see internal status names | Two-layer model; they see friendly Persian |
| Internal IDs appear in URLs | Opaque random tokens only |
| There's a `CANCELLED` status | **Unresolved** — the given lifecycle omits it |
| `PENDING → CONFIRMED` is manual | **Unresolved** |
| Menu edits are draft-then-publish | **Unresolved** |
| A tenant is a branch | **Unresolved** (restaurant vs. brand) |
| Staff auth is password/PIN/OTP | **Unresolved** |
| There's a real-time transport chosen | Capability is decided; SSE/WebSocket/pubsub is open |
| The printing architecture is known | Founder-owned solution, not yet provided |

---

## 9. Blocking open questions — ASK, don't guess

Full register: [`Docs/governance/open-questions.md`](Docs/governance/open-questions.md)

| Priority | Question | Blocks |
|---|---|---|
| 1 | **Technology stack** (language, framework, DB, hosting) | Everything |
| 2 | **Persian typeface** + **demo imagery source/licensing** | The menu demo = first deliverable |
| 3 | **Currency unit: Toman or Rial?** | The entire data model |
| 4 | **Do `CANCELLED` / `REJECTED` states exist?** | The order state machine |
| 5 | **Staff auth method** + **approved-session expiry** | All staff work; the security model |
| 6 | **Menu draft/publish or live edits?** | Schema + staff UX |
| 7 | **Tenant = restaurant or brand (+ branch dimension)?** | Schema |
| 8 | **What happens to a suspended tenant's menu?** | Customer-facing behaviour |
| 9 | **Exact role permission matrix** | RBAC |
| 10 | **Iranian VAT + data residency + retention** | Launch/legal |

If you need one of these to proceed, **stop and ask.** Do not pick a plausible default and build on it.

---

## 10. Review checklist

Before approving any change:

1. Tenant isolation enforced in the **backend**, not the UI?
2. Prices resolved **server-side**; client values ignored?
3. Order line items **snapshotted**; history immutable?
4. Order submission **idempotent**?
5. Customer UI **Persian + RTL**?
6. Is it **allowed without approval**, or does it need approval?
7. Did it assume a **printer or monitor** exists? (should not)
8. Did it add **offline** complexity? (should not)
9. Significant action **audited**?
10. Over-engineering anything not required yet? (rule 17)
11. Docs + decision log + changelog **updated together**?

---

## 11. Three constraints worth defending hardest

If only three things survive future pressure, these — breaking any forces a data migration:

1. **Snapshots on order line items** → all historical pricing and reporting.
2. **Orders attach to a session, not a table** → table transfer, merge, split.
3. **A location/branch dimension** → multi-branch.

Detail: [`Docs/governance/future-features.md`](Docs/governance/future-features.md) §10

---

## 12. Portability & installation

### Moving to another computer

**Nothing to install.** The skill lives inside the repo at `.opencode/skills/menu-digitaly/SKILL.md`.
Copy or clone the whole project folder to the new machine and it just works — opencode discovers
`.opencode/skills/**/SKILL.md` automatically.

Requirements on the new machine:
- opencode installed
- `Docs/` present (the skill references it, but never by absolute path)
- Restart opencode after the copy

### Optional: make it available in every project

If you want this knowledge loaded even outside this repo, copy the folder to your global skills
directory:

| OS | Global skills path |
|---|---|
| Windows | `~/.config/opencode/skills/menu-digitaly/SKILL.md` |
| macOS / Linux | `~/.config/opencode/skills/menu-digitaly/SKILL.md` |

Prefer **project-scoped** (as it is now): a project skill only activates in this repo, so it can't
leak into unrelated work. Use the global copy only if you fork a second MenuDigitaly repo elsewhere.

### Keeping it accurate

The skill is a compressed index, not a source of truth. If it ever disagrees with `Docs/`, **`Docs/`
wins** — then fix the skill in the same change. When `Docs/` gains or drops a file, update the routing
table in §6 and, if warranted, the changelog entry.