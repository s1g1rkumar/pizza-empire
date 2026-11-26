-- Seed 008: Complete 22 Configurable Business Upgrades Across Farm, Factory, Restaurant, Delivery, and Management
SET NAMES utf8mb4;
SET time_zone = '+00:00';

INSERT INTO business_upgrades (code, name, category, business_type, max_level, base_cost, cost_growth_factor, effect_per_level, unlock_level_number, description) VALUES
-- Farm (5)
('UPG_FARM_SEEDS', 'Better Seeds', 'RECIPE_QUALITY', 'FARM', 10, 300.00, 1.65, 0.0800, 1, 'Increases crop harvest yield by 8% per level.'),
('FARM_DRIP_IRRIGATION', 'Irrigation System', 'EQUIPMENT_SPEED', 'FARM', 10, 250.00, 1.75, 0.0800, 1, 'Reduces crop growth time by 8% per level and maintains hydration.'),
('UPG_FARM_FERTILIZER', 'Organic Fertilizer Lab', 'RECIPE_QUALITY', 'FARM', 10, 400.00, 1.70, 0.0600, 1, 'Improves crop market quality & value by 6% per level.'),
('UPG_FARM_TRACTOR', 'Tractor Fleet', 'EQUIPMENT_SPEED', 'FARM', 10, 600.00, 1.75, 0.0700, 1, 'Boosts farm planting & harvesting speed by 7% per level.'),
('UPG_FARM_LAND', 'Land & Silo Expansion', 'FACILITY_CAPACITY', 'FARM', 15, 250.00, 1.60, 250.0000, 1, 'Increases Farm Barn storage capacity by 250 units per level.'),

-- Factory (5)
('FAC_AUTO_MIXER', 'Processing Speed Mixers', 'EQUIPMENT_SPEED', 'FACTORY', 10, 4000.00, 1.75, 0.0800, 3, 'Increases factory processing speed by 8% per level.'),
('UPG_FAC_CAPACITY', 'Production Capacity Lines', 'FACILITY_CAPACITY', 'FACTORY', 10, 5000.00, 1.80, 1.0000, 3, 'Adds +1 concurrent factory production slot per level.'),
('UPG_FAC_AUTOMATION', 'Factory Automation', 'EQUIPMENT_SPEED', 'FACTORY', 10, 6500.00, 1.85, 0.1000, 3, 'Increases automated factory output by 10% per level.'),
('UPG_FAC_STORAGE', 'Cold Storage Warehouse', 'FACILITY_CAPACITY', 'FACTORY', 12, 3000.00, 1.65, 500.0000, 3, 'Expands factory storage capacity by 500 units per level.'),
('UPG_FAC_ENERGY', 'Energy Efficiency Grid', 'EMPIRE_TECH', 'FACTORY', 10, 3500.00, 1.70, 0.0500, 3, 'Reduces facility operating upkeep costs by 5% per level.'),

-- Restaurant (5)
('REST_BRICK_OVEN', 'Brick Pizza Oven', 'EQUIPMENT_SPEED', 'RESTAURANT', 10, 1200.00, 1.75, 0.0800, 2, 'Reduces pizza bake duration by 8% per level.'),
('UPG_REST_KITCHEN', 'Kitchen Equipment', 'EQUIPMENT_SPEED', 'RESTAURANT', 10, 1000.00, 1.70, 0.0700, 2, 'Speeds up kitchen prep and order turnaround by 7% per level.'),
('REST_DINING_TABLES', 'Customer Seating', 'FACILITY_CAPACITY', 'RESTAURANT', 10, 800.00, 1.60, 1.0000, 2, 'Adds +1 dining table per level to boost customer capacity.'),
('UPG_REST_QUALITY', 'Artisan Food Quality', 'RECIPE_QUALITY', 'RESTAURANT', 10, 1500.00, 1.80, 0.0600, 2, 'Increases pizza selling price & satisfaction by 6% per level.'),
('UPG_REST_DECOR', 'Restaurant Decoration', 'FACILITY_CAPACITY', 'RESTAURANT', 10, 900.00, 1.65, 0.0500, 2, 'Increases customer demand & tip rate by 5% per level.'),

-- Delivery (3)
('UPG_DEL_SPEED', 'Vehicle Speed Tuning', 'LOGISTICS_FLEET', 'DELIVERY_HUB', 10, 2500.00, 1.75, 0.0800, 4, 'Reduces delivery transit times by 8% per level.'),
('UPG_DEL_CAPACITY', 'Delivery Capacity Racks', 'LOGISTICS_FLEET', 'DELIVERY_HUB', 10, 3000.00, 1.80, 1.0000, 4, 'Increases pizzas carried per trip by +1 per level.'),
('DEL_THERMAL_BAGS', 'Route Optimization & Thermal', 'LOGISTICS_FLEET', 'DELIVERY_HUB', 10, 3200.00, 1.80, 0.0600, 4, 'Boosts delivery tips and on-time rating by 6% per level.'),

-- Management / Global (4)
('UPG_MGMT_TRAINING', 'Employee Training Program', 'EMPIRE_TECH', 'GLOBAL', 10, 1500.00, 1.75, 0.0500, 1, 'Increases empire-wide employee productivity by 5% per level.'),
('UPG_MGMT_MARKETING', 'Empire Marketing Campaigns', 'EMPIRE_TECH', 'GLOBAL', 10, 2000.00, 1.80, 0.0800, 1, 'Increases gross revenue across all businesses by 8% per level.'),
('UPG_MGMT_AUTOMATION', 'Business Automation Suite', 'EMPIRE_TECH', 'GLOBAL', 10, 3500.00, 1.90, 0.0700, 2, 'Boosts automated simulation & offline earnings rate by 7% per level.'),
('UPG_MGMT_EFFICIENCY', 'Management Efficiency', 'EMPIRE_TECH', 'GLOBAL', 10, 2500.00, 1.75, 0.0400, 1, 'Reduces total operating upkeep & payroll overhead by 4% per level.')
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    category = VALUES(category),
    business_type = VALUES(business_type),
    max_level = VALUES(max_level),
    base_cost = VALUES(base_cost),
    cost_growth_factor = VALUES(cost_growth_factor),
    effect_per_level = VALUES(effect_per_level),
    unlock_level_number = VALUES(unlock_level_number),
    description = VALUES(description);
