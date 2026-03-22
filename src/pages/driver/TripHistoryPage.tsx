import type { Car, Booking } from "./types";
import styles from "./DriverDashboard.module.css";

interface Props {
  cars: Car[];
  bookings: Booking[];
}

export default function TripHistoryPage({ cars, bookings }: Props) {
  const todayStr = new Date().toISOString().slice(0, 10);

  const pastBookings = bookings
    .filter(b => b.endDate < todayStr)
    .sort((a, b) => b.endDate.localeCompare(a.endDate));

  const totalDays = pastBookings.reduce((sum, b) => {
    const start = new Date(b.startDate);
    const end   = new Date(b.endDate);
    return sum + Math.ceil((end.getTime() - start.getTime()) / 86_400_000) + 1;
  }, 0);

  const totalEarnings = pastBookings.reduce((sum, b) => {
    const car   = cars.find(c => c.id === b.carId);
    const start = new Date(b.startDate);
    const end   = new Date(b.endDate);
    const days  = Math.ceil((end.getTime() - start.getTime()) / 86_400_000) + 1;
    return sum + (car ? days * car.ratePerDay : 0);
  }, 0);

  return (
    <div>
      <div className={styles.mgrHeader}>
        <div>
          <h1 className={styles.mgrTitle}>Trip History</h1>
          <p className={styles.mgrSub}>
            {pastBookings.length === 0
              ? "Completed rentals will appear here."
              : `${pastBookings.length} completed rental${pastBookings.length !== 1 ? "s" : ""} · ${totalDays} total days`}
          </p>
        </div>
        {totalEarnings > 0 && (
          <div className={styles.historyEarningsBadge}>
            💰 ₱{totalEarnings.toLocaleString()} total earned
          </div>
        )}
      </div>

      {pastBookings.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyEmoji}>📋</div>
          <div className={styles.emptyTitle}>No completed trips yet</div>
          <div className={styles.emptyText}>
            Bookings that have ended will appear here as your trip history.
          </div>
        </div>
      ) : (
        <div className={styles.panel}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Vehicle</th>
                <th>Customer</th>
                <th>Dates</th>
                <th>Duration</th>
                <th>Earnings</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {pastBookings.map(b => {
                const car   = cars.find(c => c.id === b.carId);
                const start = new Date(b.startDate);
                const end   = new Date(b.endDate);
                const days  = Math.ceil((end.getTime() - start.getTime()) / 86_400_000) + 1;
                const earnings = car ? days * car.ratePerDay : 0;

                return (
                  <tr key={b.id}>
                    <td>
                      <div className={styles.carName}>
                        {car ? `${car.make} ${car.model}` : "Unknown Car"}
                      </div>
                      {car && <span className={styles.carPlateBadge}>{car.plate}</span>}
                    </td>
                    <td>
                      <div className={styles.customerName}>{b.customer}</div>
                    </td>
                    <td className={styles.historyDates}>
                      {b.startDate} → {b.endDate}
                    </td>
                    <td style={{ fontWeight: 600, color: "#334155" }}>
                      {days} day{days !== 1 ? "s" : ""}
                    </td>
                    <td className={styles.historyEarnings}>
                      {car ? `₱${earnings.toLocaleString()}` : "—"}
                    </td>
                    <td>
                      <span className={b.status === "confirmed"
                        ? `${styles.badge} ${styles.badgeDone}`
                        : `${styles.badge} ${styles.badgeReturn}`}>
                        {b.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
