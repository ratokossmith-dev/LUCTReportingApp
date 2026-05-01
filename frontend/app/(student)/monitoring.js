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
import {
  getClassesByStudent,
  getStudentAttendance,
  getStudentCourses,
} from "../../config/firestore";

export default function StudentMonitoring() {
  const { profile } = useAuth();
  const [courses, setCourses] = useState([]);
  const [classes, setClasses] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!profile?.id) return;
    (async () => {
      try {
        const [c, cl, a] = await Promise.all([
          getStudentCourses(profile.id),
          getClassesByStudent(profile.id),
          getStudentAttendance(profile.id),
        ]);
        setCourses(c);
        setClasses(cl);
        setAttendance(a);
      } catch (e) {
        console.log("Monitoring error:", e);
      }
      setLoading(false);
    })();
  }, [profile]);

  const present = attendance.filter((a) => a.present).length;
  const rate =
    attendance.length > 0 ? Math.round((present / attendance.length) * 100) : 0;
  const rateColor = rate >= 90 ? "#10b981" : rate >= 75 ? "#f59e0b" : "#ef4444";

  const classStats = classes.map((cls) => {
    const classAtt = attendance.filter((a) => a.classId === cls.id);
    const classPresent = classAtt.filter((a) => a.present).length;
    const classRate =
      classAtt.length > 0
        ? Math.round((classPresent / classAtt.length) * 100)
        : 0;
    return { ...cls, classPresent, classTotalAtt: classAtt.length, classRate };
  });

  const filteredClassStats = classStats.filter(
    (cls) =>
      !search ||
      cls.className?.toLowerCase().includes(search.toLowerCase()) ||
      cls.courseName?.toLowerCase().includes(search.toLowerCase()) ||
      cls.lecturerName?.toLowerCase().includes(search.toLowerCase()),
  );

  const filteredCourses = courses.filter(
    (c) =>
      !search ||
      c.courseName?.toLowerCase().includes(search.toLowerCase()) ||
      c.courseCode?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <View style={s.safe}>
      <ScrollView style={s.container} showsVerticalScrollIndicator={false}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={s.back}>‹ Back</Text>
          </TouchableOpacity>
          <Text style={s.title}>My Progress</Text>
          <View style={{ width: 50 }} />
        </View>

        {loading ? (
          <ActivityIndicator color="#4f46e5" />
        ) : (
          <>
            <View style={s.grid}>
              <View style={s.statCard}>
                <Text style={[s.statVal, { color: rateColor }]}>{rate}%</Text>
                <Text style={s.statLabel}>Overall Attendance</Text>
              </View>
              <View style={s.statCard}>
                <Text style={[s.statVal, { color: "#4f46e5" }]}>
                  {courses.length}
                </Text>
                <Text style={s.statLabel}>Enrolled Courses</Text>
              </View>
              <View style={s.statCard}>
                <Text style={[s.statVal, { color: "#f59e0b" }]}>
                  {classes.length}
                </Text>
                <Text style={s.statLabel}>Classes</Text>
              </View>
              <View style={s.statCard}>
                <Text style={[s.statVal, { color: "#10b981" }]}>{present}</Text>
                <Text style={s.statLabel}>Sessions Attended</Text>
              </View>
            </View>

            <TextInput
              style={s.searchInput}
              placeholder="Search classes or courses..."
              placeholderTextColor="#555b7a"
              value={search}
              onChangeText={setSearch}
            />

            <Text style={s.section}>My Classes & Attendance</Text>
            {filteredClassStats.length === 0
              ? null
              : filteredClassStats.map((cls) => {
                  const color =
                    cls.classRate >= 90
                      ? "#10b981"
                      : cls.classRate >= 75
                        ? "#f59e0b"
                        : "#ef4444";
                  return (
                    <View key={cls.id} style={s.classCard}>
                      <View style={s.classHeader}>
                        <View style={s.classBadge}>
                          <Text style={s.classBadgeText}>{cls.className}</Text>
                        </View>
                        <Text style={[s.classRate, { color }]}>
                          {cls.classRate}%
                        </Text>
                      </View>
                      <Text style={s.courseName}>{cls.courseName}</Text>
                      <Text style={s.lecturerName}>
                        👨‍🏫 {cls.lecturerName || "TBA"}
                      </Text>
                      <View
                        style={{
                          flexDirection: "row",
                          flexWrap: "wrap",
                          gap: 8,
                          marginBottom: 10,
                        }}
                      >
                        {cls.day ? (
                          <Text style={s.detail}>📅 {cls.day}</Text>
                        ) : null}
                        {cls.scheduledTime ? (
                          <Text style={s.detail}>🕐 {cls.scheduledTime}</Text>
                        ) : null}
                        {cls.venue ? (
                          <Text style={s.detail}>📍 {cls.venue}</Text>
                        ) : null}
                      </View>
                      <View style={s.progressBar}>
                        <View
                          style={[
                            s.progressFill,
                            {
                              width: `${cls.classRate}%`,
                              backgroundColor: color,
                            },
                          ]}
                        />
                      </View>
                      <Text style={s.attStat}>
                        {cls.classPresent}/{cls.classTotalAtt} sessions attended
                      </Text>
                    </View>
                  );
                })}

            <Text style={s.section}>Enrolled Courses</Text>
            {filteredCourses.length === 0
              ? null
              : filteredCourses.map((c, i) => (
                  <View key={c.id || i} style={s.courseCard}>
                    <View style={s.courseCodeBadge}>
                      <Text style={s.courseCodeText}>
                        {c.courseCode || "N/A"}
                      </Text>
                    </View>
                    <Text style={s.courseCardName}>
                      {c.courseName || "N/A"}
                    </Text>
                    <Text style={s.courseCardSub}>
                      Lecturer: {c.lecturerName || "TBA"} • Semester{" "}
                      {c.semester || "N/A"}
                    </Text>
                  </View>
                ))}
          </>
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
  searchInput: {
    backgroundColor: "#1a1f3c",
    borderRadius: 12,
    padding: 12,
    color: "#fff",
    marginBottom: 16,
    borderWidth: 0.5,
    borderColor: "#2a2f5c",
    fontSize: 14,
  },
  section: { color: "#fff", fontSize: 15, fontWeight: "600", marginBottom: 12 },
  classCard: {
    backgroundColor: "#1a1f3c",
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 0.5,
    borderColor: "#2a2f5c",
  },
  classHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  classBadge: {
    backgroundColor: "#4f46e5",
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  classBadgeText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  classRate: { fontSize: 18, fontWeight: "700" },
  courseName: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  lecturerName: { color: "#6b7280", fontSize: 12, marginBottom: 8 },
  detail: {
    color: "#9ca3af",
    fontSize: 11,
    backgroundColor: "#0a0f2c",
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  progressBar: {
    height: 6,
    backgroundColor: "#0a0f2c",
    borderRadius: 3,
    marginBottom: 6,
  },
  progressFill: { height: 6, borderRadius: 3 },
  attStat: { color: "#6b7280", fontSize: 11 },
  courseCard: {
    backgroundColor: "#1a1f3c",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 0.5,
    borderColor: "#2a2f5c",
  },
  courseCodeBadge: {
    backgroundColor: "#4f46e5",
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 10,
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  courseCodeText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  courseCardName: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  courseCardSub: { color: "#6b7280", fontSize: 12 },
});
