import { doc, deleteDoc } from "firebase/firestore";
import type { User } from "firebase/auth";
import { db } from "../../firebase";
import type { Car, Booking, SavedCar } from "./types";
import styles from "./CustomerDashboard.module.css";

interface Props {
  savedCars: SavedCar[];
  allCars: Car[];
  allBookings: Booking[];
  user: User | null;
  onViewCar: (car: Car) => void;
}

export default function SavedCarsPage({
  savedCars, allCars, allBookings, onViewCar,
}: Props) {
  const todayStr = new Date().toISOString().slice(0, 10);

  // Resolve saved car documents to full Car objects
  const resolved = savedCars
    .map(s => ({ saved: s, car: allCars.find(c => c.id === s.carId) }))
    .filter((item): item is { saved: SavedCar; car: Car } => item.car !== undefined);

  const isBooked = (carId: string) =>
    allBookings.some(b => b.carId === carId && b.startDate <= todayStr && b.endDate >= todayStr);

  async function handleUnsave(savedDocId: string) {
    try {
      await deleteDoc(doc(db, "savedCars", savedDocId));
    } catch (err) {
      console.error("Error removing saved car:", err);
    }
  }

  return (
    <div>
      <div className={styles.rentalsPageHeader}>
        <div>
          <h1 className={styles.rentalsTitle}>Saved Cars</h1>
          <p className={styles.rentalsSub}>
            {resolved.length === 0
              ? "Cars you save will appear here."
              : `${resolved.length} car${resolved.length !== 1 ? "s" : ""} in your favorites`}
          </p>
        </div>
      </div>

      {resolved.length === 0 ? (
        <div className={styles.rentalsEmpty}>
          <div className={styles.rentalsEmptyIcon}>❤️</div>
          <div className={styles.rentalsEmptyTitle}>No saved cars yet</div>
          <div className={styles.rentalsEmptyText}>
            Tap the ❤️ icon on any car while browsing to save it here.
          </div>
        </div>
      ) : (
        <div className={styles.savedGrid}>
          {resolved.map(({ saved, car }) => {
            const booked = isBooked(car.id);
            return (
              <div key={saved.id} className={styles.savedCard}>
                <div className={styles.savedCardThumb}>🚗</div>
                <div className={styles.savedCardBody}>
                  <div className={styles.savedCardName}>{car.make} {car.model}</div>
                  <div className={styles.savedCardSubRow}>
                    <span className={styles.savedCardYear}>{car.year}</span>
                    <span className={styles.savedCardPlate}>{car.plate}</span>
                  </div>
                  <div className={styles.savedCardSpecs}>
                    <span>⛽ {car.fuelType}</span>
                    <span>⚙️ {car.transmission}</span>
                    <span>💺 {car.seats} seats</span>
                  </div>
                  {car.location && (
                    <div className={styles.savedCardLocation}>📍 {car.location}</div>
                  )}
                </div>
                <div className={styles.savedCardFooter}>
                  <div className={styles.savedCardRate}>
                    ₱{car.ratePerDay.toLocaleString()}<span>/day</span>
                  </div>
                  <div className={booked ? styles.savedCardBooked : styles.savedCardAvail}>
                    <span className={styles.statusDotTiny} />
                    {booked ? "Booked" : "Available"}
                  </div>
                  <div className={styles.savedCardActions}>
                    <button
                      className={styles.unsaveBtn}
                      onClick={() => handleUnsave(saved.id)}
                      title="Remove from saved"
                    >
                      🗑️ Remove
                    </button>
                    <button
                      className={styles.viewBookBtn}
                      onClick={() => onViewCar(car)}
                    >
                      View & Book
                    </button>
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
