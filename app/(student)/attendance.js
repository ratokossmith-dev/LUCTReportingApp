import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../config/AuthContext";
import { getStudentAttendance } from "../../config/firestore";

export default function StudentAttendance() {
  const { profile } = useAuth();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All");

  useEffect(() => {
    if (!profile) return;
    loadData();
  }, [profile]);

  const loadData = async () => {
    try {
      const data = await getStudentAttendance(profile.id);
      setRecords(data);
    } catch (e) {
      console.log("Error:", e);
    }
    setLoading(false);
  };

  const filtered = records.filter((r) => {
    const matchStatus =
      selectedStatus === "All" ||
      (selectedStatus === "Present" && r.present) ||
      (selectedStatus === "Absent" && !r.present);
    const matchSearch =
      !search ||
      (r.courseName || "").toLowerCase().includes(search.toLowerCase()) ||
      (r.topic || "").toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const presentCount = records.filter((r) => r.present).length;
  const rate =
    records.length > 0 ? Math.round((presentCount / records.length) * 100) : 0;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backBtn}>‹ Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Attendance</Text>
          <View style={{ width: 50 }} />
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: "#10b981" }]}>
              {presentCount}
            </Text>
            <Text style={styles.statLabel}>Present</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: "#ef4444" }]}>
              {records.length - presentCount}
            </Text>
            <Text style={styles.statLabel}>Absent</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: "#4f46e5" }]}>
              {rate}%
            </Text>
            <Text style={styles.statLabel}>Rate</Text>
          </View>
        </View>

        <TextInput
          style={styles.searchInput}
          placeholder="Search by course or topic..."
          placeholderTextColor="#555b7a"
          value={search}
          onChangeText={setSearch}
        />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
        >
          {["All", "Present", "Absent"].map((s) => (
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

        <Text style={styles.sectionTitle}>
          Attendance Records ({filtered.length})
        </Text>

        {loading ? (
          <ActivityIndicator color="#4f46e5" />
        ) : filtered.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No attendance records found</Text>
          </View>
        ) : (
          filtered.map((record, index) => (
            <View key={record.id || index} style={styles.recordCard}>
              <View style={styles.recordLeft}>
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: record.present ? "#10b981" : "#ef4444" },
                  ]}
                />
                <View>
                  <Text style={styles.recordTopic}>
                    {record.topic || record.courseName || "Class"}
                  </Text>
                  <Text style={styles.recordDate}>
                    {record.courseName || "Course"} • {record.date || "N/A"}
                  </Text>
                </View>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  record.present ? styles.badgePresent : styles.badgeAbsent,
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    record.present ? styles.textPresent : styles.textAbsent,
                  ]}
                >
                  {record.present ? "Present" : "Absent"}
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
  filterScroll: { marginBottom: 16 },
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
  emptyBox: {
    backgroundColor: "#1a1f3c",
    borderRadius: 14,
    padding: 24,
    alignItems: "center",
    borderWidth: 0.5,
    borderColor: "#2a2f5c",
  },
  emptyText: { color: "#6b7280", fontSize: 14 },
  recordCard: {
    backgroundColor: "#1a1f3c",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 0.5,
    borderColor: "#2a2f5c",
  },
  recordLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  recordTopic: { color: "#fff", fontSize: 14, fontWeight: "600" },
  recordDate: { color: "#6b7280", fontSize: 12, marginTop: 2 },
  statusBadge: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 0.5,
  },
  badgePresent: { borderColor: "#10b981" },
  badgeAbsent: { borderColor: "#ef4444" },
  statusText: { fontSize: 12, fontWeight: "600" },
  textPresent: { color: "#10b981" },
  textAbsent: { color: "#ef4444" },
});
