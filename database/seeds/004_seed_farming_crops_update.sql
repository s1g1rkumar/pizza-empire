-- Seed 004: Complete 6-Crop Farming Catalog (Tomato, Wheat, Corn, Onion, Potato, Pepper)
SET NAMES utf8mb4;
SET time_zone = '+00:00';

INSERT INTO crops (code, name, seed_cost, growth_seconds, water_requirement, base_yield, market_sell_price, quality, unlock_xp_level) VALUES
('TOMATOES', 'Tomato', 5.00, 30, 60, 4, 3.00, 1.00, 1),
('WHEAT', 'Wheat', 4.00, 45, 50, 5, 2.50, 1.00, 1),
('CORN', 'Corn', 8.00, 60, 70, 4, 4.50, 1.05, 2),
('ONIONS', 'Onion', 10.00, 75, 65, 4, 5.50, 1.05, 3),
('POTATOES', 'Potato', 12.00, 90, 75, 5, 6.00, 1.10, 3),
('PEPPERS', 'Pepper', 15.00, 110, 80, 3, 9.50, 1.15, 4)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    seed_cost = VALUES(seed_cost),
    growth_seconds = VALUES(growth_seconds),
    water_requirement = VALUES(water_requirement),
    base_yield = VALUES(base_yield),
    market_sell_price = VALUES(market_sell_price),
    quality = VALUES(quality),
    unlock_xp_level = VALUES(unlock_xp_level);

INSERT INTO inventory_items (code, name, category, unit_wholesale_buy, unit_wholesale_sell, crop_id)
SELECT c.code, c.name, 'RAW_CROP', ROUND(c.market_sell_price * 1.40, 2), c.market_sell_price, c.id
FROM crops c
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    unit_wholesale_buy = VALUES(unit_wholesale_buy),
    unit_wholesale_sell = VALUES(unit_wholesale_sell);
