# Approval System

The anti-abuse gate. Staff approve a table's ordering access **once** before the customer can order.

Related: [`../domain/customer-sessions.md`](../domain/customer-sessions.md) ·
[`../domain/table-management.md`](../domain/table-management.md) ·
[`../flows/staff-flow.md`](../flows/staff-flow.md) §4

---

## 1. What it is

The mechanism by which restaurant staff grant a customer session permission to submit orders for a
table.

**Who uses it:** the customer (requests) and restaurant staff (approves/rejects).

---

## 2. Why it exists

`DECIDED`

**Anti-abuse.** A table QR code is a photograph away. Without a human gate, anyone with a photo of it
could submit fake orders from home — a real financial and operational problem for the restaurant.

Approval converts a leaked QR from "an ordering credential" into "a menu link".

### 2.1 What it is NOT

`DECIDED` — explicitly rejected as the primary mechanism:

- ❌ **GPS geofencing** — spoofable, bad UX, battery and permission cost
- ❌ **Mandatory restaurant Wi-Fi** — many cafés don't have it, guests often use mobile data, it
  breaks constantly

These may be considered as *supplementary* signals later, but they must never replace approval.

`DO NOT ASSUME` that location or network detection exists anywhere in this product.

---

## 3. The principle

`DECIDED`

| # | Rule |
|---|---|
| A1 | Scanning a QR grants **menu browsing only** |
| A2 | Ordering requires an **approved active session** |
| A3 | Approval happens **ONCE per table/customer session** |
| A4 | Staff must **not** approve every individual order |
| A5 | Approval must be possible in **one tap** |
| A6 | The customer sees «در انتظار تأیید» while waiting |
| A7 | Approval must be attributable (who approved) and audited |

---

## 4. How it works

```
Customer taps "order"
        ↓
[Is there an open, APPROVED session for this table?]
   ├── yes → unlock ordering immediately
   └── no  → create an access request (idempotent per customer session)
                    ↓
            Customer session → PENDING_APPROVAL
                    ↓
            Customer sees «در انتظار تأیید»
                    ↓
            ┌──────────── staff side ────────────┐
            │  Approval queue:                    │
            │    Table 8 · waiting 1m 12s · Ali    │
            │    [ Approve ]  [ Reject ]           │
            └─────────────────┬────────────────────┘
                              │ one tap
                              ▼
            Table session → APPROVED
            Customer session → APPROVED
            Customer notified (real-time, `OPEN QUESTION` transport)
            Audit event recorded
                    ↓
            Customer orders repeatedly — NO further approval
```

`DECIDED`

### 4.1 Approval is idempotent

`PROPOSED` — if two staff tap Approve simultaneously, the second must get a benign "already approved"
response, not an error or a duplicate event.

---

## 5. The 14:20 example

`DECIDED` (from the brief)

```
14:20  Customer requests ordering access
14:21  Staff approves
14:22  Order #1021
14:40  Order #1022
14:55  Order #1023
```

All three orders proceed under the **same** approval. This is the defining behaviour of the system.

---

## 6. Staff workflow requirements

`DECIDED` (UX principles S1, S2)

| Requirement | Why |
|---|---|
| A dedicated pending-requests queue | Approval is the highest-frequency staff action |
| Each entry shows table + elapsed wait time + customer name if given | Staff triage by urgency |
| One tap to approve | If it's slow, staff stop doing it |
| Longest wait first | Urgency ordering |
| Reject is secondary but present | Staff need an out |
| Push or obvious polling update | Staff can't watch a queue they must refresh |
| Approve/reject is role-restricted | `OPEN QUESTION` exactly which roles |

**Design failure mode to avoid:** an approval system that requires the staff member to navigate to a
table, open the session, and confirm. One tap, or it will be bypassed.

---

## 7. Customer experience during approval

`DECIDED` (label) · `PROPOSED` (copy/layout)

The waiting state must:

1. Be unmistakable (C9).
2. Explain what is being waited for (a staff member approving the table).
3. Reassure that no re-scan or re-request is needed (S9).
4. Show which table they are on.
5. Provide a way to leave the request (`OPEN QUESTION`).

### 7.1 Polling the approval state

`DECIDED` capability — the customer learns when they're approved without acting.
`OPEN QUESTION` transport — see [`../technical/realtime.md`](../technical/realtime.md).

---

## 8. Rejection

`OPEN QUESTION` — largely unspecified.

| Question | Notes |
|---|---|
| Can staff reject at all? | Probably yes, but `OPEN QUESTION` |
| What does the customer see? | Friendly, non-accusatory |
| Can the customer re-request? | `OPEN QUESTION` — and a retry loop is an abuse vector |
| Is a reason captured? | `OPEN QUESTION` — but useful for the manager |
| Does rejection close the session? | `OPEN QUESTION` |

**Recommendation (`PROPOSED`):** rejection requires an optional reason, the customer may see a generic
message, re-request is rate-limited, and rejection is audited.

---

## 9. Expiry — the biggest security question

**This is the most consequential unresolved item in the approval system.**

`OPEN QUESTION`

| Question | Why it matters |
|---|---|
| How long does an approved session remain orderable? | Defines the abuse window |
| Does idle time revoke approval, or just the session? | Directly determines attack surface |
| Does approval expire when the table session closes? | Should be yes |
| What is the maximum session length (e.g. 6 hours)? | Bounds the damage from a leaked/stolen device |
| Can a manager extend a session? | `OPEN QUESTION` |
| Is there a visual expiry warning to the customer? | UX |

### 9.1 The threat this addresses

`PROPOSED`

