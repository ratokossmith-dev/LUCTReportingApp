import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../config/AuthContext";
import { addClass, getClassesByLecturer } from "../../config/firestore";

export default function ClassesScreen() {
  const { profile } = useAuth();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedDay, setSelectedDay] = useState("All");

  // ✅ NEW STATES FOR ADDING CLASS
  const [showForm, setShowForm] = useState(false);
  const [className, setClassName] = useState("");
  const [courseName, setCourseName] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [venue, setVenue] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [day, setDay] = useState("");
  const [totalStudents, setTotalStudents] = useState("");

  const days = ["All", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

  useEffect(() => {
    if (!profile) return;
    loadClasses();
  }, [profile]);

  const loadClasses = async () => {
    try {
      const data = await getClassesByLecturer(profile.id);
      setClasses(data);
    } catch (e) {
      console.log("Error:", e);
    }
    setLoading(false);
  };

  // ✅ ADD CLASS FUNCTION
  const handleAddClass = async () => {
    if (!className || !courseName) return;

    try {
      await addClass({
        className,
        courseName,
        courseCode,
        venue,
        scheduledTime,
        day,
        totalStudents,
        lecturerId: profile.id,
        lecturerName: profile.name,
      });

      setShowForm(false);
      setClassName("");
      setCourseName("");
      setCourseCode("");
      setVenue("");
      setScheduledTime("");
      setDay("");
      setTotalStudents("");

      loadClasses();
    } catch (e) {
      console.log(e);
    }
  };

  const filtered = classes.filter((c) => {
    const matchDay = selectedDay === "All" || c.day === selectedDay;
    const matchSearch =
      !search ||
      (c.className || "").toLowerCase().includes(search.toLowerCase()) ||
      (c.courseName || "").toLowerCase().includes(search.toLowerCase());
    return matchDay && matchSearch;
  });

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backBtn}>‹ Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Classes</Text>
          <View style={{ width: 50 }} />
        </View>

        {/* ✅ ADD BUTTON */}
        <TouchableOpacity
          style={styles.reportBtn}
          onPress={() => setShowForm(!showForm)}
        >
          <Text style={styles.reportBtnText}>+ Add Class</Text>
        </TouchableOpacity>

        {/* ✅ FORM */}
        {showForm && (
          <View style={styles.classCard}>
            <TextInput
              style={styles.searchInput}
              placeholder="Class Name"
              placeholderTextColor="#555b7a"
              value={className}
              onChangeText={setClassName}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Course Name"
              placeholderTextColor="#555b7a"
              value={courseName}
              onChangeText={setCourseName}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Course Code"
              placeholderTextColor="#555b7a"
              value={courseCode}
              onChangeText={setCourseCode}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Venue"
              placeholderTextColor="#555b7a"
              value={venue}
              onChangeText={setVenue}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Time"
              placeholderTextColor="#555b7a"
              value={scheduledTime}
              onChangeText={setScheduledTime}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Day"
              placeholderTextColor="#555b7a"
              value={day}
              onChangeText={setDay}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Total Students"
              placeholderTextColor="#555b7a"
              value={totalStudents}
              onChangeText={setTotalStudents}
              keyboardType="numeric"
            />

            <TouchableOpacity style={styles.reportBtn} onPress={handleAddClass}>
              <Text style={styles.reportBtnText}>Save Class</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: "#4f46e5" }]}>
              {classes.length}
            </Text>
            <Text style={styles.statLabel}>Total Classes</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: "#10b981" }]}>
              {classes.reduce(
                (a, b) => a + (parseInt(b.totalStudents) || 0),
                0,
              )}
            </Text>
            <Text style={styles.statLabel}>Total Students</Text>
          </View>
        </View>

        <TextInput
          style={styles.searchInput}
          placeholder="Search classes..."
          placeholderTextColor="#555b7a"
          value={search}
          onChangeText={setSearch}
        />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.dayScroll}
        >
          {days.map((dayItem) => (
            <TouchableOpacity
              key={dayItem}
              style={[
                styles.dayBtn,
                selectedDay === dayItem && styles.dayBtnActive,
              ]}
              onPress={() => setSelectedDay(dayItem)}
            >
              <Text
                style={[
                  styles.dayText,
                  selectedDay === dayItem && styles.dayTextActive,
                ]}
              >
                {dayItem.slice(0, 3)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.sectionTitle}>Classes ({filtered.length})</Text>

        {loading ? (
          <ActivityIndicator color="#4f46e5" />
        ) : filtered.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>
              {classes.length === 0
                ? "No classes assigned yet"
                : `No classes on ${selectedDay}`}
            </Text>
          </View>
        ) : (
          filtered.map((cls) => (
            <View key={cls.id} style={styles.classCard}>
              <View style={styles.classHeader}>
                <View style={styles.classBadge}>
                  <Text style={styles.classBadgeText}>
                    {cls.className || "N/A"}
                  </Text>
                </View>
                <Text style={styles.classCode}>{cls.courseCode || "N/A"}</Text>
              </View>

              <Text style={styles.courseName}>{cls.courseName || "N/A"}</Text>

              <View style={styles.classDetails}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailIcon}>📍</Text>
                  <Text style={styles.detailText}>{cls.venue || "N/A"}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailIcon}>🕐</Text>
                  <Text style={styles.detailText}>
                    {cls.scheduledTime || "N/A"}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailIcon}>📅</Text>
                  <Text style={styles.detailText}>{cls.day || "N/A"}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailIcon}>👥</Text>
                  <Text style={styles.detailText}>
                    {cls.totalStudents || 0} Students
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.reportBtn}
                onPress={() => router.push("/(lecturer)/report")}
              >
                <Text style={styles.reportBtnText}>Submit Report</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0a0f2c" },
  container: { flex: 1, padding: 20 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
    marginTop: 16,
  },
  backBtn: { color: "#4f46e5", fontSize: 18, fontWeight: "600", width: 50 },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "700" },
  statsRow: { flexDirection: "row", gap: 12, marginBottom: 16 },
  statBox: {
    flex: 1,
    backgroundColor: "#1a1f3c",
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    borderWidth: 0.5,
    borderColor: "#2a2f5c",
  },
  statValue: { fontSize: 28, fontWeight: "700" },
  statLabel: { color: "#6b7280", fontSize: 12, marginTop: 4 },
  searchInput: {
    backgroundColor: "#1a1f3c",
    borderRadius: 12,
    padding: 12,
    color: "#fff",
    marginBottom: 14,
    borderWidth: 0.5,
    borderColor: "#2a2f5c",
    fontSize: 14,
  },
  dayScroll: { marginBottom: 20 },
  dayBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 0.5,
    borderColor: "#2a2f5c",
    marginRight: 8,
    backgroundColor: "#1a1f3c",
  },
  dayBtnActive: { backgroundColor: "#4f46e5", borderColor: "#4f46e5" },
  dayText: { color: "#6b7280", fontSize: 13, fontWeight: "500" },
  dayTextActive: { color: "#fff" },
  sectionTitle: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 12,
  },
  emptyBox: {
    backgroundColor: "#1a1f3c",
    borderRadius: 14,
    padding: 32,
    alignItems: "center",
    borderWidth: 0.5,
    borderColor: "#2a2f5c",
  },
  emptyText: { color: "#6b7280", fontSize: 14 },
  classCard: {
    backgroundColor: "#1a1f3c",
    borderRadius: 16,
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
  classBadgeText: { color: "#fff", fontSize: 13, fontWeight: "600" },
  classCode: { color: "#6b7280", fontSize: 13 },
  courseName: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  classDetails: { gap: 6, marginBottom: 14 },
  detailRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  detailIcon: { fontSize: 14 },
  detailText: { color: "#9ca3af", fontSize: 13 },
  reportBtn: {
    backgroundColor: "#0a0f2c",
    borderRadius: 10,
    padding: 10,
    alignItems: "center",
    borderWidth: 0.5,
    borderColor: "#4f46e5",
    marginBottom: 10,
  },
  reportBtnText: { color: "#4f46e5", fontSize: 13, fontWeight: "600" },
});
