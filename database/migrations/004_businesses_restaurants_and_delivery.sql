-- Migration 004: Restaurants, Menus, Customers, Customer Orders, Delivery Vehicles, and Deliveries
-- Target: MySQL 8.0+

SET NAMES utf8mb4;
SET time_zone = '+00:00';

-- 15. Restaurants
CREATE TABLE IF NOT EXISTS restaurants (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    player_id BIGINT UNSIGNED NOT NULL,
    business_id BIGINT UNSIGNED NOT NULL,
    oven_count INT UNSIGNED NOT NULL DEFAULT 1,
    prep_station_count INT UNSIGNED NOT NULL DEFAULT 1,
    dining_tables_count INT UNSIGNED NOT NULL DEFAULT 2,
    avg_rating DECIMAL(3,2) NOT NULL DEFAULT 4.00,
    total_ratings_count BIGINT UNSIGNED NOT NULL DEFAULT 0,
    decor_level INT UNSIGNED NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_restaurants_business_id (business_id),
    INDEX idx_restaurants_player (player_id),
    CONSTRAINT fk_restaurants_player FOREIGN KEY (player_id) REFERENCES player_profiles (id) ON DELETE CASCADE,
    CONSTRAINT fk_restaurants_business FOREIGN KEY (business_id) REFERENCES businesses (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 16. Restaurant Menus
CREATE TABLE IF NOT EXISTS restaurant_menus (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    player_id BIGINT UNSIGNED NOT NULL,
    restaurant_id BIGINT UNSIGNED NOT NULL,
    item_id BIGINT UNSIGNED NOT NULL,
    base_price DECIMAL(18,2) NOT NULL,
    custom_price DECIMAL(18,2) NOT NULL,
    star_quality TINYINT UNSIGNED NOT NULL DEFAULT 1,
    is_enabled TINYINT(1) NOT NULL DEFAULT 1,
    total_sold BIGINT UNSIGNED NOT NULL DEFAULT 0,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_restaurant_menus_rest_item (restaurant_id, item_id),
    INDEX idx_restaurant_menus_player (player_id),
    CONSTRAINT fk_rest_menus_player FOREIGN KEY (player_id) REFERENCES player_profiles (id) ON DELETE CASCADE,
    CONSTRAINT fk_rest_menus_restaurant FOREIGN KEY (restaurant_id) REFERENCES restaurants (id) ON DELETE CASCADE,
    CONSTRAINT fk_rest_menus_item FOREIGN KEY (item_id) REFERENCES inventory_items (id),
    CONSTRAINT chk_menu_price_positive CHECK (custom_price > 0.00)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 17. Customers (Simulated Archetypes / Recurring Profiles)
CREATE TABLE IF NOT EXISTS customers (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    code VARCHAR(64) NOT NULL,
    archetype_name VARCHAR(64) NOT NULL,
    price_sensitivity DECIMAL(4,2) NOT NULL DEFAULT 1.00,
    tip_generosity DECIMAL(4,2) NOT NULL DEFAULT 1.00,
    patience_seconds INT UNSIGNED NOT NULL DEFAULT 60,
    PRIMARY KEY (id),
    UNIQUE KEY uq_customers_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 18. Customer Orders
CREATE TABLE IF NOT EXISTS customer_orders (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    player_id BIGINT UNSIGNED NOT NULL,
    restaurant_id BIGINT UNSIGNED NOT NULL,
    customer_id BIGINT UNSIGNED NOT NULL,
    item_id BIGINT UNSIGNED NOT NULL,
    order_channel ENUM('DINE_IN', 'TAKEAWAY', 'DELIVERY') NOT NULL DEFAULT 'DINE_IN',
    quantity INT UNSIGNED NOT NULL DEFAULT 1,
    unit_price DECIMAL(18,2) NOT NULL,
    tip_amount DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    total_amount DECIMAL(18,2) NOT NULL,
    satisfaction_score DECIMAL(3,2) NULL DEFAULT NULL,
    status ENUM('PENDING', 'BAKING', 'READY_FOR_DELIVERY', 'SERVED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    ordered_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fulfilled_at TIMESTAMP NULL DEFAULT NULL,
    PRIMARY KEY (id),
    INDEX idx_cust_orders_player_status (player_id, status),
    INDEX idx_cust_orders_rest_ordered (restaurant_id, ordered_at),
    CONSTRAINT fk_cust_orders_player FOREIGN KEY (player_id) REFERENCES player_profiles (id) ON DELETE CASCADE,
    CONSTRAINT fk_cust_orders_restaurant FOREIGN KEY (restaurant_id) REFERENCES restaurants (id) ON DELETE CASCADE,
    CONSTRAINT fk_cust_orders_customer FOREIGN KEY (customer_id) REFERENCES customers (id),
    CONSTRAINT fk_cust_orders_item FOREIGN KEY (item_id) REFERENCES inventory_items (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 19. Delivery Vehicles
CREATE TABLE IF NOT EXISTS delivery_vehicles (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    player_id BIGINT UNSIGNED NOT NULL,
    business_id BIGINT UNSIGNED NOT NULL,
    vehicle_type ENUM('SCOOTER', 'E_BIKE', 'DELIVERY_VAN', 'AUTONOMOUS_DRONE') NOT NULL DEFAULT 'SCOOTER',
    name VARCHAR(64) NOT NULL,
    capacity INT UNSIGNED NOT NULL DEFAULT 2,
    speed_multiplier DECIMAL(4,2) NOT NULL DEFAULT 1.00,
    hourly_maintenance DECIMAL(18,2) NOT NULL DEFAULT 4.00,
    status ENUM('IDLE', 'ON_ROUTE', 'MAINTENANCE') NOT NULL DEFAULT 'IDLE',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    PRIMARY KEY (id),
    INDEX idx_vehicles_player_status (player_id, status),
    INDEX idx_vehicles_business (business_id),
    CONSTRAINT fk_vehicles_player FOREIGN KEY (player_id) REFERENCES player_profiles (id) ON DELETE CASCADE,
    CONSTRAINT fk_vehicles_business FOREIGN KEY (business_id) REFERENCES businesses (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 20. Deliveries
CREATE TABLE IF NOT EXISTS deliveries (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    player_id BIGINT UNSIGNED NOT NULL,
    customer_order_id BIGINT UNSIGNED NOT NULL,
    vehicle_id BIGINT UNSIGNED NOT NULL,
    driver_employee_id BIGINT UNSIGNED NULL DEFAULT NULL,
    delivery_fee DECIMAL(18,2) NOT NULL DEFAULT 3.00,
    tip_amount DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    is_on_time TINYINT(1) NULL DEFAULT NULL,
    status ENUM('DISPATCHED', 'DELIVERED', 'FAILED') NOT NULL DEFAULT 'DISPATCHED',
    dispatched_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    eta_at TIMESTAMP NOT NULL,
    delivered_at TIMESTAMP NULL DEFAULT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_deliveries_order_id (customer_order_id),
    INDEX idx_deliveries_player_status (player_id, status),
    INDEX idx_deliveries_vehicle_eta (vehicle_id, eta_at),
    CONSTRAINT fk_deliveries_player FOREIGN KEY (player_id) REFERENCES player_profiles (id) ON DELETE CASCADE,
    CONSTRAINT fk_deliveries_order FOREIGN KEY (customer_order_id) REFERENCES customer_orders (id) ON DELETE CASCADE,
    CONSTRAINT fk_deliveries_vehicle FOREIGN KEY (vehicle_id) REFERENCES delivery_vehicles (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
