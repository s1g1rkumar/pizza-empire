-- Seed 005: Raw Materials & Packaging Items for 6-Category Inventory System
SET NAMES utf8mb4;
SET time_zone = '+00:00';

INSERT INTO inventory_items (code, name, description, category, unit_wholesale_buy, unit_wholesale_sell, low_stock_threshold, crop_id) VALUES
('MOZZARELLA_CHEESE', 'Mozzarella Cheese', 'Fresh stretched mozzarella for classic and gourmet pizzas.', 'RAW_MATERIAL', 9.00, 6.00, 15, NULL),
('OLIVE_OIL', 'Extra Virgin Olive Oil', 'Cold-pressed olive oil for dough and finishing.', 'RAW_MATERIAL', 7.50, 4.50, 10, NULL),
('SEA_SALT', 'Artisan Sea Salt', 'Fine sea salt for dough fermentation and sauce.', 'RAW_MATERIAL', 3.00, 1.50, 20, NULL),
('PIZZA_BOX_STD', 'Standard Pizza Box', 'Corrugated 14-inch insulated pizza delivery box.', 'PACKAGING', 1.20, 0.50, 25, NULL),
('SAUCE_JAR_GLASS', 'Glass Marinara Jar', 'Sterilized glass jar for bottled factory marinara.', 'PACKAGING', 1.50, 0.70, 20, NULL),
('FROZEN_SLEEVE', 'Retail Freezer Sleeve', 'Branded retail carton for supermarket frozen pizzas.', 'PACKAGING', 1.80, 0.80, 20, NULL)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    description = VALUES(description),
    category = VALUES(category),
    unit_wholesale_buy = VALUES(unit_wholesale_buy),
    unit_wholesale_sell = VALUES(unit_wholesale_sell),
    low_stock_threshold = VALUES(low_stock_threshold);
