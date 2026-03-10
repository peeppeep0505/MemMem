import { View, Text, TouchableOpacity, Animated, Alert, Image } from "react-native";
import { Calendar } from "react-native-calendars";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "expo-router";
import { getUserDiaryByMonth, deleteDiary } from "@/services/diaryService";
import { useAuth } from "@/contexts/AuthContext";
import { setSelectedDate } from "./DiaryStore";
import PopupDialog from "@/components/common/dialog/PopupDialog";
import ConfirmDialog from "../common/dialog/ConfirmDialog";

export default function DiaryCalendar() {

  const router = useRouter();
  const { user } = useAuth();

  const [entries, setEntries] = useState<any[]>([]);
  const [selectedDate, setSelectedDateState] = useState<string | null>(null);

  const [month, setMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(12)).current;

  const selectedEntry = entries.find((e) => e.date === selectedDate);

  const [showDeletePopup, setShowDeletePopup] = useState(false);

  useEffect(() => {
    if (!user) return;

    const loadDiary = async () => {
      try {

        const data = await getUserDiaryByMonth(user._id, month);

        const formatted = data.map((d: any) => ({
          ...d,
          date: d.date.split("T")[0],
        }));

        setEntries(formatted);

      } catch (err) {
        console.log("load diary error", err);
      }
    };

    loadDiary();

  }, [user, month]);

  useEffect(() => {
    if (!selectedDate) return;

    fadeAnim.setValue(0);
    slideAnim.setValue(12);

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

  }, [selectedDate]);

  const today = new Date().toISOString().split("T")[0];

  const formatDate = (dateStr: string) => {

    const d = new Date(dateStr + "T00:00:00");

    return d.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const moodColor: any = {
    "😊": "#fde68a",
    "😌": "#bfdbfe",
    "🥰": "#fecdd3",
    "😢": "#c7d2fe",
    "😡": "#fca5a5",
  };

  const handleDelete = async () => {
    if (!selectedEntry) return;
          try {

            await deleteDiary(selectedEntry._id);

            setEntries((prev) =>
              prev.filter((d) => d._id !== selectedEntry._id)
            );

            setSelectedDateState(null);

          } catch (err) {
            console.log("delete diary error", err);
          }
           setShowDeletePopup(false);
  };

  const goCreate = () => {

    if (!selectedDate) return;

    setSelectedDate(selectedDate);

    router.push("/diary/create");

  };

  const goEdit = () => {

    if (!selectedEntry) return;

    router.push(`/diary/edit?id=${selectedEntry._id}` as any);

  };

  return (
    <View className="w-full">

      <View
        style={{
          backgroundColor: "#fff",
          borderRadius: 20,
          borderWidth: 1,
          borderColor: "#f0ece8",
          overflow: "hidden",
        }}
      >

        <Calendar
          onDayPress={(day) => {
            setSelectedDateState(day.dateString);
          }}

          onMonthChange={(m) => {
            setMonth(`${m.year}-${String(m.month).padStart(2, "0")}`);
          }}

          dayComponent={({ date }: any) => {

            const entry = entries.find((e) => e.date === date.dateString);

            const isSelected = selectedDate === date.dateString;
            const isToday = today === date.dateString;

            return (
              <TouchableOpacity
                onPress={() => setSelectedDateState(date.dateString)}
                style={{
                  alignItems: "center",
                  justifyContent: "center",
                  width: 40,
                  height: 52,
                  borderRadius: 12,

                  borderWidth: isToday ? 1.5 : 0,
                  borderColor: isToday ? "#ec4899" : "transparent",

                  backgroundColor: isSelected
                    ? "#fc62ff"
                    : entry?.mood
                    ? moodColor[entry.mood] ?? "#fdf6f0"
                    : "transparent",
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    color: isSelected ? "#fff" : "#374151",
                  }}
                >
                  {date.day}
                </Text>

                {entry?.mood && (
                  <Text style={{ fontSize: 11 }}>{entry.mood}</Text>
                )}

              </TouchableOpacity>
            );
          }}
        />
      </View>

      {!selectedDate && (
        <View className="items-center mt-10">
          <Text className="text-gray-400 text-sm">
            Tap a date to view or create entry
          </Text>
        </View>
      )}

      {selectedDate && (
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
              overflow: "hidden",
            }}
          >
            {/* รูป cover — แสดงนอก padding ให้เต็มความกว้าง */}
            {selectedEntry?.img && (
              <Image
                source={{ uri: selectedEntry.img }}
                style={{ width: "100%", height: 180 }}
                resizeMode="cover"
              />
            )}

            <View style={{ padding: 20 }}>

              <Text style={{ fontSize: 12, color: "#9ca3af" }}>
                {formatDate(selectedDate)}
              </Text>

              {selectedEntry ? (
                <>
                  <Text
                    style={{
                      fontSize: 22,
                      fontWeight: "700",
                      marginTop: 6,
                    }}
                  >
                    {selectedEntry.title}
                  </Text>

                  <Text style={{ marginTop: 10, color: "#6b7280" }}>
                    {selectedEntry.description}
                  </Text>

                  <View
                    style={{
                      flexDirection: "row",
                      marginTop: 20,
                      gap: 10,
                    }}
                  >

                    <TouchableOpacity
                      onPress={goEdit}
                      style={{
                        backgroundColor: "#1a1a1a",
                        paddingHorizontal: 18,
                        paddingVertical: 10,
                        borderRadius: 10,
                      }}
                    >
                      <Text style={{ color: "#fff" }}>✎ Edit</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => setShowDeletePopup(true)}
                      style={{
                        backgroundColor: "#ef4444",
                        paddingHorizontal: 18,
                        paddingVertical: 10,
                        borderRadius: 10,
                      }}
                    >
                      <Text style={{ color: "#fff" }}>🗑 Delete</Text>
                    </TouchableOpacity>

                  </View>
                </>
              ) : (
                <>
                  <Text style={{ marginTop: 10, color: "#6b7280" }}>
                    No entry for this day
                  </Text>

                  <TouchableOpacity
                    onPress={goCreate}
                    style={{
                      marginTop: 16,
                      backgroundColor: "#1a1a1a",
                      paddingHorizontal: 18,
                      paddingVertical: 10,
                      borderRadius: 10,
                      alignSelf: "flex-start",
                    }}
                  >
                    <Text style={{ color: "#fff" }}>＋ New Entry</Text>
                  </TouchableOpacity>
                </>
              )}

            </View>
          </View>
        </Animated.View>
      )}
      <ConfirmDialog
        visible={showDeletePopup}
        title="Delete Diary"
        message="Are you sure you want to delete this entry?"
        onConfirm={handleDelete}
        onCancel={() => setShowDeletePopup(false)}
      />
    </View>
  );
}