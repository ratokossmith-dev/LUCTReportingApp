import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
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

export default function LecturerMonitoring() {
  const { profile } = useAuth();
  const [reports, setReports] = useState([]);
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.id) return;
    (async () => {
      try {
        const [r, rat] = await Promise.all([
          getReportsByLecturer(profile.id),
          getRatingsByLecturer(profile.id),
        ]);
        setReports(r);
        setRatings(rat);
      } catch (e) {
        console.log("Monitoring error:", e);
      }
      setLoading(false);
    })();
  }, [profile]);

  const avgAtt =
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
  const reviewed = reports.filter((r) => r.status === "Reviewed").length;

  return (
    <View style={s.safe}>
      <ScrollView style={s.container} showsVerticalScrollIndicator={false}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={s.back}>‹ Back</Text>
          </TouchableOpacity>
          <Text style={s.title}>My Performance</Text>
          <View style={{ width: 50 }} />
        </View>

        {loading ? (
          <ActivityIndicator color="#4f46e5" />
        ) : (
          <>
            <View style={s.grid}>
              <View style={s.statCard}>
                <Text style={[s.statVal, { color: "#4f46e5" }]}>
                  {reports.length}
                </Text>
                <Text style={s.statLabel}>Reports Submitted</Text>
              </View>
              <View style={s.statCard}>
                <Text style={[s.statVal, { color: "#10b981" }]}>
                  {reviewed}
                </Text>
                <Text style={s.statLabel}>Reviewed by PRL</Text>
              </View>
              <View style={s.statCard}>
                <Text style={[s.statVal, { color: "#f59e0b" }]}>{avgAtt}%</Text>
                <Text style={s.statLabel}>Avg Attendance</Text>
              </View>
              <View style={s.statCard}>
                <Text style={[s.statVal, { color: "#ec4899" }]}>
                  {avgRating}
                </Text>
                <Text style={s.statLabel}>Avg Rating</Text>
              </View>
            </View>

            <Text style={s.section}>
              My Reports & PRL Feedback ({reports.length})
            </Text>
            {reports.length === 0 ? (
              <View style={s.empty}>
                <Text style={s.emptyIcon}>📋</Text>
                <Text style={s.emptyTitle}>No reports yet</Text>
                <Text style={s.emptyText}>
                  Submit a report from the Submit Report screen.
                </Text>
              </View>
            ) : (
              reports.map((r) => (
                <View key={r.id} style={s.reportCard}>
                  <View style={s.reportHeader}>
                    <View style={s.classBadge}>
                      <Text style={s.classBadgeText}>{r.className}</Text>
                    </View>
                    <View
                      style={[
                        s.statusBadge,
                        r.status === "Reviewed"
                          ? s.statusReviewed
                          : s.statusPending,
                      ]}
                    >
                      <Text
                        style={[
                          s.statusText,
                          r.status === "Reviewed"
                            ? s.textReviewed
                            : s.textPending,
                        ]}
                      >
                        {r.status || "Pending"}
                      </Text>
                    </View>
                  </View>
                  <Text style={s.topic}>{r.topicTaught}</Text>
                  <View
                    style={{ flexDirection: "row", gap: 16, marginBottom: 8 }}
                  >
                    <Text style={s.meta}>Week {r.weekOfReporting}</Text>
                    <Text style={s.meta}>📅 {r.dateOfLecture}</Text>
                    <Text style={s.meta}>
                      👥 {r.actualStudentsPresent}/{r.totalRegisteredStudents}
                    </Text>
                  </View>
                  {r.prlFeedback ? (
                    <View style={s.feedbackBox}>
                      <Text style={s.feedbackLabel}>💬 PRL Feedback:</Text>
                      <Text style={s.feedbackText}>{r.prlFeedback}</Text>
                    </View>
                  ) : (
                    <View style={s.noFeedback}>
                      <Text style={s.noFeedbackText}>
                        ⏳ Awaiting PRL feedback...
                      </Text>
                    </View>
                  )}
                </View>
              ))
            )}
          </>
        )}
      </ScrollView>
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
    marginBottom: 24,
    marginTop: 16,
  },
  back: { color: "#4f46e5", fontSize: 18, fontWeight: "600", width: 50 },
  title: { color: "#fff", fontSize: 18, fontWeight: "700" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 28 },
  statCard: {
    backgroundColor: "#1a1f3c",
    borderRadius: 14,
    padding: 16,
    width: "47%",
    borderWidth: 0.5,
    borderColor: "#2a2f5c",
  },
  statVal: { fontSize: 26, fontWeight: "700", marginBottom: 4 },
  statLabel: { color: "#6b7280", fontSize: 11 },
  section: { color: "#fff", fontSize: 15, fontWeight: "600", marginBottom: 12 },
  empty: {
    backgroundColor: "#1a1f3c",
    borderRadius: 14,
    padding: 28,
    alignItems: "center",
    borderWidth: 0.5,
    borderColor: "#2a2f5c",
  },
  emptyIcon: { fontSize: 36, marginBottom: 10 },
  emptyTitle: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 6,
  },
  emptyText: { color: "#6b7280", fontSize: 12, textAlign: "center" },
  reportCard: {
    backgroundColor: "#1a1f3c",
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
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
  textReviewed: { color: "#10b981" },
  textPending: { color: "#f59e0b" },
  topic: { color: "#fff", fontSize: 15, fontWeight: "600", marginBottom: 8 },
  meta: { color: "#6b7280", fontSize: 12 },
  feedbackBox: {
    backgroundColor: "#0a0f2c",
    borderRadius: 10,
    padding: 12,
    borderWidth: 0.5,
    borderColor: "#10b981",
  },
  feedbackLabel: {
    color: "#10b981",
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 4,
  },
  feedbackText: { color: "#9ca3af", fontSize: 13 },
  noFeedback: {
    backgroundColor: "#0a0f2c",
    borderRadius: 10,
    padding: 10,
    borderWidth: 0.5,
    borderColor: "#2a2f5c",
    alignItems: "center",
  },
  noFeedbackText: { color: "#6b7280", fontSize: 12 },
});
