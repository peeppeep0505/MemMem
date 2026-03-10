// components/Diary/DiaryEditor.tsx
// ใช้ได้ทั้ง create และ edit
// - create: เข้ามาจาก /diary/create → ไม่มี ?id= → โหมด create
// - edit:   เข้ามาจาก /diary/edit?id=xxx → มี ?id= → โหมด edit

import {
  View, Text, TextInput, TouchableOpacity,
  Image, ScrollView, Alert, ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useState, useEffect } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import WebLayout from "../common/WebLayout";
import { createDiary, getDiaryById, updateDiary, getUserDiaryByMonth } from "@/services/diaryService";
import { useAuth } from "@/contexts/AuthContext";
import { getSelectedDate, clearSelectedDate } from "./DiaryStore";

const moods = [
  { emoji: "😊", label: "Happy" },
  { emoji: "😌", label: "Calm" },
  { emoji: "🥰", label: "Loved" },
  { emoji: "😢", label: "Sad" },
  { emoji: "😡", label: "Angry" },
];

const emojiToLabel: Record<string, string> = Object.fromEntries(
  moods.map((m) => [m.emoji, m.label])
);

export default function DiaryEditor() {
  const { user } = useAuth();
  const router   = useRouter();

  // ── mode detection ────────────────────────────────────────────────────────
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEdit = !!id;

  // ── date ──────────────────────────────────────────────────────────────────
  // create mode: ใช้วันที่จาก DiaryStore
  // edit mode:   ใช้วันที่จาก diary ที่ fetch มา (set ใน useEffect)
  const [dateStr, setDateStr] = useState<string>(
    !isEdit ? (getSelectedDate() ?? new Date().toISOString().split("T")[0]) : ""
  );

  const parsedDate = dateStr ? (() => {
    const [y, m, d] = dateStr.split("-").map(Number);
    return new Date(y, m - 1, d);
  })() : null;

  const dayName   = parsedDate?.toLocaleDateString("en-US", { weekday: "long" }) ?? "";
  const dateLabel = parsedDate?.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) ?? "";

  // ── form state ────────────────────────────────────────────────────────────
  const [title,        setTitle]        = useState("");
  const [content,      setContent]      = useState("");
  const [mood,         setMood]         = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64,  setImageBase64]  = useState<string | null>(null);

  // ── loading / saving state ────────────────────────────────────────────────
  const [loadingDiary, setLoadingDiary] = useState(isEdit); // true เฉพาะ edit mode
  const [loadError,    setLoadError]    = useState<string | null>(null);
  const [saving,       setSaving]       = useState(false);
  const [error,        setError]        = useState<string | null>(null);

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;

  // ── fetch existing diary (edit mode only) ─────────────────────────────────
  useEffect(() => {
    if (!isEdit || !id) return;

    (async () => {
      try {
        const diary = await getDiaryById(id);

        // prefill ทุก field
        setTitle(diary.title ?? "");
        setContent(diary.description ?? "");
        setMood(diary.mood ? (emojiToLabel[diary.mood] ?? null) : null);
        setDateStr(diary.date?.split("T")[0] ?? "");  // ✅ set วันที่จาก diary จริง

        // รูปเดิม — img เป็น base64 string อยู่แล้ว (memoryStorage)
        if (diary.img) {
          setImagePreview(diary.img);
        }
      } catch (err: any) {
        setLoadError(err?.message ?? "Failed to load diary");
      } finally {
        setLoadingDiary(false);
      }
    })();
  }, [id]);

  // ── image picker ──────────────────────────────────────────────────────────
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      base64: true,
      quality: 0.7,
    });
    if (!result.canceled) {
      const asset = result.assets[0];
      setImagePreview(asset.uri);
      setImageBase64(`data:image/jpeg;base64,${asset.base64}`);
    }
  };

  // ── save ──────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!user)                            { setError("Not logged in"); return; }
    if (!title.trim() && !content.trim()) { setError("Please write something"); return; }

    setSaving(true);
    setError(null);

    try {
      const selectedMoodEmoji = moods.find((m) => m.label === mood)?.emoji;

      if (isEdit && id) {
        // ── EDIT MODE ──
        await updateDiary(id, {
          title,
          description: content,
          mood:        selectedMoodEmoji,
          imageBase64: imageBase64 ?? undefined, // ส่งเฉพาะถ้าเลือกรูปใหม่
        });

      } else {
        // ── CREATE MODE ──
        // เช็คว่าวันนี้มี entry แล้วหรือยัง
        const month   = dateStr.slice(0, 7);
        const diaries = await getUserDiaryByMonth(user._id, month);
        const exists  = diaries.find((d: any) => d.date?.split("T")[0] === dateStr);

        if (exists) {
          Alert.alert(
            "Entry exists",
            "You already have an entry for this day. Edit it instead?",
            [
              { text: "Cancel", style: "cancel" },
              {
                text: "Edit",
                onPress: () => router.replace(`/diary/edit?id=${exists._id}` as any),
              },
            ]
          );
          return;
        }

        await createDiary({
          userId:      user._id,
          date:        dateStr,
          mood:        selectedMoodEmoji,
          title,
          description: content,
          imageBase64: imageBase64 ?? undefined,
        });

        clearSelectedDate();
      }

      setTimeout(() => router.replace("/diary"), 300);

    } catch (err: any) {
      console.error("diary save error:", err);
      setError(err?.message ?? "Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // ── loading state (edit mode) ─────────────────────────────────────────────
  if (loadingDiary) {
    return (
      <WebLayout>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 80 }}>
          <ActivityIndicator size="large" color="#1a1a1a" />
          <Text style={{ marginTop: 12, color: "#9ca3af", fontSize: 14 }}>Loading entry…</Text>
        </View>
      </WebLayout>
    );
  }

  if (loadError) {
    return (
      <WebLayout>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 80 }}>
          <Text style={{ fontSize: 32, marginBottom: 12 }}>⚠️</Text>
          <Text style={{ fontSize: 15, color: "#e11d48", marginBottom: 20 }}>{loadError}</Text>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ paddingHorizontal: 20, paddingVertical: 10, backgroundColor: "#1a1a1a", borderRadius: 12 }}
          >
            <Text style={{ color: "#fff", fontWeight: "600" }}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </WebLayout>
    );
  }

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <WebLayout>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 80 }}
      >
        <View className="max-w-2xl mx-auto w-full px-4">

          {/* Header */}
          <View className="mb-8 pt-2">
            <Text style={{ fontSize: 11, fontWeight: "600", letterSpacing: 3, color: "#f87171", textTransform: "uppercase", marginBottom: 4 }}>
              {dayName}
            </Text>
            <Text style={{ fontSize: 30, fontWeight: "700", color: "#111827", fontFamily: "Georgia, serif" }}>
              {isEdit ? "Edit Entry" : "New Entry"}
            </Text>
            <Text style={{ color: "#9ca3af", fontSize: 13, marginTop: 2 }}>
              {dateLabel}
            </Text>
          </View>

          <View style={{ backgroundColor: "#fff", borderRadius: 20, borderWidth: 1, borderColor: "#f0ece8", overflow: "hidden" }}>

            {/* Cover photo */}
            {imagePreview ? (
              <View style={{ position: "relative" }}>
                <Image
                  source={{ uri: imagePreview }}
                  style={{ width: "100%", height: 220 }}
                  resizeMode="cover"
                />
                <TouchableOpacity
                  onPress={() => { setImagePreview(null); setImageBase64(null); }}
                  style={{ position: "absolute", top: 12, right: 12, backgroundColor: "rgba(0,0,0,0.45)", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 }}
                >
                  <Text style={{ color: "#fff", fontSize: 12 }}>Remove</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                onPress={pickImage}
                style={{ height: 140, backgroundColor: "#fdf6f0", alignItems: "center", justifyContent: "center", gap: 8 }}
              >
                <Text style={{ fontSize: 28 }}>🖼</Text>
                <Text style={{ color: "#9ca3af", fontSize: 13 }}>
                  {isEdit ? "Tap to change cover photo" : "Tap to add a cover photo"}
                </Text>
              </TouchableOpacity>
            )}

            <View style={{ padding: 24 }}>

              {/* Mood */}
              <View style={{ flexDirection: "row", gap: 10, marginBottom: 20 }}>
                {moods.map((m) => {
                  const selected = mood === m.label;
                  return (
                    <TouchableOpacity
                      key={m.label}
                      onPress={() => setMood(selected ? null : m.label)}
                      style={{ alignItems: "center", padding: 10, borderRadius: 12, borderWidth: 1.5, borderColor: selected ? "#1a1a1a" : "#f0ece8", backgroundColor: selected ? "#1a1a1a" : "#fafaf9", gap: 2 }}
                    >
                      <Text style={{ fontSize: 20 }}>{m.emoji}</Text>
                      <Text style={{ fontSize: 10, color: selected ? "#fff" : "#9ca3af", fontWeight: "500" }}>{m.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={{ height: 1, backgroundColor: "#f3f4f6", marginBottom: 20 }} />

              {/* Title */}
              <TextInput
                placeholder="Entry title..."
                value={title}
                onChangeText={setTitle}
                placeholderTextColor="#d1d5db"
                style={{ fontSize: 20, fontWeight: "700", color: "#111827", marginBottom: 12, fontFamily: "Georgia, serif", outline: "none" } as any}
              />

              {/* Content */}
              <TextInput
                multiline
                placeholder="Write about your day..."
                value={content}
                onChangeText={setContent}
                placeholderTextColor="#d1d5db"
                style={{ fontSize: 15, color: "#374151", lineHeight: 26, minHeight: 140, textAlignVertical: "top", outline: "none" } as any}
              />

              {/* Word count */}
              <Text style={{ fontSize: 11, color: "#d1d5db", textAlign: "right", marginTop: 8, marginBottom: 16 }}>
                {wordCount} {wordCount === 1 ? "word" : "words"}
              </Text>

              {/* Error */}
              {error && (
                <View style={{ backgroundColor: "#fff1f2", borderWidth: 1, borderColor: "#fecdd3", borderRadius: 10, padding: 12, marginBottom: 16 }}>
                  <Text style={{ fontSize: 13, color: "#e11d48" }}>⚠️ {error}</Text>
                </View>
              )}

              <View style={{ height: 1, backgroundColor: "#f3f4f6", marginBottom: 20 }} />

              {/* Actions */}
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                {!imagePreview && (
                  <TouchableOpacity
                    onPress={pickImage}
                    style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: "#f0ece8", backgroundColor: "#fafaf9" }}
                  >
                    <Text style={{ fontSize: 14 }}>📷</Text>
                    <Text style={{ fontSize: 13, color: "#6b7280", fontWeight: "500" }}>Add Photo</Text>
                  </TouchableOpacity>
                )}

                <View style={{ flexDirection: "row", gap: 10, marginLeft: "auto" as any }}>
                  <TouchableOpacity
                    onPress={() => { clearSelectedDate(); router.back(); }}
                    style={{ paddingHorizontal: 18, paddingVertical: 11, borderRadius: 12, borderWidth: 1, borderColor: "#f0ece8" }}
                  >
                    <Text style={{ color: "#9ca3af", fontSize: 14 }}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleSave}
                    disabled={saving}
                    style={{ paddingHorizontal: 22, paddingVertical: 11, borderRadius: 12, backgroundColor: (title.trim() || content.trim()) ? "#1a1a1a" : "#e5e7eb", flexDirection: "row", alignItems: "center", gap: 8 }}
                  >
                    {saving && <ActivityIndicator size="small" color="#fff" />}
                    <Text style={{ color: (title.trim() || content.trim()) ? "#fff" : "#9ca3af", fontWeight: "600", fontSize: 14 }}>
                      {saving ? "Saving…" : isEdit ? "Save Changes" : "Save Entry"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

            </View>
          </View>
        </View>
      </ScrollView>
    </WebLayout>
  );
}