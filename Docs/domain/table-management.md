# Table Management

Tables, their states, and their relationship to table sessions.

Related: [`../domain/customer-sessions.md`](../domain/customer-sessions.md) ·
[`../domain/approval-system.md`](../domain/approval-system.md) ·
[`../technical/qr-system.md`](../technical/qr-system.md)

---

## 1. What it is

The restaurant's physical tables, their current state, and the rules for binding a table to a customer
session.

**Who uses it:** staff (manage, view status), customers (indirectly — the QR identifies a table).

---

## 2. Why it exists

- Table identity is the anchor for orders, approvals, and bills. An order without a table cannot be
  delivered or settled.
- Staff need to know where customers are.
- The table's QR is a **static** asset; the occupancy is **dynamic**. Separating them avoids reprinting
  QR codes (P6).

---

## 3. Table entity

`DECIDED`

| Field | Status | Notes |
|---|---|---|
| Internal ID | `DECIDED` | Never exposed |
| Tenant | `DECIDED` | Tables belong to exactly one tenant |
| Human label (e.g. «میز ۸») | `DECIDED` | Shown in staff views and the customer UI |
| QR public token | `DECIDED` | Random, opaque, unique within tenant |
| Status | `DECIDED` | See §4 |
| Current session reference | `DECIDED` (derived) | The open table session, if any |
| Section / zone (outdoor, terrace) | `PROPOSED` | Common need |
| Capacity / seats | `OPEN QUESTION` | Useful later |
| Position / layout coordinates | `FUTURE` | For a visual floor plan |
| QR image asset | `DECIDED` (derived) | Generated, printable |
| Active/archived | `DECIDED` (reserved) | A removed table's history must survive |

---

## 4. Table state machine

`DECIDED` (the states exist) · `PROPOSED` (exact transitions)

The brief names these states: Available, Occupied, Waiting for approval, Active session.

### 4.1 Proposed states

```
        ┌──────────────┐
        │   AVAILABLE  │  no session
        └──────┬───────┘
               │ customer requests ordering access
               ▼
   ┌───────────────────────┐
   │   WAITING_APPROVAL    │  session PENDING_APPROVAL
   └──────┬─────────┬──────┘
          │ approve │ reject / timeout
          ▼         ▼
   ┌─────────────┐   back to AVAILABLE (rejection)
   │   ACTIVE    │  session APPROVED
   └──────┬──────┘
          │ settle / close
          ▼
   ┌─────────────┐
   │  CLOSING/   │  paid, not yet released
   │  CLOSED     │
   └──────┬──────┘
          ▼
   ┌──────────────┐
   │  AVAILABLE   │
   └──────────────┘
```

### 4.2 Important design point

`PROPOSED` — **table state is derived from the table session, not stored as an independent truth.**

If both "table status" and "session status" are independently writable, they will disagree. The table's
display status should be a function of its current session.

| Table display status | Derived from |
|---|---|
| `AVAILABLE` | No open session |
| `WAITING_APPROVAL` | Open session, `PENDING_APPROVAL` |
| `ACTIVE` | Open session, `APPROVED` and not yet settled |
| `SETTLING` | Session orders all delivered, awaiting settlement |

