# Multi-Tenancy

One platform, many restaurants, hard isolation.

Related: [`security.md`](security.md) · [`../technical/architecture.md`](../technical/architecture.md) ·
[`../technical/qr-system.md`](../technical/qr-system.md)

---

## 1. What it is

The model by which one central platform serves many isolated restaurants, each with its own menu,
tables, orders, staff, sessions, settings, reports, and subscription.

**Who uses it:** every tenant, and the platform itself.

---

## 2. Why it exists

`DECIDED`

- We do **not** buy separate hosting and domains per restaurant.
- One platform, many tenants → improvement ships to everyone at once, and it monetises as a
  subscription.
- **Tenant data must never leak between restaurants.**

---

## 3. Tenant model

### 3.1 Concept

```
Platform
├── Restaurant A   (tenant)
│   ├── Menu: categories, products
│   ├── Tables + QR tokens
│   ├── Staff + roles
│   ├── Table sessions, customer sessions, orders
│   ├── Settings
│   └── Subscription
├── Restaurant B   (tenant)
└── Restaurant N   (tenant)
```

`DECIDED` — each restaurant is an isolated tenant.

### 3.2 What is tenant-scoped

`DECIDED` — **Restaurant A may access only**:

- Its own menu
- Its own tables
- Its own orders
- Its own staff
- Its own settings
- Its own customers/sessions
- Its own reports
- Its own subscription

### 3.3 What is global

`PROPOSED`

- Platform operator/admin identities
- Plan definitions
- System configuration
- Tenant-level lifecycle/subscription state

---

## 4. Isolation — the hard requirement

`DECIDED` (principle P2)

> The backend must enforce tenant isolation. **Do not rely only on frontend restrictions.**

### 4.1 Rules

| # | Rule |
|---|---|
| TI1 | Every tenant-owned row carries a tenant reference |
| TI2 | Every query touching tenant data is scoped by tenant |
| TI3 | The tenant is derived from the **authenticated context or the server-resolved tenant**, never from arbitrary client input |
| TI4 | Authorization is enforced server-side on every request |
| TI5 | Hidden UI is a UX affordance, never a control |
| TI6 | Unique constraints are scoped per tenant, not globally |
| TI7 | Logs, metrics, and errors must not leak another tenant's data |
| TI8 | Background jobs and async processing must carry tenant context |
| TI9 | Object storage keys are tenant-namespaced |
| TI10 | Cache keys include tenant identity |

### 4.2 Where enforcement belongs

`PROPOSED` — layered defence:

| Layer | Control |
|---|---|
| Routing | Tenant resolved from the slug/host by the server |
| Authentication | Staff session carries tenant identity |
| Authorization | Every query requires a tenant scope |
| Persistence | Row-level scoping (DB constraints or enforced filters) |
| Application | Repository layer requires a tenant context — no unscoped query methods |
| UI | Hide what the role can't do (convenience only) |

**The critical design choice:** make it *structurally difficult* to write an unscoped query. A repository
layer where `getOrders()` without a tenant context does not exist is better than remembering to filter.

---

## 5. URL and domain strategy

### 5.1 Default strategy

`DECIDED`

```
ourdomain.ir/r/{restaurant-slug}
```

Example: `ourdomain.ir/r/cafe-novin`

### 5.2 Table URLs

`DECIDED`

```
ourdomain.ir/r/{slug}/t/{tableToken}
```

Example: `ourdomain.ir/r/cafe-novin/t/8FJ29KX72Q`

### 5.3 Why the `/r/` prefix

`PROPOSED`

- Namespaces the tenant space, leaving the root for marketing pages.
- Makes the URL self-explanatory.
- Leaves room for future non-tenant paths.

### 5.4 Custom domains

`FUTURE`

Premium customers may get `menu.cafenovin.ir`.

**Not part of the MVP** (`DECIDED`), but the architecture must permit it.

### 5.5 The resolution requirement

`DECIDED` (as an architectural constraint)

> Tenant resolution must be **domain/host based, not path-only**.

Reason: with a custom domain, there is no `/r/{slug}` in the URL. The host identifies the tenant.

