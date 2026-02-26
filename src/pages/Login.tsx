import { useState, useEffect } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import styles from "./Auth.module.css";

export default function Login() {
  const [email, setEmail]     = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);

  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && user) navigate("/dashboard");
  }, [user, authLoading]);

  if (authLoading || user) return null;

  const handleLogin = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      const msg: Record<string, string> = {
        "auth/invalid-credential":    "Incorrect email or password.",
        "auth/user-not-found":        "No account found with this email.",
        "auth/wrong-password":        "Incorrect password.",
        "auth/too-many-requests":     "Too many attempts. Please try again later.",
      };
      setError(msg[err.code] ?? err.message);
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.brand}>
          <div className={styles.brandIcon}>🚗</div>
          <div className={styles.brandName}>DriveEasy</div>
          <div className={styles.brandTagline}>Premium Car Rental</div>
        </div>

        <h2 className={styles.title}>Welcome back</h2>

        {error && <div className={styles.errorBox}>{error}</div>}

        <form onSubmit={handleLogin} className={styles.form}>
          <div className={styles.fieldGroup}>
            <label className={styles.label}>Email</label>
            <input
              className={styles.input}
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>Password</label>
            <input
              className={styles.input}
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className={styles.button} disabled={loading}>
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <div className={styles.footer}>
          Don't have an account?
          <Link to="/register" className={styles.link}>Register</Link>
        </div>
      </div>
    </div>
  );
}
