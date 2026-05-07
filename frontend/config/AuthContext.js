import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { router } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import api from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser && isMounted.current) {
          const idToken = await firebaseUser.getIdToken(false);
          await api.setToken(idToken);
          setUser(firebaseUser);

          const response = await api.getMe();

          if (response?.user && isMounted.current) {
            const userProfile = { id: firebaseUser.uid, ...response.user };
            setProfile(userProfile);
            setLoading(false);

            const role = userProfile.role;
            setTimeout(() => {
              if (role === 'student') router.replace('/(student)');
              else if (role === 'lecturer') router.replace('/(lecturer)');
              else if (role === 'prl') router.replace('/(prl)');
              else if (role === 'pl') router.replace('/(pl)');
              else router.replace('/(auth)/login');
            }, 150);
          } else if (isMounted.current) {
            await api.removeToken();
            setUser(null);
            setProfile(null);
            setLoading(false);
            setTimeout(() => router.replace('/(auth)/login'), 150);
          }
        } else if (isMounted.current) {
          await api.removeToken();
          setUser(null);
          setProfile(null);
          setLoading(false);
          setTimeout(() => router.replace('/(auth)/login'), 150);
        }
      } catch (e) {
        console.log('Auth error:', e);
        if (isMounted.current) {
          await api.removeToken();
          setUser(null);
          setProfile(null);
          setLoading(false);
          setTimeout(() => router.replace('/(auth)/login'), 150);
        }
      }
    });

    return () => {
      isMounted.current = false;
      unsubscribe();
    };
  }, []);

  const refreshToken = async () => {
    if (user) {
      const idToken = await user.getIdToken(true);
      await api.setToken(idToken);
      return idToken;
    }
    return null;
  };

  const logout = async () => {
    await api.removeToken();
    setUser(null);
    setProfile(null);
    setTimeout(() => router.replace('/(auth)/login'), 150);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        refreshToken,
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
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};