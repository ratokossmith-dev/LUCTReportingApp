import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../config/AuthContext";
import {
  getClassesByLecturer,
  getEnrollmentsByClass,
  saveAttendance,
} from "../../config/firestore";

export default function LecturerAttendance() {
  const { profile } = useAuth();
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [attendance, setAttendance] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const date = new Date().toLocaleDateString("en-GB");

  useEffect(() => {
    if (!profile?.id) return;
    (async () => {
      try {
        const c = await getClassesByLecturer(profile.id);
        setClasses(c);
      } catch (e) {
        console.log("Attendance load error:", e);
      }
      setLoading(false);
    })();
  }, [profile]);

  const handleClassSelect = async (cls) => {
    setSelectedClass(cls);
    setStudents([]);
    setAttendance({});
    setSearch("");
    setLoadingStudents(true);
    try {
      const enrollments = await getEnrollmentsByClass(cls.id);
      if (enrollments.length > 0) {
        const enrolled = enrollments
          .map((e) => ({
            id: e.studentId,
            name: e.studentName || "Unknown",
            email: e.studentEmail || "",
          }))
          .filter((s) => s.id);
        setStudents(enrolled);

        // Initialize attendance as all false (absent)
        const initialAttendance = {};
        enrolled.forEach((st) => {
          initialAttendance[st.id] = false;
        });
        setAttendance(initialAttendance);
      } else {
        setStudents([]);
        setAttendance({});
      }
    } catch (e) {
      console.log("Load enrolled students error:", e);
      setStudents([]);
      setAttendance({});
    }
    setLoadingStudents(false);
  };

  // FIXED: Toggle function that properly updates attendance
  const toggleAttendance = useCallback((studentId) => {
    setAttendance((prev) => ({
      ...prev,
      [studentId]: !prev[studentId],
    }));
  }, []);

  const markAll = (value) => {
    const newAttendance = {};
    students.forEach((st) => {
      newAttendance[st.id] = value;
    });
    setAttendance(newAttendance);
  };

  const handleSave = async () => {
    if (!selectedClass) {
      Alert.alert("Error", "Please select a class");
      return;
    }
    if (students.length === 0) {
      Alert.alert("Error", "No students enrolled in this class");
      return;
    }

    setSaving(true);
    try {
      // Save attendance for each student
      for (const st of students) {
        const isPresent = attendance[st.id] || false;
        await saveAttendance({
          studentId: st.id,
          studentName: st.name,
          classId: selectedClass.id,
          className: selectedClass.className,
          courseName: selectedClass.courseName,
          courseCode: selectedClass.courseCode,
          lecturerId: profile.id,
          lecturerName: profile.name,
          present: isPresent,
          date,
        });
      }

      const presentCount = Object.values(attendance).filter(Boolean).length;
      Alert.alert(
        "Success! ✅",
        `Attendance saved for ${students.length} students.\n\nPresent: ${presentCount}\nAbsent: ${students.length - presentCount}`,
        [
          {
            text: "OK",
            onPress: () => {
              // Reset attendance after save
              const resetAttendance = {};
              students.forEach((st) => {
                resetAttendance[st.id] = false;
              });
              setAttendance(resetAttendance);
            },
          },
        ],
      );
    } catch (e) {
      console.log("Save error:", e);
      Alert.alert("Error", "Failed to save attendance: " + e.message);
    }
    setSaving(false);
  };

  const presentCount = Object.values(attendance).filter(Boolean).length;
  const filteredStudents = students.filter(
    (st) =>
      !search ||
      (st.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (st.email || "").toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <View style={s.safe}>
      <ScrollView
        style={s.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={s.back}>‹ Back</Text>
          </TouchableOpacity>
          <Text style={s.title}>Mark Attendance</Text>
          <View style={{ width: 50 }} />
        </View>

        <View style={s.statsRow}>
          <View style={s.statBox}>
            <Text style={[s.statVal, { color: "#10b981" }]}>
              {presentCount}
            </Text>
            <Text style={s.statLabel}>Present</Text>
          </View>
          <View style={s.statBox}>
            <Text style={[s.statVal, { color: "#ef4444" }]}>
              {students.length - presentCount}
            </Text>
            <Text style={s.statLabel}>Absent</Text>
          </View>
          <View style={s.statBox}>
            <Text style={[s.statVal, { color: "#4f46e5" }]}>
              {students.length}
            </Text>
            <Text style={s.statLabel}>Total</Text>
          </View>
        </View>

        <Text style={s.section}>1. Select Class</Text>
        {loading ? (
          <ActivityIndicator color="#4f46e5" />
        ) : classes.length === 0 ? (
          <View style={s.empty}>
            <Text style={s.emptyText}>
              No classes found. Add a class first.
            </Text>
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginBottom: 16 }}
          >
            {classes.map((cls) => (
              <TouchableOpacity
                key={cls.id}
                style={[
                  s.classBtn,
                  selectedClass?.id === cls.id && s.classBtnActive,
                ]}
                onPress={() => handleClassSelect(cls)}
              >
                <Text
                  style={[
                    s.classText,
                    selectedClass?.id === cls.id && s.classTextActive,
                  ]}
                >
                  {cls.className}
                </Text>
                <Text
                  style={[
                    s.classSub,
                    selectedClass?.id === cls.id && {
                      color: "rgba(255,255,255,0.7)",
                    },
                  ]}
                >
                  {cls.day}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {selectedClass && (
          <>
            <View style={s.dateBox}>
              <Text style={s.dateLabel}>📅 Date: {date}</Text>
              <Text style={s.classInfo}>
                {selectedClass.className} • {selectedClass.courseName}
              </Text>
            </View>

            <Text style={s.section}>2. Mark Students (Tap to toggle)</Text>

            {loadingStudents ? (
              <View style={s.loadingBox}>
                <ActivityIndicator color="#4f46e5" />
                <Text style={s.loadingText}>Loading enrolled students...</Text>
              </View>
            ) : students.length === 0 ? (
              <View style={s.empty}>
                <Text style={s.emptyIcon}>👥</Text>
                <Text style={s.emptyTitle}>No students enrolled yet</Text>
                <Text style={s.emptyText}>
                  Students will be automatically enrolled when they register.
                </Text>
              </View>
            ) : (
              <>
                <TextInput
                  style={s.input}
                  placeholder="Search students..."
                  placeholderTextColor="#555b7a"
                  value={search}
                  onChangeText={setSearch}
                />

                <View style={s.markAllRow}>
                  <TouchableOpacity
                    style={s.markAllBtn}
                    onPress={() => markAll(true)}
                  >
                    <Text style={s.markAllText}>✓ Mark All Present</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[s.markAllBtn, s.markAllAbsent]}
                    onPress={() => markAll(false)}
                  >
                    <Text style={[s.markAllText, { color: "#ef4444" }]}>
                      ✗ Mark All Absent
                    </Text>
                  </TouchableOpacity>
                </View>

                <Text style={s.studentCount}>
                  {filteredStudents.length} students enrolled
                </Text>

                {filteredStudents.map((st) => (
                  <TouchableOpacity
                    key={st.id}
                    style={[
                      s.studentCard,
                      attendance[st.id] === true && s.studentCardPresent,
                    ]}
                    onPress={() => toggleAttendance(st.id)}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        s.avatar,
                        attendance[st.id] === true && s.avatarPresent,
                      ]}
                    >
                      <Text style={s.avatarText}>
                        {st.name?.charAt(0)?.toUpperCase() || "S"}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.studentName}>{st.name}</Text>
                      <Text style={s.studentEmail}>{st.email}</Text>
                    </View>
                    <View
                      style={[
                        s.badge,
                        attendance[st.id] === true
                          ? s.badgePresent
                          : s.badgeAbsent,
                      ]}
                    >
                      <Text
                        style={[
                          s.badgeText,
                          attendance[st.id] === true
                            ? s.textPresent
                            : s.textAbsent,
                        ]}
                      >
                        {attendance[st.id] === true ? "✓ Present" : "✗ Absent"}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}

                <TouchableOpacity
                  style={[s.saveBtn, saving && s.saveBtnDisabled]}
                  onPress={handleSave}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={s.saveBtnText}>
                      Save Attendance ({presentCount}/{students.length})
                    </Text>
                  )}
                </TouchableOpacity>
              </>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0a0f2c" },
  container: { flex: 1, padding: 20 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
    marginTop: 16,
  },
  back: { color: "#4f46e5", fontSize: 18, fontWeight: "600", width: 50 },
  title: { color: "#fff", fontSize: 18, fontWeight: "700" },
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
  statVal: { fontSize: 24, fontWeight: "700" },
  statLabel: { color: "#6b7280", fontSize: 11, marginTop: 4 },
  section: { color: "#fff", fontSize: 15, fontWeight: "600", marginBottom: 12 },
  empty: {
    backgroundColor: "#1a1f3c",
    borderRadius: 14,
    padding: 28,
    alignItems: "center",
    borderWidth: 0.5,
    borderColor: "#2a2f5c",
    marginBottom: 16,
  },
  emptyIcon: { fontSize: 32, marginBottom: 8 },
  emptyTitle: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  emptyText: {
    color: "#6b7280",
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
  },
  classBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: "#2a2f5c",
    marginRight: 10,
    backgroundColor: "#1a1f3c",
    minWidth: 80,
    alignItems: "center",
  },
  classBtnActive: { backgroundColor: "#4f46e5", borderColor: "#4f46e5" },
  classText: { color: "#6b7280", fontSize: 13, fontWeight: "600" },
  classTextActive: { color: "#fff" },
  classSub: { color: "#6b7280", fontSize: 10, marginTop: 2 },
  dateBox: {
    backgroundColor: "#1a1f3c",
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    borderWidth: 0.5,
    borderColor: "#2a2f5c",
  },
  dateLabel: { color: "#fff", fontSize: 14, fontWeight: "600" },
  classInfo: { color: "#6b7280", fontSize: 12, marginTop: 4 },
  loadingBox: {
    backgroundColor: "#1a1f3c",
    borderRadius: 14,
    padding: 24,
    alignItems: "center",
    borderWidth: 0.5,
    borderColor: "#2a2f5c",
    marginBottom: 16,
    gap: 12,
  },
  loadingText: { color: "#6b7280", fontSize: 13 },
  input: {
    backgroundColor: "#1a1f3c",
    borderRadius: 12,
    padding: 12,
    color: "#fff",
    marginBottom: 14,
    borderWidth: 0.5,
    borderColor: "#2a2f5c",
    fontSize: 14,
  },
  markAllRow: { flexDirection: "row", gap: 10, marginBottom: 14 },
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
  studentCount: { color: "#6b7280", fontSize: 12, marginBottom: 10 },
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
  studentCardPresent: { borderColor: "#10b981", backgroundColor: "#1a2a1f" },
  avatar: {
    width: 40,
    height: 40,
    backgroundColor: "#2a2f5c",
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  avatarPresent: { backgroundColor: "#10b981" },
  avatarText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  studentName: { color: "#fff", fontSize: 14, fontWeight: "600" },
  studentEmail: { color: "#6b7280", fontSize: 11, marginTop: 2 },
  badge: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 0.5,
    alignItems: "center",
  },
  badgePresent: {
    borderColor: "#10b981",
    backgroundColor: "rgba(16,185,129,0.1)",
  },
  badgeAbsent: {
    borderColor: "#ef4444",
    backgroundColor: "rgba(239,68,68,0.05)",
  },
  badgeText: { fontSize: 12, fontWeight: "600" },
  textPresent: { color: "#10b981" },
  textAbsent: { color: "#ef4444" },
  saveBtn: {
    backgroundColor: "#4f46e5",
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    marginBottom: 32,
    marginTop: 8,
  },
  saveBtnDisabled: { backgroundColor: "#3730a3" },
  saveBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
