import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { getAllReports } from "../../config/firestore";
import { exportToExcel, formatReportsForExcel } from "../../utils/exportExcel";

export default function PLReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      const data = await getAllReports();
      setReports(data);
    } catch (e) {
      console.log("Error:", e);
    }
    setLoading(false);
  };

  const handleExport = async () => {
    if (filtered.length === 0) {
      Alert.alert("No Data", "There are no reports to export.");
      return;
    }

    setExporting(true);
    try {
      const exportData = formatReportsForExcel(filtered);
      await exportToExcel(
        exportData,
        `Reports_${new Date().toISOString().split("T")[0]}`,
        "Reports",
      );
    } catch (error) {
      console.log("Export error:", error);
      Alert.alert("Export Failed", error.message || "Something went wrong");
    } finally {
      setExporting(false);
    }
  };

  const filtered = reports.filter((r) => {
    const matchStatus = selectedStatus === "All" || r.status === selectedStatus;
    const matchSearch =
      !search ||
      (r.lecturerName || "").toLowerCase().includes(search.toLowerCase()) ||
      (r.topicTaught || "").toLowerCase().includes(search.toLowerCase()) ||
      (r.className || "").toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backBtn}>‹ Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Reports</Text>
          <TouchableOpacity
            style={[styles.exportBtn, exporting && styles.exportBtnDisabled]}
            onPress={handleExport}
            disabled={exporting}
          >
            <Text style={styles.exportBtnText}>
              {exporting ? "⏳ Exporting..." : "📎 Export"}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: "#4f46e5" }]}>
              {reports.length}
            </Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: "#10b981" }]}>
              {reports.filter((r) => r.status === "Reviewed").length}
            </Text>
            <Text style={styles.statLabel}>Reviewed</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: "#f59e0b" }]}>
              {reports.filter((r) => r.status !== "Reviewed").length}
            </Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
        </View>

        <TextInput
          style={styles.searchInput}
          placeholder="Search reports..."
          placeholderTextColor="#555b7a"
          value={search}
          onChangeText={setSearch}
        />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
        >
          {["All", "Reviewed", "Pending"].map((s) => (
            <TouchableOpacity
              key={s}
              style={[
                styles.filterBtn,
                selectedStatus === s && styles.filterBtnActive,
              ]}
              onPress={() => setSelectedStatus(s)}
            >
              <Text
                style={[
                  styles.filterText,
                  selectedStatus === s && styles.filterTextActive,
                ]}
              >
                {s}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.sectionTitle}>Reports ({filtered.length})</Text>
        {loading ? (
          <ActivityIndicator color="#4f46e5" />
        ) : filtered.length === 0 ? null : (
          filtered.map((report) => (
            <View key={report.id} style={styles.reportCard}>
              <View style={styles.reportHeader}>
                <View style={styles.classBadge}>
                  <Text style={styles.classBadgeText}>{report.className}</Text>
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
              <Text style={styles.reportCourse}>
                {report.courseCode} — {report.courseName}
              </Text>
              <View style={styles.reportMeta}>
                <Text style={styles.metaText}>👨‍🏫 {report.lecturerName}</Text>
                <Text style={styles.metaText}>📅 {report.dateOfLecture}</Text>
                <Text style={styles.metaText}>
                  👥 {report.actualStudentsPresent}/
                  {report.totalRegisteredStudents}
                </Text>
                <Text style={styles.metaText}>
                  📆 Week {report.weekOfReporting}
                </Text>
              </View>
              {report.prlFeedback ? (
                <View style={styles.feedbackBox}>
                  <Text style={styles.feedbackLabel}>PRL Feedback:</Text>
                  <Text style={styles.feedbackText}>{report.prlFeedback}</Text>
                </View>
              ) : null}
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
  exportBtn: {
    backgroundColor: "#10b981",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  exportBtnDisabled: {
    backgroundColor: "#6b7280",
    opacity: 0.7,
  },
  exportBtnText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  statsRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  statBox: {
    flex: 1,
    backgroundColor: "#1a1f3c",
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    borderWidth: 0.5,
    borderColor: "#2a2f5c",
  },
  statValue: { fontSize: 24, fontWeight: "700" },
  statLabel: { color: "#6b7280", fontSize: 11, marginTop: 4 },
  searchInput: {
    backgroundColor: "#1a1f3c",
    borderRadius: 12,
    padding: 12,
    color: "#fff",
    marginBottom: 14,
    borderWidth: 0.5,
    borderColor: "#2a2f5c",
    fontSize: 14,
  },
  filterScroll: { marginBottom: 20 },
  filterBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 0.5,
    borderColor: "#2a2f5c",
    marginRight: 8,
    backgroundColor: "#1a1f3c",
  },
  filterBtnActive: { backgroundColor: "#4f46e5", borderColor: "#4f46e5" },
  filterText: { color: "#6b7280", fontSize: 13, fontWeight: "500" },
  filterTextActive: { color: "#fff" },
  sectionTitle: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 12,
  },
  reportCard: {
    backgroundColor: "#1a1f3c",
    borderRadius: 16,
    padding: 16,
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
  statusTextReviewed: { color: "#10b981" },
  statusTextPending: { color: "#f59e0b" },
  reportTopic: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  reportCourse: { color: "#6b7280", fontSize: 12, marginBottom: 10 },
  reportMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 12,
  },
  metaText: { color: "#9ca3af", fontSize: 12 },
  feedbackBox: {
    backgroundColor: "#0a0f2c",
    borderRadius: 10,
    padding: 10,
    borderWidth: 0.5,
    borderColor: "#10b981",
  },
  feedbackLabel: { color: "#10b981", fontSize: 11, marginBottom: 4 },
  feedbackText: { color: "#9ca3af", fontSize: 13 },
});
