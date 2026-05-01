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
import {
  getAllLecturers,
  getAllRatings,
  getAllReports,
} from "../../config/firestore";

export default function PRLMonitoring() {
  const [lecturers, setLecturers] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        // PRL has access to all reports, ratings and lecturers
        const [lects, allReports, allRatings] = await Promise.all([
          getAllLecturers(),
          getAllReports(),
          getAllRatings(),
        ]);

        setLecturers(lects);

        // Build per-lecturer stats by filtering from the full lists
        const m = {};
        lects.forEach((l) => {
          const r = allReports.filter((rp) => rp.lecturerId === l.id);
          const rat = allRatings.filter((rt) => rt.lecturerId === l.id);

          const avg =
            rat.length > 0
              ? (
                  rat.reduce((a, b) => a + b.rating, 0) / rat.length
                ).toFixed(1)
              : "N/A";

          const att =
            r.length > 0
              ? Math.round(
                  r.reduce(
                    (a, b) =>
                      a +
                      (b.actualStudentsPresent /
                        b.totalRegisteredStudents) *
                        100,
                    0,
                  ) / r.length,
                )
              : 0;

          m[l.id] = {
            reports: r.length,
            rating: avg,
            attendance: att,
            reviewed: r.filter((rp) => rp.status === "Reviewed").length,
          };
        });

        setStats(m);
      } catch (e) {
        console.log("PRL monitoring error:", e);
      }
      setLoading(false);
    })();
  }, []);

  const color = (v) =>
    v >= 90 ? "#10b981" : v >= 75 ? "#f59e0b" : "#ef4444";

  return (
    <View style={s.safe}>
      <ScrollView style={s.container} showsVerticalScrollIndicator={false}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={s.back}>‹ Back</Text>
          </TouchableOpacity>
          <Text style={s.title}>Lecturer Monitoring</Text>
          <View style={{ width: 50 }} />
        </View>

        <Text style={s.section}>
          All Lecturers Performance ({lecturers.length})
        </Text>

        {loading ? (
          <ActivityIndicator color="#4f46e5" />
        ) : lecturers.length === 0 ? (
          <View style={s.empty}>
            <Text style={s.emptyText}>No registered lecturers yet.</Text>
          </View>
        ) : (
          lecturers.map((l) => {
            const st = stats[l.id] || {};
            return (
              <View key={l.id} style={s.card}>
                <View style={s.cardHeader}>
                  <View style={s.avatar}>
                    <Text style={s.avatarText}>
                      {l.name?.charAt(0) || "L"}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.lecName}>{l.name}</Text>
                    <Text style={s.lecEmail}>{l.email}</Text>
                    <Text style={s.lecStat}>
                      📋 {st.reports || 0} reports • ✅ {st.reviewed || 0}{" "}
                      reviewed
                    </Text>
                  </View>
                  <View style={s.ratingBadge}>
                    <Text style={s.ratingText}>⭐ {st.rating || "N/A"}</Text>
                  </View>
                </View>
                <View style={s.progRow}>
                  <Text style={s.progLabel}>Avg Attendance</Text>
                  <Text
                    style={[s.progVal, { color: color(st.attendance || 0) }]}
                  >
                    {st.attendance || 0}%
                  </Text>
                </View>
                <View style={s.progBar}>
                  <View
                    style={[
                      s.progFill,
                      {
                        width: `${st.attendance || 0}%`,
                        backgroundColor: color(st.attendance || 0),
                      },
                    ]}
                  />
                </View>
              </View>
            );
          })
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
  section: { color: "#fff", fontSize: 15, fontWeight: "600", marginBottom: 12 },
  empty: {
    backgroundColor: "#1a1f3c",
    borderRadius: 14,
    padding: 24,
    alignItems: "center",
    borderWidth: 0.5,
    borderColor: "#2a2f5c",
  },
  emptyText: { color: "#6b7280", fontSize: 14 },
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
    alignItems: "center",
    marginBottom: 14,
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
  lecName: { color: "#fff", fontSize: 15, fontWeight: "600" },
  lecEmail: { color: "#6b7280", fontSize: 12, marginTop: 2 },
  lecStat: { color: "#9ca3af", fontSize: 11, marginTop: 2 },
  ratingBadge: {
    backgroundColor: "#0a0f2c",
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderWidth: 0.5,
    borderColor: "#f59e0b",
  },
  ratingText: { color: "#f59e0b", fontSize: 13, fontWeight: "600" },
  progRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  progLabel: { color: "#9ca3af", fontSize: 12 },
  progVal: { fontSize: 12, fontWeight: "600" },
  progBar: { height: 6, backgroundColor: "#0a0f2c", borderRadius: 3 },
  progFill: { height: 6, borderRadius: 3 },
});