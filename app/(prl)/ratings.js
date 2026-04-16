import { router } from "expo-router";
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
import { getAllRatings } from "../../config/firestore";

export default function PRLRatings() {
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState("All");
  const [lecturers, setLecturers] = useState([]);

  useEffect(() => {
    loadRatings();
  }, []);

  const loadRatings = async () => {
    try {
      const data = await getAllRatings();
      setRatings(data);
      const uniqueLecturers = [
        "All",
        ...new Set(data.map((r) => r.lecturerName).filter(Boolean)),
      ];
      setLecturers(uniqueLecturers);
    } catch (e) {
      console.log("Error:", e);
    }
    setLoading(false);
  };

  const filtered =
    selected === "All"
      ? ratings
      : ratings.filter((r) => r.lecturerName === selected);

  const avgRating =
    filtered.length > 0
      ? (filtered.reduce((a, b) => a + b.rating, 0) / filtered.length).toFixed(
          1,
        )
      : "0.0";

  const Stars = ({ count }) => (
    <View style={{ flexDirection: "row", gap: 2 }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <Text
          key={s}
          style={{ fontSize: 14, color: s <= count ? "#f59e0b" : "#2a2f5c" }}
        >
          ★
        </Text>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backBtn}>‹ Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Ratings</Text>
          <View style={{ width: 50 }} />
        </View>

        <View style={styles.overallCard}>
          <Text style={styles.overallValue}>{avgRating}</Text>
          <Stars count={Math.round(parseFloat(avgRating))} />
          <Text style={styles.overallLabel}>{filtered.length} reviews</Text>
        </View>

        <Text style={styles.sectionTitle}>Filter by Lecturer</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
        >
          {lecturers.map((l) => (
            <TouchableOpacity
              key={l}
              style={[
                styles.filterBtn,
                selected === l && styles.filterBtnActive,
              ]}
              onPress={() => setSelected(l)}
            >
              <Text
                style={[
                  styles.filterText,
                  selected === l && styles.filterTextActive,
                ]}
              >
                {l}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.sectionTitle}>All Reviews ({filtered.length})</Text>
        {loading ? (
          <ActivityIndicator color="#4f46e5" />
        ) : filtered.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No ratings found</Text>
          </View>
        ) : (
          filtered.map((item, index) => (
            <View key={item.id || index} style={styles.ratingCard}>
              <View style={styles.ratingHeader}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {item.studentName?.charAt(0) || "S"}
                  </Text>
                </View>
                <View style={styles.ratingInfo}>
                  <Text style={styles.studentName}>
                    {item.studentName || "Student"}
                  </Text>
                  <Text style={styles.lecturerName}>
                    {item.lecturerName} • {item.course || "N/A"}
                  </Text>
                </View>
              </View>
              <Stars count={item.rating} />
              {item.comment ? (
                <Text style={styles.ratingComment}>{item.comment}</Text>
              ) : null}
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
  overallCard: {
    backgroundColor: "#1a1f3c",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    alignItems: "center",
    borderWidth: 0.5,
    borderColor: "#2a2f5c",
  },
  overallValue: { color: "#f59e0b", fontSize: 48, fontWeight: "700" },
  overallLabel: { color: "#6b7280", fontSize: 13, marginTop: 8 },
  sectionTitle: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 12,
  },
  filterScroll: { marginBottom: 16 },
  filterBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 0.5,
    borderColor: "#2a2f5c",
    marginRight: 8,
    backgroundColor: "#1a1f3c",
  },
  filterBtnActive: { backgroundColor: "#4f46e5", borderColor: "#4f46e5" },
  filterText: { color: "#6b7280", fontSize: 13, fontWeight: "500" },
  filterTextActive: { color: "#fff" },
  emptyBox: {
    backgroundColor: "#1a1f3c",
    borderRadius: 14,
    padding: 24,
    alignItems: "center",
    borderWidth: 0.5,
    borderColor: "#2a2f5c",
  },
  emptyText: { color: "#6b7280", fontSize: 14 },
  ratingCard: {
    backgroundColor: "#1a1f3c",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 0.5,
    borderColor: "#2a2f5c",
  },
  ratingHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 10,
  },
  avatar: {
    width: 38,
    height: 38,
    backgroundColor: "#4f46e5",
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  ratingInfo: { flex: 1 },
  studentName: { color: "#fff", fontSize: 14, fontWeight: "600" },
  lecturerName: { color: "#6b7280", fontSize: 12, marginTop: 2 },
  ratingComment: { color: "#9ca3af", fontSize: 13, marginTop: 8 },
});
