-- Migration 014: Food Processing Factories (5 Factory Types, Machines, Queue Capacity)
SET NAMES utf8mb4;
SET time_zone = '+00:00';

CREATE TABLE IF NOT EXISTS factories (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    player_id BIGINT UNSIGNED NOT NULL,
    business_id BIGINT UNSIGNED NOT NULL,
    factory_type ENUM(
        'FLOUR_MILL',
        'TOMATO_SAUCE_FACTORY',
        'DAIRY_FACTORY',
        'VEGETABLE_PROCESSING_FACTORY',
        'PACKAGING_FACTORY'
    ) NOT NULL,
    machine_count INT UNSIGNED NOT NULL DEFAULT 1,
    queue_capacity INT UNSIGNED NOT NULL DEFAULT 3,
    speed_multiplier DECIMAL(4,2) NOT NULL DEFAULT 1.00,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_factories_business_id (business_id),
    INDEX idx_factories_player (player_id),
    CONSTRAINT fk_factories_player FOREIGN KEY (player_id) REFERENCES player_profiles (id) ON DELETE CASCADE,
    CONSTRAINT fk_factories_business FOREIGN KEY (business_id) REFERENCES businesses (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
