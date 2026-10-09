# QR System

The table QR code: design, tokens, and lifecycle.

Related: [`../domain/table-management.md`](../domain/table-management.md) ·
[`../domain/customer-sessions.md`](../domain/customer-sessions.md) ·
[`../domain/approval-system.md`](../domain/approval-system.md)

---

## 1. What it is

The physical QR code a restaurant places on tables (and optionally at the entrance) that customers scan
to open the menu.

**Who uses it:** customers scan it; the restaurant owns the printed artifact.

---

## 2. Why it exists

`DECIDED`

- The customer should not type a URL or ask a waiter for one.
- The QR identifies **which restaurant** and, for table QR codes, **which table**.
- It must be a **static** physical artifact: reprinting on every new customer is unacceptable.

---

## 3. The central distinction

`DECIDED` (principle P6)

> **QR = static identity. Table Session = dynamic state.**

| QR holds | QR must never hold |
|---|---|
| Tenant identity (via slug) | Session identifiers |
| Table identity (via an opaque token) | Customer identity |
| Nothing else | Internal database IDs |
| | Any dynamic state |

**This is why QR codes don't need reprinting** and why the session model can be sophisticated without
touching physical material.

---

## 4. QR types

`DECIDED`

| Type | URL | Gives | Table context |
|---|---|---|---|
| **Entrance / general** | `ourdomain.ir/r/{slug}` | Menu only | No |
| **Table** | `ourdomain.ir/r/{slug}/t/{tableToken}` | Menu + table identity | Yes |

### 4.1 The example

```
✅ /r/cafe-novin/t/8FJ29KX72Q      ← opaque public token
❌ /restaurant/42/table/7          ← sequential internal IDs
```

The rejected form leaks the tenant's row count and table count, and invites enumeration.

---

## 5. Token design

`PROPOSED` (requirements are `DECIDED`)

| Property | Requirement |
|---|---|
| Randomness | Cryptographically random |
| Length | Long enough that brute force is infeasible (`OPEN QUESTION` — depends on rate limits) |
| Alphabet | Unambiguous characters (avoid `0/O`, `1/l/I`) — practical for manual entry |
| Uniqueness | Unique per tenant |
| Meaning | None — carries no tenant/table information |
| Case | Fixed case to avoid normalisation bugs |
| Rotation | Support regeneration per table |

**`OPEN QUESTION`:** exact token format. The founder example `8FJ29KX72Q` is 9 characters; a short token is
friendlier but requires strong rate limiting. Recommended: ~12+ characters of base32, or longer.

---

## 6. What scanning does

`DECIDED`

```
Customer scans table QR
        ↓
Server resolves slug → tenant
        ↓
Server resolves table token → table (within that tenant)
        ↓
Customer Session created / resumed, bound to the table
        ↓
Menu displayed  ← NO permission prompt, NO ordering access
```

**Critically: the QR grants no ordering permission.** Staff approval is still required (P3).

### 6.1 Entrance QR

```
Customer scans entrance QR
        ↓
Tenant resolved
        ↓
Customer Session created (no table binding)
        ↓
Menu displayed
```

