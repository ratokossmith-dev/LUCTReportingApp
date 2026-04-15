import { Slot, useRouter } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider, useAuth } from "../config/AuthContext";

function RootLayoutNav() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const role = profile?.role;

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
  }, [user, profile, loading]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
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
