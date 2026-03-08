import { useState } from "react";
import { View, Text, Image, ScrollView, TouchableOpacity, TextInput } from "react-native";
import WebLayout from "../common/WebLayout";
import { useRouter } from "expo-router";

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = "friends" | "requests" | "add";

interface Friend {
  username: string;
  avatar: string;
  mutuals: number;
  online?: boolean;
}

interface FriendRequest {
  username: string;
  avatar: string;
  mutuals: number;
  since: string; // "sent X ago"
}

interface Suggestion {
  username: string;
  avatar: string;
  mutuals: number;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const INITIAL_FRIENDS: Friend[] = [
  { username: "sarah_creates",  avatar: "https://i.pravatar.cc/150?img=47", mutuals: 4, online: true },
  { username: "alex.travels",   avatar: "https://i.pravatar.cc/150?img=12", mutuals: 2, online: false },
  { username: "mia.journal",    avatar: "https://i.pravatar.cc/150?img=32", mutuals: 6, online: true },
  { username: "tom.captures",   avatar: "https://i.pravatar.cc/150?img=53", mutuals: 1, online: false },
  { username: "nina.ink",       avatar: "https://i.pravatar.cc/150?img=44", mutuals: 3, online: true },
  { username: "leo.shoots",     avatar: "https://i.pravatar.cc/150?img=60", mutuals: 5, online: false },
];

const INITIAL_REQUESTS: FriendRequest[] = [
  { username: "luna.frames",  avatar: "https://i.pravatar.cc/150?img=5",  mutuals: 3, since: "2d ago" },
  { username: "kai.wanders",  avatar: "https://i.pravatar.cc/150?img=11", mutuals: 1, since: "5d ago" },
  { username: "zoe.palette",  avatar: "https://i.pravatar.cc/150?img=20", mutuals: 2, since: "1w ago" },
];

const SUGGESTIONS: Suggestion[] = [
  { username: "nova.lens",     avatar: "https://i.pravatar.cc/150?img=25", mutuals: 4 },
  { username: "cole.vista",    avatar: "https://i.pravatar.cc/150?img=33", mutuals: 2 },
  { username: "ava.mindful",   avatar: "https://i.pravatar.cc/150?img=16", mutuals: 5 },
  { username: "ray.stories",   avatar: "https://i.pravatar.cc/150?img=8",  mutuals: 1 },
  { username: "jade.wanders",  avatar: "https://i.pravatar.cc/150?img=29", mutuals: 3 },
  { username: "eli.frames",    avatar: "https://i.pravatar.cc/150?img=36", mutuals: 2 },
];

// ─── Styles ───────────────────────────────────────────────────────────────────

const card: any = {
  backgroundColor: "#fff",
  borderRadius: 18,
  borderWidth: 1,
  borderColor: "#f1f5f9",
  shadowColor: "#94a3b8",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.07,
  shadowRadius: 8,
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function FriendsPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("friends");
  const [friends, setFriends] = useState(INITIAL_FRIENDS);
  const [requests, setRequests] = useState(INITIAL_REQUESTS);
  const [sent, setSent] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [removeConfirm, setRemoveConfirm] = useState<string | null>(null);

  // ── Actions ──────────────────────────────────────────────────────────────

  const acceptRequest = (username: string) => {
    const req = requests.find((r) => r.username === username);
    if (req) {
      setFriends((prev) => [
        { username: req.username, avatar: req.avatar, mutuals: req.mutuals, online: false },
        ...prev,
      ]);
      setRequests((prev) => prev.filter((r) => r.username !== username));
    }
  };

  const declineRequest = (username: string) => {
    setRequests((prev) => prev.filter((r) => r.username !== username));
  };

  const removeFriend = (username: string) => {
    setFriends((prev) => prev.filter((f) => f.username !== username));
    setRemoveConfirm(null);
  };

  const sendRequest = (username: string) => {
    setSent((prev) => new Set(prev).add(username));
  };

  // ── Derived ──────────────────────────────────────────────────────────────

  const filteredFriends = friends.filter((f) =>
    f.username.toLowerCase().includes(search.toLowerCase())
  );

  const tabs: { label: string; value: Tab; badge?: number }[] = [
    { label: "Friends", value: "friends", badge: friends.length },
    { label: "Requests", value: "requests", badge: requests.length || undefined },
    { label: "Add Friends", value: "add" },
  ];

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <WebLayout>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 60 }}
        style={{ flex: 1 }}
      >
        <View style={{ maxWidth: 680, marginHorizontal: "auto" as any, width: "100%" }}>

          {/* ── Header ── */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 28 }}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: "#f1f5f9",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ fontSize: 18, color: "#64748b", lineHeight: 22 }}>‹</Text>
            </TouchableOpacity>
            <View>
              <Text style={{ fontSize: 24, fontWeight: "800", color: "#0f172a", letterSpacing: -0.5 }}>
                Friends
              </Text>
              <Text style={{ fontSize: 12, color: "#94a3b8", marginTop: 1 }}>
                {friends.length} friends · {requests.length} pending
              </Text>
            </View>
          </View>

          {/* ── Tab Bar ── */}
          <View
            style={{
              flexDirection: "row",
              backgroundColor: "#f1f5f9",
              borderRadius: 14,
              padding: 4,
              marginBottom: 24,
            }}
          >
            {tabs.map((t) => (
              <TouchableOpacity
                key={t.value}
                onPress={() => setTab(t.value)}
                style={{
                  flex: 1,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  paddingVertical: 10,
                  borderRadius: 11,
                  backgroundColor: tab === t.value ? "#fff" : "transparent",
                  shadowColor: tab === t.value ? "#94a3b8" : "transparent",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.12,
                  shadowRadius: 4,
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "600",
                    color: tab === t.value ? "#0f172a" : "#94a3b8",
                  }}
                >
                  {t.label}
                </Text>
                {t.badge !== undefined && t.badge > 0 && (
                  <View
                    style={{
                      backgroundColor: t.value === "requests" ? "#fce7f3" : "#f1f5f9",
                      paddingHorizontal: 7,
                      paddingVertical: 1,
                      borderRadius: 10,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: "700",
                        color: t.value === "requests" ? "#be185d" : "#64748b",
                      }}
                    >
                      {t.badge}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* ══════════════════════════════════════════════════════════════
               TAB: FRIENDS
          ══════════════════════════════════════════════════════════════ */}
          {tab === "friends" && (
            <View>
              {/* Search */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: "#fff",
                  borderRadius: 13,
                  borderWidth: 1,
                  borderColor: "#f1f5f9",
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  marginBottom: 16,
                  gap: 8,
                }}
              >
                <Text style={{ fontSize: 14, color: "#cbd5e1" }}>🔍</Text>
                <TextInput
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Search friends..."
                  placeholderTextColor="#cbd5e1"
                  style={{
                    flex: 1,
                    fontSize: 14,
                    color: "#0f172a",
                    outline: "none",
                  } as any}
                />
                {search.length > 0 && (
                  <TouchableOpacity onPress={() => setSearch("")}>
                    <Text style={{ color: "#cbd5e1", fontSize: 16 }}>×</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Online section */}
              {filteredFriends.some((f) => f.online) && search === "" && (
                <View style={{ marginBottom: 20 }}>
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: "700",
                      color: "#94a3b8",
                      letterSpacing: 1.2,
                      textTransform: "uppercase",
                      marginBottom: 10,
                    }}
                  >
                    Online now
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
                    {filteredFriends
                      .filter((f) => f.online)
                      .map((f) => (
                        <TouchableOpacity
                          key={f.username}
                          style={{ alignItems: "center", gap: 6 }}
                          onPress={() => router.push(`/profile/${f.username}` as any)}
                        >
                          <View style={{ position: "relative" }}>
                            <Image
                              source={{ uri: f.avatar }}
                              style={{
                                width: 52,
                                height: 52,
                                borderRadius: 26,
                                borderWidth: 2.5,
                                borderColor: "#22c55e",
                              }}
                            />
                            <View
                              style={{
                                position: "absolute",
                                bottom: 0,
                                right: 0,
                                width: 13,
                                height: 13,
                                borderRadius: 7,
                                backgroundColor: "#22c55e",
                                borderWidth: 2,
                                borderColor: "#fff",
                              }}
                            />
                          </View>
                          <Text style={{ fontSize: 11, color: "#64748b", fontWeight: "500", maxWidth: 60 }} numberOfLines={1}>
                            {f.username.split(".")[0]}
                          </Text>
                        </TouchableOpacity>
                      ))}
                  </ScrollView>
                </View>
              )}

              {/* All friends list */}
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "700",
                  color: "#94a3b8",
                  letterSpacing: 1.2,
                  textTransform: "uppercase",
                  marginBottom: 10,
                }}
              >
                {search ? `${filteredFriends.length} result${filteredFriends.length !== 1 ? "s" : ""}` : "All friends"}
              </Text>

              <View style={{ ...card, overflow: "hidden" }}>
                {filteredFriends.length === 0 ? (
                  <View style={{ alignItems: "center", paddingVertical: 48 }}>
                    <Text style={{ fontSize: 28, marginBottom: 8 }}>🔍</Text>
                    <Text style={{ fontSize: 14, color: "#94a3b8" }}>No friends match &quot;{search}&quot;</Text>
                  </View>
                ) : (
                  filteredFriends.map((f, i) => (
                    <View
                      key={f.username}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        paddingHorizontal: 18,
                        paddingVertical: 13,
                        borderBottomWidth: i < filteredFriends.length - 1 ? 1 : 0,
                        borderBottomColor: "#f8fafc",
                        gap: 12,
                      }}
                    >
                      {/* Avatar */}
                      <TouchableOpacity
                        onPress={() => router.push(`/profile/${f.username}` as any)}
                        style={{ position: "relative" }}
                      >
                        <Image
                          source={{ uri: f.avatar }}
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: 22,
                            borderWidth: 2,
                            borderColor: f.online ? "#22c55e" : "#f1f5f9",
                          }}
                        />
                        {f.online && (
                          <View
                            style={{
                              position: "absolute",
                              bottom: 0,
                              right: 0,
                              width: 12,
                              height: 12,
                              borderRadius: 6,
                              backgroundColor: "#22c55e",
                              borderWidth: 2,
                              borderColor: "#fff",
                            }}
                          />
                        )}
                      </TouchableOpacity>

                      {/* Info */}
                      <TouchableOpacity
                        style={{ flex: 1 }}
                        onPress={() => router.push(`/profile/${f.username}` as any)}
                      >
                        <Text style={{ fontSize: 14, fontWeight: "700", color: "#0f172a" }}>
                          @{f.username}
                        </Text>
                        <Text style={{ fontSize: 12, color: "#94a3b8", marginTop: 1 }}>
                          {f.mutuals} mutual friend{f.mutuals !== 1 ? "s" : ""} · {f.online ? "Online" : "Offline"}
                        </Text>
                      </TouchableOpacity>

                      {/* Remove */}
                      {removeConfirm === f.username ? (
                        <View style={{ flexDirection: "row", gap: 6 }}>
                          <TouchableOpacity
                            onPress={() => removeFriend(f.username)}
                            style={{
                              paddingHorizontal: 10,
                              paddingVertical: 6,
                              borderRadius: 8,
                              backgroundColor: "#fee2e2",
                            }}
                          >
                            <Text style={{ fontSize: 12, fontWeight: "600", color: "#dc2626" }}>Remove</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => setRemoveConfirm(null)}
                            style={{
                              paddingHorizontal: 10,
                              paddingVertical: 6,
                              borderRadius: 8,
                              backgroundColor: "#f1f5f9",
                            }}
                          >
                            <Text style={{ fontSize: 12, color: "#64748b" }}>Cancel</Text>
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <TouchableOpacity
                          onPress={() => setRemoveConfirm(f.username)}
                          style={{
                            paddingHorizontal: 12,
                            paddingVertical: 7,
                            borderRadius: 10,
                            borderWidth: 1,
                            borderColor: "#e2e8f0",
                          }}
                        >
                          <Text style={{ fontSize: 12, fontWeight: "600", color: "#64748b" }}>···</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  ))
                )}
              </View>
            </View>
          )}

          {/* ══════════════════════════════════════════════════════════════
               TAB: REQUESTS
          ══════════════════════════════════════════════════════════════ */}
          {tab === "requests" && (
            <View>
              {requests.length === 0 ? (
                <View style={{ alignItems: "center", paddingVertical: 72 }}>
                  <Text style={{ fontSize: 36, marginBottom: 12 }}>✓</Text>
                  <Text style={{ fontSize: 16, fontWeight: "700", color: "#0f172a", marginBottom: 6 }}>
                    All caught up!
                  </Text>
                  <Text style={{ fontSize: 13, color: "#94a3b8" }}>No pending friend requests</Text>
                </View>
              ) : (
                <>
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: "700",
                      color: "#94a3b8",
                      letterSpacing: 1.2,
                      textTransform: "uppercase",
                      marginBottom: 12,
                    }}
                  >
                    {requests.length} pending request{requests.length !== 1 ? "s" : ""}
                  </Text>

                  <View style={{ gap: 12 }}>
                    {requests.map((req) => (
                      <View
                        key={req.username}
                        style={{
                          ...card,
                          padding: 18,
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 14,
                        }}
                      >
                        {/* Avatar */}
                        <TouchableOpacity onPress={() => router.push(`/profile/${req.username}` as any)}>
                          <Image
                            source={{ uri: req.avatar }}
                            style={{ width: 50, height: 50, borderRadius: 25, borderWidth: 2, borderColor: "#f1f5f9" }}
                          />
                        </TouchableOpacity>

                        {/* Info + Buttons */}
                        <View style={{ flex: 1 }}>
                          <TouchableOpacity onPress={() => router.push(`/profile/${req.username}` as any)}>
                            <Text style={{ fontSize: 14, fontWeight: "700", color: "#0f172a" }}>
                              @{req.username}
                            </Text>
                            <Text style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>
                              {req.mutuals} mutual · Sent {req.since}
                            </Text>
                          </TouchableOpacity>

                          <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
                            <TouchableOpacity
                              onPress={() => acceptRequest(req.username)}
                              style={{
                                flex: 1,
                                paddingVertical: 9,
                                borderRadius: 11,
                                backgroundColor: "#0f172a",
                                alignItems: "center",
                              }}
                            >
                              <Text style={{ fontSize: 13, fontWeight: "600", color: "#fff" }}>Accept</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              onPress={() => declineRequest(req.username)}
                              style={{
                                flex: 1,
                                paddingVertical: 9,
                                borderRadius: 11,
                                backgroundColor: "#f1f5f9",
                                alignItems: "center",
                              }}
                            >
                              <Text style={{ fontSize: 13, fontWeight: "600", color: "#64748b" }}>Decline</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>
                </>
              )}
            </View>
          )}

          {/* ══════════════════════════════════════════════════════════════
               TAB: ADD FRIENDS
          ══════════════════════════════════════════════════════════════ */}
          {tab === "add" && (
            <View>
              {/* Search bar */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: "#fff",
                  borderRadius: 13,
                  borderWidth: 1,
                  borderColor: "#f1f5f9",
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  marginBottom: 24,
                  gap: 8,
                  shadowColor: "#94a3b8",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.07,
                  shadowRadius: 6,
                }}
              >
                <Text style={{ fontSize: 14, color: "#cbd5e1" }}>🔍</Text>
                <TextInput
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Search by username..."
                  placeholderTextColor="#cbd5e1"
                  style={{
                    flex: 1,
                    fontSize: 14,
                    color: "#0f172a",
                    outline: "none",
                  } as any}
                />
              </View>

              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "700",
                  color: "#94a3b8",
                  letterSpacing: 1.2,
                  textTransform: "uppercase",
                  marginBottom: 12,
                }}
              >
                People you may know
              </Text>

              <View style={{ gap: 10 }}>
                {SUGGESTIONS.filter(
                  (s) =>
                    s.username.toLowerCase().includes(search.toLowerCase()) &&
                    !friends.some((f) => f.username === s.username)
                ).map((s) => (
                  <View
                    key={s.username}
                    style={{
                      ...card,
                      flexDirection: "row",
                      alignItems: "center",
                      padding: 16,
                      gap: 14,
                    }}
                  >
                    <Image
                      source={{ uri: s.avatar }}
                      style={{ width: 46, height: 46, borderRadius: 23, borderWidth: 2, borderColor: "#f1f5f9" }}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14, fontWeight: "700", color: "#0f172a" }}>
                        @{s.username}
                      </Text>
                      <Text style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>
                        {s.mutuals} mutual friend{s.mutuals !== 1 ? "s" : ""}
                      </Text>
                    </View>

                    <TouchableOpacity
                      onPress={() => sendRequest(s.username)}
                      style={{
                        paddingHorizontal: 16,
                        paddingVertical: 8,
                        borderRadius: 11,
                        backgroundColor: sent.has(s.username) ? "#f1f5f9" : "#0f172a",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: "600",
                          color: sent.has(s.username) ? "#94a3b8" : "#fff",
                        }}
                      >
                        {sent.has(s.username) ? "Sent ✓" : "Add"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
          )}

        </View>
      </ScrollView>
    </WebLayout>
  );
}