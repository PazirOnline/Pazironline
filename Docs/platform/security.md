# Security

The consolidated security requirements for this product.

Related: [`multi-tenancy.md`](multi-tenancy.md) · [`roles-and-permissions.md`](roles-and-permissions.md) ·
[`../domain/approval-system.md`](../domain/approval-system.md) ·
[`../domain/customer-sessions.md`](../domain/customer-sessions.md) · [`audit-log.md`](audit-log.md)

---

## 1. Scope

The brief lists these concerns explicitly:

- Tenant isolation
- Authorization
- Role-based access
- Session security
- QR token security
- API authorization
- Rate limiting
- Abuse prevention
- Duplicate request protection
- Audit logs
- Secure staff authentication
- Preventing one restaurant from accessing another restaurant's data

**And the governing rule (`DECIDED`):**

> Never assume that hiding something in the frontend is sufficient security.

---

## 2. Threat model

| # | Threat | Primary control |
|---|---|---|
| T1 | Tenant A reads Tenant B's data | Tenant-scoped queries + authorization |
| T2 | Fake orders from outside the restaurant | Staff approval gate |
| T3 | Order flooding / spamming | Rate limiting + anomaly detection |
| T4 | Duplicate orders from double taps | Idempotency keys |
| T5 | Session hijacking (XSS, device theft) | Strong tokens, HttpOnly cookies, CSP |
| T6 | Staff privilege escalation | Server-side RBAC on every action |
| T7 | Price/total tampering | Server-side price resolution |
| T8 | QR token guessing | High-entropy random tokens |
| T9 | Shared-device impersonation | Per-action attribution + auth method |
| T10 | Financial tampering (discounts, settlement) | Role restrictions + audit |
| T11 | QR photo used to browse another tenant's menu | Menu is public; ordering still gated |
| T12 | Staff member removed while logged in | Session invalidation |
| T13 | Stolen approved session used later | Session expiry policy (`OPEN QUESTION`) |
| T14 | Mass assignment / parameter tampering | Strict field allowlists |
| T15 | Host header spoofing (custom domains) | Strict host validation (`FUTURE`) |

---

## 3. Tenant isolation

`DECIDED` — principle P2. Full detail:
[`multi-tenancy.md`](multi-tenancy.md).

### 3.1 Rules

| # | Rule |
|---|---|
| SI1 | Every tenant-owned row carries a tenant reference |
| SI2 | Every query is tenant-scoped |
| SI3 | Tenant comes from the resolved/authenticated context, never from arbitrary client input |
| SI4 | Authorization is server-side on every request |
| SI5 | UI hiding is a convenience, never a control |
| SI6 | Per-tenant uniqueness constraints |
| SI7 | Cache keys include tenant identity |
| SI8 | Object storage keys are tenant-namespaced |
| SI9 | Background jobs carry tenant context |
| SI10 | Logs and errors must not leak cross-tenant data |

### 3.2 Verification

`PROPOSED`

- Automated tests that attempt cross-tenant access on every endpoint and expect rejection.
- Row-level security or a repository layer that structurally requires tenant scope.
- Pre-launch penetration test focused on IDOR and tenant escape.

---

## 4. Authentication

### 4.1 Customers

`DECIDED`

- No account. Anonymous session.
- No login of any kind.
- Session token is the only credential.

`PROPOSED` security properties of the customer session token:

| Property | Requirement |
|---|---|
| Entropy | High — not guessable |
| Storage | Prefer HttpOnly cookie over localStorage (XSS resilience) |
| Storage at rest | Hash only |
| Transmission | Not in URLs (see §6) |
| Scope | Bound server-side to one tenant + table session |
| Revocable | Yes |
| Rotatable | On privilege change (approval) |

### 4.2 Staff

