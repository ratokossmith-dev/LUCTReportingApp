import { router, useSegments } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { createContext, useContext, useEffect, useState } from "react";
import { auth } from "./auth";
import { getUserProfile } from "./firestore";

const AuthContext = createContext(null);

// Protected routes mapping
const roleRoutes = {
  student: "/(student)",
  lecturer: "/(lecturer)",
  prl: "/(prl)",
  pl: "/(pl)",
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const segments = useSegments();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        try {
          const prof = await getUserProfile(firebaseUser.uid);
          setProfile(prof);

          // Redirect to appropriate dashboard after login
          if (prof?.role) {
            const targetRoute = roleRoutes[prof.role];
            if (targetRoute && !segments[0]?.includes(prof.role)) {
              router.replace(targetRoute);
            }
          }
        } catch (e) {
          console.log("Profile fetch error:", e);
          setProfile(null);
        }
      } else {
        setUser(null);
        setProfile(null);
        // Redirect to login if not on auth screen
        if (segments[0] !== "(auth)") {
          router.replace("/(auth)/login");
        }
      }
      setLoading(false);
    });
    return unsubscribe;
  }, [segments]);

  // Function to manually refresh profile
  const refreshProfile = async () => {
    if (user) {
      try {
        const prof = await getUserProfile(user.uid);
        setProfile(prof);
        return prof;
      } catch (e) {
        console.log("Refresh profile error:", e);
        return null;
      }
    }
    return null;
  };

  // Function to logout
  const logout = async () => {
    try {
      await auth.signOut();
      setUser(null);
      setProfile(null);
      router.replace("/(auth)/login");
    } catch (e) {
      console.log("Logout error:", e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        refreshProfile,
        logout,
        isAuthenticated: !!user,
        userRole: profile?.role,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
