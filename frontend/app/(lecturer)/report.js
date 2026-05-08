import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../../config/AuthContext';
import { submitReport, getClassesByLecturer } from '../../config/firestore';

export default function ReportScreen() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState([]);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [selectedClass, setSelectedClass] = useState(null);
  const [form, setForm] = useState({
    weekOfReporting: '',
    dateOfLecture: new Date().toLocaleDateString('en-GB'),
    actualStudentsPresent: '',
    totalRegisteredStudents: '',
    topicTaught: '',
    learningOutcomes: '',
    recommendations: '',
  });

  useEffect(() => {
    if (profile) loadClasses();
  }, [profile]);

  const loadClasses = async () => {
    setLoadingClasses(true);
    try {
      const data = await getClassesByLecturer();
      setClasses(data);
    } catch (e) {
      console.log('Load classes error:', e);
    }
    setLoadingClasses(false);
  };

  const handleSelectClass = (cls) => {
    setSelectedClass(cls);
  };

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!selectedClass) {
      Alert.alert('Required', 'Please select a class');
      return false;
    }
    const required = [
      { field: 'weekOfReporting', label: 'Week of Reporting' },
      { field: 'dateOfLecture', label: 'Date of Lecture' },
      { field: 'actualStudentsPresent', label: 'Students Present' },
      { field: 'totalRegisteredStudents', label: 'Total Registered Students' },
      { field: 'topicTaught', label: 'Topic Taught' },
      { field: 'learningOutcomes', label: 'Learning Outcomes' },
    ];
    for (const item of required) {
      if (!form[item.field].toString().trim()) {
        Alert.alert('Required Field', `Please fill in: ${item.label}`);
        return false;
      }
    }
    if (isNaN(parseInt(form.actualStudentsPresent))) {
      Alert.alert('Invalid Input', 'Students present must be a number');
      return false;
    }
    if (isNaN(parseInt(form.totalRegisteredStudents))) {
      Alert.alert('Invalid Input', 'Total registered students must be a number');
      return false;
    }
    if (parseInt(form.actualStudentsPresent) > parseInt(form.totalRegisteredStudents)) {
      Alert.alert('Invalid Input', 'Students present cannot exceed total registered students');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setLoading(true);
    try {
      await submitReport({
        facultyName: profile?.facultyName || 'Faculty of ICT',
        className: selectedClass.className,
        classId: selectedClass.id,
        courseId: selectedClass.courseId,
        courseName: selectedClass.courseName,
        courseCode: selectedClass.courseCode,
        lecturerName: profile?.name || '',
        venue: selectedClass.venue || '',
        scheduledTime: selectedClass.scheduledTime || '',
        weekOfReporting: parseInt(form.weekOfReporting),
        dateOfLecture: form.dateOfLecture,
        actualStudentsPresent: parseInt(form.actualStudentsPresent),
        totalRegisteredStudents: parseInt(form.totalRegisteredStudents),
        topicTaught: form.topicTaught,
        learningOutcomes: form.learningOutcomes,
        recommendations: form.recommendations,
      });

      Alert.alert(
        'Report Submitted',
        'Your lecture report has been submitted successfully.',
        [{ text: 'OK', onPress: () => router.back() }]
      );

      setSelectedClass(null);
      setForm({
        weekOfReporting: '',
        dateOfLecture: new Date().toLocaleDateString('en-GB'),
        actualStudentsPresent: '',
        totalRegisteredStudents: '',
        topicTaught: '',
        learningOutcomes: '',
        recommendations: '',
      });
    } catch (error) {
      console.log('Report submit error:', error);
      Alert.alert('Error', error.message || 'Failed to submit report.');
    }
    setLoading(false);
  };

  const attendanceRate =
    form.actualStudentsPresent && form.totalRegisteredStudents
      ? Math.round(
          (parseInt(form.actualStudentsPresent) /
            parseInt(form.totalRegisteredStudents)) *
            100
        )
      : null;

  return (
    <View style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.container}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.backBtn}>Back</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Lecture Report</Text>
            <View style={{ width: 50 }} />
          </View>

          {/* Step 1 - Select Class */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Step 1 — Select Class</Text>
            {loadingClasses ? (
              <ActivityIndicator color="#4f46e5" />
            ) : classes.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>No classes found</Text>
                <Text style={styles.emptySubtext}>
                  Create a class first before submitting a report
                </Text>
              </View>
            ) : (
              classes.map((cls) => (
                <TouchableOpacity
                  key={cls.id}
                  style={[
                    styles.classItem,
                    selectedClass?.id === cls.id && styles.classItemActive,
                  ]}
                  onPress={() => handleSelectClass(cls)}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.className}>{cls.className}</Text>
                    <Text style={styles.classCode}>
                      {cls.courseCode} — {cls.courseName}
                    </Text>
                    <Text style={styles.classMeta}>
                      {cls.day} | {cls.scheduledTime} | {cls.venue}
                    </Text>
                  </View>
                  {selectedClass?.id === cls.id && (
                    <Text style={styles.checkMark}>✓</Text>
                  )}
                </TouchableOpacity>
              ))
            )}
          </View>

          {/* Auto-filled info */}
          {selectedClass && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Auto-filled from Class</Text>
              <View style={styles.autoRow}>
                <Text style={styles.autoLabel}>Course</Text>
                <Text style={styles.autoValue}>{selectedClass.courseName}</Text>
              </View>
              <View style={styles.autoRow}>
                <Text style={styles.autoLabel}>Code</Text>
                <Text style={styles.autoValue}>{selectedClass.courseCode}</Text>
              </View>
              <View style={styles.autoRow}>
                <Text style={styles.autoLabel}>Venue</Text>
                <Text style={styles.autoValue}>{selectedClass.venue}</Text>
              </View>
              <View style={styles.autoRow}>
                <Text style={styles.autoLabel}>Time</Text>
                <Text style={styles.autoValue}>{selectedClass.scheduledTime}</Text>
              </View>
              <View style={styles.autoRow}>
                <Text style={styles.autoLabel}>Lecturer</Text>
                <Text style={styles.autoValue}>{profile?.name}</Text>
              </View>
            </View>
          )}

          {/* Step 2 - Fill in details */}
          {selectedClass && (
            <>
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Step 2 — Report Details</Text>

                <Text style={styles.label}>
                  Week of Reporting <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., 5"
                  placeholderTextColor="#555b7a"
                  value={form.weekOfReporting}
                  onChangeText={(v) => updateField('weekOfReporting', v)}
                  keyboardType="numeric"
                />

                <Text style={styles.label}>
                  Date of Lecture <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., 05/04/2026"
                  placeholderTextColor="#555b7a"
                  value={form.dateOfLecture}
                  onChangeText={(v) => updateField('dateOfLecture', v)}
                />
              </View>

              <View style={styles.card}>
                <Text style={styles.cardTitle}>Attendance</Text>

                <Text style={styles.label}>
                  Students Present <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., 38"
                  placeholderTextColor="#555b7a"
                  value={form.actualStudentsPresent}
                  onChangeText={(v) => updateField('actualStudentsPresent', v)}
                  keyboardType="numeric"
                />

                <Text style={styles.label}>
                  Total Registered Students <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., 45"
                  placeholderTextColor="#555b7a"
                  value={form.totalRegisteredStudents}
                  onChangeText={(v) => updateField('totalRegisteredStudents', v)}
                  keyboardType="numeric"
                />

                {attendanceRate !== null && (
                  <View style={styles.attendanceRate}>
                    <Text style={styles.attendanceLabel}>Attendance Rate</Text>
                    <Text
                      style={[
                        styles.attendanceValue,
                        { color: attendanceRate >= 75 ? '#10b981' : '#ef4444' },
                      ]}
                    >
                      {attendanceRate}%
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.card}>
                <Text style={styles.cardTitle}>Lecture Content</Text>

                <Text style={styles.label}>
                  Topic Taught <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={[styles.input, styles.multilineInput]}
                  placeholder="e.g., Firebase Integration"
                  placeholderTextColor="#555b7a"
                  value={form.topicTaught}
                  onChangeText={(v) => updateField('topicTaught', v)}
                  multiline
                />

                <Text style={styles.label}>
                  Learning Outcomes <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={[styles.input, styles.multilineInput]}
                  placeholder="Students will be able to..."
                  placeholderTextColor="#555b7a"
                  value={form.learningOutcomes}
                  onChangeText={(v) => updateField('learningOutcomes', v)}
                  multiline
                />

                <Text style={styles.label}>Recommendations (Optional)</Text>
                <TextInput
                  style={[styles.input, styles.multilineInput]}
                  placeholder="e.g., More practicals needed..."
                  placeholderTextColor="#555b7a"
                  value={form.recommendations}
                  onChangeText={(v) => updateField('recommendations', v)}
                  multiline
                />
              </View>

              <TouchableOpacity
                style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitText}>Submit Report</Text>
                )}
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0a0f2c' },
  container: { flex: 1, padding: 20 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
    marginTop: 16,
  },
  backBtn: { color: '#4f46e5', fontSize: 18, fontWeight: '600', width: 50 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  card: {
    backgroundColor: '#1a1f3c',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 0.5,
    borderColor: '#2a2f5c',
  },
  cardTitle: {
    color: '#4f46e5',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  emptyBox: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  emptySubtext: { color: '#6b7280', fontSize: 12, marginTop: 6, textAlign: 'center' },
  classItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0a0f2c',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#2a2f5c',
  },
  classItemActive: { borderColor: '#4f46e5', backgroundColor: '#1e2350' },
  className: { color: '#fff', fontSize: 15, fontWeight: '600' },
  classCode: { color: '#4f46e5', fontSize: 12, marginTop: 3 },
  classMeta: { color: '#6b7280', fontSize: 11, marginTop: 3 },
  checkMark: { color: '#10b981', fontSize: 20, fontWeight: '700' },
  autoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: '#2a2f5c',
  },
  autoLabel: { color: '#6b7280', fontSize: 13 },
  autoValue: { color: '#fff', fontSize: 13, fontWeight: '500', flex: 1, textAlign: 'right' },
  label: { color: '#9ca3af', fontSize: 12, marginBottom: 6, fontWeight: '500', marginTop: 10 },
  required: { color: '#ef4444' },
  input: {
    backgroundColor: '#0a0f2c',
    borderRadius: 10,
    padding: 12,
    color: '#fff',
    borderWidth: 0.5,
    borderColor: '#2a2f5c',
    fontSize: 14,
  },
  multilineInput: { minHeight: 80, textAlignVertical: 'top' },
  attendanceRate: {
    backgroundColor: '#0a0f2c',
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: '#10b981',
    marginTop: 10,
  },
  attendanceLabel: { color: '#9ca3af', fontSize: 13 },
  attendanceValue: { fontSize: 20, fontWeight: '700' },
  submitButton: {
    backgroundColor: '#4f46e5',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginBottom: 32,
  },
  submitButtonDisabled: { backgroundColor: '#3730a3' },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});