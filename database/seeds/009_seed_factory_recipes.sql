-- Seed 009: Production Recipes for All 5 Food Processing Factory Types
SET NAMES utf8mb4;
SET time_zone = '+00:00';

INSERT INTO production_recipes (code, name, facility_type, output_item_id, output_quantity, duration_seconds, unlock_xp_level) VALUES
('FAC_FLOUR_BATCH', 'Bulk Flour Milling', 'FACTORY', (SELECT id FROM inventory_items WHERE code='FLOUR'), 10, 25, 1),
('FAC_SAUCE_BATCH', 'Industrial Tomato Sauce', 'FACTORY', (SELECT id FROM inventory_items WHERE code='TOMATO_SAUCE'), 10, 30, 1),
('FAC_CHEESE_BATCH', 'Artisan Mozzarella Batch', 'FACTORY', (SELECT id FROM inventory_items WHERE code='MOZZARELLA_CHEESE'), 8, 35, 1),
('FAC_VEG_BATCH', 'Processed Veggie Toppings', 'FACTORY', (SELECT id FROM inventory_items WHERE code='PREPPED_TOPPINGS'), 12, 25, 1),
('FAC_BOX_BATCH', 'Pizza Box Manufacturing', 'FACTORY', (SELECT id FROM inventory_items WHERE code='PIZZA_BOX_STD'), 20, 20, 1)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    output_quantity = VALUES(output_quantity),
    duration_seconds = VALUES(duration_seconds);

INSERT IGNORE INTO production_recipe_ingredients (recipe_id, item_id, quantity_required) VALUES
((SELECT id FROM production_recipes WHERE code='FAC_FLOUR_BATCH'), (SELECT id FROM inventory_items WHERE code='WHEAT'), 8),
((SELECT id FROM production_recipes WHERE code='FAC_SAUCE_BATCH'), (SELECT id FROM inventory_items WHERE code='TOMATOES'), 8),
((SELECT id FROM production_recipes WHERE code='FAC_SAUCE_BATCH'), (SELECT id FROM inventory_items WHERE code='ONIONS'), 2),
((SELECT id FROM production_recipes WHERE code='FAC_SAUCE_BATCH'), (SELECT id FROM inventory_items WHERE code='SEA_SALT'), 1),
((SELECT id FROM production_recipes WHERE code='FAC_CHEESE_BATCH'), (SELECT id FROM inventory_items WHERE code='SEA_SALT'), 2),
((SELECT id FROM production_recipes WHERE code='FAC_VEG_BATCH'), (SELECT id FROM inventory_items WHERE code='CORN'), 4),
((SELECT id FROM production_recipes WHERE code='FAC_VEG_BATCH'), (SELECT id FROM inventory_items WHERE code='ONIONS'), 4),
((SELECT id FROM production_recipes WHERE code='FAC_VEG_BATCH'), (SELECT id FROM inventory_items WHERE code='VEGETABLES'), 4),
((SELECT id FROM production_recipes WHERE code='FAC_BOX_BATCH'), (SELECT id FROM inventory_items WHERE code='WHEAT'), 2);
