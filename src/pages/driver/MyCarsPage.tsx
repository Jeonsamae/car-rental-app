import { useState } from "react";
import {
  collection, addDoc, deleteDoc, updateDoc,
  doc, serverTimestamp,
} from "firebase/firestore";
import type { User } from "firebase/auth";
import { db } from "../../firebase";
import type { Car, Booking } from "./types";
import styles from "./DriverDashboard.module.css";

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

// ── Calendar ───────────────────────────────────────────────
function CarCalendar({ carId, bookings }: { carId: string; bookings: Booking[] }) {
  const today = new Date();
  const [view, setView] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

  const yr = view.getFullYear();
  const mo = view.getMonth();
  const firstDow = new Date(yr, mo, 1).getDay();
  const daysInMo = new Date(yr, mo + 1, 0).getDate();
  const carBkgs  = bookings.filter(b => b.carId === carId);

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
      <div className={styles.calNavRow}>
        <button className={styles.calArrow} onClick={() => setView(new Date(yr, mo - 1, 1))}>‹</button>
        <span className={styles.calPeriod}>{MONTHS[mo]} {yr}</span>
        <button className={styles.calArrow} onClick={() => setView(new Date(yr, mo + 1, 1))}>›</button>
      </div>
      <div className={styles.calDayNames}>
        {["Su","Mo","Tu","We","Th","Fr","Sa"].map(n => (
          <div key={n} className={styles.calDayName}>{n}</div>
        ))}
      </div>
      <div className={styles.calGrid}>
        {Array.from({ length: firstDow }, (_, i) => <div key={`e${i}`} />)}
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

// ── Car Card ───────────────────────────────────────────────
function CarCard({
  car, bookings, onDelete, onEdit,
  isEditing, editForm, onEditChange, onEditSave, onEditCancel, editSaving,
}: {
  car: Car;
  bookings: Booking[];
  onDelete: (id: string) => void;
  onEdit: (car: Car) => void;
  isEditing: boolean;
  editForm: Omit<Car, "id">;
  onEditChange: (field: keyof Omit<Car, "id">, value: string | number) => void;
  onEditSave: () => void;
  onEditCancel: () => void;
  editSaving: boolean;
}) {
  const [showCal, setShowCal] = useState(false);
  const todayStr = new Date().toISOString().slice(0, 10);
  const currentlyBooked = bookings.some(
    b => b.carId === car.id && b.startDate <= todayStr && b.endDate >= todayStr
  );

  return (
    <div className={styles.carEntry}>
      <div className={styles.carRow}>
        <div className={styles.carEmoji}>🚗</div>

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

        <div className={styles.carRight}>
          <div className={styles.carRate}>
            ₱{car.ratePerDay.toLocaleString()}<span>/day</span>
          </div>
          <div className={currentlyBooked ? styles.carBooked : styles.carAvail}>
            <span className={styles.statusDotTiny} />
            {currentlyBooked ? "Booked" : "Available"}
          </div>
        </div>

        <div className={styles.carActions}>
          <button
            className={`${styles.btnCal} ${showCal ? styles.btnCalActive : ""}`}
            onClick={() => setShowCal(s => !s)}
            disabled={isEditing}
          >
            📅 {showCal ? "Hide" : "Calendar"}
          </button>
          <button
            className={`${styles.btnEdit} ${isEditing ? styles.btnEditActive : ""}`}
            onClick={() => isEditing ? onEditCancel() : onEdit(car)}
          >
            {isEditing ? "✕ Cancel" : "✏️ Edit"}
          </button>
          <button
            className={styles.btnDel}
            onClick={() => onDelete(car.id)}
            disabled={isEditing}
          >
            🗑️ Remove
          </button>
        </div>
      </div>

      {/* Inline edit form */}
      {isEditing && (
        <div className={styles.inlineEditForm}>
          <h3 className={styles.addFormTitle}>Edit Car Details</h3>
          <div className={styles.addFormGrid}>
            <div className={styles.addFormGroup}>
              <label className={styles.addFormLabel}>Make</label>
              <input className={styles.addFormInput} value={editForm.make}
                onChange={e => onEditChange("make", e.target.value)} />
            </div>
            <div className={styles.addFormGroup}>
              <label className={styles.addFormLabel}>Model</label>
              <input className={styles.addFormInput} value={editForm.model}
                onChange={e => onEditChange("model", e.target.value)} />
            </div>
            <div className={styles.addFormGroup}>
              <label className={styles.addFormLabel}>Year</label>
              <input className={styles.addFormInput} type="number" value={editForm.year || ""}
                onChange={e => onEditChange("year", +e.target.value)} />
            </div>
            <div className={styles.addFormGroup}>
              <label className={styles.addFormLabel}>Plate Number</label>
              <input className={styles.addFormInput} value={editForm.plate}
                onChange={e => onEditChange("plate", e.target.value)} />
            </div>
            <div className={styles.addFormGroup}>
              <label className={styles.addFormLabel}>Color</label>
              <input className={styles.addFormInput} value={editForm.color}
                onChange={e => onEditChange("color", e.target.value)} />
            </div>
            <div className={styles.addFormGroup}>
              <label className={styles.addFormLabel}>Fuel Type</label>
              <select className={styles.addFormSelect} value={editForm.fuelType}
                onChange={e => onEditChange("fuelType", e.target.value)}>
                <option>Gasoline</option>
                <option>Diesel</option>
                <option>Electric</option>
                <option>Hybrid</option>
              </select>
            </div>
            <div className={styles.addFormGroup}>
              <label className={styles.addFormLabel}>Transmission</label>
              <select className={styles.addFormSelect} value={editForm.transmission}
                onChange={e => onEditChange("transmission", e.target.value)}>
                <option>Automatic</option>
                <option>Manual</option>
                <option>CVT</option>
              </select>
            </div>
            <div className={styles.addFormGroup}>
              <label className={styles.addFormLabel}>Seats</label>
              <select className={styles.addFormSelect} value={editForm.seats}
                onChange={e => onEditChange("seats", +e.target.value)}>
                <option value={2}>2</option>
                <option value={4}>4</option>
                <option value={5}>5</option>
                <option value={7}>7</option>
                <option value={8}>8</option>
              </select>
            </div>
            <div className={styles.addFormGroup}>
              <label className={styles.addFormLabel}>Rate per Day (₱)</label>
              <input className={styles.addFormInput} type="number" value={editForm.ratePerDay || ""}
                onChange={e => onEditChange("ratePerDay", +e.target.value)} />
            </div>
            <div className={styles.addFormGroup}>
              <label className={styles.addFormLabel}>Pickup Location</label>
              <input className={styles.addFormInput} value={editForm.location}
                onChange={e => onEditChange("location", e.target.value)} />
            </div>
          </div>
          <div className={styles.addFormFooter}>
            <button className={styles.btnCancel} onClick={onEditCancel}>Cancel</button>
            <button className={styles.btnSave} onClick={onEditSave} disabled={editSaving}>
              {editSaving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </div>
      )}

      {showCal && !isEditing && <CarCalendar carId={car.id} bookings={bookings} />}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────
interface Props {
  cars: Car[];
  bookings: Booking[];
  carsLoading: boolean;
  user: User | null;
}

export default function MyCarsPage({ cars, bookings, carsLoading, user }: Props) {
  const [saving, setSaving]           = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCar, setNewCar]           = useState<Omit<Car, "id">>(EMPTY_CAR);

  const [editingCarId, setEditingCarId] = useState<string | null>(null);
  const [editForm, setEditForm]         = useState<Omit<Car, "id">>(EMPTY_CAR);
  const [editSaving, setEditSaving]     = useState(false);

  async function handleAddCar() {
    if (!newCar.make.trim() || !newCar.model.trim() || !newCar.plate.trim() || !user) return;
    setSaving(true);
    try {
      await addDoc(collection(db, "cars"), {
        ...newCar,
        driverUid:  user.uid,
        driverName: user.displayName || user.email || "Driver",
        createdAt:  serverTimestamp(),
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

  function handleEditStart(car: Car) {
    const { id, ...rest } = car;
    setEditingCarId(id);
    setEditForm(rest);
    setShowAddForm(false);
  }

  function handleEditCancel() { setEditingCarId(null); }

  async function handleEditSave() {
    if (!editingCarId) return;
    setEditSaving(true);
    try {
      await updateDoc(doc(db, "cars", editingCarId), editForm as Record<string, unknown>);
      setEditingCarId(null);
    } catch (err) {
      console.error("Error updating car:", err);
    } finally {
      setEditSaving(false);
    }
  }

  function handleEditChange(field: keyof Omit<Car, "id">, value: string | number) {
    setEditForm(f => ({ ...f, [field]: value }));
  }

  return (
    <div>
      {/* Header */}
      <div className={styles.mgrHeader}>
        <div>
          <h1 className={styles.mgrTitle}>My Cars</h1>
          <p className={styles.mgrSub}>
            {cars.length} vehicle{cars.length !== 1 ? "s" : ""} in your fleet · Click a car's calendar to see bookings
          </p>
        </div>
        <button
          className={styles.addBtn}
          onClick={() => { setShowAddForm(s => !s); setNewCar(EMPTY_CAR); setEditingCarId(null); }}
        >
          {showAddForm ? "✕ Cancel" : "+ Add Car"}
        </button>
      </div>

      {/* Add form */}
      {showAddForm && (
        <div className={styles.addForm}>
          <h3 className={styles.addFormTitle}>New Car Details</h3>
          <div className={styles.addFormGrid}>
            <div className={styles.addFormGroup}>
              <label className={styles.addFormLabel}>Make</label>
              <input className={styles.addFormInput} placeholder="Toyota"
                value={newCar.make} onChange={e => setNewCar(c => ({ ...c, make: e.target.value }))} />
            </div>
            <div className={styles.addFormGroup}>
              <label className={styles.addFormLabel}>Model</label>
              <input className={styles.addFormInput} placeholder="Camry"
                value={newCar.model} onChange={e => setNewCar(c => ({ ...c, model: e.target.value }))} />
            </div>
            <div className={styles.addFormGroup}>
              <label className={styles.addFormLabel}>Year</label>
              <input className={styles.addFormInput} type="number" placeholder="2024"
                value={newCar.year || ""} onChange={e => setNewCar(c => ({ ...c, year: +e.target.value }))} />
            </div>
            <div className={styles.addFormGroup}>
              <label className={styles.addFormLabel}>Plate Number</label>
              <input className={styles.addFormInput} placeholder="ABC-1234"
                value={newCar.plate} onChange={e => setNewCar(c => ({ ...c, plate: e.target.value }))} />
            </div>
            <div className={styles.addFormGroup}>
              <label className={styles.addFormLabel}>Color</label>
              <input className={styles.addFormInput} placeholder="Pearl White"
                value={newCar.color} onChange={e => setNewCar(c => ({ ...c, color: e.target.value }))} />
            </div>
            <div className={styles.addFormGroup}>
              <label className={styles.addFormLabel}>Fuel Type</label>
              <select className={styles.addFormSelect} value={newCar.fuelType}
                onChange={e => setNewCar(c => ({ ...c, fuelType: e.target.value }))}>
                <option>Gasoline</option>
                <option>Diesel</option>
                <option>Electric</option>
                <option>Hybrid</option>
              </select>
            </div>
            <div className={styles.addFormGroup}>
              <label className={styles.addFormLabel}>Transmission</label>
              <select className={styles.addFormSelect} value={newCar.transmission}
                onChange={e => setNewCar(c => ({ ...c, transmission: e.target.value }))}>
                <option>Automatic</option>
                <option>Manual</option>
                <option>CVT</option>
              </select>
            </div>
            <div className={styles.addFormGroup}>
              <label className={styles.addFormLabel}>Seats</label>
              <select className={styles.addFormSelect} value={newCar.seats}
                onChange={e => setNewCar(c => ({ ...c, seats: +e.target.value }))}>
                <option value={2}>2</option>
                <option value={4}>4</option>
                <option value={5}>5</option>
                <option value={7}>7</option>
                <option value={8}>8</option>
              </select>
            </div>
            <div className={styles.addFormGroup}>
              <label className={styles.addFormLabel}>Rate per Day (₱)</label>
              <input className={styles.addFormInput} type="number" placeholder="2500"
                value={newCar.ratePerDay || ""} onChange={e => setNewCar(c => ({ ...c, ratePerDay: +e.target.value }))} />
            </div>
            <div className={styles.addFormGroup}>
              <label className={styles.addFormLabel}>Pickup Location</label>
              <input className={styles.addFormInput} placeholder="e.g. Makati City"
                value={newCar.location} onChange={e => setNewCar(c => ({ ...c, location: e.target.value }))} />
            </div>
          </div>
          <div className={styles.addFormFooter}>
            <button className={styles.btnCancel}
              onClick={() => { setShowAddForm(false); setNewCar(EMPTY_CAR); }}>
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
              onEdit={handleEditStart}
              isEditing={editingCarId === car.id}
              editForm={editForm}
              onEditChange={handleEditChange}
              onEditSave={handleEditSave}
              onEditCancel={handleEditCancel}
              editSaving={editSaving}
            />
          ))}
        </div>
      )}
    </div>
  );
}
