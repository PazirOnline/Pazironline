# Menu System

Categories, products, images, prices, availability, and the rules that keep historical orders intact.

Related: [`../flows/customer-flow.md`](../flows/customer-flow.md) ·
[`../flows/staff-flow.md`](../flows/staff-flow.md) §10 ·
[`../platform/multi-tenancy.md`](../platform/multi-tenancy.md) ·
[`../technical/data-model.md`](../technical/data-model.md)

---

## 1. What it is

The tenant's menu content: categories, products, their attributes, prices, imagery, and current
availability — plus the rules governing how that content changes over time.

**Who uses it:** the customer (browses), staff Owner/Manager (edits).

---

## 2. Why it exists

- It is the product's hook: the thing a restaurant owner evaluates.
- It gives the customer everything they need to decide.
- Prices and availability are the data the *business* depends on — and the data that must never
  corrupt history.

---

## 3. Structure

`DECIDED`

```
Menu
├── Categories
│   └── Products
│       ├── name
│       ├── description
│       ├── price
│       ├── image(s)
│       ├── availability
│       └── options / variants  (reserved, P8)
```

### 3.1 Categories

| Attribute | Status |
|---|---|
| Name | `DECIDED` |
| Display order | `DECIDED` |
| Icon/image | `PROPOSED` |
| Active/visible | `DECIDED` (reserved) |
| Availability window (time-based) | `OPEN QUESTION` — breakfast-only items |
| Per-branch visibility | `FUTURE` |

**Category order matters** — the sequence is the restaurant's intended presentation.

### 3.2 Products

| Attribute | Status | Notes |
|---|---|---|
| Name | `DECIDED` | Persian; Latin names allowed |
| Description | `DECIDED` | Optional |
| Price | `DECIDED` | Integer amount |
| Image | `DECIDED` | Multiple images `PROPOSED` |
| Availability (boolean) | `DECIDED` | «موجود» / «ناموجود» |
| Category membership | `DECIDED` | |
| Display order within category | `DECIDED` | |
| Sort priority | `DECIDED` (reserved) | e.g. featured items |
| Archived flag | `DECIDED` | See §6 |
| Options/variants | `FUTURE` (structure reserved) | P8 |
| Cost price (for margin reports) | `OPEN QUESTION` | Useful for analytics; privacy-sensitive |
| Tax/service-charge applicability | `OPEN QUESTION` | Iranian tax treatment |
| Allergen/dietary info | `OPEN QUESTION` | Compliance angle |

**Critical constraint (P8):** the product model must **not** be permanently limited to
`name/price/description/image`. It must have room for variants, modifiers, and add-ons without a
destructive redesign.

---

## 4. Customer browsing behaviour

`DECIDED` (see [`../product/ux-principles.md`](../product/ux-principles.md))

- Product card shows image, name, price, availability — minimum.
- Detail view one tap away: larger image, description, options, quantity, add-to-cart.
- Categories reachable in one gesture (sticky bar).
- Unavailable products visibly «ناموجود» and non-orderable.

**`OPEN QUESTION`:** search and filtering. Whether the MVP needs it depends on menu size — Iranian
café menus can be 80–150 items. Recorded in `governance/open-questions.md#ux`.

---

## 5. Availability

`DECIDED`

Availability is a **flag**, not a deletion.

| Aspect | Rule |
|---|---|
| Sold out | Restaurant sets unavailable → customer sees «نامواست» |
| Customer action | Cannot add to cart, cannot submit |
| Effect on historical orders | **None** — snapshots are unaffected (P7) |
| Staff effect | Item stays in lists, marked unavailable, so the menu structure remains stable |

**`OPEN QUESTION`:** whether availability can also be driven by inventory or by time (e.g. breakfast
only). Both are `FUTURE`.

---

## 6. Archiving vs. deletion

`DECIDED` — **avoid destructive product deletion if it would compromise historical order data.**

| Operation | Allowed? | Rationale |
|---|---|---|
| Mark unavailable | Yes | Reversible, preserves structure |
| Archive (soft delete) | Yes | Hidden from customers, retained for history |
| Hard delete | **Discouraged** — `DECIDED` | Breaks order history, snapshots, reports |

