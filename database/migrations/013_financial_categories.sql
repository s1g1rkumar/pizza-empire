-- Migration 013: Complete Income & Expense Categories for Centralized Financial Management
SET NAMES utf8mb4;
SET time_zone = '+00:00';

ALTER TABLE financial_transactions
    MODIFY COLUMN category ENUM(
        'CROP_SALE',
        'PIZZA_SALE',
        'RESTAURANT_REVENUE',
        'DELIVERY_CHARGE',
        'DELIVERY_FEE',
        'TIP',
        'FACTORY_SALE',
        'SUPERMARKET_REVENUE',
        'MALL_RENTAL',
        'WHOLESALE_BUY',
        'WHOLESALE_SELL',
        'SEED_COST',
        'RAW_MATERIAL',
        'PAYROLL',
        'SALARIES',
        'UPKEEP',
        'ELECTRICITY',
        'MAINTENANCE',
        'RENT',
        'MARKETING',
        'CONSTRUCTION',
        'UPGRADE',
        'TRAINING',
        'LOAN',
        'MISSION_REWARD',
        'OFFLINE_EARNINGS',
        'OTHER'
    ) NOT NULL;
