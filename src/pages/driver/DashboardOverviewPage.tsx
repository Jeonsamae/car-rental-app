import type { User } from "firebase/auth";
import type { Car, Booking } from "./types";
import styles from "./DriverDashboard.module.css";

interface Props {
  cars: Car[];
  bookings: Booking[];
  loading: boolean;
  user: User | null;
}

function calcMonthlyEarnings(bookings: Booking[], cars: Car[]): number {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  return bookings.reduce((sum, b) => {
    const bStart = new Date(b.startDate + "T00:00:00");
    const bEnd   = new Date(b.endDate   + "T23:59:59");
    if (bEnd < monthStart || bStart > monthEnd) return sum;
    const overlapStart = bStart < monthStart ? monthStart : bStart;
    const overlapEnd   = bEnd   > monthEnd   ? monthEnd   : bEnd;
    const days = Math.ceil((overlapEnd.getTime() - overlapStart.getTime()) / 86_400_000) + 1;
    const car  = cars.find(c => c.id === b.carId);
    return sum + (car ? days * car.ratePerDay : 0);
  }, 0);
}

export default function DashboardOverviewPage({ cars, bookings, loading, user }: Props) {
  const today    = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const hour     = today.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const firstName = user?.displayName?.split(" ")[0] ?? user?.email?.split("@")[0] ?? "Driver";

  const activeBookings = bookings.filter(b =>
    b.startDate <= todayStr && b.endDate >= todayStr &&
    b.status !== "rejected" && b.status !== "completed"
  );
  const availableCount = cars.filter(c => !activeBookings.some(b => b.carId === c.id)).length;
  const pendingCount   = bookings.filter(b => b.status === "pending").length;
  const monthlyEarnings = calcMonthlyEarnings(bookings, cars);

  // Today's pickups (start today) and returns (end today, not also starting today)
  type TodayEvent = Booking & { car: Car | undefined; eventType: "pickup" | "return" };

  const todayPickups: TodayEvent[] = bookings
    .filter(b => b.startDate === todayStr)
    .map(b => ({ ...b, car: cars.find(c => c.id === b.carId), eventType: "pickup" }));

  const todayReturns: TodayEvent[] = bookings
    .filter(b => b.endDate === todayStr && b.startDate !== todayStr)
    .map(b => ({ ...b, car: cars.find(c => c.id === b.carId), eventType: "return" }));

  const todayEvents: TodayEvent[] = [...todayPickups, ...todayReturns];

  // Upcoming: startDate > today, sorted ascending, max 5
  const upcoming = bookings
    .filter(b => b.startDate > todayStr)
    .sort((a, b) => a.startDate.localeCompare(b.startDate))
    .slice(0, 5)
    .map(b => ({ ...b, car: cars.find(c => c.id === b.carId) }));

  const dateLabel = today.toLocaleDateString("en-PH", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });

  if (loading) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyEmoji}>⏳</div>
        <div className={styles.emptyTitle}>Loading dashboard…</div>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className={styles.pageHeader}>
        <h1 className={styles.greeting}>{greeting}, {firstName} 👋</h1>
        <p className={styles.subGreeting}>
          {cars.length === 0
            ? "Head over to My Cars to add your first vehicle."
            : `You have ${cars.length} vehicle${cars.length !== 1 ? "s" : ""} in your fleet.`}
        </p>
      </div>

      {/* Stats */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.statIconBlue}`}>🚗</div>
          <div className={styles.statValue}>{cars.length}</div>
          <div className={styles.statLabel}>My Fleet</div>
          <div className={styles.statChange}>
            {cars.length === 0 ? "No vehicles yet" : `${availableCount} available now`}
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.statIconGreen}`}>✅</div>
          <div className={styles.statValue}>{availableCount}</div>
          <div className={styles.statLabel}>Available Now</div>
          <div className={styles.statChange}>
            {activeBookings.length > 0
              ? `${activeBookings.length} currently booked`
              : "All cars free"}
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.statIconOrange}`}>📋</div>
          <div className={styles.statValue}>{activeBookings.length}</div>
          <div className={styles.statLabel}>Active Bookings</div>
          <div className={styles.statChange}>
            {pendingCount > 0 ? `${pendingCount} pending approval` : "All confirmed"}
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.statIconTeal}`}>💵</div>
          <div className={styles.statValue}>₱{monthlyEarnings.toLocaleString()}</div>
          <div className={styles.statLabel}>Est. This Month</div>
          <div className={styles.statChange}>Based on active bookings</div>
        </div>
      </div>

      <div className={styles.sectionGrid}>

        {/* Today's activity */}
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <span className={styles.panelTitle}>Today's Activity</span>
            <span className={styles.panelSub}>{dateLabel}</span>
          </div>
          {todayEvents.length === 0 ? (
            <div className={styles.panelEmpty}>
              <span className={styles.panelEmptyIcon}>🌅</span>
              <span>No pickups or returns scheduled today.</span>
            </div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Vehicle</th>
                  <th>Type</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {todayEvents.map(ev => (
                  <tr key={`${ev.id}-${ev.eventType}`}>
                    <td>
                      <div className={styles.customerName}>{ev.customer}</div>
                    </td>
                    <td>
                      {ev.car ? `${ev.car.make} ${ev.car.model}` : <span style={{ color: "#94a3b8" }}>Unknown</span>}
                    </td>
                    <td>
                      <span className={ev.eventType === "pickup"
                        ? `${styles.badge} ${styles.badgePickup}`
                        : `${styles.badge} ${styles.badgeReturn}`}>
                        {ev.eventType === "pickup" ? "Pickup" : "Return"}
                      </span>
                    </td>
                    <td>
                      <span className={ev.status === "confirmed"
                        ? `${styles.badge} ${styles.badgeDone}`
                        : `${styles.badge} ${styles.badgeReturn}`}>
                        {ev.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Upcoming bookings */}
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <span className={styles.panelTitle}>Upcoming Bookings</span>
            {upcoming.length > 0 && (
              <span className={styles.panelSub}>{upcoming.length} scheduled</span>
            )}
          </div>
          {upcoming.length === 0 ? (
            <div className={styles.panelEmpty}>
              <span className={styles.panelEmptyIcon}>📅</span>
              <span>No upcoming bookings yet.</span>
            </div>
          ) : (
            <div className={styles.upcomingList}>
              {upcoming.map(b => (
                <div key={b.id} className={styles.upcomingItem}>
                  <div className={styles.upcomingCar}>
                    <div className={styles.upcomingCarEmoji}>🚗</div>
                    <div>
                      <div className={styles.upcomingCarName}>
                        {b.car ? `${b.car.make} ${b.car.model}` : "Unknown Car"}
                      </div>
                      <div className={styles.upcomingCustomer}>👤 {b.customer}</div>
                    </div>
                  </div>
                  <div className={styles.upcomingDates}>
                    <div className={styles.upcomingDate}>{b.startDate} → {b.endDate}</div>
                    <span className={b.status === "confirmed"
                      ? `${styles.badge} ${styles.badgeDone}`
                      : `${styles.badge} ${styles.badgeReturn}`}>
                      {b.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </>
  );
}
