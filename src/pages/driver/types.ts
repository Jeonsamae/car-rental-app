export interface Car {
  id: string;
  make: string;
  model: string;
  year: number;
  plate: string;
  color: string;
  fuelType: string;
  transmission: string;
  seats: number;
  ratePerDay: number;
  location: string;
  driverName?: string;
}

export interface Booking {
  id: string;
  carId: string;
  customer: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  status: "pending" | "confirmed" | "completed" | "rejected";
  customerId?: string;
  totalCost?: number;
  carMake?: string;
  carModel?: string;
  carPlate?: string;
  carYear?: number;
}
