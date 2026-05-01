import { router } from "expo-router";
import { signOut } from "firebase/auth";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { auth } from "../../config/auth";
import { useAuth } from "../../config/AuthContext";
import {
  addStudentToCourse,
  getAvailableCoursesForStudent,
  getStudentAttendance,
  getStudentCourses,
  getStudentRatings,
} from "../../config/firestore";

export default function StudentDashboard() {
  const { profile } = useAuth();
  const [courses, setCourses] = useState([]);
  const [availableCourses, setAvailableCourses] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    if (!profile?.id) return;
    loadData();
  }, [profile]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [c, a, r, avail] = await Promise.all([
        getStudentCourses(profile.id),
        getStudentAttendance(profile.id),
        getStudentRatings(profile.id),
        getAvailableCoursesForStudent(profile.id),
      ]);
      setCourses(c);
      setAttendance(a);
      setRatings(r);
      setAvailableCourses(avail);
    } catch (e) {
      console.log("Dashboard error:", e);
    }
    setLoading(false);
  };

  const joinCourse = async (courseId, courseName) => {
    setJoining(true);
    try {
      await addStudentToCourse(
        courseId,
        profile.id,
        profile.name,
        profile.email,
      );
      Alert.alert("Success", `You have successfully joined ${courseName}!`);
      loadData(); // Refresh the lists
    } catch (e) {
      Alert.alert("Error", "Failed to join course. Please try again.");
    }
    setJoining(false);
  };

  const present = attendance.filter((a) => a.present).length;
  const rate =
    attendance.length > 0 ? Math.round((present / attendance.length) * 100) : 0;
  const initials = profile?.name
    ? profile.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "ST";

  const menu = [
    {
      icon: "📊",
      title: "Monitoring",
      sub: "Track your progress",
      route: "/(student)/monitoring",
    },
    {
      icon: "📅",
      title: "Attendance",
      sub: "View your attendance records",
      route: "/(student)/attendance",
    },
    {
      icon: "⭐",
      title: "Rate Lecturer",
      sub: "Give feedback to your lecturer",
      route: "/(student)/rating",
    },
  ];

  return (
    <View style={s.safe}>
      <ScrollView style={s.container} showsVerticalScrollIndicator={false}>
        <View style={s.header}>
          <View>
            <Text style={s.greeting}>Welcome back 👋</Text>
            <Text style={s.name}>{profile?.name || "Student"}</Text>
            <Text style={s.role}>
              {profile?.facultyName || "Faculty of ICT"}
            </Text>
          </View>
          <View style={[s.avatar, { backgroundColor: "#10b981" }]}>
            <Text style={s.avatarText}>{initials}</Text>
          </View>
        </View>

        <Text style={s.section}>Overview</Text>
        {loading ? (
          <ActivityIndicator color="#10b981" style={{ marginBottom: 28 }} />
        ) : (
          <View style={s.grid}>
            <View style={s.statCard}>
              <Text style={[s.statVal, { color: "#10b981" }]}>{rate}%</Text>
              <Text style={s.statLabel}>Attendance Rate</Text>
            </View>
            <View style={s.statCard}>
              <Text style={[s.statVal, { color: "#4f46e5" }]}>
                {courses.length}
              </Text>
              <Text style={s.statLabel}>Enrolled Courses</Text>
            </View>
            <View style={s.statCard}>
              <Text style={[s.statVal, { color: "#f59e0b" }]}>{present}</Text>
              <Text style={s.statLabel}>Sessions Present</Text>
            </View>
            <View style={s.statCard}>
              <Text style={[s.statVal, { color: "#ec4899" }]}>
                {ratings.length}
              </Text>
              <Text style={s.statLabel}>Ratings Given</Text>
            </View>
          </View>
        )}

        <Text style={s.section}>My Enrolled Courses</Text>
        {loading ? (
          <ActivityIndicator color="#10b981" />
        ) : courses.length === 0 ? (
          <View style={s.empty}>
            <Text style={s.emptyIcon}>📚</Text>
            <Text style={s.emptyTitle}>No courses yet</Text>
            <Text style={s.emptyText}>
              Join available courses below to get started!
            </Text>
          </View>
        ) : (
          <View style={s.card}>
            {courses.map((c, i) => (
              <View
                key={c.id || i}
                style={[s.row, i !== courses.length - 1 && s.rowBorder]}
              >
                <View style={s.codeBadge}>
                  <Text style={s.codeText}>{c.courseCode || "N/A"}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.courseName}>{c.courseName || "N/A"}</Text>
                  <Text style={s.courseSub}>
                    Lecturer: {c.lecturerName || "TBA"}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Available Courses to Join */}
        {availableCourses.length > 0 && (
          <>
            <Text style={s.section}>Available Courses to Join</Text>
            <View style={s.card}>
              {availableCourses.map((course, i) => (
                <View
                  key={course.id}
                  style={[
                    s.row,
                    i !== availableCourses.length - 1 && s.rowBorder,
                  ]}
                >
                  <View style={s.codeBadge}>
                    <Text style={s.codeText}>{course.courseCode || "N/A"}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.courseName}>
                      {course.courseName || "N/A"}
                    </Text>
                    <Text style={s.courseSub}>
                      Lecturers: {course.lecturerIds?.length || 0} assigned
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={s.joinBtn}
                    onPress={() => joinCourse(course.id, course.courseName)}
                    disabled={joining}
                  >
                    <Text style={s.joinBtnText}>Join</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </>
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
              <Text style={[s.arrow, { color: "#10b981" }]}>›</Text>
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
    marginBottom: 32,
    marginTop: 16,
  },
  greeting: { color: "#6b7280", fontSize: 14, marginBottom: 4 },
  name: { color: "#fff", fontSize: 22, fontWeight: "700", marginBottom: 2 },
  role: { color: "#10b981", fontSize: 12 },
  avatar: {
    width: 50,
    height: 50,
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
  statVal: { fontSize: 26, fontWeight: "700", marginBottom: 4 },
  statLabel: { color: "#6b7280", fontSize: 11 },
  empty: {
    backgroundColor: "#1a1f3c",
    borderRadius: 14,
    padding: 28,
    alignItems: "center",
    borderWidth: 0.5,
    borderColor: "#2a2f5c",
    marginBottom: 28,
  },
  emptyIcon: { fontSize: 36, marginBottom: 10 },
  emptyTitle: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 6,
  },
  emptyText: { color: "#6b7280", fontSize: 12, textAlign: "center" },
  card: {
    backgroundColor: "#1a1f3c",
    borderRadius: 16,
    padding: 4,
    marginBottom: 28,
    borderWidth: 0.5,
    borderColor: "#2a2f5c",
  },
  row: { flexDirection: "row", alignItems: "center", padding: 14, gap: 12 },
  rowBorder: { borderBottomWidth: 0.5, borderBottomColor: "#2a2f5c" },
  codeBadge: {
    backgroundColor: "#0a0f2c",
    borderRadius: 8,
    padding: 8,
    minWidth: 72,
    alignItems: "center",
    borderWidth: 0.5,
    borderColor: "#4f46e5",
  },
  codeText: { color: "#4f46e5", fontSize: 11, fontWeight: "700" },
  courseName: { color: "#fff", fontSize: 13, fontWeight: "600" },
  courseSub: { color: "#6b7280", fontSize: 11, marginTop: 2 },
  joinBtn: {
    backgroundColor: "#10b981",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 8,
  },
  joinBtnText: { color: "#fff", fontSize: 12, fontWeight: "600" },
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
  menuSub: { color: "#6b7280", fontSize: 12 },
  arrow: { fontSize: 24, fontWeight: "300" },
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
