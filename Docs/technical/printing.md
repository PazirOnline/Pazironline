# Printing

**DELIBERATELY UNSPECIFIED.** The founders own a potential printing solution and will provide it later.
This document records the constraints it must satisfy, not an implementation.

`DO NOT ASSUME` any printer model, protocol, agent, or integration.

Related: [`../domain/kitchen-and-bar.md`](../domain/kitchen-and-bar.md) ·
[`../flows/staff-flow.md`](../flows/staff-flow.md) §7

---

## 1. Why this document exists

Printing is one of the areas where restaurants differ most, and where premature design is most costly.
The brief explicitly says: *"Do NOT invent a final printer implementation yet."*

So this document does three things only:

1. States what printing must **not** break.
2. Lists the open questions.
3. Records the constraints on the data model.

---

## 2. Decided constraints

`DECIDED`

| # | Constraint |
|---|---|
| PR1 | The product must work **without** any printer |
| PR2 | The product must work **with** a printer as the only kitchen interface |
| PR3 | The product must work with **both** a printer and a display |
| PR4 | Printed output is **derived** state, never the source of truth |
| PR5 | No design may assume a monitor exists (P16) |
| PR6 | Printing must not block order submission |
| PR7 | A lost ticket must never mean a lost order |
| PR8 | Order status is driven by the application, not by the printer |

---

## 3. Open questions

All `OPEN QUESTION` — **founder-owned**:

| # | Question |
|---|---|
| Q1 | What is the founder's printing solution? Hardware, software, protocol? |
| Q2 | Does printing run on the restaurant's network, ours, or a cloud bridge? |
| Q3 | Is it a local agent on a small server in the restaurant? |
| Q4 | Per-station printers, or one printer for the kitchen and one for the bar? |
| Q5 | Does an order spanning two stations print one ticket or two? |
| Q6 | Does printing advance the order status, or is status advanced separately? |
| Q7 | What happens on printer failure — retry, queue, alert, fallback to the app? |
| Q8 | Ticket content and layout — what fields does the kitchen need? |
| Q9 | Is a customer receipt in scope? |
| Q10 | Who owns the hardware — the restaurant or us? |
| Q11 | Does the solution support multiple restaurants remotely? |
| Q12 | Persian text rendering on the printer — a real technical risk |

**Q12 deserves attention:** Persian is a complex script and thermal printers are a known weak point.
Typography on paper is a genuine engineering risk.

---

## 4. Data model implications

`PROPOSED` — reserved for later, not designed now.

| Entity (FUTURE) | Purpose |
|---|---|
| `Printer` | tenant_id, station_id?, type, connection reference |
| `PrintJob` | order_id, station_id, content/rendering ref, status, attempts, printed_at |

**Design guidance regardless of the solution chosen:**

- Print jobs should be tied to a **station**, not to a tenant globally — multi-printer is a known future
  need.
- Print job status should be tracked **independently** of order status, so a failed print is visible
  without corrupting the order.
- If printing ever becomes async, it must run in a **worker decoupled from the request path** (see
  architecture §3), so a slow printer never delays order submission.

---

## 5. Operational questions

`OPEN QUESTION`

| # | Question |
|---|---|
| Q1 | Who installs and maintains printers at the restaurant? |
| Q2 | Is this a support cost in the subscription? |
| Q3 | What happens when a restaurant's internet drops and the printer is cloud-connected? (P9 forbids offline design, but printers may be local) |
| Q4 | Is there a per-printer cost in the plan? |
| Q5 | Hardware failure support? |

**Note on Q3:** P9 forbids designing an **offline-first application**. A local printer bridge is a
different thing — but it must not pull the whole system into offline-sync territory. Flagged for the
founder's solution review.

---

## 6. Current decision summary

`DECIDED`

Printing is optional at every level. The product works without printers, with printers only, or with both.
Printed output is derived state. Status is driven by the application. Printing never blocks order
submission. The printing implementation is explicitly undecided and founder-owned.

---

## 7. What to do when the founders provide the solution

`PROPOSED` checklist:

1. Record the solution in a new doc (`technical/printing-implementation.md`) with a decision-log entry.
2. Check it against PR1–PR8.
3. Map it onto the reserved data model — does it need `Printer`/`PrintJob`?
4. Confirm station routing (Q5) — this is the most common source of rework.
5. Confirm the status question (Q6) — this interacts directly with the order state machine.
6. Confirm Persian rendering (Q12) before promising anything.
7. Update `governance/decision-log.md` and `changelog.md`.