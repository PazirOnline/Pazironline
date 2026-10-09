# Terminology

Canonical vocabulary. Use these names consistently in code, database, API, UI copy, and documentation.
If you introduce a new term, add it here with a status label.

Status labels: `DECIDED` · `PROPOSED` · `FUTURE` · `OPEN QUESTION` · `DO NOT ASSUME`

---

## Multi-tenancy

| English | Persian (product term) | Status | Meaning |
|---|---|---|---|
| **Platform** | پلتفرم | `DECIDED` | The single central SaaS system serving all tenants |
| **Tenant** | رستوران / مجموعه | `DECIDED` | One isolated customer of the platform = one restaurant. See note below |
| **Restaurant** | رستوران / کافه | `DECIDED` | The commercial business. The tenant boundary in MVP |
| **Slug** | — | `DECIDED` | URL-safe unique identifier for a tenant, e.g. `cafe-novin` |
| **Custom domain** | دامنه اختصاصی | `FUTURE` | A tenant-specific domain like `menu.cafenovin.ir` |
| **Brand** | برند | `FUTURE` | A business group that may own multiple branches |
| **Branch** | شعبه | `FUTURE` | An individual location of a brand. **Relationship to Tenant is `OPEN QUESTION`** |

> **Ambiguity note — must be resolved (see `governance/open-questions.md#architecture`):**
> Is a `Tenant` a **branch** (one location, one subscription) or a **brand** (many locations, one
> subscription)? MVP assumes one tenant = one restaurant = one location. Multi-branch support must not
> be designed out.

---

## Menu

| English | Persian (product term) | Status | Meaning |
|---|---|---|---|
| **Menu** | منو | `DECIDED` | The tenant's full set of categories and products |
| **Category** | دسته‌بندی | `DECIDED` | A menu grouping (e.g. «نوشیدنی‌ها», «پیتزا») |
| **Product** | محصول / آیتم | `DECIDED` | A sellable item |
| **Item** | آیتم | `DECIDED` | Persian-first term for product in customer-facing copy |
| **Description** | توضیحات | `DECIDED` | Free text on a product |
| **Price** | قیمت | `DECIDED` | Integer amount in the tenant's currency unit. Unit TBD |
| **Availability** | موجود / ناموجود | `DECIDED` | Whether a product can currently be ordered |
| **Sold out** | ناموجود | `DECIDED` | Customer-facing label when unavailable |
| **Archived / soft-deleted** | بایگانی | `DECIDED` | Product removed from menu but history preserved |
| **Modifier** | گزینه / اضافه | `FUTURE` | An option applied to a product (extra shot, no sugar) |
| **Modifier group** | گروه گزینه | `FUTURE` | A set of modifiers (e.g. «choices» with min/max) |
| **Variant** | تنوع | `FUTURE` | A distinct selectable version of a product (size S/M/L) |
| **Add-on** | اضافه | `FUTURE` | A chargeable extra attached to a line item |
| **Sold by weight** | فروش وزنی | `OPEN QUESTION` | Some cafés sell by weight (e.g. by the gram). Not decided |

---

## Tables and sessions

| English | Persian (product term) | Status | Meaning |
|---|---|---|---|
| **Table** | میز | `DECIDED` | A physical table belonging to a tenant |
| **Table code** | کد میز | `DECIDED` | Human-facing table label, e.g. «میز ۸» |
| **Table QR token** | توکن QR میز | `DECIDED` | Opaque random public token in the table's QR URL |
| **Table Session** | نشست میز | `DECIDED` | A time-bounded occupancy of a table. Owns orders and bill |
| **Customer Session** | نشست مشتری | `DECIDED` | The anonymous client identity on a device for the current visit |
| **Ordering access** | دسترسی سفارش | `DECIDED` | Permission state allowing a Table Session to submit orders |
| **Approval** | تأیید | `DECIDED` | Staff action granting ordering access to a Table Session |
| **Pending approval** | در انتظار تأیید | `DECIDED` | Customer-facing state after request, before staff action |
| **Open / active session** | نشست فعال | `DECIDED` | Table Session currently accepting orders |
| **Closed session** | نشست بسته | `DECIDED` | Table Session finished; no further orders |
| **Transfer** | انتقال | `FUTURE` | Move a session (and its orders) to another table |
| **Merge** | ادغام | `FUTURE` | Combine two sessions/tables into one bill |
| **Split** | تفکیک | `FUTURE` | Split one session into multiple bills |

---

## Orders

| English | Persian (product term) | Status | Meaning |
|---|---|---|---|
| **Order** | سفارش | `DECIDED` | A submission of one or more line items for a table |
| **Order number** | شماره سفارش | `DECIDED` | Human-facing per-tenant sequential identifier, e.g. `#1021` |
| **Line item** | ردیف سفارش | `DECIDED` | One product + quantity within an order |
| **Cart** | سبد خرید | `DECIDED` | Client-side draft before submission |
| **Cart preview** | پیش‌نمایش سبد | `DECIDED` | The review step before confirming an order |
| **Order snapshot** | تصویر سفارش | `DECIDED` | Frozen copy of name/price/options at submission time |
| **Station** | ایستگاه | `FUTURE` | Kitchen, Bar, etc. — where an item is prepared |
| **Kitchen Display System (KDS)** | نمایشگر آشپزخانه | `DECIDED` (as optional) | Monitor-based order queue |
| **Ticket** | فیش / تیکت | `DECIDED` (as optional) | Printed order slip |

