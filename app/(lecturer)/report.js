import { router } from "expo-router";
import { addDoc, collection, Timestamp } from "firebase/firestore";
import { useState } from "react";
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
} from "react-native";
import { useAuth } from "../../config/AuthContext";
import { db } from "../../config/firebase";

// ✅ Move Field outside main component
const Field = ({
  label,
  field,
  placeholder,
  multiline,
  keyboardType,
  required,
  form,
  updateField,
}) => (
  <View style={styles.fieldContainer}>
    <Text style={styles.label}>
      {label} {required && <Text style={styles.required}>*</Text>}
    </Text>
    <TextInput
      style={[styles.input, multiline && styles.multilineInput]}
      placeholder={placeholder || `Enter ${label}`}
      placeholderTextColor="#555b7a"
      value={form[field]}
      onChangeText={(val) => updateField(field, val)}
      multiline={multiline}
      keyboardType={keyboardType || "default"}
      blurOnSubmit={false}
      returnKeyType={multiline ? "default" : "next"}
    />
  </View>
);

export default function ReportScreen() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    facultyName: "Faculty of ICT",
    className: "",
    weekOfReporting: "",
    dateOfLecture: "",
    courseName: "",
    courseCode: "",
    lecturerName: profile?.name || "",
    actualStudentsPresent: "",
    totalRegisteredStudents: "",
    venue: "",
    scheduledTime: "",
    topicTaught: "",
    learningOutcomes: "",
    recommendations: "",
  });

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    const required = [
      { field: "className", label: "Class Name" },
      { field: "weekOfReporting", label: "Week of Reporting" },
      { field: "dateOfLecture", label: "Date of Lecture" },
      { field: "courseName", label: "Course Name" },
      { field: "courseCode", label: "Course Code" },
      { field: "lecturerName", label: "Lecturer Name" },
      { field: "actualStudentsPresent", label: "Students Present" },
      { field: "totalRegisteredStudents", label: "Total Registered Students" },
      { field: "venue", label: "Venue" },
      { field: "scheduledTime", label: "Scheduled Time" },
      { field: "topicTaught", label: "Topic Taught" },
      { field: "learningOutcomes", label: "Learning Outcomes" },
    ];
    for (const item of required) {
      if (!form[item.field].trim()) {
        Alert.alert("Required Field", `Please fill in: ${item.label}`);
        return false;
      }
    }
    if (isNaN(parseInt(form.actualStudentsPresent))) {
      Alert.alert("Invalid Input", "Students present must be a number");
      return false;
    }
    if (isNaN(parseInt(form.totalRegisteredStudents))) {
      Alert.alert(
        "Invalid Input",
        "Total registered students must be a number",
      );
      return false;
    }
    if (
      parseInt(form.actualStudentsPresent) >
      parseInt(form.totalRegisteredStudents)
    ) {
      Alert.alert(
        "Invalid Input",
        "Students present cannot exceed total registered students",
      );
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setLoading(true);
    try {
      await addDoc(collection(db, "reports"), {
        ...form,
        lecturerId: profile?.id,
        lecturerName: profile?.name || form.lecturerName,
        actualStudentsPresent: parseInt(form.actualStudentsPresent),
        totalRegisteredStudents: parseInt(form.totalRegisteredStudents),
        weekOfReporting: parseInt(form.weekOfReporting),
        timestamp: Timestamp.now(),
      });
      Alert.alert(
        "Report Submitted!",
        "Your lecture report has been submitted successfully.",
        [{ text: "OK", onPress: () => router.back() }],
      );
    } catch (error) {
      console.log("Firestore Error:", error);
      Alert.alert("Error", "Failed to submit report. Please try again.");
    }
    setLoading(false);
  };

  const attendanceRate =
    form.actualStudentsPresent && form.totalRegisteredStudents
      ? Math.round(
          (parseInt(form.actualStudentsPresent) /
            parseInt(form.totalRegisteredStudents)) *
            100,
        )
      : null;

  return (
    <View style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          style={styles.container}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.backBtn}>‹ Back</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Lecture Report</Text>
            <View style={{ width: 50 }} />
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>General Information</Text>
            <Field
              label="Faculty Name"
              field="facultyName"
              required
              form={form}
              updateField={updateField}
            />
            <Field
              label="Class Name"
              field="className"
              placeholder="e.g. SE3A"
              required
              form={form}
              updateField={updateField}
            />
            <Field
              label="Week of Reporting"
              field="weekOfReporting"
              placeholder="e.g. 5"
              keyboardType="numeric"
              required
              form={form}
              updateField={updateField}
            />
            <Field
              label="Date of Lecture"
              field="dateOfLecture"
              placeholder="e.g. 05/04/2026"
              required
              form={form}
              updateField={updateField}
            />
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Course Details</Text>
            <Field
              label="Course Name"
              field="courseName"
              placeholder="e.g. Mobile App Development"
              required
              form={form}
              updateField={updateField}
            />
            <Field
              label="Course Code"
              field="courseCode"
              placeholder="e.g. ICT3012"
              required
              form={form}
              updateField={updateField}
            />
            <Field
              label="Lecturer Name"
              field="lecturerName"
              placeholder="e.g. Dr. Smith"
              required
              form={form}
              updateField={updateField}
            />
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Attendance</Text>
            <Field
              label="Students Present"
              field="actualStudentsPresent"
              placeholder="e.g. 38"
              keyboardType="numeric"
              required
              form={form}
              updateField={updateField}
            />
            <Field
              label="Total Registered Students"
              field="totalRegisteredStudents"
              placeholder="e.g. 45"
              keyboardType="numeric"
              required
              form={form}
              updateField={updateField}
            />
            {attendanceRate !== null && (
              <View style={styles.attendanceRate}>
                <Text style={styles.attendanceLabel}>Attendance Rate</Text>
                <Text
                  style={[
                    styles.attendanceValue,
                    { color: attendanceRate >= 75 ? "#10b981" : "#ef4444" },
                  ]}
                >
                  {attendanceRate}%
                </Text>
              </View>
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Class Details</Text>
            <Field
              label="Venue"
              field="venue"
              placeholder="e.g. Lab 3"
              required
              form={form}
              updateField={updateField}
            />
            <Field
              label="Scheduled Time"
              field="scheduledTime"
              placeholder="e.g. 08:00 - 10:00"
              required
              form={form}
              updateField={updateField}
            />
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Lecture Content</Text>
            <Field
              label="Topic Taught"
              field="topicTaught"
              placeholder="e.g. Firebase Integration"
              multiline
              required
              form={form}
              updateField={updateField}
            />
            <Field
              label="Learning Outcomes"
              field="learningOutcomes"
              placeholder="Students will be able to..."
              multiline
              required
              form={form}
              updateField={updateField}
            />
            <Field
              label="Recommendations"
              field="recommendations"
              placeholder="e.g. More practicals needed..."
              multiline
              form={form}
              updateField={updateField}
            />
          </View>

          <TouchableOpacity
            style={[
              styles.submitButton,
              loading && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitText}>Submit Report</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
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
  card: {
    backgroundColor: "#1a1f3c",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 0.5,
    borderColor: "#2a2f5c",
  },
  cardTitle: {
    color: "#4f46e5",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 16,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  fieldContainer: { marginBottom: 14 },
  label: { color: "#9ca3af", fontSize: 12, marginBottom: 6, fontWeight: "500" },
  required: { color: "#ef4444" },
  input: {
    backgroundColor: "#0a0f2c",
    borderRadius: 10,
    padding: 12,
    color: "#fff",
    borderWidth: 0.5,
    borderColor: "#2a2f5c",
    fontSize: 14,
  },
  multilineInput: { minHeight: 80, textAlignVertical: "top" },
  attendanceRate: {
    backgroundColor: "#0a0f2c",
    borderRadius: 10,
    padding: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 0.5,
    borderColor: "#10b981",
    marginTop: 4,
  },
  attendanceLabel: { color: "#9ca3af", fontSize: 13 },
  attendanceValue: { fontSize: 20, fontWeight: "700" },
  submitButton: {
    backgroundColor: "#4f46e5",
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    marginBottom: 32,
  },
  submitButtonDisabled: { backgroundColor: "#3730a3" },
  submitText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
