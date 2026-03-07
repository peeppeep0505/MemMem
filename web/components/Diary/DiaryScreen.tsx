import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import WebLayout from "../common/WebLayout";
import DiaryCalendar from "./DiaryCalendar";
import { useRouter } from "expo-router";

export default function DiaryPage() {
  const router = useRouter();

  const today = new Date();
  const dayName = today.toLocaleDateString("en-US", { weekday: "long" });
  const dateLabel = today.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <WebLayout>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 80 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="max-w-3xl mx-auto w-full px-4">

          {/* Header */}
          <View className="flex-row justify-between items-start mb-10 pt-2">
            <View>
              {/* Eyebrow */}
              <Text
                className="text-xs font-semibold tracking-widest text-rose-400 uppercase mb-1"
                style={{ letterSpacing: 3 }}
              >
                {dayName}
              </Text>

              {/* Title */}
              <Text
                className="text-gray-900 font-bold"
                style={{ fontSize: 34, lineHeight: 40, fontFamily: "Georgia, serif" }}
              >
                My Diary
              </Text>

              <Text className="text-gray-400 text-sm mt-1">
                {dateLabel}
              </Text>
            </View>

            {/* New Entry Button */}
            <TouchableOpacity
              onPress={() => router.push("/diary/create" as any)}
              style={{
                backgroundColor: "#1a1a1a",
                paddingHorizontal: 20,
                paddingVertical: 12,
                borderRadius: 14,
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Text style={{ color: "#fff", fontSize: 18, lineHeight: 20, marginTop: -1 }}>+</Text>
              <Text style={{ color: "#fff", fontWeight: "600", fontSize: 14 }}>New Entry</Text>
            </TouchableOpacity>
          </View>

          {/* Subtle divider */}
          <View
            className="mb-8"
            style={{
              height: 1,
              backgroundColor: "#f0ece8",
            }}
          />

          {/* Calendar */}
          <DiaryCalendar />
        </View>
      </ScrollView>
    </WebLayout>
  );
}