Once approved, a customer can continue ordering from anywhere until approval is revoked. Someone with
a stolen phone, a shared device, or a photo of the QR plus a session token could place orders on an
already-approved session.

### 9.2 Candidate policy

`PROPOSED` — **not decided**

```
Approved session is orderable while:
   AND session not closed
   AND now < approved_at + MAX_SESSION_DURATION
   AND now < last_seen_at + IDLE_TIMEOUT   (if idle expiry applies)
```

The value of `MAX_SESSION_DURATION` trades off:

| Shorter | Longer |
|---|---|
| Less abuse exposure | Fewer interruptions mid-meal |
| More mid-visit re-approvals | Better for a slow 3-hour lunch |

**A mid-meal expiry that blocks ordering is a serious UX failure.** Any chosen policy must have a graceful
re-approval path.

---

## 10. Edge cases

| Edge case | Proposed handling | Status |
|---|---|---|
| Two customers scan the same table QR | One active session; the second must not silently hijack it | `OPEN QUESTION` |
| Customer requests access twice quickly | Idempotent — one pending request | `PROPOSED` |
| Customer requests access again after a rejection | Rate-limited retry | `OPEN QUESTION` |
| Staff approves after the session expired | Reject the transition | `PROPOSED` |
| Staff approves a table that already has an open session | Attach to/notify the existing session | `PROPOSED` |
| Request never actioned | Auto-expire after a defined window | `OPEN QUESTION` |
| Staff app offline | Queue shown on next load; no offline mode (P9) | `DECIDED` |
| Flood of requests from one device | Rate limit per session/table/tenant | `OPEN QUESTION` |
| Customer who never scans but staff opens the table | Manual approval on the staff's behalf | `PROPOSED` |
| Approval revoked mid-meal (staff mistake) | Needs a "revoke" action — `OPEN QUESTION` | `OPEN QUESTION` |
| Approval for the wrong table | Staff corrects; audit records it | `PROPOSED` |
| Restaurant has no waiters (counter service) | Cashier approves — role question | `OPEN QUESTION` |
| Customer walks away with an approved session | Idle timeout + manual close | `OPEN QUESTION` |

---

## 11. Security considerations

| Concern | Control | Status |
|---|---|---|
| Fake orders from outside the restaurant | **Approval gate** — the primary control | `DECIDED` |
| Replaying a session token | High-entropy token; no token in URLs; HttpOnly | `PROPOSED` |
| Abusing approval to flood orders | Rate limits + anomaly detection | `OPEN QUESTION` |
| Staff approving without looking | One-tap design is a *speed* trade-off — accept, monitor by audit | `DECIDED` (accepted) |
| Approving the wrong table | Table label shown prominently in the queue | `DECIDED` |
| Privilege escalation via role | Server-side role checks | `DECIDED` |
| Revoking access | Needs a revoke action — `OPEN QUESTION` | `OPEN QUESTION` |
| Cross-tenant approval | Tenant scoping (P2) | `DECIDED` |
| Audit of approvals | Every approval records actor + timestamp | `DECIDED` |
| Approval as a DoS vector (spam requests) | Rate limiting | `OPEN QUESTION` |

**Accepted risk (`DECIDED`):** the gate is *human*, not physical. A careless or malicious insider can
approve anything. This is a deliberate trade-off for speed.

---

## 12. Data implications

| Entity | Key fields |
|---|---|
| **Ordering access request** | id, tenant_id, table_session_id, customer_session_id, status (`PENDING`/`APPROVED`/`REJECTED`/`EXPIRED`), requested_at, decided_at, decided_by, reason |
| **Table session** | status, `approved_by`, `approved_at`, `rejected_by`, `expires_at` |
| **Audit event** | action=`ORDERING_ACCESS_APPROVED`, actor, target, timestamp |

**Indexes:** `(tenant_id, status='PENDING')` for the approval queue; `(tenant_id, requested_at)` for
wait-time ordering.

---

## 13. Current decision summary

`DECIDED`

Approval is the anti-abuse gate. Scanning grants browsing only. Staff approve **once** per table session,
in **one tap**. All subsequent orders in that session proceed without further approval. Approval is
attributable and audited. GPS and Wi-Fi are explicitly not the mechanism.

**Not decided:** expiry policy, rejection UX, retry policy, rate limits, which roles may approve.

---

## 14. Future considerations

| Feature | Constraint on today's design |
|---|---|
| Revocation | Approve/reject must be symmetric state transitions |
| Time-based auto-expiry | Store `expires_at` now, even if the value is generous |
| Auto-approval for trusted repeat customers | Would weaken the gate; needs care |
| Supplementary signals (Wi-Fi, device fingerprint) | Additive risk scoring, not a replacement |
| Analytics on approval funnel | Requires timestamps on request and decision — store them |
| Approval from a customer-facing device | Would destroy the gate — never |
| Multiple approvals for one table (multi-device) | Session-scoped, not table-scoped approval |

---

## 15. Open questions

| # | Question | Blocking? |
|---|---|---|
| Q1 | Approved session expiry (max duration + idle timeout) | **YES — highest priority** |
| Q2 | Which roles may approve/reject | **Yes — RBAC** |
| Q3 | Rejection UX and retry policy | No |
| Q4 | Rate limits on request creation | **Yes — security** |
| Q5 | Can staff revoke an approval? | Yes |
| Q6 | Second customer scanning an already-active table QR | **Yes — product rule** |
| Q7 | Pending-request auto-expiry window | No |
| Q8 | Manual approval by staff on a customer's behalf | No |

Full register: [`../governance/open-questions.md`](../governance/open-questions.md).