-- Migration 008: Offline Earnings Sessions for Idempotent Welcome-Back Claiming
SET NAMES utf8mb4;
SET time_zone = '+00:00';

CREATE TABLE IF NOT EXISTS offline_earnings_sessions (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    player_id BIGINT UNSIGNED NOT NULL,
    started_at TIMESTAMP NOT NULL,
    ended_at TIMESTAMP NOT NULL,
    effective_seconds INT UNSIGNED NOT NULL,
    gross_revenue DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    wages_deducted DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    upkeep_deducted DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    net_cash_earned DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    xp_earned BIGINT UNSIGNED NOT NULL DEFAULT 0,
    summary_json JSON NULL DEFAULT NULL,
    claimed_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_offline_sessions_player_claimed (player_id, claimed_at),
    CONSTRAINT fk_offline_sessions_player FOREIGN KEY (player_id) REFERENCES player_profiles (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
