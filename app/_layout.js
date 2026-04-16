import { Slot, useRouter } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { auth } from "../config/auth";
import { AuthProvider } from "../config/AuthContext";
import { getUserProfile } from "../config/firestore";

function RootLayoutNav() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const router = useRouter();
  const hasNavigated = useRef(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const profile = await getUserProfile(firebaseUser.uid);
          if (profile) {
            setRole(profile.role);
            setUser(firebaseUser);
          } else {
            setUser(null);
            setRole(null);
          }
        } catch (e) {
          setUser(null);
          setRole(null);
        }
      } else {
        setUser(null);
        setRole(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (loading) return;
    if (hasNavigated.current) return;
    hasNavigated.current = true;

    if (!user) {
      router.replace("/(auth)/login");
    } else if (role === "student") {
      router.replace("/(student)");
    } else if (role === "lecturer") {
      router.replace("/(lecturer)");
    } else if (role === "prl") {
      router.replace("/(prl)");
    } else if (role === "pl") {
      router.replace("/(pl)");
    } else {
      router.replace("/(auth)/login");
    }
  }, [loading, user, role]);

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#0a0f2c" }}
      >
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text style={{ color: "#fff", marginTop: 16, fontSize: 14 }}>
          Loading...
        </Text>
        <TouchableOpacity
          style={{
            marginTop: 30,
            backgroundColor: "#4f46e5",
            padding: 14,
            borderRadius: 12,
            width: 200,
            alignItems: "center" }}
          onPress={() => {
            hasNavigated.current = true;
            setLoading(false);
            router.replace("/(auth)/login");
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "600" }}>Go to Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return <Slot />;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <RootLayoutNav />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
