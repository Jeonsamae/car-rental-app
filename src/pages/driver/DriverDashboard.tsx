import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  collection, query, where,
  onSnapshot, addDoc, deleteDoc,
  doc, serverTimestamp,
} from "firebase/firestore";
import { db } from "../../firebase";
import { useAuth } from "../../context/AuthContext";
import DashboardShell from "../../components/DashboardShell";
import styles from "./DriverDashboard.module.css";

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
  location: string;
  driverName?: string;
}

interface Booking {
  id: string;
  carId: string;
  customer: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  status: "confirmed" | "pending";
}

// ── Nav ────────────────────────────────────────────────────
const NAV: { icon: string; label: string; key: string }[] = [
  { icon: "🏠", label: "My Schedule", key: "schedule" },
  { icon: "🚗", label: "My Cars",     key: "cars"     },
  { icon: "📍", label: "Trip History",key: "history"  },
  // { icon: "👤", label: "Profile",     key: "profile"  },
];

// ── Schedule data ──────────────────────────────────────────
const SCHEDULE = [
  { time: "08:00 AM", customer: "Juan dela Cruz",  car: "Toyota Camry",   location: "SM Mall of Asia",   type: "pickup" },
  { time: "10:30 AM", customer: "Maria Santos",    car: "Honda Civic",    location: "NAIA Terminal 1",   type: "return" },
  { time: "02:00 PM", customer: "Jose Reyes",      car: "Ford Ranger",    location: "BGC, Taguig",       type: "pickup" },
  { time: "05:00 PM", customer: "Ana Lim",          car: "Hyundai Tucson", location: "Greenbelt, Makati", type: "done"   },
];

function badgeClass(type: string, s: typeof styles) {
  if (type === "pickup") return `${s.badge} ${s.badgePickup}`;
  if (type === "return") return `${s.badge} ${s.badgeReturn}`;
  return `${s.badge} ${s.badgeDone}`;
}

function badgeLabel(type: string) {
  if (type === "pickup") return "Pickup";
  if (type === "return") return "Return";
  return "Done";
}


const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

const EMPTY_CAR: Omit<Car, "id"> = {
  make: "", model: "", year: new Date().getFullYear(),
  plate: "", color: "", fuelType: "Gasoline",
  transmission: "Automatic", seats: 5, ratePerDay: 0,
  location: "",
};

