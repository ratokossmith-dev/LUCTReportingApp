import { router } from "expo-router";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { auth } from "../../config/auth";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    if (!email.trim() || !email.includes("@")) {
      Alert.alert("Validation Error", "Please enter a valid email address");
      return false;
    }
    if (password.length < 6) {
      Alert.alert("Validation Error", "Password must be at least 6 characters");
      return false;
    }
    return true;
  };

  const handleLogin = useCallback(async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (error) {
      let message = "Login failed. Please check your credentials.";
      if (error.code === "auth/invalid-credential" || error.code === "auth/wrong-password" || error.code === "auth/user-not-found") {
        message = "Invalid email or password. Please try again.";
      } else if (error.code === "auth/too-many-requests") {
        message = "Too many failed attempts. Please try again later.";
      } else if (error.code === "auth/network-request-failed") {
        message = "No internet connection. Please check your network.";
      }
      Alert.alert("Login Failed", message);
    } finally {
      setLoading(false);
    }
  }, [email, password]);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={s.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={s.logoBox}>
          <Text style={s.logoText}>L</Text>
        </View>

        <Text style={s.title}>Welcome Back</Text>
        <Text style={s.subtitle}>Login to LUCT Faculty Reporting System</Text>

        <Text style={s.label}>Email Address</Text>
        <TextInput
          style={s.input}
          placeholder="Enter your email"
          placeholderTextColor="#555b7a"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <Text style={s.label}>Password</Text>
        <TextInput
          style={s.input}
          placeholder="Enter your password"
          placeholderTextColor="#555b7a"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity
          style={[s.button, loading && s.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={s.buttonText}>Login</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push("/(auth)/register")}>
          <Text style={s.registerText}>
            Don't have an account? <Text style={s.registerBold}>Register</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#0a0f2c",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  logoBox: {
    width: 60,
    height: 60,
    backgroundColor: "#4f46e5",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  logoText: { color: "#fff", fontSize: 28, fontWeight: "700" },
  title: { fontSize: 28, fontWeight: "700", color: "#fff", marginBottom: 4 },
  subtitle: { fontSize: 13, color: "#6b7280", marginBottom: 32, textAlign: "center" },
  label: { color: "#9ca3af", fontSize: 13, alignSelf: "flex-start", marginBottom: 6 },
  input: {
    width: "100%",
    backgroundColor: "#1a1f3c",
    borderRadius: 12,
    padding: 15,
    color: "#fff",
    marginBottom: 16,
    borderWidth: 0.5,
    borderColor: "#2a2f5c",
    fontSize: 15,
  },
  button: {
    width: "100%",
    backgroundColor: "#4f46e5",
    borderRadius: 12,
    padding: 15,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 16,
  },
  buttonDisabled: { backgroundColor: "#3730a3" },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  registerText: { color: "#6b7280", fontSize: 14, textAlign: "center" },
  registerBold: { color: "#4f46e5", fontWeight: "600" },
});