**`OPEN QUESTION`:** an entrance-QR customer who then wants to order has no table. Options: prompt them to
scan the table QR, ask staff to attach them to a table, or allow ordering linked to a "general" table.
See [`../governance/open-questions.md`](../governance/open-questions.md#product).

---

## 7. Artifacts the restaurant needs

`PROPOSED`

| Artifact | Purpose |
|---|---|
| Downloadable QR image per table | For printing |
| Printable sheet (multiple QRs, one page) | Efficient for the restaurant |
| Table tent / card template | Physical placement |
| Entrance QR | For the door/window/menu |
| A short printed instruction line | «برای مشاهده منو و سفارش، QR را اسکن کنید» |
| Regeneration capability | For lost or stolen codes |

**`OPEN QUESTION`:** who designs the physical artifacts (tent design, branding). This matters — the QR
card is a physical touchpoint the restaurant sees.

---

## 8. Lifecycle

`DECIDED` (that these operations exist) · `PROPOSED` (details)

| Event | Behaviour |
|---|---|
| Table created | Token generated; QR renderable |
| Table in use | QR unchanged; sessions come and go |
| Table archived | Token stops resolving; history preserved |
| QR compromised / tent stolen | **Regenerate** — the old token stops working; reprint only that table's card |
| Slug changed | **Slug must be immutable**, or every printed QR breaks (see multi-tenancy §5.6) |
| Custom domain added (`FUTURE`) | QR URLs use the tenant's canonical domain |

### 8.1 Regeneration is a security feature

If a table tent is stolen, regenerating that one token invalidates it **without reprinting the whole
restaurant's QR set**. This is why regeneration must be per table, not per tenant.

---

## 9. Security considerations

`DECIDED` / `PROPOSED`

| Threat | Control | Status |
|---|---|---|
| Enumeration of table tokens | Random, high-entropy tokens; rate limit lookups | `DECIDED` |
| Internal ID exposure | Opaque tokens only | `DECIDED` |
| Stolen QR used from outside | Ordering still requires approval | `DECIDED` |
| Token granting session access | Table token gives **identity only**, never a session | `DECIDED` |
| Cross-tenant token use | Token is scoped to a tenant | `DECIDED` |
| Old token after regeneration | Server-side invalidation | `DECIDED` |
| Token leakage via `Referer` | The table token is low-privilege, so this is acceptable; **session tokens must not be in URLs** | `PROPOSED` |
| Bulk scanning to enumerate a restaurant's size | Rate limiting; menu is public | `DECIDED` |
| Physical QR tampering (sticker swapped) | No control — physical trust | `DECIDED` (accepted) |

**Explicitly rejected:** GPS verification, Wi-Fi requirement (approval-system §2.1).

---

## 10. Edge cases

| Edge case | Handling | Status |
|---|---|---|
| Invalid token | Friendly Persian "this table isn't in use" | `PROPOSED` |
| Token from another tenant's URL | Resolves against the current tenant → invalid | `DECIDED` |
| Archived table scanned | Friendly message | `PROPOSED` |
| Tenant not found | Friendly message | `PROPOSED` |
| Slug changed after printing | Immutability prevents this | `PROPOSED` |
| Two customers scan the same table QR | Second must not hijack the first's approved session | `OPEN QUESTION` |
| Staff scans a table QR | Should attach the staff device to the table, not create a customer session | `PROPOSED` |
| QR scanned with a camera app (no deep link) | URL must work when pasted/opened directly | `DECIDED` |
| Printed QR smudged | Regenerate + reprint that table | `DECIDED` |
| Very high scan volume from one location | Rate limits must not block legitimate scans at a busy restaurant | `OPEN QUESTION` |

---

## 11. Business rules

| # | Rule | Status |
|---|---|---|
| QR1 | QR is static identity; session is dynamic state | `DECIDED` |
| QR2 | QR never contains session data | `DECIDED` |
| QR3 | Table QR uses an opaque random token, never an internal ID | `DECIDED` |
| QR4 | Scanning grants menu access only | `DECIDED` |
| QR5 | Tokens are regenerable per table | `DECIDED` |
| QR6 | Slugs are immutable once printed (recommended) | `PROPOSED` |
| QR7 | The QR URL works when opened directly, not only via deep link | `DECIDED` |

---

## 12. Future considerations

| Feature | Constraint on today's design |
|---|---|
| Custom domains | QR URLs must use whatever domain is canonical for that tenant |
| Short vanity URLs | Optional; would complicate printed artifacts |
| NFC tags | Alternative to QR; same token model |
| Dynamic QR (rotating token) | Would break the static requirement — only as an anti-reprint measure, `FUTURE` |
| Per-tenant QR branding (logo in the centre) | Must keep the code scannable |
| Multiple menu languages | Token model is language-agnostic |
| Table-level ad/upsell on the QR landing | Additional content at the landing step |

---

## 13. Open questions

| # | Question | Blocking? |
|---|---|---|
| Q1 | Token format and length | **Yes — security posture** |
| Q2 | Second customer scanning an active table QR | **Yes — product rule** |
| Q3 | Entrance-QR customers who want to order | **Yes — product decision** |
| Q4 | Slug immutability | **Yes — affects URL design** |
| Q5 | QR scan rate limits (must not block a busy restaurant) | Yes |
| Q6 | Who designs the physical table tent? | No |
| Q7 | Should the QR landing show promotions? | No |

Full register: [`../governance/open-questions.md`](../governance/open-questions.md).