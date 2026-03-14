import { View } from "react-native";
import Sidebar from "./Sidebar";
import { useAppTheme } from "@/contexts/ThemeContext";

export default function WebLayout({ children }: { children: React.ReactNode }) {
  const { theme } = useAppTheme();

  return (
    <View
      style={{
        flex: 1,
        flexDirection: "row",
        backgroundColor: theme.background,
      }}
    >
      <Sidebar />

      <View
        style={{
          flex: 1,
          padding: 24,
          backgroundColor: theme.background,
        }}
      >
        {children}
      </View>
    </View>
  );
}