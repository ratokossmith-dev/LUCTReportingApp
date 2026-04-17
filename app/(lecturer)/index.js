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
  getClassesByLecturer,
  getCoursesByLecturer,
  getRatingsByLecturer,
  getReportsByLecturer,
} from "../../config/firestore";

export default function LecturerDashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState({
    reports: 0,
    classes: 0,
    courses: 0,
    rating: "N/A",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.id) return;
    (async () => {
      try {
        const [reports, classes, ratings, courses] = await Promise.all([
          getReportsByLecturer(profile.id),
          getClassesByLecturer(profile.id),
          getRatingsByLecturer(profile.id),
          getCoursesByLecturer(profile.id),
        ]);
        const avg =
          ratings.length > 0
            ? (
                ratings.reduce((a, b) => a + b.rating, 0) / ratings.length
              ).toFixed(1)
            : "N/A";
        setStats({
          reports: reports.length,
          classes: classes.length,
          courses: courses.length,
          rating: avg,
        });
      } catch (e) {
        console.log("Lecturer dashboard error:", e);
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
    : "LR";

  const menu = [
    {
      icon: "🏫",
      title: "My Classes",
      sub: "View & add classes under your courses",
      route: "/(lecturer)/classes",
    },
    {
      icon: "👥",
      title: "Mark Attendance",
      sub: "Mark attendance for enrolled students",
      route: "/(lecturer)/attendance",
    },
    {
      icon: "📋",
      title: "Submit Report",
      sub: "Submit weekly lecture report",
      route: "/(lecturer)/report",
    },
    {
      icon: "📊",
      title: "Monitoring",
      sub: "View reports & PRL feedback",
      route: "/(lecturer)/monitoring",
    },
    {
      icon: "⭐",
      title: "My Ratings",
      sub: "See student feedback & ratings",
      route: "/(lecturer)/ratings",
    },
  ];

  return (
    <View style={s.safe}>
      <ScrollView style={s.container} showsVerticalScrollIndicator={false}>
        <View style={s.header}>
          <View>
            <Text style={s.greeting}>Welcome back 👋</Text>
            <Text style={s.name}>{profile?.name || "Lecturer"}</Text>
            <Text style={s.role}>
              Lecturer • {profile?.facultyName || "Faculty of ICT"}
            </Text>
          </View>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{initials}</Text>
          </View>
        </View>
        <Text style={s.section}>Overview</Text>
        {loading ? (
          <ActivityIndicator color="#4f46e5" style={{ marginBottom: 28 }} />
        ) : (
          <View style={s.grid}>
            <View style={s.statCard}>
              <Text style={[s.statVal, { color: "#10b981" }]}>
                {stats.courses}
              </Text>
              <Text style={s.statLabel}>My Courses</Text>
            </View>
            <View style={s.statCard}>
              <Text style={[s.statVal, { color: "#4f46e5" }]}>
                {stats.classes}
              </Text>
              <Text style={s.statLabel}>My Classes</Text>
            </View>
            <View style={s.statCard}>
              <Text style={[s.statVal, { color: "#f59e0b" }]}>
                {stats.reports}
              </Text>
              <Text style={s.statLabel}>Reports Submitted</Text>
            </View>
            <View style={s.statCard}>
              <Text style={[s.statVal, { color: "#ec4899" }]}>
                {stats.rating}
              </Text>
              <Text style={s.statLabel}>Avg Rating</Text>
            </View>
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
    marginBottom: 20,
    marginTop: 16,
  },
  greeting: { color: "#6b7280", fontSize: 14, marginBottom: 4 },
  name: { color: "#fff", fontSize: 22, fontWeight: "700", marginBottom: 2 },
  role: { color: "#4f46e5", fontSize: 12 },
  avatar: {
    width: 50,
    height: 50,
    backgroundColor: "#4f46e5",
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  noticeBox: {
    backgroundColor: "#1a1f3c",
    borderRadius: 12,
    padding: 12,
    borderWidth: 0.5,
    borderColor: "#4f46e5",
    marginBottom: 24,
  },
  noticeText: { color: "#9ca3af", fontSize: 12, lineHeight: 18 },
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
  statLabel: { color: "#6b7280", fontSize: 11 },
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
  arrow: { color: "#4f46e5", fontSize: 24, fontWeight: "300" },
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