// ── Calendar Component ─────────────────────────────────────
function CarCalendar({ carId, bookings }: { carId: string; bookings: Booking[] }) {
  const today = new Date();
  const [view, setView] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

  const yr = view.getFullYear();
  const mo = view.getMonth();
  const firstDow   = new Date(yr, mo, 1).getDay();
  const daysInMo   = new Date(yr, mo + 1, 0).getDate();
  const carBkgs    = bookings.filter(b => b.carId === carId);

  function dayStatus(d: number) {
    const date = new Date(yr, mo, d);
    for (const b of carBkgs) {
      const s = new Date(b.startDate + "T00:00:00");
      const e = new Date(b.endDate   + "T23:59:59");
      if (date >= s && date <= e) return { booked: true as const, customer: b.customer, status: b.status };
    }
    return { booked: false as const, customer: undefined, status: undefined };
  }

  const isToday = (d: number) =>
    yr === today.getFullYear() && mo === today.getMonth() && d === today.getDate();

  const isPast = (d: number) =>
    new Date(yr, mo, d) < new Date(today.getFullYear(), today.getMonth(), today.getDate());

  return (
    <div className={styles.calendarPanel}>
      {/* Navigation */}
      <div className={styles.calNavRow}>
        <button className={styles.calArrow} onClick={() => setView(new Date(yr, mo - 1, 1))}>‹</button>
        <span className={styles.calPeriod}>{MONTHS[mo]} {yr}</span>
        <button className={styles.calArrow} onClick={() => setView(new Date(yr, mo + 1, 1))}>›</button>
      </div>

      {/* Day-of-week headers */}
      <div className={styles.calDayNames}>
        {["Su","Mo","Tu","We","Th","Fr","Sa"].map(n => (
          <div key={n} className={styles.calDayName}>{n}</div>
        ))}
      </div>

      {/* Day cells */}
      <div className={styles.calGrid}>
        {Array.from({ length: firstDow }, (_, i) => (
          <div key={`e${i}`} />
        ))}
        {Array.from({ length: daysInMo }, (_, i) => {
          const d = i + 1;
          const { booked, customer, status } = dayStatus(d);
          const past   = isPast(d);
          const today_ = isToday(d);

          const cls = [
            styles.calCell,
            booked ? styles.calCellBooked : past ? styles.calCellPast : styles.calCellAvail,
            today_ ? styles.calCellToday : "",
          ].filter(Boolean).join(" ");

          const tooltip = booked
            ? `${status === "pending" ? "⏳ Pending" : "✅ Confirmed"}: ${customer}`
            : undefined;

          return (
            <div key={d} className={cls} title={tooltip}>
              <span>{d}</span>
              {booked && <span className={styles.calDot} />}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className={styles.calLegend}>
        <span className={styles.calLegItem}>
          <span className={`${styles.calLegDot} ${styles.calLegAvail}`} /> Available
        </span>
        <span className={styles.calLegItem}>
          <span className={`${styles.calLegDot} ${styles.calLegBooked}`} /> Booked
        </span>
        <span className={styles.calLegItem}>
          <span className={`${styles.calLegDot} ${styles.calLegToday}`} /> Today
        </span>
      </div>
    </div>
  );
}

// ── Car Card Component ─────────────────────────────────────
function CarCard({
  car,
  bookings,
  onDelete,
}: {
  car: Car;
  bookings: Booking[];
  onDelete: (id: string) => void;
}) {
  const [showCal, setShowCal] = useState(false);
  const todayStr = new Date().toISOString().slice(0, 10);
  const currentlyBooked = bookings.some(
    b => b.carId === car.id && b.startDate <= todayStr && b.endDate >= todayStr
  );

  return (
    <div className={styles.carEntry}>
      <div className={styles.carRow}>
        {/* Emoji thumbnail */}
        <div className={styles.carEmoji}>🚗</div>

        {/* Main info */}
        <div className={styles.carInfo}>
          <div className={styles.carName}>{car.make} {car.model}</div>
          <div className={styles.carSubRow}>
            <span className={styles.carYearBadge}>{car.year}</span>
            <span className={styles.carPlateBadge}>{car.plate}</span>
          </div>
          <div className={styles.carSpecs}>
            {car.color} · {car.fuelType} · {car.seats} seats · {car.transmission}
          </div>
        </div>

        {/* Rate & status */}
        <div className={styles.carRight}>
          <div className={styles.carRate}>
            ₱{car.ratePerDay.toLocaleString()}<span>/day</span>
          </div>
          <div className={currentlyBooked ? styles.carBooked : styles.carAvail}>
            <span className={styles.statusDotTiny} />
            {currentlyBooked ? "Booked" : "Available"}
          </div>
        </div>

        {/* Actions */}
        <div className={styles.carActions}>
          <button
            className={`${styles.btnCal} ${showCal ? styles.btnCalActive : ""}`}
            onClick={() => setShowCal(s => !s)}
          >
            📅 {showCal ? "Hide" : "Calendar"}
          </button>
          <button className={styles.btnDel} onClick={() => onDelete(car.id)}>🗑️ Remove</button>
        </div>
      </div>

      {/* Inline calendar */}
      {showCal && <CarCalendar carId={car.id} bookings={bookings} />}
    </div>
  );
}

// ── Main Dashboard ─────────────────────────────────────────
export default function DriverDashboard() {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const [activeNav, setActiveNav] = useState("schedule");

  // Cars & bookings — live from Firestore
  const [cars, setCars]         = useState<Car[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [carsLoading, setCarsLoading] = useState(true);
  const [saving, setSaving]     = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCar, setNewCar]     = useState<Omit<Car, "id">>(EMPTY_CAR);

  // ── Load driver's cars ──────────────────────────────────
  useEffect(() => {
    if (!user) return;
    setCarsLoading(true);
    const q = query(collection(db, "cars"), where("driverUid", "==", user.uid));
    const unsub = onSnapshot(q, snap => {
      setCars(snap.docs.map(d => ({ id: d.id, ...d.data() } as Car)));
      setCarsLoading(false);
    }, err => {
      console.error("cars snapshot error", err);
      setCarsLoading(false);
    });
    return unsub;
  }, [user]);

  // ── Load bookings for those cars ────────────────────────
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
  const activeLabel  = NAV.find(n => n.key === activeNav)?.label ?? "My Schedule";

  async function handleAddCar() {
    if (!newCar.make.trim() || !newCar.model.trim() || !newCar.plate.trim() || !user) return;
    setSaving(true);
    try {
      await addDoc(collection(db, "cars"), {
        ...newCar,
        driverUid: user.uid,
        driverName: user.displayName || user.email || "Driver",
        createdAt: serverTimestamp(),
      });
      setNewCar(EMPTY_CAR);
      setShowAddForm(false);
    } catch (err) {
      console.error("Error adding car:", err);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteCar(id: string) {
    try {
      await deleteDoc(doc(db, "cars", id));
    } catch (err) {
      console.error("Error deleting car:", err);
    }
  }

  return (
    <DashboardShell
      navItems={NAV}
      activeNav={activeNav}
      onNavChange={setActiveNav}
      onLogout={handleLogout}
      user={user}
      role={role}
      title={activeLabel}
    >

      {/* ── My Schedule ── */}
      {activeNav === "schedule" && (
        <>
          <div className={styles.pageHeader}>
            <h1 className={styles.greeting}>Good day, Driver 👋</h1>
            <p className={styles.subGreeting}>You have 3 trips scheduled for today.</p>
          </div>

          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={`${styles.statIcon} ${styles.statIconBlue}`}>📅</div>
              <div className={styles.statValue}>3</div>
              <div className={styles.statLabel}>Today's Trips</div>
              <div className={styles.statChange}>2 pickups · 1 return</div>
            </div>
            <div className={styles.statCard}>
              <div className={`${styles.statIcon} ${styles.statIconGreen}`}>✅</div>
              <div className={styles.statValue}>47</div>
              <div className={styles.statLabel}>Total Trips</div>
              <div className={styles.statChange}>↑ 5 this week</div>
            </div>
            <div className={styles.statCard}>
              <div className={`${styles.statIcon} ${styles.statIconOrange}`}>🛣️</div>
              <div className={styles.statValue}>1,240</div>
              <div className={styles.statLabel}>KM This Month</div>
              <div className={styles.statChange}>↑ 180 km vs last month</div>
            </div>
            <div className={styles.statCard}>
              <div className={`${styles.statIcon} ${styles.statIconTeal}`}>💵</div>
              <div className={styles.statValue}>₱8,500</div>
              <div className={styles.statLabel}>This Month's Pay</div>
              <div className={styles.statChange}>↑ ₱500 vs last month</div>
            </div>
          </div>

          <div className={styles.sectionGrid}>
            <div className={styles.panel}>
              <div className={styles.panelHeader}>
                <span className={styles.panelTitle}>Today's Schedule</span>
              </div>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Customer</th>
                    <th>Vehicle</th>
                    <th>Type</th>
                  </tr>
                </thead>
                <tbody>
                  {SCHEDULE.map((s, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 600 }}>{s.time}</td>
                      <td>
                        <div className={styles.customerName}>{s.customer}</div>
                        <div className={styles.location}>📍 {s.location}</div>
                      </td>
                      <td>{s.car}</td>
                      <td>
                        <span className={badgeClass(s.type, styles)}>
                          {badgeLabel(s.type)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className={styles.panel}>
              <div className={styles.panelHeader}>
                <span className={styles.panelTitle}>Currently Assigned</span>
              </div>
              <div className={styles.carCard}>
                <div className={styles.carPlaceholder}>🚗</div>
                <div>
                  <div className={styles.carTitle}>Toyota Camry 2023</div>
                  <div className={styles.carPlate}>ABC-1234</div>
                </div>
                <div className={styles.carMeta}>
                  <div className={styles.carMetaRow}>
                    <span className={styles.carMetaKey}>Fuel Level</span>
                    <span className={styles.carMetaVal}>78%</span>
                  </div>
                  <div className={styles.carMetaRow}>
                    <span className={styles.carMetaKey}>Odometer</span>
                    <span className={styles.carMetaVal}>24,310 km</span>
                  </div>
                  <div className={styles.carMetaRow}>
                    <span className={styles.carMetaKey}>Last Service</span>
                    <span className={styles.carMetaVal}>Jan 15, 2026</span>
                  </div>
                  <div className={styles.carMetaRow}>
                    <span className={styles.carMetaKey}>Color</span>
                    <span className={styles.carMetaVal}>Pearl White</span>
                  </div>
                </div>
                <div className={styles.statusPill}>
                  <div className={styles.statusDot} />
                  Active Assignment
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── My Cars ── */}
      {activeNav === "cars" && (
        <div>
          {/* Page header */}
          <div className={styles.mgrHeader}>
            <div>
              <h1 className={styles.mgrTitle}>My Cars</h1>
              <p className={styles.mgrSub}>
                {cars.length} vehicle{cars.length !== 1 ? "s" : ""} in your fleet · Click a car's calendar to see bookings
              </p>
            </div>
            <button
              className={styles.addBtn}
              onClick={() => { setShowAddForm(s => !s); setNewCar(EMPTY_CAR); }}
            >
              {showAddForm ? "✕ Cancel" : "+ Add Car"}
            </button>
          </div>

          {/* Add car form */}
          {showAddForm && (
            <div className={styles.addForm}>
              <h3 className={styles.addFormTitle}>New Car Details</h3>
              <div className={styles.addFormGrid}>
                <div className={styles.addFormGroup}>
                  <label className={styles.addFormLabel}>Make</label>
                  <input
                    className={styles.addFormInput}
                    placeholder="Toyota"
                    value={newCar.make}
                    onChange={e => setNewCar(c => ({ ...c, make: e.target.value }))}
                  />
                </div>
                <div className={styles.addFormGroup}>
                  <label className={styles.addFormLabel}>Model</label>
                  <input
                    className={styles.addFormInput}
                    placeholder="Camry"
                    value={newCar.model}
                    onChange={e => setNewCar(c => ({ ...c, model: e.target.value }))}
                  />
                </div>
                <div className={styles.addFormGroup}>
                  <label className={styles.addFormLabel}>Year</label>
                  <input
                    className={styles.addFormInput}
                    type="number"
                    placeholder="2024"
                    value={newCar.year || ""}
                    onChange={e => setNewCar(c => ({ ...c, year: +e.target.value }))}
                  />
                </div>
                <div className={styles.addFormGroup}>
                  <label className={styles.addFormLabel}>Plate Number</label>
                  <input
                    className={styles.addFormInput}
                    placeholder="ABC-1234"
                    value={newCar.plate}
                    onChange={e => setNewCar(c => ({ ...c, plate: e.target.value }))}
                  />
                </div>
                <div className={styles.addFormGroup}>
                  <label className={styles.addFormLabel}>Color</label>
                  <input
                    className={styles.addFormInput}
                    placeholder="Pearl White"
                    value={newCar.color}
                    onChange={e => setNewCar(c => ({ ...c, color: e.target.value }))}
                  />
                </div>
                <div className={styles.addFormGroup}>
                  <label className={styles.addFormLabel}>Fuel Type</label>
                  <select
                    className={styles.addFormSelect}
                    value={newCar.fuelType}
                    onChange={e => setNewCar(c => ({ ...c, fuelType: e.target.value }))}
                  >
                    <option>Gasoline</option>
                    <option>Diesel</option>
                    <option>Electric</option>
                    <option>Hybrid</option>
                  </select>
                </div>
                <div className={styles.addFormGroup}>
                  <label className={styles.addFormLabel}>Transmission</label>
                  <select
                    className={styles.addFormSelect}
                    value={newCar.transmission}
                    onChange={e => setNewCar(c => ({ ...c, transmission: e.target.value }))}
                  >
                    <option>Automatic</option>
                    <option>Manual</option>
                    <option>CVT</option>
                  </select>
                </div>
                <div className={styles.addFormGroup}>
                  <label className={styles.addFormLabel}>Seats</label>
                  <select
                    className={styles.addFormSelect}
                    value={newCar.seats}
                    onChange={e => setNewCar(c => ({ ...c, seats: +e.target.value }))}
                  >
                    <option value={2}>2</option>
                    <option value={4}>4</option>
                    <option value={5}>5</option>
                    <option value={7}>7</option>
                    <option value={8}>8</option>
                  </select>
                </div>
                <div className={styles.addFormGroup}>
                  <label className={styles.addFormLabel}>Rate per Day (₱)</label>
                  <input
                    className={styles.addFormInput}
                    type="number"
                    placeholder="2500"
                    value={newCar.ratePerDay || ""}
                    onChange={e => setNewCar(c => ({ ...c, ratePerDay: +e.target.value }))}
                  />
                </div>
                <div className={styles.addFormGroup}>
                  <label className={styles.addFormLabel}>Pickup Location</label>
                  <input
                    className={styles.addFormInput}
                    placeholder="e.g. Makati City"
                    value={newCar.location}
                    onChange={e => setNewCar(c => ({ ...c, location: e.target.value }))}
                  />
                </div>
              </div>
              <div className={styles.addFormFooter}>
                <button
                  className={styles.btnCancel}
                  onClick={() => { setShowAddForm(false); setNewCar(EMPTY_CAR); }}
                >
                  Cancel
                </button>
                <button className={styles.btnSave} onClick={handleAddCar} disabled={saving}>
                  {saving ? "Saving…" : "Add Car"}
                </button>
              </div>
            </div>
          )}

          {/* Cars list */}
          {carsLoading ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyEmoji}>⏳</div>
              <div className={styles.emptyTitle}>Loading your fleet…</div>
            </div>
          ) : cars.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyEmoji}>🚗</div>
              <div className={styles.emptyTitle}>No cars yet</div>
              <div className={styles.emptyText}>
                Click "+ Add Car" above to add your first vehicle to the fleet.
              </div>
            </div>
          ) : (
            <div className={styles.carList}>
              {cars.map(car => (
                <CarCard
                  key={car.id}
                  car={car}
                  bookings={bookings}
                  onDelete={handleDeleteCar}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Trip History (placeholder) ── */}
      {activeNav === "history" && (
        <div className={styles.pageHeader}>
          <h1 className={styles.greeting}>Trip History</h1>
          <p className={styles.subGreeting}>Your complete trip history will appear here.</p>
        </div>
      )}

      {/* ── Profile (placeholder) ── */}
      {activeNav === "profile" && (
        <div className={styles.pageHeader}>
          <h1 className={styles.greeting}>Profile</h1>
          <p className={styles.subGreeting}>Manage your profile and account settings.</p>
        </div>
      )}
    </DashboardShell>
  );
}
