# Simulation Lifecycle Documentation: Pizza Empire Tycoon

**Document Version:** 1.0  
**References:** [SYSTEM_ARCHITECTURE.md](file:///home/rana/Downloads/pizz%20games%20(copy)/pizza-empire/documentation/SYSTEM_ARCHITECTURE.md) | [DATABASE_DESIGN.md](file:///home/rana/Downloads/pizz%20games%20(copy)/pizza-empire/documentation/DATABASE_DESIGN.md)

---

## 1. Core Design Principle: Server-Controlled Timestamp Simulation

Pizza Empire Tycoon **never** spawns per-employee, per-crop, or per-business `setInterval` timers. Instead, all progression is driven by **UTC timestamps stored in MySQL 8** and evaluated lazily when a player syncs (`/api/v1/game/sync`) or acts, complemented by a single lightweight `SimulationScheduler` for global maintenance sweeps.

### Key Guarantees
1. **Backend Source of Truth:** Client UIs interpolate timers visually but never submit cash, XP, or yields.
2. **Row-Level Serialization (`FOR UPDATE`):** Every `syncEmpire` call locks the player's `player_profiles` row inside a `mysql2/promise` transaction, preventing concurrent sync race conditions.
3. **No Duplicate Production Completion:**
   - `farm_plots`: Only rows with `status = 'GROWING' AND ready_at <= UTC_TIMESTAMP()` transition to `READY`.
   - `production_orders`: Locked with `FOR UPDATE` and transitioned atomically `IN_PROGRESS -> COMPLETED` before crediting `business_inventory`.
4. **No Duplicate Financial Transactions:** `EconomyService.recordCashTransaction` locks the wallet row (`FOR UPDATE`) and checks `reference_id` idempotency before inserting into `financial_transactions`.

---

## 2. Sync & Simulation Lifecycle Flow

```mermaid
sequenceDiagram
    participant C as React Client
    participant GE as GameEngineService
    participant PP as ProductionProcessor
    participant OFF as OfflineService
    participant DB as MySQL 8 (Transaction)

    C->>GE: POST /api/v1/game/sync
    GE->>DB: BEGIN + SELECT player_profiles FOR UPDATE
    GE->>PP: processCompletedProduction(playerId)
    PP->>DB: Mature GROWING plots & complete IN_PROGRESS orders
    GE->>GE: Compute elapsed = now - last_tick_at
    alt elapsed >= 300s (Offline Threshold)
        GE->>OFF: calculateOfflineEarnings (capped, 60% rate)
        OFF->>DB: Stage unclaimed offline_earnings_sessions row
    else Active Session (< 300s)
        GE->>DB: Prorate workforce output, wages & upkeep
    end
    GE->>DB: Apply XP & update last_tick_at + COMMIT
    GE-->>C: Return SyncEmpireResult (+ pendingOfflineSession if any)
```

---

## 3. Module Responsibilities

| Component | File | Responsibility |
| :--- | :--- | :--- |
| **Time Utilities** | [simulationTime.ts](file:///home/rana/Downloads/pizz%20games%20(copy)/pizza-empire/backend/src/utils/simulationTime.ts) | Clamped elapsed seconds, hour conversion, `floor(100 * L^1.85)` XP curve |
| **Economy Service** | [economy.service.ts](file:///home/rana/Downloads/pizz%20games%20(copy)/pizza-empire/backend/src/services/economy.service.ts) | Employee productivity (skill, morale, strike `<20%`, shift lead), atomic `FOR UPDATE` cash ledger |
| **Production Processor** | [productionProcessor.service.ts](file:///home/rana/Downloads/pizz%20games%20(copy)/pizza-empire/backend/src/services/productionProcessor.service.ts) | Matures ready farm plots and deposits completed factory/oven orders into `business_inventory` |
| **Offline Service** | [offline.service.ts](file:///home/rana/Downloads/pizz%20games%20(copy)/pizza-empire/backend/src/services/offline.service.ts) | Computes capped offline earnings (`60%` rate, zero-negative protection) and idempotent claiming |
| **Game Engine** | [gameEngine.service.ts](file:///home/rana/Downloads/pizz%20games%20(copy)/pizza-empire/backend/src/services/gameEngine.service.ts) | Orchestrates full player sync inside a single ACID transaction |
| **Background Scheduler** | [scheduler.ts](file:///home/rana/Downloads/pizz%20games%20(copy)/pizza-empire/backend/src/jobs/scheduler.ts) | Single overlap-guarded coordinator for token cleanup and delivery arrival sweeps |
