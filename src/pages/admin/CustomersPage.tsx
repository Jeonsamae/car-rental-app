import { useMemo, useState } from "react";
import styles from "./AdminDashboard.module.css";
import type { Booking } from "./types";

interface Props {
  bookings: Booking[];
}

interface CustomerSummary {
  id: string;
  name: string;
  email: string;
  bookingCount: number;
  totalSpent: number;
  lastBooking: string;
}

export default function CustomersPage({ bookings }: Props) {
  const [search, setSearch] = useState("");

  // Derive unique customers from bookings data
  const customers = useMemo<CustomerSummary[]>(() => {
    const map = new Map<string, CustomerSummary>();
    bookings.forEach(b => {
      const key = b.customerId ?? b.customerEmail ?? b.customer;
      if (!map.has(key)) {
        map.set(key, {
          id: key,
          name: b.customer,
          email: b.customerEmail ?? "—",
          bookingCount: 0,
          totalSpent: 0,
          lastBooking: b.startDate,
        });
      }
      const entry = map.get(key)!;
      entry.bookingCount++;
      entry.totalSpent += b.totalCost ?? 0;
      if (b.startDate > entry.lastBooking) entry.lastBooking = b.startDate;
    });
    return [...map.values()].sort((a, b) => b.bookingCount - a.bookingCount);
  }, [bookings]);

  const filtered = customers.filter(c => {
    const q = search.toLowerCase();
    return !q || c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q);
  });

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.greeting}>Customers</h1>
        <p className={styles.subGreeting}>
          {customers.length} unique customer{customers.length !== 1 ? "s" : ""}
        </p>
      </div>

      <div className={styles.filterPanel}>
      <div className={styles.filterBar}>
        <div className={styles.searchWrap}>
          <span className={styles.searchIcon}>🔍</span>
          <input
            className={styles.searchInput}
            placeholder="Search by name or email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button className={styles.searchClear} onClick={() => setSearch("")}>✕</button>
          )}
        </div>
      </div>

      <div className={styles.panel}>
        {filtered.length === 0 ? (
          <div className={styles.emptyState}>
            {customers.length === 0
              ? "No customers yet. Customers appear once a booking is made."
              : "No customers match your search."}
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Customer</th>
                <th>Email</th>
                <th>Bookings</th>
                <th>Total Spent</th>
                <th>Last Booking</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id}>
                  <td>
                    <div className={styles.customerRow}>
                      <div className={styles.avatarCircle}>
                        {c.name.charAt(0).toUpperCase()}
                      </div>
                      <span className={styles.carName}>{c.name}</span>
                    </div>
                  </td>
                  <td>{c.email}</td>
                  <td>
                    <span className={`${styles.badge} ${styles.badgeActive}`}>
                      {c.bookingCount}
                    </span>
                  </td>
                  <td className={styles.rateCell}>
                    ₱{c.totalSpent.toLocaleString()}
                  </td>
                  <td>{c.lastBooking}</td>
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
