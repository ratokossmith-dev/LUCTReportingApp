import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
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
  const [filter, setFilter] = useState("All");

  useEffect(() => {
    if (!profile?.id) return;
    (async () => {
      try {
        const data = await getStudentAttendance(profile.id);
        data.sort((a, b) => {
          if (a.createdAt && b.createdAt)
            return b.createdAt.seconds - a.createdAt.seconds;
          return 0;
        });
        setRecords(data);
      } catch (e) {
        console.log("Attendance error:", e);
      }
      setLoading(false);
    })();
  }, [profile]);

  const filtered = records.filter((r) => {
    const matchFilter =
      filter === "All" ||
      (filter === "Present" && r.present) ||
      (filter === "Absent" && !r.present);
    const matchSearch =
      !search ||
      (r.courseName || "").toLowerCase().includes(search.toLowerCase()) ||
      (r.className || "").toLowerCase().includes(search.toLowerCase()) ||
      (r.lecturerName || "").toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const present = records.filter((r) => r.present).length;
  const absent = records.length - present;
  const rate =
    records.length > 0 ? Math.round((present / records.length) * 100) : 0;
  const rateColor = rate >= 90 ? "#10b981" : rate >= 75 ? "#f59e0b" : "#ef4444";

  const byClass = {};
  records.forEach((r) => {
    const key = r.className || "Unknown";
    if (!byClass[key]) byClass[key] = { present: 0, total: 0 };
    byClass[key].total += 1;
    if (r.present) byClass[key].present += 1;
  });

  return (
    <View style={s.safe}>
      <ScrollView style={s.container} showsVerticalScrollIndicator={false}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={s.back}>‹ Back</Text>
          </TouchableOpacity>
          <Text style={s.title}>My Attendance</Text>
          <View style={{ width: 50 }} />
        </View>

        <View style={s.overallCard}>
          <Text style={[s.overallRate, { color: rateColor }]}>{rate}%</Text>
          <Text style={s.overallLabel}>Overall Attendance Rate</Text>
          <View style={s.overallRow}>
            <View style={s.overallStat}>
              <Text style={[s.overallStatVal, { color: "#10b981" }]}>
                {present}
              </Text>
              <Text style={s.overallStatLabel}>Present</Text>
            </View>
            <View style={s.overallStat}>
              <Text style={[s.overallStatVal, { color: "#ef4444" }]}>
                {absent}
              </Text>
              <Text style={s.overallStatLabel}>Absent</Text>
            </View>
            <View style={s.overallStat}>
              <Text style={[s.overallStatVal, { color: "#4f46e5" }]}>
                {records.length}
              </Text>
              <Text style={s.overallStatLabel}>Total</Text>
            </View>
          </View>
        </View>

        {Object.keys(byClass).length > 0 && (
          <>
            <Text style={s.section}>By Class</Text>
            {Object.entries(byClass).map(([className, data]) => {
              const classRate =
                data.total > 0
                  ? Math.round((data.present / data.total) * 100)
                  : 0;
              const classColor =
                classRate >= 90
                  ? "#10b981"
                  : classRate >= 75
                    ? "#f59e0b"
                    : "#ef4444";
              return (
                <View key={className} style={s.classCard}>
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      marginBottom: 8,
                    }}
                  >
                    <Text style={s.className}>{className}</Text>
                    <Text style={[s.classRate, { color: classColor }]}>
                      {classRate}%
                    </Text>
                  </View>
                  <View style={s.progressBar}>
                    <View
                      style={[
                        s.progressFill,
                        { width: `${classRate}%`, backgroundColor: classColor },
                      ]}
                    />
                  </View>
                  <Text style={s.classStat}>
                    {data.present}/{data.total} sessions attended
                  </Text>
                </View>
              );
            })}
          </>
        )}

        <TextInput
          style={s.input}
          placeholder="Search by class or course..."
          placeholderTextColor="#555b7a"
          value={search}
          onChangeText={setSearch}
        />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginBottom: 16 }}
        >
          {["All", "Present", "Absent"].map((f) => (
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

        <Text style={s.section}>Records ({filtered.length})</Text>
        {loading ? (
          <ActivityIndicator color="#4f46e5" />
        ) : filtered.length === 0 ? (
          <View style={s.empty}>
            <Text style={s.emptyIcon}>📅</Text>
            <Text style={s.emptyTitle}>No attendance records yet</Text>
            <Text style={s.emptyText}>
              Records appear after your lecturer marks attendance.
            </Text>
          </View>
        ) : (
          filtered.map((r, i) => (
            <View
              key={r.id || i}
              style={[
                s.recordCard,
                r.present ? s.recordPresent : s.recordAbsent,
              ]}
            >
              <View style={{ flex: 1 }}>
                <Text style={s.recordClass}>{r.className || "Class"}</Text>
                <Text style={s.recordCourse}>{r.courseName || "Course"}</Text>
                <Text style={s.recordLecturer}>
                  👨‍🏫 {r.lecturerName || "Lecturer"}
                </Text>
                <Text style={s.recordDate}>📅 {r.date || "N/A"}</Text>
              </View>
              <View
                style={[s.badge, r.present ? s.badgePresent : s.badgeAbsent]}
              >
                <Text
                  style={[
                    s.badgeText,
                    r.present ? s.textPresent : s.textAbsent,
                  ]}
                >
                  {r.present ? "✓ Present" : "✗ Absent"}
                </Text>
              </View>
            </View>
          ))
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
  overallCard: {
    backgroundColor: "#1a1f3c",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    alignItems: "center",
    borderWidth: 0.5,
    borderColor: "#2a2f5c",
  },
  overallRate: { fontSize: 52, fontWeight: "700" },
  overallLabel: {
    color: "#6b7280",
    fontSize: 13,
    marginTop: 4,
    marginBottom: 16,
  },
  overallRow: { flexDirection: "row", gap: 28 },
  overallStat: { alignItems: "center" },
  overallStatVal: { fontSize: 22, fontWeight: "700" },
  overallStatLabel: { color: "#6b7280", fontSize: 11, marginTop: 2 },
  section: { color: "#fff", fontSize: 15, fontWeight: "600", marginBottom: 12 },
  classCard: {
    backgroundColor: "#1a1f3c",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 0.5,
    borderColor: "#2a2f5c",
  },
  className: { color: "#fff", fontSize: 14, fontWeight: "600" },
  classRate: { fontSize: 14, fontWeight: "700" },
  progressBar: {
    height: 6,
    backgroundColor: "#0a0f2c",
    borderRadius: 3,
    marginBottom: 6,
  },
  progressFill: { height: 6, borderRadius: 3 },
  classStat: { color: "#6b7280", fontSize: 11 },
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
  recordCard: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 0.5,
  },
  recordPresent: { backgroundColor: "#1a1f3c", borderColor: "#10b981" },
  recordAbsent: { backgroundColor: "#1a1f3c", borderColor: "#2a2f5c" },
  recordClass: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2,
  },
  recordCourse: { color: "#9ca3af", fontSize: 12, marginBottom: 2 },
  recordLecturer: { color: "#6b7280", fontSize: 11, marginBottom: 2 },
  recordDate: { color: "#6b7280", fontSize: 11 },
  badge: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 0.5,
    alignItems: "center",
    minWidth: 80,
  },
  badgePresent: {
    borderColor: "#10b981",
    backgroundColor: "rgba(16,185,129,0.1)",
  },
  badgeAbsent: { borderColor: "#ef4444" },
  badgeText: { fontSize: 12, fontWeight: "700" },
  textPresent: { color: "#10b981" },
  textAbsent: { color: "#ef4444" },
});
