import { onAuthStateChanged } from "firebase/auth";
import { createContext, useContext, useEffect, useState } from "react";
import { auth } from "./auth";
import { getUserProfile } from "./firestore";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
<<<<<<< HEAD
      if (firebaseUser) {
        setUser(firebaseUser);
        const prof = await getUserProfile(firebaseUser.uid);
        setProfile(prof);
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });
=======
      try {
        if (firebaseUser) {
          setUser(firebaseUser);

          // fetch role/profile ONCE here
          const prof = await getUserProfile(firebaseUser.uid);
          setProfile(prof || null);
        } else {
          setUser(null);
          setProfile(null);
        }
      } catch (error) {
        console.log("Auth error:", error);
        setUser(null);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    });

>>>>>>> 46e0c0d343859cd0b5abd6da7e5308c64cdfcba7
    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
