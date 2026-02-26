import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import DashboardShell from "../../components/DashboardShell";
import styles from "./CustomerDashboard.module.css";

const NAV: { icon: string; label: string; key: string }[] = [
  { icon: "🏠", label: "Home",        key: "home"     },
  { icon: "🚗", label: "Browse Cars", key: "browse"   },
  { icon: "📋", label: "My Rentals",  key: "rentals"  },
  { icon: "❤️", label: "Saved Cars",  key: "saved"    },
  { icon: "👤", label: "Profile",     key: "profile"  },
];

const AVAILABLE_CARS = [
  { name: "Toyota Camry",         type: "Sedan",     rate: "₱2,500/day", icon: "🚗" },
  { name: "Honda CR-V",           type: "SUV",        rate: "₱3,200/day", icon: "🚙" },
  { name: "Ford Ranger",          type: "Pick-up",   rate: "₱3,800/day", icon: "🛻" },
  { name: "Mitsubishi Montero",   type: "SUV",        rate: "₱4,500/day", icon: "🚙" },
  { name: "Hyundai Accent",       type: "Sedan",     rate: "₱1,800/day", icon: "🚗" },
  { name: "Toyota HiAce",         type: "Van",       rate: "₱5,000/day", icon: "🚐" },
];

export default function CustomerDashboard() {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const [activeNav, setActiveNav] = useState("home");

  const handleLogout = async () => { await logout(); navigate("/"); };
  const activeLabel = NAV.find((n) => n.key === activeNav)?.label ?? "Home";

  const firstName = user?.displayName?.split(" ")[0] ?? user?.email?.split("@")[0] ?? "there";

  return (
    <DashboardShell
      navItems={NAV}
      activeNav={activeNav}
      onNavChange={setActiveNav}
      onLogout={handleLogout}
      user={user}
      role={role}
      title={activeLabel}
    >
      {/* Greeting */}
      <div className={styles.pageHeader}>
        <h1 className={styles.greeting}>Welcome back, {firstName} 👋</h1>
        <p className={styles.subGreeting}>Find your perfect ride for today.</p>
      </div>

      {/* Stats */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.statIconGreen}`}>🚗</div>
          <div className={styles.statValue}>1</div>
          <div className={styles.statLabel}>Active Rental</div>
          <div className={styles.statSub}>Returns Feb 28</div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.statIconBlue}`}>✅</div>
          <div className={styles.statValue}>8</div>
          <div className={styles.statLabel}>Completed Trips</div>
          <div className={styles.statSub}>Since Jan 2025</div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.statIconOrange}`}>❤️</div>
          <div className={styles.statValue}>3</div>
          <div className={styles.statLabel}>Saved Cars</div>
          <div className={styles.statSub}>In your wishlist</div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.statIconYellow}`}>⭐</div>
          <div className={styles.statValue}>450</div>
          <div className={styles.statLabel}>Loyalty Points</div>
          <div className={styles.statSub}>≈ ₱450 discount</div>
        </div>
      </div>

      {/* Car grid + Active booking */}
      <div className={styles.sectionGrid}>
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <span className={styles.panelTitle}>Available Cars</span>
            <button className={styles.bookBtn}>+ Book Now</button>
          </div>
          <div className={styles.carGrid}>
            {AVAILABLE_CARS.map((car) => (
              <div key={car.name} className={styles.carCard}>
                <div className={styles.carThumb}>{car.icon}</div>
                <div className={styles.carInfo}>
                  <div className={styles.carName}>{car.name}</div>
                  <div className={styles.carType}>{car.type}</div>
                  <div className={styles.carFooter}>
                    <span className={styles.carRate}>{car.rate}</span>
                    <button className={styles.carBookBtn}>Book</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <span className={styles.panelTitle}>Active Booking</span>
          </div>
          <div className={styles.bookingCard}>
            <div className={styles.bookingVehicle}>🚗</div>
            <div className={styles.bookingCarName}>Toyota Camry 2023</div>
            <div className={styles.activePill}>
              <div className={styles.activeDot} />
              Active
            </div>
            <div className={styles.bookingMeta}>
              <div className={styles.bookingRow}>
                <span className={styles.bookingKey}>Plate No.</span>
                <span className={styles.bookingVal}>ABC-1234</span>
              </div>
              <div className={styles.bookingRow}>
                <span className={styles.bookingKey}>Pickup</span>
                <span className={styles.bookingVal}>Feb 24, 2026</span>
              </div>
              <div className={styles.bookingRow}>
                <span className={styles.bookingKey}>Return</span>
                <span className={styles.bookingVal}>Feb 28, 2026</span>
              </div>
              <div className={styles.bookingRow}>
                <span className={styles.bookingKey}>Total</span>
                <span className={styles.bookingVal}>₱12,500</span>
              </div>
              <div className={styles.bookingRow}>
                <span className={styles.bookingKey}>Driver</span>
                <span className={styles.bookingVal}>Juan dela Cruz</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