```
Resolve tenant:
   1. If the Host matches a configured custom domain  → that tenant   [FUTURE]
   2. If the Host is the platform domain and the path has /r/{slug}  → tenant by slug
   3. Otherwise                                                       → 404
```

**Practical implication:** implement the resolver as a single function that takes a host and a path.
Even in the MVP, keep custom-domain lookup present (or trivially stubbed) so the resolution shape is
already correct. Retrofitting host-based resolution later means reworking every route.

### 5.6 Slug rules

`PROPOSED`

| Rule | Notes |
|---|---|
| Lowercase Latin letters, digits, hyphens | URL-safe |
| Unique across the platform | Unless/until custom domains + subdomains exist |
| Reserved words blocked | `r`, `admin`, `api`, `app`, `www`, etc. |
| Immutable? | If a slug changes, printed QR codes break. **Recommended: immutable after first use**, with a redirect |
| Persian slugs | `OPEN QUESTION` — URLs should stay Latin; a Persian display name is separate |

**Important:** printed QR codes bake in the slug. A slug change invalidates every printed card in the
restaurant. This is a strong argument for immutability.

---

## 6. Tenant onboarding

`PROPOSED`

```
1. Create tenant + slug
2. Subscription starts (TRIAL or ACTIVE)
3. Owner account created
4. Menu populated (self-serve, by us, or an agency — OPEN QUESTION)
5. Tables and QR codes created
6. QR print artifacts generated
7. Go live
```

**`OPEN QUESTION` — onboarding friction is a commercial risk.** An empty menu is a bad demo. See
[`../product/business-model.md`](../product/business-model.md) §6.

---

## 7. Subscription gating

`DECIDED` (states) · `PROPOSED` (mechanism)

A tenant's subscription state should gate capability at the platform boundary:

```
Request → resolve tenant → check subscription state → allow / restrict
```

Not scattered through business logic.

