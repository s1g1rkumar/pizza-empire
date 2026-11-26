-- Seed 001: Game Levels (Stages 1-8), Locations, and Customer Archetypes
SET NAMES utf8mb4;
SET time_zone = '+00:00';

INSERT INTO game_levels (level_number, code, name, description, min_xp, min_cash, min_net_worth, max_employees_cap, is_mvp) VALUES
(1, 'SMALL_FARMER', 'Small Farmer', 'Start with 2 farm plots and grow Tomatoes, Wheat, Corn, Onions, and Vegetables.', 0, 0.00, 1000.00, 30, 1),
(2, 'PIZZA_SHOP_OWNER', 'Pizza Shop Owner', 'Open your flagship brick-and-mortar Pizza Restaurant.', 1960, 2500.00, 3500.00, 65, 1),
(3, 'FOOD_PROCESSING', 'Food Processing', 'Build an industrial Food Processing Factory for bulk dough, sauce, and toppings.', 9900, 15000.00, 25000.00, 115, 1),
(4, 'DELIVERY_BUSINESS', 'Delivery Business', 'Launch a pizza delivery fleet with Scooters, E-Bikes, and Vans.', 25500, 50000.00, 75000.00, 150, 1),
(5, 'RESTAURANT_CHAIN', 'Restaurant Chain', 'Expand into a multi-branch pizzeria chain across city districts.', 41500, 200000.00, 350000.00, 250, 0),
(6, 'SUPERMARKET', 'Supermarket', 'Sell fresh produce and frozen pizzas in branded supermarkets.', 69000, 1000000.00, 1500000.00, 350, 0),
(7, 'SHOPPING_MALL', 'Shopping Mall', 'Own a Shopping Mall anchored by your Supermarket and Pizzeria.', 101000, 5000000.00, 8000000.00, 450, 0),
(8, 'GLOBAL_EMPIRE', 'Global Business Empire', 'Establish Corporate HQ, C-Suite executives, and global R&D.', 139000, 25000000.00, 40000000.00, 500, 0)
ON DUPLICATE KEY UPDATE name = VALUES(name), max_employees_cap = VALUES(max_employees_cap);

INSERT INTO locations (code, name, district_type, demand_multiplier, rent_multiplier, price_elasticity, unlock_level_number) VALUES
('RURAL_VALLEY', 'Green Valley', 'RURAL', 1.00, 0.75, 1.00, 1),
('OLD_TOWN_SUBURBS', 'Oakwood Suburbs', 'SUBURBS', 1.15, 1.00, 1.05, 2),
('INDUSTRIAL_PARK', 'Eastside Industrial Park', 'INDUSTRIAL', 1.00, 0.90, 1.00, 3),
('UNIVERSITY_QUARTER', 'University Quarter', 'UNIVERSITY', 1.35, 1.15, 1.25, 5),
('DOWNTOWN_CORE', 'Downtown Core', 'DOWNTOWN', 1.55, 1.50, 0.95, 5),
('FINANCIAL_DISTRICT', 'Financial District', 'FINANCIAL', 1.75, 2.00, 0.80, 6)
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO customers (code, archetype_name, price_sensitivity, tip_generosity, patience_seconds) VALUES
('STUDENT', 'College Student', 1.30, 0.80, 75),
('FAMILY', 'Suburban Family', 1.00, 1.10, 65),
('OFFICE_WORKER', 'Office Luncher', 0.90, 1.20, 45),
('FOODIE', 'Gourmet Foodie', 0.70, 1.50, 80)
ON DUPLICATE KEY UPDATE archetype_name = VALUES(archetype_name);
