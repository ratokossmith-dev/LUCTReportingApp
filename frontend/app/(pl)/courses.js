import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
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
} from 'react-native';
import {
  addCourse,
  assignLecturersToCourse,
  assignStudentsToCourse,
  getAllCourses,
  getAllLecturers,
  getAllStudents,
  deleteCourse,
} from '../../config/firestore';

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
    courseName: '',
    courseCode: '',
    semester: '',
  });

  useEffect(() => {
    loadCourses();
    loadUsers();
  }, []);

  const loadCourses = async () => {
    try {
      const data = await getAllCourses();
      setCourses(data);
    } catch (e) {
      console.log('Load courses error:', e);
    }
    setLoading(false);
  };

  const loadUsers = async () => {
    try {
      setLecturers(await getAllLecturers());
      setStudents(await getAllStudents());
    } catch (e) {
      console.log('Load users error:', e);
    }
  };

  const toggleSelect = (id, list, setList) => {
    setList(list.includes(id) ? list.filter((i) => i !== id) : [...list, id]);
  };

  const handleDeleteCourse = (courseId, courseName) => {
    Alert.alert(
      'Delete Course',
      `Are you sure you want to delete "${courseName}"? This will also delete all classes and attendance records.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCourse(courseId);
              Alert.alert('Success', 'Course deleted successfully');
              loadCourses();
            } catch (e) {
              console.log('Delete course error:', e);
              Alert.alert('Delete Failed', e.message || 'Unknown error');
            }
          },
        },
      ]
    );
  };

  const handleAddCourse = useCallback(async () => {
    if (!newCourse.courseName || !newCourse.courseCode) {
      Alert.alert('Error', 'Course name and code required');
      return;
    }
    setSaving(true);
    try {
      const response = await addCourse({
        ...newCourse,
        semester: parseInt(newCourse.semester) || 1,
      });

      // Backend returns { id, ...courseData }
      const courseId = response.id;

      if (selectedLecturers.length > 0) {
        await assignLecturersToCourse(courseId, selectedLecturers);
      }
      if (selectedStudents.length > 0) {
        await assignStudentsToCourse(courseId, selectedStudents);
      }

      Alert.alert('Success', 'Course created successfully');
      setModalVisible(false);
      setSelectedLecturers([]);
      setSelectedStudents([]);
      setNewCourse({ courseName: '', courseCode: '', semester: '' });
      loadCourses();
    } catch (e) {
      console.log('Add course error:', e);
      Alert.alert('Error', e.message || 'Failed to create course');
    }
    setSaving(false);
  }, [newCourse, selectedLecturers, selectedStudents]);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backBtn}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Courses</Text>
          <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
            <Text style={styles.addText}>+ Add</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: '#4f46e5' }]}>{courses.length}</Text>
            <Text style={styles.statLabel}>Total Courses</Text>
          </View>
        </View>

        {loading ? (
          <ActivityIndicator color="#4f46e5" />
        ) : courses.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No courses found</Text>
          </View>
        ) : (
          courses.map((c) => (
            <View key={c.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.courseName}>{c.courseName}</Text>
                  <Text style={styles.code}>{c.courseCode}</Text>
                  <Text style={styles.meta}>
                    Lecturers: {c.lecturerIds?.length || 0} | Students: {c.studentIds?.length || 0}
                  </Text>
                </View>
                <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDeleteCourse(c.id, c.courseName)}>
                  <Text style={styles.deleteBtnText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <Modal visible={modalVisible} animationType="slide">
        <SafeAreaView style={styles.modalContainer}>
          <ScrollView>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Course</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.modalClose}>X</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Course Name *"
              placeholderTextColor="#777"
              value={newCourse.courseName}
              onChangeText={(v) => setNewCourse((p) => ({ ...p, courseName: v }))}
            />

            <TextInput
              style={styles.input}
              placeholder="Course Code *"
              placeholderTextColor="#777"
              value={newCourse.courseCode}
              onChangeText={(v) => setNewCourse((p) => ({ ...p, courseCode: v }))}
            />

            <TextInput
              style={styles.input}
              placeholder="Semester (optional)"
              placeholderTextColor="#777"
              value={newCourse.semester}
              onChangeText={(v) => setNewCourse((p) => ({ ...p, semester: v }))}
              keyboardType="numeric"
            />

            <Text style={styles.section}>
              Select Lecturers ({selectedLecturers.length} selected)
            </Text>
            <View style={styles.box}>
              {lecturers.length === 0 ? (
                <Text style={styles.noItemText}>No lecturers available</Text>
              ) : (
                lecturers.map((l) => (
                  <TouchableOpacity
                    key={l.id}
                    style={styles.row}
                    onPress={() => toggleSelect(l.id, selectedLecturers, setSelectedLecturers)}
                  >
                    <Text style={styles.rowText}>{l.name}</Text>
                    <View style={[styles.checkbox, selectedLecturers.includes(l.id) && styles.checkboxActive]}>
                      {selectedLecturers.includes(l.id) && <Text style={styles.checkMark}>✓</Text>}
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </View>

            <Text style={styles.section}>
              Select Students ({selectedStudents.length} selected)
            </Text>
            <View style={styles.box}>
              {students.length === 0 ? (
                <Text style={styles.noItemText}>No students available</Text>
              ) : (
                students.map((s) => (
                  <TouchableOpacity
                    key={s.id}
                    style={styles.row}
                    onPress={() => toggleSelect(s.id, selectedStudents, setSelectedStudents)}
                  >
                    <Text style={styles.rowText}>{s.name}</Text>
                    <View style={[styles.checkbox, selectedStudents.includes(s.id) && styles.checkboxGreen]}>
                      {selectedStudents.includes(s.id) && <Text style={styles.checkMark}>✓</Text>}
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </View>

            <View style={styles.actions}>
              <TouchableOpacity style={styles.cancel} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.save, saving && { opacity: 0.7 }]} onPress={handleAddCourse} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>Create Course</Text>}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0a0f2c' },
  container: { padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, marginTop: 16 },
  backBtn: { color: '#4f46e5', fontSize: 18, fontWeight: '600' },
  title: { color: '#fff', fontSize: 18, fontWeight: '700' },
  addBtn: { backgroundColor: '#4f46e5', padding: 10, borderRadius: 10 },
  addText: { color: '#fff', fontWeight: '600' },
  statsRow: { marginBottom: 16 },
  statBox: { backgroundColor: '#1a1f3c', borderRadius: 14, padding: 16, alignItems: 'center', borderWidth: 0.5, borderColor: '#2a2f5c' },
  statValue: { fontSize: 28, fontWeight: '700' },
  statLabel: { color: '#6b7280', fontSize: 12, marginTop: 4 },
  emptyBox: { backgroundColor: '#1a1f3c', borderRadius: 14, padding: 24, alignItems: 'center', borderWidth: 0.5, borderColor: '#2a2f5c' },
  emptyText: { color: '#6b7280', fontSize: 14 },
  card: { backgroundColor: '#1a1f3c', padding: 15, borderRadius: 12, marginBottom: 10, borderWidth: 0.5, borderColor: '#2a2f5c' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  courseName: { color: '#fff', fontSize: 16, fontWeight: '600' },
  code: { color: '#4f46e5', fontSize: 13, marginTop: 2 },
  meta: { color: '#6b7280', fontSize: 11, marginTop: 4 },
  deleteBtn: { backgroundColor: '#ef4444', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  deleteBtnText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  modalContainer: { flex: 1, backgroundColor: '#0a0f2c', padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { color: '#fff', fontSize: 20, fontWeight: '700' },
  modalClose: { color: '#6b7280', fontSize: 18, padding: 4 },
  input: { backgroundColor: '#1a1f3c', color: '#fff', padding: 12, borderRadius: 10, marginBottom: 10, borderWidth: 0.5, borderColor: '#2a2f5c' },
  section: { color: '#fff', marginTop: 15, marginBottom: 8, fontWeight: '600', fontSize: 14 },
  box: { backgroundColor: '#1a1f3c', borderRadius: 10, padding: 10, borderWidth: 0.5, borderColor: '#2a2f5c' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: '#2a2f5c' },
  rowText: { color: '#fff', fontSize: 14 },
  checkbox: { width: 22, height: 22, borderWidth: 1, borderColor: '#555', borderRadius: 4, alignItems: 'center', justifyContent: 'center' },
  checkboxActive: { backgroundColor: '#4f46e5', borderColor: '#4f46e5' },
  checkboxGreen: { backgroundColor: '#10b981', borderColor: '#10b981' },
  checkMark: { color: '#fff', fontSize: 12, fontWeight: '700' },
  noItemText: { color: '#6b7280', fontSize: 13, padding: 8 },
  actions: { flexDirection: 'row', marginTop: 24, marginBottom: 40, gap: 10 },
  cancel: { flex: 1, alignItems: 'center', padding: 14, borderRadius: 10, borderWidth: 0.5, borderColor: '#2a2f5c' },
  cancelText: { color: '#aaa', fontWeight: '600' },
  save: { flex: 1, backgroundColor: '#4f46e5', alignItems: 'center', padding: 14, borderRadius: 10 },
  saveText: { color: '#fff', fontWeight: '600' },
});