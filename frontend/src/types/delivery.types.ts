export type VehicleType = 'BICYCLE' | 'SCOOTER' | 'MOTORCYCLE' | 'CAR' | 'DELIVERY_VAN';

export interface VehicleBlueprint {
  type: VehicleType;
  label: string;
  purchaseCost: number;
  capacity: number;
  speedMultiplier: number;
  hourlyMaintenance: number;
}

export interface DeliveryDashboardData {
  cashBalance: number;
  performance: {
    totalDeliveries: number;
    onTimeRatePct: number;
    avgSatisfaction: number;
    totalDeliveryRevenue: number;
    totalTipsEarned: number;
  };
  blueprints: VehicleBlueprint[];
  zones: Array<{
    id: number;
    code: string;
    name: string;
    distanceKm: number;
    baseDeliveryCharge: number;
    demandWeight: number;
  }>;
  vehicles: Array<{
    id: number;
    vehicleType: VehicleType;
    typeLabel: string;
    name: string;
    capacity: number;
    speedMultiplier: number;
    upgradeLevel: number;
    nextUpgradeCost: number;
    hourlyMaintenance: number;
    status: string;
  }>;
  drivers: Array<{
    id: number;
    fullName: string;
    skillLevel: number;
    happiness: number;
    productivity: number;
  }>;
  restaurants: Array<{
    id: number;
    businessId: number;
    name: string;
    pizzas: Array<{ itemId: number; name: string; price: number; availableStock: number }>;
  }>;
  activeDeliveries: Array<{
    id: number;
    orderId: number;
    pizzaName: string;
    quantity: number;
    zoneName: string;
    vehicleName: string;
    driverName: string | null;
    deliveryFee: number;
    dispatchedAt: string;
    etaAt: string;
  }>;
  recentDeliveries: Array<{
    id: number;
    pizzaName: string;
    quantity: number;
    zoneName: string;
    deliveryFee: number;
    tipAmount: number;
    isOnTime: boolean;
    status: string;
    deliveredAt: string | null;
  }>;
}
