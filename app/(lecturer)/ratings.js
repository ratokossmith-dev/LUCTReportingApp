import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../config/AuthContext";
import { getRatingsByLecturer } from "../../config/firestore";

export default function LecturerRatings() {
  const { profile } = useAuth();
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.id) return;
    (async () => {
      try {
        const data = await getRatingsByLecturer(profile.id);
        setRatings(data);
      } catch (e) {
        console.log("Ratings error:", e);
      }
      setLoading(false);
    })();
  }, [profile]);

  const avg =
    ratings.length > 0
      ? (ratings.reduce((a, b) => a + b.rating, 0) / ratings.length).toFixed(1)
      : "0.0";

  return (
    <View style={s.safe}>
      <ScrollView style={s.container} showsVerticalScrollIndicator={false}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={s.back}>‹ Back</Text>
          </TouchableOpacity>
          <Text style={s.title}>My Ratings</Text>
          <View style={{ width: 50 }} />
        </View>

        <View style={s.overallCard}>
          <Text style={s.overallVal}>{avg}</Text>
          <View style={{ flexDirection: "row", gap: 4, marginBottom: 8 }}>
            {[1, 2, 3, 4, 5].map((st) => (
              <Text
                key={st}
                style={{
                  fontSize: 24,
                  color:
                    st <= Math.round(parseFloat(avg)) ? "#f59e0b" : "#2a2f5c",
                }}
              >
                ★
              </Text>
            ))}
          </View>
          <Text style={s.overallLabel}>
            Based on {ratings.length} student reviews
          </Text>
          <View style={{ width: "100%", gap: 8, marginTop: 16 }}>
            {[5, 4, 3, 2, 1].map((star) => {
              const count = ratings.filter((r) => r.rating === star).length;
              const pct =
                ratings.length > 0 ? (count / ratings.length) * 100 : 0;
              return (
                <View
                  key={star}
                  style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
                >
                  <Text style={{ color: "#f59e0b", fontSize: 12, width: 30 }}>
                    {star} ★
                  </Text>
                  <View
                    style={{
                      flex: 1,
                      height: 6,
                      backgroundColor: "#0a0f2c",
                      borderRadius: 3,
                    }}
                  >
                    <View
                      style={{
                        width: `${pct}%`,
                        height: 6,
                        backgroundColor: "#f59e0b",
                        borderRadius: 3,
                      }}
                    />
                  </View>
                  <Text
                    style={{
                      color: "#6b7280",
                      fontSize: 12,
                      width: 20,
                      textAlign: "right",
                    }}
                  >
                    {count}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        <Text style={s.section}>Student Reviews ({ratings.length})</Text>
        {loading ? (
          <ActivityIndicator color="#4f46e5" />
        ) : ratings.length === 0 ? (
          <View style={s.empty}>
            <Text style={s.emptyIcon}>⭐</Text>
            <Text style={s.emptyTitle}>No ratings yet</Text>
            <Text style={s.emptyText}>
              Students will rate you after attending your classes.
            </Text>
          </View>
        ) : (
          ratings.map((item, i) => (
            <View key={item.id || i} style={s.reviewCard}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 8,
                  gap: 10,
                }}
              >
                <View style={s.avatar}>
                  <Text style={s.avatarText}>
                    {item.studentName?.charAt(0) || "S"}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.reviewName}>
                    {item.studentName || "Student"}
                  </Text>
                  <Text style={s.reviewDate}>{item.course || "N/A"}</Text>
                </View>
                <View style={{ flexDirection: "row", gap: 2 }}>
                  {[1, 2, 3, 4, 5].map((st) => (
                    <Text
                      key={st}
                      style={{
                        fontSize: 14,
                        color: st <= item.rating ? "#f59e0b" : "#2a2f5c",
                      }}
                    >
                      ★
                    </Text>
                  ))}
                </View>
              </View>
              {item.comment ? (
                <Text style={s.comment}>{item.comment}</Text>
              ) : null}
            </View>
          ))
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
  overallCard: {
    backgroundColor: "#1a1f3c",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    alignItems: "center",
    borderWidth: 0.5,
    borderColor: "#2a2f5c",
  },
  overallVal: { color: "#f59e0b", fontSize: 56, fontWeight: "700" },
  overallLabel: { color: "#6b7280", fontSize: 13 },
  section: { color: "#fff", fontSize: 15, fontWeight: "600", marginBottom: 12 },
  empty: {
    backgroundColor: "#1a1f3c",
    borderRadius: 14,
    padding: 28,
    alignItems: "center",
    borderWidth: 0.5,
    borderColor: "#2a2f5c",
  },
  emptyIcon: { fontSize: 36, marginBottom: 10 },
  emptyTitle: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 6,
  },
  emptyText: { color: "#6b7280", fontSize: 12, textAlign: "center" },
  reviewCard: {
    backgroundColor: "#1a1f3c",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 0.5,
    borderColor: "#2a2f5c",
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
  reviewName: { color: "#fff", fontSize: 14, fontWeight: "600" },
  reviewDate: { color: "#6b7280", fontSize: 12, marginTop: 2 },
  comment: { color: "#9ca3af", fontSize: 13, marginTop: 4 },
});
