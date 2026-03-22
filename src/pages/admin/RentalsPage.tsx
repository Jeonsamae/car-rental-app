import { useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase";
import styles from "./AdminDashboard.module.css";
import type { Booking } from "./types";

interface Props {
  bookings: Booking[];
}

const STATUS_FILTERS = ["All", "pending", "confirmed", "completed", "rejected"] as const;
type StatusFilter = typeof STATUS_FILTERS[number];

function badgeClass(status: string, s: typeof styles) {
  if (status === "confirmed") return `${s.badge} ${s.badgeActive}`;
  if (status === "pending")   return `${s.badge} ${s.badgePending}`;
  if (status === "rejected")  return `${s.badge} ${s.badgeRejected}`;
  return `${s.badge} ${s.badgeCompleted}`;
}

export default function RentalsPage({ bookings }: Props) {
  const [filter, setFilter]   = useState<StatusFilter>("All");
  const [search, setSearch]   = useState("");
  const [updating, setUpdating] = useState<string | null>(null);

  const filtered = bookings
    .filter(b => filter === "All" || b.status === filter)
    .filter(b => {
      const q = search.toLowerCase();
      return !q
        || b.customer.toLowerCase().includes(q)
        || (b.customerEmail ?? "").toLowerCase().includes(q)
        || (b.carMake ?? "").toLowerCase().includes(q)
        || (b.carModel ?? "").toLowerCase().includes(q)
        || (b.carPlate ?? "").toLowerCase().includes(q);
    })
    .sort((a, b) => b.startDate.localeCompare(a.startDate));

  async function updateStatus(bookingId: string, status: Booking["status"]) {
    setUpdating(bookingId);
    try {
      await updateDoc(doc(db, "bookings", bookingId), { status });
    } catch (err) {
      console.error("Failed to update booking:", err);
    } finally {
      setUpdating(null);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.greeting}>Rentals</h1>
        <p className={styles.subGreeting}>
          {bookings.length} booking{bookings.length !== 1 ? "s" : ""} total
        </p>
      </div>

      <div className={styles.filterPanel}>
      <div className={styles.filterBar}>
        <div className={styles.searchWrap}>
          <span className={styles.searchIcon}>🔍</span>
          <input
            className={styles.searchInput}
            placeholder="Search by customer, car…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button className={styles.searchClear} onClick={() => setSearch("")}>✕</button>
          )}
        </div>
        <div className={styles.statusTabs}>
          {STATUS_FILTERS.map(s => (
            <button
              key={s}
              className={`${styles.statusTab} ${filter === s ? styles.statusTabActive : ""}`}
              onClick={() => setFilter(s)}
            >
              {s === "All" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
              {s !== "All" && (
                <span className={styles.tabCount}>
                  {bookings.filter(b => b.status === s).length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.panel}>
        {filtered.length === 0 ? (
          <div className={styles.emptyState}>No bookings found.</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Vehicle</th>
                <th>Customer</th>
                <th>Dates</th>
                <th>Total</th>
                <th>Status</th>
                <th>Actions</th>
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
                  <td className={styles.rateCell}>
                    {b.totalCost ? `₱${b.totalCost.toLocaleString()}` : "—"}
                  </td>
                  <td>
                    <span className={badgeClass(b.status, styles)}>{b.status}</span>
                  </td>
                  <td>
                    <div className={styles.actionBtns}>
                      {b.status === "pending" && (
                        <>
                          <button
                            className={styles.btnConfirm}
                            onClick={() => updateStatus(b.id, "confirmed")}
                            disabled={updating === b.id}
                          >
                            Confirm
                          </button>
                          <button
                            className={styles.btnReject}
                            onClick={() => updateStatus(b.id, "rejected")}
                            disabled={updating === b.id}
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {b.status === "confirmed" && (
                        <button
                          className={styles.btnComplete}
                          onClick={() => updateStatus(b.id, "completed")}
                          disabled={updating === b.id}
                        >
                          Complete
                        </button>
                      )}
                    </div>
                  </td>
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
