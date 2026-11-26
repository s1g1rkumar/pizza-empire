-- Migration 002: Locations, Lands, Farms, Crops, and Farm Plots
-- Target: MySQL 8.0+

SET NAMES utf8mb4;
SET time_zone = '+00:00';

-- 30. Locations (City Districts / Regions)
CREATE TABLE IF NOT EXISTS locations (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    code VARCHAR(64) NOT NULL,
    name VARCHAR(128) NOT NULL,
    district_type ENUM('RURAL', 'SUBURBS', 'DOWNTOWN', 'UNIVERSITY', 'FINANCIAL', 'INDUSTRIAL') NOT NULL,
    demand_multiplier DECIMAL(5,2) NOT NULL DEFAULT 1.00,
    rent_multiplier DECIMAL(5,2) NOT NULL DEFAULT 1.00,
    price_elasticity DECIMAL(5,2) NOT NULL DEFAULT 1.00,
    unlock_level_number INT UNSIGNED NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_locations_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Lands
CREATE TABLE IF NOT EXISTS lands (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    player_id BIGINT UNSIGNED NOT NULL,
    location_id BIGINT UNSIGNED NOT NULL,
    name VARCHAR(128) NOT NULL DEFAULT 'Starter Acreage',
    total_plots_capacity INT UNSIGNED NOT NULL DEFAULT 12,
    unlocked_plots_count INT UNSIGNED NOT NULL DEFAULT 2,
    purchase_price DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    PRIMARY KEY (id),
    INDEX idx_lands_player (player_id),
    INDEX idx_lands_location (location_id),
    CONSTRAINT fk_lands_player FOREIGN KEY (player_id) REFERENCES player_profiles (id) ON DELETE CASCADE,
    CONSTRAINT fk_lands_location FOREIGN KEY (location_id) REFERENCES locations (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Farms
CREATE TABLE IF NOT EXISTS farms (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    player_id BIGINT UNSIGNED NOT NULL,
    land_id BIGINT UNSIGNED NOT NULL,
    name VARCHAR(128) NOT NULL DEFAULT 'Green Valley Farm',
    irrigation_level INT UNSIGNED NOT NULL DEFAULT 0,
    barn_capacity INT UNSIGNED NOT NULL DEFAULT 200,
    auto_sell_overflow TINYINT(1) NOT NULL DEFAULT 0,
    hourly_upkeep DECIMAL(18,2) NOT NULL DEFAULT 5.00,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_farms_land_id (land_id),
    INDEX idx_farms_player (player_id),
    CONSTRAINT fk_farms_player FOREIGN KEY (player_id) REFERENCES player_profiles (id) ON DELETE CASCADE,
    CONSTRAINT fk_farms_land FOREIGN KEY (land_id) REFERENCES lands (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Crops (Catalog)
CREATE TABLE IF NOT EXISTS crops (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    code VARCHAR(64) NOT NULL,
    name VARCHAR(64) NOT NULL,
    seed_cost DECIMAL(18,2) NOT NULL,
    growth_seconds INT UNSIGNED NOT NULL,
    base_yield INT UNSIGNED NOT NULL,
    market_sell_price DECIMAL(18,2) NOT NULL,
    unlock_xp_level INT UNSIGNED NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_crops_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Farm Plots
CREATE TABLE IF NOT EXISTS farm_plots (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    player_id BIGINT UNSIGNED NOT NULL,
    farm_id BIGINT UNSIGNED NOT NULL,
    plot_index INT UNSIGNED NOT NULL,
    is_unlocked TINYINT(1) NOT NULL DEFAULT 0,
    crop_id BIGINT UNSIGNED NULL DEFAULT NULL,
    status ENUM('EMPTY', 'GROWING', 'READY') NOT NULL DEFAULT 'EMPTY',
    hydration_pct TINYINT UNSIGNED NOT NULL DEFAULT 100,
    fertilizer_type ENUM('NONE', 'COMPOST', 'BIO_NUTRIENT') NOT NULL DEFAULT 'NONE',
    planted_at TIMESTAMP NULL DEFAULT NULL,
    ready_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_farm_plots_farm_index (farm_id, plot_index),
    INDEX idx_farm_plots_player_status (player_id, status),
    INDEX idx_farm_plots_ready_at (ready_at),
    CONSTRAINT fk_farm_plots_player FOREIGN KEY (player_id) REFERENCES player_profiles (id) ON DELETE CASCADE,
    CONSTRAINT fk_farm_plots_farm FOREIGN KEY (farm_id) REFERENCES farms (id) ON DELETE CASCADE,
    CONSTRAINT fk_farm_plots_crop FOREIGN KEY (crop_id) REFERENCES crops (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
