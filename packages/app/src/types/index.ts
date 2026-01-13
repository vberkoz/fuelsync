export interface Vehicle {
  vehicleId: string;
  make: string;
  model: string;
  year: number;
  licensePlate?: string;
  fuelType?: string;
  createdAt?: string;
  media?: Array<{ key: string; type: string; label: string }>;
}

export interface Refill {
  refillId: string;
  vehicleId: string;
  date: number;
  odometer: number;
  volume: number;
  pricePerUnit: number;
  totalCost: number;
  currency: string;
  fuelType?: string;
  station?: string;
}

export interface Expense {
  expenseId: string;
  vehicleId: string;
  date: number;
  category: string;
  amount: number;
  currency: string;
  odometer?: number;
  description?: string;
}

export interface Settings {
  units: 'imperial' | 'metric';
  dateFormat: string;
  notifications: boolean;
  language: string;
  currency: string;
}
