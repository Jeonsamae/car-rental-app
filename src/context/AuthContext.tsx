import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import type { User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

interface AuthContextType {
  user: User | null;
  role: string | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  loading: true,
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("AuthContext: setting up onAuthStateChanged");
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      console.log("AuthContext: auth state changed, user =", currentUser?.email ?? null);
      setLoading(true);
      setUser(currentUser);
      if (currentUser) {
        try {
          const docSnap = await new Promise<Awaited<ReturnType<typeof getDoc>>>((resolve, reject) => {
            const timer = setTimeout(() => reject(new Error("Firestore timeout")), 5000);
            getDoc(doc(db, "users", currentUser.uid))
              .then((snap) => { clearTimeout(timer); resolve(snap); })
              .catch((err) => { clearTimeout(timer); reject(err); });
          });
          const data = docSnap.exists() ? (docSnap.data() as { role?: string }) : null;
          setRole(data?.role ?? null);
        } catch (err) {
          console.error("AuthContext: Firestore error", err);
          setRole(null);
        }
      } else {
        setRole(null);
      }
      setLoading(false);
    }, (error) => {
      console.error("AuthContext: onAuthStateChanged error", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = () => signOut(auth);

  return (
    <AuthContext.Provider value={{ user, role, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
