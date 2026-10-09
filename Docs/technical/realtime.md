# Real-Time Updates

Getting order status changes to the customer and to staff without manual refreshing.

**Status: the capability is `DECIDED`. The technology is an `OPEN QUESTION`. Do not assume a transport.**

Related: [`../domain/order-state-machine.md`](../domain/order-state-machine.md) ·
[`api-concepts.md`](api-concepts.md)

---

## 1. What it is

The mechanism by which the customer and staff learn that an order's status has changed.

**Who uses it:** the customer watching their order; staff watching the approval queue and the order
board.

---

## 2. Why it exists

`DECIDED`

- **The customer** is sitting in the restaurant waiting. Manual refresh is unacceptable.
- **Staff** must see incoming orders and approval requests without watching a refresh button.
- UX principle C10 requires status updates without effort.

---

## 3. What must update in real time

| Channel | Events | Audience |
|---|---|---|
| Customer order status | `order.status_changed` | The ordering customer |
| Customer session state | `session.state_changed` (approved!) | The waiting customer |
| Staff approval queue | `ordering_access.requested` | Waiter/Cashier/Manager |
| Staff order board | `order.created`, `order.status_changed` | All staff with order permission |
| Station queues | `order.created`, item status | Kitchen/Barista |
| Bill | `bill.changed`, `bill.settled` | Customer + cashier |

---

## 4. Design requirements

`DECIDED`

| # | Requirement | Why |
|---|---|---|
| R1 | Updates arrive within seconds | The customer is waiting |
| R2 | No manual refresh | C10 |
| R3 | Reconnection shows current truth | A missed event must not leave a stale UI |
| R4 | Events are notifications, not state | Reconnect by fetching |
| R5 | Order submission never depends on the push channel | Push is an enhancement, not a dependency |
| R6 | The same domain events serve both surfaces | One source of truth |
| R7 | Station views update without polling | Kitchen efficiency |
| R8 | The approval queue must not miss a request | Critical path |

---

## 5. Transport options

`OPEN QUESTION` — none selected. Assessed here so the choice is deliberate.

| Option | Advantages | Disadvantages | Fit |
|---|---|---|---|
| **Short polling** | Trivial; no infrastructure; works everywhere | Constant requests; latency; battery; feels dated | Acceptable fallback only |
| **Long polling** | Simple; passes through proxies | Connection per client; connection churn | Decent middle ground |
| **SSE (Server-Sent Events)** | Simple; auto-reconnect; HTTP-native | One-directional (fine here); HTTP/1 connection limits | **Strong candidate** |
| **WebSocket** | Full duplex; lowest latency; mature | More infrastructure; proxy/CDN configuration; two-way auth complexity | Strong candidate |
| **Hosted pub/sub** (Ably/Pusher/etc.) | Fast to build; managed scale; presence | Vendor lock-in; cost per connection; data residency | **Consider strongly** |
| **Native push** | Works when the app is closed | Not applicable to mobile web | Not for now |

### 5.1 Observations

`PROPOSED`

1. **The requirement is one-directional.** The server pushes; the client rarely pushes. That favours SSE
   or managed pub/sub over raw WebSockets.
2. **Connection count is the scaling concern** (architecture §9), and a restaurant display holds a
   connection all service.
