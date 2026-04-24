import { Stack } from "expo-router";
import { AuthProvider } from "../config/AuthContext";

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(student)" options={{ headerShown: false }} />
        <Stack.Screen name="(lecturer)" options={{ headerShown: false }} />
        <Stack.Screen name="(prl)" options={{ headerShown: false }} />
        <Stack.Screen name="(pl)" options={{ headerShown: false }} />
      </Stack>
    </AuthProvider>
  );
}