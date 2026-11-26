-- Migration 010: Centralized Inventory Management (6 Categories, Reservations, Transactions)
SET NAMES utf8mb4;
SET time_zone = '+00:00';

ALTER TABLE inventory_items
    MODIFY COLUMN category ENUM(
        'RAW_CROP',
        'RAW_MATERIAL',
        'PROCESSED_INGREDIENT',
        'PIZZA',
        'PACKAGING',
        'RETAIL_GOOD'
    ) NOT NULL,
    ADD COLUMN description VARCHAR(255) NULL DEFAULT NULL AFTER name,
    ADD COLUMN low_stock_threshold INT UNSIGNED NOT NULL DEFAULT 10 AFTER unit_wholesale_sell;

ALTER TABLE business_inventory
    ADD COLUMN reserved_quantity INT NOT NULL DEFAULT 0 AFTER quantity,
    ADD CONSTRAINT chk_biz_inv_reserved_non_negative CHECK (reserved_quantity >= 0),
    ADD CONSTRAINT chk_biz_inv_available_non_negative CHECK (quantity >= reserved_quantity);

CREATE TABLE IF NOT EXISTS inventory_transactions (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    player_id BIGINT UNSIGNED NOT NULL,
    business_id BIGINT UNSIGNED NOT NULL,
    item_id BIGINT UNSIGNED NOT NULL,
    transaction_type ENUM(
        'DEPOSIT',
        'WITHDRAW',
        'RESERVE',
        'RELEASE',
        'CONSUME_RESERVED',
        'TRANSFER_IN',
        'TRANSFER_OUT',
        'MARKET_BUY',
        'MARKET_SELL'
    ) NOT NULL,
    quantity_delta INT NOT NULL,
    reserved_delta INT NOT NULL DEFAULT 0,
    balance_after INT NOT NULL,
    reserved_after INT NOT NULL DEFAULT 0,
    reference_id VARCHAR(64) NULL DEFAULT NULL,
    notes VARCHAR(255) NULL DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_inv_tx_player_created (player_id, created_at),
    INDEX idx_inv_tx_biz_item (business_id, item_id, created_at),
    CONSTRAINT fk_inv_tx_player FOREIGN KEY (player_id) REFERENCES player_profiles (id) ON DELETE CASCADE,
    CONSTRAINT fk_inv_tx_business FOREIGN KEY (business_id) REFERENCES businesses (id) ON DELETE CASCADE,
    CONSTRAINT fk_inv_tx_item FOREIGN KEY (item_id) REFERENCES inventory_items (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
