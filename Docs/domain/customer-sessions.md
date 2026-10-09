# Customer Sessions

How the system knows "who is this person" without requiring an account.

Related: [`../domain/approval-system.md`](../domain/approval-system.md) ·
[`../domain/table-management.md`](../domain/table-management.md) ·
[`../platform/security.md`](../platform/security.md)

---

## 1. What it is

An **ephemeral, anonymous identity for a customer's device during a visit.** It lets the system
associate orders with a table session without a permanent account.

**Who uses it:** the customer (transparently) and the system.

---

## 2. Why it exists

- `DECIDED` — customers must **not** be forced to create a permanent account.
- `DECIDED` — name and phone are **optional**.
- The system still needs to attribute orders, enforce approval, and prevent cross-session interference.

A session is the mechanism that satisfies all three.

---

## 3. Concept

```
Restaurant
   ↓
Table                       static identity (QR token)
   ↓
Table Session               dynamic occupancy; owns approval, orders, bill
   ↓
Customer Session            this device's identity for this visit
   ↓
Orders
```

`DECIDED`

### 3.1 Why both a Table Session and a Customer Session?

| Concept | Answers |
|---|---|
| **Table Session** | *What is happening at this table?* (approval state, orders, bill) |
| **Customer Session** | *Who is on this device right now?* (whose cart, whose screen, whose request) |

One device per table in the MVP, but the concepts are separated so that multiple devices (FUTURE), or a
single device moving between tables, does not require a redesign.

### 3.2 The MVP relationship

`DECIDED` — one customer session is bound to one table session. Four people at a table do not each scan;
one device orders for all of them.

---

## 4. Lifecycle

`PROPOSED` (the states are an architectural proposal; approval state is `DECIDED`)

```
      created on first visit
              ↓
        ┌───────────┐
        │  ACTIVE   │  browsing
        └─────┬─────┘
              │ requests ordering access
              ▼
        ┌────────────────────┐
        │ PENDING_APPROVAL   │
        └─────┬───────┬──────┘
              │       │ rejected / timeout
              ▼       ▼
        ┌─────────┐  → back to ACTIVE (can re-request, rate-limited)
        │APPROVED │
        └────┬────┘
             │ session closed or expires
             ▼
        ┌──────────┐
        │  CLOSED  │  terminal
        └──────────┘
```

| State | Meaning | Status |
|---|---|---|
| `ACTIVE` | Browsing, no ordering permission | `PROPOSED` |
| `PENDING_APPROVAL` | Waiting for staff | `DECIDED` as a concept («در انتظار تأیید») |
| `APPROVED` | May submit orders | `DECIDED` |
| `REJECTED` | Staff refused | `OPEN QUESTION` — retry policy |
| `CLOSED` | Terminal | `PROPOSED` |
| `EXPIRED` | Idle timeout | `OPEN QUESTION` |

---

## 5. Mechanism

**Status: `OPEN QUESTION` — this is architecture-relevant and needs a decision.**

### 5.1 What is decided

`DECIDED`

- The session must survive page refresh.
- The session must survive closing and reopening the menu during the active visit.
- **An open browser tab must not be required** for an order to keep existing.
- One device per table is the MVP model (P5 / §8 of brief).
- The session is bound to a table session.

### 5.2 What must be chosen

| Decision | Options | Notes |
|---|---|---|
| **Token storage** | HttpOnly cookie · localStorage · both | Cookie is safer against XSS theft but complicates cross-subdomain (custom domains later) |
| **Session identifier** | Opaque random token | Should **not** be a JWT containing tenant/table data if the token travels in a URL |
| **Re-establishment** | Persisted token · re-scan QR · table token alone | Re-scanning must not lose cart/identity |
| **Binding** | session ↔ table session, stored server-side | Server-side is authoritative |
| **Multi-tab** | Share one session, or one per tab | Sharing is simpler and matches "one person orders for the table" |
| **Cross-device** | None in MVP | `FUTURE` |

### 5.3 A specific architectural hazard

`PROPOSED` — flagged because it will bite us:

> If the customer session identifier travels in the URL (e.g. `/r/cafe-novin/t/TOKEN?cs=SESSION`), then
> the URL may leak via the browser history, a shared link, a screenshot, or a `Referer` header to an
> image CDN. That could let a third party act as that session.

Mitigations to consider:
- Session token in a cookie or header, **not** in the URL.
- The **table token** in the URL is acceptable — it is a public, low-privilege identifier whose only
  power is "show me this menu and let me request access".
- Strict `Referrer-Policy` and no third-party requests carrying the full URL.

