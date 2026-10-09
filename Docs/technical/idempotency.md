# Idempotency and Duplicate-Order Protection

How a double tap never becomes two real orders.

Related: [`api-concepts.md`](api-concepts.md) · [`../domain/order-system.md`](../domain/order-system.md)

---

## 1. The problem

`DECIDED`

```
Customer taps "Submit Order"
        ↓
Network is slow
        ↓
Customer taps again
        ↓
???

The backend must NOT create two identical orders.
```

For a restaurant, a duplicate order means: food made twice, thrown away once, a confused table, and a
cashier refunding money. It is a direct, immediate cost.

---

## 2. What it is

The mechanism ensuring that one *logical* submission produces exactly one order, no matter how many
times the request is sent.

---

## 3. Approach

### 3.1 Client-generated idempotency key

`DECIDED`

```
Customer builds a cart
        ↓
Taps Submit
        ↓
Client generates a unique key for THIS submit attempt
   (e.g. a UUID, stable for retries of the same attempt)
        ↓
POST order  { ..., "idempotency_key": "9f2c..." }
        ↓
Server:
  • looks up (tenant, principal, operation, key)
  • FOUND     → return the original response, do NOT create a second order
  • NOT FOUND → create the order, store the key with the result
```

### 3.2 Rules

`DECIDED`

| # | Rule |
|---|---|
| ID1 | A new key is generated for each *distinct* submission attempt |
| ID2 | Retries of the *same* attempt reuse the same key |
| ID3 | A replay returns the original result, with the original status code |
| ID4 | The key is scoped: tenant + principal + operation + key |
| ID5 | Concurrent identical requests produce exactly one order |
| ID6 | A key reused with a *different* payload is a conflict, not a silent success |
| ID7 | The record is retained long enough to cover realistic retries |
| ID8 | Order submission never depends on the client getting the response |

### 3.3 Why client-generated, not server-side heuristics

`PROPOSED`

Server-side "same table + same items within 60 seconds" heuristics **reject legitimate repeat orders** —
a table may genuinely order two identical cappuccinos within a minute. The client knows whether it is
retrying; the server can only guess. Guessing wrongly either duplicates orders or drops real ones.

---

## 4. Handling the awkward cases

| Case | Handling | Status |
|---|---|---|
| Network drop before the request reaches the server | Retry with the same key → creates the order | `DECIDED` |
| Request reaches the server, response is lost | Retry with the same key → returns the original | `DECIDED` |
| Client retries while the first is still processing | One order; the retry waits or returns the eventual result | `PROPOSED` |
| Same key, different items | **Conflict error** — never silently create or silently return | `DECIDED` (ID6) |
| Customer genuinely wants the same order twice | New key, new submission | `DECIDED` |
| Two different tabs submit the same cart | Different keys → two orders (correct, if unintended by the user) | `DECIDED` |
| Key expires and is reused | Treated as a new submission | `PROPOSED` |
| Server restarts mid-request | Transactional store means the record is either fully written or not | `PROPOSED` |

---

## 5. Which operations need it

`DECIDED`

| Operation | Idempotency required? |
|---|---|
| **Order submission** | **Absolutely** |
| Ordering access request | Yes — double taps shouldn't create two requests |
| Order status actions | Partially — repeat "approve" should be a benign no-op |
| Settlement recording | Yes |
| Discount application | Yes |
| Session creation | Not required |
| Menu edits | Not required |
| QR regeneration | **No** — must be a real new action each time |

---

## 6. Implementation notes

`PROPOSED`

- A unique constraint on `(tenant_id, principal_id, operation, key)` makes concurrency safe at the
  database level — the second concurrent insert fails and can be handled as a replay.
- The record stores a request fingerprint (a hash of the payload) plus a reference to the created
  resource.
- **The order and the idempotency record must be written in the same transaction** — otherwise a crash
  between them produces an order with no key, and a retry creates a duplicate.
- Retention: hours-to-days is sufficient (`OPEN QUESTION` for the exact period).

---

## 7. Related protections

Idempotency is one layer. These complement it:

| Protection | Prevents |
|---|---|
| Rate limiting (security.md §8) | Order flooding |
| Approval gate (approval-system.md) | Fake orders from outside |
| Server-side price resolution | Price tampering |
| Audit logging | Detection of systematic abuse |

---

## 8. Business rules

| # | Rule | Status |
|---|---|---|
| IQ1 | Order submission is idempotent | `DECIDED` |
| IQ2 | A replay returns the original order | `DECIDED` |
| IQ3 | A key reused with a different payload is rejected | `DECIDED` |
| IQ4 | Two genuine identical orders are allowed with different keys | `DECIDED` |
| IQ5 | Time-window heuristics are not the primary mechanism | `PROPOSED` |
| IQ6 | The order and the key record commit atomically | `PROPOSED` |

---

## 9. Testing this

`PROPOSED`

| Test | Expectation |
|---|---|
| Same key twice, sequentially | One order; identical response |
| Same key twice, concurrently | One order |
| Same key, different payload | Conflict error; no order created |
| Different keys, same payload | Two orders (correct) |
| Response lost, then retried | One order |
| Record retention window elapsed | Treated as new |

**This is the single most important automated test in the ordering path.**

---

## 10. Open questions

| # | Question | Blocking? |
|---|---|---|
| Q1 | Idempotency record retention period | No |
| Q2 | Conflict error copy for the customer | No |
| Q3 | Do multi-tab submissions need a shared key? | No |
| Q4 | Apply idempotency to order status actions? | No |

Full register: [`../governance/open-questions.md`](../governance/open-questions.md).