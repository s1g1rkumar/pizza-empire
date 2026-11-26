-- Migration 017: Supermarket Management (Stores, Product Listings, Retail Goods)
SET NAMES utf8mb4;
SET time_zone = '+00:00';

CREATE TABLE IF NOT EXISTS supermarkets (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    player_id BIGINT UNSIGNED NOT NULL,
    business_id BIGINT UNSIGNED NOT NULL,
    store_tier ENUM('MINI_MART', 'SUPERMARKET', 'HYPERMARKET') NOT NULL DEFAULT 'MINI_MART',
    aisle_level INT UNSIGNED NOT NULL DEFAULT 1,
    checkout_lanes INT UNSIGNED NOT NULL DEFAULT 2,
    cold_storage_level INT UNSIGNED NOT NULL DEFAULT 1,
    decor_level INT UNSIGNED NOT NULL DEFAULT 1,
    daily_sales_count BIGINT UNSIGNED NOT NULL DEFAULT 0,
    total_revenue DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    total_cogs DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    last_sale_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_supermarkets_business_id (business_id),
    INDEX idx_supermarkets_player (player_id),
    CONSTRAINT fk_supermarkets_player FOREIGN KEY (player_id) REFERENCES player_profiles (id) ON DELETE CASCADE,
    CONSTRAINT fk_supermarkets_business FOREIGN KEY (business_id) REFERENCES businesses (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS supermarket_listings (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    player_id BIGINT UNSIGNED NOT NULL,
    supermarket_id BIGINT UNSIGNED NOT NULL,
    item_id BIGINT UNSIGNED NOT NULL,
    base_retail_price DECIMAL(18,2) NOT NULL,
    custom_price DECIMAL(18,2) NOT NULL,
    is_enabled TINYINT(1) NOT NULL DEFAULT 1,
    total_sold BIGINT UNSIGNED NOT NULL DEFAULT 0,
    total_revenue DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_supermarket_listings_store_item (supermarket_id, item_id),
    INDEX idx_supermarket_listings_player (player_id),
    CONSTRAINT fk_sm_listings_player FOREIGN KEY (player_id) REFERENCES player_profiles (id) ON DELETE CASCADE,
    CONSTRAINT fk_sm_listings_store FOREIGN KEY (supermarket_id) REFERENCES supermarkets (id) ON DELETE CASCADE,
    CONSTRAINT fk_sm_listings_item FOREIGN KEY (item_id) REFERENCES inventory_items (id),
    CONSTRAINT chk_sm_listing_price_positive CHECK (custom_price > 0.00)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed retail supermarket goods into centralized inventory_items catalog
INSERT IGNORE INTO inventory_items (code, name, category, unit_wholesale_buy, unit_wholesale_sell, description, low_stock_threshold)
VALUES
    ('RETAIL_FROZEN_PIZZA', 'Frozen Artisan Pizza', 'RETAIL_GOOD', 6.50, 12.99, 'Ready-to-bake frozen gourmet pizza for retail shelves', 15),
    ('RETAIL_GARLIC_BREAD', 'Garlic Herb Bread', 'RETAIL_GOOD', 2.40, 5.49, 'Bakery-fresh garlic bread loaf', 20),
    ('RETAIL_OLIVE_OIL', 'Extra Virgin Olive Oil', 'RETAIL_GOOD', 5.00, 11.50, 'Cold-pressed Italian olive oil bottle', 12),
    ('RETAIL_SPARKLING_SODA', 'Craft Cola 6-Pack', 'RETAIL_GOOD', 3.20, 6.99, 'Six-pack of artisan sparkling soda', 20),
    ('RETAIL_PASTA_BOX', 'Artisan Pasta Box', 'RETAIL_GOOD', 2.10, 4.99, 'Stone-milled durum wheat pasta', 25),
    ('RETAIL_DESSERT_CAKE', 'Tiramisu Family Pack', 'RETAIL_GOOD', 4.80, 10.99, 'Chilled Italian tiramisu dessert', 10);
