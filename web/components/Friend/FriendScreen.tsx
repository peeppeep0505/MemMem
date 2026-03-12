import { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import WebLayout from "../common/WebLayout";
import { useRouter } from "expo-router";
import {
  getFriends,
  getFriendRequests,
  searchUsers,
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  removeFriend as removeFriendApi,
} from "@/services/friendService";
import { useAuth } from "@/contexts/AuthContext";

type Tab = "friends" | "requests" | "add";

type ApiUser = {
  _id: string;
  username?: string;
  name?: string;
  email?: string;
  profilePic?: string;
  friends?: string[];
};

type ApiFriendRequest = {
  _id: string;
  sender?: ApiUser;
  receiver?: string | ApiUser;
  status?: string;
  createdAt?: string;
};

type Friend = {
  _id: string;
  username: string;
  avatar: string;
  mutuals: number;
  online?: boolean;
};

type FriendRequestItem = {
  _id: string;
  userId: string;
  username: string;
  avatar: string;
  mutuals: number;
  since: string;
};

type Suggestion = {
  _id: string;
  username: string;
  avatar: string;
  mutuals: number;
};
const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || "http://localhost:5000/api";
const UPLOAD_BASE = API_BASE_URL.replace(/\/api$/, "");


function normalizeUri(value?: string) {
  if (!value) return "";
  return String(value).trim();
}

function getImageUri(path?: string) {
  const cleanPath = normalizeUri(path);
  if (!cleanPath) return "";

  if (cleanPath.startsWith("http")) return cleanPath;
  if (cleanPath.startsWith("data:image")) return cleanPath;

  return `${UPLOAD_BASE}/uploads/${cleanPath}`;
}


function timeAgo(dateString?: string) {
  if (!dateString) return "recently";

  const now = new Date().getTime();
  const date = new Date(dateString).getTime();
  const diffMs = Math.max(0, now - date);

  const minutes = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w ago`;

  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

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

export default function FriendsPage() {
  const router = useRouter();
  const { user } = useAuth();

  const currentUserId = useMemo(
    () => (user as any)?._id || (user as any)?.id || "",
    [user]
  );

  const [tab, setTab] = useState<Tab>("friends");
  const [friends, setFriends] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<FriendRequestItem[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [sent, setSent] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [removeConfirm, setRemoveConfirm] = useState<string | null>(null);

  const [loadingPage, setLoadingPage] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingSearch, setLoadingSearch] = useState(false);

  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [decliningId, setDecliningId] = useState<string | null>(null);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const mapFriend = (item: ApiUser): Friend => ({
    _id: item._id,
    username: item.username || item.name || item.email || "unknown",
    avatar: getImageUri(item.profilePic),
    mutuals: 0,
    online: false,
  });

  const mapRequest = (item: ApiFriendRequest): FriendRequestItem | null => {
    if (!item.sender?._id) return null;

    return {
      _id: item._id,
      userId: item.sender._id,
      username:
        item.sender.username ||
        item.sender.name ||
        item.sender.email ||
        "unknown",
      avatar: getImageUri(item.sender.profilePic),
      mutuals: 0,
      since: timeAgo(item.createdAt),
    };
  };

  const mapSuggestion = (item: ApiUser): Suggestion => ({
    _id: item._id,
    username: item.username || item.name || item.email || "unknown",
    avatar: getImageUri(item.profilePic),
    mutuals: 0,
  });

  const loadFriends = useCallback(async () => {
    if (!currentUserId) return;

    const data = await getFriends(currentUserId);
    const normalized = Array.isArray(data) ? data.map(mapFriend) : [];
    setFriends(normalized);
  }, [currentUserId]);

  const loadRequests = useCallback(async () => {
    if (!currentUserId) return;

    const data = await getFriendRequests(currentUserId);
    const normalized = Array.isArray(data)
      ? data.map(mapRequest).filter(Boolean)
      : [];

    setRequests(normalized as FriendRequestItem[]);
  }, [currentUserId]);

  const loadInitialData = useCallback(async () => {
    if (!currentUserId) return;

    try {
      setLoadingPage(true);
      await Promise.all([loadFriends(), loadRequests()]);
    } catch (error: any) {
      Alert.alert("Error", error?.message || "Failed to load friends data");
    } finally {
      setLoadingPage(false);
    }
  }, [currentUserId, loadFriends, loadRequests]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  const handleSearchUsers = useCallback(
    async (keyword: string) => {
      if (!currentUserId) return;

      const trimmed = keyword.trim();

      if (!trimmed) {
        setSuggestions([]);
        return;
      }

      try {
        setLoadingSearch(true);
        const data = await searchUsers(trimmed, currentUserId);
        const normalized = Array.isArray(data) ? data.map(mapSuggestion) : [];
        setSuggestions(normalized);
      } catch (error: any) {
        Alert.alert("Error", error?.message || "Failed to search users");
      } finally {
        setLoadingSearch(false);
      }
    },
    [currentUserId]
  );

  useEffect(() => {
    if (tab !== "add") return;

    const timer = setTimeout(() => {
      handleSearchUsers(search);
    }, 350);

    return () => clearTimeout(timer);
  }, [search, tab, handleSearchUsers]);

  const onRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      await Promise.all([loadFriends(), loadRequests()]);
      if (tab === "add" && search.trim()) {
        await handleSearchUsers(search);
      }
    } catch (error: any) {
      Alert.alert("Error", error?.message || "Refresh failed");
    } finally {
      setRefreshing(false);
    }
  }, [loadFriends, loadRequests, tab, search, handleSearchUsers]);

  const acceptRequest = async (requestId: string) => {
    try {
      setAcceptingId(requestId);
      await acceptFriendRequest(requestId);
      await Promise.all([loadFriends(), loadRequests()]);
    } catch (error: any) {
      Alert.alert("Error", error?.message || "Failed to accept request");
    } finally {
      setAcceptingId(null);
    }
  };

  const declineRequest = async (requestId: string) => {
    try {
      setDecliningId(requestId);
      await declineFriendRequest(requestId);
      await loadRequests();
    } catch (error: any) {
      Alert.alert("Error", error?.message || "Failed to decline request");
    } finally {
      setDecliningId(null);
    }
  };

  const removeFriend = async (friendId: string) => {
    if (!currentUserId) return;

    try {
      setRemovingId(friendId);
      await removeFriendApi(currentUserId, friendId);
      setRemoveConfirm(null);
      await loadFriends();
    } catch (error: any) {
      Alert.alert("Error", error?.message || "Failed to remove friend");
    } finally {
      setRemovingId(null);
    }
  };

  const sendRequest = async (targetUserId: string) => {
    if (!currentUserId) return;

    try {
      setSendingId(targetUserId);
      await sendFriendRequest(currentUserId, targetUserId);
      setSent((prev) => new Set(prev).add(targetUserId));
      await loadRequests();
    } catch (error: any) {
      Alert.alert("Error", error?.message || "Failed to send request");
    } finally {
      setSendingId(null);
    }
  };

  const filteredFriends = friends.filter((f) =>
    f.username.toLowerCase().includes(search.toLowerCase())
  );

  const filteredSuggestions = suggestions.filter(
    (s) =>
      s.username.toLowerCase().includes(search.toLowerCase()) &&
      !friends.some((f) => f._id === s._id)
  );

  const tabs: { label: string; value: Tab; badge?: number }[] = [
    { label: "Friends", value: "friends", badge: friends.length },
    { label: "Requests", value: "requests", badge: requests.length || undefined },
    { label: "Add Friends", value: "add" },
  ];

  if (!currentUserId) {
    return (
      <WebLayout>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ fontSize: 16, color: "#ef4444", fontWeight: "700" }}>
            User not found
          </Text>
          <Text style={{ fontSize: 13, color: "#94a3b8", marginTop: 8 }}>
            Please login again
          </Text>
        </View>
      </WebLayout>
    );
  }

  return (
    <WebLayout>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 60 }}
        style={{ flex: 1 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={{ maxWidth: 680, marginHorizontal: "auto" as any, width: "100%" }}>
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
              <Text
                style={{
                  fontSize: 24,
                  fontWeight: "800",
                  color: "#0f172a",
                  letterSpacing: -0.5,
                }}
              >
                Friends
              </Text>
              <Text style={{ fontSize: 12, color: "#94a3b8", marginTop: 1 }}>
                {friends.length} friends · {requests.length} pending
              </Text>
            </View>
          </View>

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
                onPress={() => {
                  setTab(t.value);
                  if (t.value !== "add") setSearch("");
                }}
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

          {loadingPage ? (
            <View style={{ paddingVertical: 80, alignItems: "center" }}>
              <ActivityIndicator size="large" />
            </View>
          ) : (
            <>
              {tab === "friends" && (
                <View>
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
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ gap: 12 }}
                      >
                        {filteredFriends
                          .filter((f) => f.online)
                          .map((f) => (
                            <TouchableOpacity
                              key={f._id}
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
                              <Text
                                style={{
                                  fontSize: 11,
                                  color: "#64748b",
                                  fontWeight: "500",
                                  maxWidth: 60,
                                }}
                                numberOfLines={1}
                              >
                                {f.username.split(".")[0]}
                              </Text>
                            </TouchableOpacity>
                          ))}
                      </ScrollView>
                    </View>
                  )}

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
                    {search
                      ? `${filteredFriends.length} result${
                          filteredFriends.length !== 1 ? "s" : ""
                        }`
                      : "All friends"}
                  </Text>

                  <View style={{ ...card, overflow: "hidden" }}>
                    {filteredFriends.length === 0 ? (
                      <View style={{ alignItems: "center", paddingVertical: 48 }}>
                        <Text style={{ fontSize: 28, marginBottom: 8 }}>🔍</Text>
                        <Text style={{ fontSize: 14, color: "#94a3b8" }}>
                          No friends match &quot;{search}&quot;
                        </Text>
                      </View>
                    ) : (
                      filteredFriends.map((f, i) => (
                        <View
                          key={f._id}
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

                          <TouchableOpacity
                            style={{ flex: 1 }}
                            onPress={() => router.push(`/profile/${f.username}` as any)}
                          >
                            <Text
                              style={{
                                fontSize: 14,
                                fontWeight: "700",
                                color: "#0f172a",
                              }}
                            >
                              @{f.username}
                            </Text>
                            <Text
                              style={{
                                fontSize: 12,
                                color: "#94a3b8",
                                marginTop: 1,
                              }}
                            >
                              {f.mutuals} mutual friend{f.mutuals !== 1 ? "s" : ""} ·{" "}
                              {f.online ? "Online" : "Offline"}
                            </Text>
                          </TouchableOpacity>

                          {removeConfirm === f._id ? (
                            <View style={{ flexDirection: "row", gap: 6 }}>
                              <TouchableOpacity
                                onPress={() => removeFriend(f._id)}
                                disabled={removingId === f._id}
                                style={{
                                  paddingHorizontal: 10,
                                  paddingVertical: 6,
                                  borderRadius: 8,
                                  backgroundColor: "#fee2e2",
                                }}
                              >
                                <Text
                                  style={{
                                    fontSize: 12,
                                    fontWeight: "600",
                                    color: "#dc2626",
                                  }}
                                >
                                  {removingId === f._id ? "Removing..." : "Remove"}
                                </Text>
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
                                <Text style={{ fontSize: 12, color: "#64748b" }}>
                                  Cancel
                                </Text>
                              </TouchableOpacity>
                            </View>
                          ) : (
                            <TouchableOpacity
                              onPress={() => setRemoveConfirm(f._id)}
                              style={{
                                paddingHorizontal: 12,
                                paddingVertical: 7,
                                borderRadius: 10,
                                borderWidth: 1,
                                borderColor: "#e2e8f0",
                              }}
                            >
                              <Text
                                style={{
                                  fontSize: 12,
                                  fontWeight: "600",
                                  color: "#64748b",
                                }}
                              >
                                ···
                              </Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      ))
                    )}
                  </View>
                </View>
              )}

              {tab === "requests" && (
                <View>
                  {requests.length === 0 ? (
                    <View style={{ alignItems: "center", paddingVertical: 72 }}>
                      <Text style={{ fontSize: 36, marginBottom: 12 }}>✓</Text>
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: "700",
                          color: "#0f172a",
                          marginBottom: 6,
                        }}
                      >
                        All caught up!
                      </Text>
                      <Text style={{ fontSize: 13, color: "#94a3b8" }}>
                        No pending friend requests
                      </Text>
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
                        {requests.length} pending request
                        {requests.length !== 1 ? "s" : ""}
                      </Text>

                      <View style={{ gap: 12 }}>
                        {requests.map((req) => (
                          <View
                            key={req._id}
                            style={{
                              ...card,
                              padding: 18,
                              flexDirection: "row",
                              alignItems: "center",
                              gap: 14,
                            }}
                          >
                            <TouchableOpacity
                              onPress={() => router.push(`/profile/${req.username}` as any)}
                            >
                              <Image
                                source={{ uri: req.avatar }}
                                style={{
                                  width: 50,
                                  height: 50,
                                  borderRadius: 25,
                                  borderWidth: 2,
                                  borderColor: "#f1f5f9",
                                }}
                              />
                            </TouchableOpacity>

                            <View style={{ flex: 1 }}>
                              <TouchableOpacity
                                onPress={() => router.push(`/profile/${req.username}` as any)}
                              >
                                <Text
                                  style={{
                                    fontSize: 14,
                                    fontWeight: "700",
                                    color: "#0f172a",
                                  }}
                                >
                                  @{req.username}
                                </Text>
                                <Text
                                  style={{
                                    fontSize: 12,
                                    color: "#94a3b8",
                                    marginTop: 2,
                                  }}
                                >
                                  {req.mutuals} mutual · Sent {req.since}
                                </Text>
                              </TouchableOpacity>

                              <View
                                style={{
                                  flexDirection: "row",
                                  gap: 8,
                                  marginTop: 12,
                                }}
                              >
                                <TouchableOpacity
                                  onPress={() => acceptRequest(req._id)}
                                  disabled={
                                    acceptingId === req._id || decliningId === req._id
                                  }
                                  style={{
                                    flex: 1,
                                    paddingVertical: 9,
                                    borderRadius: 11,
                                    backgroundColor: "#0f172a",
                                    alignItems: "center",
                                  }}
                                >
                                  <Text
                                    style={{
                                      fontSize: 13,
                                      fontWeight: "600",
                                      color: "#fff",
                                    }}
                                  >
                                    {acceptingId === req._id ? "Accepting..." : "Accept"}
                                  </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                  onPress={() => declineRequest(req._id)}
                                  disabled={
                                    acceptingId === req._id || decliningId === req._id
                                  }
                                  style={{
                                    flex: 1,
                                    paddingVertical: 9,
                                    borderRadius: 11,
                                    backgroundColor: "#f1f5f9",
                                    alignItems: "center",
                                  }}
                                >
                                  <Text
                                    style={{
                                      fontSize: 13,
                                      fontWeight: "600",
                                      color: "#64748b",
                                    }}
                                  >
                                    {decliningId === req._id ? "Declining..." : "Decline"}
                                  </Text>
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

              {tab === "add" && (
                <View>
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

                  {loadingSearch ? (
                    <View style={{ paddingVertical: 40, alignItems: "center" }}>
                      <ActivityIndicator size="large" />
                    </View>
                  ) : !search.trim() ? (
                    <View style={{ alignItems: "center", paddingVertical: 56 }}>
                      <Text style={{ fontSize: 14, color: "#94a3b8" }}>
                        Search by username or name
                      </Text>
                    </View>
                  ) : filteredSuggestions.length === 0 ? (
                    <View style={{ alignItems: "center", paddingVertical: 56 }}>
                      <Text style={{ fontSize: 14, color: "#94a3b8" }}>
                        No users found
                      </Text>
                    </View>
                  ) : (
                    <View style={{ gap: 10 }}>
                      {filteredSuggestions.map((s) => (
                        <View
                          key={s._id}
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
                            style={{
                              width: 46,
                              height: 46,
                              borderRadius: 23,
                              borderWidth: 2,
                              borderColor: "#f1f5f9",
                            }}
                          />
                          <View style={{ flex: 1 }}>
                            <Text
                              style={{
                                fontSize: 14,
                                fontWeight: "700",
                                color: "#0f172a",
                              }}
                            >
                              @{s.username}
                            </Text>
                            <Text
                              style={{
                                fontSize: 12,
                                color: "#94a3b8",
                                marginTop: 2,
                              }}
                            >
                              {s.mutuals} mutual friend{s.mutuals !== 1 ? "s" : ""}
                            </Text>
                          </View>

                          <TouchableOpacity
                            onPress={() => sendRequest(s._id)}
                            disabled={sendingId === s._id || sent.has(s._id)}
                            style={{
                              paddingHorizontal: 16,
                              paddingVertical: 8,
                              borderRadius: 11,
                              backgroundColor:
                                sent.has(s._id) || sendingId === s._id
                                  ? "#f1f5f9"
                                  : "#0f172a",
                            }}
                          >
                            <Text
                              style={{
                                fontSize: 13,
                                fontWeight: "600",
                                color:
                                  sent.has(s._id) || sendingId === s._id
                                    ? "#94a3b8"
                                    : "#fff",
                              }}
                            >
                              {sendingId === s._id
                                ? "Sending..."
                                : sent.has(s._id)
                                ? "Sent ✓"
                                : "Add"}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>
    </WebLayout>
  );
}