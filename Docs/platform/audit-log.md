# Audit Log

The append-only record of important actions.

Related: [`security.md`](security.md) · [`roles-and-permissions.md`](roles-and-permissions.md) ·
[`../governance/decision-log.md`](../governance/decision-log.md)

---

## 1. What it is

An immutable log of security-relevant and money-relevant events: who did what, to which object, when,
from where, and what changed.

**Who uses it:** the Owner, the Manager (investigating), the platform (abuse detection, support).

---

## 2. Why it exists

`DECIDED` (principle P19)

The brief's example:

```
Order #5821
Cancelled by: Ali
Time: 19:42
Reason: Customer request
```

An audit log answers, after the fact:

- Who approved that table?
- Who gave that discount?
- Who cancelled that order and why?
- Who changed that price, and when?
- Did a staff member exceed their permissions?

It does **not** prevent actions. It makes them **attributable**. For a business where cash and food
leave the building, that is essential.

---

## 3. What must be audited

`DECIDED`

| Event | Category |
|---|---|
| Order cancelled | Order |
| Order status changed | Order |
| Price changed | Menu |
| Product disabled / enabled | Menu |
| Product archived | Menu |
| Staff permission changed | Access |
| Staff role assigned/revoked | Access |
| Staff invited / disabled | Access |
| Table session closed | Session |
| Ordering access approved | Approval |
| Ordering access rejected | Approval |
| Discount applied | Billing |
| Settlement recorded | Billing |
| Table created / archived / QR regenerated | Tables |
| Tenant subscription state changed | Platform |

`PROPOSED` additions:

| Event | Category |
|---|---|
| Order rejected | Order |
| Customer session created / closed | Session |
| Failed login attempts | Access |
| Rate limit triggered | Abuse |
| Settings changed | Tenant |

---

## 4. Audit entry structure

`PROPOSED`

| Field | Notes |
|---|---|
| id | |
| tenant_id | Scoping |
| occurred_at | UTC, server-assigned |
| actor_type | `STAFF` / `CUSTOMER` / `SYSTEM` / `PLATFORM` |
| actor_staff_id | Nullable for system/customer |
| actor_role_snapshot | The role at the time — captures a later role change correctly |
| action | Canonical action name, e.g. `ORDER_CANCELLED` |
| target_type | `ORDER` / `TABLE` / `PRODUCT` / `STAFF` / `BILL` / … |
| target_id | |
| before_state | JSON snapshot (nullable) |
| after_state | JSON snapshot (nullable) |
| reason | Free text where a reason is required |
| source_ip | |
| user_agent | |
| request_id | Correlates API logs |

### 4.1 Why the actor's role is snapshotted

`PROPOSED` — because if you later look up `staff.role`, you get the role they hold **now**, not the role
they held when they performed the action. For an audit trail, that is wrong.

### 4.2 Why the IP/user agent are stored

`PROPOSED` — to detect shared or compromised credentials, and to support abuse investigations. Note the
privacy dimension: IPs are personal data in many jurisdictions.

---

## 5. Immutability

`DECIDED` (principle: audit records must be trustworthy)

| Rule | Detail |
|---|---|
| Append-only | No update, no delete through the application |
| No application delete endpoint | Ever |
| Corrections | A new corrective entry, never an edit |
| Server-assigned timestamps | A client cannot backdate |
| Retention | `OPEN QUESTION` — see §7 |

**Implementation note (`PROPOSED`):** separate audit writes from ordinary entity updates, and give the
audit table no ORM path to update/delete. Consider database-level protection.

---

## 6. Reading the audit log

`PROPOSED`

