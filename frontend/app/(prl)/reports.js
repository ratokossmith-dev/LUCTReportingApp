import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { addFeedbackToReport, getAllReports } from "../../config/firestore";
import { exportToExcel, formatReportsForExcel } from "../../utils/exportExcel";

export default function PRLReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("Pending");
  const [selected, setSelected] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [modal, setModal] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      const data = await getAllReports();
      setReports(data);
    } catch (e) {
      console.log("Reports load error:", e);
    }
    setLoading(false);
  };

  const handleExport = async () => {
    const exportData = formatReportsForExcel(filtered);
    await exportToExcel(
      exportData,
      `Reports_${new Date().toISOString().split("T")[0]}`,
      "Reports",
    );
  };

  const handleFeedback = useCallback(async () => {
    if (!feedback.trim()) {
      Alert.alert("Error", "Please enter your feedback");
      return;
    }
    setSaving(true);
    try {
      await addFeedbackToReport(selected.id, feedback.trim());
      setReports((prev) =>
        prev.map((r) =>
          r.id === selected.id
            ? { ...r, prlFeedback: feedback.trim(), status: "Reviewed" }
            : r,
        ),
      );
      setModal(false);
      setFeedback("");
      Alert.alert(
        "Feedback Sent! ✅",
        "The lecturer can now see your feedback in their Monitoring screen.",
      );
    } catch (e) {
      Alert.alert("Error", "Failed to submit feedback");
    }
    setSaving(false);
  }, [feedback, selected]);

  const filtered = reports.filter((r) => {
    const matchFilter =
      filter === "All" ||
      (filter === "Pending" && r.status !== "Reviewed") ||
      r.status === filter;
    const matchSearch =
      !search ||
      (r.lecturerName || "").toLowerCase().includes(search.toLowerCase()) ||
      (r.topicTaught || "").toLowerCase().includes(search.toLowerCase()) ||
      (r.className || "").toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  return (
    <View style={s.safe}>
      <ScrollView style={s.container} showsVerticalScrollIndicator={false}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={s.back}>‹ Back</Text>
          </TouchableOpacity>
          <Text style={s.title}>Reports</Text>
          <TouchableOpacity style={s.exportBtn} onPress={handleExport}>
            <Text style={s.exportBtnText}>📎 Export</Text>
          </TouchableOpacity>
        </View>

        <View style={s.statsRow}>
          <View style={s.statBox}>
            <Text style={[s.statVal, { color: "#4f46e5" }]}>
              {reports.length}
            </Text>
            <Text style={s.statLabel}>Total</Text>
          </View>
          <View style={s.statBox}>
            <Text style={[s.statVal, { color: "#10b981" }]}>
              {reports.filter((r) => r.status === "Reviewed").length}
            </Text>
            <Text style={s.statLabel}>Reviewed</Text>
          </View>
          <View style={s.statBox}>
            <Text style={[s.statVal, { color: "#f59e0b" }]}>
              {reports.filter((r) => r.status !== "Reviewed").length}
            </Text>
            <Text style={s.statLabel}>Pending</Text>
          </View>
        </View>

        <TextInput
          style={s.input}
          placeholder="Search reports..."
          placeholderTextColor="#555b7a"
          value={search}
          onChangeText={setSearch}
        />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginBottom: 20 }}
        >
          {["Pending", "All", "Reviewed"].map((f) => (
            <TouchableOpacity
              key={f}
              style={[s.filterBtn, filter === f && s.filterActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[s.filterText, filter === f && s.filterTextActive]}>
                {f}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={s.section}>Reports ({filtered.length})</Text>
        {loading ? (
          <ActivityIndicator color="#4f46e5" />
        ) : filtered.length === 0 ? null : (
          filtered.map((r) => (
            <View key={r.id} style={s.card}>
              <View style={s.cardHeader}>
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
                      r.status === "Reviewed" ? s.textReviewed : s.textPending,
                    ]}
                  >
                    {r.status || "Pending"}
                  </Text>
                </View>
              </View>
              <Text style={s.topic}>{r.topicTaught}</Text>
              <Text style={s.courseSub}>
                {r.courseCode} — {r.courseName}
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  gap: 10,
                  marginBottom: 10,
                }}
              >
                <Text style={s.meta}>👨‍🏫 {r.lecturerName}</Text>
                <Text style={s.meta}>📅 {r.dateOfLecture}</Text>
                <Text style={s.meta}>
                  👥 {r.actualStudentsPresent}/{r.totalRegisteredStudents}
                </Text>
                <Text style={s.meta}>📆 Week {r.weekOfReporting}</Text>
              </View>
              {r.learningOutcomes ? (
                <View style={s.outcomesBox}>
                  <Text style={s.outcomesLabel}>Learning Outcomes:</Text>
                  <Text style={s.outcomesText}>{r.learningOutcomes}</Text>
                </View>
              ) : null}
              {r.prlFeedback ? (
                <View style={s.feedbackBox}>
                  <Text style={s.feedbackLabel}>Your Feedback:</Text>
                  <Text style={s.feedbackText}>{r.prlFeedback}</Text>
                </View>
              ) : null}
              <TouchableOpacity
                style={s.feedbackBtn}
                onPress={() => {
                  setSelected(r);
                  setFeedback(r.prlFeedback || "");
                  setModal(true);
                }}
              >
                <Text style={s.feedbackBtnText}>
                  {r.prlFeedback ? "✏️ Edit Feedback" : "💬 Add Feedback"}
                </Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>

      <Modal visible={modal} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>Add Feedback</Text>
            {selected && (
              <Text style={s.modalSub}>
                {selected.lecturerName} — {selected.className} — Week{" "}
                {selected.weekOfReporting}
              </Text>
            )}
            <TextInput
              style={s.feedbackInput}
              placeholder="Enter your feedback for the lecturer..."
              placeholderTextColor="#555b7a"
              value={feedback}
              onChangeText={setFeedback}
              multiline
            />
            <View style={s.modalBtns}>
              <TouchableOpacity
                style={s.cancelBtn}
                onPress={() => setModal(false)}
              >
                <Text style={s.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.submitBtn, saving && { backgroundColor: "#3730a3" }]}
                onPress={handleFeedback}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={s.submitText}>Submit</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  exportBtn: {
    backgroundColor: "#10b981",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
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
  statVal: { fontSize: 24, fontWeight: "700" },
  statLabel: { color: "#6b7280", fontSize: 11, marginTop: 4 },
  input: {
    backgroundColor: "#1a1f3c",
    borderRadius: 12,
    padding: 12,
    color: "#fff",
    marginBottom: 14,
    borderWidth: 0.5,
    borderColor: "#2a2f5c",
    fontSize: 14,
  },
  filterBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 0.5,
    borderColor: "#2a2f5c",
    marginRight: 8,
    backgroundColor: "#1a1f3c",
  },
  filterActive: { backgroundColor: "#4f46e5", borderColor: "#4f46e5" },
  filterText: { color: "#6b7280", fontSize: 13 },
  filterTextActive: { color: "#fff" },
  section: { color: "#fff", fontSize: 15, fontWeight: "600", marginBottom: 12 },
  card: {
    backgroundColor: "#1a1f3c",
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 0.5,
    borderColor: "#2a2f5c",
  },
  cardHeader: {
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
  topic: { color: "#fff", fontSize: 16, fontWeight: "600", marginBottom: 4 },
  courseSub: { color: "#6b7280", fontSize: 12, marginBottom: 10 },
  meta: { color: "#9ca3af", fontSize: 12 },
  outcomesBox: {
    backgroundColor: "#0a0f2c",
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    borderWidth: 0.5,
    borderColor: "#4f46e5",
  },
  outcomesLabel: { color: "#4f46e5", fontSize: 11, marginBottom: 4 },
  outcomesText: { color: "#9ca3af", fontSize: 13 },
  feedbackBox: {
    backgroundColor: "#0a0f2c",
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    borderWidth: 0.5,
    borderColor: "#10b981",
  },
  feedbackLabel: { color: "#10b981", fontSize: 11, marginBottom: 4 },
  feedbackText: { color: "#9ca3af", fontSize: 13 },
  feedbackBtn: {
    backgroundColor: "#0a0f2c",
    borderRadius: 10,
    padding: 10,
    alignItems: "center",
    borderWidth: 0.5,
    borderColor: "#f59e0b",
  },
  feedbackBtnText: { color: "#f59e0b", fontSize: 13, fontWeight: "600" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: "#1a1f3c",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  modalTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  modalSub: { color: "#6b7280", fontSize: 13, marginBottom: 16 },
  feedbackInput: {
    backgroundColor: "#0a0f2c",
    borderRadius: 12,
    padding: 14,
    color: "#fff",
    minHeight: 140,
    borderWidth: 0.5,
    borderColor: "#2a2f5c",
    fontSize: 14,
    textAlignVertical: "top",
    marginBottom: 16,
  },
  modalBtns: { flexDirection: "row", gap: 10 },
  cancelBtn: {
    flex: 1,
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    borderWidth: 0.5,
    borderColor: "#2a2f5c",
  },
  cancelText: { color: "#6b7280", fontSize: 15, fontWeight: "600" },
  submitBtn: {
    flex: 1,
    backgroundColor: "#4f46e5",
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
  },
  submitText: { color: "#fff", fontSize: 15, fontWeight: "600" },
});
