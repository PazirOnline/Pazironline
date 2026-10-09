# Offline and Sync

**Why this document exists:** so that nobody later "helpfully" adds an offline queue, and so the
consequences of the offline exclusion are understood.

Related: [`../product/product-principles.md`](../product/product-principles.md) (P9) ·
[`architecture.md`](architecture.md)

---

## 1. The decision

`DECIDED`

> Offline operation is explicitly **OUT OF SCOPE**. Do not design an offline-first system. Do not add
> unnecessary offline synchronization complexity. The product assumes an active internet connection.

---

## 2. What this rules out

| Ruled out | Why it would be tempting |
|---|---|
| Local write queues | A user might lose an order in a dead spot |
| Conflict resolution | The classic hard problem |
| Local-first database | Elegant, but massive complexity |
| Reconciliation jobs | Needed only if there are divergent writes |
| Delta sync protocol | Needed only if data lives in two places |
| Offline QR scanning with delayed submission | Would break the approval gate |
| Cached order submission | Would break idempotency guarantees |

---

## 3. What it still requires

Being offline-unaware is not the same as being offline-hostile.

`PROPOSED` — the product should still behave well:

| Situation | Required behaviour |
|---|---|
| No connection detected | A clear Persian message, not a silent hang or a raw error |
| Menu already cached | Show it, with a subtle staleness hint |
| Submit fails mid-flight | Retry with the same idempotency key (safe — see idempotency.md) |
| Real-time channel drops | Fall back to polling; order truth unaffected |
| Staff device disconnects | Queue reconnects and re-syncs |
| Slow network | Loading states that feel intentional, disabled duplicate-submit buttons |

**Key insight:** **retry-safety is not offline mode.** Retrying a failed request with an idempotency key
is exactly what a good online client does. That is in scope. Building a local outbox is not.

---

## 4. Where restaurants genuinely lose connectivity

`PROPOSED` — real situations, and what we do about each:

| Situation | Response |
|---|---|
| Basement / interior with weak signal | Retry; clear messaging; no data loss (order not created until acknowledged) |
| Customer walks out of range mid-cart | Cart is client-side; preserved locally |
| Internet outage at the restaurant | **Ordering is unavailable.** The restaurant reverts to manual ordering — their problem to solve, not ours, for MVP |
| Printer local but internet down | Printer works; the app doesn't. `OPEN QUESTION` — depends on the founder's solution |
| Staff tablet on a flaky network | Reconnect; the app is not the source of truth |

---

## 5. The honest trade-off

`DECIDED` by the founders

| Benefit of excluding offline | Cost we accept |
|---|---|
| Far simpler architecture | The restaurant can't take orders during an internet outage |
| No sync bugs | That's a real operational risk for some cafés |
| No conflict resolution | — |
| Faster delivery of the MVP | — |

**Mitigation (`PROPOSED`):** the product must degrade *gracefully and honestly* — a clear message telling
the staff to take the order manually, not a confusing failure.

---

## 6. Do not add

`DO NOT ASSUME` — none of these belong in this product's scope:

- A local-first database (RxDB, PouchDB, SQLite client)
- An outbox/sync queue
- Conflict resolution UI
- Delta sync endpoints
- Background sync on reconnect
- "Works offline" marketing claims

---

## 7. If it is ever revisited

`FUTURE` — conditions that would justify reconsidering:

1. Multiple restaurants report frequent outages in a specific area.
2. A paying customer will pay specifically for offline capability.
3. The architecture has already proven its online model and has headroom.

**Cost to add later:** high. That is a conscious, accepted trade-off.

---

## 8. Cross-references

- P9 in [`../product/product-principles.md`](../product/product-principles.md)
- Retry-safety: [`idempotency.md`](idempotency.md)
- Reconnection: [`realtime.md`](realtime.md)
- Printing during an outage: [`printing.md`](printing.md) §5