# Game Design Document (GDD): Pizza Empire Tycoon

**Document Version:** 1.0  
**Reference:** [PRD.md](file:///home/rana/Downloads/pizz%20games%20(copy)/pizza-empire/documentation/PRD.md)  
**Genre:** Commercial Browser-Based Idle Tycoon & Supply-Chain Business Simulation  
**Target Platform:** Web Browser (Desktop & Mobile Responsive)

---

## 1. Player Progression (Levels 1–8)

Player progression is structured around **8 Major Business Stages** (Levels 1–8) alongside granular **Empire XP Levels (1–50+)**. Each Major Stage unlocks new business modules, resources, employee departments, and revenue multipliers.

### Level 1: Small Farmer
- **Unlock Requirements:** Default starting level upon account creation.
- **Starting Conditions:** \$1,000 Cash, 2 Farm Plots unlocked (10 locked), Barn Storage (200 units), 0 Employees, 10x Tomato Seeds, 10x Wheat Seeds.
- **Available Businesses:** Small Farm (Crop Cultivation & Farmers' Market Direct Sales).
- **New Resources:** Raw Crops — `Tomatoes`, `Wheat`, `Corn`, `Onions`, `Vegetables` (unlocked progressively via plot/research milestones).
- **New Employees:** `Farmhand` (Agriculture Department; max 30 on Farm).
- **Upgrade Opportunities:** Plot Expansion (up to 12 plots), Drip Irrigation, Organic Fertilizer Bins, Barn Silo Capacity.
- **Missions:** Plant first Tomatoes, Harvest 20 Crops, Sell \$500 at Farmers' Market, Hire first Farmhand, Unlock Corn & Onions.
- **Rewards:** +\$1,500 Cash, +250 Empire XP, 5 Empire Gems, unlocks Stage 2 Blueprint.
- **Completion Conditions:** Reach Empire XP Level 5, accumulate \$2,500 Cash, and harvest at least 100 total crops.

### Level 2: Pizza Shop Owner
- **Unlock Requirements:** Level 1 completed, \$2,500 Cash, 100+ crops harvested.
- **Starting Conditions:** Flagship Pizzeria unlocked with 1 Brick Oven, 1 In-Kitchen Prep Station, 2 Dining Tables, Pantry Storage (150 units).
- **Available Businesses:** Small Farm + Flagship Pizza Restaurant.
- **New Resources:** `Pizza Dough`, `Tomato Sauce`, `Prepped Toppings` (via In-Kitchen Prep), and finished `Pizzas` (`Margherita`, `Golden Corn`, `Onion & Herb`, `Supreme Veggie`).
- **New Employees:** `Prep Cook`, `Pizza Chef`, `Cashier` (Restaurant Department; max 35 in Flagship Store).
- **Upgrade Opportunities:** Extra Ovens (up to 4), Dining Tables (up to 12), Kitchen Prep Speed, Recipe Star Quality (1★–5★), Storefront Decor.
- **Missions:** Bake first Margherita, Serve 50 Dine-In Customers, Reach 4.0★ Store Rating, Hire 1 Chef & 1 Cashier, Earn \$5,000 Restaurant Revenue.
- **Rewards:** +\$5,000 Cash, +600 Empire XP, 10 Empire Gems, +5% permanent Pizza Price bonus.
- **Completion Conditions:** Reach Empire XP Level 12, \$15,000 Cash, 500+ Pizzas sold, and 3.8★+ Restaurant Rating.

### Level 3: Food Processing
- **Unlock Requirements:** Level 2 completed, \$15,000 Cash, 500+ Pizzas sold.
- **Starting Conditions:** Food Processing Factory unlocked with 1 Flour & Dough Line, 1 Sauce Cannery Line, Cold Storage (500 units).
- **Available Businesses:** Farm + Flagship Restaurant + Food Processing Factory.
- **New Resources:** Bulk `Industrial Dough`, `Bottled Marinara`, `Vacuum-Packed Toppings`, `Frozen Pizza Bases` (lower unit cost, higher batch size).
- **New Employees:** `Factory Worker`, `Quality Inspector`, `Maintenance Tech` (Manufacturing Department; max 50 in Factory).
- **Upgrade Opportunities:** Automated Mixers, Industrial Canning Boilers, Quality Assurance Lab, Cold Storage Expansion, Conveyor Speed.
- **Missions:** Process 200 Bulk Dough, Maintain 95%+ Factory Quality, Connect Farm Auto-Supply to Factory, Hire 10 Factory Staff.
- **Rewards:** +\$15,000 Cash, +1,200 Empire XP, 15 Empire Gems, -15% Ingredient Unit Cost.
- **Completion Conditions:** Reach Empire XP Level 20, \$50,000 Cash, 2,500+ processed ingredient batches completed.

### Level 4: Delivery Business
- **Unlock Requirements:** Level 3 completed, \$50,000 Cash, Factory operational.
- **Starting Conditions:** Delivery Dispatch Hub unlocked with 1 Delivery Scooter, Dispatch Board (3-order queue).
- **Available Businesses:** Farm + Restaurant + Factory + Delivery Fleet.
- **New Resources:** `Insulated Pizza Boxes`, `Delivery Fuel/Charge`, `Zone Demand Contracts`.
- **New Employees:** `Delivery Driver`, `Fleet Dispatcher` (Logistics Department; max 35 in Hub).
- **Upgrade Opportunities:** Fleet Expansion (Scooters → E-Bikes → Delivery Vans), Thermal Bags (preserves rating), GPS Route Optimizer, Dispatch Automation.
- **Missions:** Complete 100 Deliveries, Achieve 90% On-Time Delivery Rate, Own 5 Delivery Vehicles, Earn \$10,000 in Delivery Tips.
- **Rewards:** +\$40,000 Cash, +2,500 Empire XP, 20 Empire Gems, +10% Delivery Tip Multiplier.
- **Completion Conditions:** Reach Empire XP Level 26, \$200,000 Cash, 90%+ Delivery Rating, 1,000+ Deliveries completed.

### Level 5: Restaurant Chain *(Post-MVP)*
- **Unlock Requirements:** Level 4 completed, \$200,000 Cash, 90%+ Delivery Rating.
- **Starting Conditions:** City District Map unlocked (Suburbs, Downtown, University, Financial District); 1st Branch Slot available.
- **Available Businesses:** All Stage 1–4 modules + Multi-Branch Restaurant Chain (up to 10 locations).
- **New Resources:** `Regional Brand Reputation`, `Franchise Permits`.
- **New Employees:** `Store Manager` (automates local restocking & shift morale), additional Chefs/Cashiers/Drivers per branch.
- **Upgrade Opportunities:** District-Specific Menus, Central Commissary Distribution, Chain-Wide POS Analytics, Regional Ad Campaigns.
- **Missions:** Open 3 Restaurant Branches, Assign 3 Store Managers, Achieve \$100k Daily Chain Revenue, Hit 4.5★ Average Chain Rating.
- **Rewards:** +\$150,000 Cash, +5,000 Empire XP, 30 Empire Gems, +15% Chain-Wide Customer Traffic.
- **Completion Conditions:** Reach Empire XP Level 34, \$1,000,000 Cash, 3+ profitable Restaurant Branches.

### Level 6: Supermarket *(Post-MVP)*
- **Unlock Requirements:** Level 5 completed, \$1,000,000 Cash, 3+ Restaurant Branches.
- **Starting Conditions:** Empire Supermarket unlocked with 3 Aisles (Fresh Produce, Frozen Pizzas, Pantry Sauces) and 2 Checkout Lanes.
- **Available Businesses:** All Stage 1–5 modules + Branded Supermarket.
- **New Resources:** `Packaged Retail Produce`, `Retail Frozen Pizzas`, `Shelf Space Units`.
- **New Employees:** `Retail Clerk`, `Inventory Stocker`, `Supermarket Director` (Retail Department).
- **Upgrade Opportunities:** Cold-Chain Display Freezers, Self-Checkout Kiosks, Loyalty Card Program, Wholesale Bulk Contracts.
- **Missions:** Stock 5,000 Retail Units, Sell 2,000 Frozen Pizzas, Reach \$500k Supermarket Revenue, Employ 200+ Total Staff.
- **Rewards:** +\$500,000 Cash, +10,000 Empire XP, 40 Empire Gems, +20% Retail Margin.
- **Completion Conditions:** Reach Empire XP Level 42, \$5,000,000 Cash, Supermarket Net Profit > \$50,000/hour.

### Level 7: Shopping Mall *(Post-MVP)*
- **Unlock Requirements:** Level 6 completed, \$5,000,000 Cash, Supermarket profitable.
- **Starting Conditions:** Grand Pizza Plaza Mall unlocked with 2 Anchor Slots (your Supermarket + Flagship Pizzeria) and 6 Leasable Tenant Units.
- **Available Businesses:** All Stage 1–6 modules + Shopping Mall Real Estate.
- **New Resources:** `Foot Traffic Index`, `Tenant Lease Contracts`, `Mall Prestige`.
- **New Employees:** `Mall Operator`, `Security Officer`, `Leasing Agent` (Real Estate Department).
- **Upgrade Opportunities:** Parking Garage, Food Court Expansion, Atrium Events Stage, Anchor Synergy Boosters, Luxury Tenant Tiers.
- **Missions:** Lease all 6 Tenant Units, Host 3 Mall Food Festivals, Reach 10,000 Daily Mall Visitors, Employ 350+ Total Staff.
- **Rewards:** +\$2,500,000 Cash, +20,000 Empire XP, 60 Empire Gems, +25% Passive Rental Income.
- **Completion Conditions:** Reach Empire XP Level 48, \$25,000,000 Cash, 100% Mall Occupancy.

### Level 8: Global Business Empire *(Post-MVP)*
- **Unlock Requirements:** Level 7 completed, \$25,000,000 Cash, Shopping Mall operational.
- **Starting Conditions:** Corporate HQ unlocked with Executive Boardroom (5 C-Suite Slots) and Global R&D Lab.
- **Available Businesses:** Full Vertically Integrated Conglomerate (Stages 1–8).
- **New Resources:** `R&D Research Points`, `Corporate Shares / Valuation`, `Global Export Contracts`.
- **New Employees:** `C-Suite Executive` (CEO/COO/CFO/CMO/CTO), `R&D Scientist` (Corporate Department; supports up to full **500-employee** cap).
- **Upgrade Opportunities:** Robotic Pizza Ovens, Hydroponic Sky-Farms, Autonomous Drone Delivery, Global Franchise Licensing, Prestige Reset.
- **Missions:** Hire 5 C-Suite Executives, Complete 10 Corporate R&D Projects, Reach 500/500 Employees, Achieve \$100M Net Worth.
- **Rewards:** +\$10,000,000 Cash, +50,000 Empire XP, 150 Empire Gems, "Pizza Emperor" Title & Prestige Multiplier.
- **Completion Conditions:** Reach Empire XP Level 50+, \$100,000,000+ Empire Valuation, and complete the Global Empire Challenge.

---

## 2. Farming Mechanics

### Crop Specifications
| Crop | Unlock | Seed Cost | Base Growth Time | Base Yield / Plot | Market Sell Price | Primary Culinary Use |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Tomatoes** | Level 1 | \$5 | 30 sec | 4 units | \$3 / unit | Tomato Sauce, Marinara |
| **Wheat** | Level 1 | \$4 | 45 sec | 5 units | \$2.50 / unit | Flour, Pizza Dough |
| **Corn** | Level 1 (XP 2) | \$8 | 60 sec | 4 units | \$4.50 / unit | Golden Corn Topping, Retail |
| **Onions** | Level 1 (XP 3) | \$10 | 75 sec | 4 units | \$5.50 / unit | Gourmet Marinara, Toppings |
| **Vegetables** | Level 1 (XP 4) | \$15 | 120 sec | 3 units | \$9 / unit | Supreme Veggie Topping, Retail |

### Core Farming Loop & Modifiers
- **Planting & Harvesting:** Players click empty plots to plant seeds (or assign `Farmhands` to auto-plant/auto-harvest).
- **Watering:** Each plot has a Hydration Meter (`0%–100%`). Watering is free and grants a **+25% growth speed** buff for that cycle. Drip Irrigation upgrades keep hydration permanently at 100%.
- **Fertilizers:** Consumable boosts purchased with Cash:
  - *Basic Compost (\$15/plot):* +25% yield.
  - *Bio-Nutrient Mix (\$40/plot):* +50% yield & -20% growth time.
- **Land Expansion:** Players start with 2 plots and can buy up to **12 Farm Plots** (cost scales exponentially: `BaseCost * 1.65^(plotIndex - 2)`).
- **Storage (Barn / Silo):** Raw crops are stored in the Barn (starts at 200 capacity, upgradable in tiers up to 25,000+ units). If Barn is full, harvesting pauses unless "Auto-Sell Overflow at 70% Market Price" is enabled.

---

## 3. Production Mechanics

### Stage 2: In-Kitchen Prep (Manual / Early Game)
Before Stage 3 unlocks, the Restaurant converts raw crops directly at higher time/labor cost:
- `2x Wheat` → `1x Pizza Dough` (15s)
- `3x Tomatoes` → `1x Tomato Sauce` (15s)
- `2x Corn / Onions / Vegetables` → `2x Prepped Toppings` (12s)

### Stage 3: Food Processing Factory (Industrial Batches)
Factory lines process bulk batches simultaneously at **50% faster speed** and **+50% output yield**:
| Batch Recipe | Inputs Required | Batch Time | Output Produced |
| :--- | :--- | :--- | :--- |
| **Industrial Dough** | 10x Wheat | 30s | 10x Pizza Dough |
| **Bottled Marinara** | 12x Tomatoes + 3x Onions | 35s | 10x Tomato Sauce |
| **Prepped Topping Pack** | 6x Corn + 6x Onions + 4x Vegetables | 30s | 16x Prepped Toppings |
| **Frozen Pizza Base** *(Stage 6)* | 10x Pizza Dough + 10x Tomato Sauce | 45s | 10x Frozen Pizzas |

### Pizza Recipes (Restaurant Baking)
> **Note:** Base Profit Margins are calculated against **farm-grown seed & processing cost**. Using Wholesale Market ingredients yields a thinner ~10–15% margin, incentivizing vertical integration. Factory-produced `Prepped Toppings` can substitute 1:1 for `Corn`, `Onions`, or `Vegetables` in any recipe and grant a **-20% Bake Time** bonus.

| Pizza Recipe | Unlock | Ingredients Required | Base Bake Time | Base Sell Price | Base Profit Margin |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Classic Margherita** | Stage 2 | 1x Dough + 1x Sauce | 20s | \$14 | ~62% |
| **Golden Corn Pizza** | Stage 2 (XP 7) | 1x Dough + 1x Sauce + 2x Corn *(or Prepped Toppings)* | 25s | \$20 | ~68% |
| **Onion & Herb Classic** | Stage 2 (XP 9) | 1x Dough + 1x Sauce + 2x Onions *(or Prepped Toppings)* | 25s | \$22 | ~70% |
| **Supreme Veggie Feast** | Stage 2 (XP 11) | 1x Dough + 1x Sauce + 1x Corn + 1x Onion + 2x Vegetables *(or 4x Prepped Toppings)* | 35s | \$34 | ~74% |

---

## 4. Employee Mechanics (Up to 500 Employees)

Every hired employee has a persistent individual database record (`employee_id`, `name`, `role`, `department`, `assigned_facility_id`, `skill_level`, `productivity`, `happiness`, `salary_per_hour`, `hired_at`).

### Departments & Roles
1. **Agriculture:** `Farmhand` (auto-plants, waters, harvests).
2. **Restaurant:** `Prep Cook` (preps ingredients), `Pizza Chef` (bakes pizzas), `Cashier` (serves tables & speeds checkout), `Store Manager` *(Stage 5)*.
3. **Manufacturing:** `Factory Worker` (runs lines), `Quality Inspector` (+yield/quality), `Maintenance Tech` (-breakdowns/upkeep).
4. **Logistics:** `Delivery Driver` (fulfills delivery orders), `Fleet Dispatcher` (optimizes dispatch queue).
5. **Retail & Real Estate *(Stages 6–7)*:** `Retail Clerk`, `Inventory Stocker`, `Supermarket Director`, `Mall Operator`, `Leasing Agent`.
6. **Corporate *(Stage 8)*:** `R&D Scientist`, `C-Suite Executive`.

### Core Employee Formulas
- **Productivity Multiplier:** `1.0 + (SkillLevel - 1) * 0.12` adjusted by Happiness:
  - Happiness `80–100%`: `1.10x` morale bonus
  - Happiness `50–79%`: `1.00x` normal
  - Happiness `20–49%`: `0.70x` sluggish
  - Happiness `< 20%`: `0.00x` (Strike / Refuses work)
- **Salary & Payroll:** Paid every simulation hour (or prorated per minute in active play). Base hourly wage scales with Role Tier and Skill Level: `BaseWage * (1.15^(SkillLevel - 1))`.
- **Skills & Training:** Players spend Cash to train an employee from Skill Level 1 → 10. Higher skill increases productivity without using additional headcount slots toward the **500-employee global cap**.
- **Promotions:** At Skill Level 5+, a `Farmhand` or `Prep Cook` can be promoted to `Shift Lead` (+15% aura to co-workers in the same facility), or a `Cashier`/`Chef` can be promoted to `Store Manager` in Stage 5+.
- **Bulk Management (50–500 Scale):** Players can filter by Department/Facility, sort by Happiness/Skill, multi-select to **Batch Train**, **Raise Wages (+10% for instant +20% Happiness)**, or **Reassign Facility**.

---

## 5. Financial Mechanics

### Income Streams
- **Direct Crop Sales:** Selling surplus raw crops at the Farmers' Market / Wholesale.
- **Restaurant Sales:** Dine-in + Takeaway orders (`BasePrice * RecipeQualityMultiplier * PriceElasticity`).
- **Delivery Sales:** Pizza Price + Delivery Fee + Customer Tips (based on speed & thermal quality).
- **Retail & Mall Income *(Stages 6–7)*:** High-volume supermarket checkout + fixed tenant lease rent.

### Expenses & Operating Costs
- **Payroll:** Sum of all active employees' hourly wages.
- **Facility Upkeep:** Fixed hourly rent/utilities per unlocked building and plot.
- **Raw Material / Wholesale Costs:** Seed purchases + emergency wholesale ingredient buys.
- **Fleet Costs:** Fuel/charging and vehicle maintenance per active delivery run.
- **Loan Interest:** Fixed percentage on active business loans.

### Profit & Cash Flow Formula
`Net Profit / Hour = Gross Revenue - (COGS + Total Payroll + Facility Upkeep + Fleet Costs + Loan Interest)`

### Business Investments (CapEx & ROI)
- **Capital Expenditures:** Purchasing new Farm Plots, unlocking Facilities (Restaurant, Factory, Delivery Hub, Branches, Supermarket, Mall), buying Delivery Vehicles, and funding Corporate R&D are tracked separately from OpEx as **Capital Investments**.
- **ROI Tracking:** The Finance Dashboard tracks cumulative CapEx vs. Net Profit per business unit so players can evaluate payback period before taking loans or expanding.

### Banking & Loans
- **Starter Loan (Stage 1–2):** Borrow up to \$5,000 at 8% interest, repaid automatically at 10% of gross sales.
- **Expansion Loan (Stage 3+):** Borrow up to 25% of Empire Valuation at 6% interest.

---

## 6. Upgrade Mechanics

| Category | Example Upgrades | Max Level | Cost Scaling | Gameplay Benefit | Unlock Condition |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Facility Capacity** | Farm Plots, Dining Tables, Barn/Pantry Size | 10–20 | `Base * 1.6^Lv` | Increases max throughput & storage | Stage unlock |
| **Equipment Speed** | Drip Irrigation, Brick → Conveyor Ovens, Automated Mixers | 10 | `Base * 1.75^Lv` | -8% cycle time per level | Facility built |
| **Recipe Quality** | Margherita 1★ → 5★, Gourmet Seasoning | 5 | `Base * 2.2^Lv` | +15% sell price & +0.2★ rating per level | 100 pizzas of recipe sold |
| **Logistics & Fleet** | Scooters → E-Bikes → Vans, Thermal Bags | 10 | `Base * 1.8^Lv` | +20% delivery capacity & faster transit | Stage 4 unlock |
| **Empire Tech / R&D** | Bulk Purchasing, HR Training Efficiency, Offline Cap | 5–10 | `Base * 2.5^Lv` | Global -3% wages, +1h offline cap per level | Stage 3+ / Stage 8 |

---

## 7. Offline Mechanics

When a player closes the browser or goes idle, the backend records `last_active_at`. Upon return, the server computes offline progress:

1. **Elapsed Time Calculation:** `EffectiveSeconds = min(Now - last_active_at, OfflineCapSeconds)`.
   - Base Offline Cap: **4 hours (14,400s)** (upgradable to 8h, 12h, or 24h via upgrades/VIP).
2. **Automated Simulation:** Only facilities with assigned employees (e.g., Farmhands on Farm, Chefs/Cashiers in Restaurant) generate offline output.
3. **Offline Efficiency Rate:** Facilities operate at **60% of active online net profit rate** (to reward active play while keeping idle progress meaningful).
4. **Resource Constraint Check:**
   - The server simulates ingredient consumption sequentially. If Wheat/Tomatoes run out at hour 2.5, Factory/Restaurant production pauses at hour 2.5 rather than creating "free" pizzas.
   - **Zero-Negative Protection:** Offline wages are only deducted for active production hours; offline earnings can never reduce a player's Cash below \$0.
5. **Welcome-Back Summary:** Modal displays exact breakdown (Time Away, Crops Harvested, Pizzas Sold, Wages Paid, Net Cash Earned) with a single **Claim** action.

---

## 8. Customer Mechanics

### Demand & Foot Traffic
- **Base Demand (Customers/Hour):** Driven by Business Stage, Dining Tables, Marketing Upgrades, and **Business Reputation (0–100)**.
- **Price Elasticity:** Players can adjust pizza prices between **70% and 150%** of base value:
  - `< 100%` (Discount): Increases customer demand (+25%), slightly lowers margin per pizza.
  - `100%` (Fair Price): Standard demand and satisfaction.
  - `> 120%` (Overpriced): Demand drops sharply (-35%), satisfaction decays faster.

### Satisfaction & Ratings (1.0★ – 5.0★)
Customer satisfaction per order is calculated from:
- **Wait Time:** Served within 30s = 100%; > 90s = 40% (angry walkout if > 120s).
- **Ingredient / Recipe Quality:** Based on Recipe Star Level + Factory Quality Inspector bonus.
- **Price Fairness:** Penalized if priced > 115% of market expectation.

**Reputation Impact:** High average rating (`4.5★+`) passively grows Empire Reputation, unlocking higher-paying customers and +10% to +25% organic foot traffic.

---

## 9. Game Economy

### Starting Values (New Player)
- **Starting Cash:** \$1,000
- **Starting Plots:** 2 (max 12)
- **Starting Storage:** 200 Barn / 150 Pantry
- **Starting XP:** 0 (Level 1)

### Core Progression Formulas
- **Empire XP Required per Level:**
  `XP_Needed(L) = floor(100 * (L ^ 1.85))`
  *(Lv 1→2: 100 XP; Lv 5: ~1,960 XP; Lv 20: ~25,500 XP; Lv 50: ~139,000 XP)*
- **Upgrade Cost Curve:**
  `Cost(L) = floor(BaseCost * (GrowthFactor ^ (L - 1)))` where `GrowthFactor` ranges from `1.55` (early farm) to `2.2` (late-game corporate).
- **Target Pacing (Active Play):**
  - Stage 1 → Stage 2: ~10–15 minutes
  - Stage 2 → Stage 3: ~45–60 minutes
  - Stage 3 → Stage 4: ~2–3 hours
  - Stage 4 → Stage 5+: Multi-day progression

---

## 10. Achievements and Missions

### Achievements (24 Milestones)
| # | Achievement Name | Category | Requirement | Reward |
| :--- | :--- | :--- | :--- | :--- |
| 1 | **Green Thumb** | Farming | Harvest 100 total crops | +\$250, 2 Gems |
| 2 | **Agrarian Baron** | Farming | Harvest 25,000 total crops | +\$10,000, 10 Gems |
| 3 | **Crop Diversification** | Farming | Harvest all 5 crop types at least 100 times each | +\$2,500, 5 Gems |
| 4 | **Maxed Acreage** | Farming | Unlock all 12 Farm Plots | +\$5,000, 10 Gems |
| 5 | **First Slice** | Restaurant | Bake and sell your 1st Pizza | +\$200, 2 Gems |
| 6 | **Neighborhood Favorite** | Restaurant | Sell 1,000 Pizzas | +\$5,000, 10 Gems |
| 7 | **Master Pizzaiolo** | Restaurant | Sell 50,000 Pizzas | +\$100,000, 25 Gems |
| 8 | **Five-Star Dining** | Restaurant | Maintain a 4.8★+ Restaurant Rating for 1 hour | +\$15,000, 15 Gems |
| 9 | **Industrialist** | Factory | Process 5,000 ingredient batches | +\$20,000, 15 Gems |
| 10 | **Zero-Waste Supply** | Factory | Run Factory for 1 hour using 100% Farm-grown crops | +\$12,000, 10 Gems |
| 11 | **Hot & Fresh** | Delivery | Complete 500 Delivery Orders | +\$15,000, 10 Gems |
| 12 | **Speed Demon** | Delivery | Complete 100 Deliveries with 95%+ On-Time rate | +\$25,000, 15 Gems |
| 13 | **First Boss** | Workforce | Hire your 1st Employee | +\$300, 2 Gems |
| 14 | **Growing Team** | Workforce | Employ 25 staff simultaneously | +\$5,000, 10 Gems |
| 15 | **Mid-Size Enterprise** | Workforce | Employ 100 staff simultaneously | +\$50,000, 20 Gems |
| 16 | **Corporate Workforce** | Workforce | Employ 250 staff simultaneously | +\$250,000, 35 Gems |
| 17 | **The 500 Club** | Workforce | Reach the maximum 500/500 Employees | +\$2,000,000, 100 Gems |
| 18 | **Happy Workplace** | Workforce | Maintain 90%+ average Happiness across 50+ staff | +\$30,000, 15 Gems |
| 19 | **Six-Figure Club** | Finance | Reach \$100,000 Cash on hand | +5,000 XP, 10 Gems |
| 20 | **Millionaire** | Finance | Reach \$1,000,000 Empire Valuation | +25,000 XP, 25 Gems |
| 21 | **Decamillionaire** | Finance | Reach \$10,000,000 Empire Valuation | +100,000 XP, 50 Gems |
| 22 | **Debt-Free** | Finance | Pay off a Business Loan in full | +\$2,000, 5 Gems |
| 23 | **Chain Magnate** | Expansion | Own 5 Restaurant Branches *(Post-MVP)* | +\$500,000, 40 Gems |
| 24 | **Pizza Emperor** | Endgame | Reach \$100,000,000 Empire Valuation *(Post-MVP)* | +150 Gems, Prestige Badge |

---

### Missions (32 Guided & Rotating Tasks)
| # | Mission Title | Type | Objective | Reward |
| :--- | :--- | :--- | :--- | :--- |
| 1 | **First Harvest** | Onboarding | Plant and harvest 10 Tomatoes | +\$150, +50 XP |
| 2 | **Breadbasket** | Onboarding | Plant and harvest 10 Wheat | +\$150, +50 XP |
| 3 | **Market Day** | Onboarding | Sell 25 raw crops at the Farmers' Market | +\$300, +100 XP |
| 4 | **Helping Hands** | Onboarding | Hire 1 Farmhand and assign to Farm | +\$400, +120 XP |
| 5 | **Expand the Acre** | Farming | Unlock a 3rd Farm Plot | +\$500, +150 XP |
| 6 | **Sweet Corn** | Farming | Harvest 50 Corn | +\$600, +200 XP |
| 7 | **Savory Onions** | Farming | Harvest 50 Onions | +\$750, +220 XP |
| 8 | **Garden Fresh** | Farming | Harvest 40 Vegetables | +\$1,000, +300 XP |
| 9 | **Hydration Station** | Farming | Purchase Drip Irrigation Lv.1 | +\$800, +250 XP |
| 10 | **Grand Opening** | Restaurant | Unlock the Flagship Pizza Restaurant | +\$1,500, +400 XP |
| 11 | **First Dough** | Restaurant | Prep 10 Pizza Dough in-kitchen | +\$500, +200 XP |
| 12 | **Margherita Rush** | Restaurant | Sell 25 Classic Margherita Pizzas | +\$1,200, +350 XP |
| 13 | **Kitchen Crew** | Restaurant | Hire 1 Pizza Chef and 1 Cashier | +\$1,500, +400 XP |
| 14 | **More Seating** | Restaurant | Upgrade Dining Tables to 4 | +\$2,000, +500 XP |
| 15 | **Golden Pie** | Restaurant | Sell 50 Golden Corn Pizzas | +\$2,500, +600 XP |
| 16 | **Veggie Supreme** | Restaurant | Sell 30 Supreme Veggie Feast Pizzas | +\$4,000, +800 XP |
| 17 | **Star Power** | Restaurant | Upgrade any Pizza Recipe to 3★ Quality | +\$3,500, +750 XP |
| 18 | **Factory Floor** | Factory | Unlock the Food Processing Factory | +\$5,000, +1,000 XP |
| 19 | **Mass Production** | Factory | Produce 100 Industrial Dough batches | +\$6,000, +1,200 XP |
| 20 | **Sauce Boss** | Factory | Produce 100 Bottled Marinara batches | +\$6,500, +1,300 XP |
| 21 | **Quality Control** | Factory | Hire 2 Quality Inspectors | +\$5,000, +1,000 XP |
| 22 | **On Wheels** | Delivery | Unlock Delivery Business & buy 1 Scooter | +\$8,000, +1,500 XP |
| 23 | **Doorstep Service** | Delivery | Complete 50 Delivery Orders | +\$10,000, +1,800 XP |
| 24 | **Fleet Upgrade** | Delivery | Upgrade 3 Vehicles to E-Bikes or Vans | +\$15,000, +2,200 XP |
| 25 | **Skill Up** | Workforce | Train 5 Employees to Skill Level 3+ | +\$4,000, +900 XP |
| 26 | **Morale Boost** | Workforce | Keep all staff above 85% Happiness for 30m | +\$5,000, +1,000 XP |
| 27 | **Smart Capital** | Finance | Maintain +\$1,000/hr Net Profit for 15m | +\$6,000, +1,200 XP |
| 28 | **Branching Out** | Chain *(Post-MVP)* | Open your 2nd Restaurant Location | +\$50,000, +4,000 XP |
| 29 | **Retail Giant** | Supermarket *(Post-MVP)* | Sell 1,000 Frozen Pizzas in Supermarket | +\$150,000, +8,000 XP |
| 30 | **Landlord** | Mall *(Post-MVP)* | Sign 4 Mall Tenant Leases | +\$400,000, +15,000 XP |
| 31 | **Boardroom** | Corporate *(Post-MVP)* | Hire 3 C-Suite Executives | +\$1,000,000, +25,000 XP |
| 32 | **Future Tech** | Corporate *(Post-MVP)* | Complete 5 R&D Lab Projects | +\$2,500,000, +40,000 XP |

---

### 8 Level Completion Challenges
Each Major Level concludes with a timed or milestone **Completion Challenge** to unlock the next tier:

| Level | Challenge Name | Challenge Objective | Reward |
| :--- | :--- | :--- | :--- |
| **Level 1** | *Harvest Festival* | Harvest 100 crops and hold \$2,500 Cash simultaneously | Unlocks Stage 2 + 5 Gems |
| **Level 2** | *Lunch Rush* | Serve 50 Pizzas in a single 15-minute window at 3.8★+ rating | Unlocks Stage 3 + 10 Gems |
| **Level 3** | *Supply-Chain Sync* | Run Factory for 30 minutes with zero ingredient shortages | Unlocks Stage 4 + 15 Gems |
| **Level 4** | *30-Minutes-or-Less* | Complete 100 Deliveries with 90%+ On-Time rate | Unlocks Stage 5 + 20 Gems |
| **Level 5** | *Citywide Takeover* *(Post-MVP)* | Achieve positive Net Profit across 3+ Restaurant Branches simultaneously | Unlocks Stage 6 + 30 Gems |
| **Level 6** | *Black Friday Stockup* *(Post-MVP)* | Sell 5,000 Retail Units in Supermarket without stockouts | Unlocks Stage 7 + 40 Gems |
| **Level 7** | *Grand Plaza Gala* *(Post-MVP)* | Reach 100% Mall Tenant Occupancy & 10,000 Daily Visitors | Unlocks Stage 8 + 60 Gems |
| **Level 8** | *Global Monopoly* *(Post-MVP)* | Reach \$100M Net Worth with 500/500 Employees at 85%+ Happiness | Prestige + 150 Gems |
