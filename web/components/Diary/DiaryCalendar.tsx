import { View, Text, TouchableOpacity, Animated, Image } from "react-native";
import { Calendar } from "react-native-calendars";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "expo-router";
import { getUserDiaryByMonth, deleteDiary } from "@/services/diaryService";
import { useAuth } from "@/contexts/AuthContext";
import { setSelectedDate } from "./DiaryStore";
import ConfirmDialog from "../common/dialog/ConfirmDialog";
import { useAppTheme } from "@/contexts/ThemeContext";
import { Fonts, Glyphs } from "@/constants/theme";

// mood → pastel bg (visual encoding — intentionally local, not a theme token)
const MOOD_COLOR: Record<string, string> = {
  "😊": "#fde68a",
  "😌": "#bfdbfe",
  "🥰": "#fecdd3",
  "😢": "#c7d2fe",
  "😡": "#fca5a5",
};

export default function DiaryCalendar() {
  const router = useRouter();
  const { user } = useAuth();
  const { theme: C, mode } = useAppTheme();
  const F = Fonts as any;

  const [entries, setEntries] = useState<any[]>([]);
  const [selectedDate, setSelectedDateState] = useState<string | null>(null);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [showDeletePopup, setShowDeletePopup] = useState(false);

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(16)).current;

  const selectedEntry = entries.find((e) => e.date === selectedDate);

  // ── load diary entries ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const data = await getUserDiaryByMonth(user._id, month);
        setEntries(data.map((d: any) => ({ ...d, date: d.date.split("T")[0] })));
      } catch (err) {
        console.log("load diary error", err);
      }
    })();
  }, [user, month]);

  // ── animate entry card in ───────────────────────────────────────────────────
  useEffect(() => {
    if (!selectedDate) return;
    fadeAnim.setValue(0);
    slideAnim.setValue(16);
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start();
  }, [selectedDate]);

  const today = new Date().toISOString().split("T")[0];

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-US", {
      weekday: "long", month: "long", day: "numeric", year: "numeric",
    });
  };

  // ── handlers ────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!selectedEntry) return;
    try {
      await deleteDiary(selectedEntry._id);
      setEntries((prev) => prev.filter((d) => d._id !== selectedEntry._id));
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

  // ── render ───────────────────────────────────────────────────────────────────
  return (
    <View style={{ width: "100%" }}>

      {/* ── Calendar card ── */}
      <View style={cardStyle}>

        {/* Header deco */}
        <View
          style={{
            paddingHorizontal: 20,
            paddingTop: 16,
            paddingBottom: 4,
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Text style={{ fontSize: 13, color: C.accent, letterSpacing: 3 }}>
            {`${Glyphs.sparkle} ${Glyphs.soft} ${Glyphs.heart}`}
          </Text>
          <Text
            style={{
              fontSize: 11,
              color: C.mutedText,
              fontWeight: "600",
              letterSpacing: 2,
              textTransform: "uppercase",
            }}
          >
            Calendar
          </Text>
        </View>

        <Calendar
          key={mode}
          onDayPress={(day) => setSelectedDateState(day.dateString)}
          onMonthChange={(m) => {
            setMonth(`${m.year}-${String(m.month).padStart(2, "0")}`);
          }}
          theme={{
            backgroundColor:            C.surface,
            calendarBackground:         C.surface,
            monthTextColor:             C.inkText,
            arrowColor:                 C.primary,
            todayTextColor:             C.primary,
            textSectionTitleColor:      C.mutedText,
            dayTextColor:               "transparent",
            selectedDayBackgroundColor: "transparent",
            selectedDayTextColor:       "transparent",
          }}
          dayComponent={({ date }: any) => {
            const entry      = entries.find((e) => e.date === date.dateString);
            const isSelected = selectedDate === date.dateString;
            const isToday    = today === date.dateString;

            return (
              <TouchableOpacity
                onPress={() => setSelectedDateState(date.dateString)}
                style={{
                  alignItems: "center",
                  justifyContent: "center",
                  width: 42,
                  height: 54,
                  borderRadius: 14,
                  borderWidth:  isSelected ? 2 : isToday ? 1.5 : 0,
                  borderColor:  isSelected ? C.primary : isToday ? C.accent : "transparent",
                  backgroundColor: isSelected
                    ? C.primarySoft
                    : entry?.mood
                    ? MOOD_COLOR[entry.mood] ?? C.accentSoft
                    : "transparent",
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: isToday ? "700" : "400",
                    color: isSelected ? C.primary : C.text,
                    fontFamily: F?.sans,
                  }}
                >
                  {date.day}
                </Text>

                {entry?.mood ? (
                  <Text style={{ fontSize: 11, marginTop: 1 }}>{entry.mood}</Text>
                ) : isToday ? (
                  <Text style={{ fontSize: 9, color: C.accent }}>{Glyphs.sparkle}</Text>
                ) : null}
              </TouchableOpacity>
            );
          }}
        />

        {/* Mood legend */}
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 8,
            paddingHorizontal: 20,
            paddingBottom: 18,
            paddingTop: 4,
          }}
        >
          {Object.entries(MOOD_COLOR).map(([emoji, color]) => (
            <View
              key={emoji}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
                paddingHorizontal: 9,
                paddingVertical: 3,
                borderRadius: 100,
                backgroundColor: color + "55",
                borderWidth: 1,
                borderColor: color + "88",
              }}
            >
              <Text style={{ fontSize: 11 }}>{emoji}</Text>
            </View>
          ))}
          <Text style={{ fontSize: 11, color: C.mutedText, alignSelf: "center", marginLeft: 2 }}>
            = mood
          </Text>
        </View>
      </View>

      {/* ── Empty state ── */}
      {!selectedDate && (
        <View style={{ alignItems: "center", marginTop: 36 }}>
          <Text style={{ fontSize: 22, marginBottom: 8,color: C.text }}>{`${Glyphs.star}˙${Glyphs.moon}`}</Text>
          <Text style={{ color: C.mutedText, fontSize: 13 }}>
            {`Tap a date to view or add an entry ${Glyphs.heart}`}
          </Text>
        </View>
      )}

      {/* ── Entry card ── */}
      {selectedDate && (
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
            marginTop: 20,
          }}
        >
          <View style={cardStyle}>

            {/* Cover image */}
            {selectedEntry?.img && (
              <Image
                source={{ uri: selectedEntry.img }}
                style={{ width: "100%", height: 190 }}
                resizeMode="cover"
              />
            )}

            <View style={{ padding: 22 }}>

              {/* Date row */}
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <Text style={{ fontSize: 11, color: C.mutedText }}>
                  {formatDate(selectedDate)}
                </Text>
                {selectedEntry?.mood && (
                  <Text style={{ fontSize: 16 }}>{selectedEntry.mood}</Text>
                )}
              </View>

              {selectedEntry ? (
                <>
                  {/* Title */}
                  <Text
                    style={{
                      fontSize: 22,
                      fontWeight: "700",
                      color: C.inkText,
                      fontFamily: F?.display ?? F?.serif,
                      lineHeight: 30,
                      marginBottom: 10,
                    }}
                  >
                    {selectedEntry.title}
                  </Text>

                  {/* Ruled divider */}
                  <View style={{ height: 1, backgroundColor: C.ruledLine, marginBottom: 12 }} />

                  {/* Content preview */}
                  <Text
                    numberOfLines={4}
                    style={{
                      color: C.mutedText,
                      fontSize: 14,
                      lineHeight: 22,
                      fontFamily: F?.sans,
                    }}
                  >
                    {selectedEntry.description}
                  </Text>

                  {/* Actions */}
                  <View style={{ flexDirection: "row", marginTop: 20, gap: 10 }}>
                    <TouchableOpacity
                      onPress={goEdit}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 6,
                        backgroundColor: C.inkText,
                        paddingHorizontal: 18,
                        paddingVertical: 10,
                        borderRadius: 12,
                      }}
                    >
                      <Text style={{ fontSize: 13 }}>✎</Text>
                      <Text style={{ color: C.surface, fontSize: 13, fontWeight: "600" }}>Edit</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => setShowDeletePopup(true)}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 6,
                        backgroundColor: C.hover,
                        paddingHorizontal: 18,
                        paddingVertical: 10,
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: C.border,
                      }}
                    >
                      <Text style={{ fontSize: 13 }}>🗑</Text>
                      <Text style={{ color: C.logout, fontSize: 13, fontWeight: "600" }}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                <>
                  {/* No entry illustration */}
                  <View style={{ alignItems: "center", paddingVertical: 20 }}>
                    <Text style={{ fontSize: 36, marginBottom: 8 }}>{Glyphs.floral}</Text>
                    <Text style={{ color: C.mutedText, fontSize: 14, marginBottom: 4 }}>
                      No entry for this day
                    </Text>
                    <Text style={{ color: C.accent, fontSize: 12 }}>
                      {`${Glyphs.soft} Start writing ${Glyphs.heart} ${Glyphs.soft}`}
                    </Text>
                  </View>

                  <TouchableOpacity
                    onPress={goCreate}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 8,
                      marginTop: 4,
                      backgroundColor: C.primary,
                      paddingHorizontal: 20,
                      paddingVertical: 12,
                      borderRadius: 14,
                      alignSelf: "center",
                      shadowColor: C.primary,
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.3,
                      shadowRadius: 12,
                    }}
                  >
                    <Text style={{ color: C.surface, fontSize: 16 }}>＋</Text>
                    <Text style={{ color: C.surface, fontWeight: "700", fontSize: 14 }}>
                      New Entry
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </Animated.View>
      )}

      {/* ── Confirm delete ── */}
      <ConfirmDialog
        visible={showDeletePopup}
        title={`Delete Entry ${Glyphs.heart}`}
        message="Are you sure you want to delete this entry? This can't be undone."
        onConfirm={handleDelete}
        onCancel={() => setShowDeletePopup(false)}
      />
    </View>
  );
}