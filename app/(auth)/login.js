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
      Alert.alert("Validation Error", "Please enter your email");
      return;
    }
    if (!password.trim()) {
      Alert.alert("Validation Error", "Please enter your password");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Validation Error", "Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password,
      );
      const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));
      if (userDoc.exists()) {
        const role = userDoc.data().role;
        Alert.alert("Success", "Welcome back!", [
          {
            text: "OK",
            onPress: () => {
              if (role === "student") router.replace("/(student)");
              else if (role === "lecturer") router.replace("/(lecturer)");
              else if (role === "prl") router.replace("/(prl)");
              else if (role === "pl") router.replace("/(pl)");
            },
          },
        ]);
      } else {
        Alert.alert("Error", "User profile not found. Please register again.");
      }
    } catch (error) {
      let message = "Login failed. Please try again.";
      if (error.code === "auth/invalid-email")
        message = "Invalid email address.";
      else if (error.code === "auth/user-not-found")
        message = "No account found with this email.";
      else if (error.code === "auth/wrong-password")
        message = "Incorrect password. Please try again.";
      else if (error.code === "auth/too-many-requests")
        message = "Too many attempts. Please try later.";
      else if (error.code === "auth/invalid-credential")
        message = "Invalid email or password.";
      Alert.alert("Login Failed", message);
    }
    setLoading(false);
  }, [email, password]);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logoBox}>
          <Text style={styles.logoText}>L</Text>
        </View>
        <Text style={styles.title}>LUCT Reportingfghh</Text>
        <Text style={styles.subtitle}>Sign in to your account</Text>

        <Text style={styles.label}>Email Address</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your email"
          placeholderTextColor="#555b7a"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="next"
          blurOnSubmit={false}
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your password"
          placeholderTextColor="#555b7a"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          returnKeyType="done"
          onSubmitEditing={handleLogin}
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Login</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push("/(auth)/register")}>
          <Text style={styles.linkText}>Don't have an account? Register</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
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
  title: { fontSize: 28, fontWeight: "700", color: "#fff", marginBottom: 6 },
  subtitle: { fontSize: 14, color: "#6b7280", marginBottom: 36 },
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
  linkText: { color: "#4f46e5", fontSize: 14 },
});
