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
import { useAuth } from "../../config/AuthContext";
import { getRatingsByLecturer } from "../../config/firestore";

export default function RatingsScreen() {
  const { profile } = useAuth();
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    loadRatings();
  }, [profile]);

  const loadRatings = async () => {
    try {
      const data = await getRatingsByLecturer(profile.id);
      setRatings(data);
    } catch (e) {
      console.log("Error:", e);
    }
    setLoading(false);
  };

  const avgRating =
    ratings.length > 0
      ? (ratings.reduce((a, b) => a + b.rating, 0) / ratings.length).toFixed(1)
      : "0.0";

  const Stars = ({ count }) => (
    <View style={{ flexDirection: "row", gap: 4 }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <Text
          key={s}
          style={{ fontSize: 18, color: s <= count ? "#f59e0b" : "#2a2f5c" }}
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
          <Text style={styles.headerTitle}>My Ratings</Text>
          <View style={{ width: 50 }} />
        </View>

        <View style={styles.overallCard}>
          <Text style={styles.overallValue}>{avgRating}</Text>
          <Stars count={Math.round(parseFloat(avgRating))} />
          <Text style={styles.overallLabel}>
            Based on {ratings.length} reviews
          </Text>
          <View style={styles.breakdown}>
            {[5, 4, 3, 2, 1].map((star) => {
              const count = ratings.filter((r) => r.rating === star).length;
              const percent =
                ratings.length > 0 ? (count / ratings.length) * 100 : 0;
              return (
                <View key={star} style={styles.breakdownRow}>
                  <Text style={styles.breakdownStar}>{star} ★</Text>
                  <View style={styles.breakdownBar}>
                    <View
                      style={[styles.breakdownFill, { width: `${percent}%` }]}
                    />
                  </View>
                  <Text style={styles.breakdownCount}>{count}</Text>
                </View>
              );
            })}
          </View>
        </View>

        <Text style={styles.sectionTitle}>
          Student Reviews ({ratings.length})
        </Text>
        {loading ? (
          <ActivityIndicator color="#4f46e5" />
        ) : ratings.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No ratings yet</Text>
          </View>
        ) : (
          ratings.map((item, index) => (
            <View key={item.id || index} style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <View style={styles.reviewAvatar}>
                  <Text style={styles.reviewAvatarText}>
                    {item.studentName?.charAt(0) || "S"}
                  </Text>
                </View>
                <View style={styles.reviewInfo}>
                  <Text style={styles.reviewName}>
                    {item.studentName || "Student"}
                  </Text>
                  <Text style={styles.reviewCourse}>
                    {item.course || "N/A"}
                  </Text>
                </View>
              </View>
              <Stars count={item.rating} />
              {item.comment ? (
                <Text style={styles.reviewComment}>{item.comment}</Text>
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
  overallValue: { color: "#f59e0b", fontSize: 56, fontWeight: "700" },
  overallLabel: {
    color: "#6b7280",
    fontSize: 13,
    marginTop: 8,
    marginBottom: 16,
  },
  breakdown: { width: "100%", gap: 8 },
  breakdownRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  breakdownStar: { color: "#f59e0b", fontSize: 12, width: 30 },
  breakdownBar: {
    flex: 1,
    height: 6,
    backgroundColor: "#0a0f2c",
    borderRadius: 3,
  },
  breakdownFill: { height: 6, backgroundColor: "#f59e0b", borderRadius: 3 },
  breakdownCount: {
    color: "#6b7280",
    fontSize: 12,
    width: 20,
    textAlign: "right",
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 12,
  },
  emptyBox: {
    backgroundColor: "#1a1f3c",
    borderRadius: 14,
    padding: 24,
    alignItems: "center",
    borderWidth: 0.5,
    borderColor: "#2a2f5c",
  },
  emptyText: { color: "#6b7280", fontSize: 14 },
  reviewCard: {
    backgroundColor: "#1a1f3c",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 0.5,
    borderColor: "#2a2f5c",
  },
  reviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 10,
  },
  reviewAvatar: {
    width: 38,
    height: 38,
    backgroundColor: "#4f46e5",
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  reviewAvatarText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  reviewInfo: { flex: 1 },
  reviewName: { color: "#fff", fontSize: 14, fontWeight: "600" },
  reviewCourse: { color: "#6b7280", fontSize: 12 },
  reviewComment: { color: "#9ca3af", fontSize: 13, marginTop: 8 },
});
