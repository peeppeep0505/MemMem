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
import { useAppTheme } from "@/contexts/ThemeContext";
import { Fonts, Glyphs } from "@/constants/theme";

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
  const { theme: C } = useAppTheme();
  const F = Fonts as any;

  // ── mode detection ──────────────────────────────────────────────────────────
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEdit = !!id;

  // ── date ────────────────────────────────────────────────────────────────────
  const [dateStr, setDateStr] = useState<string>(
    !isEdit ? (getSelectedDate() ?? new Date().toISOString().split("T")[0]) : ""
  );

  const parsedDate = dateStr ? (() => {
    const [y, m, d] = dateStr.split("-").map(Number);
    return new Date(y, m - 1, d);
  })() : null;

  const dayName   = parsedDate?.toLocaleDateString("en-US", { weekday: "long" }) ?? "";
  const dateLabel = parsedDate?.toLocaleDateString("en-US", {
    month: "long", day: "numeric", year: "numeric",
  }) ?? "";

  // ── form state ──────────────────────────────────────────────────────────────
  const [title,        setTitle]        = useState("");
  const [content,      setContent]      = useState("");
  const [mood,         setMood]         = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64,  setImageBase64]  = useState<string | null>(null);

  // ── loading / saving ────────────────────────────────────────────────────────
  const [loadingDiary, setLoadingDiary] = useState(isEdit);
  const [loadError,    setLoadError]    = useState<string | null>(null);
  const [saving,       setSaving]       = useState(false);
  const [error,        setError]        = useState<string | null>(null);

  const wordCount  = content.trim() ? content.trim().split(/\s+/).length : 0;
  const hasContent = !!(title.trim() || content.trim());

  // ── fetch existing diary (edit mode only) ───────────────────────────────────
  useEffect(() => {
    if (!isEdit || !id) return;
    (async () => {
      try {
        const diary = await getDiaryById(id);
        setTitle(diary.title ?? "");
        setContent(diary.description ?? "");
        setMood(diary.mood ? (emojiToLabel[diary.mood] ?? null) : null);
        setDateStr(diary.date?.split("T")[0] ?? "");
        if (diary.img) setImagePreview(diary.img);
      } catch (err: any) {
        setLoadError(err?.message ?? "Failed to load diary");
      } finally {
        setLoadingDiary(false);
      }
    })();
  }, [id]);

  // ── image picker ────────────────────────────────────────────────────────────
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

  // ── save ────────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!user)       { setError("Not logged in"); return; }
    if (!hasContent) { setError(`Please write something ${Glyphs.heart}`); return; }

    setSaving(true);
    setError(null);

    try {
      const selectedMoodEmoji = moods.find((m) => m.label === mood)?.emoji;

      if (isEdit && id) {
        await updateDiary(id, {
          title,
          description: content,
          mood:        selectedMoodEmoji,
          imageBase64: imageBase64 ?? undefined,
        });
      } else {
        const monthStr = dateStr.slice(0, 7);
        const diaries  = await getUserDiaryByMonth(user._id, monthStr);
        const exists   = diaries.find((d: any) => d.date?.split("T")[0] === dateStr);

        if (exists) {
          Alert.alert(
            `Entry exists ${Glyphs.sparkle}`,
            "You already have an entry for this day. Edit it instead?",
            [
              { text: "Cancel", style: "cancel" },
              { text: "Edit", onPress: () => router.replace(`/diary/edit?id=${exists._id}` as any) },
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
      setError(err?.message ?? "Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // ── loading screen (edit mode) ──────────────────────────────────────────────
  if (loadingDiary) {
    return (
      <WebLayout>
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            paddingTop: 80,
            backgroundColor: C.background,
          }}
        >
          <Text style={{ fontSize: 32, marginBottom: 12 }}>{Glyphs.sparkle}</Text>
          <ActivityIndicator size="large" color={C.primary} />
          <Text style={{ marginTop: 12, color: C.mutedText, fontSize: 14 }}>
            Loading your entry…
          </Text>
        </View>
      </WebLayout>
    );
  }

  if (loadError) {
    return (
      <WebLayout>
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            paddingTop: 80,
            backgroundColor: C.background,
          }}
        >
          <Text style={{ fontSize: 32, marginBottom: 12 }}>⚠️</Text>
          <Text style={{ fontSize: 15, color: C.logout, marginBottom: 20 }}>{loadError}</Text>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              paddingHorizontal: 20,
              paddingVertical: 10,
              backgroundColor: C.inkText,
              borderRadius: 12,
            }}
          >
            <Text style={{ color: C.surface, fontWeight: "600" }}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </WebLayout>
    );
  }

  // ── shared card style ───────────────────────────────────────────────────────
  const cardStyle = {
    backgroundColor: C.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: C.border,
    overflow: "hidden" as const,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.07,
    shadowRadius: 24,
  };

  // ── main render ─────────────────────────────────────────────────────────────
  return (
    <WebLayout>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 80 }}
        style={{ backgroundColor: C.background }}
      >
        <View
          style={{
            maxWidth: 680,
            marginHorizontal: "auto",
            width: "100%",
            paddingHorizontal: 20,
          }}
        >
          {/* ── Top deco ── */}
          <View style={{ paddingTop: 28, paddingBottom: 4, alignItems: "center" }}>
            <Text style={{ fontSize: 11, color: C.accent, letterSpacing: 6 }}>
              {`${Glyphs.sparkle} ${Glyphs.soft} ${Glyphs.heart} ${Glyphs.soft} ${Glyphs.sparkle}`}
            </Text>
          </View>

          {/* ── Header ── */}
          <View style={{ marginBottom: 20, paddingTop: 8 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "700",
                  letterSpacing: 4,
                  color: C.primary,
                  textTransform: "uppercase",
                }}
              >
                {dayName}
              </Text>
              <Text style={{ color: C.accent, fontSize: 13 }}>{Glyphs.floral}</Text>
            </View>

            <Text
              style={{
                fontSize: 32,
                fontWeight: "700",
                color: C.inkText,
                fontFamily: F?.display ?? F?.serif,
                lineHeight: 40,
              }}
            >
              {isEdit ? "Edit Entry" : `New Entry ${Glyphs.heart}`}
            </Text>

            <Text style={{ color: C.mutedText, fontSize: 13, marginTop: 2 }}>
              {dateLabel}
            </Text>
          </View>

          {/* ── Editor card ── */}
          <View style={cardStyle}>

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
                  style={{
                    position: "absolute",
                    top: 12,
                    right: 12,
                    backgroundColor: "rgba(0,0,0,0.45)",
                    borderRadius: 20,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                  }}
                >
                  <Text style={{ color: "#fff", fontSize: 12, fontWeight: "600" }}>✕ Remove</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                onPress={pickImage}
                style={{
                  height: 130,
                  backgroundColor: C.coverPlaceholder,
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  borderBottomWidth: 1,
                  borderBottomColor: C.border,
                }}
              >
                <Text style={{ fontSize: 26 }}>🖼</Text>
                <Text style={{ color: C.mutedText, fontSize: 13 }}>
                  {isEdit
                    ? "Tap to change cover photo"
                    : `${Glyphs.sparkle} Add a cover photo`}
                </Text>
              </TouchableOpacity>
            )}

            <View style={{ padding: 24 }}>

              {/* Mood selector */}
              <View style={{ marginBottom: 8 }}>
                <Text
                  style={{
                    fontSize: 11,
                    color: C.mutedText,
                    fontWeight: "600",
                    letterSpacing: 2,
                    textTransform: "uppercase",
                    marginBottom: 10,
                  }}
                >
                  {`${Glyphs.soft} How are you feeling?`}
                </Text>

                <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
                  {moods.map((m) => {
                    const selected = mood === m.label;
                    return (
                      <TouchableOpacity
                        key={m.label}
                        onPress={() => setMood(selected ? null : m.label)}
                        style={{
                          alignItems: "center",
                          paddingHorizontal: 12,
                          paddingVertical: 8,
                          borderRadius: 14,
                          borderWidth: 1.5,
                          borderColor: selected ? C.moodSelected : C.border,
                          backgroundColor: selected ? C.primarySoft : C.paperBg,
                          gap: 3,
                          minWidth: 56,
                        }}
                      >
                        <Text style={{ fontSize: 20 }}>{m.emoji}</Text>
                        <Text
                          style={{
                            fontSize: 10,
                            color: selected ? C.moodSelected : C.mutedText,
                            fontWeight: "600",
                            letterSpacing: 0.3,
                          }}
                        >
                          {m.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Ruled divider */}
              <View style={{ height: 1, backgroundColor: C.ruledLine, marginVertical: 20 }} />

              {/* Title input */}
              <TextInput
                placeholder="Entry title…"
                value={title}
                onChangeText={setTitle}
                placeholderTextColor={C.mutedText}
                style={{
                  fontSize: 22,
                  fontWeight: "700",
                  color: C.inkText,
                  marginBottom: 14,
                  fontFamily: F?.display ?? F?.serif,
                  outline: "none",
                } as any}
              />

              {/* Content input */}
              <TextInput
                multiline
                placeholder={`Write about your day… ${Glyphs.soft} ${Glyphs.heart}`}
                value={content}
                onChangeText={setContent}
                placeholderTextColor={C.mutedText}
                style={{
                  fontSize: 15,
                  color: C.text,
                  lineHeight: 26,
                  minHeight: 150,
                  textAlignVertical: "top",
                  outline: "none",
                  fontFamily: F?.sans,
                } as any}
              />

              {/* Word count */}
              <Text
                style={{
                  fontSize: 11,
                  color: C.mutedText,
                  textAlign: "right",
                  marginTop: 8,
                  marginBottom: 16,
                }}
              >
                {`${wordCount} ${wordCount === 1 ? "word" : "words"} ${Glyphs.sparkle}`}
              </Text>

              {/* Error */}
              {error && (
                <View
                  style={{
                    backgroundColor: C.logoutSoft,
                    borderWidth: 1,
                    borderColor: C.logoutBorder,
                    borderRadius: 12,
                    padding: 12,
                    marginBottom: 16,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <Text style={{ fontSize: 14 }}>⚠️</Text>
                  <Text style={{ fontSize: 13, color: C.logout, flex: 1 }}>{error}</Text>
                </View>
              )}

              {/* Bottom divider */}
              <View style={{ height: 1, backgroundColor: C.ruledLine, marginBottom: 20 }} />

              {/* Action row */}
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>

                {/* Add photo (inline) */}
                {!imagePreview && (
                  <TouchableOpacity
                    onPress={pickImage}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 6,
                      paddingHorizontal: 14,
                      paddingVertical: 10,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: C.border,
                      backgroundColor: C.paperBg,
                    }}
                  >
                    <Text style={{ fontSize: 14 }}>📷</Text>
                    <Text style={{ fontSize: 13, color: C.mutedText, fontWeight: "500" }}>
                      Add Photo
                    </Text>
                  </TouchableOpacity>
                )}

                {/* Cancel + Save */}
                <View style={{ flexDirection: "row", gap: 10, marginLeft: "auto" as any }}>
                  <TouchableOpacity
                    onPress={() => { clearSelectedDate(); router.back(); }}
                    style={{
                      paddingHorizontal: 18,
                      paddingVertical: 11,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: C.border,
                      backgroundColor: C.paperBg,
                    }}
                  >
                    <Text style={{ color: C.mutedText, fontSize: 14 }}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleSave}
                    disabled={saving}
                    style={{
                      paddingHorizontal: 22,
                      paddingVertical: 11,
                      borderRadius: 12,
                      backgroundColor: hasContent ? C.primary : C.border,
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 8,
                      shadowColor: C.primary,
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: hasContent ? 0.3 : 0,
                      shadowRadius: 12,
                    }}
                  >
                    {saving && <ActivityIndicator size="small" color={C.surface} />}
                    <Text
                      style={{
                        color: hasContent ? C.surface : C.mutedText,
                        fontWeight: "700",
                        fontSize: 14,
                      }}
                    >
                      {saving
                        ? "Saving…"
                        : isEdit
                        ? `Save Changes ${Glyphs.sparkle}`
                        : `Save Entry ${Glyphs.heart}`}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

            </View>
          </View>

          {/* Bottom deco */}
          <View style={{ alignItems: "center", marginTop: 36 }}>
            <Text style={{ fontSize: 12, color: C.accent, letterSpacing: 4 }}>
              {`${Glyphs.star}˙${Glyphs.moon} ${Glyphs.soft} ${Glyphs.floral} ${Glyphs.soft} ${Glyphs.moon}˙${Glyphs.star}`}
            </Text>
          </View>

        </View>
      </ScrollView>
    </WebLayout>
  );
}