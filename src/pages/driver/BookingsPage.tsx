import { useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase";
import type { Car, Booking } from "./types";
import styles from "./DriverDashboard.module.css";

interface Props {
  bookings: Booking[];
  cars: Car[];
}

type FilterTab = "all" | "pending" | "confirmed" | "completed" | "rejected";

export default function BookingsPage({ bookings, cars }: Props) {
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [updating, setUpdating] = useState<string | null>(null);

  const tabs: { key: FilterTab; label: string; count: number }[] = [
    { key: "all",       label: "All",       count: bookings.length },
    { key: "pending",   label: "Pending",   count: bookings.filter(b => b.status === "pending").length },
    { key: "confirmed", label: "Confirmed", count: bookings.filter(b => b.status === "confirmed").length },
    { key: "completed", label: "Completed", count: bookings.filter(b => b.status === "completed").length },
    { key: "rejected",  label: "Rejected",  count: bookings.filter(b => b.status === "rejected").length },
  ];

  const filtered = activeTab === "all"
    ? bookings
    : bookings.filter(b => b.status === activeTab);

  const sorted = [...filtered].sort((a, b) => {
    const order: Record<string, number> = { pending: 0, confirmed: 1, completed: 2, rejected: 3 };
    const sa = order[a.status] ?? 4;
    const sb = order[b.status] ?? 4;
    if (sa !== sb) return sa - sb;
    return b.startDate.localeCompare(a.startDate);
  });

  async function updateStatus(bookingId: string, status: Booking["status"]) {
    setUpdating(bookingId);
    try {
      await updateDoc(doc(db, "bookings", bookingId), { status });
    } catch (err) {
      console.error("Error updating booking:", err);
    } finally {
      setUpdating(null);
    }
  }

  function getCarName(carId: string) {
    const car = cars.find(c => c.id === carId);
    return car ? `${car.make} ${car.model}` : "Unknown Car";
  }

  return (
    <div>
      <div className={styles.mgrHeader}>
        <div>
          <h1 className={styles.mgrTitle}>Bookings</h1>
          <p className={styles.mgrSub}>
            {bookings.length === 0
              ? "No bookings for your cars yet."
              : `${bookings.length} booking${bookings.length !== 1 ? "s" : ""} total`}
          </p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className={styles.filterTabs}>
        {tabs.map(t => (
          <button
            key={t.key}
            className={`${styles.filterTab} ${activeTab === t.key ? styles.filterTabActive : ""}`}
            onClick={() => setActiveTab(t.key)}
          >
            {t.label}
            {t.count > 0 && (
              <span className={styles.filterTabCount}>{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {sorted.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyEmoji}>📋</div>
          <div className={styles.emptyTitle}>No bookings here</div>
          <div className={styles.emptyText}>
            {activeTab === "all"
              ? "Bookings from customers will appear here."
              : `No ${activeTab} bookings.`}
          </div>
        </div>
      ) : (
        <div className={styles.bookingsList}>
          {sorted.map(b => {
            const start = new Date(b.startDate);
            const end   = new Date(b.endDate);
            const days  = Math.ceil((end.getTime() - start.getTime()) / 86_400_000) + 1;
            const isUpdating = updating === b.id;

            return (
              <div key={b.id} className={styles.bookingCard}>
                <div className={styles.bookingCardThumb}>🚗</div>

                <div className={styles.bookingCardBody}>
                  <div className={styles.bookingCardTopRow}>
                    <div className={styles.bookingCardCarName}>{getCarName(b.carId)}</div>
                    {b.carPlate && (
                      <span className={styles.carPlateBadge}>{b.carPlate}</span>
                    )}
                  </div>
                  <div className={styles.bookingCardCustomer}>👤 {b.customer}</div>
                  <div className={styles.bookingCardDates}>
                    📅 {b.startDate} → {b.endDate}
                    <span className={styles.bookingCardDuration}>
                      · {days} day{days !== 1 ? "s" : ""}
                    </span>
                  </div>
                  {b.totalCost != null && (
                    <div className={styles.bookingCardCost}>
                      ₱{b.totalCost.toLocaleString()}
                    </div>
                  )}
                </div>

                <div className={styles.bookingCardRight}>
                  <span className={
                    b.status === "confirmed" ? `${styles.badge} ${styles.badgeConfirmed}` :
                    b.status === "pending"   ? `${styles.badge} ${styles.badgePending}`   :
                    b.status === "completed" ? `${styles.badge} ${styles.badgeCompleted}` :
                    `${styles.badge} ${styles.badgeRejected}`
                  }>
                    {b.status}
                  </span>
                  <div className={styles.bookingCardActions}>
                    {b.status === "pending" && (
                      <>
                        <button
                          className={styles.btnAccept}
                          onClick={() => updateStatus(b.id, "confirmed")}
                          disabled={isUpdating}
                        >
                          {isUpdating ? "…" : "✓ Accept"}
                        </button>
                        <button
                          className={styles.btnReject}
                          onClick={() => updateStatus(b.id, "rejected")}
                          disabled={isUpdating}
                        >
                          {isUpdating ? "…" : "✕ Reject"}
                        </button>
                      </>
                    )}
                    {b.status === "confirmed" && (
                      <button
                        className={styles.btnDone}
                        onClick={() => updateStatus(b.id, "completed")}
                        disabled={isUpdating}
                      >
                        {isUpdating ? "…" : "✓ Mark as Done"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
