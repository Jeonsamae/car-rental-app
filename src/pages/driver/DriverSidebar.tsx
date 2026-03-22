import styles from "../../components/DashboardShell.module.css";

export const DRIVER_NAV = [
  { icon: "🏠", label: "Dashboard",    key: "dashboard" },
  { icon: "🚗", label: "My Cars",      key: "cars"      },
  { icon: "📋", label: "Bookings",     key: "bookings"  },
  { icon: "📍", label: "Trip History", key: "history"   },
];

export default function DriverSidebar({
  activeNav,
  onNavChange,
}: {
  activeNav: string;
  onNavChange: (key: string) => void;
}) {
  return (
    <>
      {DRIVER_NAV.map(item => (
        <button
          key={item.key}
          className={`${styles.navItem} ${activeNav === item.key ? styles.navItemActive : ""}`}
          onClick={() => onNavChange(item.key)}
        >
          <span className={styles.navIcon}>{item.icon}</span>
          {item.label}
        </button>
      ))}
    </>
  );
}