`DECIDED` — staff authenticate; actions are attributable.
`OPEN QUESTION` — the method. Options analysed in
[`roles-and-permissions.md`](roles-and-permissions.md) §6 and
[`../governance/open-questions.md`](../governance/open-questions.md#security).

| Requirement | Rationale |
|---|---|
| Strong enough to attribute actions | Audit (P19) |
| Fast enough for a busy counter | Approval is the highest-frequency action (S1) |
| Workable on a shared kitchen tablet | Real-world constraint |
| No shared passwords if avoidable | Attribution integrity |

**The tension to resolve:** the fastest, most usable option (a shared PIN) is the weakest for attribution.
This is a real product decision, not a technical one.

---

## 5. Authorization

`DECIDED`

- Role-based, server-side, per-request.
- Every action endpoint checks permission explicitly.
- No generic "update any field" endpoints.

`PROPOSED` middleware shape:

```
1. Authenticate principal (customer session OR staff session)
2. Resolve tenant (from principal or host/slug)
3. Verify principal is valid for that tenant
4. Check the specific permission for the action
5. Execute with tenant scope forced into the query layer
6. Record an audit event for significant actions
```

---

## 6. Session security

| Concern | Control | Status |
|---|---|---|
| Session token in URL | Avoid; leaks via history, screenshots, `Referer` | `PROPOSED` |
| Session token in localStorage | Vulnerable to XSS theft | `PROPOSED` — prefer cookie |
| XSS | Strict CSP, no inline scripts, output encoding | `PROPOSED` |
| CSRF | SameSite cookies + CSRF tokens for staff mutations | `PROPOSED` |
| Session fixation | Server-generated identifiers only | `DECIDED` |
| Session expiry | Idle + absolute — `OPEN QUESTION` | `OPEN QUESTION` |
| Privilege change | Rotate the session on approval | `PROPOSED` |
| Cross-tenant session use | Tenant bound server-side at creation | `DECIDED` |
| Revocation | Session revocable by staff closing the table session | `PROPOSED` |

### 6.1 The URL leakage problem

`PROPOSED` — flagged as a real architectural risk:

If a customer session token appears in the URL, it can leak through:
browser history, a shared link, a screenshot, or the `Referer` header sent to any third-party resource
(an image CDN, an analytics script).

**Mitigations:**
- Keep the session token in a cookie or header.
- The **table token in the URL is acceptable** — it is a public, low-privilege identifier that only grants
  menu visibility and an access *request*.
- Strict `Referrer-Policy`; avoid third-party requests carrying the full URL.

---

## 7. QR token security

`DECIDED` — see [`../technical/qr-system.md`](../technical/qr-system.md).

| Requirement | Rationale |
|---|---|
| Random, high-entropy, unguessable | Prevents enumeration |
| Not a sequential internal ID | Prevents discovery of other tables |
| Opaque | Leaks nothing about the tenant or table |
| Regenerable per table | Compromise response without reprinting all QR codes |
| Invalidated server-side on regeneration | Old codes stop working |
| Grants only menu + access request | Never ordering (P3) |
| Tenant-scoped | Cross-tenant use is meaningless |

**Explicitly rejected (`DECIDED`):** `/restaurant/42/table/7`.

---

## 8. Rate limiting

`DECIDED` (capability) · `OPEN QUESTION` (exact limits)

### 8.1 What must be limited

| Operation | Scope | Why |
|---|---|---|
| Menu read | Per IP / per session | Scraping, DDoS |
| Create ordering access request | Per session, per table, per tenant | Approval-queue flooding |
| Submit order | Per session | Order flooding |
| Staff login | Per account/IP | Brute force |
| Staff action endpoints | Per staff member | Accidental loops |
| QR/table lookup | Per IP | Token enumeration |
| Static assets | Per IP/edge | CDN cost |

### 8.2 Why approval requests especially

`PROPOSED` — a device that can spam approval requests is both an abuse vector and a denial of service on
the staff approval queue, which is the product's critical path.

---

## 9. Abuse prevention

`DECIDED` (approval gate) · `FUTURE` (detection) · `OPEN QUESTION` (thresholds)

| Abuse | Current control | Future |
|---|---|---|
| Fake orders from a QR photo | Approval gate (P3) | Anomaly detection |
| Approval-queue flooding | `OPEN QUESTION` rate limits | Detection |
| Order flooding on an approved session | `OPEN QUESTION` | Detection + caps |
| Menu scraping | Rate limit; content is public | — |
| Session token replay | Token secrecy + expiry | Device fingerprinting |
| Insider abuse (careless approval) | Audit log | Anomaly reporting |

**Honest assessment (`PROPOSED`):** the approval gate stops the *casual* attacker. It does not stop a
determined one who convinces a staff member, nor an insider. Real hardening is `FUTURE`.

---

## 10. Duplicate request protection

`DECIDED` — principle P10. Full detail: [`../technical/idempotency.md`](../technical/idempotency.md).

**The specific scenario:**

```
Customer taps "Submit Order"
→ network is slow
→ customer taps again
→ the backend must NOT create two identical orders
```

Controls: a client-generated idempotency key per submit attempt, scoped uniqueness server-side, and
replay returning the original order.

---

## 11. Input validation

`PROPOSED` — standard, non-negotiable practices:

| Area | Rule |
|---|---|
| Prices/totals | **Never accepted from the client** — resolved server-side |
| Quantities | Positive integers, bounded |
| Status fields | Never settable by a client |
| Tenant/role fields | Never settable by a client |
| Text fields | Length limits, output encoding |
| Product descriptions | Sanitised if rich text is supported |
| File uploads (images) | Type, size, and dimension validation |
| Unknown fields | Rejected or ignored (allowlist) |

---

## 12. Transport and platform security

`PROPOSED`

| Concern | Control |
|---|---|
| Transport encryption | HTTPS only, HSTS |
| Headers | CSP, `X-Content-Type-Options`, `Referrer-Policy`, frame restrictions |
| Cookies | `HttpOnly`, `Secure`, `SameSite` |
| Secrets | Environment/config, never in code or client bundles |
| Database credentials | Not exposed to the client under any circumstances |
| Error messages | No stack traces or internal details to clients |
| Dependencies | Patched; a dependency audit before launch |
| Backups | Encrypted, restorable, tested |

---

## 13. Audit

`DECIDED` — principle P19. Detail: [`audit-log.md`](audit-log.md).

Audited actions include: order cancelled, order status changed, price changed, product disabled, staff
permission changed, table session closed, discount applied. Plus approval decisions, settlements, and role
assignments.

Audit is a **detection and accountability** control — it does not prevent an action, it makes it
traceable.

---

## 14. Business rules

| # | Rule | Status |
|---|---|---|
| SE1 | Frontend hiding is never a security control | `DECIDED` |
| SE2 | Every query is tenant-scoped | `DECIDED` |
| SE3 | Every action is authorized server-side | `DECIDED` |
| SE4 | Prices/totals come from the server | `DECIDED` |
| SE5 | Clients never set status or role | `DECIDED` |
| SE6 | Order submission is idempotent | `DECIDED` |
| SE7 | QR tokens are random and opaque | `DECIDED` |
| SE8 | Rate limiting exists on sensitive endpoints | `DECIDED` |
| SE9 | Significant actions are audited | `DECIDED` |
| SE10 | Staff authenticate | `DECIDED` |
| SE11 | Session tokens are not in URLs | `PROPOSED` |
| SE12 | Session tokens are hashed at rest | `PROPOSED` |

---

## 15. Open questions

| # | Question | Impact |
|---|---|---|
| Q1 | Staff authentication method | **Blocks Phase 2** |
| Q2 | Approved-session expiry policy | **Defines the abuse window** |
| Q3 | Session token transport (cookie vs. localStorage) | **Architecture + security** |
| Q4 | Exact rate limits and abuse thresholds | Security posture |
| Q5 | Is device fingerprinting acceptable for abuse detection? | Privacy + legal |
| Q6 | Data retention periods (orders, customer data, audit) | **Legal/compliance** |
| Q7 | Where is personal data stored, and is it hosted in Iran? | **Legal/compliance** |
| Q8 | Content Security Policy strictness vs. third-party services | Architecture |
| Q9 | Session duration on shared staff devices | UX vs. security |

Full register: [`../governance/open-questions.md`](../governance/open-questions.md).