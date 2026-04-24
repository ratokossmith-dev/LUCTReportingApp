// config/AuthContext.js
import { createContext, useContext, useEffect, useState } from 'react';
import { router } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './auth';
import api from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Get Firebase ID token and store it for all API calls
          const idToken = await firebaseUser.getIdToken();
          await api.setToken(idToken);

          setUser(firebaseUser);

          // Fetch user profile + role from backend using the token
          const response = await api.getMe();

          if (response?.user) {
            const userProfile = {
              id: firebaseUser.uid,
              ...response.user,
            };
            setProfile(userProfile);

            // Redirect based on role
            const role = userProfile.role;
            if (role === 'student') router.replace('/(student)');
            else if (role === 'lecturer') router.replace('/(lecturer)');
            else if (role === 'prl') router.replace('/(prl)');
            else if (role === 'pl') router.replace('/(pl)');
            else {
              console.log('Unknown role:', role);
              router.replace('/(auth)/login');
            }
          } else {
            // Profile not found in backend
            await api.removeToken();
            setUser(null);
            setProfile(null);
            router.replace('/(auth)/login');
          }
        } catch (e) {
          console.log('Auth profile error:', e);
          await api.removeToken();
          setUser(null);
          setProfile(null);
          router.replace('/(auth)/login');
        }
      } else {
        
        await api.removeToken();
        setUser(null);
        setProfile(null);
        router.replace('/(auth)/login');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

    const refreshToken = async () => {
    if (user) {
      const idToken = await user.getIdToken(true);
      await api.setToken(idToken);
      return idToken;
    }
    return null;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        refreshToken,
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
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};