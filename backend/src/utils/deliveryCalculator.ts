export type VehicleType = 'BICYCLE' | 'SCOOTER' | 'MOTORCYCLE' | 'CAR' | 'DELIVERY_VAN';

export interface VehicleBlueprint {
  type: VehicleType;
  label: string;
  purchaseCost: number;
  capacity: number;
  speedMultiplier: number;
  hourlyMaintenance: number;
}

export const VEHICLE_BLUEPRINTS: Record<VehicleType, VehicleBlueprint> = {
  BICYCLE: {
    type: 'BICYCLE',
    label: 'Bicycle',
    purchaseCost: 250,
    capacity: 2,
    speedMultiplier: 1.0,
    hourlyMaintenance: 1.5,
  },
  SCOOTER: {
    type: 'SCOOTER',
    label: 'Scooter',
    purchaseCost: 900,
    capacity: 3,
    speedMultiplier: 1.35,
    hourlyMaintenance: 4.0,
  },
  MOTORCYCLE: {
    type: 'MOTORCYCLE',
    label: 'Motorcycle',
    purchaseCost: 2200,
    capacity: 4,
    speedMultiplier: 1.75,
    hourlyMaintenance: 7.5,
  },
  CAR: {
    type: 'CAR',
    label: 'Delivery Car',
    purchaseCost: 6500,
    capacity: 8,
    speedMultiplier: 2.0,
    hourlyMaintenance: 14.0,
  },
  DELIVERY_VAN: {
    type: 'DELIVERY_VAN',
    label: 'Delivery Van',
    purchaseCost: 14000,
    capacity: 15,
    speedMultiplier: 1.85,
    hourlyMaintenance: 22.0,
  },
};

export function calculateVehicleUpgradeCost(purchaseCost: number, currentLevel: number): number {
  return Math.floor(purchaseCost * 0.6 * Math.pow(1.55, Math.max(0, currentLevel - 1)));
}

/**
 * Computes delivery transit time in seconds based on zone distance, vehicle speed, and driver productivity.
 */
export function calculateDeliveryDurationSeconds(params: {
  distanceKm: number;
  vehicleSpeedMultiplier: number;
  driverProductivity: number;
}): number {
  const baseSeconds = Math.max(10, params.distanceKm * 12);
  const combinedSpeed =
    Math.max(0.5, params.vehicleSpeedMultiplier) * Math.max(0.8, params.driverProductivity);
  return Math.max(8, Math.round(baseSeconds / combinedSpeed));
}

export function calculateDeliveryTip(params: {
  orderAmount: number;
  isOnTime: boolean;
  driverProductivity: number;
}): number {
  const baseTipRate = params.isOnTime ? 0.15 : 0.04;
  const prodBonus = Math.max(0, params.driverProductivity - 1) * 0.05;
  return Number((params.orderAmount * (baseTipRate + prodBonus)).toFixed(2));
}
