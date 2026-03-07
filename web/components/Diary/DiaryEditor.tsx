import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import { diaryEntries } from "./DiaryStore";
import WebLayout from "../common/WebLayout";

const moods = [
  { emoji: "😊", label: "Happy" },
  { emoji: "😌", label: "Calm" },
  { emoji: "🥰", label: "Loved" },
  { emoji: "😢", label: "Sad" },
  { emoji: "😡", label: "Angry" },
];

export default function DiaryEditor() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [mood, setMood] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const today = new Date();
  const dayName = today.toLocaleDateString("en-US", { weekday: "long" });
  const dateLabel = today.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const wordCount = content.trim()
    ? content.trim().split(/\s+/).length
    : 0;

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
    });
    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const saveEntry = () => {
    if (!title.trim() && !content.trim()) return;
    const date = today.toISOString().split("T")[0];
    const selectedMoodEmoji = moods.find((m) => m.label === mood)?.emoji;
    diaryEntries.push({
      date,
      title,
      content,
      image: image ?? undefined,
      mood: selectedMoodEmoji ?? "",
    });
    setSaved(true);
  };

  return (
    <WebLayout>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 80 }}
      >
        <View className="max-w-2xl mx-auto w-full px-4">

          {/* Header */}
          <View className="mb-8 pt-2">
            <Text
              style={{
                fontSize: 11,
                fontWeight: "600",
                letterSpacing: 3,
                color: "#f87171",
                textTransform: "uppercase",
                marginBottom: 4,
              }}
            >
              {dayName}
            </Text>
            <Text
              style={{
                fontSize: 30,
                fontWeight: "700",
                color: "#111827",
                fontFamily: "Georgia, serif",
                lineHeight: 38,
              }}
            >
              New Entry
            </Text>
            <Text style={{ color: "#9ca3af", fontSize: 13, marginTop: 2 }}>
              {dateLabel}
            </Text>
          </View>

          {/* Main Card */}
          <View
            style={{
              backgroundColor: "#fff",
              borderRadius: 20,
              borderWidth: 1,
              borderColor: "#f0ece8",
              shadowColor: "#000",
              shadowOpacity: 0.04,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: 4 },
              overflow: "hidden",
            }}
          >
            {/* Image Section */}
            <View>
              {image ? (
                <View style={{ position: "relative" }}>
                  <Image
                    source={{ uri: image }}
                    style={{ width: "100%", height: 220 }}
                    resizeMode="cover"
                  />
                  <TouchableOpacity
                    onPress={() => setImage(null)}
                    style={{
                      position: "absolute",
                      top: 12,
                      right: 12,
                      backgroundColor: "rgba(0,0,0,0.45)",
                      borderRadius: 20,
                      paddingHorizontal: 10,
                      paddingVertical: 5,
                    }}
                  >
                    <Text style={{ color: "#fff", fontSize: 12, fontWeight: "600" }}>
                      Remove
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  onPress={pickImage}
                  style={{
                    height: 140,
                    backgroundColor: "#fdf6f0",
                    alignItems: "center",
                    justifyContent: "center",
                    borderBottomWidth: 1,
                    borderBottomColor: "#f0ece8",
                    gap: 8,
                  }}
                >
                  <Text style={{ fontSize: 28 }}>🖼</Text>
                  <Text style={{ color: "#9ca3af", fontSize: 13 }}>
                    Tap to add a cover photo
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={{ padding: 24 }}>

              {/* Mood Selector */}
              <View style={{ marginBottom: 20 }}>
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "600",
                    letterSpacing: 2,
                    color: "#9ca3af",
                    textTransform: "uppercase",
                    marginBottom: 10,
                  }}
                >
                  Today&apos;s Mood
                </Text>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  {moods.map((m) => {
                    const selected = mood === m.label;
                    return (
                      <TouchableOpacity
                        key={m.label}
                        onPress={() => setMood(selected ? null : m.label)}
                        style={{
                          alignItems: "center",
                          paddingHorizontal: 12,
                          paddingVertical: 10,
                          borderRadius: 14,
                          borderWidth: 1.5,
                          borderColor: selected ? "#1a1a1a" : "#f0ece8",
                          backgroundColor: selected ? "#1a1a1a" : "#fafaf9",
                          gap: 4,
                        }}
                      >
                        <Text style={{ fontSize: 20 }}>{m.emoji}</Text>
                        <Text
                          style={{
                            fontSize: 10,
                            fontWeight: "500",
                            color: selected ? "#fff" : "#9ca3af",
                          }}
                        >
                          {m.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Thin divider */}
              <View
                style={{
                  height: 1,
                  backgroundColor: "#f3f4f6",
                  marginBottom: 20,
                }}
              />

              {/* Title Input */}
              <TextInput
                placeholder="Entry title..."
                value={title}
                onChangeText={setTitle}
                placeholderTextColor="#d1d5db"
                style={{
                  fontSize: 22,
                  fontWeight: "700",
                  color: "#111827",
                  fontFamily: "Georgia, serif",
                  marginBottom: 14,
                  outline: "none",
                } as any}
              />

              {/* Content Input */}
              <TextInput
                multiline
                placeholder="Write about your day..."
                value={content}
                onChangeText={setContent}
                placeholderTextColor="#d1d5db"
                style={{
                  fontSize: 15,
                  color: "#374151",
                  lineHeight: 26,
                  minHeight: 160,
                  textAlignVertical: "top",
                  outline: "none",
                } as any}
              />

              {/* Word count */}
              <Text
                style={{
                  fontSize: 11,
                  color: "#d1d5db",
                  textAlign: "right",
                  marginTop: 8,
                  marginBottom: 20,
                }}
              >
                {wordCount} {wordCount === 1 ? "word" : "words"}
              </Text>

              {/* Divider */}
              <View
                style={{ height: 1, backgroundColor: "#f3f4f6", marginBottom: 20 }}
              />

              {/* Action Buttons */}
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                {/* Image button (if already has image show text differently) */}
                {!image && (
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
                      borderColor: "#f0ece8",
                      backgroundColor: "#fafaf9",
                    }}
                  >
                    <Text style={{ fontSize: 14 }}>📷</Text>
                    <Text style={{ fontSize: 13, color: "#6b7280", fontWeight: "500" }}>
                      Add Photo
                    </Text>
                  </TouchableOpacity>
                )}

                {image && <View />}

                <View style={{ flexDirection: "row", gap: 10 }}>
                  <TouchableOpacity
                    style={{
                      paddingHorizontal: 18,
                      paddingVertical: 11,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: "#f0ece8",
                    }}
                  >
                    <Text style={{ color: "#9ca3af", fontWeight: "500", fontSize: 14 }}>
                      Cancel
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={saveEntry}
                    style={{
                      paddingHorizontal: 22,
                      paddingVertical: 11,
                      borderRadius: 12,
                      backgroundColor:
                        title.trim() || content.trim() ? "#1a1a1a" : "#e5e7eb",
                    }}
                  >
                    <Text
                      style={{
                        color:
                          title.trim() || content.trim() ? "#fff" : "#9ca3af",
                        fontWeight: "600",
                        fontSize: 14,
                      }}
                    >
                      {saved ? "Saved ✓" : "Save Entry"}
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