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
          </View>


          {/* Calendar */}
          <DiaryCalendar />
        </View>
      </ScrollView>
    </WebLayout>
  );
}