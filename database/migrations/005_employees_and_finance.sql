-- Migration 005: Employees (500-cap), Employee Assignments (No Duplicate Active), and Financial Transactions
-- Target: MySQL 8.0+

SET NAMES utf8mb4;
SET time_zone = '+00:00';

-- 21. Employees
CREATE TABLE IF NOT EXISTS employees (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    player_id BIGINT UNSIGNED NOT NULL,
    full_name VARCHAR(128) NOT NULL,
    department ENUM('AGRICULTURE', 'RESTAURANT', 'MANUFACTURING', 'LOGISTICS', 'RETAIL', 'REAL_ESTATE', 'CORPORATE') NOT NULL,
    role ENUM('FARMHAND', 'PREP_COOK', 'PIZZA_CHEF', 'CASHIER', 'STORE_MANAGER', 'FACTORY_WORKER', 'QUALITY_INSPECTOR', 'MAINTENANCE_TECH', 'DELIVERY_DRIVER', 'FLEET_DISPATCHER', 'RETAIL_CLERK', 'MALL_OPERATOR', 'EXECUTIVE') NOT NULL,
    skill_level TINYINT UNSIGNED NOT NULL DEFAULT 1,
    productivity_multiplier DECIMAL(5,2) NOT NULL DEFAULT 1.00,
    happiness TINYINT UNSIGNED NOT NULL DEFAULT 85,
    hourly_wage DECIMAL(18,2) NOT NULL,
    is_shift_lead TINYINT(1) NOT NULL DEFAULT 0,
    hired_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    PRIMARY KEY (id),
    INDEX idx_employees_player_dept (player_id, department),
    INDEX idx_employees_player_deleted (player_id, deleted_at),
    CONSTRAINT fk_employees_player FOREIGN KEY (player_id) REFERENCES player_profiles (id) ON DELETE CASCADE,
    CONSTRAINT chk_employees_happiness CHECK (happiness <= 100),
    CONSTRAINT chk_employees_skill CHECK (skill_level BETWEEN 1 AND 10)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 22. Employee Assignments (active_flag = 1 when active, NULL when unassigned/historical -> prevents duplicate active assignments)
CREATE TABLE IF NOT EXISTS employee_assignments (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    player_id BIGINT UNSIGNED NOT NULL,
    employee_id BIGINT UNSIGNED NOT NULL,
    business_id BIGINT UNSIGNED NOT NULL,
    active_flag TINYINT(1) NULL DEFAULT 1,
    assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    unassigned_at TIMESTAMP NULL DEFAULT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_emp_active_assignment (employee_id, active_flag),
    INDEX idx_emp_assign_business_active (business_id, active_flag),
    INDEX idx_emp_assign_player (player_id),
    CONSTRAINT fk_emp_assign_player FOREIGN KEY (player_id) REFERENCES player_profiles (id) ON DELETE CASCADE,
    CONSTRAINT fk_emp_assign_employee FOREIGN KEY (employee_id) REFERENCES employees (id) ON DELETE CASCADE,
    CONSTRAINT fk_emp_assign_business FOREIGN KEY (business_id) REFERENCES businesses (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add FK from deliveries.driver_employee_id now that employees exists
ALTER TABLE deliveries
    ADD CONSTRAINT fk_deliveries_driver FOREIGN KEY (driver_employee_id) REFERENCES employees (id) ON DELETE SET NULL;

-- 23. Financial Transactions (Immutable Ledger)
CREATE TABLE IF NOT EXISTS financial_transactions (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    player_id BIGINT UNSIGNED NOT NULL,
    business_id BIGINT UNSIGNED NULL DEFAULT NULL,
    transaction_type ENUM('REVENUE', 'EXPENSE', 'CAPEX', 'LOAN_IN', 'LOAN_REPAY', 'REWARD', 'ADMIN_ADJUST') NOT NULL,
    category ENUM('CROP_SALE', 'PIZZA_SALE', 'DELIVERY_FEE', 'TIP', 'WHOLESALE_BUY', 'WHOLESALE_SELL', 'SEED_COST', 'PAYROLL', 'UPKEEP', 'UPGRADE', 'TRAINING', 'LOAN', 'MISSION_REWARD', 'OFFLINE_EARNINGS', 'OTHER') NOT NULL,
    amount DECIMAL(18,2) NOT NULL,
    balance_after DECIMAL(18,2) NOT NULL,
    reference_id VARCHAR(64) NULL DEFAULT NULL,
    description VARCHAR(255) NULL DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_fin_tx_player_created (player_id, created_at),
    INDEX idx_fin_tx_player_type_cat (player_id, transaction_type, category),
    INDEX idx_fin_tx_business (business_id),
    CONSTRAINT fk_fin_tx_player FOREIGN KEY (player_id) REFERENCES player_profiles (id) ON DELETE CASCADE,
    CONSTRAINT fk_fin_tx_business FOREIGN KEY (business_id) REFERENCES businesses (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
