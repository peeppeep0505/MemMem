import { View, Text, TouchableOpacity, Pressable } from "react-native";
import { usePathname, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/contexts/AuthContext";
import { useMemo, useState } from "react";

type HoveredMap = Record<string, boolean>;

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { logout } = useAuth();

  const [hovered, setHovered] = useState<HoveredMap>({});
  const [logoutHovered, setLogoutHovered] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const menus = useMemo(
    () => [
      { label: "Diary", icon: "calendar-outline", path: "/diary" },
      { label: "Daily Insights", icon: "bulb-outline", path: "/daily" },
      { label: "Community", icon: "images-outline", path: "/community" },
      { label: "Todo List", icon: "checkbox-outline", path: "/todolist" },
      { label: "Shop", icon: "cart-outline", path: "/shop" },
      { label: "Profile", icon: "person-outline", path: "/profile" },
    ],
    []
  );

  const isActive = (path: string) => {
    if (!pathname) return false;
    return pathname === path || pathname.startsWith(`${path}/`);
  };

  const handleLogout = async () => {
    await logout();
    router.replace("/");
  };

  return (
    <View
      style={{
        width: collapsed ? 92 : 272,
        backgroundColor: "#fffafb",
        borderRightWidth: 1,
        borderRightColor: "#fbcfe8",
        paddingHorizontal: collapsed ? 12 : 20,
        paddingVertical: 24,
        justifyContent: "space-between",
        shadowColor: "#ec4899",
        shadowOffset: { width: 4, height: 0 },
        shadowOpacity: 0.04,
        shadowRadius: 14,
      }}
    >
      <View>
        {/* top row */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "flex-start",
            justifyContent: collapsed ? "center" : "space-between",
            marginBottom: 28,
          }}
        >
          {!collapsed ? (
            <View style={{ flex: 1, paddingRight: 8 }}>
              <Text
                style={{
                  fontSize: 30,
                  fontWeight: "800",
                  color: "#ec4899",
                  letterSpacing: 0.4,
                }}
              >
                MemMem
              </Text>
              <Text
                style={{
                  marginTop: 4,
                  fontSize: 12,
                  color: "#f472b6",
                  fontWeight: "600",
                  letterSpacing: 0.3,
                }}
              >
                cute little space for your day ✿
              </Text>
            </View>
          ) : null}

          <TouchableOpacity
            onPress={() => setCollapsed((prev) => !prev)}
            activeOpacity={0.85}
            style={{
              width: 38,
              height: 38,
              borderRadius: 12,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#fff1f7",
              borderWidth: 1,
              borderColor: "#fbcfe8",
            }}
          >
            <Ionicons
              name={collapsed ? "chevron-forward-outline" : "chevron-back-outline"}
              size={18}
              color="#ec4899"
            />
          </TouchableOpacity>
        </View>

        {/* collapsed logo */}
        {collapsed && (
          <View
            style={{
              alignItems: "center",
              marginBottom: 18,
            }}
          >
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                backgroundColor: "#fdf2f8",
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1,
                borderColor: "#f9a8d4",
              }}
            >
              <Text
                style={{
                  color: "#db2777",
                  fontSize: 16,
                  fontWeight: "900",
                }}
              >
                M
              </Text>
            </View>
          </View>
        )}

        {/* Menus */}
        <View style={{ gap: 8 }}>
          {menus.map((menu) => {
            const active = isActive(menu.path);
            const isHovered = !!hovered[menu.label];

            return (
              <Pressable
                key={menu.label}
                onPress={() => router.push(menu.path as any)}
                onHoverIn={() =>
                  setHovered((prev) => ({ ...prev, [menu.label]: true }))
                }
                onHoverOut={() =>
                  setHovered((prev) => ({ ...prev, [menu.label]: false }))
                }
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: collapsed ? "center" : "flex-start",
                  paddingVertical: 13,
                  paddingHorizontal: collapsed ? 10 : 14,
                  borderRadius: 16,
                  backgroundColor: active
                    ? "#fdf2f8"
                    : isHovered
                    ? "#fff1f7"
                    : "transparent",
                  borderWidth: 1,
                  borderColor: active
                    ? "#f9a8d4"
                    : isHovered
                    ? "#fbcfe8"
                    : "transparent",
                  transform: [{ scale: isHovered ? 1.015 : 1 }],
                  shadowColor: active || isHovered ? "#ec4899" : "transparent",
                  shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: active ? 0.1 : isHovered ? 0.06 : 0,
                  shadowRadius: 12,
                  transitionDuration: "180ms" as any,
                }}
              >
                <View
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 12,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: active
                      ? "#fce7f3"
                      : isHovered
                      ? "#fdf2f8"
                      : "#ffffff",
                  }}
                >
                  <Ionicons
                    name={menu.icon as any}
                    size={18}
                    color={active ? "#db2777" : "#ec4899"}
                  />
                </View>

                {!collapsed && (
                  <Text
                    style={{
                      marginLeft: 12,
                      fontSize: 15,
                      fontWeight: active ? "800" : "700",
                      color: active ? "#be185d" : "#4b5563",
                      letterSpacing: 0.2,
                    }}
                  >
                    {menu.label}
                  </Text>
                )}
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Logout */}
      <Pressable
        onPress={handleLogout}
        onHoverIn={() => setLogoutHovered(true)}
        onHoverOut={() => setLogoutHovered(false)}
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: collapsed ? "center" : "flex-start",
          paddingVertical: 13,
          paddingHorizontal: collapsed ? 10 : 14,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: logoutHovered ? "#fecaca" : "#f3d1d8",
          backgroundColor: logoutHovered ? "#fff1f2" : "#ffffff",
          transform: [{ scale: logoutHovered ? 1.015 : 1 }],
          shadowColor: logoutHovered ? "#ef4444" : "transparent",
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: logoutHovered ? 0.08 : 0,
          shadowRadius: 12,
          transitionDuration: "180ms" as any,
        }}
      >
        <View
          style={{
            width: 34,
            height: 34,
            borderRadius: 12,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: logoutHovered ? "#ffe4e6" : "#fff5f5",
          }}
        >
          <Ionicons name="log-out-outline" size={18} color="#ef4444" />
        </View>

        {!collapsed && (
          <Text
            style={{
              marginLeft: 12,
              fontSize: 15,
              fontWeight: "700",
              color: "#ef4444",
              letterSpacing: 0.2,
            }}
          >
            Log out
          </Text>
        )}
      </Pressable>
    </View>
  );
}