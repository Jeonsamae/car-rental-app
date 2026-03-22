import { useState } from "react";
import { collection, addDoc, serverTimestamp, doc, deleteDoc } from "firebase/firestore";
import type { User } from "firebase/auth";
import { db } from "../../firebase";
import type { Car, Booking, SavedCar } from "./types";
import styles from "./CustomerDashboard.module.css";

// ── Helpers ────────────────────────────────────────────────
function datesOverlap(s1: string, e1: string, s2: string, e2: string) {
  return s1 <= e2 && e1 >= s2;
}

function calcDays(start: string, end: string) {
  return Math.ceil((new Date(end).getTime() - new Date(start).getTime()) / 86_400_000) + 1;
}

// ── Detail Panel ───────────────────────────────────────────
function CarDetailPanel({
  car, booked, onClose, allBookings, user, onBook, isSaved, onToggleSave,
}: {
  car: Car;
  booked: boolean;
  onClose: () => void;
  allBookings: Booking[];
  user: User | null;
  onBook: (car: Car, startDate: string, endDate: string) => Promise<void>;
  isSaved: boolean;
  onToggleSave: (car: Car) => Promise<void>;
}) {
  const todayStr = new Date().toISOString().slice(0, 10);

  const [view, setView] = useState<"details" | "booking">("details");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [bookingState, setBookingState] = useState<"idle" | "submitting" | "success">("idle");
  const [bookingError, setBookingError] = useState("");
  const [savingToggle, setSavingToggle] = useState(false);

  const days = startDate && endDate && endDate >= startDate
    ? calcDays(startDate, endDate) : 0;
  const totalCost = days > 0 ? days * car.ratePerDay : 0;

  const isAvailable = startDate && endDate && endDate >= startDate
    ? !allBookings.some(b =>
        b.carId === car.id &&
        b.status !== "rejected" &&
        b.status !== "completed" &&
        datesOverlap(startDate, endDate, b.startDate, b.endDate)
      )
    : null; // null = not checked yet

  async function handleConfirm() {
    if (!startDate || !endDate || !isAvailable || days <= 0) return;
    setBookingState("submitting");
    setBookingError("");
    try {
      await onBook(car, startDate, endDate);
      setBookingState("success");
    } catch (err) {
      console.error(err);
      setBookingError("Failed to create booking. Please try again.");
      setBookingState("idle");
    }
  }

  async function handleToggleSave() {
    setSavingToggle(true);
    try { await onToggleSave(car); }
    finally { setSavingToggle(false); }
  }

  // ── Success state ──────────────────────────────────────
  if (bookingState === "success") {
    return (
      <div className={styles.detailPanel}>
        <div className={styles.bookingSuccess}>
          <div className={styles.bookingSuccessIcon}>🎉</div>
          <h3 className={styles.bookingSuccessTitle}>Booking Requested!</h3>
          <p className={styles.bookingSuccessText}>
            Your booking for <strong>{car.make} {car.model}</strong> from{" "}
            <strong>{startDate}</strong> to <strong>{endDate}</strong> is pending confirmation.
          </p>
          <p className={styles.bookingSuccessText}>
            Total: <strong>₱{totalCost.toLocaleString()}</strong>
          </p>
          <button
            className={styles.bookCarBtn}
            onClick={() => { setBookingState("idle"); setView("details"); setStartDate(""); setEndDate(""); }}
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.detailPanel}>
      {/* ── Header ── */}
      <div className={styles.detailHeader}>
        <div>
          <div className={styles.detailCarName}>{car.make} {car.model}</div>
          <span className={styles.detailYear}>{car.year}</span>
        </div>
        <div className={styles.detailHeaderActions}>
          <button
            className={`${styles.saveCarBtn} ${isSaved ? styles.saveCarBtnSaved : ""}`}
            onClick={handleToggleSave}
            disabled={savingToggle}
            title={isSaved ? "Remove from saved" : "Save this car"}
          >
            {isSaved ? "❤️" : "🤍"}
          </button>
          <button className={styles.detailClose} onClick={onClose}>✕</button>
        </div>
      </div>

      {/* ── Thumbnail ── */}
      <div className={styles.detailThumb}>🚗</div>

      {/* ── Status ── */}
      <div className={booked ? styles.detailStatusBooked : styles.detailStatusAvail}>
        <span className={styles.detailStatusDot} />
        {booked ? "Currently Booked" : "Available Now"}
      </div>

      {/* ── Rate ── */}
      <div className={styles.detailRate}>
        ₱{car.ratePerDay.toLocaleString()}<span>/day</span>
      </div>

      {view === "details" ? (
        <>
          {/* ── Car specs ── */}
          <div className={styles.detailSection}>
            <div className={styles.detailSectionTitle}>Car Details</div>
            <div className={styles.detailGrid}>
              <div className={styles.detailItem}>
                <span className={styles.detailKey}>Plate</span>
                <span className={styles.detailVal}>{car.plate || "—"}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailKey}>Color</span>
                <span className={styles.detailVal}>{car.color || "—"}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailKey}>Fuel</span>
                <span className={styles.detailVal}>{car.fuelType}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailKey}>Transmission</span>
                <span className={styles.detailVal}>{car.transmission}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailKey}>Seats</span>
                <span className={styles.detailVal}>{car.seats}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailKey}>Year</span>
                <span className={styles.detailVal}>{car.year}</span>
              </div>
            </div>
          </div>

          {/* ── Driver info ── */}
          <div className={styles.detailSection}>
            <div className={styles.detailSectionTitle}>Driver Info</div>
            <div className={styles.detailDriverCard}>
              <div className={styles.detailDriverAvatar}>👤</div>
              <div>
                <div className={styles.detailDriverName}>{car.driverName || "Driver"}</div>
                <div className={styles.detailDriverRole}>✅ Verified Driver</div>
              </div>
            </div>
            {car.location && (
              <div className={styles.detailLocation}>📍 {car.location}</div>
            )}
          </div>

          <button
            className={styles.bookCarBtn}
            onClick={() => { setView("booking"); setStartDate(""); setEndDate(""); }}
          >
            {booked ? "Check Availability" : "Book This Car"}
          </button>
        </>
      ) : (
        /* ── Booking form ── */
        <div className={styles.bookingFormWrap}>
          <div className={styles.bookingFormHeader}>
            <button className={styles.backBtn} onClick={() => setView("details")}>← Back</button>
            <span className={styles.bookingFormTitle}>Reserve This Car</span>
          </div>

          <div className={styles.bookingDateGrid}>
            <div className={styles.bookingDateGroup}>
              <label className={styles.bookingDateLabel}>Pickup Date</label>
              <input
                type="date"
                className={styles.bookingDateInput}
                min={todayStr}
                value={startDate}
                onChange={e => {
                  setStartDate(e.target.value);
                  if (endDate && e.target.value > endDate) setEndDate("");
                }}
              />
            </div>
            <div className={styles.bookingDateGroup}>
              <label className={styles.bookingDateLabel}>Return Date</label>
              <input
                type="date"
                className={styles.bookingDateInput}
                min={startDate || todayStr}
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
              />
            </div>
          </div>

          {/* Availability check */}
          {bookingState === "idle" && startDate && endDate && endDate >= startDate && (
            <div className={isAvailable ? styles.availSuccess : styles.availError}>
              {isAvailable
                ? `✅ Available for your selected dates`
                : `❌ Car is already booked during these dates`}
            </div>
          )}
          {bookingState === "idle" && startDate && endDate && endDate < startDate && (
            <div className={styles.availError}>Return date must be after pickup date.</div>
          )}

          {/* Cost summary */}
          {days > 0 && isAvailable && (
            <div className={styles.bookingCostBox}>
              <div className={styles.bookingCostRow}>
                <span>Rate</span>
                <span>₱{car.ratePerDay.toLocaleString()} / day</span>
              </div>
              <div className={styles.bookingCostRow}>
                <span>Duration</span>
                <span>{days} day{days !== 1 ? "s" : ""}</span>
              </div>
              <div className={`${styles.bookingCostRow} ${styles.bookingCostTotal}`}>
                <span>Total</span>
                <span>₱{totalCost.toLocaleString()}</span>
              </div>
            </div>
          )}

          {bookingError && <div className={styles.availError}>{bookingError}</div>}

          <button
            className={styles.bookCarBtn}
            onClick={handleConfirm}
            disabled={!isAvailable || days <= 0 || bookingState === "submitting" || !user}
          >
            {bookingState === "submitting" ? "Booking…" : "Confirm Booking"}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────
interface Props {
  cars: Car[];
  allBookings: Booking[];
  savedCars: SavedCar[];
  carsLoading: boolean;
  user: User | null;
  initialSelectedCar?: Car | null;
  onSavedCarsChange: () => void; // trigger refetch in parent
}

export default function BrowseCarsPage({
  cars, allBookings, savedCars, carsLoading, user, initialSelectedCar,
}: Props) {
  const todayStr = new Date().toISOString().slice(0, 10);

  const [selectedCar, setSelectedCar] = useState<Car | null>(initialSelectedCar ?? null);
  const [search, setSearch]           = useState("");
  const [filterFuel, setFilterFuel]   = useState("All");
  const [filterTrans, setFilterTrans] = useState("All");

  const isBooked = (carId: string) =>
    allBookings.some(b =>
      b.carId === carId &&
      b.startDate <= todayStr && b.endDate >= todayStr &&
      b.status !== "rejected" && b.status !== "completed"
    );

  const isSaved    = (carId: string) => savedCars.some(s => s.carId === carId);
  const savedDocId = (carId: string) => savedCars.find(s => s.carId === carId)?.id;

  const filtered = cars.filter(car => {
    const q = search.toLowerCase();
    const matchSearch = !q
      || car.make.toLowerCase().includes(q)
      || car.model.toLowerCase().includes(q)
      || (car.color ?? "").toLowerCase().includes(q)
      || (car.location ?? "").toLowerCase().includes(q)
      || (car.driverName ?? "").toLowerCase().includes(q);
    const matchFuel  = filterFuel  === "All" || car.fuelType    === filterFuel;
    const matchTrans = filterTrans === "All" || car.transmission === filterTrans;
    return matchSearch && matchFuel && matchTrans;
  });

  const availableCount = filtered.filter(c => !isBooked(c.id)).length;

  async function handleBook(car: Car, startDate: string, endDate: string) {
    if (!user) throw new Error("Not logged in");
    const days      = calcDays(startDate, endDate);
    const totalCost = days * car.ratePerDay;
    await addDoc(collection(db, "bookings"), {
      carId:         car.id,
      customerId:    user.uid,
      customer:      user.displayName || user.email || "Customer",
      customerEmail: user.email ?? "",
      startDate,
      endDate,
      status:        "pending",
      totalCost,
      carMake:       car.make,
      carModel:      car.model,
      carPlate:      car.plate,
      carYear:       car.year,
      driverUid:     car.driverUid,
      createdAt:     serverTimestamp(),
    });
  }

  async function handleToggleSave(car: Car) {
    if (!user) return;
    try {
      if (isSaved(car.id)) {
        const docId = savedDocId(car.id);
        if (docId) await deleteDoc(doc(db, "savedCars", docId));
      } else {
        await addDoc(collection(db, "savedCars"), {
          userId:  user.uid,
          carId:   car.id,
          savedAt: serverTimestamp(),
        });
      }
    } catch (err) {
      console.error("Save toggle failed:", err);
    }
  }

  return (
    <div>
      {/* Header */}
      <div className={styles.browseHeader}>
        <div>
          <h1 className={styles.browseTitle}>Browse Cars</h1>
          <p className={styles.browseSub}>
            {carsLoading
              ? "Loading cars…"
              : `${availableCount} car${availableCount !== 1 ? "s" : ""} available · ${filtered.length} total`}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className={styles.filterBar}>
        <div className={styles.searchWrap}>
          <span className={styles.searchIcon}>🔍</span>
          <input
            className={styles.searchInput}
            placeholder="Search by make, model, color, location, driver…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button className={styles.searchClear} onClick={() => setSearch("")}>✕</button>
          )}
        </div>
        <div className={styles.filterGroup}>
          <select className={styles.filterSelect} value={filterFuel}
            onChange={e => setFilterFuel(e.target.value)}>
            <option value="All">All Fuels</option>
            <option>Gasoline</option>
            <option>Diesel</option>
            <option>Electric</option>
            <option>Hybrid</option>
          </select>
          <select className={styles.filterSelect} value={filterTrans}
            onChange={e => setFilterTrans(e.target.value)}>
            <option value="All">All Transmissions</option>
            <option>Automatic</option>
            <option>Manual</option>
            <option>CVT</option>
          </select>
        </div>
      </div>

      {/* Layout: list + sticky panel */}
      <div className={styles.browseLayout}>
        <div className={styles.browseList}>
          {carsLoading ? (
            <div className={styles.browseEmpty}>
              <div className={styles.browseEmptyIcon}>⏳</div>
              <div className={styles.browseEmptyTitle}>Loading cars…</div>
            </div>
          ) : filtered.length === 0 ? (
            <div className={styles.browseEmpty}>
              <div className={styles.browseEmptyIcon}>🔍</div>
              <div className={styles.browseEmptyTitle}>No cars found</div>
              <div className={styles.browseEmptyText}>Try adjusting your filters.</div>
            </div>
          ) : (
            filtered.map(car => {
              const booked   = isBooked(car.id);
              const selected = selectedCar?.id === car.id;
              const saved    = isSaved(car.id);

              return (
                <div
                  key={car.id}
                  className={`${styles.browseCard} ${selected ? styles.browseCardSelected : ""}`}
                  onClick={() => setSelectedCar(selected ? null : car)}
                >
                  <div className={styles.browseCardThumb}>🚗</div>
                  <div className={styles.browseCardBody}>
                    <div className={styles.browseCardTop}>
                      <div>
                        <div className={styles.browseCardName}>{car.make} {car.model}</div>
                        <div className={styles.browseCardSubRow}>
                          <span className={styles.browseCardYear}>{car.year}</span>
                          <span className={styles.browseCardPlate}>{car.plate}</span>
                        </div>
                      </div>
                      <div className={booked ? styles.browseCardBooked : styles.browseCardAvail}>
                        <span className={styles.statusDotTiny} />
                        {booked ? "Booked" : "Available"}
                      </div>
                    </div>

                    <div className={styles.browseCardSpecs}>
                      <span>⛽ {car.fuelType}</span>
                      <span>⚙️ {car.transmission}</span>
                      <span>💺 {car.seats} seats</span>
                      {car.color && <span>🎨 {car.color}</span>}
                    </div>

                    <div className={styles.browseCardDriver}>
                      <span className={styles.browseCardDriverName}>
                        👤 {car.driverName || "Driver"}
                      </span>
                      {car.location && (
                        <span className={styles.browseCardDriverLoc}>📍 {car.location}</span>
                      )}
                    </div>

                    <div className={styles.browseCardFooter}>
                      <div className={styles.browseCardRate}>
                        ₱{car.ratePerDay.toLocaleString()}<span>/day</span>
                      </div>
                      <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
                        <button
                          className={`${styles.saveCarBtnSmall} ${saved ? styles.saveCarBtnSmallSaved : ""}`}
                          onClick={async e => { e.stopPropagation(); await handleToggleSave(car); }}
                          title={saved ? "Remove from saved" : "Save car"}
                        >
                          {saved ? "❤️" : "🤍"}
                        </button>
                        <button
                          className={`${styles.browseCardBtn} ${selected ? styles.browseCardBtnActive : ""}`}
                          onClick={e => { e.stopPropagation(); setSelectedCar(selected ? null : car); }}
                        >
                          {selected ? "Hide Details" : "View Details"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Detail panel */}
        <div className={styles.detailPanelWrap}>
          {selectedCar ? (
            <CarDetailPanel
              car={selectedCar}
              booked={isBooked(selectedCar.id)}
              onClose={() => setSelectedCar(null)}
              allBookings={allBookings}
              user={user}
              onBook={handleBook}
              isSaved={isSaved(selectedCar.id)}
              onToggleSave={handleToggleSave}
            />
          ) : (
            <div className={styles.detailPlaceholder}>
              <div className={styles.detailPlaceholderIcon}>🚗</div>
              <div className={styles.detailPlaceholderText}>
                Select a car to view details and book
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