**Rule:** once a product appears in any order, it must not be hard-deleted. Order line items already
carry snapshots, so history survives either way — but hard deletion destroys the tenant's menu
structure and any analytics that joins back to the product.

**Reserved fields for archiving:** `archived_at`, `archived_by`, `archive_reason` (`PROPOSED`).

---

## 7. Editing and publishing

### 7.1 What is decided

`DECIDED`

- Owner/Manager can edit menu content.
- Changes affect future orders only.
- Historical orders never change (P7).

### 7.2 What is NOT decided

`OPEN QUESTION` — **draft/publish model.**

| Option | Pros | Cons |
|---|---|---|
| Immediate live edits | Simple; restaurant changes a price and it's instant | Half-finished edits visible to customers mid-service |
| Draft → publish | Safe; restaurant can prepare changes | More UI; risk of forgetting to publish |

This is a **significant product decision** affecting the data model (draft copies? versioning? flag per
entity?) and staff UX. A restaurant editing a category's five products at 20:00 during service does not
want customers seeing a half-empty menu.

Recorded in [`../governance/open-questions.md`](../governance/open-questions.md#product) — **blocking for
the data model**.

---

## 8. Images

`DECIDED` (requirements) · `OPEN QUESTION` (implementation)

| Requirement | Why |
|---|---|
| Optimised, correctly sized | C2 performance |
| Lazy-loaded | C2 |
| Consistent aspect ratios | No layout shift |
| Progressive placeholder | Perceived performance |
| Graceful fallback when missing | Never a broken image |

**`OPEN QUESTION`:** storage, CDN, upload mechanism (staff upload vs. URL), and formats.
Also: who provides demo imagery and under what licence — see `governance/open-questions.md#legal-compliance`.

---

## 9. Pricing and history

`DECIDED` — **the single most important data rule.**

```
Product price today:      120,000
Ordered when price was:   100,000
→ the old order must remain 100,000, forever
```

### 9.1 Rules

1. A price change updates the **product's current price** only.
2. Submitted orders store the price as a **snapshot**.
3. No process may retroactively rewrite order line items.
4. "Current price" and "price at order time" are different concepts and must not be conflated.

### 9.2 Does the product need a price history table?

`OPEN QUESTION` — not required by any current rule (snapshots make it unnecessary for correctness), but
useful for analytics ("price changed from 100k to 120k on 3 Mar"). Recorded in
`governance/open-questions.md#architecture`.

### 9.3 Price display for the customer

`DECIDED`

- Price always visible without an extra tap (C8).
- Persian digits.
- Never displayed as if orderable when the product is unavailable (C8).

---

## 10. Business rules

| # | Rule | Status |
|---|---|---|
| MS1 | Menu content is tenant-scoped; never visible across tenants | `DECIDED` |
| MS2 | Categories have an explicit display order | `DECIDED` |
| MS3 | Products belong to a category | `DECIDED` |
| MS4 | Price is an integer | `DECIDED` |
| MS5 | Product changes never alter historical orders | `DECIDED` |
| MS6 | Unavailable products stay in the menu, marked | `DECIDED` |
| MS7 | Products in an order must not be hard-deleted | `DECIDED` |
| MS8 | Only Owner/Manager edit the menu | `DECIDED` |
| MS9 | Customer cannot see draft/unpublished content | `DECIDED` (assuming a publish model exists) |
| MS10 | Product model must remain extensible to options/variants | `DECIDED` |
| MS11 | Categories can be reordered without breaking orders | `DECIDED` |

---

## 11. Edge cases

| Edge case | Handling | Status |
|---|---|---|
| Category deleted while it has products | Require reassignment or block | `PROPOSED` |
| Category deleted while it has historical orders | Archive, don't delete | `DECIDED` |
| Product moved to another category | Historical orders unaffected (snapshot) | `DECIDED` |
| Last product in a category removed | Empty category hidden from customers | `PROPOSED` |
| Price set to zero or negative | Validation must reject | `PROPOSED` |
| Product renamed | New name for new orders; old orders keep the old snapshot | `DECIDED` |
| Two products with the same name in one category | Allowed? `OPEN QUESTION` | `OPEN QUESTION` |
| Category order changed mid-service | Only affects display, not orders | `DECIDED` |
| Product already in a customer's cart when it becomes unavailable | Block at submit, name the item | `DECIDED` |
| Image upload fails | Retry without losing the rest of the product | `PROPOSED` |
| Menu is huge (500 items) | Pagination/virtualisation on the staff side | `PROPOSED` |
| Very long Persian product name | UI must not break layout | `PROPOSED` |
| Category needs a temporary section (" specials") | `OPEN QUESTION` | `OPEN QUESTION` |

---

## 12. Security considerations

| Concern | Mitigation | Status |
|---|---|---|
| Tenant A seeing/editing Tenant B's menu | Tenant-scoped queries and authorization (P2) | `DECIDED` |
| Customer modifying prices via the API | Server resolves all prices; client values ignored | `DECIDED` |
| Non-manager editing the menu | Server-side role check on every write | `DECIDED` |
| XSS via product name/description | Output encoding; sanitise rich text if supported | `PROPOSED` |
| Malicious image upload | Validate type/size; serve from a controlled origin | `PROPOSED` |
| Mass assignment (setting archived/tenant fields) | Strict field allowlists server-side | `DECIDED` |
| Menu scraping | Rate limiting; menu content is public information | `DECIDED` |
| Cost-price exposure | Never serve cost price to customers | `DECIDED` (conditional on it existing) |

---

## 13. Data implications

| Entity | Key fields |
|---|---|
| **Category** | id, tenant_id, name, display_order, is_active, archived_at |
| **Product** | id, tenant_id, category_id, name, description, current_price, availability, display_order, archived_at, archived_by |
| **Product image** | id, product_id, url/size_key, display_order |
| *(Reserved)* | option groups, options, variants, price history — `FUTURE` |

**Indexes that matter:** `(tenant_id, category_id, display_order)` for the customer read path;
`tenant_id` on every menu table for isolation.

**Read-path rule:** the customer menu query must filter to active, non-archived, available products
only — and be scoped by tenant at the query level, not in application code after the fetch.

---

## 14. Current decision summary

`DECIDED`

Categories with order; products with name/description/price/image/availability; integer prices;
availability is a flag not a deletion; archiving over deletion; price changes never alter history; the
model stays extensible to options/variants; only Owner/Manager edit; customer UI shows price and
availability unambiguously.

**Not decided:** draft/publish model, search, time-based availability, cost price, tax applicability,
image pipeline, price history table.

---

## 15. Future considerations

| Feature | Constraint it places on today's model |
|---|---|
| Modifiers/variants | Options must be child entities, not a JSON blob, if they need pricing/reporting — `OPEN QUESTION` |
| Size-based pricing | Product needs a variant dimension, not a single price |
| Inventory | Availability must eventually derive from stock; keep availability a separate concept from stock |
| Multi-branch menus | Menu entities must be branch-scoped or branch-overridable |
| Featured/sponsored products | Needs a sort-priority concept |
| Scheduled availability | Needs a time-window field |
| Product tags / dietary info | Needs a tag entity |
| Cost/profit analytics | Needs cost price, with strict exposure rules |
| Bulk import | Needs stable external identifiers and idempotent upsert |
| Multiple languages | Needs a translations structure — `FUTURE` |

---

## 16. Open questions

| # | Question | Blocking? |
|---|---|---|
| Q1 | Draft/publish or immediate live edits? | **Yes — data model + staff UX** |
| Q2 | Are options modelled as relational entities or JSON on the product? | **Yes — data model** |
| Q3 | Search/filter in MVP? | No |
| Q4 | Cost price stored? | No |
| Q5 | Time-based availability needed? | No |
| Q6 | Price history table needed? | No |
| Q7 | Duplicate product names allowed? | No |
| Q8 | Image upload mechanism and storage | No |
| Q9 | Tax/service-charge applicability per product | No (but blocking for billing correctness later) |

Full register: [`../governance/open-questions.md`](../governance/open-questions.md).