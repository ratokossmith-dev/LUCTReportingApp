import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
  getClassesByStudent,
  getStudentRatings,
  submitRating,
} from "../../config/firestore";

export default function StudentRating() {
  const { profile } = useAuth();
  const [lecturers, setLecturers] = useState([]);
  const [myRatings, setMyRatings] = useState([]);
  const [selected, setSelected] = useState(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!profile?.id) return;
    loadData();
  }, [profile]);

  const loadData = async () => {
    try {
      const myClasses = await getClassesByStudent(profile.id);
      const lecturerIds = [
        ...new Set(myClasses.map((c) => c.lecturerId).filter(Boolean)),
      ];
      const allLecturers = await getAllLecturers();
      const myLecturers =
        lecturerIds.length > 0
          ? allLecturers.filter((l) => lecturerIds.includes(l.id))
          : allLecturers;
      const myR = await getStudentRatings(profile.id);
      setLecturers(myLecturers);
      setMyRatings(myR);
    } catch (e) {
      console.log("Rating load error:", e);
    }
    setLoading(false);
  };

  const alreadyRated = (lecturerId) =>
    myRatings.some((r) => r.lecturerId === lecturerId);

  const handleSubmit = useCallback(async () => {
    if (!selected) {
      Alert.alert("Error", "Please select a lecturer");
      return;
    }
    if (rating === 0) {
      Alert.alert("Error", "Please select a star rating");
      return;
    }
    if (alreadyRated(selected.id)) {
      Alert.alert("Already Rated", "You have already rated this lecturer.");
      return;
    }
    setSaving(true);
    try {
      await submitRating({
        lecturerId: selected.id,
        lecturerName: selected.name,
        studentId: profile.id,
        studentName: profile.name,
        rating,
        comment: comment.trim(),
        course: "N/A",
      });
      Alert.alert("Success ✅", "Your rating has been submitted!");
      setRating(0);
      setComment("");
      setSelected(null);
      loadData();
    } catch (e) {
      Alert.alert("Error", "Failed to submit rating. Try again.");
    }
    setSaving(false);
  }, [selected, rating, comment, profile]);

  const ratingLabels = ["", "Poor", "Fair", "Good", "Very Good", "Excellent!"];

  return (
    <View style={s.safe}>
      <ScrollView
        style={s.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={s.back}>‹ Back</Text>
          </TouchableOpacity>
          <Text style={s.title}>Rate My Lecturer</Text>
          <View style={{ width: 50 }} />
        </View>

        <Text style={s.section}>Select Your Lecturer</Text>
        {loading ? (
          <ActivityIndicator color="#4f46e5" />
        ) : lecturers.length === 0 ? (
          <View style={s.empty}>
            <Text style={s.emptyIcon}>👨‍🏫</Text>
            <Text style={s.emptyTitle}>No lecturers found</Text>
            <Text style={s.emptyText}>
              You need to be enrolled in a class before rating a lecturer.
            </Text>
          </View>
        ) : (
          lecturers.map((l) => {
            const rated = alreadyRated(l.id);
            const myRating = myRatings.find((r) => r.lecturerId === l.id);
            return (
              <TouchableOpacity
                key={l.id}
                style={[
                  s.lecCard,
                  selected?.id === l.id && s.lecCardActive,
                  rated && s.lecCardRated,
                ]}
                onPress={() => !rated && setSelected(l)}
              >
                <View style={s.lecAvatar}>
                  <Text style={s.lecAvatarText}>
                    {l.name?.charAt(0) || "L"}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.lecName}>{l.name}</Text>
                  <Text style={s.lecEmail}>{l.email}</Text>
                  {rated && (
                    <View
                      style={{
                        flexDirection: "row",
                        gap: 2,
                        marginTop: 4,
                        alignItems: "center",
                      }}
                    >
                      {[1, 2, 3, 4, 5].map((st) => (
                        <Text
                          key={st}
                          style={{
                            fontSize: 12,
                            color:
                              st <= (myRating?.rating || 0)
                                ? "#f59e0b"
                                : "#2a2f5c",
                          }}
                        >
                          ★
                        </Text>
                      ))}
                      <Text style={s.ratedLabel}> Already rated</Text>
                    </View>
                  )}
                </View>
                {selected?.id === l.id && !rated && (
                  <Text style={s.check}>✓</Text>
                )}
              </TouchableOpacity>
            );
          })
        )}

        {selected && !alreadyRated(selected.id) && (
          <>
            <Text style={s.section}>Your Rating for {selected.name}</Text>
            <View style={s.starsCard}>
              <Text style={s.starsLabel}>
                {rating === 0 ? "Tap a star to rate" : ratingLabels[rating]}
              </Text>
              <View style={{ flexDirection: "row", gap: 8 }}>
                {[1, 2, 3, 4, 5].map((st) => (
                  <TouchableOpacity key={st} onPress={() => setRating(st)}>
                    <Text
                      style={{
                        fontSize: 40,
                        color: st <= rating ? "#f59e0b" : "#2a2f5c",
                      }}
                    >
                      ★
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <Text style={s.section}>Comment (Optional)</Text>
            <TextInput
              style={s.commentInput}
              placeholder="Share your experience with this lecturer..."
              placeholderTextColor="#555b7a"
              value={comment}
              onChangeText={setComment}
              multiline
            />

            <TouchableOpacity
              style={[s.submitBtn, saving && s.submitDisabled]}
              onPress={handleSubmit}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={s.submitText}>Submit Rating</Text>
              )}
            </TouchableOpacity>
          </>
        )}

        {myRatings.length > 0 && (
          <>
            <Text style={s.section}>My Submitted Ratings</Text>
            {myRatings.map((r, i) => (
              <View key={r.id || i} style={s.ratingCard}>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    marginBottom: 6,
                  }}
                >
                  <Text style={s.ratingLecName}>{r.lecturerName}</Text>
                  <View style={{ flexDirection: "row", gap: 2 }}>
                    {[1, 2, 3, 4, 5].map((st) => (
                      <Text
                        key={st}
                        style={{
                          fontSize: 14,
                          color: st <= r.rating ? "#f59e0b" : "#2a2f5c",
                        }}
                      >
                        ★
                      </Text>
                    ))}
                  </View>
                </View>
                {r.comment ? (
                  <Text style={s.ratingComment}>{r.comment}</Text>
                ) : null}
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
  section: { color: "#fff", fontSize: 15, fontWeight: "600", marginBottom: 12 },
  empty: {
    backgroundColor: "#1a1f3c",
    borderRadius: 14,
    padding: 28,
    alignItems: "center",
    borderWidth: 0.5,
    borderColor: "#2a2f5c",
    marginBottom: 16,
  },
  emptyIcon: { fontSize: 36, marginBottom: 10 },
  emptyTitle: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 6,
  },
  emptyText: { color: "#6b7280", fontSize: 12, textAlign: "center" },
  lecCard: {
    backgroundColor: "#1a1f3c",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 0.5,
    borderColor: "#2a2f5c",
  },
  lecCardActive: { borderColor: "#4f46e5", borderWidth: 1.5 },
  lecCardRated: { opacity: 0.7 },
  lecAvatar: {
    width: 44,
    height: 44,
    backgroundColor: "#4f46e5",
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  lecAvatarText: { color: "#fff", fontSize: 18, fontWeight: "700" },
  lecName: { color: "#fff", fontSize: 15, fontWeight: "600" },
  lecEmail: { color: "#6b7280", fontSize: 12, marginTop: 2 },
  ratedLabel: { color: "#10b981", fontSize: 11 },
  check: { color: "#4f46e5", fontSize: 22, fontWeight: "700" },
  starsCard: {
    backgroundColor: "#1a1f3c",
    borderRadius: 14,
    padding: 20,
    marginBottom: 20,
    alignItems: "center",
    borderWidth: 0.5,
    borderColor: "#2a2f5c",
  },
  starsLabel: { color: "#9ca3af", fontSize: 14, marginBottom: 14 },
  commentInput: {
    backgroundColor: "#1a1f3c",
    borderRadius: 14,
    padding: 16,
    color: "#fff",
    marginBottom: 20,
    borderWidth: 0.5,
    borderColor: "#2a2f5c",
    fontSize: 14,
    minHeight: 120,
    textAlignVertical: "top",
  },
  submitBtn: {
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
  ratingLecName: { color: "#fff", fontSize: 14, fontWeight: "600" },
  ratingComment: { color: "#9ca3af", fontSize: 13, marginTop: 4 },
});
