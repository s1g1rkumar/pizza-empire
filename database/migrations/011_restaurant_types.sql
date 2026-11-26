-- Migration 011: Restaurant Types Support
SET NAMES utf8mb4;
SET time_zone = '+00:00';

ALTER TABLE restaurants
    ADD COLUMN restaurant_type ENUM(
        'SMALL_SHOP',
        'STANDARD',
        'PREMIUM',
        'FAMILY',
        'LUXURY'
    ) NOT NULL DEFAULT 'SMALL_SHOP' AFTER business_id;
