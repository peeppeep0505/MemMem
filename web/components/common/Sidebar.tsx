import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  Animated,
  Easing,
  useWindowDimensions,
} from "react-native";
import { usePathname, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useMemo, useRef, useState } from "react";
import { Fonts } from "@/constants/theme";
import { useAppTheme } from "@/contexts/ThemeContext";

type HoveredMap = Record<string, boolean>;

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { logout } = useAuth();
  const { mode, theme, toggleTheme } = useAppTheme();
  const { width } = useWindowDimensions();

  const isMobile = width < 768;

  const [hovered, setHovered] = useState<HoveredMap>({});
  const [logoutHovered, setLogoutHovered] = useState(false);
  const [themeHovered, setThemeHovered] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const widthAnim = useRef(new Animated.Value(272)).current;
  const contentOpacity = useRef(new Animated.Value(1)).current;

  const mobileDrawerAnim = useRef(new Animated.Value(-320)).current;
  const mobileOverlayOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isMobile) return;

    Animated.parallel([
      Animated.timing(widthAnim, {
        toValue: collapsed ? 92 : 272,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.timing(contentOpacity, {
        toValue: collapsed ? 0 : 1,
        duration: 160,
        easing: Easing.out(Easing.ease),
        useNativeDriver: false,
      }),
    ]).start();
  }, [collapsed, widthAnim, contentOpacity, isMobile]);

  useEffect(() => {
    if (!isMobile) {
      setMobileOpen(false);
      mobileDrawerAnim.setValue(-320);
      mobileOverlayOpacity.setValue(0);
      return;
    }

    Animated.parallel([
      Animated.timing(mobileDrawerAnim, {
        toValue: mobileOpen ? 0 : -320,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.timing(mobileOverlayOpacity, {
        toValue: mobileOpen ? 1 : 0,
        duration: 180,
        easing: Easing.out(Easing.ease),
        useNativeDriver: false,
      }),
    ]).start();
  }, [mobileOpen, isMobile, mobileDrawerAnim, mobileOverlayOpacity]);

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

  const handleNavigate = (path: string) => {
    router.push(path as any);
    if (isMobile) setMobileOpen(false);
  };

  const renderMenuList = (mobile = false) => (
    <View style={{ gap: 8 }}>
      {menus.map((menu) => {
        const active = isActive(menu.path);
        const isHovered = !!hovered[menu.label];

        return (
          <Pressable
            key={menu.label}
            onPress={() => handleNavigate(menu.path)}
            onHoverIn={() =>
              setHovered((prev) => ({ ...prev, [menu.label]: true }))
            }
            onHoverOut={() =>
              setHovered((prev) => ({ ...prev, [menu.label]: false }))
            }
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "flex-start",
              paddingVertical: 13,
              paddingHorizontal: 14,
              borderRadius: 16,
              backgroundColor: active
                ? theme.primarySoft
                : isHovered && !mobile
                ? theme.hover
                : "transparent",
              borderWidth: 1,
              borderColor: active || (isHovered && !mobile) ? theme.border : "transparent",
              transform: [{ scale: isHovered && !mobile ? 1.015 : 1 }],
              shadowColor: active || (isHovered && !mobile) ? theme.primary : "transparent",
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: active ? 0.1 : isHovered && !mobile ? 0.06 : 0,
              shadowRadius: 12,
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
                  ? theme.primarySoft2
                  : isHovered && !mobile
                  ? theme.primarySoft
                  : theme.surface,
              }}
            >
              <Ionicons
                name={menu.icon as any}
                size={18}
                color={active ? theme.primaryStrong : theme.primary}
              />
            </View>

            <Text
              style={{
                marginLeft: 12,
                fontSize: 15,
                fontWeight: active ? "800" : "700",
                color: active ? theme.primaryStrong : theme.text,
                letterSpacing: 0.2,
                fontFamily: Fonts.rounded,
              }}
            >
              {menu.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );

  const renderBottomActions = (mobile = false) => (
    <View style={{ gap: 10 }}>
      <Pressable
        onPress={() => {
          toggleTheme();
          if (mobile) setMobileOpen(false);
        }}
        onHoverIn={() => setThemeHovered(true)}
        onHoverOut={() => setThemeHovered(false)}
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "flex-start",
          paddingVertical: 13,
          paddingHorizontal: 14,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: theme.border,
          backgroundColor: themeHovered && !mobile ? theme.hover : theme.surface,
          transform: [{ scale: themeHovered && !mobile ? 1.015 : 1 }],
          shadowColor: themeHovered && !mobile ? theme.primary : "transparent",
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: themeHovered && !mobile ? 0.08 : 0,
          shadowRadius: 12,
        }}
      >
        <View
          style={{
            width: 34,
            height: 34,
            borderRadius: 12,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: theme.primarySoft,
          }}
        >
          <Ionicons
            name={mode === "light" ? "moon-outline" : "sunny-outline"}
            size={18}
            color={theme.primary}
          />
        </View>

        <Text
          style={{
            marginLeft: 12,
            fontSize: 15,
            fontWeight: "700",
            color: theme.text,
            letterSpacing: 0.2,
            fontFamily: Fonts.rounded,
          }}
        >
          {mode === "light" ? "Dark theme" : "Light theme"}
        </Text>
      </Pressable>

      <Pressable
        onPress={handleLogout}
        onHoverIn={() => setLogoutHovered(true)}
        onHoverOut={() => setLogoutHovered(false)}
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "flex-start",
          paddingVertical: 13,
          paddingHorizontal: 14,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: logoutHovered && !mobile ? theme.logoutBorder : theme.border,
          backgroundColor: logoutHovered && !mobile ? theme.logoutSoft : theme.surface,
          transform: [{ scale: logoutHovered && !mobile ? 1.015 : 1 }],
          shadowColor: logoutHovered && !mobile ? theme.logout : "transparent",
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: logoutHovered && !mobile ? 0.08 : 0,
          shadowRadius: 12,
        }}
      >
        <View
          style={{
            width: 34,
            height: 34,
            borderRadius: 12,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: theme.logoutIconBg,
          }}
        >
          <Ionicons name="log-out-outline" size={18} color={theme.logout} />
        </View>

        <Text
          style={{
            marginLeft: 12,
            fontSize: 15,
            fontWeight: "700",
            color: theme.logout,
            letterSpacing: 0.2,
            fontFamily: Fonts.rounded,
          }}
        >
          Log out
        </Text>
      </Pressable>
    </View>
  );

  if (isMobile) {
    return (
      <>
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 64,
            zIndex: 60,
            backgroundColor: theme.sidebar,
            borderBottomWidth: 1,
            borderBottomColor: theme.border,
            paddingHorizontal: 14,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <TouchableOpacity
            onPress={() => setMobileOpen(true)}
            activeOpacity={0.85}
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: theme.hover,
              borderWidth: 1,
              borderColor: theme.border,
            }}
          >
            <Ionicons name="menu-outline" size={20} color={theme.primary} />
          </TouchableOpacity>

          <Text
            style={{
              fontSize: 22,
              fontWeight: "800",
              color: theme.primary,
              fontFamily: Fonts.rounded,
              letterSpacing: 0.3,
            }}
          >
            MemMem
          </Text>

          <TouchableOpacity
            onPress={toggleTheme}
            activeOpacity={0.85}
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: theme.hover,
              borderWidth: 1,
              borderColor: theme.border,
            }}
          >
            <Ionicons
              name={mode === "light" ? "moon-outline" : "sunny-outline"}
              size={18}
              color={theme.primary}
            />
          </TouchableOpacity>
        </View>

        {mobileOpen && (
          <Animated.View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 80,
              opacity: mobileOverlayOpacity,
            }}
          >
            <Pressable
              onPress={() => setMobileOpen(false)}
              style={{
                flex: 1,
                backgroundColor: "rgba(0,0,0,0.28)",
              }}
            />
          </Animated.View>
        )}

        <Animated.View
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: mobileDrawerAnim,
            width: Math.min(width * 0.82, 320),
            zIndex: 90,
            backgroundColor: theme.sidebar,
            borderRightWidth: 1,
            borderRightColor: theme.border,
            paddingHorizontal: 16,
            paddingTop: 20,
            paddingBottom: 20,
            justifyContent: "space-between",
            shadowColor: theme.primary,
            shadowOffset: { width: 4, height: 0 },
            shadowOpacity: 0.08,
            shadowRadius: 14,
          }}
        >
          <View>
            <View
              style={{
                flexDirection: "row",
                alignItems: "flex-start",
                justifyContent: "space-between",
                marginBottom: 24,
              }}
            >
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text
                  style={{
                    fontSize: 28,
                    fontWeight: "800",
                    color: theme.primary,
                    letterSpacing: 0.4,
                    fontFamily: Fonts.rounded,
                  }}
                >
                  MemMem
                </Text>
                <Text
                  style={{
                    marginTop: 4,
                    fontSize: 12,
                    color: theme.mutedText,
                    fontWeight: "600",
                    letterSpacing: 0.3,
                    fontFamily: Fonts.rounded,
                  }}
                >
                  cute little space for your day ✿
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => setMobileOpen(false)}
                activeOpacity={0.85}
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 12,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: theme.hover,
                  borderWidth: 1,
                  borderColor: theme.border,
                }}
              >
                <Ionicons name="close-outline" size={20} color={theme.primary} />
              </TouchableOpacity>
            </View>

            {renderMenuList(true)}
          </View>

          {renderBottomActions(true)}
        </Animated.View>
      </>
    );
  }

  return (
    <Animated.View
      style={{
        width: widthAnim,
        backgroundColor: theme.sidebar,
        borderRightWidth: 1,
        borderRightColor: theme.border,
        paddingHorizontal: collapsed ? 12 : 20,
        paddingVertical: 24,
        justifyContent: "space-between",
        shadowColor: theme.primary,
        shadowOffset: { width: 4, height: 0 },
        shadowOpacity: 0.04,
        shadowRadius: 14,
        overflow: "hidden",
      }}
    >
      <View>
        <View
          style={{
            flexDirection: "row",
            alignItems: "flex-start",
            justifyContent: collapsed ? "center" : "space-between",
            marginBottom: 28,
          }}
        >
          {!collapsed ? (
            <Animated.View
              style={{
                flex: 1,
                paddingRight: 8,
                opacity: contentOpacity,
              }}
            >
              <Text
                style={{
                  fontSize: 30,
                  fontWeight: "800",
                  color: theme.primary,
                  letterSpacing: 0.4,
                  fontFamily: Fonts.rounded,
                }}
              >
                MemMem
              </Text>
              <Text
                style={{
                  marginTop: 4,
                  fontSize: 12,
                  color: theme.mutedText,
                  fontWeight: "600",
                  letterSpacing: 0.3,
                  fontFamily: Fonts.rounded,
                }}
              >
                cute little space for your day ✿
              </Text>
            </Animated.View>
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
              backgroundColor: theme.hover,
              borderWidth: 1,
              borderColor: theme.border,
            }}
          >
            <Ionicons
              name={collapsed ? "chevron-forward-outline" : "chevron-back-outline"}
              size={18}
              color={theme.primary}
            />
          </TouchableOpacity>
        </View>

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
                backgroundColor: theme.primarySoft,
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1,
                borderColor: theme.border,
              }}
            >
              <Text
                style={{
                  color: theme.primaryStrong,
                  fontSize: 16,
                  fontWeight: "900",
                  fontFamily: Fonts.rounded,
                }}
              >
                M
              </Text>
            </View>
          </View>
        )}

        <View style={{ gap: 8 }}>
          {menus.map((menu) => {
            const active = isActive(menu.path);
            const isHovered = !!hovered[menu.label];

            return (
              <Pressable
                key={menu.label}
                onPress={() => handleNavigate(menu.path)}
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
                    ? theme.primarySoft
                    : isHovered
                    ? theme.hover
                    : "transparent",
                  borderWidth: 1,
                  borderColor: active || isHovered ? theme.border : "transparent",
                  transform: [{ scale: isHovered ? 1.015 : 1 }],
                  shadowColor: active || isHovered ? theme.primary : "transparent",
                  shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: active ? 0.1 : isHovered ? 0.06 : 0,
                  shadowRadius: 12,
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
                      ? theme.primarySoft2
                      : isHovered
                      ? theme.primarySoft
                      : theme.surface,
                  }}
                >
                  <Ionicons
                    name={menu.icon as any}
                    size={18}
                    color={active ? theme.primaryStrong : theme.primary}
                  />
                </View>

                {!collapsed && (
                  <Animated.Text
                    style={{
                      marginLeft: 12,
                      fontSize: 15,
                      fontWeight: active ? "800" : "700",
                      color: active ? theme.primaryStrong : theme.text,
                      letterSpacing: 0.2,
                      fontFamily: Fonts.rounded,
                      opacity: contentOpacity,
                    }}
                  >
                    {menu.label}
                  </Animated.Text>
                )}
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={{ gap: 10 }}>
        <Pressable
          onPress={toggleTheme}
          onHoverIn={() => setThemeHovered(true)}
          onHoverOut={() => setThemeHovered(false)}
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: collapsed ? "center" : "flex-start",
            paddingVertical: 13,
            paddingHorizontal: collapsed ? 10 : 14,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: theme.border,
            backgroundColor: themeHovered ? theme.hover : theme.surface,
            transform: [{ scale: themeHovered ? 1.015 : 1 }],
            shadowColor: themeHovered ? theme.primary : "transparent",
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: themeHovered ? 0.08 : 0,
            shadowRadius: 12,
          }}
        >
          <View
            style={{
              width: 34,
              height: 34,
              borderRadius: 12,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: theme.primarySoft,
            }}
          >
            <Ionicons
              name={mode === "light" ? "moon-outline" : "sunny-outline"}
              size={18}
              color={theme.primary}
            />
          </View>

          {!collapsed && (
            <Animated.Text
              style={{
                marginLeft: 12,
                fontSize: 15,
                fontWeight: "700",
                color: theme.text,
                letterSpacing: 0.2,
                fontFamily: Fonts.rounded,
                opacity: contentOpacity,
              }}
            >
              {mode === "light" ? "Dark theme" : "Light theme"}
            </Animated.Text>
          )}
        </Pressable>

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
            borderColor: logoutHovered ? theme.logoutBorder : theme.border,
            backgroundColor: logoutHovered ? theme.logoutSoft : theme.surface,
            transform: [{ scale: logoutHovered ? 1.015 : 1 }],
            shadowColor: logoutHovered ? theme.logout : "transparent",
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: logoutHovered ? 0.08 : 0,
            shadowRadius: 12,
          }}
        >
          <View
            style={{
              width: 34,
              height: 34,
              borderRadius: 12,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: theme.logoutIconBg,
            }}
          >
            <Ionicons name="log-out-outline" size={18} color={theme.logout} />
          </View>

          {!collapsed && (
            <Animated.Text
              style={{
                marginLeft: 12,
                fontSize: 15,
                fontWeight: "700",
                color: theme.logout,
                letterSpacing: 0.2,
                fontFamily: Fonts.rounded,
                opacity: contentOpacity,
              }}
            >
              Log out
            </Animated.Text>
          )}
        </Pressable>
      </View>
    </Animated.View>
  );
}