3. **Data residency may constrain hosted services** — see
   [`../governance/open-questions.md`](../governance/open-questions.md#legal-compliance).
4. **Reconnection must be automatic and cheap** — restaurant Wi-Fi drops constantly.

### 5.2 Recommendation

`PROPOSED` — **do not choose yet.** Instead:

1. Implement the domain event publish/subscribe abstraction first (`order.status_changed` etc.).
2. Build the UI against a "live updates" interface with two implementations: a polling fallback and the
   eventual real transport.
3. Choose the transport when hosting is decided, since data residency and infrastructure availability
   constrain it.

---

## 6. Event shape

`PROPOSED`

```json
{
  "type": "order.status_changed",
  "tenant_id": "...",
  "scope": { "table_session_id": "...", "order_id": "..." },
  "payload": { "order_id": "...", "previous_status": "PREPARING", "status": "READY", "occurred_at": "..." },
  "version": 1
}
```

| Field | Purpose |
|---|---|
| `type` | Routing |
| `tenant_id` | Isolation of the fan-out channel |
| `scope` | Determining subscribers |
| `payload` | **Informational only** — clients must not trust it as state (R4) |
| `version` | Event schema evolution |

**Rule:** a client that receives a real-time event should still be able to function by polling. Never put
critical business logic in the event payload.

---

## 7. Fan-out and isolation

`DECIDED` requirement

| Channel key (proposed) | Subscribers |
|---|---|
| `session:{customerSessionId}` | That device |
| `table-session:{id}` | Staff views for that table |
| `tenant:{tenantId}:orders` | Staff order board and stations |
| `tenant:{tenantId}:approvals` | Approval queue |

**Mandatory:** tenant-scoped channel keys. A cross-tenant event leak would be a serious breach.

---

## 8. Reconnection

`PROPOSED`

| Concern | Behaviour |
|---|---|
| Network drop | Auto-reconnect with backoff |
| On reconnect | Fetch current state, then resume |
| Stale UI | Show a subtle "reconnecting" indicator; never show a confidently wrong status |
| Long disconnection | Full state refresh |
| Server restart | Client reconnects and re-syncs |

**Critical:** a customer walking out of Wi-Fi range must not see a frozen status. On reconnect, the state
is re-fetched.

---

## 9. Edge cases

| Edge case | Handling | Status |
|---|---|---|
| Push channel down | Fall back to polling; order submission unaffected | `DECIDED` (R5) |
| Staff app backgrounded on a tablet | Reconnect on foreground | `PROPOSED` |
| Hundreds of simultaneous subscribers | Fan-out service must scale | `PROPOSED` |
| Customer closes the tab | Order exists server-side regardless | `DECIDED` (P5, C12) |
| Events arrive out of order | Fetch current state; don't rely on ordering | `DECIDED` (R4) |
| Missing events | Periodic refresh as a safety net | `PROPOSED` |
| Burst: 40 orders in a minute | Queue must remain usable | `PROPOSED` |
| Duplicate events | Idempotent client handling | `DECIDED` |
| Status changed by someone else | Update to current truth | `DECIDED` |
| Very long idle connection | Keepalive + timeout handling | `PROPOSED` |

---

## 10. Security considerations

| Concern | Control | Status |
|---|---|---|
| Cross-tenant event leakage | Tenant-scoped channel keys + authorization on subscribe | `DECIDED` |
| Unauthorised subscription to a table session | Verify the subscriber's session before attaching | `DECIDED` |
| Event payload leaking PII | Minimise payload; re-fetch instead | `PROPOSED` |
| Event spoofing | Server-only publication | `DECIDED` |
| Denial of service via connection exhaustion | Connection limits + rate limiting | `PROPOSED` |

---

## 11. Data implications

No new transactional tables are strictly required — events are transient.

`PROPOSED` for later analysis:
- Real-time delivery is not a durable record; the database is the record.
- Do not rely on the push channel for analytics.
- `last_seen_at` on sessions remains the source for presence/idle logic.

---

## 12. Current decision summary

`DECIDED`

Order and session status must reach customers and staff within seconds without manual refresh. Order
submission never depends on the push channel. Events notify rather than carry authoritative state. Fan-out
is tenant-scoped. Reconnection re-fetches current state.

**Not decided:** transport (SSE vs. WebSocket vs. hosted pub/sub vs. polling), hosting, latency budget.

---

## 13. Future considerations

| Feature | Constraint |
|---|---|
| Customer push notifications when the tab is closed | Needs a push service, not a socket |
| Typing indicators / live cart sharing | Would make it two-directional |
| Kitchen display sound alerts | Server-pushable event |
| Multi-device sync of one cart | Requires a shared cart model |
| Live "someone else is ordering" awareness | Requires presence |

---

## 14. Open questions

| # | Question | Blocking? |
|---|---|---|
| Q1 | **Transport choice** | **Yes — but abstract first** |
| Q2 | Hosted service allowed (data residency)? | **Yes — legal** |
| Q3 | Latency target | No |
| Q4 | Fallback polling interval | No |
| Q5 | Do we need presence/typing later? | No |
| Q6 | Notification when the tab is closed | No |

Full register: [`../governance/open-questions.md`](../governance/open-questions.md).