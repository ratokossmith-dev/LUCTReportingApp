import { router } from "expo-router";
import { signOut } from "firebase/auth";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { auth } from "../../config/auth";
import { useAuth } from "../../config/AuthContext";
import {
  getAllCourses,
  getAllLecturers,
  getAllReports,
} from "../../config/firestore";

export default function PRLDashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState({
    courses: 0,
    lecturers: 0,
    reports: 0,
    pending: 0,
  });
  const [pendingReports, setPendingReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    (async () => {
      try {
        const [reports, courses, lecturers] = await Promise.all([
          getAllReports(),
          getAllCourses(),
          getAllLecturers(),
        ]);
        const pending = reports.filter((r) => r.status !== "Reviewed");
        setStats({
          courses: courses.length,
          lecturers: lecturers.length,
          reports: reports.length,
          pending: pending.length,
        });
        setPendingReports(pending.slice(0, 3));
      } catch (e) {
        console.log("PRL dashboard error:", e);
      }
      setLoading(false);
    })();
  }, [profile]);

  const initials = profile?.name
    ? profile.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "PR";

  const menu = [
    {
      icon: "📋",
      title: "Reports",
      sub: "View reports & add feedback",
      route: "/(prl)/reports",
    },
    {
      icon: "📊",
      title: "Monitoring",
      sub: "Monitor lecturer performance",
      route: "/(prl)/monitoring",
    },
    {
      icon: "⭐",
      title: "Ratings",
      sub: "View all student ratings",
      route: "/(prl)/ratings",
    },
    {
      icon: "📚",
      title: "Courses",
      sub: "View all courses",
      route: "/(prl)/courses",
    },
    {
      icon: "🏫",
      title: "Classes",
      sub: "View all classes",
      route: "/(prl)/classes",
    },
  ];

  return (
    <View style={s.safe}>
      <ScrollView style={s.container} showsVerticalScrollIndicator={false}>
        <View style={s.header}>
          <View>
            <Text style={s.greeting}>Welcome back 👋</Text>
            <Text style={s.name}>{profile?.name || "Principal Lecturer"}</Text>
            <Text style={s.role}>Principal Lecturer</Text>
          </View>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{initials}</Text>
          </View>
        </View>

        <Text style={s.section}>Overview</Text>
        {loading ? (
          <ActivityIndicator color="#f59e0b" style={{ marginBottom: 28 }} />
        ) : (
          <View style={s.grid}>
            <View style={s.statCard}>
              <Text style={[s.statVal, { color: "#4f46e5" }]}>
                {stats.courses}
              </Text>
              <Text style={s.statLabel}>Courses</Text>
            </View>
            <View style={s.statCard}>
              <Text style={[s.statVal, { color: "#10b981" }]}>
                {stats.lecturers}
              </Text>
              <Text style={s.statLabel}>Lecturers</Text>
            </View>
            <View style={s.statCard}>
              <Text style={[s.statVal, { color: "#f59e0b" }]}>
                {stats.reports}
              </Text>
              <Text style={s.statLabel}>Total Reports</Text>
            </View>
            <View style={s.statCard}>
              <Text style={[s.statVal, { color: "#ef4444" }]}>
                {stats.pending}
              </Text>
              <Text style={s.statLabel}>Pending Review</Text>
            </View>
          </View>
        )}

        <Text style={s.section}>Reports Needing Review</Text>
        {pendingReports.length === 0 ? (
          <View style={s.empty}>
            <Text style={s.emptyText}>✅ All reports have been reviewed!</Text>
          </View>
        ) : (
          <View style={s.card}>
            {pendingReports.map((r, i) => (
              <View
                key={r.id}
                style={[s.row, i !== pendingReports.length - 1 && s.rowBorder]}
              >
                <View style={s.rAvatar}>
                  <Text style={s.rAvatarText}>
                    {r.lecturerName?.charAt(0) || "L"}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.rName}>{r.lecturerName}</Text>
                  <Text style={s.rSub}>
                    {r.className} — Week {r.weekOfReporting}
                  </Text>
                </View>
                <TouchableOpacity
                  style={s.reviewBtn}
                  onPress={() => router.push("/(prl)/reports")}
                >
                  <Text style={s.reviewBtnText}>Review</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        <Text style={s.section}>Quick Actions</Text>
        <View style={s.menuList}>
          {menu.map((item, i) => (
            <TouchableOpacity
              key={i}
              style={s.menuItem}
              onPress={() => router.push(item.route)}
            >
              <View style={s.menuIcon}>
                <Text style={{ fontSize: 20 }}>{item.icon}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.menuTitle}>{item.title}</Text>
                <Text style={s.menuSub}>{item.sub}</Text>
              </View>
              <Text style={s.arrow}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={s.logout}
          onPress={async () => {
            await signOut(auth);
            router.replace("/(auth)/login");
          }}
        >
          <Text style={s.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0a0f2c" },
  container: { flex: 1, padding: 24 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    marginTop: 16,
  },
  greeting: { color: "#6b7280", fontSize: 14, marginBottom: 4 },
  name: { color: "#fff", fontSize: 22, fontWeight: "700", marginBottom: 2 },
  role: { color: "#f59e0b", fontSize: 12 },
  avatar: {
    width: 50,
    height: 50,
    backgroundColor: "#f59e0b",
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  section: { color: "#fff", fontSize: 16, fontWeight: "600", marginBottom: 14 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 28 },
  statCard: {
    backgroundColor: "#1a1f3c",
    borderRadius: 14,
    padding: 16,
    width: "47%",
    borderWidth: 0.5,
    borderColor: "#2a2f5c",
  },
  statVal: { fontSize: 28, fontWeight: "700", marginBottom: 4 },
  statLabel: { color: "#6b7280", fontSize: 12 },
  empty: {
    backgroundColor: "#1a1f3c",
    borderRadius: 14,
    padding: 20,
    alignItems: "center",
    borderWidth: 0.5,
    borderColor: "#2a2f5c",
    marginBottom: 28,
  },
  emptyText: { color: "#6b7280", fontSize: 14 },
  card: {
    backgroundColor: "#1a1f3c",
    borderRadius: 16,
    padding: 4,
    marginBottom: 28,
    borderWidth: 0.5,
    borderColor: "#2a2f5c",
  },
  row: { flexDirection: "row", alignItems: "center", padding: 12, gap: 12 },
  rowBorder: { borderBottomWidth: 0.5, borderBottomColor: "#2a2f5c" },
  rAvatar: {
    width: 38,
    height: 38,
    backgroundColor: "#4f46e5",
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  rAvatarText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  rName: { color: "#fff", fontSize: 14, fontWeight: "600" },
  rSub: { color: "#6b7280", fontSize: 12 },
  reviewBtn: {
    backgroundColor: "#f59e0b",
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  reviewBtnText: { color: "#000", fontSize: 12, fontWeight: "700" },
  menuList: { gap: 10, marginBottom: 28 },
  menuItem: {
    backgroundColor: "#1a1f3c",
    borderRadius: 14,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 0.5,
    borderColor: "#2a2f5c",
  },
  menuIcon: {
    width: 42,
    height: 42,
    backgroundColor: "#0a0f2c",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  menuTitle: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 2,
  },
  menuSub: { color: "#6b7280", fontSize: 11 },
  arrow: { color: "#f59e0b", fontSize: 24, fontWeight: "300" },
  logout: {
    borderWidth: 0.5,
    borderColor: "#ef4444",
    borderRadius: 14,
    padding: 15,
    alignItems: "center",
    marginBottom: 32,
  },
  logoutText: { color: "#ef4444", fontSize: 15, fontWeight: "600" },
});
