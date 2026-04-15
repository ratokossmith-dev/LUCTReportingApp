import { router } from "expo-router";
import { signOut } from "firebase/auth";
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
import { auth } from "../../config/auth";
import { useAuth } from "../../config/AuthContext";
import {
  getAllCourses,
  getAllLecturers,
  getAllRatings,
  getAllReports,
} from "../../config/firestore";

export default function PRLDashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState({
    courses: 0,
    lecturers: 0,
    reports: 0,
    rating: "N/A",
  });
  const [recentReports, setRecentReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    loadData();
  }, [profile]);

  const loadData = async () => {
    try {
      const [reports, courses, lecturers, ratings] = await Promise.all([
        getAllReports(),
        getAllCourses(),
        getAllLecturers(),
        getAllRatings(),
      ]);
      const avgRating =
        ratings.length > 0
          ? (
              ratings.reduce((a, b) => a + b.rating, 0) / ratings.length
            ).toFixed(1)
          : "N/A";
      setStats({
        courses: courses.length,
        lecturers: lecturers.length,
        reports: reports.length,
        rating: avgRating,
      });
      setRecentReports(reports.slice(0, 3));
    } catch (e) {
      console.log("Error:", e);
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.replace("/(auth)/login");
  };

  const initials = profile?.name
    ? profile.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "PL";

  const menuItems = [
    {
      icon: "📚",
      title: "Courses",
      subtitle: "View all courses & lectures",
      route: "/(prl)/courses",
    },
    {
      icon: "📋",
      title: "Reports",
      subtitle: "View reports & add feedback",
      route: "/(prl)/reports",
    },
    {
      icon: "📊",
      title: "Monitoring",
      subtitle: "Monitor lecturers",
      route: "/(prl)/monitoring",
    },
    {
      icon: "⭐",
      title: "Ratings",
      subtitle: "View all ratings",
      route: "/(prl)/ratings",
    },
    {
      icon: "🏫",
      title: "Classes",
      subtitle: "View all classes",
      route: "/(prl)/classes",
    },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back 👋</Text>
            <Text style={styles.name}>
              {profile?.name || "Principal Lecturer"}
            </Text>
            <Text style={styles.role}>Principal Lecturer</Text>
          </View>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Overview</Text>
        {loading ? (
          <ActivityIndicator color="#f59e0b" style={{ marginBottom: 28 }} />
        ) : (
          <View style={styles.statsGrid}>
            {[
              { label: "Courses", value: stats.courses, color: "#4f46e5" },
              { label: "Lecturers", value: stats.lecturers, color: "#10b981" },
              { label: "Reports", value: stats.reports, color: "#f59e0b" },
              { label: "Avg Rating", value: stats.rating, color: "#ec4899" },
            ].map((stat, i) => (
              <View key={i} style={styles.statCard}>
                <Text style={[styles.statValue, { color: stat.color }]}>
                  {stat.value}
                </Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        )}

        <Text style={styles.sectionTitle}>Recent Reports</Text>
        {loading ? (
          <ActivityIndicator color="#f59e0b" />
        ) : recentReports.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No reports yet</Text>
          </View>
        ) : (
          <View style={styles.reportsCard}>
            {recentReports.map((report, index) => (
              <View
                key={report.id}
                style={[
                  styles.reportItem,
                  index !== recentReports.length - 1 && styles.reportItemBorder,
                ]}
              >
                <View style={styles.reportAvatar}>
                  <Text style={styles.reportAvatarText}>
                    {report.lecturerName?.charAt(0) || "L"}
                  </Text>
                </View>
                <View style={styles.reportInfo}>
                  <Text style={styles.reportLecturer}>
                    {report.lecturerName}
                  </Text>
                  <Text style={styles.reportClass}>
                    {report.className} — {report.topicTaught}
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
            ))}
          </View>
        )}

        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.menuList}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={() => router.push(item.route)}
            >
              <View style={styles.menuIcon}>
                <Text style={styles.menuIconText}>{item.icon}</Text>
              </View>
              <View style={styles.menuText}>
                <Text style={styles.menuTitle}>{item.title}</Text>
                <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
              </View>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0a0f2c" },
  container: { flex: 1, padding: 24 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 32,
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
  sectionTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 14,
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
    marginBottom: 28,
  },
  emptyText: { color: "#6b7280", fontSize: 14 },
  reportsCard: {
    backgroundColor: "#1a1f3c",
    borderRadius: 16,
    padding: 4,
    marginBottom: 28,
    borderWidth: 0.5,
    borderColor: "#2a2f5c",
  },
  reportItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 12,
  },
  reportItemBorder: { borderBottomWidth: 0.5, borderBottomColor: "#2a2f5c" },
  reportAvatar: {
    width: 38,
    height: 38,
    backgroundColor: "#4f46e5",
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  reportAvatarText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  reportInfo: { flex: 1 },
  reportLecturer: { color: "#fff", fontSize: 14, fontWeight: "600" },
  reportClass: { color: "#6b7280", fontSize: 12 },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 0.5,
  },
  statusReviewed: { borderColor: "#10b981" },
  statusPending: { borderColor: "#f59e0b" },
  statusText: { fontSize: 11, fontWeight: "600" },
  statusTextReviewed: { color: "#10b981" },
  statusTextPending: { color: "#f59e0b" },
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
  menuIconText: { fontSize: 20 },
  menuText: { flex: 1 },
  menuTitle: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 2,
  },
  menuSubtitle: { color: "#6b7280", fontSize: 12 },
  menuArrow: { color: "#f59e0b", fontSize: 24, fontWeight: "300" },
  logoutButton: {
    borderWidth: 0.5,
    borderColor: "#ef4444",
    borderRadius: 14,
    padding: 15,
    alignItems: "center",
    marginBottom: 32,
  },
  logoutText: { color: "#ef4444", fontSize: 15, fontWeight: "600" },
});
