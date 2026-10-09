# Roles and Permissions

Role-based access control for restaurant staff.

Related: [`security.md`](security.md) · [`../flows/staff-flow.md`](../flows/staff-flow.md) ·
[`audit-log.md`](audit-log.md)

---

## 1. What it is

The permission model that determines what each staff member can see and do inside one tenant.

**Who uses it:** Owner and Manager (assign roles); every staff member (subject to it).

---

## 2. Why it exists

`DECIDED`

> "Do not hard-code the system around only one employee role called 'accountant'."

Different employees do genuinely different things. A barista should not be able to settle a bill; a
kitchen worker should not be able to change a price. Without RBAC, either everyone can do everything
(unauditable, risky) or the product is built for one person (unusable).

### 2.1 Two roles of RBAC

| Role of RBAC | Effect |
|---|---|
| **Security** | Prevent privilege escalation and financial tampering |
| **UX** | Kitchen staff see a kitchen screen, not a dashboard (S5) |

Both are `DECIDED` — RBAC constrains not only permissions but **default views**.

---

## 3. Roles

`DECIDED` (the roles exist) · `OPEN QUESTION` (the exact matrix)

| Role | Persian | Primary job |
|---|---|---|
| **Owner** | مالک | Full control; subscription; staff |
| **Manager** | مدیر | Day-to-day operations |
| **Cashier** | صندوق‌دار | Approvals, orders, tables, bills, payments |
| **Waiter** | سرویس | Approvals, order progression, delivery |
| **Kitchen** | آشپزخانه | Kitchen station queue |
| **Barista** | باریستا | Bar station queue |

---

## 4. Permission matrix

**`PROPOSED` — a proposal for the founders to confirm, not a decision.**

Legend: **✓** full · **◐** limited · **✗** none · **·** n/a

| Capability | Owner | Manager | Cashier | Waiter | Kitchen | Barista |
|---|---|---|---|---|---|---|
| View menu (read) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Edit menu | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| Manage tables | ✓ | ✓ | ✓ | ◐ | ✗ | ✗ |
| Download / regenerate QR | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| **Approve ordering access** | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ |
| Reject ordering access | ✓ | ✓ | ✓ | ◐ | ✗ | ✗ |
| View orders | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Confirm / accept order | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ |
| Start preparing | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Mark ready | ✓ | ✓ | ◐ | ✓ | ✓ | ✓ |
| Mark delivered | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ |
| **Cancel order** | ✓ | ✓ | ✓ | ◐ | ✗ | ✗ |
| View bill | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ |
| **Apply discount** | ✓ | ✓ | ? | ✗ | ✗ | ✗ |
| **Record settlement / payment** | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| Close table session | ✓ | ✓ | ✓ | ◐ | ✗ | ✗ |
| Revoke approval | ✓ | ✓ | ◐ | ✗ | ✗ | ✗ |
| Manage staff | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| Assign roles | ✓ | ◐ | ✗ | ✗ | ✗ | ✗ |
| View reports | ✓ | ✓ | ◐ | ✗ | ✗ | ✗ |
| Manage subscription | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Manage settings / slug | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| View audit log | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| Station queues | all | all | all | all | Kitchen | Bar |