| View | Who |
|---|---|
| Per object (an order's full history) | Manager/Owner |
| Per actor (what did this staff member do) | Manager/Owner |
| Filtered by action type / date range | Manager/Owner |
| Platform-wide, across tenants | Platform operator only — separate access path |

**Requirements:** pagination, date filtering, actor filtering, action filtering, and a readable Persian
timeline for the common cases (an order's history).

**Not required in MVP:** an analytics dashboard, alerting, export. But the *data* must be queryable so
those are later additions.

---

## 7. Retention

`OPEN QUESTION`

| Question | Why it matters |
|---|---|
| Minimum retention period | Legal / tax requirements in Iran; disputes |
| Maximum retention | Privacy obligations |
| Delete-on-tenant-cancellation interaction | A tenant cancelling shouldn't erase a legal record — or maybe it should |
| Is the audit log exportable to the tenant? | Portability / trust |

**Flagged as legal/compliance** in
[`../governance/open-questions.md`](../governance/open-questions.md#legal-compliance).

---

## 8. Edge cases

| Edge case | Handling | Status |
|---|---|---|
| Bulk action (e.g. disable 20 products) | One entry per product, or one with a target list | `PROPOSED` |
| Staff performs many actions quickly | No issue; entries are cheap |
| System-initiated status change | `actor_type = SYSTEM` | `PROPOSED` |
| Customer action (submitting an order) | Recorded — customer orders are auditable | `PROPOSED` |
| Audit write fails while the action succeeds | The action must still succeed; log the failure | `PROPOSED` — **do not fail business operations for audit writes** |
| Log volume grows large | Partitioning/archival `FUTURE` | `FUTURE` |
| Reason required but not supplied | Reject the action | `PROPOSED` |
| Sensitive data in before/after snapshots | Redact PII by default | `PROPOSED` |

The audit-failure rule matters: an audit-write outage must not stop a restaurant taking orders. Log the
audit failure itself and alert.

---

## 9. Security considerations

| Concern | Control | Status |
|---|---|---|
| Tampering with audit records | Append-only; no update/delete path | `DECIDED` |
| Audit log leaking cross-tenant data | Tenant-scoped reads | `DECIDED` |
| Staff reading the audit log without permission | `audit.read` permission | `DECIDED` |
| Platform operator reading tenant audits | Separate, tightly controlled access path | `PROPOSED` |
| Forged timestamps | Server-assigned | `DECIDED` |
| Audit used to spy on staff | Policy question — `OPEN QUESTION` | `OPEN QUESTION` |
| PII inside snapshots | Redaction policy | `PROPOSED` |
| Very large before/after blobs | Cap size; reference the entity instead | `PROPOSED` |

---

## 10. Data implications

| Entity | Key fields |
|---|---|
| **Audit event** | id, tenant_id, occurred_at, actor_type, actor_staff_id?, actor_role_snapshot?, action, target_type, target_id, before_state?, after_state?, reason?, source_ip?, user_agent?, request_id? |

**Indexes:**
- `(tenant_id, occurred_at DESC)` — the main timeline
- `(tenant_id, target_type, target_id, occurred_at)` — per-object history
- `(tenant_id, actor_staff_id, occurred_at DESC)` — per-actor
- `(tenant_id, action, occurred_at)` — filtered analysis

**Volume note (`PROPOSED`):** an audit entry per order status change is ~6–10 entries per order. At
1000 orders/day for a tenant that is manageable; the platform total needs partitioning from the start.

---

## 11. Current decision summary

`DECIDED`

Important actions are auditable. The audit log is append-only with actor, action, target, timestamp, and
reason. Order cancellation, status changes, price changes, product disabling, permission changes, session
closure, and discounts are all in scope. Staff actions are attributable.

**Not decided:** retention periods, export, alerting, whether audit writes may fail silently, who can read
platform-wide audits.

---

## 12. Future considerations

| Feature | Constraint on today's model |
|---|---|
| Compliance export | Structured, queryable records |
| Alerting on suspicious patterns | Needs indexed action/actor fields |
| Full before/after diffs | `before_state`/`after_state` must be JSON-capable |
| Time-travel debugging | Stable action names |
| Customer-visible history (their own orders) | Separate concern from staff audit |
| Regulator-required retention | Retention configuration |

---

## 13. Open questions

| # | Question | Blocking? |
|---|---|---|
| Q1 | Retention period (legal minimums in Iran) | **Legal — before launch** |
| Q2 | Must audit records survive tenant cancellation? | **Legal/business** |
| Q3 | Can the tenant export its audit log? | No |
| Q4 | Alerting on anomalies | No |
| Q5 | Do we audit customer actions (order submission)? | No |
| Q6 | PII redaction policy in snapshots | No |
| Q7 | Can audit writes fail without blocking the action? | **Yes — reliability decision** |

Full register: [`../governance/open-questions.md`](../governance/open-questions.md).