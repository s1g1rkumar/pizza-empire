-- Migration 015: Delivery Vehicles (5 Types) and Delivery Zones
SET NAMES utf8mb4;
SET time_zone = '+00:00';

ALTER TABLE delivery_vehicles
    MODIFY COLUMN vehicle_type ENUM(
        'BICYCLE',
        'SCOOTER',
        'MOTORCYCLE',
        'CAR',
        'DELIVERY_VAN'
    ) NOT NULL DEFAULT 'BICYCLE',
    ADD COLUMN upgrade_level INT UNSIGNED NOT NULL DEFAULT 1 AFTER speed_multiplier;

CREATE TABLE IF NOT EXISTS delivery_zones (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    code VARCHAR(64) NOT NULL,
    name VARCHAR(128) NOT NULL,
    distance_km DECIMAL(5,2) NOT NULL DEFAULT 2.00,
    base_delivery_charge DECIMAL(18,2) NOT NULL DEFAULT 3.00,
    demand_weight DECIMAL(4,2) NOT NULL DEFAULT 1.00,
    PRIMARY KEY (id),
    UNIQUE KEY uq_delivery_zones_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE deliveries
    ADD COLUMN zone_id BIGINT UNSIGNED NULL DEFAULT NULL AFTER driver_employee_id,
    ADD CONSTRAINT fk_deliveries_zone FOREIGN KEY (zone_id) REFERENCES delivery_zones (id);

INSERT INTO delivery_zones (code, name, distance_km, base_delivery_charge, demand_weight) VALUES
('ZONE_LOCAL', 'Local Neighborhood', 1.50, 2.50, 1.20),
('ZONE_SUBURBS', 'Oakwood Suburbs', 3.50, 4.00, 1.10),
('ZONE_UNIVERSITY', 'University Campus', 4.50, 4.50, 1.35),
('ZONE_DOWNTOWN', 'Downtown Core', 6.00, 6.00, 1.25),
('ZONE_FINANCIAL', 'Financial District', 8.00, 8.50, 1.15)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    base_delivery_charge = VALUES(base_delivery_charge);
