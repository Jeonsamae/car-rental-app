import styles from "../../components/DashboardShell.module.css";

export const ADMIN_NAV = [
  { icon: "🏠", label: "Overview",   key: "overview"  },
  { icon: "🚗", label: "Fleet",      key: "fleet"     },
  { icon: "📋", label: "Rentals",    key: "rentals"   },
  { icon: "👥", label: "Customers",  key: "customers" },
  { icon: "💳", label: "Payments",   key: "payments"  },
  { icon: "⚙️", label: "Settings",   key: "settings"  },
];

export default function AdminSidebar({
  activeNav,
  onNavChange,
}: {
  activeNav: string;
  onNavChange: (key: string) => void;
}) {
  return (
    <>
      {ADMIN_NAV.map(item => (
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
