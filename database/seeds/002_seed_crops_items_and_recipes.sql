-- Seed 002: Crops, Inventory Items, Production Recipes, and Recipe Ingredients
SET NAMES utf8mb4;
SET time_zone = '+00:00';

INSERT INTO crops (code, name, seed_cost, growth_seconds, base_yield, market_sell_price, unlock_xp_level) VALUES
('TOMATOES', 'Tomatoes', 5.00, 30, 4, 3.00, 1),
('WHEAT', 'Wheat', 4.00, 45, 5, 2.50, 1),
('CORN', 'Corn', 8.00, 60, 4, 4.50, 2),
('ONIONS', 'Onions', 10.00, 75, 4, 5.50, 3),
('VEGETABLES', 'Vegetables', 15.00, 120, 3, 9.00, 4)
ON DUPLICATE KEY UPDATE seed_cost = VALUES(seed_cost), growth_seconds = VALUES(growth_seconds);

-- Raw Crops in Inventory Items
INSERT INTO inventory_items (code, name, category, unit_wholesale_buy, unit_wholesale_sell, crop_id)
SELECT c.code, c.name, 'RAW_CROP', ROUND(c.market_sell_price * 1.40, 2), c.market_sell_price, c.id
FROM crops c
ON DUPLICATE KEY UPDATE unit_wholesale_buy = VALUES(unit_wholesale_buy);

-- Processed Ingredients & Finished Pizzas
INSERT INTO inventory_items (code, name, category, unit_wholesale_buy, unit_wholesale_sell, crop_id) VALUES
('PIZZA_DOUGH', 'Pizza Dough', 'PROCESSED_INGREDIENT', 8.00, 4.50, NULL),
('TOMATO_SAUCE', 'Tomato Sauce', 'PROCESSED_INGREDIENT', 12.00, 6.50, NULL),
('PREPPED_TOPPINGS', 'Prepped Toppings', 'PROCESSED_INGREDIENT', 10.00, 5.50, NULL),
('FROZEN_PIZZA_BASE', 'Frozen Pizza Base', 'RETAIL_GOOD', 18.00, 12.00, NULL),
('PIZZA_MARGHERITA', 'Classic Margherita', 'PIZZA', 0.00, 14.00, NULL),
('PIZZA_GOLDEN_CORN', 'Golden Corn Pizza', 'PIZZA', 0.00, 20.00, NULL),
('PIZZA_ONION_HERB', 'Onion & Herb Classic', 'PIZZA', 0.00, 22.00, NULL),
('PIZZA_SUPREME_VEGGIE', 'Supreme Veggie Feast', 'PIZZA', 0.00, 34.00, NULL)
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- Production Recipes (Stage 2 Prep, Stage 3 Factory, Stage 2+ Ovens)
INSERT INTO production_recipes (code, name, facility_type, output_item_id, output_quantity, duration_seconds, unlock_xp_level) VALUES
('PREP_DOUGH', 'In-Kitchen Dough Kneading', 'RESTAURANT_PREP', (SELECT id FROM inventory_items WHERE code='PIZZA_DOUGH'), 1, 15, 5),
('PREP_SAUCE', 'In-Kitchen Sauce Simmering', 'RESTAURANT_PREP', (SELECT id FROM inventory_items WHERE code='TOMATO_SAUCE'), 1, 15, 5),
('FAC_DOUGH', 'Industrial Dough Batch', 'FACTORY', (SELECT id FROM inventory_items WHERE code='PIZZA_DOUGH'), 10, 30, 12),
('FAC_MARINARA', 'Bottled Marinara Batch', 'FACTORY', (SELECT id FROM inventory_items WHERE code='TOMATO_SAUCE'), 10, 35, 12),
('FAC_TOPPINGS', 'Prepped Topping Pack', 'FACTORY', (SELECT id FROM inventory_items WHERE code='PREPPED_TOPPINGS'), 16, 30, 12),
('BAKE_MARGHERITA', 'Bake Classic Margherita', 'RESTAURANT_OVEN', (SELECT id FROM inventory_items WHERE code='PIZZA_MARGHERITA'), 1, 20, 5),
('BAKE_GOLDEN_CORN', 'Bake Golden Corn Pizza', 'RESTAURANT_OVEN', (SELECT id FROM inventory_items WHERE code='PIZZA_GOLDEN_CORN'), 1, 25, 7),
('BAKE_ONION_HERB', 'Bake Onion & Herb Classic', 'RESTAURANT_OVEN', (SELECT id FROM inventory_items WHERE code='PIZZA_ONION_HERB'), 1, 25, 9),
('BAKE_SUPREME_VEGGIE', 'Bake Supreme Veggie Feast', 'RESTAURANT_OVEN', (SELECT id FROM inventory_items WHERE code='PIZZA_SUPREME_VEGGIE'), 1, 35, 11)
ON DUPLICATE KEY UPDATE duration_seconds = VALUES(duration_seconds);

