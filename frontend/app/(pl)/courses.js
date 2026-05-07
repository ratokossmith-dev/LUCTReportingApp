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
      `Are you sure you want to delete "${courseName}"? This will also delete all classes, enrollments, and attendance records for this course.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('Deleting course:', courseId);
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
      const ref = await addCourse({
        ...newCourse,
        semester: parseInt(newCourse.semester) || 1,
      });
      await assignLecturersToCourse(ref.id, selectedLecturers);
      await assignStudentsToCourse(ref.id, selectedStudents);
      Alert.alert('Success', 'Course created');
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
                <View>
                  <Text style={styles.courseName}>{c.courseName}</Text>
                  <Text style={styles.code}>{c.courseCode}</Text>
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
            <Text style={styles.modalTitle}>Create Course</Text>

            <TextInput
              style={styles.input}
              placeholder="Course Name"
              placeholderTextColor="#777"
              value={newCourse.courseName}
              onChangeText={(v) => setNewCourse((p) => ({ ...p, courseName: v }))}
            />

            <TextInput
              style={styles.input}
              placeholder="Course Code"
              placeholderTextColor="#777"
              value={newCourse.courseCode}
              onChangeText={(v) => setNewCourse((p) => ({ ...p, courseCode: v }))}
            />

            <Text style={styles.section}>Select Lecturers</Text>
            <View style={styles.box}>
              {lecturers.map((l) => (
                <TouchableOpacity key={l.id} style={styles.row} onPress={() => toggleSelect(l.id, selectedLecturers, setSelectedLecturers)}>
                  <Text style={styles.rowText}>{l.name}</Text>
                  <View style={[styles.checkbox, selectedLecturers.includes(l.id) && styles.checkboxActive]} />
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.section}>Select Students</Text>
            <View style={styles.box}>
              {students.map((s) => (
                <TouchableOpacity key={s.id} style={styles.row} onPress={() => toggleSelect(s.id, selectedStudents, setSelectedStudents)}>
                  <Text style={styles.rowText}>{s.name}</Text>
                  <View style={[styles.checkbox, selectedStudents.includes(s.id) && styles.checkboxGreen]} />
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.actions}>
              <TouchableOpacity style={styles.cancel} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.save} onPress={handleAddCourse}>
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>Create</Text>}
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
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  backBtn: { color: '#4f46e5', fontSize: 18, fontWeight: '600' },
  title: { color: '#fff', fontSize: 18, fontWeight: '700' },
  addBtn: { backgroundColor: '#4f46e5', padding: 10, borderRadius: 10 },
  addText: { color: '#fff' },
  emptyBox: { backgroundColor: '#1a1f3c', borderRadius: 14, padding: 24, alignItems: 'center', borderWidth: 0.5, borderColor: '#2a2f5c' },
  emptyText: { color: '#6b7280', fontSize: 14 },
  card: { backgroundColor: '#1a1f3c', padding: 15, borderRadius: 12, marginBottom: 10, borderWidth: 0.5, borderColor: '#2a2f5c' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  courseName: { color: '#fff', fontSize: 16, fontWeight: '600' },
  code: { color: '#aaa', fontSize: 13, marginTop: 2 },
  deleteBtn: { backgroundColor: '#ef4444', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  deleteBtnText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  modalContainer: { flex: 1, backgroundColor: '#0a0f2c', padding: 20 },
  modalTitle: { color: '#fff', fontSize: 20, marginBottom: 15, fontWeight: '700' },
  input: { backgroundColor: '#1a1f3c', color: '#fff', padding: 12, borderRadius: 10, marginBottom: 10, borderWidth: 0.5, borderColor: '#2a2f5c' },
  section: { color: '#fff', marginTop: 15, marginBottom: 5, fontWeight: '600' },
  box: { backgroundColor: '#1a1f3c', borderRadius: 10, padding: 10, borderWidth: 0.5, borderColor: '#2a2f5c' },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10 },
  rowText: { color: '#fff' },
  checkbox: { width: 18, height: 18, borderWidth: 1, borderColor: '#555', borderRadius: 4 },
  checkboxActive: { backgroundColor: '#4f46e5' },
  checkboxGreen: { backgroundColor: '#10b981' },
  actions: { flexDirection: 'row', marginTop: 20 },
  cancel: { flex: 1, alignItems: 'center', padding: 12 },
  cancelText: { color: '#aaa' },
  save: { flex: 1, backgroundColor: '#4f46e5', alignItems: 'center', padding: 12, borderRadius: 10 },
  saveText: { color: '#fff' },
});