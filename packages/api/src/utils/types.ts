export interface Refill {
  PK: string;
  SK: string;
  refillId: string;
  vehicleId: string;
  userId: string;
  odometer: number;
  volume: number;
  pricePerUnit: number;
  totalCost: number;
  currency: string;
  exchangeRate: number;
  baseAmount: number;
  fuelType: string;
  station?: string;
  createdAt: string;
}

export interface Expense {
  PK: string;
  SK: string;
  expenseId: string;
  vehicleId: string;
  userId: string;
  category: string;
  amount: number;
  currency: string;
  exchangeRate: number;
  baseAmount: number;
  odometer?: number;
  description?: string;
  taxDeductible: boolean;
  createdAt: string;
}
