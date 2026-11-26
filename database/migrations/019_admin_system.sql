-- Migration 019: Admin Management System (Configurable Settings, Announcements, Monetization)
SET NAMES utf8mb4;
SET time_zone = '+00:00';

CREATE TABLE IF NOT EXISTS game_settings (
    setting_key VARCHAR(64) NOT NULL,
    setting_group ENUM('ECONOMY', 'BUSINESS', 'EMPLOYEE', 'GAMEPLAY', 'MAINTENANCE') NOT NULL,
    label VARCHAR(128) NOT NULL,
    setting_value VARCHAR(255) NOT NULL,
    value_type ENUM('NUMBER', 'BOOLEAN', 'STRING') NOT NULL DEFAULT 'NUMBER',
    description VARCHAR(255) NOT NULL,
    updated_by_user_id BIGINT UNSIGNED NULL DEFAULT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (setting_key),
    INDEX idx_game_settings_group (setting_group),
    CONSTRAINT fk_game_settings_user FOREIGN KEY (updated_by_user_id) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS game_announcements (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    title VARCHAR(160) NOT NULL,
    message TEXT NOT NULL,
    severity ENUM('INFO', 'WARNING', 'EVENT', 'MAINTENANCE') NOT NULL DEFAULT 'INFO',
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_by_user_id BIGINT UNSIGNED NOT NULL,
    expires_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_announcements_active (is_active, created_at),
    CONSTRAINT fk_announcements_user FOREIGN KEY (created_by_user_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS monetization_transactions (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    player_id BIGINT UNSIGNED NOT NULL,
    package_code VARCHAR(64) NOT NULL,
    amount_usd DECIMAL(10,2) NOT NULL,
    gems_granted INT UNSIGNED NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_monetization_created (created_at),
    CONSTRAINT fk_monetization_player FOREIGN KEY (player_id) REFERENCES player_profiles (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO game_settings (setting_key, setting_group, label, setting_value, value_type, description)
VALUES
    ('economy.tax_rate', 'ECONOMY', 'Corporate Tax Rate', '0.08', 'NUMBER', 'Global tax rate applied to empire net revenue (0.00 - 0.50).'),
    ('economy.inflation_multiplier', 'ECONOMY', 'Inflation Multiplier', '1.00', 'NUMBER', 'Global multiplier for wholesale and construction costs.'),
    ('economy.starting_cash', 'ECONOMY', 'New Player Starting Cash', '1000', 'NUMBER', 'Initial cash granted to newly registered players.'),
    ('economy.offline_cap_hours', 'ECONOMY', 'Offline Earnings Cap (Hours)', '4', 'NUMBER', 'Maximum offline hours accrued per session.'),
    ('business.rent_multiplier', 'BUSINESS', 'Global Rent Multiplier', '1.00', 'NUMBER', 'Multiplier for restaurant, factory, and mall facility upkeep.'),
    ('business.demand_multiplier', 'BUSINESS', 'Global Customer Demand', '1.00', 'NUMBER', 'Global customer footfall and order demand factor.'),
    ('employee.wage_multiplier', 'EMPLOYEE', 'Employee Wage Multiplier', '1.00', 'NUMBER', 'Global hourly payroll multiplier across all staff roles.'),
    ('employee.training_cost_multiplier', 'EMPLOYEE', 'Training Cost Multiplier', '1.00', 'NUMBER', 'Multiplier applied to employee skill training costs.'),
    ('gameplay.xp_multiplier', 'GAMEPLAY', 'Global XP Multiplier', '1.00', 'NUMBER', 'Experience point gain multiplier for all activities.'),
    ('gameplay.maintenance_mode', 'MAINTENANCE', 'Maintenance Mode', 'false', 'BOOLEAN', 'When true, pauses new player actions during maintenance.'),
    ('gameplay.allow_registrations', 'MAINTENANCE', 'Allow New Registrations', 'true', 'BOOLEAN', 'Controls whether new players can register accounts.');
