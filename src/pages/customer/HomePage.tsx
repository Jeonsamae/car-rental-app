import type { User } from "firebase/auth";
import type { Car, Booking, SavedCar } from "./types";
import styles from "./CustomerDashboard.module.css";

interface Props {
  cars: Car[];
  allBookings: Booking[];
  savedCars: SavedCar[];
  carsLoading: boolean;
  user: User | null;
  onBrowse: () => void;
  onViewCar: (car: Car) => void;
}

export default function HomePage({
  cars, allBookings, savedCars, carsLoading, user, onBrowse, onViewCar,
}: Props) {
  const todayStr  = new Date().toISOString().slice(0, 10);
  const firstName = user?.displayName?.split(" ")[0] ?? user?.email?.split("@")[0] ?? "there";

  // Real stats derived from data
  const myBookings   = allBookings.filter(b => b.customerId === user?.uid);
  const activeRental = myBookings.find(b => b.startDate <= todayStr && b.endDate >= todayStr);
  const upcomingCount = myBookings.filter(b => b.startDate > todayStr).length;
  const completedCount = myBookings.filter(b => b.endDate < todayStr).length;
  const savedCount   = savedCars.length;

  return (
    <>
      <div className={styles.pageHeader}>
        <h1 className={styles.greeting}>Welcome back, {firstName} 👋</h1>
        <p className={styles.subGreeting}>Find your perfect ride for today.</p>
      </div>

      {/* Stats */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.statIconGreen}`}>🚗</div>
          <div className={styles.statValue}>{activeRental ? 1 : 0}</div>
          <div className={styles.statLabel}>Active Rental</div>
          <div className={styles.statSub}>
            {activeRental ? `Returns ${activeRental.endDate}` : "No active rental"}
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.statIconBlue}`}>📅</div>
          <div className={styles.statValue}>{upcomingCount}</div>
          <div className={styles.statLabel}>Upcoming</div>
          <div className={styles.statSub}>
            {upcomingCount === 0 ? "No upcoming trips" : `${upcomingCount} scheduled`}
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.statIconOrange}`}>❤️</div>
          <div className={styles.statValue}>{savedCount}</div>
          <div className={styles.statLabel}>Saved Cars</div>
          <div className={styles.statSub}>In your favorites</div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.statIconYellow}`}>✅</div>
          <div className={styles.statValue}>{completedCount}</div>
          <div className={styles.statLabel}>Completed</div>
          <div className={styles.statSub}>Total trips taken</div>
        </div>
      </div>

      <div className={styles.sectionGrid}>
        {/* Quick car preview */}
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <span className={styles.panelTitle}>Available Cars</span>
            <button className={styles.bookBtn} onClick={onBrowse}>Browse All →</button>
          </div>
          <div className={styles.carGrid}>
            {carsLoading ? (
              <div className={styles.homeCarLoading}>Loading cars…</div>
            ) : cars.length === 0 ? (
              <div className={styles.homeCarLoading}>No cars listed yet.</div>
            ) : (
              cars.slice(0, 6).map(car => (
                <div
                  key={car.id}
                  className={styles.carCard}
                  onClick={() => onViewCar(car)}
                  style={{ cursor: "pointer" }}
                >
                  <div className={styles.carThumb}>🚗</div>
                  <div className={styles.carInfo}>
                    <div className={styles.carName}>{car.make} {car.model}</div>
                    <div className={styles.carType}>{car.fuelType} · {car.seats} seats</div>
                    <div className={styles.carFooter}>
                      <span className={styles.carRate}>₱{car.ratePerDay.toLocaleString()}/day</span>
                      <button
                        className={styles.carBookBtn}
                        onClick={e => { e.stopPropagation(); onViewCar(car); }}
                      >
                        View
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Active or upcoming booking */}
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <span className={styles.panelTitle}>
              {activeRental ? "Active Booking" : "Upcoming Booking"}
            </span>
          </div>

          {activeRental || myBookings.filter(b => b.startDate > todayStr)[0] ? (() => {
            const b = activeRental ?? myBookings.filter(x => x.startDate > todayStr)
              .sort((a, b) => a.startDate.localeCompare(b.startDate))[0];
            const isActive = b.startDate <= todayStr && b.endDate >= todayStr;
            return (
              <div className={styles.bookingCard}>
                <div className={styles.bookingVehicle}>🚗</div>
                <div className={styles.bookingCarName}>
                  {b.carMake && b.carModel ? `${b.carMake} ${b.carModel}` : "Your Rental"}
                  {b.carYear ? ` ${b.carYear}` : ""}
                </div>
                {isActive && (
                  <div className={styles.activePill}>
                    <div className={styles.activeDot} /> Active
                  </div>
                )}
                <div className={styles.bookingMeta}>
                  {b.carPlate && (
                    <div className={styles.bookingRow}>
                      <span className={styles.bookingKey}>Plate No.</span>
                      <span className={styles.bookingVal}>{b.carPlate}</span>
                    </div>
                  )}
                  <div className={styles.bookingRow}>
                    <span className={styles.bookingKey}>Pickup</span>
                    <span className={styles.bookingVal}>{b.startDate}</span>
                  </div>
                  <div className={styles.bookingRow}>
                    <span className={styles.bookingKey}>Return</span>
                    <span className={styles.bookingVal}>{b.endDate}</span>
                  </div>
                  {b.totalCost != null && (
                    <div className={styles.bookingRow}>
                      <span className={styles.bookingKey}>Total</span>
                      <span className={styles.bookingVal}>₱{b.totalCost.toLocaleString()}</span>
                    </div>
                  )}
                  <div className={styles.bookingRow}>
                    <span className={styles.bookingKey}>Status</span>
                    <span className={styles.bookingVal} style={{ textTransform: "capitalize" }}>
                      {b.status}
                    </span>
                  </div>
                </div>
              </div>
            );
          })() : (
            <div className={styles.noBooking}>
              <div className={styles.noBookingIcon}>🚗</div>
              <div className={styles.noBookingText}>No active or upcoming rentals.</div>
              <button className={styles.browseBtn} onClick={onBrowse}>Browse Cars</button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
