import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase";
import { useAuth } from "../../context/AuthContext";
import DashboardShell from "../../components/DashboardShell";
import AdminSidebar, { ADMIN_NAV } from "./AdminSidebar";
import OverviewPage from "./OverviewPage";
import FleetPage from "./FleetPage";
import RentalsPage from "./RentalsPage";
import CustomersPage from "./CustomersPage";
import PaymentsPage from "./PaymentsPage";
import SettingsPage from "./SettingsPage";
import type { Car, Booking } from "./types";

export default function AdminDashboard() {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const [activeNav, setActiveNav] = useState("overview");

  const [cars, setCars]         = useState<Car[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading]   = useState(true);

  // ── Load all cars ─────────────────────────────────────────
  useEffect(() => {
    setLoading(true);
    const unsub = onSnapshot(collection(db, "cars"), snap => {
      setCars(snap.docs.map(d => ({ id: d.id, ...d.data() } as Car)));
      setLoading(false);
    }, err => {
      console.error("admin cars error", err);
      setLoading(false);
    });
    return unsub;
  }, []);

  // ── Load all bookings ─────────────────────────────────────
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "bookings"), snap => {
      setBookings(snap.docs.map(d => ({ id: d.id, ...d.data() } as Booking)));
    }, err => { console.error("admin bookings error", err); });
    return unsub;
  }, []);

  const handleLogout = async () => { await logout(); navigate("/"); };
  const activeLabel  = ADMIN_NAV.find(n => n.key === activeNav)?.label ?? "Overview";

  return (
    <DashboardShell
      sidebar={<AdminSidebar activeNav={activeNav} onNavChange={setActiveNav} />}
      onLogout={handleLogout}
      user={user}
      role={role}
      title={activeLabel}
    >
      {activeNav === "overview" && (
        <OverviewPage
          cars={cars}
          bookings={bookings}
          loading={loading}
          onNavChange={setActiveNav}
        />
      )}
      {activeNav === "fleet" && (
        <FleetPage
          cars={cars}
          bookings={bookings}
          loading={loading}
        />
      )}
      {activeNav === "rentals" && (
        <RentalsPage bookings={bookings} />
      )}
      {activeNav === "customers" && (
        <CustomersPage bookings={bookings} />
      )}
      {activeNav === "payments" && (
        <PaymentsPage bookings={bookings} />
      )}
      {activeNav === "settings" && (
        <SettingsPage />
      )}
    </DashboardShell>
  );
}
