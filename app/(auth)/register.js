import { router } from "expo-router";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
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
  View } from "react-native";
import { auth } from "../../config/auth";
import { db } from "../../config/firebase";

export default function RegisterScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("student");
  const [loading, setLoading] = useState(false);

  const roles = [
    { key: "student", label: "Student" },
    { key: "lecturer", label: "Lecturer" },
    { key: "prl", label: "Principal Lecturer" },
    { key: "pl", label: "Program Leader" },
  ];

  const handleRegister = useCallback(async () => {
    if (!name.trim()) {
      Alert.alert("Validation Error", "Please enter your full name");
      return;
    }
    if (!email.trim()) {
      Alert.alert("Validation Error", "Please enter your email");
      return;
    }
    if (!email.includes("@")) {
      Alert.alert("Validation Error", "Please enter a valid email address");
      return;
    }
    if (!password.trim()) {
      Alert.alert("Validation Error", "Please enter a password");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Validation Error", "Password must be at least 6 characters");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Validation Error", "Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password,
      );
      await setDoc(doc(db, "users", userCredential.user.uid), {
        name: name.trim(),
        email: email.trim(),
        role,
        facultyName: "Faculty of ICT",
        createdAt: new Date() });
      Alert.alert(
        "Account Created!",
        `Welcome ${name.trim()}! Your account has been created successfully.`,
        [{ text: "Login Now", onPress: () => router.replace("/(auth)/login") }],
      );
    } catch (error) {
      let message = "Registration failed. Please try again.";
      if (error.code === "auth/email-already-in-use")
        message = "This email is already registered. Please login instead.";
      else if (error.code === "auth/invalid-email")
        message = "Please enter a valid email address.";
      else if (error.code === "auth/weak-password")
        message = "Password is too weak. Use at least 6 characters.";
      Alert.alert("Registration Failed", message);
    }
    setLoading(false);
  }, [name, email, password, confirmPassword, role]);

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
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Join LUCT Reporting System</Text>

        <Text style={styles.label}>Full Name *</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your full name"
          placeholderTextColor="#555b7a"
          value={name}
          onChangeText={setName}
          autoCorrect={false}
          returnKeyType="next"
          blurOnSubmit={false}
        />

        <Text style={styles.label}>Email Address *</Text>
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

        <Text style={styles.label}>Password * (min 6 characters)</Text>
        <TextInput
          style={styles.input}
          placeholder="Create a password"
          placeholderTextColor="#555b7a"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          returnKeyType="next"
          blurOnSubmit={false}
        />

        <Text style={styles.label}>Confirm Password *</Text>
        <TextInput
          style={styles.input}
          placeholder="Confirm your password"
          placeholderTextColor="#555b7a"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          returnKeyType="done"
        />

        <Text style={styles.roleLabel}>Select Your Role *</Text>
        <View style={styles.roleGrid}>
          {roles.map((r) => (
            <TouchableOpacity
              key={r.key}
              style={[styles.roleButton, role === r.key && styles.roleActive]}
              onPress={() => setRole(r.key)}
            >
              <Text
                style={[
                  styles.roleText,
                  role === r.key && styles.roleTextActive,
                ]}
              >
                {r.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Create Account</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push("/(auth)/login")}>
          <Text style={styles.linkText}>Already have an account? Login</Text>
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
    padding: 24 },
  logoBox: {
    width: 60,
    height: 60,
    backgroundColor: "#4f46e5",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16 },
  logoText: { color: "#fff", fontSize: 28, fontWeight: "700" },
  title: { fontSize: 28, fontWeight: "700", color: "#fff", marginBottom: 6 },
  subtitle: { fontSize: 14, color: "#6b7280", marginBottom: 24 },
  label: {
    color: "#9ca3af",
    fontSize: 13,
    alignSelf: "flex-start",
    marginBottom: 6 },
  input: {
    width: "100%",
    backgroundColor: "#1a1f3c",
    borderRadius: 12,
    padding: 15,
    color: "#fff",
    marginBottom: 14,
    borderWidth: 0.5,
    borderColor: "#2a2f5c",
    fontSize: 15 },
  roleLabel: {
    color: "#fff",
    alignSelf: "flex-start",
    fontSize: 15,
    marginBottom: 12,
    fontWeight: "500" },
  roleGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    width: "100%",
    marginBottom: 24 },
  roleButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: "#4f46e5",
    backgroundColor: "#1a1f3c" },
  roleActive: { backgroundColor: "#4f46e5" },
  roleText: { color: "#4f46e5", fontSize: 13 },
  roleTextActive: { color: "#fff" },
  button: {
    width: "100%",
    backgroundColor: "#4f46e5",
    borderRadius: 12,
    padding: 15,
    alignItems: "center",
    marginBottom: 16 },
  buttonDisabled: { backgroundColor: "#3730a3" },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  linkText: { color: "#4f46e5", fontSize: 14 } });
