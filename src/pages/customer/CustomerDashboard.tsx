import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../../firebase";
import { useAuth } from "../../context/AuthContext";
import DashboardShell from "../../components/DashboardShell";
import CustomerSidebar, { CUSTOMER_NAV } from "./CustomerSidebar";
import HomePage from "./HomePage";
import BrowseCarsPage from "./BrowseCarsPage";
import MyRentalsPage from "./MyRentalsPage";
import SavedCarsPage from "./SavedCarsPage";
import type { Car, Booking, SavedCar } from "./types";

export default function CustomerDashboard() {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const [activeNav, setActiveNav] = useState("home");

  // Shared data
  const [cars, setCars]           = useState<Car[]>([]);
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [savedCars, setSavedCars] = useState<SavedCar[]>([]);
  const [carsLoading, setCarsLoading] = useState(true);

  // For "View & Book" from saved cars / home → navigate to browse with car selected
  const [initialSelectedCar, setInitialSelectedCar] = useState<Car | null>(null);

  // ── Load all cars ─────────────────────────────────────────
  useEffect(() => {
    setCarsLoading(true);
    const unsub = onSnapshot(collection(db, "cars"), snap => {
      setCars(snap.docs.map(d => ({ id: d.id, ...d.data() } as Car)));
      setCarsLoading(false);
    }, err => {
      console.error("cars error", err);
      setCarsLoading(false);
    });
    return unsub;
  }, []);

  // ── Load all bookings (for availability checking) ─────────
  useEffect(() => {
    if (cars.length === 0) { setAllBookings([]); return; }
    const ids = cars.map(c => c.id);
    const q   = query(collection(db, "bookings"), where("carId", "in", ids.slice(0, 30)));
    const unsub = onSnapshot(q, snap => {
      setAllBookings(snap.docs.map(d => ({ id: d.id, ...d.data() } as Booking)));
    }, err => { console.error("bookings error", err); });
    return unsub;
  }, [cars]);

  // ── Load user's saved cars ────────────────────────────────
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "savedCars"), where("userId", "==", user.uid));
    const unsub = onSnapshot(q, snap => {
      setSavedCars(snap.docs.map(d => ({ id: d.id, ...d.data() } as SavedCar)));
    }, err => { console.error("savedCars error", err); });
    return unsub;
  }, [user]);

  const handleLogout = async () => { await logout(); navigate("/"); };
  const activeLabel  = CUSTOMER_NAV.find(n => n.key === activeNav)?.label ?? "Home";

  function handleNavChange(key: string) {
    setActiveNav(key);
    if (key !== "browse") setInitialSelectedCar(null);
  }

  function handleViewCar(car: Car) {
    setInitialSelectedCar(car);
    setActiveNav("browse");
  }

  return (
    <DashboardShell
      sidebar={<CustomerSidebar activeNav={activeNav} onNavChange={handleNavChange} />}
      onLogout={handleLogout}
      user={user}
      role={role}
      title={activeLabel}
    >
      {activeNav === "home" && (
        <HomePage
          cars={cars}
          allBookings={allBookings}
          savedCars={savedCars}
          carsLoading={carsLoading}
          user={user}
          onBrowse={() => handleNavChange("browse")}
          onViewCar={handleViewCar}
        />
      )}
      {activeNav === "browse" && (
        <BrowseCarsPage
          cars={cars}
          allBookings={allBookings}
          savedCars={savedCars}
          carsLoading={carsLoading}
          user={user}
          initialSelectedCar={initialSelectedCar}
          onSavedCarsChange={() => {}}
        />
      )}
      {activeNav === "rentals" && (
        <MyRentalsPage user={user} />
      )}
      {activeNav === "saved" && (
        <SavedCarsPage
          savedCars={savedCars}
          allCars={cars}
          allBookings={allBookings}
          user={user}
          onViewCar={handleViewCar}
        />
      )}
    </DashboardShell>
  );
}
