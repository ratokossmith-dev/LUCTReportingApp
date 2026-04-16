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
  getRatingsByLecturer,
  getReportsByLecturer,
} from "../../config/firestore";

export default function MonitoringScreen() {
  const { profile } = useAuth();
  const [reports, setReports] = useState([]);
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedWeek, setSelectedWeek] = useState("All");

  useEffect(() => {
    if (!profile) return;
    loadData();
  }, [profile]);

  const loadData = async () => {
    try {
      const [r, rat] = await Promise.all([
        getReportsByLecturer(profile.id),
        getRatingsByLecturer(profile.id),
      ]);
      setReports(r);
      setRatings(rat);
    } catch (e) {
      console.log("Error:", e);
    }
    setLoading(false);
  };

  const avgAttendance =
    reports.length > 0
      ? Math.round(
          reports.reduce(
            (a, b) =>
              a + (b.actualStudentsPresent / b.totalRegisteredStudents) * 100,
            0,
          ) / reports.length,
        )
      : 0;

  const avgRating =
    ratings.length > 0
      ? (ratings.reduce((a, b) => a + b.rating, 0) / ratings.length).toFixed(1)
      : "N/A";

  const weeks = [
    "All",
    ...new Set(reports.map((r) => `Week ${r.weekOfReporting}`)),
  ];
  const filteredReports =
    selectedWeek === "All"
      ? reports
      : reports.filter((r) => `Week ${r.weekOfReporting}` === selectedWeek);

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

        {loading ? (
          <ActivityIndicator color="#4f46e5" />
        ) : (
          <>
            <Text style={styles.sectionTitle}>Performance Overview</Text>
            <View style={styles.statsGrid}>
              {[
                {
                  label: "Reports Submitted",
                  value: reports.length,
                  color: "#4f46e5",
                },
                {
                  label: "Avg Attendance",
                  value: `${avgAttendance}%`,
                  color: "#10b981",
                },
                {
                  label: "Total Ratings",
                  value: ratings.length,
                  color: "#f59e0b",
                },
                { label: "Avg Rating", value: avgRating, color: "#ec4899" },
              ].map((stat, i) => (
                <View key={i} style={styles.statCard}>
                  <Text style={[styles.statValue, { color: stat.color }]}>
                    {stat.value}
                  </Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </View>
              ))}
            </View>

            <Text style={styles.sectionTitle}>Filter by Week</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.weekScroll}
            >
              {weeks.map((week) => (
                <TouchableOpacity
                  key={week}
                  style={[
                    styles.weekBtn,
                    selectedWeek === week && styles.weekBtnActive,
                  ]}
                  onPress={() => setSelectedWeek(week)}
                >
                  <Text
                    style={[
                      styles.weekText,
                      selectedWeek === week && styles.weekTextActive,
                    ]}
                  >
                    {week}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.sectionTitle}>
              Reports ({filteredReports.length})
            </Text>
            {filteredReports.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>No reports found</Text>
              </View>
            ) : (
              filteredReports.map((report) => (
                <View key={report.id} style={styles.reportCard}>
                  <View style={styles.reportHeader}>
                    <View style={styles.classBadge}>
                      <Text style={styles.classBadgeText}>
                        {report.className}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        report.status === "Reviewed"
                          ? styles.statusReviewed
                          : styles.statusPending,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          report.status === "Reviewed"
                            ? styles.statusTextReviewed
                            : styles.statusTextPending,
                        ]}
                      >
                        {report.status || "Pending"}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.reportTopic}>{report.topicTaught}</Text>
                  <View style={styles.reportDetails}>
                    <Text style={styles.reportDetail}>
                      Week {report.weekOfReporting}
                    </Text>
                    <Text style={styles.reportDetail}>
                      👥 {report.actualStudentsPresent}/
                      {report.totalRegisteredStudents}
                    </Text>
                  </View>
                  {report.prlFeedback ? (
                    <View style={styles.feedbackBox}>
                      <Text style={styles.feedbackLabel}>PRL Feedback:</Text>
                      <Text style={styles.feedbackText}>
                        {report.prlFeedback}
                      </Text>
                    </View>
                  ) : null}
                </View>
              ))
            )}
          </>
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
  statValue: { fontSize: 26, fontWeight: "700", marginBottom: 4 },
  statLabel: { color: "#6b7280", fontSize: 11 },
  weekScroll: { marginBottom: 16 },
  weekBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 0.5,
    borderColor: "#2a2f5c",
    marginRight: 8,
    backgroundColor: "#1a1f3c",
  },
  weekBtnActive: { backgroundColor: "#4f46e5", borderColor: "#4f46e5" },
  weekText: { color: "#6b7280", fontSize: 13, fontWeight: "500" },
  weekTextActive: { color: "#fff" },
  emptyBox: {
    backgroundColor: "#1a1f3c",
    borderRadius: 14,
    padding: 24,
    alignItems: "center",
    borderWidth: 0.5,
    borderColor: "#2a2f5c",
  },
  emptyText: { color: "#6b7280", fontSize: 14 },
  reportCard: {
    backgroundColor: "#1a1f3c",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 0.5,
    borderColor: "#2a2f5c",
  },
  reportHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  classBadge: {
    backgroundColor: "#4f46e5",
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  classBadgeText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  statusBadge: {
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderWidth: 0.5,
  },
  statusReviewed: { borderColor: "#10b981" },
  statusPending: { borderColor: "#f59e0b" },
  statusText: { fontSize: 12, fontWeight: "600" },
  statusTextReviewed: { color: "#10b981" },
  statusTextPending: { color: "#f59e0b" },
  reportTopic: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 8,
  },
  reportDetails: { flexDirection: "row", gap: 16 },
  reportDetail: { color: "#6b7280", fontSize: 13 },
  feedbackBox: {
    backgroundColor: "#0a0f2c",
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
    borderWidth: 0.5,
    borderColor: "#10b981",
  },
  feedbackLabel: { color: "#10b981", fontSize: 11, marginBottom: 4 },
  feedbackText: { color: "#9ca3af", fontSize: 13 },
});