**Exception:** restaurants have physical reality the software doesn't know — a walk-in who never scans.
Staff must be able to **manually mark a table occupied** without a customer session. This means some
table state *is* independently settable. Recorded as a nuance in
[`../governance/open-questions.md`](../governance/open-questions.md#product).

### 4.3 Transitions

| From | To | Trigger | Actor |
|---|---|---|---|
| `AVAILABLE` | `WAITING_APPROVAL` | Access requested | Customer |
| `WAITING_APPROVAL` | `ACTIVE` | Approval | Waiter/Cashier/Manager |
| `WAITING_APPROVAL` | `AVAILABLE` | Rejection or timeout | Staff / system |
| `ACTIVE` | `SETTLING` | All orders delivered | System / staff |
| `SETTLING` | `AVAILABLE` | Settlement + session close | Cashier/Manager |
| `ACTIVE` | `AVAILABLE` | Abandoned session (policy: `OPEN QUESTION`) | System |
| any | any | Manual override by authorised staff | Manager (`PROPOSED`) |

### 4.4 `OPEN QUESTION` — abandoned sessions

An approved table is vacated without settling. When does the session end?

| Question | Why it matters |
|---|---|
| Idle timeout length | Stale sessions block the table from being reused |
| Who may close an abandoned session | Cashier? Manager? System? |
| Can an abandoned session be reopened | Brief says "reopen if necessary" — `FUTURE` |
| Does the idle timeout also expire *ordering approval*? | **Security-relevant** — see §7 |

This is one of the highest-impact open questions. See
[`../governance/open-questions.md`](../governance/open-questions.md#security).

---

## 5. The table ↔ session relationship

`DECIDED`

```
Restaurant
   ↓
Table  (static identity, has QR token)
   ↓
Table Session  (dynamic occupancy; owns approval + orders + bill)
   ↓
Customer Session  (the device identity)
   ↓
Orders
```

### 5.1 Rules

| # | Rule | Status |
|---|---|---|
| TR1 | A table belongs to exactly one tenant | `DECIDED` |
| TR2 | A table has a stable, opaque QR token | `DECIDED` |
| TR3 | At most one **open** session per table (default) | `PROPOSED` — conflicts with `FUTURE` merge/split |
| TR4 | Orders attach to a session, not directly to a table | `DECIDED` |
| TR5 | A bill belongs to a session | `DECIDED` |
| TR6 | Table identity is independent of occupancy | `DECIDED` (P6) |
| TR7 | A table's QR must not need reprinting between customers | `DECIDED` (P6) |

### 5.2 Why orders attach to sessions, not tables

`DECIDED` rationale: if a session is transferred to another table (FUTURE), the orders must follow the
session, not the table. Binding orders to the session makes transfer, merge, and split tractable later.

---

## 6. Staff table management

`DECIDED` in concept

| Capability | Who | Status |
|---|---|---|
| View all tables with status | Staff | `DECIDED` |
| Define/edit tables | Owner/Manager | `DECIDED` |
| Assign/generate QR tokens | Owner/Manager | `DECIDED` |
| Download printable QR | Owner/Manager | `DECIDED` |
| Regenerate a QR token (compromise) | Owner/Manager | `DECIDED` |
| Manually mark occupied (walk-in, no QR) | Waiter/Cashier | `PROPOSED` |
| Transfer session to another table | Manager | `FUTURE` |
| Merge tables | Manager | `FUTURE` |
| Split a table | Manager | `FUTURE` |
| Close/reopen session | Cashier/Manager | Close `DECIDED`; reopen `FUTURE` |

**QR regeneration** matters for security: if a table tent is stolen, regenerating the token invalidates
it without reprinting the whole set. Recorded in [`../technical/qr-system.md`](../technical/qr-system.md).

---

## 7. Security considerations

| Concern | Mitigation | Status |
|---|---|---|
| Table token enumeration | Random, high-entropy tokens; not sequential; rate limit | `DECIDED` |
| Stolen QR used from outside | Ordering still requires staff approval (P3) | `DECIDED` |
| Token leakage via referrer | `OPEN QUESTION` — session token in URL vs. header; referrer policy | `OPEN QUESTION` |
| Old QR after regeneration | Token invalidated server-side | `DECIDED` |
| Cross-tenant table access | Tenant scoping on every table query (P2) | `DECIDED` |
| Staff closing another table's session | Role check + audit | `DECIDED` |
| Long-lived approved session reused later | Session expiry policy `OPEN QUESTION` | `OPEN QUESTION` |

---

## 8. Data implications

| Entity | Key fields |
|---|---|
| **Table** | id, tenant_id, label, qr_token (unique per tenant), section, is_active, archived_at, created_at |
| **Table session** | id, tenant_id, table_id, status, approved_by, approved_at, opened_at, closed_at, closed_by |
| *(reserved)* | merged_into, split_from, position, capacity |

**Indexes:** unique `(tenant_id, qr_token)`; `(tenant_id, status)` for the staff table view.

---

## 9. Current decision summary

`DECIDED`

Each tenant defines its own tables. Tables have a static opaque QR token and a dynamic status. Orders
and bills belong to a table session, not directly to a table. Status is derived from the session where
possible. Staff manage tables and can regenerate tokens. Transfer/merge/split are future.

**Not decided:** abandoned-session policy, idle timeouts, whether approval expires with the session,
manual occupancy without a QR, multi-open sessions per table, capacity/seats.

---

## 10. Future considerations

| Feature | Constraint on today's design |
|---|---|
| Session transfer | Session↔table binding must be mutable, and orders must follow the session |
| Table merge | Must allow multiple sessions to combine into one bill — implies sessions are not hard-bound to one table forever |
| Table split | Must be able to partition orders |
| Multi-branch | Tables belong to a branch/location, not just a tenant |
| Visual floor plan | Needs position data (reserved) |
| Reservations | A table may need a future reservation state distinct from current occupancy |
| Turnover time | Needs session start/end timestamps and analytics |
| Large restaurants (100+ tables) | Pagination and a filterable grid |

**Critical architectural note (P13):** if `FUTURE` merge is required, then rule TR3 ("one open session
per table") cannot be a hard database constraint. Either the rule is relaxed now, or the merge
implementation must be able to violate it. This is flagged as a design tension in
[`../governance/contradictions-and-risks.md`](../governance/contradictions-and-risks.md).

---

## 11. Open questions

| # | Question | Blocking? |
|---|---|---|
| Q1 | Abandoned-session timeout and who closes it | **Yes — affects session + approval model** |
| Q2 | Does ordering approval expire with session idleness? | **Yes — security model** |
| Q3 | Manual table occupancy without a QR scan | **Yes — staff UX** |
| Q4 | Can a table have more than one open session? | No (MVP) |
| Q5 | Capacity/seats in MVP? | No |
| Q6 | Table numbering scheme and reuse | No |
| Q7 | Session token in URL vs. cookie/header | **Yes — security** |
| Q8 | Auto-close session on settlement, or manual? | Yes |

Full register: [`../governance/open-questions.md`](../governance/open-questions.md).