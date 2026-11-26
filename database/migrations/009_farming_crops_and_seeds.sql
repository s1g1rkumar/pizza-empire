-- Migration 009: Farming Crop Rules (water_requirement, quality) & Seed Inventory
SET NAMES utf8mb4;
SET time_zone = '+00:00';

ALTER TABLE crops
    ADD COLUMN water_requirement TINYINT UNSIGNED NOT NULL DEFAULT 100 AFTER growth_seconds,
    ADD COLUMN quality DECIMAL(3,2) NOT NULL DEFAULT 1.00 AFTER market_sell_price;

CREATE TABLE IF NOT EXISTS player_seed_inventory (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    player_id BIGINT UNSIGNED NOT NULL,
    crop_id BIGINT UNSIGNED NOT NULL,
    quantity INT NOT NULL DEFAULT 0,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_player_seed_inv (player_id, crop_id),
    CONSTRAINT fk_seed_inv_player FOREIGN KEY (player_id) REFERENCES player_profiles (id) ON DELETE CASCADE,
    CONSTRAINT fk_seed_inv_crop FOREIGN KEY (crop_id) REFERENCES crops (id),
    CONSTRAINT chk_seed_inv_non_negative CHECK (quantity >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