-- Recipe Ingredients
INSERT IGNORE INTO production_recipe_ingredients (recipe_id, item_id, quantity_required) VALUES
((SELECT id FROM production_recipes WHERE code='PREP_DOUGH'), (SELECT id FROM inventory_items WHERE code='WHEAT'), 2),
((SELECT id FROM production_recipes WHERE code='PREP_SAUCE'), (SELECT id FROM inventory_items WHERE code='TOMATOES'), 3),
((SELECT id FROM production_recipes WHERE code='FAC_DOUGH'), (SELECT id FROM inventory_items WHERE code='WHEAT'), 10),
((SELECT id FROM production_recipes WHERE code='FAC_MARINARA'), (SELECT id FROM inventory_items WHERE code='TOMATOES'), 12),
((SELECT id FROM production_recipes WHERE code='FAC_MARINARA'), (SELECT id FROM inventory_items WHERE code='ONIONS'), 3),
((SELECT id FROM production_recipes WHERE code='FAC_TOPPINGS'), (SELECT id FROM inventory_items WHERE code='CORN'), 6),
((SELECT id FROM production_recipes WHERE code='FAC_TOPPINGS'), (SELECT id FROM inventory_items WHERE code='ONIONS'), 6),
((SELECT id FROM production_recipes WHERE code='FAC_TOPPINGS'), (SELECT id FROM inventory_items WHERE code='VEGETABLES'), 4),
((SELECT id FROM production_recipes WHERE code='BAKE_MARGHERITA'), (SELECT id FROM inventory_items WHERE code='PIZZA_DOUGH'), 1),
((SELECT id FROM production_recipes WHERE code='BAKE_MARGHERITA'), (SELECT id FROM inventory_items WHERE code='TOMATO_SAUCE'), 1),
((SELECT id FROM production_recipes WHERE code='BAKE_GOLDEN_CORN'), (SELECT id FROM inventory_items WHERE code='PIZZA_DOUGH'), 1),
((SELECT id FROM production_recipes WHERE code='BAKE_GOLDEN_CORN'), (SELECT id FROM inventory_items WHERE code='TOMATO_SAUCE'), 1),
((SELECT id FROM production_recipes WHERE code='BAKE_GOLDEN_CORN'), (SELECT id FROM inventory_items WHERE code='CORN'), 2),
((SELECT id FROM production_recipes WHERE code='BAKE_ONION_HERB'), (SELECT id FROM inventory_items WHERE code='PIZZA_DOUGH'), 1),
((SELECT id FROM production_recipes WHERE code='BAKE_ONION_HERB'), (SELECT id FROM inventory_items WHERE code='TOMATO_SAUCE'), 1),
((SELECT id FROM production_recipes WHERE code='BAKE_ONION_HERB'), (SELECT id FROM inventory_items WHERE code='ONIONS'), 2),
((SELECT id FROM production_recipes WHERE code='BAKE_SUPREME_VEGGIE'), (SELECT id FROM inventory_items WHERE code='PIZZA_DOUGH'), 1),
((SELECT id FROM production_recipes WHERE code='BAKE_SUPREME_VEGGIE'), (SELECT id FROM inventory_items WHERE code='TOMATO_SAUCE'), 1),
((SELECT id FROM production_recipes WHERE code='BAKE_SUPREME_VEGGIE'), (SELECT id FROM inventory_items WHERE code='CORN'), 1),
((SELECT id FROM production_recipes WHERE code='BAKE_SUPREME_VEGGIE'), (SELECT id FROM inventory_items WHERE code='ONIONS'), 1),
((SELECT id FROM production_recipes WHERE code='BAKE_SUPREME_VEGGIE'), (SELECT id FROM inventory_items WHERE code='VEGETABLES'), 2);
