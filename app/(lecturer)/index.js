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
  getClassesByLecturer,
  getRatingsByLecturer,
  getReportsByLecturer,
} from "../../config/firestore";

export default function LecturerDashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState({
    reports: 0,
    classes: 0,
    attendance: 0,
    rating: "N/A",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    loadStats();
  }, [profile]);

  const loadStats = async () => {
    try {
      const [reports, classes, ratings] = await Promise.all([
        getReportsByLecturer(profile.id),
        getClassesByLecturer(profile.id),
        getRatingsByLecturer(profile.id),
      ]);
      const avgRating =
        ratings.length > 0
          ? (
              ratings.reduce((a, b) => a + b.rating, 0) / ratings.length
            ).toFixed(1)
          : "N/A";
      const avgAttendance =
        reports.length > 0
          ? Math.round(
              reports.reduce(
                (a, b) =>
                  a +
                  (b.actualStudentsPresent / b.totalRegisteredStudents) * 100,
                0,
              ) / reports.length,
            )
          : 0;
      setStats({
        reports: reports.length,
        classes: classes.length,
        attendance: avgAttendance,
        rating: avgRating,
      });
    } catch (e) {
      console.log("Error loading stats:", e);
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
    : "LR";

  const menuItems = [
    {
      icon: "📋",
      title: "Submit Report",
      subtitle: "Add lecture report",
      route: "/(lecturer)/report",
    },
    {
      icon: "🏫",
      title: "My Classes",
      subtitle: "View assigned classes",
      route: "/(lecturer)/classes",
    },
    {
      icon: "👥",
      title: "Attendance",
      subtitle: "Mark student attendance",
      route: "/(lecturer)/attendance",
    },
    {
      icon: "📊",
      title: "Monitoring",
      subtitle: "View your performance",
      route: "/(lecturer)/monitoring",
    },
    {
      icon: "⭐",
      title: "My Ratings",
      subtitle: "See student feedback",
      route: "/(lecturer)/ratings",
    },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back 👋</Text>
            <Text style={styles.name}>{profile?.name || "Lecturer"}</Text>
            <Text style={styles.faculty}>
              {profile?.facultyName || "Faculty of ICT"}
            </Text>
          </View>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Overview</Text>
        {loading ? (
          <ActivityIndicator color="#4f46e5" style={{ marginBottom: 28 }} />
        ) : (
          <View style={styles.statsGrid}>
            {[
              { label: "Reports", value: stats.reports, color: "#4f46e5" },
              { label: "Classes", value: stats.classes, color: "#10b981" },
              {
                label: "Attendance",
                value: `${stats.attendance}%`,
                color: "#f59e0b",
              },
              { label: "Rating", value: stats.rating, color: "#ec4899" },
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
  faculty: { color: "#4f46e5", fontSize: 12 },
  avatar: {
    width: 50,
    height: 50,
    backgroundColor: "#4f46e5",
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
  menuArrow: { color: "#4f46e5", fontSize: 24, fontWeight: "300" },
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
