import styles from "../../components/DashboardShell.module.css";

export const CUSTOMER_NAV = [
  { icon: "🏠", label: "Home",        key: "home"    },
  { icon: "🚗", label: "Browse Cars", key: "browse"  },
  { icon: "📋", label: "My Rentals",  key: "rentals" },
  { icon: "❤️", label: "Saved Cars",  key: "saved"   },
];

export default function CustomerSidebar({
  activeNav,
  onNavChange,
}: {
  activeNav: string;
  onNavChange: (key: string) => void;
}) {
  return (
    <>
      {CUSTOMER_NAV.map(item => (
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
