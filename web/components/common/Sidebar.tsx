import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { logout } from "@/services/authService";
import { useAuth } from "@/contexts/AuthContext";

export default function Sidebar() {
  const router = useRouter();

  const menus = [
    { label: "Diary", icon: "calendar-outline", path: "/diary" },
    { label: "Community", icon: "images-outline", path: "/community" },
    { label: "Todo List", icon: "checkbox-outline", path: "/todolist" },
    { label: "Profile", icon: "person-outline", path: "/profile" },
  ];
  const { logout } = useAuth();

    const handleLogout = async () => {
      await logout();
      router.replace("/");
    };

  return (
    <View className="w-64 bg-white border-r border-gray-200 p-6 justify-between">

      <View>
        <Text className="text-2xl font-bold text-pink-500 mb-10">
          MemMem
        </Text>

        {menus.map((menu) => (
          <TouchableOpacity
            key={menu.label}
            onPress={() => router.push(menu.path as any)}
            className="flex-row items-center p-3 rounded-xl mb-2 hover:bg-pink-50"
          >
            <Ionicons name={menu.icon as any} size={20} color="#ec4899" />

            <Text className="ml-3 text-gray-700 font-medium">
              {menu.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>


      {/* Logout */}
      <TouchableOpacity
        onPress={handleLogout}
        className="flex-row items-center p-3 rounded-xl border border-gray-200 hover:bg-red-50"
      >
        <Ionicons name="log-out-outline" size={20} color="#ef4444" />

        <Text className="ml-3 text-red-500 font-medium">
          Log out
        </Text>
      </TouchableOpacity>

    </View>
  );
}