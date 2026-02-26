import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import DashboardShell from "../../components/DashboardShell";
import styles from "./AdminDashboard.module.css";

const NAV: { icon: string; label: string; key: string }[] = [
  { icon: "🏠", label: "Overview",   key: "overview"  },
  { icon: "🚗", label: "Fleet",      key: "fleet"     },
  { icon: "📋", label: "Rentals",    key: "rentals"   },
  { icon: "👥", label: "Customers",  key: "customers" },
  { icon: "💳", label: "Payments",   key: "payments"  },
  { icon: "⚙️", label: "Settings",   key: "settings"  },
];

const RECENT_RENTALS = [
  { id: "R-001", car: "Toyota Camry",       plate: "ABC-1234", customer: "Juan dela Cruz", status: "active",   amount: "₱2,500/day" },
  { id: "R-002", car: "Honda Civic",        plate: "XYZ-5678", customer: "Maria Santos",   status: "pending",  amount: "₱1,800/day" },
  { id: "R-003", car: "Ford Ranger",        plate: "DEF-9012", customer: "Jose Reyes",     status: "returned", amount: "₱3,200/day" },
  { id: "R-004", car: "Mitsubishi Montero", plate: "GHI-3456", customer: "Ana Lim",        status: "active",   amount: "₱4,500/day" },
  { id: "R-005", car: "Hyundai Tucson",     plate: "JKL-7890", customer: "Pedro Garcia",   status: "returned", amount: "₱3,000/day" },
];

const QUICK_ACTIONS = [
  { icon: "➕", bg: "rgba(99,102,241,0.12)",  label: "Add New Car",    desc: "Register a vehicle to the fleet"  },
  { icon: "📝", bg: "rgba(34,197,94,0.12)",   label: "Create Rental",  desc: "Start a new rental booking"       },
  { icon: "👤", bg: "rgba(251,146,60,0.12)",  label: "Add Customer",   desc: "Register a new customer account"  },
  { icon: "📊", bg: "rgba(139,92,246,0.12)",  label: "View Reports",   desc: "Revenue and usage analytics"      },
];

function badgeClass(status: string) {
  if (status === "active")   return `${styles.badge} ${styles.badgeActive}`;
  if (status === "pending")  return `${styles.badge} ${styles.badgePending}`;
  return `${styles.badge} ${styles.badgeReturned}`;
}

export default function AdminDashboard() {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const [activeNav, setActiveNav] = useState("overview");

  const handleLogout = async () => { await logout(); navigate("/"); };
  const activeLabel = NAV.find((n) => n.key === activeNav)?.label ?? "Overview";

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
        <h1 className={styles.greeting}>Admin Overview 👋</h1>
        <p className={styles.subGreeting}>Here's what's happening with your fleet today.</p>
      </div>

      {/* Stats */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.statIconBlue}`}>🚗</div>
          <div className={styles.statValue}>24</div>
          <div className={styles.statLabel}>Total Fleet</div>
          <div className={styles.statChange}>↑ 2 added this month</div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.statIconGreen}`}>✅</div>
          <div className={styles.statValue}>16</div>
          <div className={styles.statLabel}>Available Now</div>
          <div className={styles.statChange}>↑ 3 returned today</div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.statIconOrange}`}>📋</div>
          <div className={styles.statValue}>8</div>
          <div className={styles.statLabel}>Active Rentals</div>
          <div className={styles.statChange}>↑ 1 new today</div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.statIconPurple}`}>💰</div>
          <div className={styles.statValue}>₱148k</div>
          <div className={styles.statLabel}>Monthly Revenue</div>
          <div className={styles.statChange}>↑ 12% vs last month</div>
        </div>
      </div>

      {/* Recent rentals + Quick actions */}
      <div className={styles.sectionGrid}>
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <span className={styles.panelTitle}>Recent Rentals</span>
            <button className={styles.viewAll}>View all →</button>
          </div>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Vehicle</th>
                <th>Customer</th>
                <th>Status</th>
                <th>Rate</th>
              </tr>
            </thead>
            <tbody>
              {RECENT_RENTALS.map((r) => (
                <tr key={r.id}>
                  <td>
                    <div className={styles.carName}>{r.car}</div>
                    <div className={styles.carPlate}>{r.plate}</div>
                  </td>
                  <td>{r.customer}</td>
                  <td><span className={badgeClass(r.status)}>{r.status}</span></td>
                  <td>{r.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <span className={styles.panelTitle}>Quick Actions</span>
          </div>
          <div className={styles.actionsList}>
            {QUICK_ACTIONS.map((a) => (
              <div key={a.label} className={styles.actionItem}>
                <div className={styles.actionIcon} style={{ background: a.bg }}>{a.icon}</div>
                <div>
                  <div className={styles.actionLabel}>{a.label}</div>
                  <div className={styles.actionDesc}>{a.desc}</div>
                </div>
                <span className={styles.actionArrow}>›</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
