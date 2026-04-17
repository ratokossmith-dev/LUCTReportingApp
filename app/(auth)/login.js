import { router } from "expo-router";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
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
import { db } from "../../config/firebase";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = useCallback(async () => {
    if (!email.trim()) {
      Alert.alert("Error", "Please enter your email");
      return;
    }
    if (!password.trim()) {
      Alert.alert("Error", "Please enter your password");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password,
      );
      const snap = await getDoc(doc(db, "users", cred.user.uid));
      if (snap.exists()) {
        const role = snap.data().role;
        if (role === "student") router.replace("/(student)");
        else if (role === "lecturer") router.replace("/(lecturer)");
        else if (role === "prl") router.replace("/(prl)");
        else if (role === "pl") router.replace("/(pl)");
        else Alert.alert("Error", "Unknown role. Contact admin.");
      } else {
        Alert.alert("Error", "Profile not found. Please register first.");
      }
    } catch (error) {
      console.log("Login error:", error.code, error.message);
      let msg = "Login failed. Check your email and password.";
      if (error.code === "auth/invalid-email") msg = "Invalid email address.";
      else if (error.code === "auth/user-not-found")
        msg = "No account with this email. Please register first.";
      else if (error.code === "auth/wrong-password") msg = "Wrong password.";
      else if (error.code === "auth/invalid-credential")
        msg = "Invalid email or password.";
      else if (error.code === "auth/network-request-failed")
        msg = "No internet connection.";
      else if (error.code === "auth/too-many-requests")
        msg = "Too many attempts. Try later.";
      Alert.alert("Login Failed", msg);
    }
    setLoading(false);
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
        <Text style={s.title}>LUCT Reporting</Text>
        <Text style={s.subtitle}>Faculty of ICT</Text>

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
          returnKeyType="done"
          onSubmitEditing={handleLogin}
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
          <Text style={s.link}>Don't have an account? Register here</Text>
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
  subtitle: { fontSize: 13, color: "#6b7280", marginBottom: 24 },
  infoBox: {
    backgroundColor: "#1a1f3c",
    borderRadius: 12,
    padding: 14,
    borderWidth: 0.5,
    borderColor: "#f59e0b",
    marginBottom: 24,
    width: "100%",
  },
  infoTitle: {
    color: "#f59e0b",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 4,
  },
  infoText: { color: "#9ca3af", fontSize: 12 },
  label: {
    color: "#9ca3af",
    fontSize: 13,
    alignSelf: "flex-start",
    marginBottom: 6,
  },
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
    marginBottom: 16,
    marginTop: 8,
  },
  buttonDisabled: { backgroundColor: "#3730a3" },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  link: { color: "#4f46e5", fontSize: 14 },
});
