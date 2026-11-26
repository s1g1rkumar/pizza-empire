-- Migration 016: Restaurant Chain 6 Locations, Branch Managers, and Rent Management
SET NAMES utf8mb4;
SET time_zone = '+00:00';

ALTER TABLE locations
    MODIFY COLUMN district_type ENUM(
        'RURAL',
        'SUBURBS',
        'RESIDENTIAL',
        'DOWNTOWN',
        'UNIVERSITY',
        'FINANCIAL',
        'INDUSTRIAL',
        'AIRPORT',
        'BUSINESS_DISTRICT',
        'SHOPPING_STREET'
    ) NOT NULL;

INSERT INTO locations (code, name, district_type, demand_multiplier, rent_multiplier, price_elasticity, unlock_level_number) VALUES
('LOC_DOWNTOWN', 'Downtown', 'DOWNTOWN', 1.60, 1.50, 0.95, 1),
('LOC_RESIDENTIAL', 'Residential', 'RESIDENTIAL', 1.20, 0.90, 1.10, 1),
('LOC_UNIVERSITY', 'University', 'UNIVERSITY', 1.45, 1.15, 1.25, 1),
('LOC_AIRPORT', 'Airport', 'AIRPORT', 1.90, 2.20, 0.70, 2),
('LOC_BUSINESS_DISTRICT', 'Business District', 'BUSINESS_DISTRICT', 1.75, 1.80, 0.85, 2),
('LOC_SHOPPING_STREET', 'Shopping Street', 'SHOPPING_STREET', 1.65, 1.60, 0.90, 2)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    demand_multiplier = VALUES(demand_multiplier),
    rent_multiplier = VALUES(rent_multiplier),
    price_elasticity = VALUES(price_elasticity);

ALTER TABLE restaurants
    ADD COLUMN manager_employee_id BIGINT UNSIGNED NULL DEFAULT NULL AFTER decor_level,
    ADD COLUMN monthly_rent DECIMAL(18,2) NOT NULL DEFAULT 500.00 AFTER manager_employee_id,
    ADD CONSTRAINT fk_restaurants_manager FOREIGN KEY (manager_employee_id) REFERENCES employees (id) ON DELETE SET NULL;
