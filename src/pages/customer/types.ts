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
  driverUid: string;
  driverName: string;
  location: string;
}

export interface Booking {
  id: string;
  carId: string;
  customerId?: string;
  customer: string;
  customerEmail?: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  status: "pending" | "confirmed" | "completed" | "rejected";
  totalCost?: number;
  // car snapshot fields (stored at booking time)
  carMake?: string;
  carModel?: string;
  carPlate?: string;
  carYear?: number;
  driverUid?: string;
}

export interface SavedCar {
  id: string;
  userId: string;
  carId: string;
  savedAt: unknown;
}
