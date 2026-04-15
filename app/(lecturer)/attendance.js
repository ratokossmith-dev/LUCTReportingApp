import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../config/AuthContext";
import {
  getAllStudents,
  getAttendanceByClass,
  getClassesByLecturer,
  saveAttendance,
} from "../../config/firestore";

export default function AttendanceScreen() {
  const { profile } = useAuth();
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [attendance, setAttendance] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const date = new Date().toLocaleDateString();

  useEffect(() => {
    if (!profile) return;
    loadClasses();
  }, [profile]);

  // Load lecturer's classes and students for the first class
  const loadClasses = async () => {
    try {
      const c = await getClassesByLecturer(profile.id);
      setClasses(c);
      if (c.length > 0) {
        setSelectedClass(c[0]);
        loadAttendance(c[0].id);
      }
    } catch (e) {
      console.log("Error loading classes:", e);
    }
    setLoading(false);
  };

  // Load attendance for a class
  const loadAttendance = async (classId) => {
    try {
      const attRecords = await getAttendanceByClass(classId);

      // Build students array and attendance map
      const studentsMap = {};
      attRecords.forEach((rec) => {
        studentsMap[rec.studentId] = rec.present;
      });

      // If attendance records exist, use them; otherwise fetch all students
      if (attRecords.length > 0) {
        const studentIds = attRecords.map((a) => a.studentId);
        const allStudents = await getAllStudents();
        const filteredStudents = allStudents.filter((s) =>
          studentIds.includes(s.id),
        );
        setStudents(filteredStudents);
        setAttendance(studentsMap);
      } else {
        const allStudents = await getAllStudents();
        setStudents(allStudents);
        const initialAttendance = {};
        allStudents.forEach((s) => (initialAttendance[s.id] = false));
        setAttendance(initialAttendance);
      }
    } catch (e) {
      console.log("Error loading attendance:", e);
    }
  };

  const toggleAttendance = useCallback((studentId) => {
    setAttendance((prev) => ({
      ...prev,
      [studentId]: !prev[studentId],
    }));
  }, []);

  const markAll = (present) => {
    const newAttendance = {};
    students.forEach((s) => {
      newAttendance[s.id] = present;
    });
    setAttendance(newAttendance);
  };

  const handleSave = async () => {
    if (!selectedClass) {
      Alert.alert("Error", "Please select a class");
      return;
    }
    setSaving(true);
    try {
      const attendanceRecords = students.map((student) => ({
        studentId: student.id,
        studentName: student.name,
        classId: selectedClass.id,
        className: selectedClass.className,
        courseName: selectedClass.courseName,
        courseCode: selectedClass.courseCode,
        lecturerId: profile.id,
        lecturerName: profile.name,
        present: attendance[student.id] || false,
        date,
      }));

      await Promise.all(
        attendanceRecords.map((record) => saveAttendance(record)),
      );

      Alert.alert("Success", "Attendance saved successfully!");
      setAttendance({});
      loadAttendance(selectedClass.id); // reload after saving
    } catch (e) {
      console.log("Error saving attendance:", e);
      Alert.alert("Error", "Failed to save attendance");
    }
    setSaving(false);
  };

  const presentCount = Object.values(attendance).filter(Boolean).length;
  const filteredStudents = students.filter(
    (s) =>
      !search ||
      s.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.email?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backBtn}>‹ Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Attendance</Text>
          <View style={{ width: 50 }} />
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: "#10b981" }]}>
              {presentCount}
            </Text>
            <Text style={styles.statLabel}>Present</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: "#ef4444" }]}>
              {students.length - presentCount}
            </Text>
            <Text style={styles.statLabel}>Absent</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: "#4f46e5" }]}>
              {students.length > 0
                ? Math.round((presentCount / students.length) * 100)
                : 0}
              %
            </Text>
            <Text style={styles.statLabel}>Rate</Text>
          </View>
        </View>

        {/* Class Selection */}
        <Text style={styles.sectionTitle}>Select Class</Text>
        {loading ? (
          <ActivityIndicator color="#4f46e5" />
        ) : classes.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No classes found</Text>
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.classScroll}
          >
            {classes.map((cls) => (
              <TouchableOpacity
                key={cls.id}
                style={[
                  styles.classBtn,
                  selectedClass?.id === cls.id && styles.classBtnActive,
                ]}
                onPress={() => {
                  setSelectedClass(cls);
                  loadAttendance(cls.id);
                }}
              >
                <Text
                  style={[
                    styles.classText,
                    selectedClass?.id === cls.id && styles.classTextActive,
                  ]}
                >
                  {cls.className}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Date */}
        <View style={styles.dateBox}>
          <Text style={styles.dateLabel}>📅 Date</Text>
          <Text style={styles.dateValue}>{date}</Text>
        </View>

        {/* Search */}
        <TextInput
          style={styles.searchInput}
          placeholder="Search students..."
          placeholderTextColor="#555b7a"
          value={search}
          onChangeText={setSearch}
        />

        {/* Mark All */}
        <View style={styles.markAllRow}>
          <TouchableOpacity
            style={styles.markAllBtn}
            onPress={() => markAll(true)}
          >
            <Text style={styles.markAllText}>✓ Mark All Present</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.markAllBtn, styles.markAllAbsent]}
            onPress={() => markAll(false)}
          >
            <Text style={[styles.markAllText, { color: "#ef4444" }]}>
              ✗ Mark All Absent
            </Text>
          </TouchableOpacity>
        </View>

        {/* Students */}
        <Text style={styles.sectionTitle}>
          Students ({filteredStudents.length})
        </Text>
        {filteredStudents.map((student) => (
          <TouchableOpacity
            key={student.id}
            style={[
              styles.studentCard,
              attendance[student.id] && styles.studentCardPresent,
            ]}
            onPress={() => toggleAttendance(student.id)}
          >
            <View style={styles.studentInfo}>
              <View
                style={[
                  styles.studentAvatar,
                  attendance[student.id] && styles.studentAvatarPresent,
                ]}
              >
                <Text style={styles.studentAvatarText}>
                  {student.name?.charAt(0) || "S"}
                </Text>
              </View>
              <View>
                <Text style={styles.studentName}>{student.name}</Text>
                <Text style={styles.studentEmail}>{student.email}</Text>
              </View>
            </View>
            <View
              style={[
                styles.statusBadge,
                attendance[student.id] && styles.statusBadgePresent,
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  attendance[student.id] && styles.statusTextPresent,
                ]}
              >
                {attendance[student.id] ? "✓ Present" : "✗ Absent"}
              </Text>
            </View>
          </TouchableOpacity>
        ))}

        {/* Save */}
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveText}>Save Attendance</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

