export interface FinanceDashboardData {
  summary: {
    cashBalance: number;
    dailyRevenue: number;
    dailyExpenses: number;
    dailyNetProfit: number;
    monthlyRevenue: number;
    monthlyExpenses: number;
    monthlyNetProfit: number;
    hourlyPayroll: number;
    hourlyOperatingCosts: number;
    totalCapexInvested: number;
  };
  valuation: {
    cashBalance: number;
    businessesValue: number;
    inventoryValue: number;
    goodwillValue: number;
    totalValuation: number;
  };
  dailyReportSeries: Array<{ date: string; revenue: number; expenses: number; netProfit: number }>;
  monthlyReportSeries: Array<{
    month: string;
    revenue: number;
    expenses: number;
    netProfit: number;
  }>;
  incomeByCategory: Array<{ category: string; total: number }>;
  expensesByCategory: Array<{ category: string; total: number }>;
  history: Array<{
    id: number;
    businessId: number | null;
    businessName: string | null;
    transactionType: string;
    category: string;
    amount: number;
    balanceAfter: number;
    description: string | null;
    createdAt: string;
  }>;
}
