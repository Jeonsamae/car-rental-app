import { useMemo, useState } from "react";
import styles from "./AdminDashboard.module.css";
import type { Booking } from "./types";

interface Props {
  bookings: Booking[];
}

function badgeClass(status: string, s: typeof styles) {
  if (status === "confirmed") return `${s.badge} ${s.badgeActive}`;
  if (status === "pending")   return `${s.badge} ${s.badgePending}`;
  if (status === "rejected")  return `${s.badge} ${s.badgeRejected}`;
  return `${s.badge} ${s.badgeCompleted}`;
}

export default function PaymentsPage({ bookings }: Props) {
  const [filter, setFilter] = useState<"All" | "completed" | "confirmed" | "pending">("All");

  const stats = useMemo(() => {
    const completed = bookings.filter(b => b.status === "completed");
    const confirmed = bookings.filter(b => b.status === "confirmed");
    const pending   = bookings.filter(b => b.status === "pending");
    return {
      totalRevenue:    completed.reduce((s, b) => s + (b.totalCost ?? 0), 0),
      confirmedRevenue: confirmed.reduce((s, b) => s + (b.totalCost ?? 0), 0),
      pendingRevenue:  pending.reduce((s, b) => s + (b.totalCost ?? 0), 0),
      completedCount:  completed.length,
      confirmedCount:  confirmed.length,
      pendingCount:    pending.length,
    };
  }, [bookings]);

  const filtered = bookings
    .filter(b => b.totalCost && b.totalCost > 0)
    .filter(b => filter === "All" || b.status === filter)
    .sort((a, b) => b.startDate.localeCompare(a.startDate));

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.greeting}>Payments</h1>
        <p className={styles.subGreeting}>Financial summary of all bookings</p>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.statIconGreen}`}>💰</div>
          <div className={styles.statValue}>
            {stats.totalRevenue >= 1000
              ? `₱${(stats.totalRevenue / 1000).toFixed(1)}k`
              : `₱${stats.totalRevenue.toLocaleString()}`}
          </div>
          <div className={styles.statLabel}>Total Revenue</div>
          <div className={styles.statChange}>
            {stats.completedCount} completed rental{stats.completedCount !== 1 ? "s" : ""}
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.statIconBlue}`}>📥</div>
          <div className={styles.statValue}>
            ₱{stats.confirmedRevenue.toLocaleString()}
          </div>
          <div className={styles.statLabel}>Confirmed (Upcoming)</div>
          <div className={styles.statChange}>
            {stats.confirmedCount} rental{stats.confirmedCount !== 1 ? "s" : ""} confirmed
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.statIconOrange}`}>⏳</div>
          <div className={styles.statValue}>
            ₱{stats.pendingRevenue.toLocaleString()}
          </div>
          <div className={styles.statLabel}>Awaiting Approval</div>
          <div className={styles.statChange}>
            {stats.pendingCount} pending request{stats.pendingCount !== 1 ? "s" : ""}
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.statIconPurple}`}>📊</div>
          <div className={styles.statValue}>
            {bookings.filter(b => b.totalCost && b.totalCost > 0).length}
          </div>
          <div className={styles.statLabel}>Total Transactions</div>
        </div>
      </div>

      <div className={styles.filterPanel}>
      <div className={styles.filterBar}>
        <div className={styles.statusTabs}>
          {(["All", "completed", "confirmed", "pending"] as const).map(s => (
            <button
              key={s}
              className={`${styles.statusTab} ${filter === s ? styles.statusTabActive : ""}`}
              onClick={() => setFilter(s)}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.panel}>
        {filtered.length === 0 ? (
          <div className={styles.emptyState}>No payment records found.</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Vehicle</th>
                <th>Customer</th>
                <th>Dates</th>
                <th>Status</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(b => (
                <tr key={b.id}>
                  <td>
                    <div className={styles.carName}>{b.carMake} {b.carModel}</div>
                    <div className={styles.carPlate}>{b.carPlate}</div>
                  </td>
                  <td>
                    <div className={styles.carName}>{b.customer}</div>
                    <div className={styles.carPlate}>{b.customerEmail}</div>
                  </td>
                  <td className={styles.dateCell}>{b.startDate} → {b.endDate}</td>
                  <td><span className={badgeClass(b.status, styles)}>{b.status}</span></td>
                  <td className={styles.rateCell}>₱{(b.totalCost ?? 0).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      </div>
    </div>
  );
}
