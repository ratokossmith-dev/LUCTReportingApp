import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../config/AuthContext";
import {
  getStudentAttendance,
  getStudentCourses,
} from "../../config/firestore";

export default function StudentMonitoring() {
  const { profile } = useAuth();
  const [courses, setCourses] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    loadData();
  }, [profile]);

  const loadData = async () => {
    try {
      const [c, a] = await Promise.all([
        getStudentCourses(profile.id),
        getStudentAttendance(profile.id),
      ]);
      setCourses(c);
      setAttendance(a);
    } catch (e) {
      console.log("Error:", e);
    }
    setLoading(false);
  };

  const presentCount = attendance.filter((a) => a.present).length;
  const overallRate =
    attendance.length > 0
      ? Math.round((presentCount / attendance.length) * 100)
      : 0;

  const getColor = (val) => {
    if (val >= 90) return "#10b981";
    if (val >= 75) return "#f59e0b";
    return "#ef4444";
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backBtn}>‹ Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Monitoring</Text>
          <View style={{ width: 50 }} />
        </View>

        <View style={styles.overallCard}>
          <View style={styles.overallItem}>
            <Text
              style={[styles.overallValue, { color: getColor(overallRate) }]}
            >
              {overallRate}%
            </Text>
            <Text style={styles.overallLabel}>Overall Attendance</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.overallItem}>
            <Text style={[styles.overallValue, { color: "#4f46e5" }]}>
              {courses.length}
            </Text>
            <Text style={styles.overallLabel}>Courses</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.overallItem}>
            <Text style={[styles.overallValue, { color: "#f59e0b" }]}>
              {presentCount}
            </Text>
            <Text style={styles.overallLabel}>Present</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Course Progress</Text>
        {loading ? (
          <ActivityIndicator color="#4f46e5" />
        ) : courses.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No courses found</Text>
          </View>
        ) : (
          courses.map((course, index) => (
            <View key={course.id || index} style={styles.courseCard}>
              <View style={styles.courseHeader}>
                <View style={styles.codeBadge}>
                  <Text style={styles.codeBadgeText}>
                    {course.courseCode || course.code || "N/A"}
                  </Text>
                </View>
              </View>
              <Text style={styles.courseName}>
                {course.courseName || course.name}
              </Text>
              <Text style={styles.courseLecturer}>
                {course.lecturerName || "TBA"}
              </Text>
              <View style={styles.progressRow}>
                <Text style={styles.progressLabel}>Status</Text>
                <Text style={[styles.progressValue, { color: "#10b981" }]}>
                  {course.status || "Active"}
                </Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
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
  overallCard: {
    backgroundColor: "#1a1f3c",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    flexDirection: "row",
    borderWidth: 0.5,
    borderColor: "#2a2f5c",
  },
  overallItem: { flex: 1, alignItems: "center" },
  overallValue: { fontSize: 24, fontWeight: "700", marginBottom: 4 },
  overallLabel: { color: "#6b7280", fontSize: 11, textAlign: "center" },
  divider: { width: 0.5, backgroundColor: "#2a2f5c", marginHorizontal: 8 },
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
  },
  emptyText: { color: "#6b7280", fontSize: 14 },
  courseCard: {
    backgroundColor: "#1a1f3c",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 0.5,
    borderColor: "#2a2f5c",
  },
  courseHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  codeBadge: {
    backgroundColor: "#4f46e5",
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  codeBadgeText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  courseName: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 2,
  },
  courseLecturer: { color: "#6b7280", fontSize: 12, marginBottom: 12 },
  progressRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  progressLabel: { color: "#9ca3af", fontSize: 12 },
  progressValue: { fontSize: 12, fontWeight: "600" },
});
