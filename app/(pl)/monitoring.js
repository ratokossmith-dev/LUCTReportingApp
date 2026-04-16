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
import {
  getAllCourses,
  getAllLecturers,
  getAllReports,
  getAllStudents,
  getRatingsByLecturer,
  getReportsByLecturer,
} from "../../config/firestore";

export default function PLMonitoring() {
  const [lecturers, setLecturers] = useState([]);
  const [lecturerStats, setLecturerStats] = useState({});
  const [overview, setOverview] = useState({
    lecturers: 0,
    courses: 0,
    students: 0,
    reports: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [lects, courses, students, reports] = await Promise.all([
        getAllLecturers(),
        getAllCourses(),
        getAllStudents(),
        getAllReports(),
      ]);
      setLecturers(lects);
      setOverview({
        lecturers: lects.length,
        courses: courses.length,
        students: students.length,
        reports: reports.length,
      });
      const statsMap = {};
      await Promise.all(
        lects.map(async (l) => {
          const [lReports, lRatings] = await Promise.all([
            getReportsByLecturer(l.id),
            getRatingsByLecturer(l.id),
          ]);
          const avgRating =
            lRatings.length > 0
              ? (
                  lRatings.reduce((a, b) => a + b.rating, 0) / lRatings.length
                ).toFixed(1)
              : "N/A";
          const avgAttendance =
            lReports.length > 0
              ? Math.round(
                  lReports.reduce(
                    (a, b) =>
                      a +
                      (b.actualStudentsPresent / b.totalRegisteredStudents) *
                        100,
                    0,
                  ) / lReports.length,
                )
              : 0;
          statsMap[l.id] = {
            reports: lReports.length,
            rating: avgRating,
            attendance: avgAttendance,
          };
        }),
      );
      setLecturerStats(statsMap);
    } catch (e) {
      console.log("Error:", e);
    }
    setLoading(false);
  };

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

        <Text style={styles.sectionTitle}>System Overview</Text>
        <View style={styles.statsGrid}>
          {[
            { label: "Lecturers", value: overview.lecturers, color: "#4f46e5" },
            { label: "Courses", value: overview.courses, color: "#10b981" },
            { label: "Students", value: overview.students, color: "#f59e0b" },
            { label: "Reports", value: overview.reports, color: "#ec4899" },
          ].map((stat, i) => (
            <View key={i} style={styles.statCard}>
              <Text style={[styles.statValue, { color: stat.color }]}>
                {stat.value}
              </Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Lecturer Performance</Text>
        {loading ? (
          <ActivityIndicator color="#4f46e5" />
        ) : lecturers.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No lecturers found</Text>
          </View>
        ) : (
          lecturers.map((lecturer) => {
            const stats = lecturerStats[lecturer.id] || {};
            return (
              <View key={lecturer.id} style={styles.lecturerCard}>
                <View style={styles.lecturerHeader}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {lecturer.name?.charAt(0) || "L"}
                    </Text>
                  </View>
                  <View style={styles.lecturerInfo}>
                    <Text style={styles.lecturerName}>{lecturer.name}</Text>
                    <Text style={styles.lecturerSub}>
                      Reports: {stats.reports || 0}
                    </Text>
                  </View>
                  <View style={styles.ratingBadge}>
                    <Text style={styles.ratingText}>
                      ⭐ {stats.rating || "N/A"}
                    </Text>
                  </View>
                </View>
                <View style={styles.progressRow}>
                  <Text style={styles.progressLabel}>Avg Attendance</Text>
                  <Text
                    style={[
                      styles.progressValue,
                      { color: getColor(stats.attendance || 0) },
                    ]}
                  >
                    {stats.attendance || 0}%
                  </Text>
                </View>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${stats.attendance || 0}%`,
                        backgroundColor: getColor(stats.attendance || 0),
                      },
                    ]}
                  />
                </View>
              </View>
            );
          })
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
  sectionTitle: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 28,
  },
  statCard: {
    backgroundColor: "#1a1f3c",
    borderRadius: 14,
    padding: 16,
    width: "47%",
    borderWidth: 0.5,
    borderColor: "#2a2f5c",
  },
  statValue: { fontSize: 28, fontWeight: "700", marginBottom: 4 },
  statLabel: { color: "#6b7280", fontSize: 12 },
  emptyBox: {
    backgroundColor: "#1a1f3c",
    borderRadius: 14,
    padding: 24,
    alignItems: "center",
    borderWidth: 0.5,
    borderColor: "#2a2f5c",
  },
  emptyText: { color: "#6b7280", fontSize: 14 },
  lecturerCard: {
    backgroundColor: "#1a1f3c",
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 0.5,
    borderColor: "#2a2f5c",
  },
  lecturerHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    backgroundColor: "#4f46e5",
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontSize: 18, fontWeight: "700" },
  lecturerInfo: { flex: 1 },
  lecturerName: { color: "#fff", fontSize: 15, fontWeight: "600" },
  lecturerSub: { color: "#6b7280", fontSize: 12, marginTop: 2 },
  ratingBadge: {
    backgroundColor: "#0a0f2c",
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderWidth: 0.5,
    borderColor: "#f59e0b",
  },
  ratingText: { color: "#f59e0b", fontSize: 13, fontWeight: "600" },
  progressRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  progressLabel: { color: "#9ca3af", fontSize: 12 },
  progressValue: { fontSize: 12, fontWeight: "600" },
  progressBar: { height: 6, backgroundColor: "#0a0f2c", borderRadius: 3 },
  progressFill: { height: 6, borderRadius: 3 },
});
