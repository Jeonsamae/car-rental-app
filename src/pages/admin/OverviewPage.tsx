import styles from "./AdminDashboard.module.css";
import type { Car, Booking } from "./types";

interface Props {
  cars: Car[];
  bookings: Booking[];
  loading: boolean;
  onNavChange: (key: string) => void;
}

function badgeClass(status: string) {
  if (status === "confirmed") return `${styles.badge} ${styles.badgeActive}`;
  if (status === "pending")   return `${styles.badge} ${styles.badgePending}`;
  if (status === "rejected")  return `${styles.badge} ${styles.badgeRejected}`;
  return `${styles.badge} ${styles.badgeCompleted}`;
}

export default function OverviewPage({ cars, bookings, loading, onNavChange }: Props) {
  const todayStr = new Date().toISOString().slice(0, 10);

  const activeBookings  = bookings.filter(b =>
    b.startDate <= todayStr && b.endDate >= todayStr &&
    b.status !== "rejected" && b.status !== "completed"
  );
  const pendingCount    = bookings.filter(b => b.status === "pending").length;
  const totalRevenue    = bookings
    .filter(b => b.status === "completed")
    .reduce((sum, b) => sum + (b.totalCost ?? 0), 0);
  const availableCount  = cars.filter(c => !activeBookings.some(b => b.carId === c.id)).length;

  const recentBookings  = [...bookings]
    .sort((a, b) => b.startDate.localeCompare(a.startDate))
    .slice(0, 6);

  if (loading) {
    return (
      <div className={styles.loadingState}>
        <div className={styles.loadingIcon}>⏳</div>
        <div>Loading dashboard data…</div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.greeting}>Admin Overview 👋</h1>
        <p className={styles.subGreeting}>Here's what's happening with your fleet today.</p>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.statIconBlue}`}>🚗</div>
          <div className={styles.statValue}>{cars.length}</div>
          <div className={styles.statLabel}>Total Fleet</div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.statIconGreen}`}>✅</div>
          <div className={styles.statValue}>{availableCount}</div>
          <div className={styles.statLabel}>Available Now</div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.statIconOrange}`}>📋</div>
          <div className={styles.statValue}>{activeBookings.length}</div>
          <div className={styles.statLabel}>Active Rentals</div>
          {pendingCount > 0 && (
            <div className={styles.statChange}>{pendingCount} pending approval</div>
          )}
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.statIconPurple}`}>💰</div>
          <div className={styles.statValue}>
            {totalRevenue >= 1000
              ? `₱${(totalRevenue / 1000).toFixed(1)}k`
              : `₱${totalRevenue.toLocaleString()}`}
          </div>
          <div className={styles.statLabel}>Total Revenue</div>
        </div>
      </div>

      <div className={styles.sectionGrid}>
        {/* Recent Bookings */}
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <span className={styles.panelTitle}>Recent Bookings</span>
            <button className={styles.viewAll} onClick={() => onNavChange("rentals")}>
              View all →
            </button>
          </div>
          {recentBookings.length === 0 ? (
            <div className={styles.emptyState}>No bookings yet.</div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Vehicle</th>
                  <th>Customer</th>
                  <th>Dates</th>
                  <th>Status</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {recentBookings.map(b => (
                  <tr key={b.id}>
                    <td>
                      <div className={styles.carName}>{b.carMake} {b.carModel}</div>
                      <div className={styles.carPlate}>{b.carPlate}</div>
                    </td>
                    <td>{b.customer}</td>
                    <td className={styles.dateCell}>{b.startDate} → {b.endDate}</td>
                    <td><span className={badgeClass(b.status)}>{b.status}</span></td>
                    <td>{b.totalCost ? `₱${b.totalCost.toLocaleString()}` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Fleet Summary */}
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <span className={styles.panelTitle}>Fleet Summary</span>
            <button className={styles.viewAll} onClick={() => onNavChange("fleet")}>
              View all →
            </button>
          </div>
          <div className={styles.summaryList}>
            {[
              { label: "Total Cars",   value: cars.length,            color: "#6366f1" },
              { label: "Available",    value: availableCount,          color: "#22c55e" },
              { label: "On Rental",    value: activeBookings.length,   color: "#f97316" },
              { label: "Pending",      value: pendingCount,            color: "#eab308" },
              { label: "Total Bookings", value: bookings.length,       color: "#8b5cf6" },
            ].map(item => (
              <div key={item.label} className={styles.summaryItem}>
                <div className={styles.summaryDot} style={{ background: item.color }} />
                <div className={styles.summaryLabel}>{item.label}</div>
                <div className={styles.summaryValue} style={{ color: item.color }}>
                  {item.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