**Recorded as an open question** in
[`../governance/open-questions.md`](../governance/open-questions.md#security).

---

## 6. The table-join problem

`DECIDED` — the session must survive reopening the menu. But if a customer closes the tab and reopens
`ourdomain.ir/r/cafe-novin` (the **entrance** URL, no table token), how does the system recover their
table context?

Options:

| Option | Behaviour | Trade-off |
|---|---|---|
| Persisted token | Device remembers its session → reattaches | Simple; lost if cookies cleared or device changes |
| Re-scan the table QR | Recovers table context from the QR | Annoying if the customer has to walk back to the table; but they usually *are* at the table |
| Table token alone | The QR token identifies the table; the server knows whether an approved session exists there | **Security problem**: anyone with a photo of the QR could then reach the approved session. `DO NOT USE ALONE` |

**Recommendation (`PROPOSED`):** persisted device token as the primary mechanism, with the table QR
re-scan as the fallback recovery path. The table token alone must **never** be sufficient to inherit an
approved session's identity.

---

## 7. Business rules

| # | Rule | Status |
|---|---|---|
| CS1 | No permanent customer account | `DECIDED` |
| CS2 | Session binds to a table session | `DECIDED` |
| CS3 | Session survives refresh | `DECIDED` |
| CS4 | Session survives reopening the menu during the visit | `DECIDED` |
| CS5 | Order existence is independent of an open tab | `DECIDED` |
| CS6 | One device orders for the whole table | `DECIDED` |
| CS7 | Personal data only if voluntarily provided | `DECIDED` |
| CS8 | A table token alone must never grant inherited approval | `PROPOSED` — recommended |
| CS9 | Session expiry policy | `OPEN QUESTION` |
| CS10 | One session per tab vs. per device | `OPEN QUESTION` |

---

## 8. Edge cases

| Edge case | Handling | Status |
|---|---|---|
| Page refresh mid-approval-wait | Session persists; waiting state restored | `DECIDED` |
| Tab closed and reopened from the table QR | Session persists on device | `DECIDED` |
| Tab closed and reopened from the entrance URL | Needs the mechanism in §6 | `OPEN QUESTION` |
| Cookies cleared mid-visit | Session lost; re-request approval or re-scan | `PROPOSED` |
| Two tabs open, one adds to cart | Define shared vs. isolated cart | `OPEN QUESTION` |
| Customer switches devices mid-visit | Session not portable (MVP) | `DECIDED` |
| Customer scans a second table's QR mid-visit | Prohibit or re-bind? | `OPEN QUESTION` — see contradictions register |
| Session expires while the tab is open | Show a clear state, offer re-request | `PROPOSED` |
| Staff closes the table session while customer is active | Warn and block new orders | `PROPOSED` |
| Customer returns after the session closed | New browsing session; history not required | `DECIDED` |
| Shared family device | New session; previous session data not visible without the token | `DECIDED` |
| Network drop during approval wait | Retry; state must be re-fetched, not assumed | `DECIDED` |

---

## 9. Security considerations

| Concern | Control | Status |
|---|---|---|
| Session hijacking | Unguessable, high-entropy token; HttpOnly cookie preferred; regenerate on privilege change | `PROPOSED` |
| Session theft via XSS | No inline scripts, strict CSP, HttpOnly cookies | `PROPOSED` |
| Session leakage via URL/referrer | Keep the session token out of URLs; `Referrer-Policy` | `PROPOSED` |
| Session leakage via shared screenshots | A screenshot shows the menu, not the session identity | Follows from the above |
| Fixation | Server-generated token; never accept a client-chosen identifier | `DECIDED` |
| Inheriting an approved session via table token | Explicitly blocked (CS8) | `PROPOSED` |
| Session used from another tenant's context | Tenant bound server-side at session creation; never trusted from the client | `DECIDED` |
| Session enumeration | High-entropy tokens; rate limiting | `DECIDED` |
| PII exposure | Optional collection; no exposure across tenants | `DECIDED` |
| Long-lived session abuse | Expiry policy | `OPEN QUESTION` |

---

## 10. Data implications

| Entity | Key fields |
|---|---|
| **Customer session** | id, tenant_id, table_session_id, state, token_hash, device_fingerprint (optional, `OPEN QUESTION`), created_at, last_seen_at, expires_at, closed_at |
| **Cart** (client-side) | product refs, quantities, options |

**Note on token storage (`PROPOSED`):** store a **hash** of the session token, not the token itself, so a
database leak does not yield usable sessions.

**Indexes:** `(tenant_id, table_session_id)`; token hash unique.

**`last_seen_at` matters** — it is what makes idle-expiry and abuse detection possible later.

---

## 11. Current decision summary

`DECIDED`

No customer account. A customer session binds a device to a table session, carries approval state,
survives refresh and reopening, and is independent of an open tab. One device orders for the table.
Personal data is optional.

**Not decided:** token storage and transport, expiry policy, multi-tab behaviour, cross-table movement.

---

## 12. Future considerations

| Feature | Constraint on today's design |
|---|---|
| Multiple devices per table | Session↔table session must not be exclusive at the DB level |
| Named customer accounts | An optional account may be *linked* to a session without changing the session flow |
| Order history across visits | Sessions must not be hard-deleted on close |
| Split bill per person | Identity per diner needed; sessions per device is insufficient |
| Loyalty | Requires stable customer identity — optional account or phone-based |
| Pre-order from home | A session without a table session |
| Waiter ordering for a table | Staff-initiated session creation |

---

## 13. Open questions

| # | Question | Blocking? |
|---|---|---|
| Q1 | Session token transport (cookie vs. localStorage vs. URL) | **Yes — security + architecture** |
| Q2 | Session expiry / idle timeout | **Yes — security model** |
| Q3 | Multi-tab: shared session/cart or isolated | No |
| Q4 | Can a device move between tables in one visit? | **Yes — product rule** |
| Q5 | Re-establishment from the entrance URL | **Yes — architecture** |
| Q6 | Is a session created on first menu view, or only when ordering is requested? | Yes |
| Q7 | Device fingerprinting for abuse detection — privacy acceptable? | No |

Full register: [`../governance/open-questions.md`](../governance/open-questions.md).