**Cells marked `?` are genuinely open** — notably **discount permissions** (see
[`../governance/open-questions.md`](../governance/open-questions.md#business)).

### 4.1 Observations that need decisions

| # | Question |
|---|---|
| RP1 | Which roles may approve ordering access? (Proposal: Owner, Manager, Cashier, Waiter — because it must be fast and available) |
| RP2 | Which roles may cancel an order, at what stage? |
| RP3 | Who may apply a discount? (Cashier? Manager only? Owner only?) |
| RP4 | May an Owner assign the Owner role? |
| RP5 | May a Manager create other Managers? |
| RP6 | Is there a single "Kitchen" role, or kitchen station roles are per-station? |
| RP7 | Can one staff member hold multiple roles? (`PROPOSED`: yes) |
| RP8 | Are custom roles needed? (`FUTURE` — probably not MVP) |
| RP9 | Is a role bound to a station, or are stations a separate assignment? |

---

## 5. Model

### 5.1 Role-based vs. permission-based

`PROPOSED`

| Approach | Description |
|---|---|
| **Role → permission set** | Simple; the MVP recommendation |
| **Direct permissions per staff** | More flexible; confusing for a restaurant owner |
| **Both** | Roles as bundles, with optional per-staff overrides |

**Recommendation:** roles as named permission bundles in MVP. Store permissions as data (not hard-coded
`if role == 'cashier'` branches) so a bundle can be adjusted without code changes.

### 5.2 Permission naming

`PROPOSED` — atomic capabilities, resource-scoped:

```
menu.read
menu.write
tables.read
tables.write
tables.qr
sessions.approve
sessions.reject
sessions.revoke
sessions.close
orders.read
orders.confirm
orders.prepare
orders.ready
orders.deliver
orders.cancel
bills.read
bills.discount
bills.settle
staff.read
staff.write
reports.read
settings.write
subscription.manage
audit.read
```

### 5.3 Role → permission assignment

| Role | Permissions (`PROPOSED`) |
|---|---|
| Owner | all |
| Manager | all except `subscription.manage`, `settings.write` |
| Cashier | menu.read, tables.read/write, sessions.*, orders.*, bills.read/discount/settle, reports.read, staff.read |
| Waiter | menu.read, tables.read, sessions.approve/reject, orders.read/confirm/prepare/ready/deliver, bills.read |
| Kitchen | menu.read, orders.read/prepare/ready |
| Barista | menu.read, orders.read/prepare/ready |

---

## 6. Staff entity

`DECIDED`

| Field | Notes |
|---|---|
| Tenant | Scoping |
| Name | Display |
| Contact (email or phone) | Depends on the auth method (`OPEN QUESTION`) |
| Roles | One or more |
| Status | Active / invited / disabled |
| Invited by, invited at | Traceability |
| Auth identity | Depends on the auth method |

**Inviting staff (`OPEN QUESTION`):** how a new employee gets access — an invite link, a shared code from
the Owner, a phone number? This affects the auth method choice.

---

## 7. Business rules

| # | Rule | Status |
|---|---|---|
| RP-1 | Every staff member has at least one role | `DECIDED` |
| RP-2 | Authorization is enforced server-side on every action | `DECIDED` |
| RP-3 | A staff member cannot grant a permission they don't hold | `PROPOSED` |
| RP-4 | The last active Owner cannot be removed or demoted | `PROPOSED` — essential |
| RP-5 | Role changes are audited | `DECIDED` |
| RP-6 | Disabling a staff member invalidates their sessions promptly | `PROPOSED` |
| RP-7 | Roles restrict default views, not just actions | `DECIDED` |
| RP-8 | One staff member may hold multiple roles | `PROPOSED` |
| RP-9 | The Owner role cannot be deleted | `PROPOSED` |

---

## 8. Edge cases

| Edge case | Handling | Status |
|---|---|---|
| Staff member changes roles mid-shift | Sessions must reflect the new permissions | `PROPOSED` |
| Owner leaves the business | Transfer ownership; the last owner cannot be removed | `PROPOSED` |
| Staff disabled but currently logged in | Session invalidated | `PROPOSED` |
| One person covers kitchen and cashier | Multiple roles | `PROPOSED` |
| A restaurant has no manager | Owner performs both roles | `DECIDED` |
| Cashier needs to change a price urgently | Escalation path `OPEN QUESTION` | `OPEN QUESTION` |
| Role permissions change after deployment | Data-driven permissions avoid a release | `PROPOSED` |
| New staff member on a shared tablet | Session/attribution policy `OPEN QUESTION` | `OPEN QUESTION` |
| Staff member views another tenant | Impossible — tenant bound at auth | `DECIDED` |

---

## 9. Security considerations

| Concern | Control | Status |
|---|---|---|
| Privilege escalation via a client-supplied role | Server-side permission check on every action | `DECIDED` |
| Mass assignment of `role`/`tenant_id` | Strict field allowlists | `DECIDED` |
| A manager escalating to Owner | Cannot grant permissions they don't hold (RP-3) | `PROPOSED` |
| Cached permissions in the client | Never trust; re-check server-side | `DECIDED` |
| Shared-device impersonation | Per-action attribution; auth method `OPEN QUESTION` | `OPEN QUESTION` |
| Stale sessions after a role change | Short permission cache TTL or no cache | `PROPOSED` |
| Financial tampering | Discount/settlement permission restricted + audit | `DECIDED` |
| Auditing role changes | Audit event with actor, target, before/after | `DECIDED` |

**Non-negotiable:** a hidden button is not authorization. Every endpoint must independently verify the
acting staff member's permissions.

---

## 10. Data implications

| Entity | Key fields |
|---|---|
| **Staff member** | id, tenant_id, name, contact, status, invited_by, invited_at, disabled_at |
| **Role** | id, key (canonical name), name_fa, is_system |
| **Permission** | key, description |
| **Role → permission** | role_id, permission_key |
| **Staff → role** | staff_id, role_id |
| *(reserved)* | station assignments per staff |

Role definitions should be **data, seeded by the system**, so adding a role or adjusting a bundle is a data
change. **Indexes:** `(tenant_id, status)` for staff listing.

**Note:** roles are per-platform but scoped to tenants; permissions are global.

---

## 11. Current decision summary

`DECIDED`

Staff have roles; roles carry permissions; permissions are enforced server-side. The named roles are
Owner, Manager, Cashier, Waiter, Kitchen, Barista. Roles determine both what a user can do and what they
see by default. Role changes are audited. The system must not be built around a single "accountant" role.

**Not decided:** the exact matrix, approval permissions, discount permissions, cancellation permissions,
station binding, custom roles, staff invitation flow, auth method.

---

## 12. Future considerations

| Feature | Constraint on today's model |
|---|---|
| Custom roles | The permission model must be data-driven from day one |
| Per-branch roles | Roles are tenant-scoped; branch scope needs adding |
| Shift-based access | Sessions tied to shifts |
| Fine-grained kitchen permissions | Per-station permissions |
| Delegated temporary access | Time-boxed grants |
| Two-person approval for discounts | Approval workflow entities |

---

## 13. Open questions

| # | Question | Blocking? |
|---|---|---|
| Q1 | Final permission matrix per role | **Yes — blocks RBAC implementation** |
| Q2 | Which roles may approve ordering access? | **Yes** |
| Q3 | Who may apply discounts? | **Yes** |
| Q4 | Who may cancel an order, at which stage? | Yes |
| Q5 | Can a staff member hold multiple roles? | No |
| Q6 | Station binding model | Yes |
| Q7 | Staff invitation flow | Yes |
| Q8 | Are custom roles needed in MVP? | No |
| Q9 | Can a Manager assign the Owner role? | No |

Full register: [`../governance/open-questions.md`](../governance/open-questions.md).