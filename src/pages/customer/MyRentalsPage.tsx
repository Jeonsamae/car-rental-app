import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import type { User } from "firebase/auth";
import { db } from "../../firebase";
import type { Booking } from "./types";
import styles from "./CustomerDashboard.module.css";

interface Props {
  user: User | null;
}

type RentalStatus = "active" | "upcoming" | "completed";

function getRentalStatus(b: Booking): RentalStatus {
  const today = new Date().toISOString().slice(0, 10);
  if (b.endDate < today)   return "completed";
  if (b.startDate > today) return "upcoming";
  return "active";
}

export default function MyRentalsPage({ user }: Props) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const q = query(
      collection(db, "bookings"),
      where("customerId", "==", user.uid)
    );
    const unsub = onSnapshot(q, snap => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as Booking));
      // Sort: active → upcoming → completed, then by startDate desc
      data.sort((a, b) => {
        const order: Record<RentalStatus, number> = { active: 0, upcoming: 1, completed: 2 };
        const sa = order[getRentalStatus(a)];
        const sb = order[getRentalStatus(b)];
        if (sa !== sb) return sa - sb;
        return b.startDate.localeCompare(a.startDate);
      });
      setBookings(data);
      setLoading(false);
    }, err => {
      console.error("bookings error", err);
      setLoading(false);
    });
    return unsub;
  }, [user]);

  if (loading) {
    return (
      <div className={styles.rentalsEmpty}>
        <div className={styles.rentalsEmptyIcon}>⏳</div>
        <div className={styles.rentalsEmptyTitle}>Loading your rentals…</div>
      </div>
    );
  }

  return (
    <div>
      <div className={styles.rentalsPageHeader}>
        <div>
          <h1 className={styles.rentalsTitle}>My Rentals</h1>
          <p className={styles.rentalsSub}>
            {bookings.length === 0
              ? "Your booking history will appear here."
              : `${bookings.length} rental${bookings.length !== 1 ? "s" : ""} total`}
          </p>
        </div>
      </div>

      {bookings.length === 0 ? (
        <div className={styles.rentalsEmpty}>
          <div className={styles.rentalsEmptyIcon}>🚗</div>
          <div className={styles.rentalsEmptyTitle}>No rentals yet</div>
          <div className={styles.rentalsEmptyText}>
            Browse cars and make your first booking to see it here.
          </div>
        </div>
      ) : (
        <div className={styles.rentalsList}>
          {bookings.map(b => {
            const status = getRentalStatus(b);
            const start  = new Date(b.startDate);
            const end    = new Date(b.endDate);
            const days   = Math.ceil((end.getTime() - start.getTime()) / 86_400_000) + 1;

            return (
              <div key={b.id} className={styles.rentalCard}>
                {/* Left: car emoji */}
                <div className={styles.rentalThumb}>🚗</div>

                {/* Center: info */}
                <div className={styles.rentalBody}>
                  <div className={styles.rentalTopRow}>
                    <div className={styles.rentalCarName}>
                      {b.carMake && b.carModel
                        ? `${b.carMake} ${b.carModel}${b.carYear ? ` ${b.carYear}` : ""}`
                        : "Rental Car"}
                    </div>
                    {b.carPlate && (
                      <span className={styles.rentalPlate}>{b.carPlate}</span>
                    )}
                  </div>

                  <div className={styles.rentalDates}>
                    📅 {b.startDate} → {b.endDate}
                    <span className={styles.rentalDuration}>· {days} day{days !== 1 ? "s" : ""}</span>
                  </div>

                  {b.totalCost != null && (
                    <div className={styles.rentalCost}>
                      ₱{b.totalCost.toLocaleString()}
                    </div>
                  )}
                </div>

                {/* Right: status */}
                <div className={styles.rentalRight}>
                  <span className={
                    status === "active"    ? styles.rentalStatusActive :
                    status === "upcoming"  ? styles.rentalStatusUpcoming :
                    styles.rentalStatusCompleted
                  }>
                    {status === "active"    ? "● Active" :
                     status === "upcoming"  ? "○ Upcoming" :
                     "✓ Completed"}
                  </span>
                  <span className={
                    b.status === "confirmed" ? styles.rentalConfirmed : styles.rentalPending
                  }>
                    {b.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
