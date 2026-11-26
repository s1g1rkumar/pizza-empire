-- Seed 006: Pizza Production Ingredients & 5 Pizza Recipes
SET NAMES utf8mb4;
SET time_zone = '+00:00';

-- Ensure Flour, Vegetables, and 5 Pizza Products exist in inventory_items
INSERT INTO inventory_items (code, name, description, category, unit_wholesale_buy, unit_wholesale_sell, low_stock_threshold, crop_id) VALUES
('FLOUR', 'Artisan Pizza Flour', 'Finely milled 00-grade wheat flour for pizza dough.', 'PROCESSED_INGREDIENT', 6.00, 3.50, 20, NULL),
('VEGETABLES', 'Fresh Garden Vegetables', 'Assorted bell peppers, mushrooms, and spinach.', 'RAW_CROP', 12.00, 8.50, 15, NULL),
('CLASSIC_TOMATO_PIZZA', 'Classic Tomato Pizza', 'Traditional wood-fired tomato sauce and herb pizza.', 'PIZZA', 0.00, 13.00, 5, NULL),
('MARGHERITA_PIZZA', 'Margherita Pizza', 'Fresh tomato sauce, mozzarella cheese, and basil.', 'PIZZA', 0.00, 16.00, 5, NULL),
('CHEESE_PIZZA', 'Cheese Pizza', 'Rich four-fold mozzarella cheese pizza.', 'PIZZA', 0.00, 18.00, 5, NULL),
('VEGETABLE_PIZZA', 'Vegetable Pizza', 'Loaded with fresh garden vegetables, onions, and tomatoes.', 'PIZZA', 0.00, 22.00, 5, NULL),
('PREMIUM_PIZZA', 'Premium Pizza', 'Signature gourmet pie with extra cheese, veggies, and marinara.', 'PIZZA', 0.00, 30.00, 5, NULL)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    description = VALUES(description),
    category = VALUES(category),
    unit_wholesale_buy = VALUES(unit_wholesale_buy),
    unit_wholesale_sell = VALUES(unit_wholesale_sell),
    low_stock_threshold = VALUES(low_stock_threshold);

-- Production Recipes (Prep + 5 Pizzas)
INSERT INTO production_recipes (code, name, facility_type, output_item_id, output_quantity, duration_seconds, unlock_xp_level) VALUES
('MILL_FLOUR', 'Mill Wheat into Flour', 'FACTORY', (SELECT id FROM inventory_items WHERE code='FLOUR'), 2, 20, 1),
('RECIPE_CLASSIC_TOMATO', 'Classic Tomato Pizza', 'RESTAURANT_OVEN', (SELECT id FROM inventory_items WHERE code='CLASSIC_TOMATO_PIZZA'), 1, 20, 1),
('RECIPE_MARGHERITA', 'Margherita Pizza', 'RESTAURANT_OVEN', (SELECT id FROM inventory_items WHERE code='MARGHERITA_PIZZA'), 1, 25, 1),
('RECIPE_CHEESE', 'Cheese Pizza', 'RESTAURANT_OVEN', (SELECT id FROM inventory_items WHERE code='CHEESE_PIZZA'), 1, 25, 2),
('RECIPE_VEGETABLE', 'Vegetable Pizza', 'RESTAURANT_OVEN', (SELECT id FROM inventory_items WHERE code='VEGETABLE_PIZZA'), 1, 30, 3),
('RECIPE_PREMIUM', 'Premium Pizza', 'RESTAURANT_OVEN', (SELECT id FROM inventory_items WHERE code='PREMIUM_PIZZA'), 1, 40, 4)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    duration_seconds = VALUES(duration_seconds),
    unlock_xp_level = VALUES(unlock_xp_level);

-- Recipe Ingredients
INSERT IGNORE INTO production_recipe_ingredients (recipe_id, item_id, quantity_required) VALUES
-- Mill Flour: 2x Wheat -> 2x Flour
((SELECT id FROM production_recipes WHERE code='MILL_FLOUR'), (SELECT id FROM inventory_items WHERE code='WHEAT'), 2),

-- 1. Classic Tomato Pizza: Flour + Tomato Sauce + Tomato + Pizza Box
((SELECT id FROM production_recipes WHERE code='RECIPE_CLASSIC_TOMATO'), (SELECT id FROM inventory_items WHERE code='FLOUR'), 1),
((SELECT id FROM production_recipes WHERE code='RECIPE_CLASSIC_TOMATO'), (SELECT id FROM inventory_items WHERE code='TOMATO_SAUCE'), 1),
((SELECT id FROM production_recipes WHERE code='RECIPE_CLASSIC_TOMATO'), (SELECT id FROM inventory_items WHERE code='TOMATOES'), 1),
((SELECT id FROM production_recipes WHERE code='RECIPE_CLASSIC_TOMATO'), (SELECT id FROM inventory_items WHERE code='PIZZA_BOX_STD'), 1),

