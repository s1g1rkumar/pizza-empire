export interface BusinessValuationInput {
  cashBalance: number;
  businessesValue: number;
  inventoryValue: number;
  annualizedNetProfit: number;
}

export interface BusinessValuationBreakdown {
  cashBalance: number;
  businessesValue: number;
  inventoryValue: number;
  goodwillValue: number;
  totalValuation: number;
}

/**
 * Computes total empire valuation using DECIMAL-safe 2-decimal rounding:
 * Cash + Facility Assets + Inventory Market Value + Goodwill (max(0, 30-day profit * 2)).
 */
export function calculateBusinessValuation(
  input: BusinessValuationInput
): BusinessValuationBreakdown {
  const cashBalance = Number(Math.max(0, input.cashBalance).toFixed(2));
  const businessesValue = Number(Math.max(0, input.businessesValue).toFixed(2));
  const inventoryValue = Number(Math.max(0, input.inventoryValue).toFixed(2));
  const goodwillValue = Number(Math.max(0, input.annualizedNetProfit * 0.25).toFixed(2));
  const totalValuation = Number(
    (cashBalance + businessesValue + inventoryValue + goodwillValue).toFixed(2)
  );

  return {
    cashBalance,
    businessesValue,
    inventoryValue,
    goodwillValue,
    totalValuation,
  };
}
