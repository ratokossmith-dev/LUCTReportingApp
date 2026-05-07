import { router } from 'expo-router';
import { useEffect, useState } from 'react';
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
import { useAuth } from '../../config/AuthContext';
import {
  getMyCourses,
  getStudentsNotInCourse,
  lecturerAddStudentToCourse,
  getClassesByLecturer,
  removeStudentFromClass,
} from '../../config/firestore';
import api from '../../config/api';

export default function ManageStudents() {
  const { profile } = useAuth();
  const [courses, setCourses] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedClass, setSelectedClass] = useState(null);
  const [availableStudents, setAvailableStudents] = useState([]);
  const [enrolledStudents, setEnrolledStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [search, setSearch] = useState('');
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [removeModalVisible, setRemoveModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('courses');

  useEffect(() => {
    if (profile) loadData();
  }, [profile]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [coursesData, classesData] = await Promise.all([
        getMyCourses(),
        getClassesByLecturer(),
      ]);
      setCourses(coursesData);
      setClasses(classesData);
    } catch (e) {
      console.log('Load error:', e);
      Alert.alert('Error', 'Failed to load data');
    }
    setLoading(false);
  };

  const openAddModal = async (course) => {
    setSelectedCourse(course);
    setAddModalVisible(true);
    setLoading(true);
    try {
      const studentsNotEnrolled = await getStudentsNotInCourse(course.id);
      setAvailableStudents(studentsNotEnrolled);
    } catch (e) {
      console.log('Load students error:', e);
    }
    setLoading(false);
  };

  const openRemoveModal = async (cls) => {
    setSelectedClass(cls);
    setRemoveModalVisible(true);
    setLoading(true);
    try {
      const enrollments = await api.request(`/attendance/class/${cls.id}`);
      const students = enrollments.map((e) => ({
        id: e.studentId,
        name: e.studentName || 'Unknown',
        email: e.studentEmail || '',
      })).filter((s) => s.id);
      setEnrolledStudents(students);
    } catch (e) {
      console.log('Load enrolled students error:', e);
      setEnrolledStudents([]);
    }
    setLoading(false);
  };

  const addStudentToCourse = async (student) => {
    setAdding(true);
    try {
      await lecturerAddStudentToCourse(selectedCourse.id, student.id);
      Alert.alert('Success', `${student.name} added to ${selectedCourse.courseName}`);
      const updatedStudents = await getStudentsNotInCourse(selectedCourse.id);
      setAvailableStudents(updatedStudents);
      loadData();
    } catch (e) {
      Alert.alert('Error', e.message || 'Failed to add student');
    }
    setAdding(false);
  };

  const handleRemoveStudent = (student) => {
    Alert.alert(
      'Remove Student',
      `Remove "${student.name}" from ${selectedClass.className}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setRemoving(true);
            try {
              await removeStudentFromClass(selectedClass.id, student.id);
              Alert.alert('Success', `${student.name} removed from class`);
              const updatedEnrollments = await api.request(`/attendance/class/${selectedClass.id}`);
              const updatedStudents = updatedEnrollments.map((e) => ({
                id: e.studentId,
                name: e.studentName || 'Unknown',
                email: e.studentEmail || '',
              })).filter((s) => s.id);
              setEnrolledStudents(updatedStudents);
            } catch (e) {
              Alert.alert('Error', e.message || 'Failed to remove student');
            }
            setRemoving(false);
          },
        },
      ]
    );
  };

  const filteredAvailable = availableStudents.filter(
    (s) => !search || (s.name || '').toLowerCase().includes(search.toLowerCase()) || (s.email || '').toLowerCase().includes(search.toLowerCase())
  );

  const filteredEnrolled = enrolledStudents.filter(
    (s) => !search || (s.name || '').toLowerCase().includes(search.toLowerCase()) || (s.email || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView style={s.container}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={s.back}>Back</Text>
          </TouchableOpacity>
          <Text style={s.title}>Manage Students</Text>
          <View style={{ width: 50 }} />
        </View>

        <View style={s.tabRow}>
          <TouchableOpacity
            style={[s.tab, activeTab === 'courses' && s.tabActive]}
            onPress={() => setActiveTab('courses')}
          >
            <Text style={[s.tabText, activeTab === 'courses' && s.tabTextActive]}>Add to Course</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.tab, activeTab === 'classes' && s.tabActive]}
            onPress={() => setActiveTab('classes')}
          >
            <Text style={[s.tabText, activeTab === 'classes' && s.tabTextActive]}>Remove from Class</Text>
          </TouchableOpacity>
        </View>

        {loading && courses.length === 0 ? (
          <ActivityIndicator color="#4f46e5" style={{ marginTop: 40 }} />
        ) : activeTab === 'courses' ? (
          <>
            <Text style={s.subtitle}>Select a course to add students</Text>
            {courses.length === 0 ? (
              <View style={s.emptyCard}>
                <Text style={s.emptyText}>No courses assigned to you yet</Text>
                <Text style={s.emptySubtext}>Program Leader needs to assign courses first</Text>
              </View>
            ) : (
              courses.map((course) => (
                <TouchableOpacity key={course.id} style={s.courseCard} onPress={() => openAddModal(course)}>
                  <Text style={s.courseCode}>{course.courseCode}</Text>
                  <Text style={s.courseName}>{course.courseName}</Text>
                  <Text style={s.courseStats}>Students enrolled: {course.studentIds?.length || 0}</Text>
                  <View style={s.addBadge}>
                    <Text style={s.addBadgeText}>+ Add Students</Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </>
        ) : (
          <>
            <Text style={s.subtitle}>Select a class to remove students</Text>
            {classes.length === 0 ? (
              <View style={s.emptyCard}>
                <Text style={s.emptyText}>No classes found</Text>
              </View>
            ) : (
              classes.map((cls) => (
                <TouchableOpacity key={cls.id} style={s.courseCard} onPress={() => openRemoveModal(cls)}>
                  <Text style={s.courseCode}>{cls.courseCode}</Text>
                  <Text style={s.courseName}>{cls.className}</Text>
                  <Text style={s.courseStats}>Day: {cls.day} | Time: {cls.scheduledTime}</Text>
                  <View style={[s.addBadge, { backgroundColor: '#ef444420', borderColor: '#ef4444' }]}>
                    <Text style={[s.addBadgeText, { color: '#ef4444' }]}>Remove Students</Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </>
        )}
      </ScrollView>

      {/* Add Students Modal */}
      <Modal visible={addModalVisible} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <View style={s.modalHeader}>
              <View>
                <Text style={s.modalTitle}>Add Students</Text>
                <Text style={s.modalSubtitle}>{selectedCourse?.courseCode} - {selectedCourse?.courseName}</Text>
              </View>
              <TouchableOpacity style={s.closeBtn} onPress={() => { setAddModalVisible(false); setSearch(''); setAvailableStudents([]); }}>
                <Text style={s.closeBtnText}>X</Text>
              </TouchableOpacity>
            </View>
            <TextInput style={s.searchInput} placeholder="Search students..." placeholderTextColor="#555b7a" value={search} onChangeText={setSearch} />
            <ScrollView style={s.studentList}>
              {loading ? (
                <ActivityIndicator color="#4f46e5" style={{ marginTop: 20 }} />
              ) : availableStudents.length === 0 ? (
                <View style={s.emptyCard}>
                  <Text style={s.emptyText}>All students are already enrolled</Text>
                </View>
              ) : (
                filteredAvailable.map((student) => (
                  <View key={student.id} style={s.studentCard}>
                    <View style={s.studentInfo}>
                      <View style={s.avatar}>
                        <Text style={s.avatarText}>{student.name?.charAt(0) || 'S'}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={s.studentName}>{student.name}</Text>
                        <Text style={s.studentEmail}>{student.email}</Text>
                      </View>
                    </View>
                    <TouchableOpacity style={[s.actionBtn, adding && s.actionBtnDisabled]} onPress={() => addStudentToCourse(student)} disabled={adding}>
                      <Text style={s.actionBtnText}>+ Add</Text>
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Remove Students Modal */}
      <Modal visible={removeModalVisible} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <View style={s.modalHeader}>
              <View>
                <Text style={s.modalTitle}>Remove Students</Text>
                <Text style={s.modalSubtitle}>{selectedClass?.className}</Text>
              </View>
              <TouchableOpacity style={s.closeBtn} onPress={() => { setRemoveModalVisible(false); setSearch(''); setEnrolledStudents([]); }}>
                <Text style={s.closeBtnText}>X</Text>
              </TouchableOpacity>
            </View>
            <TextInput style={s.searchInput} placeholder="Search students..." placeholderTextColor="#555b7a" value={search} onChangeText={setSearch} />
            <ScrollView style={s.studentList}>
              {loading ? (
                <ActivityIndicator color="#4f46e5" style={{ marginTop: 20 }} />
              ) : enrolledStudents.length === 0 ? (
                <View style={s.emptyCard}>
                  <Text style={s.emptyText}>No students enrolled in this class</Text>
                </View>
              ) : (
                filteredEnrolled.map((student) => (
                  <View key={student.id} style={s.studentCard}>
                    <View style={s.studentInfo}>
                      <View style={[s.avatar, { backgroundColor: '#ef4444' }]}>
                        <Text style={s.avatarText}>{student.name?.charAt(0) || 'S'}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={s.studentName}>{student.name}</Text>
                        <Text style={s.studentEmail}>{student.email}</Text>
                      </View>
                    </View>
                    <TouchableOpacity style={[s.removeBtn, removing && s.actionBtnDisabled]} onPress={() => handleRemoveStudent(student)} disabled={removing}>
                      <Text style={s.removeBtnText}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0a0f2c' },
  container: { flex: 1, padding: 20 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, marginTop: 16 },
  back: { color: '#4f46e5', fontSize: 18, fontWeight: '600', width: 50 },
  title: { color: '#fff', fontSize: 18, fontWeight: '700' },
  tabRow: { flexDirection: 'row', marginBottom: 20, backgroundColor: '#1a1f3c', borderRadius: 12, padding: 4 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  tabActive: { backgroundColor: '#4f46e5' },
  tabText: { color: '#6b7280', fontSize: 13, fontWeight: '600' },
  tabTextActive: { color: '#fff' },
  subtitle: { color: '#6b7280', fontSize: 14, marginBottom: 16 },
  courseCard: { backgroundColor: '#1a1f3c', borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 0.5, borderColor: '#2a2f5c' },
  courseCode: { color: '#4f46e5', fontSize: 12, fontWeight: '600' },
  courseName: { color: '#fff', fontSize: 16, fontWeight: '600', marginTop: 4 },
  courseStats: { color: '#6b7280', fontSize: 12, marginTop: 6 },
  addBadge: { marginTop: 10, backgroundColor: '#10b98120', borderRadius: 8, padding: 6, alignItems: 'center', borderWidth: 0.5, borderColor: '#10b981' },
  addBadgeText: { color: '#10b981', fontSize: 12, fontWeight: '600' },
  emptyCard: { backgroundColor: '#1a1f3c', borderRadius: 14, padding: 24, alignItems: 'center', borderWidth: 0.5, borderColor: '#2a2f5c' },
  emptyText: { color: '#6b7280', fontSize: 14 },
  emptySubtext: { color: '#4f46e5', fontSize: 12, marginTop: 8, textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#1a1f3c', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  modalTitle: { color: '#fff', fontSize: 20, fontWeight: '700' },
  modalSubtitle: { color: '#6b7280', fontSize: 13, marginTop: 4 },
  closeBtn: { padding: 8 },
  closeBtnText: { color: '#6b7280', fontSize: 20 },
  searchInput: { backgroundColor: '#0a0f2c', borderRadius: 12, padding: 12, color: '#fff', marginBottom: 16, borderWidth: 0.5, borderColor: '#2a2f5c' },
  studentList: { maxHeight: 500 },
  studentCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0a0f2c', borderRadius: 12, padding: 12, marginBottom: 8 },
  studentInfo: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  avatar: { width: 40, height: 40, backgroundColor: '#4f46e5', borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  studentName: { color: '#fff', fontSize: 14, fontWeight: '600' },
  studentEmail: { color: '#6b7280', fontSize: 12, marginTop: 2 },
  actionBtn: { backgroundColor: '#10b981', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  actionBtnDisabled: { backgroundColor: '#6b7280' },
  actionBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  removeBtn: { backgroundColor: '#ef4444', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  removeBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
});