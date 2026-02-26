import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import DashboardShell from "../../components/DashboardShell";
import styles from "./DriverDashboard.module.css";

const NAV: { icon: string; label: string; key: string }[] = [
  { icon: "🏠", label: "My Schedule",   key: "schedule" },
  { icon: "🚗", label: "Assigned Cars", key: "cars"     },
  { icon: "📍", label: "Trip History",  key: "history"  },
  { icon: "👤", label: "Profile",       key: "profile"  },
];

const SCHEDULE = [
  { time: "08:00 AM", customer: "Juan dela Cruz",  car: "Toyota Camry",  location: "SM Mall of Asia", type: "pickup" },
  { time: "10:30 AM", customer: "Maria Santos",    car: "Honda Civic",   location: "NAIA Terminal 1", type: "return" },
  { time: "02:00 PM", customer: "Jose Reyes",      car: "Ford Ranger",   location: "BGC, Taguig",     type: "pickup" },
  { time: "05:00 PM", customer: "Ana Lim",         car: "Hyundai Tucson",location: "Greenbelt, Makati",type: "done"  },
];

function badgeClass(type: string, s: typeof styles) {
  if (type === "pickup") return `${s.badge} ${s.badgePickup}`;
  if (type === "return") return `${s.badge} ${s.badgeReturn}`;
  return `${s.badge} ${s.badgeDone}`;
}

function badgeLabel(type: string) {
  if (type === "pickup") return "Pickup";
  if (type === "return") return "Return";
  return "Done";
}

export default function DriverDashboard() {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const [activeNav, setActiveNav] = useState("schedule");

  const handleLogout = async () => { await logout(); navigate("/"); };
  const activeLabel = NAV.find((n) => n.key === activeNav)?.label ?? "My Schedule";

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
        <h1 className={styles.greeting}>Good day, Driver 👋</h1>
        <p className={styles.subGreeting}>You have 3 trips scheduled for today.</p>
      </div>

      {/* Stats */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.statIconBlue}`}>📅</div>
          <div className={styles.statValue}>3</div>
          <div className={styles.statLabel}>Today's Trips</div>
          <div className={styles.statChange}>2 pickups · 1 return</div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.statIconGreen}`}>✅</div>
          <div className={styles.statValue}>47</div>
          <div className={styles.statLabel}>Total Trips</div>
          <div className={styles.statChange}>↑ 5 this week</div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.statIconOrange}`}>🛣️</div>
          <div className={styles.statValue}>1,240</div>
          <div className={styles.statLabel}>KM This Month</div>
          <div className={styles.statChange}>↑ 180 km vs last month</div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.statIconTeal}`}>💵</div>
          <div className={styles.statValue}>₱8,500</div>
          <div className={styles.statLabel}>This Month's Pay</div>
          <div className={styles.statChange}>↑ ₱500 vs last month</div>
        </div>
      </div>

      {/* Schedule + Assigned car */}
      <div className={styles.sectionGrid}>
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <span className={styles.panelTitle}>Today's Schedule</span>
          </div>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Time</th>
                <th>Customer</th>
                <th>Vehicle</th>
                <th>Type</th>
              </tr>
            </thead>
            <tbody>
              {SCHEDULE.map((s, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 600 }}>{s.time}</td>
                  <td>
                    <div className={styles.customerName}>{s.customer}</div>
                    <div className={styles.location}>📍 {s.location}</div>
                  </td>
                  <td>{s.car}</td>
                  <td>
                    <span className={badgeClass(s.type, styles)}>
                      {badgeLabel(s.type)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <span className={styles.panelTitle}>Currently Assigned</span>
          </div>
          <div className={styles.carCard}>
            <div className={styles.carPlaceholder}>🚗</div>
            <div>
              <div className={styles.carTitle}>Toyota Camry 2023</div>
              <div className={styles.carPlate}>ABC-1234</div>
            </div>
            <div className={styles.carMeta}>
              <div className={styles.carMetaRow}>
                <span className={styles.carMetaKey}>Fuel Level</span>
                <span className={styles.carMetaVal}>78%</span>
              </div>
              <div className={styles.carMetaRow}>
                <span className={styles.carMetaKey}>Odometer</span>
                <span className={styles.carMetaVal}>24,310 km</span>
              </div>
              <div className={styles.carMetaRow}>
                <span className={styles.carMetaKey}>Last Service</span>
                <span className={styles.carMetaVal}>Jan 15, 2026</span>
              </div>
              <div className={styles.carMetaRow}>
                <span className={styles.carMetaKey}>Color</span>
                <span className={styles.carMetaVal}>Pearl White</span>
              </div>
            </div>
            <div className={styles.statusPill}>
              <div className={styles.statusDot} />
              Active Assignment
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
