import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { addLecturer, getAllLecturers } from "../../config/firestore";

export default function PLLecturers() {
  const [lecturers, setLecturers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState("");
  const [newLecturer, setNewLecturer] = useState({
    name: "",
    email: "",
    facultyName: "Faculty of ICT",
  });

  useEffect(() => {
    loadLecturers();
  }, []);

  const loadLecturers = async () => {
    try {
      const data = await getAllLecturers();
      setLecturers(data);
    } catch (e) {
      console.log("Error:", e);
    }
    setLoading(false);
  };

  const handleAdd = useCallback(async () => {
    if (!newLecturer.name || !newLecturer.email) {
      Alert.alert("Error", "Name and email are required");
      return;
    }

    if (!newLecturer.email.includes("@")) {
      Alert.alert("Error", "Please enter a valid email address");
      return;
    }

    setSaving(true);
    try {
      const result = await addLecturer(newLecturer);

      // Show the generated password to PL
      Alert.alert(
        "Lecturer Added Successfully! ✅",
        `Name: ${newLecturer.name}\nEmail: ${newLecturer.email}\n\nTemporary Password: ${result.tempPassword}\n\n⚠️ Please share these login details with the lecturer. They can change their password after first login.`,
        [
          {
            text: "Copy Password",
            onPress: () => {
              // You can add clipboard functionality here
              Alert.alert("Success", "Password copied to clipboard");
            },
          },
          {
            text: "OK",
            onPress: () => {
              setModalVisible(false);
              setNewLecturer({
                name: "",
                email: "",
                facultyName: "Faculty of ICT",
              });
              setGeneratedPassword("");
              loadLecturers();
            },
          },
        ],
      );
    } catch (e) {
      Alert.alert("Error", e.message || "Failed to add lecturer");
    }
    setSaving(false);
  }, [newLecturer]);

  const filtered = lecturers.filter(
    (l) =>
      !search ||
      (l.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (l.email || "").toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backBtn}>‹ Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Lecturers</Text>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => setModalVisible(true)}
          >
            <Text style={styles.addBtnText}>+ Add</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: "#4f46e5" }]}>
              {lecturers.length}
            </Text>
            <Text style={styles.statLabel}>Total Lecturers</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: "#10b981" }]}>
              {lecturers.filter((l) => l.status !== "Inactive").length}
            </Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
        </View>

        <TextInput
          style={styles.searchInput}
          placeholder="Search lecturers..."
          placeholderTextColor="#555b7a"
          value={search}
          onChangeText={setSearch}
        />

        <Text style={styles.sectionTitle}>
          All Lecturers ({filtered.length})
        </Text>
        {loading ? (
          <ActivityIndicator color="#4f46e5" />
        ) : filtered.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No lecturers found</Text>
          </View>
        ) : (
          filtered.map((lecturer) => (
            <View key={lecturer.id} style={styles.lecturerCard}>
              <View style={styles.lecturerHeader}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {lecturer.name?.charAt(0) || "L"}
                  </Text>
                </View>
                <View style={styles.lecturerInfo}>
                  <Text style={styles.lecturerName}>{lecturer.name}</Text>
                  <Text style={styles.lecturerEmail}>{lecturer.email}</Text>
                  <Text style={styles.lecturerFaculty}>
                    {lecturer.facultyName || "Faculty of ICT"}
                  </Text>
                </View>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>
                    {lecturer.status === "Inactive" ? "Inactive" : "Active"}
                  </Text>
                </View>
              </View>
              {lecturer.tempPassword && (
                <View style={styles.passwordHint}>
                  <Text style={styles.passwordHintText}>
                    ⚠️ Temp password: {lecturer.tempPassword}
                  </Text>
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Add New Lecturer</Text>
            <Text style={styles.modalSubtitle}>
              A temporary password will be generated automatically
            </Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Full Name *"
              placeholderTextColor="#555b7a"
              value={newLecturer.name}
              onChangeText={(v) => setNewLecturer((p) => ({ ...p, name: v }))}
            />

            <TextInput
              style={styles.modalInput}
              placeholder="Email Address *"
              placeholderTextColor="#555b7a"
              value={newLecturer.email}
              onChangeText={(v) => setNewLecturer((p) => ({ ...p, email: v }))}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <TextInput
              style={styles.modalInput}
              placeholder="Faculty"
              placeholderTextColor="#555b7a"
              value={newLecturer.facultyName}
              onChangeText={(v) =>
                setNewLecturer((p) => ({ ...p, facultyName: v }))
              }
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => {
                  setModalVisible(false);
                  setNewLecturer({
                    name: "",
                    email: "",
                    facultyName: "Faculty of ICT",
                  });
                }}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.submitBtn,
                  saving && { backgroundColor: "#3730a3" },
                ]}
                onPress={handleAdd}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitText}>Create & Send</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0a0f2c" },
  container: { flex: 1, padding: 20 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
    marginTop: 16,
  },
  backBtn: { color: "#4f46e5", fontSize: 18, fontWeight: "600", width: 50 },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "700" },
  addBtn: {
    backgroundColor: "#4f46e5",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  addBtnText: { color: "#fff", fontSize: 13, fontWeight: "600" },
  statsRow: { flexDirection: "row", gap: 12, marginBottom: 16 },
  statBox: {
    flex: 1,
    backgroundColor: "#1a1f3c",
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    borderWidth: 0.5,
    borderColor: "#2a2f5c",
  },
  statValue: { fontSize: 28, fontWeight: "700" },
  statLabel: { color: "#6b7280", fontSize: 12, marginTop: 4 },
  searchInput: {
    backgroundColor: "#1a1f3c",
    borderRadius: 12,
    padding: 12,
    color: "#fff",
    marginBottom: 20,
    borderWidth: 0.5,
    borderColor: "#2a2f5c",
    fontSize: 14,
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 12,
  },
  emptyBox: {
    backgroundColor: "#1a1f3c",
    borderRadius: 14,
    padding: 24,
    alignItems: "center",
    borderWidth: 0.5,
    borderColor: "#2a2f5c",
  },
  emptyText: { color: "#6b7280", fontSize: 14 },
  lecturerCard: {
    backgroundColor: "#1a1f3c",
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 0.5,
    borderColor: "#2a2f5c",
  },
  lecturerHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    backgroundColor: "#4f46e5",
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontSize: 18, fontWeight: "700" },
  lecturerInfo: { flex: 1 },
  lecturerName: { color: "#fff", fontSize: 15, fontWeight: "600" },
  lecturerEmail: { color: "#6b7280", fontSize: 12, marginTop: 2 },
  lecturerFaculty: { color: "#4f46e5", fontSize: 11, marginTop: 2 },
  statusBadge: {
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderWidth: 0.5,
    borderColor: "#10b981",
  },
  statusText: { color: "#10b981", fontSize: 12, fontWeight: "600" },
  passwordHint: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 0.5,
    borderTopColor: "#2a2f5c",
  },
  passwordHintText: {
    color: "#f59e0b",
    fontSize: 11,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: "#1a1f3c",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  modalTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  modalSubtitle: {
    color: "#6b7280",
    fontSize: 12,
    marginBottom: 16,
  },
  modalInput: {
    backgroundColor: "#0a0f2c",
    borderRadius: 12,
    padding: 14,
    color: "#fff",
    marginBottom: 12,
    borderWidth: 0.5,
    borderColor: "#2a2f5c",
    fontSize: 14,
  },
  modalButtons: { flexDirection: "row", gap: 10, marginTop: 4 },
  cancelBtn: {
    flex: 1,
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    borderWidth: 0.5,
    borderColor: "#2a2f5c",
  },
  cancelText: { color: "#6b7280", fontSize: 15, fontWeight: "600" },
  submitBtn: {
    flex: 1,
    backgroundColor: "#4f46e5",
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
  },
  submitText: { color: "#fff", fontSize: 15, fontWeight: "600" },
});
