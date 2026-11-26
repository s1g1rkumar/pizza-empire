-- Migration 012: Complete 8-Department Employee Management (500-Employee Cap, Experience, Status, Business Capacity)
SET NAMES utf8mb4;
SET time_zone = '+00:00';

ALTER TABLE businesses
    ADD COLUMN max_employees INT UNSIGNED NOT NULL DEFAULT 30 AFTER hourly_upkeep;

ALTER TABLE employees
    MODIFY COLUMN department ENUM(
        'FARMING',
        'PRODUCTION',
        'RESTAURANT',
        'DELIVERY',
        'RETAIL',
        'LOGISTICS',
        'MANAGEMENT',
        'CORPORATE'
    ) NOT NULL,
    MODIFY COLUMN role ENUM(
        'FARMHAND',
        'AGRONOMIST',
        'PREP_COOK',
        'PIZZA_CHEF',
        'CASHIER',
        'STORE_MANAGER',
        'FACTORY_WORKER',
        'QUALITY_INSPECTOR',
        'MAINTENANCE_TECH',
        'DELIVERY_DRIVER',
        'FLEET_DISPATCHER',
        'LOGISTICS_COORDINATOR',
        'RETAIL_CLERK',
        'REGIONAL_DIRECTOR',
        'EXECUTIVE'
    ) NOT NULL,
    ADD COLUMN experience INT UNSIGNED NOT NULL DEFAULT 0 AFTER skill_level,
    ADD COLUMN employment_status ENUM('ACTIVE', 'ON_LEAVE', 'STRIKING', 'TERMINATED') NOT NULL DEFAULT 'ACTIVE' AFTER is_shift_lead;

CREATE INDEX idx_employees_player_status ON employees (player_id, employment_status, deleted_at);
