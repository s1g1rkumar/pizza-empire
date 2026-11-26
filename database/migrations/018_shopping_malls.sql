-- Migration 018: Shopping Mall Business (Commercial Lands, Malls, Modular Units, Rental Agreements)
SET NAMES utf8mb4;
SET time_zone = '+00:00';

CREATE TABLE IF NOT EXISTS mall_lands (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    player_id BIGINT UNSIGNED NOT NULL,
    location_id BIGINT UNSIGNED NOT NULL,
    parcel_name VARCHAR(128) NOT NULL,
    size_sqft INT UNSIGNED NOT NULL DEFAULT 25000,
    max_floors INT UNSIGNED NOT NULL DEFAULT 4,
    purchase_price DECIMAL(18,2) NOT NULL,
    is_developed TINYINT(1) NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_mall_lands_player (player_id),
    CONSTRAINT fk_mall_lands_player FOREIGN KEY (player_id) REFERENCES player_profiles (id) ON DELETE CASCADE,
    CONSTRAINT fk_mall_lands_location FOREIGN KEY (location_id) REFERENCES locations (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS malls (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    player_id BIGINT UNSIGNED NOT NULL,
    business_id BIGINT UNSIGNED NOT NULL,
    mall_land_id BIGINT UNSIGNED NOT NULL,
    mall_tier ENUM('BOUTIQUE_PLAZA', 'CITY_GALLERIA', 'MEGA_MALL') NOT NULL DEFAULT 'BOUTIQUE_PLAZA',
    floors_count INT UNSIGNED NOT NULL DEFAULT 1,
    shops_per_floor INT UNSIGNED NOT NULL DEFAULT 4,
    parking_spaces INT UNSIGNED NOT NULL DEFAULT 60,
    parking_level INT UNSIGNED NOT NULL DEFAULT 1,
    daily_visitors INT UNSIGNED NOT NULL DEFAULT 0,
    total_rental_income DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    last_collected_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_malls_business_id (business_id),
    UNIQUE KEY uq_malls_land_id (mall_land_id),
    INDEX idx_malls_player (player_id),
    CONSTRAINT fk_malls_player FOREIGN KEY (player_id) REFERENCES player_profiles (id) ON DELETE CASCADE,
    CONSTRAINT fk_malls_business FOREIGN KEY (business_id) REFERENCES businesses (id) ON DELETE CASCADE,
    CONSTRAINT fk_malls_land FOREIGN KEY (mall_land_id) REFERENCES mall_lands (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS mall_units (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    player_id BIGINT UNSIGNED NOT NULL,
    mall_id BIGINT UNSIGNED NOT NULL,
    floor_number INT UNSIGNED NOT NULL DEFAULT 1,
    unit_type VARCHAR(48) NOT NULL,
    unit_name VARCHAR(128) NOT NULL,
    occupancy_status ENUM('VACANT', 'LEASED', 'SELF_OPERATED') NOT NULL DEFAULT 'VACANT',
    tenant_name VARCHAR(128) NULL DEFAULT NULL,
    monthly_rent DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    lease_months INT UNSIGNED NOT NULL DEFAULT 12,
    operating_cost_hourly DECIMAL(18,2) NOT NULL DEFAULT 5.00,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_mall_units_mall_floor (mall_id, floor_number),
    INDEX idx_mall_units_player (player_id),
    CONSTRAINT fk_mall_units_player FOREIGN KEY (player_id) REFERENCES player_profiles (id) ON DELETE CASCADE,
    CONSTRAINT fk_mall_units_mall FOREIGN KEY (mall_id) REFERENCES malls (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
