-- Migration 006: Upgrades, Missions, Achievements, Notifications, Game Configuration, Snapshots & Support Tables
-- Target: MySQL 8.0+

SET NAMES utf8mb4;
SET time_zone = '+00:00';

-- 24. Business Upgrades (Catalog)
CREATE TABLE IF NOT EXISTS business_upgrades (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    code VARCHAR(64) NOT NULL,
    name VARCHAR(128) NOT NULL,
    category ENUM('FACILITY_CAPACITY', 'EQUIPMENT_SPEED', 'RECIPE_QUALITY', 'LOGISTICS_FLEET', 'EMPIRE_TECH') NOT NULL,
    business_type ENUM('FARM', 'RESTAURANT', 'FACTORY', 'DELIVERY_HUB', 'GLOBAL') NOT NULL,
    max_level INT UNSIGNED NOT NULL DEFAULT 10,
    base_cost DECIMAL(18,2) NOT NULL,
    cost_growth_factor DECIMAL(5,2) NOT NULL DEFAULT 1.65,
    effect_per_level DECIMAL(8,4) NOT NULL,
    unlock_level_number INT UNSIGNED NOT NULL DEFAULT 1,
    description VARCHAR(255) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_business_upgrades_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 25. Player Upgrades
CREATE TABLE IF NOT EXISTS player_upgrades (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    player_id BIGINT UNSIGNED NOT NULL,
    upgrade_id BIGINT UNSIGNED NOT NULL,
    business_id BIGINT UNSIGNED NULL DEFAULT NULL,
    business_scope_id BIGINT UNSIGNED NOT NULL DEFAULT 0,
    current_level INT UNSIGNED NOT NULL DEFAULT 0,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_player_upgrades_unique (player_id, upgrade_id, business_scope_id),
    CONSTRAINT fk_player_upgrades_player FOREIGN KEY (player_id) REFERENCES player_profiles (id) ON DELETE CASCADE,
    CONSTRAINT fk_player_upgrades_upgrade FOREIGN KEY (upgrade_id) REFERENCES business_upgrades (id),
    CONSTRAINT fk_player_upgrades_business FOREIGN KEY (business_id) REFERENCES businesses (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 26. Missions (Catalog)
CREATE TABLE IF NOT EXISTS missions (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    code VARCHAR(64) NOT NULL,
    title VARCHAR(128) NOT NULL,
    mission_type ENUM('ONBOARDING', 'FARMING', 'RESTAURANT', 'FACTORY', 'DELIVERY', 'WORKFORCE', 'FINANCE', 'EXPANSION', 'DAILY') NOT NULL,
    target_metric VARCHAR(64) NOT NULL,
    target_value BIGINT UNSIGNED NOT NULL,
    reward_cash DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    reward_xp BIGINT UNSIGNED NOT NULL DEFAULT 0,
    reward_gems INT UNSIGNED NOT NULL DEFAULT 0,
    unlock_level_number INT UNSIGNED NOT NULL DEFAULT 1,
    is_mvp TINYINT(1) NOT NULL DEFAULT 1,
    PRIMARY KEY (id),
    UNIQUE KEY uq_missions_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 27. Player Missions
CREATE TABLE IF NOT EXISTS player_missions (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    player_id BIGINT UNSIGNED NOT NULL,
    mission_id BIGINT UNSIGNED NOT NULL,
    progress_value BIGINT UNSIGNED NOT NULL DEFAULT 0,
    status ENUM('ACTIVE', 'COMPLETED', 'CLAIMED') NOT NULL DEFAULT 'ACTIVE',
    assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL DEFAULT NULL,
    claimed_at TIMESTAMP NULL DEFAULT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_player_missions_unique (player_id, mission_id),
    INDEX idx_player_missions_status (player_id, status),
    CONSTRAINT fk_player_missions_player FOREIGN KEY (player_id) REFERENCES player_profiles (id) ON DELETE CASCADE,
    CONSTRAINT fk_player_missions_mission FOREIGN KEY (mission_id) REFERENCES missions (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 28. Achievements (Catalog)
CREATE TABLE IF NOT EXISTS achievements (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    code VARCHAR(64) NOT NULL,
    name VARCHAR(128) NOT NULL,
    category ENUM('FARMING', 'RESTAURANT', 'FACTORY', 'DELIVERY', 'WORKFORCE', 'FINANCE', 'EXPANSION', 'ENDGAME') NOT NULL,
    target_metric VARCHAR(64) NOT NULL,
    target_value BIGINT UNSIGNED NOT NULL,
    reward_cash DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    reward_xp BIGINT UNSIGNED NOT NULL DEFAULT 0,
    reward_gems INT UNSIGNED NOT NULL DEFAULT 0,
    description VARCHAR(255) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_achievements_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 29. Player Achievements
CREATE TABLE IF NOT EXISTS player_achievements (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    player_id BIGINT UNSIGNED NOT NULL,
    achievement_id BIGINT UNSIGNED NOT NULL,
    progress_value BIGINT UNSIGNED NOT NULL DEFAULT 0,
    is_unlocked TINYINT(1) NOT NULL DEFAULT 0,
    is_claimed TINYINT(1) NOT NULL DEFAULT 0,
    unlocked_at TIMESTAMP NULL DEFAULT NULL,
    claimed_at TIMESTAMP NULL DEFAULT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_player_achievements_unique (player_id, achievement_id),
    CONSTRAINT fk_player_ach_player FOREIGN KEY (player_id) REFERENCES player_profiles (id) ON DELETE CASCADE,
    CONSTRAINT fk_player_ach_achievement FOREIGN KEY (achievement_id) REFERENCES achievements (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 31. Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    player_id BIGINT UNSIGNED NOT NULL,
    type ENUM('INFO', 'WARNING', 'MISSION', 'ACHIEVEMENT', 'OFFLINE', 'PAYROLL') NOT NULL DEFAULT 'INFO',
    title VARCHAR(128) NOT NULL,
    message VARCHAR(500) NOT NULL,
    is_read TINYINT(1) NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_notifications_player_read (player_id, is_read, created_at),
    CONSTRAINT fk_notifications_player FOREIGN KEY (player_id) REFERENCES player_profiles (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 32. Game Configuration (Live-Ops Key-Value Store)
CREATE TABLE IF NOT EXISTS game_configuration (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    config_key VARCHAR(128) NOT NULL,
    config_value VARCHAR(512) NOT NULL,
    value_type ENUM('NUMBER', 'STRING', 'BOOLEAN', 'JSON') NOT NULL DEFAULT 'STRING',
    description VARCHAR(255) NULL DEFAULT NULL,
    updated_by_user_id BIGINT UNSIGNED NULL DEFAULT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_game_configuration_key (config_key),
    CONSTRAINT fk_game_config_admin FOREIGN KEY (updated_by_user_id) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 33. Game Save Snapshots (Audit / Rollback / Offline Recovery)
CREATE TABLE IF NOT EXISTS game_save_snapshots (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    player_id BIGINT UNSIGNED NOT NULL,
    snapshot_reason ENUM('AUTO_SYNC', 'MANUAL', 'OFFLINE_CLAIM', 'PRE_EXPANSION', 'ADMIN_BACKUP') NOT NULL DEFAULT 'AUTO_SYNC',
    state_json JSON NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_snapshots_player_created (player_id, created_at),
    CONSTRAINT fk_snapshots_player FOREIGN KEY (player_id) REFERENCES player_profiles (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Supporting Table: Refresh Tokens (Auth Rotation)
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id BIGINT UNSIGNED NOT NULL,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    revoked_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_refresh_tokens_hash (token_hash),
    INDEX idx_refresh_tokens_user (user_id),
    CONSTRAINT fk_refresh_tokens_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Supporting Table: Admin & Financial Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    actor_user_id BIGINT UNSIGNED NOT NULL,
    target_player_id BIGINT UNSIGNED NULL DEFAULT NULL,
    action_type VARCHAR(64) NOT NULL,
    before_state JSON NULL DEFAULT NULL,
    after_state JSON NULL DEFAULT NULL,
    ip_address VARCHAR(45) NULL DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_audit_logs_actor (actor_user_id, created_at),
    INDEX idx_audit_logs_target (target_player_id, created_at),
    CONSTRAINT fk_audit_logs_actor FOREIGN KEY (actor_user_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
