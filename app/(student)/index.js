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
  getStudentAttendance,
  getStudentCourses,
  getStudentRatings,
} from "../../config/firestore";

export default function StudentDashboard() {
  const { profile } = useAuth();
  const [courses, setCourses] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    loadData();
  }, [profile]);

  const loadData = async () => {
    try {
      const [c, a, r] = await Promise.all([
        getStudentCourses(profile.id),
        getStudentAttendance(profile.id),
        getStudentRatings(profile.id),
      ]);
      setCourses(c);
      setAttendance(a);
      setRatings(r);
    } catch (e) {
      console.log("Error:", e);
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.replace("/(auth)/login");
  };

  const presentCount = attendance.filter((a) => a.present).length;
  const attendanceRate =
    attendance.length > 0
      ? Math.round((presentCount / attendance.length) * 100)
      : 0;

  const initials = profile?.name
    ? profile.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "ST";

  const menuItems = [
    {
      icon: "📊",
      title: "Monitoring",
      subtitle: "Track your progress",
      route: "/(student)/monitoring",
    },
    {
      icon: "📅",
      title: "Attendance",
      subtitle: "View your attendance",
      route: "/(student)/attendance",
    },
    {
      icon: "⭐",
      title: "Rate Lecturer",
      subtitle: "Give feedback",
      route: "/(student)/rating",
    },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back 👋</Text>
            <Text style={styles.name}>{profile?.name || "Student"}</Text>
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
            <View style={styles.statCard}>
              <Text style={[styles.statValue, { color: "#10b981" }]}>
                {attendanceRate}%
              </Text>
              <Text style={styles.statLabel}>Attendance</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statValue, { color: "#4f46e5" }]}>
                {courses.length}
              </Text>
              <Text style={styles.statLabel}>Courses</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statValue, { color: "#f59e0b" }]}>
                {ratings.length}
              </Text>
              <Text style={styles.statLabel}>Ratings Given</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statValue, { color: "#ec4899" }]}>
                {attendance.length}
              </Text>
              <Text style={styles.statLabel}>Classes</Text>
            </View>
          </View>
        )}

        <Text style={styles.sectionTitle}>Current Courses</Text>
        {loading ? (
          <ActivityIndicator color="#4f46e5" />
        ) : courses.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No courses found</Text>
          </View>
        ) : (
          <View style={styles.coursesCard}>
            {courses.slice(0, 5).map((course, index) => (
              <View
                key={course.id}
                style={[
                  styles.courseItem,
                  index !== courses.length - 1 && styles.courseItemBorder,
                ]}
              >
                <View style={styles.courseCode}>
                  <Text style={styles.courseCodeText}>
                    {course.courseCode || course.code}
                  </Text>
                </View>
                <View style={styles.courseInfo}>
                  <Text style={styles.courseName}>
                    {course.courseName || course.name}
                  </Text>
                  <Text style={styles.courseLecturer}>
                    {course.lecturerName || "TBA"}
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
  faculty: { color: "#10b981", fontSize: 12 },
  avatar: {
    width: 50,
    height: 50,
    backgroundColor: "#10b981",
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
  coursesCard: {
    backgroundColor: "#1a1f3c",
    borderRadius: 16,
    padding: 4,
    marginBottom: 28,
    borderWidth: 0.5,
    borderColor: "#2a2f5c",
  },
  courseItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 12,
  },
  courseItemBorder: { borderBottomWidth: 0.5, borderBottomColor: "#2a2f5c" },
  courseCode: {
    backgroundColor: "#0a0f2c",
    borderRadius: 8,
    padding: 8,
    minWidth: 70,
    alignItems: "center",
    borderWidth: 0.5,
    borderColor: "#4f46e5",
  },
  courseCodeText: { color: "#4f46e5", fontSize: 11, fontWeight: "600" },
  courseInfo: { flex: 1 },
  courseName: { color: "#fff", fontSize: 13, fontWeight: "600" },
  courseLecturer: { color: "#6b7280", fontSize: 12 },
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
  menuArrow: { color: "#10b981", fontSize: 24, fontWeight: "300" },
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
