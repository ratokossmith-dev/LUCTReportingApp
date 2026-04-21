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
  View,
} from "react-native";
import { auth } from "../../config/auth";
import { db } from "../../config/firebase";
import {
  addStudentToAllCourses,
  enrollNewStudentInAllClasses,
} from "../../config/firestore";

const ROLES = [
  {
    key: "student",
    label: "Student",
    color: "#10b981",
    desc: "View classes, attendance & rate lecturers",
  },
  {
    key: "lecturer",
    label: "Lecturer",
    color: "#4f46e5",
    desc: "Add classes, mark attendance & submit reports",
  },
  {
    key: "prl",
    label: "Principal Lecturer",
    color: "#f59e0b",
    desc: "Review reports & give feedback to lecturers",
  },
  {
    key: "pl",
    label: "Program Leader",
    color: "#ec4899",
    desc: "Manage courses, assign lecturers & full overview",
  },
];

export default function RegisterScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [role, setRole] = useState("student");
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    if (!name.trim()) {
      Alert.alert("Validation Error", "Please enter your full name");
      return false;
    }
    if (!email.trim() || !email.includes("@")) {
      Alert.alert("Validation Error", "Please enter a valid email address");
      return false;
    }
    if (password.length < 6) {
      Alert.alert("Validation Error", "Password must be at least 6 characters");
      return false;
    }
    if (password !== confirm) {
      Alert.alert("Validation Error", "Passwords do not match");
      return false;
    }
    return true;
  };

  const handleRegister = useCallback(async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Create Firebase Auth user
      const cred = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password,
      );
      const uid = cred.user.uid;

      // Save user to Firestore
      await setDoc(doc(db, "users", uid), {
        name: name.trim(),
        email: email.trim(),
        role,
        facultyName: "Faculty of ICT",
        createdAt: new Date(),
        status: "Active",
      });

      // Auto-enroll students in all existing classes AND courses
      if (role === "student") {
        try {
          // Enroll in all existing classes
          await enrollNewStudentInAllClasses(uid, name.trim(), email.trim());

          // Also add student to all existing courses
          await addStudentToAllCourses(uid, name.trim(), email.trim());

          console.log("Student auto-enrolled successfully");
        } catch (e) {
          console.log("Auto-enroll error (non-critical):", e);
        }
      }

      const roleLabel = ROLES.find((r) => r.key === role)?.label || role;

      // Success alert with clear next steps
      Alert.alert(
        "Registration Successful! ✅",
        `Welcome ${name.trim()}!\n\nRole: ${roleLabel}\n\nYou can now login with your email and password.`,
        [
          {
            text: "Go to Login",
            onPress: () => router.replace("/(auth)/login"),
          },
        ],
      );

      // Reset form
      setName("");
      setEmail("");
      setPassword("");
      setConfirm("");
      setRole("student");
    } catch (error) {
      console.log("Register error:", error.code, error.message);

      let message = "Registration failed. Please try again.";
      if (error.code === "auth/email-already-in-use") {
        message = "This email is already registered. Please login instead.";
      } else if (error.code === "auth/invalid-email") {
        message = "Invalid email address format.";
      } else if (error.code === "auth/weak-password") {
        message = "Password is too weak. Use at least 6 characters.";
      } else if (error.code === "auth/network-request-failed") {
        message = "No internet connection. Please check your network.";
      }

      Alert.alert("Registration Failed", message);
    } finally {
      setLoading(false);
    }
  }, [name, email, password, confirm, role]);

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
        <Text style={s.title}>Create Account</Text>
        <Text style={s.subtitle}>LUCT Faculty of ICT Reporting System</Text>

        <Text style={s.label}>Full Name *</Text>
        <TextInput
          style={s.input}
          placeholder="Enter your full name"
          placeholderTextColor="#555b7a"
          value={name}
          onChangeText={setName}
          autoCorrect={false}
        />

        <Text style={s.label}>Email Address *</Text>
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

        <Text style={s.label}>Password * (min 6 characters)</Text>
        <TextInput
          style={s.input}
          placeholder="Create a password"
          placeholderTextColor="#555b7a"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <Text style={s.label}>Confirm Password *</Text>
        <TextInput
          style={s.input}
          placeholder="Confirm your password"
          placeholderTextColor="#555b7a"
          value={confirm}
          onChangeText={setConfirm}
          secureTextEntry
        />

        <Text style={s.roleTitle}>Select Your Role *</Text>
        {ROLES.map((r) => (
          <TouchableOpacity
            key={r.key}
            style={[
              s.roleCard,
              role === r.key && { borderColor: r.color, borderWidth: 1.5 },
            ]}
            onPress={() => setRole(r.key)}
          >
            <View style={[s.roleBar, { backgroundColor: r.color }]} />
            <View style={{ flex: 1 }}>
              <Text style={[s.roleName, role === r.key && { color: r.color }]}>
                {r.label}
              </Text>
              <Text style={s.roleDesc}>{r.desc}</Text>
            </View>
            <View
              style={[
                s.roleCheck,
                role === r.key && {
                  backgroundColor: r.color,
                  borderColor: r.color,
                },
              ]}
            >
              {role === r.key && (
                <Text
                  style={{ color: "#fff", fontSize: 12, fontWeight: "700" }}
                >
                  ✓
                </Text>
              )}
            </View>
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          style={[s.button, loading && s.buttonDisabled]}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={s.buttonText}>Create Account</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push("/(auth)/login")}>
          <Text style={s.link}>Already have an account? Login</Text>
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
  subtitle: {
    fontSize: 13,
    color: "#6b7280",
    marginBottom: 24,
    textAlign: "center",
  },
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
    marginBottom: 14,
    borderWidth: 0.5,
    borderColor: "#2a2f5c",
    fontSize: 15,
  },
  roleTitle: {
    color: "#fff",
    alignSelf: "flex-start",
    fontSize: 15,
    marginBottom: 12,
    fontWeight: "600",
  },
  roleCard: {
    width: "100%",
    backgroundColor: "#1a1f3c",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 0.5,
    borderColor: "#2a2f5c",
  },
  roleBar: { width: 4, height: 40, borderRadius: 2, marginRight: 14 },
  roleName: { color: "#fff", fontSize: 14, fontWeight: "600", marginBottom: 2 },
  roleDesc: { color: "#6b7280", fontSize: 11 },
  roleCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2a2f5c",
    alignItems: "center",
    justifyContent: "center",
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