-- 2. Margherita Pizza: Flour + Tomato Sauce + Cheese + Tomato + Pizza Box
((SELECT id FROM production_recipes WHERE code='RECIPE_MARGHERITA'), (SELECT id FROM inventory_items WHERE code='FLOUR'), 1),
((SELECT id FROM production_recipes WHERE code='RECIPE_MARGHERITA'), (SELECT id FROM inventory_items WHERE code='TOMATO_SAUCE'), 1),
((SELECT id FROM production_recipes WHERE code='RECIPE_MARGHERITA'), (SELECT id FROM inventory_items WHERE code='MOZZARELLA_CHEESE'), 1),
((SELECT id FROM production_recipes WHERE code='RECIPE_MARGHERITA'), (SELECT id FROM inventory_items WHERE code='TOMATOES'), 1),
((SELECT id FROM production_recipes WHERE code='RECIPE_MARGHERITA'), (SELECT id FROM inventory_items WHERE code='PIZZA_BOX_STD'), 1),

-- 3. Cheese Pizza: Flour + Tomato Sauce + 2x Cheese + Pizza Box
((SELECT id FROM production_recipes WHERE code='RECIPE_CHEESE'), (SELECT id FROM inventory_items WHERE code='FLOUR'), 1),
((SELECT id FROM production_recipes WHERE code='RECIPE_CHEESE'), (SELECT id FROM inventory_items WHERE code='TOMATO_SAUCE'), 1),
((SELECT id FROM production_recipes WHERE code='RECIPE_CHEESE'), (SELECT id FROM inventory_items WHERE code='MOZZARELLA_CHEESE'), 2),
((SELECT id FROM production_recipes WHERE code='RECIPE_CHEESE'), (SELECT id FROM inventory_items WHERE code='PIZZA_BOX_STD'), 1),

-- 4. Vegetable Pizza: Flour + Tomato Sauce + Cheese + Onion + Tomato + Vegetables + Pizza Box
((SELECT id FROM production_recipes WHERE code='RECIPE_VEGETABLE'), (SELECT id FROM inventory_items WHERE code='FLOUR'), 1),
((SELECT id FROM production_recipes WHERE code='RECIPE_VEGETABLE'), (SELECT id FROM inventory_items WHERE code='TOMATO_SAUCE'), 1),
((SELECT id FROM production_recipes WHERE code='RECIPE_VEGETABLE'), (SELECT id FROM inventory_items WHERE code='MOZZARELLA_CHEESE'), 1),
((SELECT id FROM production_recipes WHERE code='RECIPE_VEGETABLE'), (SELECT id FROM inventory_items WHERE code='ONIONS'), 1),
((SELECT id FROM production_recipes WHERE code='RECIPE_VEGETABLE'), (SELECT id FROM inventory_items WHERE code='TOMATOES'), 1),
((SELECT id FROM production_recipes WHERE code='RECIPE_VEGETABLE'), (SELECT id FROM inventory_items WHERE code='VEGETABLES'), 1),
((SELECT id FROM production_recipes WHERE code='RECIPE_VEGETABLE'), (SELECT id FROM inventory_items WHERE code='PIZZA_BOX_STD'), 1),

-- 5. Premium Pizza: 2x Flour + Tomato Sauce + 2x Cheese + Onion + Tomato + 2x Vegetables + Pizza Box
((SELECT id FROM production_recipes WHERE code='RECIPE_PREMIUM'), (SELECT id FROM inventory_items WHERE code='FLOUR'), 2),
((SELECT id FROM production_recipes WHERE code='RECIPE_PREMIUM'), (SELECT id FROM inventory_items WHERE code='TOMATO_SAUCE'), 1),
((SELECT id FROM production_recipes WHERE code='RECIPE_PREMIUM'), (SELECT id FROM inventory_items WHERE code='MOZZARELLA_CHEESE'), 2),
((SELECT id FROM production_recipes WHERE code='RECIPE_PREMIUM'), (SELECT id FROM inventory_items WHERE code='ONIONS'), 1),
((SELECT id FROM production_recipes WHERE code='RECIPE_PREMIUM'), (SELECT id FROM inventory_items WHERE code='TOMATOES'), 1),
((SELECT id FROM production_recipes WHERE code='RECIPE_PREMIUM'), (SELECT id FROM inventory_items WHERE code='VEGETABLES'), 2),
((SELECT id FROM production_recipes WHERE code='RECIPE_PREMIUM'), (SELECT id FROM inventory_items WHERE code='PIZZA_BOX_STD'), 1);