**`OPEN QUESTION`:** what a suspended tenant's customer-facing menu shows. See
[`subscriptions.md`](subscriptions.md) §5 and
[`../governance/open-questions.md`](../governance/open-questions.md#business).

---

## 8. Multi-branch

`FUTURE`

```
Brand
├── Branch 1
├── Branch 2
└── Branch 3
```

Each branch may have its own tables, staff, orders, menu availability, printers/stations, and settings.

**The MVP does not need a multi-branch UI** (`DECIDED`), but the data model must not make future
expansion unnecessarily difficult (P13).

### 8.1 The unresolved question

`OPEN QUESTION` — **is a tenant a restaurant or a brand?**

| Model | Implication |
|---|---|
| Tenant = restaurant location | Simple now; a brand with 5 branches = 5 tenants, 5 subscriptions, 5 logins |
| Tenant = brand; branches are sub-entities | Correct long-term; more complex now; billing/reporting gets hierarchy |

**Recommendation (`PROPOSED`):** design the data model with a **location/branch dimension that defaults
to a single implicit branch per tenant**. This keeps MVP simplicity while leaving room. But the decision
must be explicit before the schema is frozen — this is a **blocking architecture question**.

### 8.2 Menu in a multi-branch world

`OPEN QUESTION`

- One shared menu with per-branch availability?
- Per-branch menus?
- Per-branch price overrides?

The brief says each branch may have its own "menu availability" — implying a shared menu with branch-level
overrides. This needs a decision.

---

## 9. Future custom domains — constraints

`FUTURE` (architecture accommodation `DECIDED`)

| Constraint | Why |
|---|---|
| Tenant resolution by host | A custom domain has no path prefix |
| TLS certificate management per domain | Operational |
| Host header validation | Security — host spoofing |
| Cookie scope | Session cookies must work across the custom domain |
| QR codes | Table QR URL must use whichever domain is canonical for that tenant |
| Redirect from `/r/{slug}` | Keep the short link working after a custom domain is attached |
| URL canonicalisation | Avoid duplicate content for the same menu |

---

## 10. Edge cases

| Edge case | Handling | Status |
|---|---|---|
| Tenant A crafts a URL with Tenant B's slug | Resolves to B's menu — which is *public*; ordering requires B's approval | `DECIDED` |
| Tenant A's staff token used against Tenant B's data | Rejected — tenant from the authenticated session, never the request | `DECIDED` |
| Slug collision | Reserved words + uniqueness check | `PROPOSED` |
| Slug change after QR printing | Immutability recommended; else old QRs must redirect | `PROPOSED` |
| Tenant deleted | Soft delete; data retention `OPEN QUESTION` | `OPEN QUESTION` |
| Suspended tenant's staff logging in | `OPEN QUESTION` | `OPEN QUESTION` |
| Very large tenant (thousands of products) | Pagination everywhere; query performance | `PROPOSED` |
| Cross-tenant report access | Rejected | `DECIDED` |
| Host header spoofing to resolve another tenant | Only relevant with custom domains; validate host | `FUTURE` |

---

## 11. Security considerations

| Concern | Control | Status |
|---|---|---|
| Cross-tenant data access | Server-enforced tenant scoping everywhere | `DECIDED` |
| IDOR via sequential IDs | Sequential IDs never exposed; opaque tokens; authorization still required | `DECIDED` |
| Client-supplied tenant ID | Ignored; tenant comes from the resolved/authenticated context | `DECIDED` |
| Staff role escalation across tenants | Tenant bound at authentication | `DECIDED` |
| Cache leaking one tenant's menu to another | Tenant-scoped cache keys | `DECIDED` |
| Object storage path traversal | Tenant-namespaced keys; no user-controlled raw paths | `DECIDED` |
| Analytics leaking across tenants | Tenant-scoped aggregation | `DECIDED` |
| Bulk enumeration of slugs | Slugs are not secrets; rate limit anyway | `DECIDED` |
| Unscoped background jobs | Tenant context must be explicit in every job payload | `DECIDED` |
| Host header injection (custom domains) | Strict host validation | `FUTURE` |

---

## 12. Data implications

Every tenant-owned table carries `tenant_id`, indexed. Unique constraints that must be **per tenant**:

| Constraint | Scope |
|---|---|
| Table QR token | `(tenant_id, qr_token)` |
| Staff email/phone | `(tenant_id, email)` |
| Order number | `(tenant_id, order_number)` |
| Slug | **Global** unique |

**Design rule:** if a query for tenant-owned data does not mention the tenant, it is a bug.

---

## 13. Current decision summary

`DECIDED`

One central multi-tenant platform. Tenant = restaurant. Strict backend-enforced isolation. URL strategy
`ourdomain.ir/r/{slug}`, with `/r/{slug}/t/{tableToken}` for tables. No per-tenant hosting or domain.
Custom domains are future but tenant resolution must be host-capable. Every tenant-owned entity carries a
tenant reference and every query is scoped.

**Not decided:** tenant = restaurant vs. brand, branch data model, slug mutability, suspended-tenant
behaviour, tenant deletion/retention, onboarding model.

---

## 14. Future considerations

| Feature | Constraint on today's design |
|---|---|
| Custom domains | Host-based tenant resolution |
| Multi-branch | A location dimension that degrades to one |
| Per-branch menus/prices | Menu entities must be branch-overridable |
| Plan tiers / feature gating | A single entitlement check point |
| Tenant migration / export | Tenant-scoped data export must be possible |
| Sub-tenants / franchise | Hierarchy support |
| Regional hosting | Tenant-to-region affinity should not be hard-coded |

---

## 15. Open questions

| # | Question | Blocking? |
|---|---|---|
| Q1 | Tenant = restaurant or brand? Where does the branch dimension live? | **YES — blocks the schema** |
| Q2 | Is a slug immutable after QR printing? | **Yes — affects slug design** |
| Q3 | Per-branch menus or shared with overrides? | Yes (if branches are supported) |
| Q4 | What does a suspended tenant's menu show? | **Yes — customer-facing** |
| Q5 | Tenant deletion and data retention | Yes |
| Q6 | Reserved slugs list | No |
| Q7 | Persian slugs allowed? | No |
| Q8 | Custom-domain redirect behaviour from `/r/{slug}` | No (future) |

Full register: [`../governance/open-questions.md`](../governance/open-questions.md).