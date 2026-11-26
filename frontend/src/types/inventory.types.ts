export type InventoryCategory =
  'RAW_CROP' | 'RAW_MATERIAL' | 'PROCESSED_INGREDIENT' | 'PIZZA' | 'PACKAGING' | 'RETAIL_GOOD';

export interface InventoryItemStock {
  businessId: number;
  businessName: string;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
}

export interface InventoryItemDTO {
  itemId: number;
  code: string;
  name: string;
  description: string | null;
  category: InventoryCategory;
  unitWholesaleBuy: number;
  unitWholesaleSell: number;
  lowStockThreshold: number;
  stocks: InventoryItemStock[];
  totalQuantity: number;
  totalReserved: number;
  totalAvailable: number;
}

export interface InventoryDashboardData {
  businesses: Array<{
    id: number;
    businessType: string;
    name: string;
    storageCapacity: number;
    storageUsed: number;
  }>;
  items: InventoryItemDTO[];
  alerts: Array<{
    severity: 'LOW_STOCK' | 'OUT_OF_STOCK' | 'CAPACITY_HIGH';
    businessId: number;
    businessName: string;
    itemId?: number;
    itemName?: string;
    message: string;
  }>;
  history: Array<{
    id: number;
    businessId: number;
    businessName: string;
    itemId: number;
    itemName: string;
    transactionType: string;
    quantityDelta: number;
    reservedDelta: number;
    balanceAfter: number;
    reservedAfter: number;
    notes: string | null;
    createdAt: string;
  }>;
}
