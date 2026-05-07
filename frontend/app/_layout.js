import { Stack } from 'expo-router';
import { AuthProvider, useAuth } from '../config/AuthContext';
import { View, ActivityIndicator } from 'react-native';

function RootNavigator() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0f2c' }}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  return (
    <Stack>
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(student)" options={{ headerShown: false }} />
      <Stack.Screen name="(lecturer)" options={{ headerShown: false }} />
      <Stack.Screen name="(prl)" options={{ headerShown: false }} />
      <Stack.Screen name="(pl)" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}