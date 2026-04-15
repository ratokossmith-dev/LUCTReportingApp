import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../config/AuthContext";
import {
  getAllLecturers,
  getStudentRatings,
  submitRating,
} from "../../config/firestore";

export default function StudentRating() {
  const { profile } = useAuth();
  const [lecturers, setLecturers] = useState([]);
  const [myRatings, setMyRatings] = useState([]);
  const [selectedLecturer, setSelectedLecturer] = useState(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!profile) return;
    loadData();
  }, [profile]);

  const loadData = async () => {
    try {
      const [l, r] = await Promise.all([
        getAllLecturers(),
        getStudentRatings(profile.id),
      ]);
      setLecturers(l);
      setMyRatings(r);
    } catch (e) {
      console.log("Error:", e);
    }
    setLoading(false);
  };

  const handleSubmit = useCallback(async () => {
    if (!selectedLecturer) {
      Alert.alert("Error", "Please select a lecturer");
      return;
    }
    if (rating === 0) {
      Alert.alert("Error", "Please select a rating");
      return;
    }
    setSubmitting(true);
    try {
      await submitRating({
        lecturerId: selectedLecturer.id,
        lecturerName: selectedLecturer.name,
        studentId: profile.id,
        studentName: profile.name,
        rating,
        comment,
        course: selectedLecturer.courses?.[0] || "N/A",
      });
      Alert.alert("Success", "Rating submitted successfully!");
      setRating(0);
      setComment("");
      setSelectedLecturer(null);
      loadData();
    } catch (e) {
      Alert.alert("Error", "Failed to submit rating");
    }
    setSubmitting(false);
  }, [selectedLecturer, rating, comment, profile]);

  const Stars = ({ count, onPress }) => (
    <View style={{ flexDirection: "row", gap: 8 }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity key={star} onPress={() => onPress && onPress(star)}>
          <Text
            style={{
              fontSize: 36,
              color: star <= count ? "#f59e0b" : "#2a2f5c",
            }}
          >
            ★
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backBtn}>‹ Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Rate Lecturer</Text>
          <View style={{ width: 50 }} />
        </View>

        <Text style={styles.sectionTitle}>Select Lecturer</Text>
        {loading ? (
          <ActivityIndicator color="#4f46e5" />
        ) : lecturers.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No lecturers found</Text>
          </View>
        ) : (
          lecturers.map((lecturer) => (
            <TouchableOpacity
              key={lecturer.id}
              style={[
                styles.lecturerCard,
                selectedLecturer?.id === lecturer.id &&
                  styles.lecturerCardActive,
              ]}
              onPress={() => setSelectedLecturer(lecturer)}
            >
              <View style={styles.lecturerAvatar}>
                <Text style={styles.lecturerAvatarText}>
                  {lecturer.name?.charAt(0) || "L"}
                </Text>
              </View>
              <View style={styles.lecturerInfo}>
                <Text style={styles.lecturerName}>{lecturer.name}</Text>
                <Text style={styles.lecturerEmail}>{lecturer.email}</Text>
              </View>
              {selectedLecturer?.id === lecturer.id && (
                <Text style={styles.checkMark}>✓</Text>
              )}
            </TouchableOpacity>
          ))
        )}

        <Text style={styles.sectionTitle}>Your Rating</Text>
        <View style={styles.starsCard}>
          <Text style={styles.starsLabel}>
            {rating === 0
              ? "Tap a star to rate"
              : rating === 1
                ? "Poor"
                : rating === 2
                  ? "Fair"
                  : rating === 3
                    ? "Good"
                    : rating === 4
                      ? "Very Good"
                      : "Excellent!"}
          </Text>
          <Stars count={rating} onPress={setRating} />
        </View>

        <Text style={styles.sectionTitle}>Comment (Optional)</Text>
        <TextInput
          style={styles.commentInput}
          placeholder="Share your experience..."
          placeholderTextColor="#555b7a"
          value={comment}
          onChangeText={setComment}
          multiline
        />

        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.submitDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitText}>Submit Rating</Text>
          )}
        </TouchableOpacity>

        {myRatings.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>My Previous Ratings</Text>
            {myRatings.map((r, index) => (
              <View key={r.id || index} style={styles.ratingCard}>
                <Text style={styles.ratingLecturer}>{r.lecturerName}</Text>
                <View
                  style={{ flexDirection: "row", gap: 2, marginVertical: 4 }}
                >
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Text
                      key={s}
                      style={{
                        fontSize: 14,
                        color: s <= r.rating ? "#f59e0b" : "#2a2f5c",
                      }}
                    >
                      ★
                    </Text>
                  ))}
                </View>
                {r.comment ? (
                  <Text style={styles.ratingComment}>{r.comment}</Text>
                ) : null}
              </View>
            ))}
          </>
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
    marginBottom: 16,
  },
  emptyText: { color: "#6b7280", fontSize: 14 },
  lecturerCard: {
    backgroundColor: "#1a1f3c",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 0.5,
    borderColor: "#2a2f5c",
  },
  lecturerCardActive: { borderColor: "#4f46e5" },
  lecturerAvatar: {
    width: 44,
    height: 44,
    backgroundColor: "#4f46e5",
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  lecturerAvatarText: { color: "#fff", fontSize: 18, fontWeight: "700" },
  lecturerInfo: { flex: 1 },
  lecturerName: { color: "#fff", fontSize: 15, fontWeight: "600" },
  lecturerEmail: { color: "#6b7280", fontSize: 12, marginTop: 2 },
  checkMark: { color: "#4f46e5", fontSize: 20, fontWeight: "700" },
  starsCard: {
    backgroundColor: "#1a1f3c",
    borderRadius: 14,
    padding: 20,
    marginBottom: 24,
    alignItems: "center",
    borderWidth: 0.5,
    borderColor: "#2a2f5c",
  },
  starsLabel: { color: "#9ca3af", fontSize: 14, marginBottom: 12 },
  commentInput: {
    backgroundColor: "#1a1f3c",
    borderRadius: 14,
    padding: 16,
    color: "#fff",
    marginBottom: 24,
    borderWidth: 0.5,
    borderColor: "#2a2f5c",
    fontSize: 14,
    minHeight: 120,
    textAlignVertical: "top",
  },
  submitButton: {
    backgroundColor: "#4f46e5",
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    marginBottom: 24,
  },
  submitDisabled: { backgroundColor: "#3730a3" },
  submitText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  ratingCard: {
    backgroundColor: "#1a1f3c",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 0.5,
    borderColor: "#2a2f5c",
  },
  ratingLecturer: { color: "#fff", fontSize: 14, fontWeight: "600" },
  ratingComment: { color: "#9ca3af", fontSize: 13, marginTop: 4 },
});
