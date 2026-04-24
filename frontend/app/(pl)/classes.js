import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../config/AuthContext";
import {
  addClass,
  deleteClass,
  getAvailableCoursesForLecturer,
  getClassesByLecturer,
} from "../../config/firestore";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

export default function LecturerClasses() {
  const { profile } = useAuth();

  const [classes, setClasses] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [dayFilter, setDayFilter] = useState("All");

  const [modal, setModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    className: "",
    courseId: "",
    courseName: "",
    courseCode: "",
    venue: "",
    scheduledTime: "",
    day: "Monday",
  });

  useEffect(() => {
    if (!profile?.id) return;
    loadData();
  }, [profile]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [c, co] = await Promise.all([
        getClassesByLecturer(profile.id),
        getAvailableCoursesForLecturer(profile.id),
      ]);

      setClasses(c || []);
      setCourses(co || []);
    } catch (e) {
      console.log("Load error:", e);
      Alert.alert("Error", "Failed to load data");
    }
    setLoading(false);
  };

  const resetForm = () => {
    setForm({
      className: "",
      courseId: "",
      courseName: "",
      courseCode: "",
      venue: "",
      scheduledTime: "",
      day: "Monday",
    });
  };

  const handleDeleteClass = (classItem) => {
    Alert.alert(
      "Delete Class",
      `Are you sure you want to delete "${classItem.className}"?\n\nThis will also remove all attendance records and enrollments for this class.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteClass(classItem.id);
              Alert.alert("Success", "Class deleted successfully");
              loadData();
            } catch (e) {
              Alert.alert("Error", "Failed to delete class");
            }
          },
        },
      ],
    );
  };

  const handleAdd = useCallback(async () => {
    if (!form.className.trim()) {
      Alert.alert("Error", "Enter class name");
      return;
    }

    if (!form.courseId) {
      Alert.alert("Error", "Select a course");
      return;
    }

    if (!form.venue.trim()) {
      Alert.alert("Error", "Enter venue");
      return;
    }

    if (!form.scheduledTime.trim()) {
      Alert.alert("Error", "Enter scheduled time");
      return;
    }

    const course = courses.find((c) => c.id === form.courseId);
    if (!course) {
      Alert.alert("Error", "Invalid course selected");
      return;
    }

    setSaving(true);

    try {
      await addClass({
        className: form.className.trim(),
        courseId: form.courseId,
        courseName: course.courseName,
        courseCode: course.courseCode,
        venue: form.venue.trim(),
        scheduledTime: form.scheduledTime.trim(),
        day: form.day,
        lecturerId: profile.id,
        lecturerName: profile.name,
        facultyName: profile.facultyName || "Faculty of ICT",
      });

      Alert.alert(
        "Success",
        "Class created! Students enrolled in this course have been automatically added.",
        [
          {
            text: "OK",
            onPress: () => {
              setModal(false);
              resetForm();
              loadData();
            },
          },
        ],
      );
    } catch (e) {
      Alert.alert("Error", e.message || "Failed to add class");
    } finally {
      setSaving(false);
    }
  }, [form, courses, profile]);

  const filtered = classes.filter((c) => {
    const matchDay = dayFilter === "All" || c.day === dayFilter;
    const matchSearch =
      !search ||
      c.className?.toLowerCase().includes(search.toLowerCase()) ||
      c.courseName?.toLowerCase().includes(search.toLowerCase());

    return matchDay && matchSearch;
  });

  return (
    <View style={s.safe}>
      <ScrollView style={s.container} showsVerticalScrollIndicator={false}>
        {/* HEADER */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={s.back}>‹ Back</Text>
          </TouchableOpacity>

          <Text style={s.title}>My Classes</Text>

          <TouchableOpacity style={s.addBtn} onPress={() => setModal(true)}>
            <Text style={s.addBtnText}>+ Add</Text>
          </TouchableOpacity>
        </View>

        {/* STATS */}
        <View style={s.statsRow}>
          <View style={s.statBox}>
            <Text style={s.statVal}>{classes.length}</Text>
            <Text style={s.statLabel}>Classes</Text>
          </View>

          <View style={s.statBox}>
            <Text style={s.statVal}>{courses.length}</Text>
            <Text style={s.statLabel}>Assigned Courses</Text>
          </View>
        </View>

        {/* SEARCH */}
        <TextInput
          style={s.input}
          placeholder="Search classes..."
          placeholderTextColor="#666"
          value={search}
          onChangeText={setSearch}
        />

        {/* FILTER BY DAY */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {["All", ...DAYS].map((d) => (
            <TouchableOpacity
              key={d}
              style={[s.dayBtn, dayFilter === d && s.dayBtnActive]}
              onPress={() => setDayFilter(d)}
            >
              <Text style={s.dayText}>
                {d === "All" ? "All" : d.slice(0, 3)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* LIST */}
        {loading ? (
          <ActivityIndicator color="#4f46e5" />
        ) : filtered.length === 0 ? null : (
          filtered.map((cls) => (
            <View key={cls.id} style={s.card}>
              <View style={s.cardHeader}>
                <Text style={s.badge}>{cls.className}</Text>
                <TouchableOpacity
                  onPress={() => handleDeleteClass(cls)}
                  style={s.deleteBtn}
                >
                  <Text style={s.deleteBtnText}>🗑️ Delete</Text>
                </TouchableOpacity>
              </View>
              <Text style={s.course}>
                {cls.courseCode} - {cls.courseName}
              </Text>

              <Text style={s.detail}>📅 {cls.day}</Text>
              <Text style={s.detail}>🕐 {cls.scheduledTime}</Text>
              <Text style={s.detail}>📍 {cls.venue}</Text>

              <TouchableOpacity
                onPress={() => router.push("/(lecturer)/attendance")}
                style={s.attendanceBtn}
              >
                <Text style={s.attendanceText}>Mark Attendance</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>

      {/* MODAL - Create Class */}
      <Modal visible={modal} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <ScrollView>
            <View style={s.modal}>
              <Text style={s.modalTitle}>Create New Class</Text>
              <Text style={s.modalSubtitle}>
                Select a course and fill in the details
              </Text>

              <Text style={s.label}>Class Name</Text>
              <TextInput
                style={s.input}
                placeholder="e.g., Monday Morning Session"
                placeholderTextColor="#555b7a"
                value={form.className}
                onChangeText={(v) => setForm((p) => ({ ...p, className: v }))}
              />

              <Text style={s.label}>Select Course</Text>

              {courses.length === 0 ? (
                <View style={s.noCoursesBox}>
                  <Text style={s.noCoursesIcon}>📚</Text>
                  <Text style={s.noCoursesText}>Loading courses...</Text>
                </View>
              ) : (
                courses.map((c) => (
                  <TouchableOpacity
                    key={c.id}
                    style={[
                      s.courseItem,
                      form.courseId === c.id && s.courseSelected,
                    ]}
                    onPress={() =>
                      setForm((p) => ({
                        ...p,
                        courseId: c.id,
                        courseName: c.courseName,
                        courseCode: c.courseCode,
                      }))
                    }
                  >
                    <View>
                      <Text style={s.courseCodeText}>{c.courseCode}</Text>
                      <Text style={s.courseNameText}>{c.courseName}</Text>
                      <Text style={s.courseStudentsText}>
                        👥 {c.studentIds?.length || 0} students enrolled
                      </Text>
                    </View>
                    {form.courseId === c.id && (
                      <Text style={s.checkMark}>✓</Text>
                    )}
                  </TouchableOpacity>
                ))
              )}

              <Text style={s.label}>Day of Class</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {DAYS.map((d) => (
                  <TouchableOpacity
                    key={d}
                    style={[s.dayBtn, form.day === d && s.dayBtnActive]}
                    onPress={() => setForm((p) => ({ ...p, day: d }))}
                  >
                    <Text style={s.dayText}>{d.slice(0, 3)}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={s.label}>Time</Text>
              <TextInput
                style={s.input}
                placeholder="e.g., 09:00 AM - 11:00 AM"
                placeholderTextColor="#555b7a"
                value={form.scheduledTime}
                onChangeText={(v) =>
                  setForm((p) => ({ ...p, scheduledTime: v }))
                }
              />

              <Text style={s.label}>Venue</Text>
              <TextInput
                style={s.input}
                placeholder="e.g., Room 301, ICT Building"
                placeholderTextColor="#555b7a"
                value={form.venue}
                onChangeText={(v) => setForm((p) => ({ ...p, venue: v }))}
              />

              <View style={s.row}>
                <TouchableOpacity
                  style={s.cancel}
                  onPress={() => {
                    setModal(false);
                    resetForm();
                  }}
                >
                  <Text style={s.cancelText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[s.save, saving && s.saveDisabled]}
                  onPress={handleAdd}
                  disabled={saving}
                >
                  <Text style={s.saveText}>
                    {saving ? "Creating..." : "Create Class"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

/* ───────────── STYLES ───────────── */
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0a0f2c" },
  container: { padding: 20 },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
    marginBottom: 20,
  },

  back: { color: "#4f46e5", fontSize: 16 },
  title: { color: "#fff", fontSize: 18, fontWeight: "bold" },

  addBtn: { backgroundColor: "#4f46e5", padding: 10, borderRadius: 8 },
  addBtnText: { color: "#fff", fontWeight: "600" },

  statsRow: { flexDirection: "row", gap: 10, marginBottom: 15 },
  statBox: {
    flex: 1,
    backgroundColor: "#1a1f3c",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  statVal: { color: "#fff", fontSize: 20, fontWeight: "bold" },
  statLabel: { color: "#aaa", fontSize: 12, marginTop: 4 },

  input: {
    backgroundColor: "#1a1f3c",
    padding: 12,
    borderRadius: 10,
    color: "#fff",
    marginVertical: 8,
  },

  dayBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#1a1f3c",
    marginRight: 8,
    borderRadius: 8,
  },
  dayBtnActive: { backgroundColor: "#4f46e5" },
  dayText: { color: "#fff", fontSize: 12 },

  card: {
    backgroundColor: "#1a1f3c",
    padding: 15,
    borderRadius: 12,
    marginTop: 10,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },

  badge: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  deleteBtn: {
    backgroundColor: "#ef4444",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  deleteBtnText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  course: { color: "#aaa", marginBottom: 8 },
  detail: { color: "#888", marginBottom: 4 },

  attendanceBtn: {
    marginTop: 10,
    backgroundColor: "#4f46e5",
    padding: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  attendanceText: { color: "#fff", fontWeight: "600" },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "flex-end",
  },

  modal: {
    backgroundColor: "#1a1f3c",
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "90%",
  },

  modalTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 4,
  },
  modalSubtitle: { color: "#6b7280", fontSize: 12, marginBottom: 16 },

  label: { color: "#aaa", marginTop: 12, marginBottom: 4, fontSize: 13 },

  noCoursesBox: {
    backgroundColor: "#0a0f2c",
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
    marginVertical: 10,
  },
  noCoursesIcon: { fontSize: 40, marginBottom: 10 },
  noCoursesText: { color: "#fff", fontWeight: "600", marginBottom: 4 },

  courseItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#0a0f2c",
    marginTop: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#2a2f5c",
  },
  courseSelected: { borderColor: "#4f46e5", backgroundColor: "#1e2350" },
  courseCodeText: { color: "#4f46e5", fontSize: 12, fontWeight: "600" },
  courseNameText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
    marginTop: 2,
  },
  courseStudentsText: { color: "#6b7280", fontSize: 11, marginTop: 4 },
  checkMark: { color: "#10b981", fontSize: 18, fontWeight: "bold" },

  row: { flexDirection: "row", gap: 10, marginTop: 20, marginBottom: 10 },

  cancel: {
    flex: 1,
    backgroundColor: "#2a2f5c",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  cancelText: { color: "#fff" },

  save: {
    flex: 1,
    backgroundColor: "#4f46e5",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  saveDisabled: { backgroundColor: "#3730a3" },
  saveText: { color: "#fff", fontWeight: "600" },
});
