-- Migration 001: Users, Player Profiles, Game Levels, Player Progression, and Auth/Audit Support
-- Target: MySQL 8.0+ (InnoDB, utf8mb4, UTC timestamps)

SET NAMES utf8mb4;
SET time_zone = '+00:00';

-- 1. Users
CREATE TABLE IF NOT EXISTS users (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    email VARCHAR(255) NOT NULL,
    username VARCHAR(64) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('PLAYER', 'MODERATOR', 'ADMIN') NOT NULL DEFAULT 'PLAYER',
    status ENUM('ACTIVE', 'SUSPENDED', 'BANNED') NOT NULL DEFAULT 'ACTIVE',
    last_login_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_users_email (email),
    UNIQUE KEY uq_users_username (username),
    INDEX idx_users_role_status (role, status),
    INDEX idx_users_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Game Levels (Catalog of 8 Major Stages)
CREATE TABLE IF NOT EXISTS game_levels (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    level_number INT UNSIGNED NOT NULL,
    code VARCHAR(64) NOT NULL,
    name VARCHAR(128) NOT NULL,
    description TEXT NOT NULL,
    min_xp BIGINT UNSIGNED NOT NULL DEFAULT 0,
    min_cash DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    min_net_worth DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    max_employees_cap INT UNSIGNED NOT NULL DEFAULT 30,
    is_mvp TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_game_levels_number (level_number),
    UNIQUE KEY uq_game_levels_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Player Profiles
CREATE TABLE IF NOT EXISTS player_profiles (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id BIGINT UNSIGNED NOT NULL,
    display_name VARCHAR(64) NOT NULL,
    avatar_key VARCHAR(64) NOT NULL DEFAULT 'default_farmer',
    cash_balance DECIMAL(18,2) NOT NULL DEFAULT 1000.00,
    gems_balance INT UNSIGNED NOT NULL DEFAULT 0,
    net_worth DECIMAL(18,2) NOT NULL DEFAULT 1000.00,
    reputation DECIMAL(5,2) NOT NULL DEFAULT 10.00,
    max_employees_allowed INT UNSIGNED NOT NULL DEFAULT 30,
    offline_cap_seconds INT UNSIGNED NOT NULL DEFAULT 14400,
    last_active_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_tick_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_player_profiles_user_id (user_id),
    INDEX idx_player_profiles_net_worth (net_worth),
    INDEX idx_player_profiles_last_active (last_active_at),
    CONSTRAINT fk_player_profiles_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT chk_player_cash_non_negative CHECK (cash_balance >= 0.00)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Player Progression
CREATE TABLE IF NOT EXISTS player_progression (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    player_id BIGINT UNSIGNED NOT NULL,
    current_level_id BIGINT UNSIGNED NOT NULL,
    xp_level INT UNSIGNED NOT NULL DEFAULT 1,
    current_xp BIGINT UNSIGNED NOT NULL DEFAULT 0,
    total_crops_harvested BIGINT UNSIGNED NOT NULL DEFAULT 0,
    total_pizzas_sold BIGINT UNSIGNED NOT NULL DEFAULT 0,
    total_batches_processed BIGINT UNSIGNED NOT NULL DEFAULT 0,
    total_deliveries_completed BIGINT UNSIGNED NOT NULL DEFAULT 0,
    prestige_count INT UNSIGNED NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_player_progression_player_id (player_id),
    INDEX idx_player_progression_level (current_level_id),
    CONSTRAINT fk_player_progression_player FOREIGN KEY (player_id) REFERENCES player_profiles (id) ON DELETE CASCADE,
    CONSTRAINT fk_player_progression_level FOREIGN KEY (current_level_id) REFERENCES game_levels (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
