-- Seed 003: Business Upgrades, Missions, Achievements, and Game Configuration
SET NAMES utf8mb4;
SET time_zone = '+00:00';

INSERT INTO business_upgrades (code, name, category, business_type, max_level, base_cost, cost_growth_factor, effect_per_level, unlock_level_number, description) VALUES
('FARM_DRIP_IRRIGATION', 'Drip Irrigation', 'EQUIPMENT_SPEED', 'FARM', 10, 250.00, 1.75, 0.0800, 1, 'Reduces crop growth time by 8% per level and keeps plots hydrated.'),
('FARM_BARN_SILO', 'Barn Silo Expansion', 'FACILITY_CAPACITY', 'FARM', 15, 200.00, 1.60, 250.0000, 1, 'Increases Barn raw crop storage capacity by 250 units per level.'),
('REST_BRICK_OVEN', 'Conveyor Pizza Oven', 'EQUIPMENT_SPEED', 'RESTAURANT', 10, 1200.00, 1.75, 0.0800, 2, 'Reduces pizza bake time by 8% per level.'),
('REST_DINING_TABLES', 'Dining Room Seating', 'FACILITY_CAPACITY', 'RESTAURANT', 10, 800.00, 1.60, 1.0000, 2, 'Adds 1 dining table per level to serve more dine-in customers.'),
('FAC_AUTO_MIXER', 'Automated Dough Mixers', 'EQUIPMENT_SPEED', 'FACTORY', 10, 4000.00, 1.75, 0.0800, 3, 'Reduces factory batch processing time by 8% per level.'),
('DEL_THERMAL_BAGS', 'Thermal Delivery Bags', 'LOGISTICS_FLEET', 'DELIVERY_HUB', 10, 3000.00, 1.80, 0.0500, 4, 'Increases delivery tips and customer rating retention by 5% per level.'),
('TECH_OFFLINE_CAP', 'Executive Operations Manual', 'EMPIRE_TECH', 'GLOBAL', 8, 5000.00, 2.50, 3600.0000, 3, 'Extends offline earnings cap by 1 hour per level.')
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO missions (code, title, mission_type, target_metric, target_value, reward_cash, reward_xp, reward_gems, unlock_level_number, is_mvp) VALUES
('MIS_FIRST_HARVEST', 'First Harvest', 'ONBOARDING', 'CROPS_HARVESTED_TOMATOES', 10, 150.00, 50, 0, 1, 1),
('MIS_BREADBASKET', 'Breadbasket', 'ONBOARDING', 'CROPS_HARVESTED_WHEAT', 10, 150.00, 50, 0, 1, 1),
('MIS_MARKET_DAY', 'Market Day', 'ONBOARDING', 'CROPS_SOLD_TOTAL', 25, 300.00, 100, 1, 1, 1),
('MIS_HELPING_HANDS', 'Helping Hands', 'ONBOARDING', 'EMPLOYEES_HIRED_FARMHAND', 1, 400.00, 120, 1, 1, 1),
('MIS_GRAND_OPENING', 'Grand Opening', 'RESTAURANT', 'RESTAURANT_UNLOCKED', 1, 1500.00, 400, 5, 2, 1),
('MIS_MARGHERITA_RUSH', 'Margherita Rush', 'RESTAURANT', 'PIZZAS_SOLD_MARGHERITA', 25, 1200.00, 350, 2, 2, 1),
('MIS_FACTORY_FLOOR', 'Factory Floor', 'FACTORY', 'FACTORY_UNLOCKED', 1, 5000.00, 1000, 5, 3, 1),
('MIS_ON_WHEELS', 'On Wheels', 'DELIVERY', 'DELIVERY_UNLOCKED', 1, 8000.00, 1500, 5, 4, 1)
ON DUPLICATE KEY UPDATE title = VALUES(title);

INSERT INTO achievements (code, name, category, target_metric, target_value, reward_cash, reward_xp, reward_gems, description) VALUES
('ACH_GREEN_THUMB', 'Green Thumb', 'FARMING', 'TOTAL_CROPS_HARVESTED', 100, 250.00, 100, 2, 'Harvest 100 total crops.'),
('ACH_FIRST_SLICE', 'First Slice', 'RESTAURANT', 'TOTAL_PIZZAS_SOLD', 1, 200.00, 50, 2, 'Bake and sell your first pizza.'),
('ACH_NEIGHBORHOOD_FAV', 'Neighborhood Favorite', 'RESTAURANT', 'TOTAL_PIZZAS_SOLD', 1000, 5000.00, 1000, 10, 'Sell 1,000 pizzas.'),
('ACH_INDUSTRIALIST', 'Industrialist', 'FACTORY', 'TOTAL_BATCHES_PROCESSED', 5000, 20000.00, 3000, 15, 'Process 5,000 factory batches.'),
('ACH_HOT_AND_FRESH', 'Hot & Fresh', 'DELIVERY', 'TOTAL_DELIVERIES_COMPLETED', 500, 15000.00, 2000, 10, 'Complete 500 delivery orders.'),
('ACH_THE_500_CLUB', 'The 500 Club', 'WORKFORCE', 'ACTIVE_EMPLOYEES_COUNT', 500, 2000000.00, 50000, 100, 'Employ 500/500 staff simultaneously.'),
('ACH_MILLIONAIRE', 'Millionaire', 'FINANCE', 'NET_WORTH', 1000000, 0.00, 25000, 25, 'Reach $1,000,000 Empire Valuation.')
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO game_configuration (config_key, config_value, value_type, description) VALUES
('GLOBAL_MAX_EMPLOYEES', '500', 'NUMBER', 'Maximum employees allowed per player across all facilities'),
('OFFLINE_EFFICIENCY_RATE', '0.60', 'NUMBER', 'Multiplier applied to automated net profit while offline'),
('OFFLINE_BASE_CAP_SECONDS', '14400', 'NUMBER', 'Default 4-hour offline earnings cap in seconds'),
('PAYROLL_GRACE_CYCLES', '3', 'NUMBER', 'Missed payroll cycles before employees go on strike'),
('XP_CURVE_EXPONENT', '1.85', 'NUMBER', 'Exponent in floor(100 * L^exponent) XP level formula')
ON DUPLICATE KEY UPDATE config_value = VALUES(config_value);
