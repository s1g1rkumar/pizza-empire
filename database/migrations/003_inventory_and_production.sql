-- Migration 003: Businesses, Inventory Items, Business Inventory, and Production System
-- Target: MySQL 8.0+

SET NAMES utf8mb4;
SET time_zone = '+00:00';

-- 14. Businesses (Unified Registry for Player Facilities)
CREATE TABLE IF NOT EXISTS businesses (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    player_id BIGINT UNSIGNED NOT NULL,
    location_id BIGINT UNSIGNED NOT NULL,
    business_type ENUM('FARM', 'RESTAURANT', 'FACTORY', 'DELIVERY_HUB', 'SUPERMARKET', 'MALL', 'CORPORATE_HQ') NOT NULL,
    name VARCHAR(128) NOT NULL,
    level INT UNSIGNED NOT NULL DEFAULT 1,
    storage_capacity INT UNSIGNED NOT NULL DEFAULT 200,
    hourly_upkeep DECIMAL(18,2) NOT NULL DEFAULT 10.00,
    is_operational TINYINT(1) NOT NULL DEFAULT 1,
    unlocked_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    PRIMARY KEY (id),
    INDEX idx_businesses_player_type (player_id, business_type),
    INDEX idx_businesses_location (location_id),
    CONSTRAINT fk_businesses_player FOREIGN KEY (player_id) REFERENCES player_profiles (id) ON DELETE CASCADE,
    CONSTRAINT fk_businesses_location FOREIGN KEY (location_id) REFERENCES locations (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Inventory Items (Master Catalog: Raw Crops, Processed Ingredients, Finished Pizzas)
CREATE TABLE IF NOT EXISTS inventory_items (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    code VARCHAR(64) NOT NULL,
    name VARCHAR(128) NOT NULL,
    category ENUM('RAW_CROP', 'PROCESSED_INGREDIENT', 'PIZZA', 'RETAIL_GOOD') NOT NULL,
    unit_wholesale_buy DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    unit_wholesale_sell DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    crop_id BIGINT UNSIGNED NULL DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_inventory_items_code (code),
    INDEX idx_inventory_items_category (category),
    CONSTRAINT fk_inventory_items_crop FOREIGN KEY (crop_id) REFERENCES crops (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Business Inventory (Strict Non-Negative Quantities)
CREATE TABLE IF NOT EXISTS business_inventory (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    player_id BIGINT UNSIGNED NOT NULL,
    business_id BIGINT UNSIGNED NOT NULL,
    item_id BIGINT UNSIGNED NOT NULL,
    quantity INT NOT NULL DEFAULT 0,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_business_inventory_biz_item (business_id, item_id),
    INDEX idx_business_inventory_player (player_id),
    CONSTRAINT fk_biz_inv_player FOREIGN KEY (player_id) REFERENCES player_profiles (id) ON DELETE CASCADE,
    CONSTRAINT fk_biz_inv_business FOREIGN KEY (business_id) REFERENCES businesses (id) ON DELETE CASCADE,
    CONSTRAINT fk_biz_inv_item FOREIGN KEY (item_id) REFERENCES inventory_items (id),
    CONSTRAINT chk_biz_inv_non_negative CHECK (quantity >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. Production Recipes (In-Kitchen Prep, Factory Batches, Pizza Baking)
CREATE TABLE IF NOT EXISTS production_recipes (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    code VARCHAR(64) NOT NULL,
    name VARCHAR(128) NOT NULL,
    facility_type ENUM('RESTAURANT_PREP', 'RESTAURANT_OVEN', 'FACTORY') NOT NULL,
    output_item_id BIGINT UNSIGNED NOT NULL,
    output_quantity INT UNSIGNED NOT NULL DEFAULT 1,
    duration_seconds INT UNSIGNED NOT NULL,
    unlock_xp_level INT UNSIGNED NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_production_recipes_code (code),
    INDEX idx_production_recipes_type (facility_type),
    CONSTRAINT fk_prod_recipes_output FOREIGN KEY (output_item_id) REFERENCES inventory_items (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. Production Recipe Ingredients
CREATE TABLE IF NOT EXISTS production_recipe_ingredients (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    recipe_id BIGINT UNSIGNED NOT NULL,
    item_id BIGINT UNSIGNED NOT NULL,
    quantity_required INT UNSIGNED NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_recipe_ingredient (recipe_id, item_id),
    CONSTRAINT fk_recipe_ing_recipe FOREIGN KEY (recipe_id) REFERENCES production_recipes (id) ON DELETE CASCADE,
    CONSTRAINT fk_recipe_ing_item FOREIGN KEY (item_id) REFERENCES inventory_items (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. Production Orders (Active Queues & Completed Batches)
CREATE TABLE IF NOT EXISTS production_orders (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    player_id BIGINT UNSIGNED NOT NULL,
    business_id BIGINT UNSIGNED NOT NULL,
    recipe_id BIGINT UNSIGNED NOT NULL,
    batch_multiplier INT UNSIGNED NOT NULL DEFAULT 1,
    status ENUM('QUEUED', 'IN_PROGRESS', 'COMPLETED', 'COLLECTED', 'CANCELLED') NOT NULL DEFAULT 'IN_PROGRESS',
    started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completes_at TIMESTAMP NOT NULL,
    collected_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_prod_orders_player_status (player_id, status),
    INDEX idx_prod_orders_biz_completes (business_id, completes_at),
    CONSTRAINT fk_prod_orders_player FOREIGN KEY (player_id) REFERENCES player_profiles (id) ON DELETE CASCADE,
    CONSTRAINT fk_prod_orders_business FOREIGN KEY (business_id) REFERENCES businesses (id) ON DELETE CASCADE,
    CONSTRAINT fk_prod_orders_recipe FOREIGN KEY (recipe_id) REFERENCES production_recipes (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
