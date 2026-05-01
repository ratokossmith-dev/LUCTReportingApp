import { router } from "expo-router";
import { useEffect, useState } from "react";
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
    getAvailableCoursesForLecturer,
    getStudentsNotInCourse,
    lecturerAddStudentToCourse
} from "../../config/firestore";

export default function ManageStudents() {
  const { profile } = useAuth();
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [students, setStudents] = useState([]);
  const [availableStudents, setAvailableStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [search, setSearch] = useState("");
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    loadCourses();
  }, [profile]);

  const loadCourses = async () => {
    setLoading(true);
    try {
      const coursesData = await getAvailableCoursesForLecturer(profile.id);
      setCourses(coursesData);
    } catch (e) {
      console.log("Load courses error:", e);
      Alert.alert("Error", "Failed to load courses");
    }
    setLoading(false);
  };

  const selectCourse = async (course) => {
    setSelectedCourse(course);
    setModalVisible(true);
    setLoading(true);
    try {
      const studentsNotEnrolled = await getStudentsNotInCourse(course.id);
      setAvailableStudents(studentsNotEnrolled);
    } catch (e) {
      console.log("Load students error:", e);
    }
    setLoading(false);
  };

  const addStudentToCourse = async (student) => {
    setAdding(true);
    try {
      await lecturerAddStudentToCourse(
        selectedCourse.id,
        student.id,
        profile.id,
      );
      Alert.alert(
        "Success",
        `${student.name} has been added to ${selectedCourse.courseName}`,
      );

      // Refresh available students
      const updatedStudents = await getStudentsNotInCourse(selectedCourse.id);
      setAvailableStudents(updatedStudents);
    } catch (e) {
      Alert.alert("Error", e.message || "Failed to add student");
    }
    setAdding(false);
  };

  const filteredStudents = availableStudents.filter(
    (s) =>
      !search ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <View style={s.safe}>
      <ScrollView style={s.container}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={s.back}>‹ Back</Text>
          </TouchableOpacity>
          <Text style={s.title}>Manage Students</Text>
          <View style={{ width: 50 }} />
        </View>

        <Text style={s.subtitle}>
          Select a course to manage student enrollment
        </Text>

        {loading && !selectedCourse ? (
          <ActivityIndicator color="#4f46e5" />
        ) : courses.length === 0 ? (
          <View style={s.emptyCard}>
            <Text style={s.emptyText}>No courses assigned to you yet</Text>
          </View>
        ) : (
          courses.map((course) => (
            <TouchableOpacity
              key={course.id}
              style={s.courseCard}
              onPress={() => selectCourse(course)}
            >
              <Text style={s.courseCode}>{course.courseCode}</Text>
              <Text style={s.courseName}>{course.courseName}</Text>
              <Text style={s.courseStats}>
                👥 {course.studentIds?.length || 0} students enrolled
              </Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Modal for adding students */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Add Students</Text>
              <Text style={s.modalSubtitle}>
                {selectedCourse?.courseCode} - {selectedCourse?.courseName}
              </Text>
              <TouchableOpacity
                style={s.closeBtn}
                onPress={() => {
                  setModalVisible(false);
                  setSelectedCourse(null);
                  setSearch("");
                }}
              >
                <Text style={s.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={s.searchInput}
              placeholder="Search students..."
              placeholderTextColor="#555b7a"
              value={search}
              onChangeText={setSearch}
            />

            <ScrollView style={s.studentList}>
              {loading ? (
                <ActivityIndicator color="#4f46e5" />
              ) : availableStudents.length === 0 ? (
                <View style={s.emptyCard}>
                  <Text style={s.emptyText}>
                    All students are already enrolled
                  </Text>
                </View>
              ) : (
                filteredStudents.map((student) => (
                  <View key={student.id} style={s.studentCard}>
                    <View style={s.studentInfo}>
                      <View style={s.avatar}>
                        <Text style={s.avatarText}>
                          {student.name?.charAt(0) || "S"}
                        </Text>
                      </View>
                      <View>
                        <Text style={s.studentName}>{student.name}</Text>
                        <Text style={s.studentEmail}>{student.email}</Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={[s.addBtn, adding && s.addBtnDisabled]}
                      onPress={() => addStudentToCourse(student)}
                      disabled={adding}
                    >
                      <Text style={s.addBtnText}>+ Add</Text>
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    marginBottom: 20,
    marginTop: 16,
  },
  back: { color: "#4f46e5", fontSize: 18, fontWeight: "600", width: 50 },
  title: { color: "#fff", fontSize: 18, fontWeight: "700" },
  subtitle: { color: "#6b7280", fontSize: 14, marginBottom: 20 },
  courseCard: {
    backgroundColor: "#1a1f3c",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 0.5,
    borderColor: "#2a2f5c",
  },
  courseCode: { color: "#4f46e5", fontSize: 12, fontWeight: "600" },
  courseName: { color: "#fff", fontSize: 16, fontWeight: "600", marginTop: 4 },
  courseStats: { color: "#6b7280", fontSize: 12, marginTop: 8 },
  emptyCard: {
    backgroundColor: "#1a1f3c",
    borderRadius: 14,
    padding: 24,
    alignItems: "center",
  },
  emptyText: { color: "#6b7280", fontSize: 14 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#1a1f3c",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: "90%",
  },
  modalHeader: {
    marginBottom: 16,
  },
  modalTitle: { color: "#fff", fontSize: 20, fontWeight: "700" },
  modalSubtitle: { color: "#6b7280", fontSize: 13, marginTop: 4 },
  closeBtn: {
    position: "absolute",
    top: 0,
    right: 0,
    padding: 8,
  },
  closeBtnText: { color: "#6b7280", fontSize: 20 },
  searchInput: {
    backgroundColor: "#0a0f2c",
    borderRadius: 12,
    padding: 12,
    color: "#fff",
    marginBottom: 16,
    borderWidth: 0.5,
    borderColor: "#2a2f5c",
  },
  studentList: { maxHeight: 500 },
  studentCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#0a0f2c",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  studentInfo: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  avatar: {
    width: 40,
    height: 40,
    backgroundColor: "#4f46e5",
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  studentName: { color: "#fff", fontSize: 14, fontWeight: "600" },
  studentEmail: { color: "#6b7280", fontSize: 12, marginTop: 2 },
  addBtn: {
    backgroundColor: "#10b981",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addBtnDisabled: { backgroundColor: "#6b7280" },
  addBtnText: { color: "#fff", fontWeight: "600" },
});
