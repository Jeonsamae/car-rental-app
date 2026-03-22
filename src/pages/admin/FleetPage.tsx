import { useState } from "react";
import styles from "./AdminDashboard.module.css";
import type { Car, Booking } from "./types";

interface Props {
  cars: Car[];
  bookings: Booking[];
  loading: boolean;
}

export default function FleetPage({ cars, bookings, loading }: Props) {
  const todayStr = new Date().toISOString().slice(0, 10);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"All" | "Available" | "On Rental">("All");

  const isBooked = (carId: string) =>
    bookings.some(b =>
      b.carId === carId &&
      b.startDate <= todayStr && b.endDate >= todayStr &&
      b.status !== "rejected" && b.status !== "completed"
    );

  const filtered = cars.filter(c => {
    const q = search.toLowerCase();
    const matchSearch = !q
      || c.make.toLowerCase().includes(q)
      || c.model.toLowerCase().includes(q)
      || (c.plate ?? "").toLowerCase().includes(q)
      || (c.driverName ?? "").toLowerCase().includes(q)
      || (c.location ?? "").toLowerCase().includes(q);
    const booked = isBooked(c.id);
    const matchStatus =
      filterStatus === "All" ||
      (filterStatus === "Available" && !booked) ||
      (filterStatus === "On Rental" && booked);
    return matchSearch && matchStatus;
  });

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.greeting}>Fleet</h1>
        <p className={styles.subGreeting}>
          {cars.length} vehicle{cars.length !== 1 ? "s" : ""} registered
        </p>
      </div>

      <div className={styles.filterPanel}>
      <div className={styles.filterBar}>
        <div className={styles.searchWrap}>
          <span className={styles.searchIcon}>🔍</span>
          <input
            className={styles.searchInput}
            placeholder="Search by make, model, plate, driver, location…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button className={styles.searchClear} onClick={() => setSearch("")}>✕</button>
          )}
        </div>
        <div className={styles.statusTabs}>
          {(["All", "Available", "On Rental"] as const).map(s => (
            <button
              key={s}
              className={`${styles.statusTab} ${filterStatus === s ? styles.statusTabActive : ""}`}
              onClick={() => setFilterStatus(s)}
            >
              {s}
              {s !== "All" && (
                <span className={styles.tabCount}>
                  {s === "Available"
                    ? cars.filter(c => !isBooked(c.id)).length
                    : cars.filter(c => isBooked(c.id)).length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.panel}>
        {loading ? (
          <div className={styles.emptyState}>Loading fleet…</div>
        ) : filtered.length === 0 ? (
          <div className={styles.emptyState}>No cars found.</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Vehicle</th>
                <th>Plate</th>
                <th>Driver</th>
                <th>Location</th>
                <th>Specs</th>
                <th>Rate/Day</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(car => {
                const booked = isBooked(car.id);
                return (
                  <tr key={car.id}>
                    <td>
                      <div className={styles.carName}>{car.make} {car.model}</div>
                      <div className={styles.carPlate}>{car.year}{car.color ? ` · ${car.color}` : ""}</div>
                    </td>
                    <td><span className={styles.plateTag}>{car.plate}</span></td>
                    <td>{car.driverName || "—"}</td>
                    <td>{car.location || "—"}</td>
                    <td>
                      <div className={styles.specsCell}>
                        <span>⛽ {car.fuelType}</span>
                        <span>⚙️ {car.transmission}</span>
                        <span>💺 {car.seats}</span>
                      </div>
                    </td>
                    <td className={styles.rateCell}>₱{car.ratePerDay.toLocaleString()}</td>
                    <td>
                      <span className={`${styles.badge} ${booked ? styles.badgePending : styles.badgeActive}`}>
                        {booked ? "On Rental" : "Available"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
      </div>
    </div>
  );
}
