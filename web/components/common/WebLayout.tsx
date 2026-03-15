import { View, ScrollView, useWindowDimensions } from "react-native";
import Sidebar from "./Sidebar";
import { useAppTheme } from "@/contexts/ThemeContext";

export default function WebLayout({ children }: { children: React.ReactNode }) {
  const { theme } = useAppTheme();
  const { width } = useWindowDimensions();

  const isMobile = width < 768;
  const contentPadding = isMobile ? 14 : 24;

  return (
    <View
      style={{
        flex: 1,
        flexDirection: "row",
        backgroundColor: theme.background,
      }}
    >
      <Sidebar />

      <ScrollView
        style={{
          flex: 1,
          backgroundColor: theme.background,
        }}
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: contentPadding,
          paddingTop: isMobile ? 76 : 24,
          paddingBottom: isMobile ? 18 : 24,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View
          style={{
            flex: 1,
            width: "100%",
            maxWidth: isMobile ? "100%" : 1400,
            alignSelf: "center",
          }}
        >
          {children}
        </View>
      </ScrollView>
    </View>
  );
}