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
import { addCourse, getAllCourses } from "../../config/firestore";

export default function PLCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newCourse, setNewCourse] = useState({
    courseName: "",
    courseCode: "",
    lecturerName: "",
    semester: "",
    totalStudents: "",
  });

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      const data = await getAllCourses();
      setCourses(data);
    } catch (e) {
      console.log("Error:", e);
    }
    setLoading(false);
  };

  const handleAddCourse = useCallback(async () => {
    if (!newCourse.courseName || !newCourse.courseCode) {
      Alert.alert("Error", "Course name and code are required");
      return;
    }
    setSaving(true);
    try {
      await addCourse({
        ...newCourse,
        totalStudents: parseInt(newCourse.totalStudents) || 0,
        semester: parseInt(newCourse.semester) || 1,
      });
      Alert.alert("Success", "Course added successfully!");
      setModalVisible(false);
      setNewCourse({
        courseName: "",
        courseCode: "",
        lecturerName: "",
        semester: "",
        totalStudents: "",
      });
      loadCourses();
    } catch (e) {
      Alert.alert("Error", "Failed to add course");
    }
    setSaving(false);
  }, [newCourse]);

  const filtered = courses.filter(
    (c) =>
      !search ||
      (c.courseName || "").toLowerCase().includes(search.toLowerCase()) ||
      (c.courseCode || "").toLowerCase().includes(search.toLowerCase()) ||
      (c.lecturerName || "").toLowerCase().includes(search.toLowerCase()),
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
          <Text style={styles.headerTitle}>Courses</Text>
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
              {courses.length}
            </Text>
            <Text style={styles.statLabel}>Total Courses</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: "#10b981" }]}>
              {courses.reduce(
                (a, b) => a + (parseInt(b.totalStudents) || 0),
                0,
              )}
            </Text>
            <Text style={styles.statLabel}>Total Students</Text>
          </View>
        </View>

        <TextInput
          style={styles.searchInput}
          placeholder="Search courses..."
          placeholderTextColor="#555b7a"
          value={search}
          onChangeText={setSearch}
        />

        <Text style={styles.sectionTitle}>All Courses ({filtered.length})</Text>
        {loading ? (
          <ActivityIndicator color="#4f46e5" />
        ) : filtered.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No courses yet. Add one!</Text>
          </View>
        ) : (
          filtered.map((course) => (
            <View key={course.id} style={styles.courseCard}>
              <View style={styles.courseHeader}>
                <View style={styles.codeBadge}>
                  <Text style={styles.codeBadgeText}>{course.courseCode}</Text>
                </View>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>
                    {course.status || "Active"}
                  </Text>
                </View>
              </View>
              <Text style={styles.courseName}>{course.courseName}</Text>
              <View style={styles.details}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailIcon}>👨‍🏫</Text>
                  <Text style={styles.detailText}>
                    {course.lecturerName || "TBA"}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailIcon}>👥</Text>
                  <Text style={styles.detailText}>
                    {course.totalStudents || 0} Students
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailIcon}>📅</Text>
                  <Text style={styles.detailText}>
                    Semester {course.semester || "N/A"}
                  </Text>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Add New Course</Text>
            {[
              { key: "courseName", placeholder: "Course Name *" },
              { key: "courseCode", placeholder: "Course Code *" },
              { key: "lecturerName", placeholder: "Assign Lecturer" },
              { key: "semester", placeholder: "Semester", keyboard: "numeric" },
              {
                key: "totalStudents",
                placeholder: "Total Students",
                keyboard: "numeric",
              },
            ].map((field) => (
              <TextInput
                key={field.key}
                style={styles.modalInput}
                placeholder={field.placeholder}
                placeholderTextColor="#555b7a"
                value={newCourse[field.key]}
                onChangeText={(v) =>
                  setNewCourse((p) => ({ ...p, [field.key]: v }))
                }
                keyboardType={field.keyboard || "default"}
              />
            ))}
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.submitBtn,
                  saving && { backgroundColor: "#3730a3" },
                ]}
                onPress={handleAddCourse}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitText}>Add Course</Text>
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
  courseCard: {
    backgroundColor: "#1a1f3c",
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 0.5,
    borderColor: "#2a2f5c",
  },
  courseHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  codeBadge: {
    backgroundColor: "#4f46e5",
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  codeBadgeText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  statusBadge: {
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderWidth: 0.5,
    borderColor: "#10b981",
  },
  statusText: { color: "#10b981", fontSize: 12, fontWeight: "600" },
  courseName: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  details: { gap: 6 },
  detailRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  detailIcon: { fontSize: 14 },
  detailText: { color: "#9ca3af", fontSize: 13 },
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
