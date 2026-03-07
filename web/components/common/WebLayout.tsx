import { View } from "react-native";
import Sidebar from "./Sidebar";

export default function WebLayout({ children }: any) {
  return (
    <View className="flex-row flex-1 bg-gray-50">

      <Sidebar />

      <View className="flex-1 p-10">
        {children}
      </View>

    </View>
  );
}