// Keep your existing styles
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
  statsRow: { flexDirection: "row", gap: 10, marginBottom: 24 },
  statBox: {
    flex: 1,
    backgroundColor: "#1a1f3c",
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    borderWidth: 0.5,
    borderColor: "#2a2f5c",
  },
  statValue: { fontSize: 24, fontWeight: "700" },
  statLabel: { color: "#6b7280", fontSize: 11, marginTop: 4 },
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
    marginBottom: 16,
  },
  emptyText: { color: "#6b7280", fontSize: 14 },
  classScroll: { marginBottom: 16 },
  classBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 0.5,
    borderColor: "#2a2f5c",
    marginRight: 8,
    backgroundColor: "#1a1f3c",
  },
  classBtnActive: { backgroundColor: "#4f46e5", borderColor: "#4f46e5" },
  classText: { color: "#6b7280", fontSize: 13, fontWeight: "500" },
  classTextActive: { color: "#fff" },
  dateBox: {
    backgroundColor: "#1a1f3c",
    borderRadius: 12,
    padding: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
    borderWidth: 0.5,
    borderColor: "#2a2f5c",
  },
  dateLabel: { color: "#6b7280", fontSize: 14 },
  dateValue: { color: "#fff", fontSize: 14, fontWeight: "600" },
  searchInput: {
    backgroundColor: "#1a1f3c",
    borderRadius: 12,
    padding: 12,
    color: "#fff",
    marginBottom: 14,
    borderWidth: 0.5,
    borderColor: "#2a2f5c",
    fontSize: 14,
  },
  markAllRow: { flexDirection: "row", gap: 10, marginBottom: 20 },
  markAllBtn: {
    flex: 1,
    backgroundColor: "#1a1f3c",
    borderRadius: 10,
    padding: 10,
    alignItems: "center",
    borderWidth: 0.5,
    borderColor: "#10b981",
  },
  markAllAbsent: { borderColor: "#ef4444" },
  markAllText: { color: "#10b981", fontSize: 13, fontWeight: "600" },
  studentCard: {
    backgroundColor: "#1a1f3c",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 0.5,
    borderColor: "#2a2f5c",
  },
  studentCardPresent: { borderColor: "#10b981" },
  studentInfo: { flexDirection: "row", alignItems: "center", gap: 12 },
  studentAvatar: {
    width: 40,
    height: 40,
    backgroundColor: "#0a0f2c",
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 0.5,
    borderColor: "#2a2f5c",
  },
  studentAvatarPresent: { backgroundColor: "#10b981", borderColor: "#10b981" },
  studentAvatarText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  studentName: { color: "#fff", fontSize: 14, fontWeight: "600" },
  studentEmail: { color: "#6b7280", fontSize: 12 },
  statusBadge: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: "#0a0f2c",
    borderWidth: 0.5,
    borderColor: "#ef4444",
  },
  statusBadgePresent: { borderColor: "#10b981" },
  statusText: { color: "#ef4444", fontSize: 12, fontWeight: "600" },
  statusTextPresent: { color: "#10b981" },
  saveButton: {
    backgroundColor: "#4f46e5",
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    marginBottom: 32,
    marginTop: 8,
  },
  saveButtonDisabled: { backgroundColor: "#3730a3" },
  saveText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
