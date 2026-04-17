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
import {
  addCourse,
  assignLecturersToCourse,
  assignStudentsToCourse,
  getAllCourses,
  getAllLecturers,
  getAllStudents,
} from "../../config/firestore";

export default function PLCourses() {
  const [courses, setCourses] = useState([]);
  const [lecturers, setLecturers] = useState([]);
  const [students, setStudents] = useState([]);

  const [selectedLecturers, setSelectedLecturers] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);

  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  const [newCourse, setNewCourse] = useState({
    courseName: "",
    courseCode: "",
    semester: "",
  });

  useEffect(() => {
    loadCourses();
    loadUsers();
  }, []);

  const loadCourses = async () => {
    const data = await getAllCourses();
    setCourses(data);
    setLoading(false);
  };

  const loadUsers = async () => {
    setLecturers(await getAllLecturers());
    setStudents(await getAllStudents());
  };

  const toggleSelect = (id, list, setList) => {
    setList(list.includes(id) ? list.filter((i) => i !== id) : [...list, id]);
  };

  const handleAddCourse = useCallback(async () => {
    if (!newCourse.courseName || !newCourse.courseCode) {
      Alert.alert("Error", "Course name & code required");
      return;
    }

    setSaving(true);
    try {
      const ref = await addCourse({
        ...newCourse,
        semester: parseInt(newCourse.semester) || 1,
      });

      await assignLecturersToCourse(ref.id, selectedLecturers);
      await assignStudentsToCourse(ref.id, selectedStudents);

      Alert.alert("Success", "Course created");

      setModalVisible(false);
      setSelectedLecturers([]);
      setSelectedStudents([]);
      setNewCourse({ courseName: "", courseCode: "", semester: "" });

      loadCourses();
    } catch (e) {
      Alert.alert("Error", "Failed");
    }
    setSaving(false);
  }, [newCourse, selectedLecturers, selectedStudents]);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container}>
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backBtn}>‹ Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Courses</Text>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => setModalVisible(true)}
          >
            <Text style={styles.addText}>+ Add</Text>
          </TouchableOpacity>
        </View>

        {/* COURSE LIST */}
        {loading ? (
          <ActivityIndicator color="#4f46e5" />
        ) : (
          courses.map((c) => (
            <View key={c.id} style={styles.card}>
              <Text style={styles.courseName}>{c.courseName}</Text>
              <Text style={styles.code}>{c.courseCode}</Text>
            </View>
          ))
        )}
      </ScrollView>

      {/* MODAL */}
      <Modal visible={modalVisible} animationType="slide">
        <SafeAreaView style={styles.modalContainer}>
          <ScrollView>
            <Text style={styles.modalTitle}>Create Course</Text>

            {/* COURSE INFO */}
            <TextInput
              style={styles.input}
              placeholder="Course Name"
              placeholderTextColor="#777"
              value={newCourse.courseName}
              onChangeText={(v) =>
                setNewCourse((p) => ({ ...p, courseName: v }))
              }
            />

            <TextInput
              style={styles.input}
              placeholder="Course Code"
              placeholderTextColor="#777"
              value={newCourse.courseCode}
              onChangeText={(v) =>
                setNewCourse((p) => ({ ...p, courseCode: v }))
              }
            />

            {/* LECTURERS */}
            <Text style={styles.section}>Select Lecturers</Text>
            <View style={styles.box}>
              {lecturers.map((l) => (
                <TouchableOpacity
                  key={l.id}
                  style={styles.row}
                  onPress={() =>
                    toggleSelect(l.id, selectedLecturers, setSelectedLecturers)
                  }
                >
                  <Text style={styles.rowText}>{l.name}</Text>
                  <View
                    style={[
                      styles.checkbox,
                      selectedLecturers.includes(l.id) && styles.checkboxActive,
                    ]}
                  />
                </TouchableOpacity>
              ))}
            </View>

            {/* STUDENTS */}
            <Text style={styles.section}>Select Students</Text>
            <View style={styles.box}>
              {students.map((s) => (
                <TouchableOpacity
                  key={s.id}
                  style={styles.row}
                  onPress={() =>
                    toggleSelect(s.id, selectedStudents, setSelectedStudents)
                  }
                >
                  <Text style={styles.rowText}>{s.name}</Text>
                  <View
                    style={[
                      styles.checkbox,
                      selectedStudents.includes(s.id) && styles.checkboxGreen,
                    ]}
                  />
                </TouchableOpacity>
              ))}
            </View>

            {/* ACTIONS */}
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.cancel}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.save} onPress={handleAddCourse}>
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveText}>Create</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

/* STYLES */
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0a0f2c" },
  container: { padding: 20 },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  backBtn: { color: "#4f46e5" },
  title: { color: "#fff", fontSize: 18, fontWeight: "700" },
  addBtn: { backgroundColor: "#4f46e5", padding: 10, borderRadius: 10 },
  addText: { color: "#fff" },

  card: {
    backgroundColor: "#1a1f3c",
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
  },
  courseName: { color: "#fff", fontSize: 16 },
  code: { color: "#aaa" },

  modalContainer: { flex: 1, backgroundColor: "#0a0f2c", padding: 20 },
  modalTitle: { color: "#fff", fontSize: 20, marginBottom: 15 },

  input: {
    backgroundColor: "#1a1f3c",
    color: "#fff",
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
  },

  section: { color: "#fff", marginTop: 15, marginBottom: 5 },

  box: {
    backgroundColor: "#1a1f3c",
    borderRadius: 10,
    padding: 10,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
  },
  rowText: { color: "#fff" },

  checkbox: {
    width: 18,
    height: 18,
    borderWidth: 1,
    borderColor: "#555",
    borderRadius: 4,
  },
  checkboxActive: { backgroundColor: "#4f46e5" },
  checkboxGreen: { backgroundColor: "#10b981" },

  actions: { flexDirection: "row", marginTop: 20 },
  cancel: { flex: 1, alignItems: "center", padding: 12 },
  cancelText: { color: "#aaa" },
  save: {
    flex: 1,
    backgroundColor: "#4f46e5",
    alignItems: "center",
    padding: 12,
    borderRadius: 10,
  },
  saveText: { color: "#fff" },
});
