import type { ReactNode } from "react";
import type { User } from "firebase/auth";
import styles from "./DashboardShell.module.css";

interface Props {
  sidebar: ReactNode;
  onLogout: () => void;
  user: User | null;
  role: string | null;
  title: string;
  children: ReactNode;
}

function getInitials(email: string) {
  return email.slice(0, 2).toUpperCase();
}

export default function DashboardShell({
  sidebar, onLogout, user, role, title, children,
}: Props) {
  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <span className={styles.brandIcon}>🚗</span>
          <div>
            <div className={styles.brandName}>DriveEasy</div>
            <div className={styles.brandTagline}>Car Rental</div>
          </div>
        </div>

        <nav className={styles.nav}>
          {sidebar}
          <div className={styles.navDivider} />
          <button className={styles.logoutBtn} onClick={onLogout}>
            <span className={styles.navIcon}>🚪</span>
            Logout
          </button>
        </nav>
      </aside>

      <div className={styles.main}>
        <header className={styles.topbar}>
          <span className={styles.topbarTitle}>{title}</span>
          <div className={styles.userPill}>
            <div className={styles.avatar}>{getInitials(user?.email ?? "U")}</div>
            <span className={styles.userEmail}>{user?.email}</span>
            {role && <span className={styles.roleBadge}>{role}</span>}
          </div>
        </header>

        <main className={styles.content}>
          {children}
        </main>
      </div>
    </div>
  );
}
