import { View, Text, ScrollView } from "react-native";
import WebLayout from "../common/WebLayout";
import DiaryCalendar from "./DiaryCalendar";
import { useAppTheme } from "@/contexts/ThemeContext";
import { Fonts, Glyphs } from "@/constants/theme";
import HeartFillGame from "./HeartFillGame";
import FloatingHeartWidget from "./FloatingHeartWidget";

export default function DiaryPage() {
  const { theme: C } = useAppTheme();
  const F = Fonts as any;

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
        style={{ flex: 1, backgroundColor: C.background }}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
<FloatingHeartWidget />
        <View
          style={{
            maxWidth: 720,
            marginHorizontal: "auto",
            width: "100%",
            paddingHorizontal: 20,
          }}
        >
          {/* ── Decorative top strip ── */}
          <View style={{ paddingTop: 32, paddingBottom: 4, alignItems: "center" }}>
            <Text style={{ fontSize: 11, color: C.accent, letterSpacing: 6 }}>
              {`${Glyphs.sparkle} ${Glyphs.soft} ${Glyphs.heart} ${Glyphs.soft} ${Glyphs.sparkle}`}
            </Text>
          </View>

          {/* ── Header card ── */}
          <View
            style={{
              backgroundColor: C.surface,
              borderRadius: 24,
              borderWidth: 1,
              borderColor: C.border,
              padding: 28,
              marginTop: 12,
              marginBottom: 28,
              shadowColor: C.primary,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.08,
              shadowRadius: 20,
            }}
          >
            {/* eyebrow */}
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 }}>
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
              <Text style={{ fontSize: 14, color: C.accent }}>{Glyphs.floral}</Text>
            </View>

            {/* title */}
            <Text
              style={{
                fontSize: 38,
                fontWeight: "700",
                color: C.inkText,
                fontFamily: F?.display ?? F?.serif,
                lineHeight: 46,
              }}
            >
              My Diary
            </Text>

            {/* subtitle row */}
            <View style={{ flexDirection: "row", alignItems: "center", marginTop: 8, gap: 8 }}>
              <Text style={{ fontSize: 13, color: C.mutedText }}>{dateLabel}</Text>
              <Text style={{ color: C.accent, fontSize: 12 }}>{Glyphs.sparkle}</Text>
              <Text style={{ fontSize: 13, color: C.mutedText }}>
                {`${Glyphs.soft} ${Glyphs.heart} write freely ${Glyphs.heart} ${Glyphs.soft}`}
              </Text>
            </View>

            {/* divider */}
            <View style={{ height: 1, backgroundColor: C.ruledLine, marginTop: 20, marginBottom: 4 }} />
          </View>

          {/* ── Calendar ── */}
          <DiaryCalendar />

          {/* ── Bottom deco ── */}
          <View style={{ alignItems: "center", marginTop: 40 }}>
            <Text style={{ fontSize: 13, color: C.accent, letterSpacing: 4 }}>
              {`${Glyphs.star}˙${Glyphs.moon} ${Glyphs.soft} ${Glyphs.floral} ${Glyphs.soft} ${Glyphs.moon}˙${Glyphs.star}`}
            </Text>
            <Text style={{ fontSize: 11, color: C.mutedText, marginTop: 6 }}>
              {`Every day is worth remembering ${Glyphs.heart}`}
            </Text>
          </View>
        </View>
      </ScrollView>
    </WebLayout>
  );
}