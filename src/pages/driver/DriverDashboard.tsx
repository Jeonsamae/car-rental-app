import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase";
import { useAuth } from "../../context/AuthContext";
import DashboardShell from "../../components/DashboardShell";
import DriverSidebar, { DRIVER_NAV } from "./DriverSidebar";
import DashboardOverviewPage from "./DashboardOverviewPage";
import MyCarsPage from "./MyCarsPage";
import BookingsPage from "./BookingsPage";
import TripHistoryPage from "./TripHistoryPage";
import type { Car, Booking } from "./types";

export default function DriverDashboard() {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const [activeNav, setActiveNav] = useState("dashboard");

  const [cars, setCars]         = useState<Car[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [carsLoading, setCarsLoading] = useState(true);

  // ── Load driver's cars ──────────────────────────────────
  useEffect(() => {
    if (!user) return;
    setCarsLoading(true);
    const q = query(collection(db, "cars"), where("driverUid", "==", user.uid));
    const unsub = onSnapshot(q, snap => {
      setCars(snap.docs.map(d => ({ id: d.id, ...d.data() } as Car)));
      setCarsLoading(false);
    }, err => {
      console.error("cars snapshot error", err);
      setCarsLoading(false);
    });
    return unsub;
  }, [user]);

  // ── Load bookings for those cars ────────────────────────
  useEffect(() => {
    if (cars.length === 0) { setBookings([]); return; }
    const ids = cars.map(c => c.id);
    const q = query(collection(db, "bookings"), where("carId", "in", ids.slice(0, 30)));
    const unsub = onSnapshot(q, snap => {
      setBookings(snap.docs.map(d => ({ id: d.id, ...d.data() } as Booking)));
    }, err => { console.error("bookings snapshot error", err); });
    return unsub;
  }, [cars]);

  const handleLogout = async () => { await logout(); navigate("/"); };
  const activeLabel = DRIVER_NAV.find(n => n.key === activeNav)?.label ?? "Dashboard";

  return (
    <DashboardShell
      sidebar={<DriverSidebar activeNav={activeNav} onNavChange={setActiveNav} />}
      onLogout={handleLogout}
      user={user}
      role={role}
      title={activeLabel}
    >
      {activeNav === "dashboard" && (
        <DashboardOverviewPage
          cars={cars}
          bookings={bookings}
          loading={carsLoading}
          user={user}
        />
      )}
      {activeNav === "cars" && (
        <MyCarsPage
          cars={cars}
          bookings={bookings}
          carsLoading={carsLoading}
          user={user}
        />
      )}
      {activeNav === "bookings" && (
        <BookingsPage
          bookings={bookings}
          cars={cars}
        />
      )}
      {activeNav === "history" && (
        <TripHistoryPage
          cars={cars}
          bookings={bookings}
        />
      )}
    </DashboardShell>
  );
}
