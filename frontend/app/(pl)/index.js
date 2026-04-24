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
  getAllReports,
  getAllStudents
} from "../../config/firestore";

export default function PLDashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState({
    courses: 0,
    lecturers: 0,
    students: 0,
    reports: 0,
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    loadData();
  }, [profile]);

  const loadData = async () => {
    try {
      const [courses, reports, lecturers, students] = await Promise.all([
        getAllCourses(),
        getAllReports(),
        getAllLecturers(),
        getAllStudents(),
      ]);
      setStats({
        courses: courses.length,
        lecturers: lecturers.length,
        students: students.length,
        reports: reports.length,
      });
      setRecentActivity(
        reports.slice(0, 4).map((r) => ({
          icon: "📋",
          text: `${r.lecturerName} submitted Week ${r.weekOfReporting} report`,
          time: "Recent",
        })),
      );
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
      subtitle: "Add & assign modules",
      route: "/(pl)/courses",
    },
    {
      icon: "📋",
      title: "Reports",
      subtitle: "View reports from PRL",
      route: "/(pl)/reports",
    },
    {
      icon: "📊",
      title: "Monitoring",
      subtitle: "Monitor everything",
      route: "/(pl)/monitoring",
    },
    {
      icon: "🏫",
      title: "Classes",
      subtitle: "View all classes",
      route: "/(pl)/classes",
    },
    {
      icon: "👨‍🏫",
      title: "Lecturers",
      subtitle: "Manage lecturers",
      route: "/(pl)/lecturers",
    },
    {
      icon: "⭐",
      title: "Ratings",
      subtitle: "View all ratings",
      route: "/(pl)/ratings",
    },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back 👋</Text>
            <Text style={styles.name}>{profile?.name || "Program Leader"}</Text>
            <Text style={styles.role}>Program Leader</Text>
          </View>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Overview</Text>
        {loading ? (
          <ActivityIndicator color="#ec4899" style={{ marginBottom: 28 }} />
        ) : (
          <View style={styles.statsGrid}>
            {[
              { label: "Courses", value: stats.courses, color: "#4f46e5" },
              { label: "Lecturers", value: stats.lecturers, color: "#10b981" },
              { label: "Students", value: stats.students, color: "#f59e0b" },
              { label: "Reports", value: stats.reports, color: "#ec4899" },
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

        <Text style={styles.sectionTitle}>Recent Activity</Text>
        {recentActivity.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No recent activity</Text>
          </View>
        ) : (
          <View style={styles.activityCard}>
            {recentActivity.map((item, index) => (
              <View
                key={index}
                style={[
                  styles.activityItem,
                  index !== recentActivity.length - 1 &&
                    styles.activityItemBorder,
                ]}
              >
                <Text style={styles.activityIcon}>{item.icon}</Text>
                <Text style={styles.activityText}>{item.text}</Text>
                <Text style={styles.activityTime}>{item.time}</Text>
              </View>
            ))}
          </View>
        )}

        <Text style={styles.sectionTitle}>Management</Text>
        <View style={styles.menuGrid}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuCard}
              onPress={() => router.push(item.route)}
            >
              <Text style={styles.menuIcon}>{item.icon}</Text>
              <Text style={styles.menuTitle}>{item.title}</Text>
              <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
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
  role: { color: "#ec4899", fontSize: 12 },
  avatar: {
    width: 50,
    height: 50,
    backgroundColor: "#ec4899",
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
  activityCard: {
    backgroundColor: "#1a1f3c",
    borderRadius: 16,
    padding: 4,
    marginBottom: 28,
    borderWidth: 0.5,
    borderColor: "#2a2f5c",
  },
  activityItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 10,
  },
  activityItemBorder: { borderBottomWidth: 0.5, borderBottomColor: "#2a2f5c" },
  activityIcon: { fontSize: 16 },
  activityText: { flex: 1, color: "#9ca3af", fontSize: 13 },
  activityTime: { color: "#6b7280", fontSize: 11 },
  menuGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 28,
  },
  menuCard: {
    backgroundColor: "#1a1f3c",
    borderRadius: 16,
    padding: 16,
    width: "47%",
    borderWidth: 0.5,
    borderColor: "#2a2f5c",
  },
  menuIcon: { fontSize: 28, marginBottom: 10 },
  menuTitle: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  menuSubtitle: { color: "#6b7280", fontSize: 11 },
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
