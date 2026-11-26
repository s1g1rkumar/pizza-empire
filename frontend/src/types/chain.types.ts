export interface ChainBranchDTO {
  restaurantId: number;
  businessId: number;
  name: string;
  restaurantType: string;
  locationName: string;
  districtType: string;
  demandMultiplier: number;
  rentMultiplier: number;
  monthlyRent: number;
  managerEmployeeId: number | null;
  managerName: string | null;
  staffCount: number;
  avgRating: number;
  revenue24h: number;
  expenses24h: number;
  netProfit24h: number;
}

export interface ChainDashboardData {
  cashBalance: number;
  summary: {
    totalBranches: number;
    totalRevenue24h: number;
    totalExpenses24h: number;
    totalNetProfit24h: number;
    totalMonthlyRent: number;
    avgChainRating: number;
    topBranchName: string | null;
  };
  locations: Array<{
    id: number;
    code: string;
    name: string;
    districtType: string;
    demandMultiplier: number;
    rentMultiplier: number;
    priceElasticity: number;
  }>;
  availableManagers: Array<{
    id: number;
    fullName: string;
    role: string;
    skillLevel: number;
  }>;
  branches: ChainBranchDTO[];
}
