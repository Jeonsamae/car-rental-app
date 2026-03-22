import styles from "./AdminDashboard.module.css";

export default function SettingsPage() {
  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.greeting}>Settings</h1>
        <p className={styles.subGreeting}>App configuration and information</p>
      </div>

      <div className={styles.settingsGrid}>
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <span className={styles.panelTitle}>App Info</span>
          </div>
          <div className={styles.settingsBody}>
            {[
              { label: "App Name",    value: "Car Rental App" },
              { label: "Firebase Project", value: "car-rental-app-cfbdf" },
              { label: "Environment", value: "Development" },
            ].map(item => (
              <div key={item.label} className={styles.settingRow}>
                <div className={styles.settingLabel}>{item.label}</div>
                <div className={styles.settingValue}>{item.value}</div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <span className={styles.panelTitle}>Firestore Security Rules</span>
          </div>
          <div className={styles.settingsBody}>
            <div className={styles.settingRow}>
              <div className={styles.settingLabel}>Admin read access</div>
              <div className={styles.settingDesc}>
                Make sure your Firestore rules allow the admin role to read all collections
                (cars, bookings, users). Update rules in the Firebase Console → Firestore → Rules.
              </div>
            </div>
            <div className={styles.settingRow}>
              <div className={styles.settingLabel}>savedCars collection</div>
              <div className={styles.settingDesc}>
                Requires a rule allowing authenticated users to create/read/delete their own saved cars
                (match by <code>userId == request.auth.uid</code>).
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
