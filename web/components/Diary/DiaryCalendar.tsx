import { View, Text, Image, TouchableOpacity, Animated } from "react-native";
import { Calendar } from "react-native-calendars";
import { useState, useRef, useEffect } from "react";
import { diaryEntries } from "./DiaryStore";
import { useRouter } from "expo-router";

export default function DiaryCalendar() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(12)).current;

  const selectedEntry = diaryEntries.find((e) => e.date === selectedDate);

  // Animate entry preview in
  useEffect(() => {
    if (selectedEntry) {
      fadeAnim.setValue(0);
      slideAnim.setValue(12);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 260,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 260,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [selectedDate]);

  const markedDates: any = {};
  diaryEntries.forEach((entry) => {
    markedDates[entry.date] = { marked: true };
  });
  if (selectedDate) {
    markedDates[selectedDate] = {
      ...markedDates[selectedDate],
      selected: true,
      selectedColor: "#1a1a1a",
    };
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <View className="w-full">

      {/* Calendar Card */}
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
        <Calendar
          markedDates={markedDates}
          onDayPress={(day) => setSelectedDate(day.dateString)}

          dayComponent={({ date }: any) => {
            const entry = diaryEntries.find((e) => e.date === date.dateString);
            const isSelected = selectedDate === date.dateString;
            const hasEntry = !!entry;
            const isToday =
              date.dateString === new Date().toISOString().split("T")[0];

            return (
              <TouchableOpacity
                onPress={() => setSelectedDate(date.dateString)}
                style={{
                  alignItems: "center",
                  justifyContent: "center",
                  width: 40,
                  height: 52,
                  borderRadius: 12,
                  backgroundColor: isSelected
                    ? "#1a1a1a"
                    : hasEntry
                    ? "#fdf6f0"
                    : "transparent",
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: isSelected || isToday ? "700" : "400",
                    color: isSelected ? "#fff" : isToday ? "#ec4899" : "#374151",
                    lineHeight: 18,
                  }}
                >
                  {date.day}
                </Text>

                {entry?.mood ? (
                  <Text style={{ fontSize: 11, lineHeight: 14, marginTop: 1 }}>
                    {entry.mood}
                  </Text>
                ) : hasEntry ? (
                  <View
                    style={{
                      width: 4,
                      height: 4,
                      borderRadius: 2,
                      backgroundColor: isSelected ? "#fff" : "#f9a8d4",
                      marginTop: 2,
                    }}
                  />
                ) : isToday ? (
                  <View
                    style={{
                      width: 4,
                      height: 4,
                      borderRadius: 2,
                      backgroundColor: "#fca5a5",
                      marginTop: 2,
                    }}
                  />
                ) : null}
              </TouchableOpacity>
            );
          }}

          theme={{
            backgroundColor: "#fff",
            calendarBackground: "#fff",
            todayTextColor: "#ec4899",
            arrowColor: "#9ca3af",
            monthTextColor: "#111827",
            textMonthFontWeight: "700",
            textMonthFontSize: 15,
            textDayHeaderFontSize: 11,
            textDayHeaderFontWeight: "600",
            dayTextColor: "#374151",
            textSectionTitleColor: "#9ca3af",
          }}

          style={{ paddingBottom: 8 }}
        />
      </View>

      {/* No entry selected hint */}
      {!selectedDate && (
        <View className="items-center mt-10 mb-4">
          <Text style={{ fontSize: 24, marginBottom: 6 }}>📅</Text>
          <Text className="text-gray-400 text-sm">
            Tap a date to view your entry
          </Text>
        </View>
      )}

      {/* Selected date — no entry */}
      {selectedDate && !selectedEntry && (
        <View
          className="mt-6 items-center py-12 rounded-2xl border border-dashed border-gray-200"
          style={{ backgroundColor: "#fafaf9" }}
        >
          <Text style={{ fontSize: 28, marginBottom: 8 }}>✦</Text>
          <Text className="text-gray-500 font-medium text-sm mb-1">
            {formatDate(selectedDate)}
          </Text>
          <Text className="text-gray-400 text-xs">No entry for this day</Text>
        </View>
      )}

      {/* Entry Preview */}
      {selectedEntry && (
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
            marginTop: 24,
          }}
        >
          <View
            style={{
              backgroundColor: "#fff",
              borderRadius: 20,
              borderWidth: 1,
              borderColor: "#f0ece8",
              shadowColor: "#000",
              shadowOpacity: 0.05,
              shadowRadius: 14,
              shadowOffset: { width: 0, height: 4 },
              overflow: "hidden",
            }}
          >
            {/* Entry Image */}
            {selectedEntry.image ? (
              <View style={{ position: "relative" }}>
                <Image
                  source={{ uri: selectedEntry.image }}
                  style={{ width: "100%", height: 240 }}
                  resizeMode="cover"
                />
                {/* Fade overlay at bottom */}
                <View
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: 80,
                    background:
                      "linear-gradient(to top, rgba(255,255,255,0.9), transparent)",
                  } as any}
                />
              </View>
            ) : (
              <View
                style={{
                  height: 80,
                  backgroundColor: "#fdf6f0",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ fontSize: 32 }}>{selectedEntry.mood ?? "📖"}</Text>
              </View>
            )}

            {/* Content */}
            <View style={{ padding: 24 }}>

              {/* Date + Mood row */}
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 10,
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "600",
                    letterSpacing: 2,
                    color: "#9ca3af",
                    textTransform: "uppercase",
                  }}
                >
                  {formatDate(selectedEntry.date)}
                </Text>
                {selectedEntry.mood && !selectedEntry.image && null}
                {selectedEntry.mood && selectedEntry.image && (
                  <View
                    style={{
                      backgroundColor: "#fdf6f0",
                      borderRadius: 20,
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                    }}
                  >
                    <Text style={{ fontSize: 16 }}>{selectedEntry.mood}</Text>
                  </View>
                )}
              </View>

              {/* Title */}
              <Text
                style={{
                  fontSize: 22,
                  fontWeight: "700",
                  color: "#111827",
                  fontFamily: "Georgia, serif",
                  marginBottom: 10,
                  lineHeight: 30,
                }}
              >
                {selectedEntry.title}
              </Text>

              {/* Content preview */}
              <Text
                numberOfLines={4}
                style={{
                  fontSize: 14,
                  color: "#6b7280",
                  lineHeight: 24,
                  marginBottom: 20,
                }}
              >
                {selectedEntry.content}
              </Text>

              {/* Divider */}
              <View
                style={{
                  height: 1,
                  backgroundColor: "#f3f4f6",
                  marginBottom: 20,
                }}
              />

              {/* Footer row */}
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Text style={{ fontSize: 12, color: "#d1d5db" }}>
                  {selectedEntry.content.length} characters
                </Text>

                <TouchableOpacity
                  onPress={() =>
                    router.push(
                      `/diary/edit?date=${selectedEntry.date}` as any
                    )
                  }
                  style={{
                    backgroundColor: "#1a1a1a",
                    paddingHorizontal: 20,
                    paddingVertical: 11,
                    borderRadius: 12,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <Text style={{ color: "#fff", fontSize: 12 }}>✎</Text>
                  <Text
                    style={{
                      color: "#fff",
                      fontWeight: "600",
                      fontSize: 13,
                    }}
                  >
                    Edit Entry
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Animated.View>
      )}
    </View>
  );
}