---

## Order states

Internal statuses are `DECIDED`; customer-facing wording is `PROPOSED`; the mapping is `DECIDED` to keep
separate. Full detail: [`../domain/order-state-machine.md`](../domain/order-state-machine.md).

| Internal status | Customer-facing (proposed) | Status |
|---|---|---|
| `PENDING` | سفارش ثبت شد | `PROPOSED` wording |
| `CONFIRMED` | سفارش تأیید شد | `PROPOSED` wording |
| `PREPARING` | در حال آماده‌سازی | `PROPOSED` wording |
| `READY` | آماده تحویل | `PROPOSED` wording |
| `DELIVERED` | تحویل شد | `PROPOSED` wording |
| `PAID` | پرداخت شد | `PROPOSED` wording |
| `CLOSED` | — (terminal, not surfaced) | `PROPOSED` |
| `CANCELLED` | لغو شد | **`OPEN QUESTION` — see order-state-machine.md** |
| `REJECTED` | سفارش رد شد | **`OPEN QUESTION` — not in the given lifecycle** |

---

## Billing

| English | Persian (product term) | Status | Meaning |
|---|---|---|---|
| **Bill** | صورت‌حساب | `DECIDED` | The payable summary for a Table Session |
| **Subtotal** | جمع partی | `DECIDED` | Sum of line item totals before adjustments |
| **Discount** | تخفیف | `DECIDED` (mechanism) | Reduction applied to the bill or an item |
| **Charge** | هزینه / کارمزد | `DECIDED` (mechanism) | Tax, service charge, or other addition |
| **Grand total** | مبلغ نهایی | `DECIDED` | Amount the customer must pay |
| **Settlement / payment recording** | تسویه | `DECIDED` | Recording that cash/payment was received at the cashier |
| **Split bill** | تفکیک صورت‌حساب | `FUTURE` | Divide one bill into several |
| **Tax / VAT** | مالیات و ارزش افزوده | `OPEN QUESTION` | Iranian tax requirements to be researched separately |

---

## Staff and access

| English | Persian (product term) | Status | Meaning |
|---|---|---|---|
| **Staff member** | کارمند | `DECIDED` | A human with access to a tenant's staff-side application |
| **Role** | نقش | `DECIDED` | Named permission bundle |
| **Owner** | مالک | `DECIDED` | Full tenant access |
| **Manager** | مدیر | `DECIDED` | Operational access |
| **Cashier** | صندوق‌دار | `DECIDED` | Orders, tables, bills, payments |
| **Waiter** | سرویس | `DECIDED` | Approval + order progression + delivery |
| **Kitchen** | آشپزخانه | `DECIDED` | Kitchen station queue |
| **Barista** | باریستا | `DECIDED` | Bar station queue |
| **Station role** | نقش ایستگاه | `FUTURE` | A role bound to one or more stations |
| **Permission** | مجوز | `DECIDED` | The atomic capability |
| **Session (staff)** | نشست کاربری | `DECIDED` | Staff authentication session |

---

## Security

| English | Persian (product term) | Status | Meaning |
|---|---|---|---|
| **Public token** | توکن عمومی | `DECIDED` | Opaque random string safe to expose in URLs/QR |
| **Internal ID** | شناسه داخلی | `DECIDED` | Sequential database primary key; never exposed |
| **Rate limiting** | محدودسازی نرخ | `DECIDED` | Request throttling per client/IP/session |
| **Idempotency key** | کلید یکتایی | `DECIDED` | Client-generated key making a retry safe |
| **Audit log** | گزارش ممیزی | `DECIDED` | Append-only record of important actions |
| **Rate limit / abuse** | سوءاستفاده | `DECIDED` | Fake order attempts from outside the restaurant |

---

## Money units

| Term | Status | Note |
|---|---|---|
| **Currency unit** | `OPEN QUESTION` | Whether the platform stores Toman, Rial, or per-tenant unit is **unresolved** |
| **Minor unit** | `DECIDED` | Integer storage. Never floats |
| **Formatting** | `DECIDED` | Persian digit grouping in UI, e.g. `۱۲۰٬۰۰۰` |

> See [`../governance/open-questions.md`](../governance/open-questions.md#business). This one affects
> the schema, so it should be decided before the data model is frozen.

---

## Documented anti-terms

Use these **wrong words never**:

| Do not use | Use instead |
|---|---|
| "user" for a customer | **customer** / **Customer Session** |
| "account" for customer identity | **Customer Session** (no account) |
| "shop" / "store" | **restaurant** / **café** |
| "guest" | **customer** |
| "cart" for the submitted order | **order** (cart = pre-submission draft only) |
| "guest login" | **approval** |
| "discount code" | **discount** (mechanism undecided) |
| "POS" | **staff application** (POS replacement is a non-goal) |
| "manager panel" | **staff application** |
| "billing engine" | **bill calculation** |