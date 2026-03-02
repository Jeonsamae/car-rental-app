import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../../firebase";
import { useAuth } from "../../context/AuthContext";
import DashboardShell from "../../components/DashboardShell";
import styles from "./CustomerDashboard.module.css";

// ── Types ──────────────────────────────────────────────────
interface Car {
  id: string;
  make: string;
  model: string;
  year: number;
  plate: string;
  color: string;
  fuelType: string;
  transmission: string;
  seats: number;
  ratePerDay: number;
  driverUid: string;
  driverName: string;
  location: string;
}

interface Booking {
  id: string;
  carId: string;
  startDate: string;
  endDate: string;
  status: "confirmed" | "pending";
}

// ── Nav ────────────────────────────────────────────────────
const NAV: { icon: string; label: string; key: string }[] = [
  { icon: "🏠", label: "Home",        key: "home"    },
  { icon: "🚗", label: "Browse Cars", key: "browse"  },
  { icon: "📋", label: "My Rentals",  key: "rentals" },
  { icon: "❤️", label: "Saved Cars",  key: "saved"   },
];

// ── Car Detail Panel ───────────────────────────────────────
function CarDetailPanel({
  car,
  booked,
  onClose,
}: {
  car: Car;
  booked: boolean;
  onClose: () => void;
}) {
  return (
    <div className={styles.detailPanel}>
      {/* Header */}
      <div className={styles.detailHeader}>
        <div>
          <div className={styles.detailCarName}>{car.make} {car.model}</div>
          <span className={styles.detailYear}>{car.year}</span>
        </div>
        <button className={styles.detailClose} onClick={onClose}>✕</button>
      </div>

      {/* Thumbnail */}
      <div className={styles.detailThumb}>🚗</div>

      {/* Availability */}
      <div className={booked ? styles.detailStatusBooked : styles.detailStatusAvail}>
        <span className={styles.detailStatusDot} />
        {booked ? "Currently Booked" : "Available Now"}
      </div>

      {/* Rate */}
      <div className={styles.detailRate}>
        ₱{car.ratePerDay.toLocaleString()}<span>/day</span>
      </div>

      {/* Car specs */}
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
            <span className={styles.detailKey}>Fuel Type</span>
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

      {/* Driver info */}
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

      {/* CTA */}
      <button className={styles.bookCarBtn} disabled={booked}>
        {booked ? "Not Available" : "Book This Car"}
      </button>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────
export default function CustomerDashboard() {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const [activeNav, setActiveNav] = useState("home");

  // Firestore data
  const [cars, setCars]         = useState<Car[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [carsLoading, setCarsLoading] = useState(true);

  // Browse Cars UI state
  const [selectedCar, setSelectedCar] = useState<Car | null>(null);
  const [search, setSearch]           = useState("");
  const [filterFuel, setFilterFuel]   = useState("All");
  const [filterTrans, setFilterTrans] = useState("All");

  // ── Load all cars ─────────────────────────────────────────
  useEffect(() => {
    setCarsLoading(true);
    const unsub = onSnapshot(collection(db, "cars"), snap => {
      setCars(snap.docs.map(d => ({ id: d.id, ...d.data() } as Car)));
      setCarsLoading(false);
    }, err => {
      console.error("cars snapshot error", err);
      setCarsLoading(false);
    });
    return unsub;
  }, []);

  // ── Load bookings for visible cars ────────────────────────
  useEffect(() => {
    if (cars.length === 0) { setBookings([]); return; }
    const ids = cars.map(c => c.id);
    const q = query(collection(db, "bookings"), where("carId", "in", ids.slice(0, 30)));
    const unsub = onSnapshot(q, snap => {
      setBookings(snap.docs.map(d => ({ id: d.id, ...d.data() } as Booking)));
    }, err => { console.error("bookings snapshot error", err); });
    return unsub;
  }, [cars]);

  const handleLogout = async () => { await logout(); navigate("/"); };
  const activeLabel  = NAV.find(n => n.key === activeNav)?.label ?? "Home";
  const firstName    = user?.displayName?.split(" ")[0] ?? user?.email?.split("@")[0] ?? "there";
  const todayStr     = new Date().toISOString().slice(0, 10);

  const isBooked = (carId: string) =>
    bookings.some(b => b.carId === carId && b.startDate <= todayStr && b.endDate >= todayStr);

  // ── Filter logic ──────────────────────────────────────────
  const filtered = cars.filter(car => {
    const q = search.toLowerCase();
    const matchSearch = !q
      || car.make.toLowerCase().includes(q)
      || car.model.toLowerCase().includes(q)
      || (car.color     ?? "").toLowerCase().includes(q)
      || (car.location  ?? "").toLowerCase().includes(q)
      || (car.driverName?? "").toLowerCase().includes(q);
    const matchFuel  = filterFuel  === "All" || car.fuelType     === filterFuel;
    const matchTrans = filterTrans === "All" || car.transmission  === filterTrans;
    return matchSearch && matchFuel && matchTrans;
  });

  const availableCount = filtered.filter(c => !isBooked(c.id)).length;

  function handleNavChange(key: string) {
    setActiveNav(key);
    setSelectedCar(null);
    setSearch("");
    setFilterFuel("All");
    setFilterTrans("All");
  }

  return (
    <DashboardShell
      navItems={NAV}
      activeNav={activeNav}
      onNavChange={handleNavChange}
      onLogout={handleLogout}
      user={user}
      role={role}
      title={activeLabel}
    >

      {/* ── Home ── */}
      {activeNav === "home" && (
        <>
          <div className={styles.pageHeader}>
            <h1 className={styles.greeting}>Welcome back, {firstName} 👋</h1>
            <p className={styles.subGreeting}>Find your perfect ride for today.</p>
          </div>

          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={`${styles.statIcon} ${styles.statIconGreen}`}>🚗</div>
              <div className={styles.statValue}>1</div>
              <div className={styles.statLabel}>Active Rental</div>
              <div className={styles.statSub}>Returns Feb 28</div>
            </div>
            <div className={styles.statCard}>
              <div className={`${styles.statIcon} ${styles.statIconBlue}`}>✅</div>
              <div className={styles.statValue}>8</div>
              <div className={styles.statLabel}>Completed Trips</div>
              <div className={styles.statSub}>Since Jan 2025</div>
            </div>
            <div className={styles.statCard}>
              <div className={`${styles.statIcon} ${styles.statIconOrange}`}>❤️</div>
              <div className={styles.statValue}>3</div>
              <div className={styles.statLabel}>Saved Cars</div>
              <div className={styles.statSub}>In your wishlist</div>
            </div>
            <div className={styles.statCard}>
              <div className={`${styles.statIcon} ${styles.statIconYellow}`}>⭐</div>
              <div className={styles.statValue}>450</div>
              <div className={styles.statLabel}>Loyalty Points</div>
              <div className={styles.statSub}>≈ ₱450 discount</div>
            </div>
          </div>

          <div className={styles.sectionGrid}>
            {/* Quick car preview */}
            <div className={styles.panel}>
              <div className={styles.panelHeader}>
                <span className={styles.panelTitle}>Available Cars</span>
                <button className={styles.bookBtn} onClick={() => setActiveNav("browse")}>
                  Browse All →
                </button>
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
                      onClick={() => { setActiveNav("browse"); setSelectedCar(car); }}
                    >
                      <div className={styles.carThumb}>🚗</div>
                      <div className={styles.carInfo}>
                        <div className={styles.carName}>{car.make} {car.model}</div>
                        <div className={styles.carType}>
                          {car.fuelType} · {car.seats} seats
                        </div>
                        <div className={styles.carFooter}>
                          <span className={styles.carRate}>
                            ₱{car.ratePerDay.toLocaleString()}/day
                          </span>
                          <button
                            className={styles.carBookBtn}
                            onClick={e => { e.stopPropagation(); setActiveNav("browse"); setSelectedCar(car); }}
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

            {/* Active booking */}
            <div className={styles.panel}>
              <div className={styles.panelHeader}>
                <span className={styles.panelTitle}>Active Booking</span>
              </div>
              <div className={styles.bookingCard}>
                <div className={styles.bookingVehicle}>🚗</div>
                <div className={styles.bookingCarName}>Toyota Camry 2023</div>
                <div className={styles.activePill}>
                  <div className={styles.activeDot} /> Active
                </div>
                <div className={styles.bookingMeta}>
                  <div className={styles.bookingRow}>
                    <span className={styles.bookingKey}>Plate No.</span>
                    <span className={styles.bookingVal}>ABC-1234</span>
                  </div>
                  <div className={styles.bookingRow}>
                    <span className={styles.bookingKey}>Pickup</span>
                    <span className={styles.bookingVal}>Feb 24, 2026</span>
                  </div>
                  <div className={styles.bookingRow}>
                    <span className={styles.bookingKey}>Return</span>
                    <span className={styles.bookingVal}>Feb 28, 2026</span>
                  </div>
                  <div className={styles.bookingRow}>
                    <span className={styles.bookingKey}>Total</span>
                    <span className={styles.bookingVal}>₱12,500</span>
                  </div>
                  <div className={styles.bookingRow}>
                    <span className={styles.bookingKey}>Driver</span>
                    <span className={styles.bookingVal}>Juan dela Cruz</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Browse Cars ── */}
      {activeNav === "browse" && (
        <div>
          {/* Page header */}
          <div className={styles.browseHeader}>
            <div>
              <h1 className={styles.browseTitle}>Browse Cars</h1>
              <p className={styles.browseSub}>
                {carsLoading
                  ? "Loading cars…"
                  : `${availableCount} car${availableCount !== 1 ? "s" : ""} available now · ${filtered.length} total listed`}
              </p>
            </div>
          </div>

          {/* Search + Filters */}
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
              <select
                className={styles.filterSelect}
                value={filterFuel}
                onChange={e => setFilterFuel(e.target.value)}
              >
                <option value="All">All Fuels</option>
                <option>Gasoline</option>
                <option>Diesel</option>
                <option>Electric</option>
                <option>Hybrid</option>
              </select>
              <select
                className={styles.filterSelect}
                value={filterTrans}
                onChange={e => setFilterTrans(e.target.value)}
              >
                <option value="All">All Transmissions</option>
                <option>Automatic</option>
                <option>Manual</option>
                <option>CVT</option>
              </select>
            </div>
          </div>

          {/* Grid + Detail Panel */}
          <div className={styles.browseLayout}>

            {/* Car list */}
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
                  <div className={styles.browseEmptyText}>
                    Try adjusting your filters or search term.
                  </div>
                </div>
              ) : (
                filtered.map(car => {
                  const booked   = isBooked(car.id);
                  const selected = selectedCar?.id === car.id;

                  return (
                    <div
                      key={car.id}
                      className={`${styles.browseCard} ${selected ? styles.browseCardSelected : ""}`}
                      onClick={() => setSelectedCar(selected ? null : car)}
                    >
                      {/* Thumbnail */}
                      <div className={styles.browseCardThumb}>🚗</div>

                      {/* Info */}
                      <div className={styles.browseCardBody}>
                        {/* Top row: name + status */}
                        <div className={styles.browseCardTop}>
                          <div>
                            <div className={styles.browseCardName}>
                              {car.make} {car.model}
                            </div>
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

                        {/* Specs chips */}
                        <div className={styles.browseCardSpecs}>
                          <span>⛽ {car.fuelType}</span>
                          <span>⚙️ {car.transmission}</span>
                          <span>💺 {car.seats} seats</span>
                          {car.color && <span>🎨 {car.color}</span>}
                        </div>

                        {/* Driver + location */}
                        <div className={styles.browseCardDriver}>
                          <span className={styles.browseCardDriverName}>
                            👤 {car.driverName || "Driver"}
                          </span>
                          {car.location && (
                            <span className={styles.browseCardDriverLoc}>
                              📍 {car.location}
                            </span>
                          )}
                        </div>

                        {/* Footer: rate + CTA */}
                        <div className={styles.browseCardFooter}>
                          <div className={styles.browseCardRate}>
                            ₱{car.ratePerDay.toLocaleString()}
                            <span>/day</span>
                          </div>
                          <button
                            className={`${styles.browseCardBtn} ${selected ? styles.browseCardBtnActive : ""}`}
                            onClick={e => { e.stopPropagation(); setSelectedCar(selected ? null : car); }}
                          >
                            {selected ? "Hide Details" : "View Details"}
                          </button>
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
                />
              ) : (
                <div className={styles.detailPlaceholder}>
                  <div className={styles.detailPlaceholderIcon}>🚗</div>
                  <div className={styles.detailPlaceholderText}>
                    Select a car to view full details
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── My Rentals (placeholder) ── */}
      {activeNav === "rentals" && (
        <div className={styles.pageHeader}>
          <h1 className={styles.greeting}>My Rentals</h1>
          <p className={styles.subGreeting}>Your rental history will appear here.</p>
        </div>
      )}

      {/* ── Saved Cars (placeholder) ── */}
      {activeNav === "saved" && (
        <div className={styles.pageHeader}>
          <h1 className={styles.greeting}>Saved Cars</h1>
          <p className={styles.subGreeting}>Your saved cars will appear here.</p>
        </div>
      )}
    </DashboardShell>
  );
}
