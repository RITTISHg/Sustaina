export type CarType = 'petrol' | 'diesel' | 'hybrid' | 'electric' | 'none';
export type DietType = 'heavy-meat' | 'average' | 'low-meat' | 'vegetarian' | 'vegan';
export type WasteLevel = 'low' | 'medium' | 'high';

export interface TransportMetrics {
  carDistance: number; // km
  carType: CarType;
  transitDistance: number; // km
  flightDistance: number; // km (includes short/long flights)
  activeDistance: number; // km (bike, walk, scooter)
}

export interface EnergyMetrics {
  electricityKwh: number; // daily share
  naturalGasKwh: number; // daily share
  solarPercentage: number; // percentage of energy from solar/renewables (0-100)
}

export interface FoodMetrics {
  dietType: DietType;
  localFoodPercentage: number; // (0-100)
  wasteLevel: WasteLevel;
}

export interface ShoppingMetrics {
  clothingItems: number;
  electronicsItems: number;
  otherItems: number;
}

export interface ActivityLog {
  id: string;
  date: string; // YYYY-MM-DD
  transport: TransportMetrics;
  energy: EnergyMetrics;
  food: FoodMetrics;
  shopping: ShoppingMetrics;
  calculatedEmissions: {
    transport: number;
    energy: number;
    food: number;
    shopping: number;
    total: number;
  };
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  category: 'transport' | 'energy' | 'food' | 'shopping' | 'general';
  co2Savings: number; // estimated kg CO2 saved per day
  completed: boolean;
}

export interface NationalAverage {
  region: string;
  dailyEmissionsKg: number;
  yearlyEmissionsTonnes: number;
}
