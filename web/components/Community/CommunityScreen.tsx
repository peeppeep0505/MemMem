import { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  useWindowDimensions,
} from "react-native";
import WebLayout from "../common/WebLayout";
import CreatePost from "./CreatePost";
import { useRouter } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import type { Post } from "@/types/types";
import ConfirmDialog from "../common/dialog/ConfirmDialog";
import {
  deletePost,
  getFriendPosts,
  getMyPosts,
  likePost,
} from "@/services/postService";
import { getProfile } from "@/services/profileService";

// ─── Types ───────────────────────────────────────────────────────────────────

type FeedFilter = "friends" | "mine";

type FriendSidebarItem = {
  username: string;
  avatar: string;
  mutuals: number;
  online: boolean;
};

type FriendRequestItem = {
  username: string;
  avatar: string;
};

type LoadedProfile = {
  _id?: string;
  username?: string;
  email?: string;
  bio?: string;
  profilePic?: string;
  backgroundColor?: string;
  friends?: string[];
};

const SIDEBAR_LIMIT = 3;

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

function getAvatarForPost(post: Post, latestProfile?: LoadedProfile, authUser?: any) {
  const postAvatar = getImageUri(post.user?.profilePic);
  if (postAvatar) return postAvatar;

  const isMine = String(post.userId || "") === String(authUser?._id || "");
  if (isMine) {
    const latestMineAvatar = getImageUri(latestProfile?.profilePic || "");
    if (latestMineAvatar) return latestMineAvatar;

    const authAvatar = getImageUri(authUser?.profilePic || "");
    if (authAvatar) return authAvatar;
  }

  return "";
}

function normalizeImages(images?: string[]) {
  if (!Array.isArray(images)) return [];
  return images
    .filter(Boolean)
    .map((img) => String(img).trim())
    .filter((img) => img.length > 0);
}

function formatTime(date?: string) {
  if (!date) return "Just now";

  const diffMs = Date.now() - new Date(date).getTime();
  const diffMin = Math.floor(diffMs / 1000 / 60);

  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;

  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;

  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const sideCard: any = {
  backgroundColor: "#fff",
  borderRadius: 18,
  padding: 18,
  borderWidth: 1,
  borderColor: "#f1f5f9",
  shadowColor: "#94a3b8",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.07,
  shadowRadius: 8,
  marginBottom: 16,
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function CommunityPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { width: windowWidth } = useWindowDimensions();

  const [posts, setPosts] = useState<Post[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [filter, setFilter] = useState<FeedFilter>("friends");
  const [loading, setLoading] = useState(true);

  const [friends, setFriends] = useState<FriendSidebarItem[]>([]);
  const [requests, setRequests] = useState<FriendRequestItem[]>([]);

  const [confirmVisible, setConfirmVisible] = useState(false);
  const [selectedDeleteId, setSelectedDeleteId] = useState<string | null>(null);

  const [profile, setProfile] = useState<LoadedProfile | null>(null);
  const [brokenAvatars, setBrokenAvatars] = useState<Record<string, boolean>>({});
  const [myProfileBroken, setMyProfileBroken] = useState(false);

  const userId = user?._id || "";
  const myDisplayName = profile?.username || user?.username || "you";
  const myAvatar =
    getImageUri(profile?.profilePic || "") ||
    getImageUri((user as any)?.profilePic || "");

  const postImageWidth = useMemo(() => {
    if (windowWidth <= 768) {
      return Math.max(280, windowWidth - 64);
    }
    return 518;
  }, [windowWidth]);

  const loadProfile = useCallback(async () => {
    if (!userId) return;
    try {
      const latestProfile = await getProfile(userId);
      setProfile(latestProfile);
    } catch (error) {
      console.error("loadProfile error:", error);
    }
  }, [userId]);

  const loadPosts = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);

      const [friendPosts, myPosts] = await Promise.all([
        getFriendPosts(userId),
        getMyPosts(userId),
      ]);

      const merged = [
        ...(Array.isArray(friendPosts) ? friendPosts : []),
        ...(Array.isArray(myPosts) ? myPosts : []),
      ];

      merged.sort((a, b) => {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bTime - aTime;
      });

      setPosts(merged);
    } catch (error) {
      console.error("loadPosts error:", error);
      Alert.alert("Error", "Failed to load posts");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadProfile();
    loadPosts();
  }, [loadProfile, loadPosts]);

  const handleAddPost = (newPost: Post) => {
    setPosts((prev) => [newPost, ...prev]);
    setFilter("mine");
  };

  const handleRequest = (username: string) => {
    setRequests((r) => r.filter((req) => req.username !== username));
  };

  const toggleLike = async (postId: string) => {
    if (!userId) return;

    try {
      const updated = await likePost(postId, userId);
      setPosts((prev) =>
        prev.map((post) => (post._id === postId ? updated : post))
      );
    } catch (error) {
      console.error("toggleLike error:", error);
      Alert.alert("Error", "Failed to like post");
    }
  };

  const filteredPosts = useMemo(() => {
    if (filter === "mine") {
      return posts.filter((p) => String(p.userId) === String(userId));
    }
    return posts.filter((p) => String(p.userId) !== String(userId));
  }, [filter, posts, userId]);

  const myPostCount = useMemo(
    () => posts.filter((p) => String(p.userId) === String(userId)).length,
    [posts, userId]
  );

  if (loading) {
    return (
      <WebLayout>
        <View
          style={{
            flex: 1,
            minHeight: 400,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ActivityIndicator size="large" />
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
      >
        <View
          style={{
            flexDirection: "row",
            gap: 24,
            alignItems: "flex-start",
            maxWidth: 860,
            marginHorizontal: "auto" as any,
            width: "100%",
          }}
        >
          {/* ── LEFT: Feed ─────────────────────────────────────────── */}
          <View style={{ flex: 1, minWidth: 0, maxWidth: 520 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 20,
              }}
            >
              <View>
                <Text
                  style={{
                    fontSize: 26,
                    fontWeight: "800",
                    color: "#0f172a",
                    letterSpacing: -0.5,
                  }}
                >
                  Community
                </Text>
                <Text style={{ fontSize: 13, color: "#94a3b8", marginTop: 2 }}>
                  {posts.length} posts shared today
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => setModalVisible(true)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: "#0f172a",
                  paddingVertical: 10,
                  paddingHorizontal: 16,
                  borderRadius: 100,
                  gap: 6,
                  shadowColor: "#0f172a",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.2,
                  shadowRadius: 8,
                }}
              >
                <Text style={{ color: "#fff", fontSize: 17, lineHeight: 20 }}>
                  +
                </Text>
                <Text
                  style={{ color: "#fff", fontWeight: "600", fontSize: 13 }}
                >
                  New Post
                </Text>
              </TouchableOpacity>
            </View>

            <View
              style={{
                flexDirection: "row",
                backgroundColor: "#f1f5f9",
                borderRadius: 12,
                padding: 4,
                marginBottom: 20,
                alignSelf: "flex-start",
              }}
            >
              {(
                [
                  { label: "Friends' Posts", value: "friends" },
                  { label: "My Posts", value: "mine" },
                ] as { label: string; value: FeedFilter }[]
              ).map((tab) => (
                <TouchableOpacity
                  key={tab.value}
                  onPress={() => setFilter(tab.value)}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 10,
                    backgroundColor:
                      filter === tab.value ? "#fff" : "transparent",
                    shadowColor:
                      filter === tab.value ? "#94a3b8" : "transparent",
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "600",
                      color: filter === tab.value ? "#0f172a" : "#94a3b8",
                    }}
                  >
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {filteredPosts.length === 0 && (
              <View style={{ alignItems: "center", paddingVertical: 64 }}>
                <Text style={{ fontSize: 32, marginBottom: 10 }}>✦</Text>
                <Text style={{ fontSize: 14, color: "#94a3b8" }}>
                  {filter === "mine"
                    ? "You haven't posted anything yet"
                    : "You haven't posted anything yet"}
                </Text>

                {filter === "mine" ? (
                  <TouchableOpacity
                    onPress={() => setModalVisible(true)}
                    style={{
                      marginTop: 14,
                      paddingHorizontal: 20,
                      paddingVertical: 10,
                      borderRadius: 100,
                      backgroundColor: "#0f172a",
                    }}
                  >
                    <Text
                      style={{
                        color: "#fff",
                        fontWeight: "600",
                        fontSize: 13,
                      }}
                    >
                      Create your first post
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    onPress={() => router.push("/friend" as any)}
                    style={{
                      marginTop: 14,
                      paddingHorizontal: 20,
                      paddingVertical: 10,
                      borderRadius: 100,
                      backgroundColor: "#0f172a",
                    }}
                  >
                    <Text
                      style={{
                        color: "#fff",
                        fontWeight: "600",
                        fontSize: 13,
                      }}
                    >
                      Add Friend
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {filteredPosts.map((post) => {
              const avatar = getAvatarForPost(post, profile || undefined, user);
              const avatarKey = post._id;
              const showFallbackAvatar = !avatar || brokenAvatars[avatarKey];
              const username = post.user?.username || "unknown";
              const isMine = String(post.userId) === String(userId);
              const postImages = normalizeImages(post.images);

              return (
                <View
                  key={post._id}
                  style={{
                    backgroundColor: "#fff",
                    borderRadius: 20,
                    marginBottom: 18,
                    overflow: "hidden",
                    borderWidth: 1,
                    borderColor: "#f1f5f9",
                    shadowColor: "#94a3b8",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.07,
                    shadowRadius: 10,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      padding: 14,
                      gap: 10,
                    }}
                  >
                    {showFallbackAvatar ? (
                      <View
                        style={{
                          width: 38,
                          height: 38,
                          borderRadius: 19,
                          borderWidth: 2,
                          borderColor: "#f1f5f9",
                          backgroundColor: "#e2e8f0",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Text
                          style={{
                            color: "#475569",
                            fontSize: 13,
                            fontWeight: "700",
                          }}
                        >
                          {(username || "U").charAt(0).toUpperCase()}
                        </Text>
                      </View>
                    ) : (
                      <Image
                        source={{ uri: avatar }}
                        onError={() =>
                          setBrokenAvatars((prev) => ({
                            ...prev,
                            [avatarKey]: true,
                          }))
                        }
                        style={{
                          width: 38,
                          height: 38,
                          borderRadius: 19,
                          borderWidth: 2,
                          borderColor: "#f1f5f9",
                          backgroundColor: "#e2e8f0",
                        }}
                      />
                    )}

                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontWeight: "700",
                          fontSize: 14,
                          color: "#0f172a",
                        }}
                      >
                        @{username}
                      </Text>
                      <Text style={{ fontSize: 12, color: "#94a3b8" }}>
                        {formatTime(post.createdAt)}
                      </Text>
                    </View>

                    {isMine ? (
                      <TouchableOpacity
                        style={{ padding: 4 }}
                        onPress={() => {
                          setSelectedDeleteId(post._id);
                          setConfirmVisible(true);
                        }}
                      >
                        <Text
                          style={{
                            color: "#ef4444",
                            fontSize: 16,
                            fontWeight: "700",
                          }}
                        >
                          ✕
                        </Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity style={{ padding: 4 }}>
                        <Text
                          style={{
                            color: "#cbd5e1",
                            fontSize: 18,
                            letterSpacing: 1,
                          }}
                        >
                          ···
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {postImages.length > 0 && (
                    <ScrollView
                      horizontal
                      pagingEnabled
                      showsHorizontalScrollIndicator={false}
                    >
                      {postImages.map((img, index) => (
                        <Image
                          key={`${post._id}-${index}`}
                          source={{ uri: getImageUri(img) }}
                          style={{
                            width: postImageWidth,
                            height: 220,
                            backgroundColor: "#f8fafc",
                          }}
                          resizeMode="cover"
                        />
                      ))}
                    </ScrollView>
                  )}

                  <View style={{ padding: 14 }}>
                    {!!post.text && (
                      <Text
                        style={{
                          fontSize: 14,
                          color: "#334155",
                          marginBottom: 14,
                          lineHeight: 21,
                        }}
                      >
                        {post.text}
                      </Text>
                    )}

                    <View
                      style={{
                        paddingTop: 12,
                        borderTopWidth: 1,
                        borderTopColor: "#f8fafc",
                        flexDirection: "row",
                        alignItems: "center",
                      }}
                    >
                      <TouchableOpacity
                        onPress={() => toggleLike(post._id)}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <Text style={{ fontSize: 20 }}>
                          {post.likes?.includes(userId) ? "❤️" : "🤍"}
                        </Text>
                        <Text
                          style={{
                            fontSize: 13,
                            fontWeight: "600",
                            color: post.likes?.includes(userId)
                              ? "#e11d48"
                              : "#94a3b8",
                          }}
                        >
                          {post.likes?.length || 0}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>

          {/* ── RIGHT: Sidebar ─────────────────────────────────────── */}
          <View
            style={{
              width: 248,
              flexShrink: 0,
              position: "sticky",
              top: 0,
              alignSelf: "flex-start",
            } as any}
          >
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => router.push("/profile" as any)}
              style={sideCard}
            >
              <Text
                style={{
                  fontWeight: "700",
                  fontSize: 13,
                  color: "#0f172a",
                  marginBottom: 14,
                }}
              >
                My Profile
              </Text>
              <View style={{ alignItems: "center" }}>
                <View style={{ position: "relative", marginBottom: 10 }}>
                  {myAvatar && !myProfileBroken ? (
                    <Image
                      source={{ uri: myAvatar }}
                      onError={() => setMyProfileBroken(true)}
                      style={{
                        width: 60,
                        height: 60,
                        borderRadius: 30,
                        borderWidth: 3,
                        borderColor: "#f1f5f9",
                        backgroundColor: "#e2e8f0",
                      }}
                    />
                  ) : (
                    <View
                      style={{
                        width: 60,
                        height: 60,
                        borderRadius: 30,
                        borderWidth: 3,
                        borderColor: "#f1f5f9",
                        backgroundColor: "#e2e8f0",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Text
                        style={{
                          color: "#475569",
                          fontSize: 18,
                          fontWeight: "700",
                        }}
                      >
                        {(myDisplayName || "U").charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}

                  <View
                    style={{
                      position: "absolute",
                      bottom: 1,
                      right: 1,
                      width: 14,
                      height: 14,
                      borderRadius: 7,
                      backgroundColor: "#22c55e",
                      borderWidth: 2,
                      borderColor: "#fff",
                    }}
                  />
                </View>

                <Text
                  style={{
                    fontWeight: "700",
                    fontSize: 15,
                    color: "#0f172a",
                  }}
                >
                  {myDisplayName}
                </Text>

                <View
                  style={{
                    flexDirection: "row",
                    marginTop: 14,
                    paddingTop: 14,
                    borderTopWidth: 1,
                    borderTopColor: "#f8fafc",
                    width: "100%",
                  }}
                >
                  {[
                    { label: "Posts", value: String(myPostCount) },
                    { label: "Friends", value: String(friends.length) },
                  ].map((s, i) => (
                    <View
                      key={s.label}
                      style={{
                        flex: 1,
                        alignItems: "center",
                        borderRightWidth: i === 0 ? 1 : 0,
                        borderRightColor: "#f8fafc",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 17,
                          fontWeight: "800",
                          color: "#0f172a",
                        }}
                      >
                        {s.value}
                      </Text>
                      <Text
                        style={{
                          fontSize: 11,
                          color: "#94a3b8",
                          marginTop: 2,
                        }}
                      >
                        {s.label}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            </TouchableOpacity>

            <View style={sideCard}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 14,
                }}
              >
                <Text
                  style={{
                    fontWeight: "700",
                    fontSize: 13,
                    color: "#0f172a",
                  }}
                >
                  Friends
                </Text>
                <TouchableOpacity onPress={() => router.push("/friends" as any)}>
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "600",
                      color: "#94a3b8",
                    }}
                  >
                    See all {friends.length}
                  </Text>
                </TouchableOpacity>
              </View>

              {friends.slice(0, SIDEBAR_LIMIT).map((f, i) => (
                <TouchableOpacity
                  key={f.username}
                  activeOpacity={0.7}
                  onPress={() => router.push(`/profile/${f.username}` as any)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                    paddingVertical: 9,
                    borderBottomWidth:
                      i < Math.min(friends.length, SIDEBAR_LIMIT) - 1 ? 1 : 0,
                    borderBottomColor: "#f8fafc",
                  }}
                >
                  <View style={{ position: "relative" }}>
                    <Image
                      source={{ uri: f.avatar }}
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 17,
                        borderWidth: 1.5,
                        borderColor: f.online ? "#22c55e" : "#f1f5f9",
                      }}
                    />
                    {f.online && (
                      <View
                        style={{
                          position: "absolute",
                          bottom: 0,
                          right: 0,
                          width: 10,
                          height: 10,
                          borderRadius: 5,
                          backgroundColor: "#22c55e",
                          borderWidth: 1.5,
                          borderColor: "#fff",
                        }}
                      />
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: "600",
                        color: "#0f172a",
                      }}
                    >
                      @{f.username}
                    </Text>
                    <Text style={{ fontSize: 11, color: "#94a3b8" }}>
                      {f.online ? "Online" : `${f.mutuals} mutual`}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}

              {friends.length > SIDEBAR_LIMIT && (
                <TouchableOpacity
                  onPress={() => router.push("/friends" as any)}
                  style={{ marginTop: 10, alignItems: "center" }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "600",
                      color: "#94a3b8",
                    }}
                  >
                    +{friends.length - SIDEBAR_LIMIT} more friends
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {requests.length > 0 && (
              <View style={sideCard}>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 14,
                  }}
                >
                  <Text
                    style={{
                      fontWeight: "700",
                      fontSize: 13,
                      color: "#0f172a",
                    }}
                  >
                    Friend Requests
                  </Text>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <View
                      style={{
                        backgroundColor: "#fce7f3",
                        paddingHorizontal: 8,
                        paddingVertical: 2,
                        borderRadius: 10,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 11,
                          fontWeight: "700",
                          color: "#be185d",
                        }}
                      >
                        {requests.length}
                      </Text>
                    </View>
                    {requests.length > SIDEBAR_LIMIT && (
                      <TouchableOpacity
                        onPress={() =>
                          router.push("/friends?tab=requests" as any)
                        }
                      >
                        <Text
                          style={{
                            fontSize: 11,
                            fontWeight: "600",
                            color: "#94a3b8",
                          }}
                        >
                          See all
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                {requests.slice(0, SIDEBAR_LIMIT).map((req, i) => (
                  <View
                    key={req.username}
                    style={{
                      paddingVertical: 10,
                      borderBottomWidth:
                        i < Math.min(requests.length, SIDEBAR_LIMIT) - 1 ? 1 : 0,
                      borderBottomColor: "#f8fafc",
                    }}
                  >
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => router.push(`/profile/${req.username}` as any)}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 10,
                        marginBottom: 10,
                      }}
                    >
                      <Image
                        source={{ uri: req.avatar }}
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 17,
                          borderWidth: 1.5,
                          borderColor: "#f1f5f9",
                        }}
                      />
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: "600",
                          color: "#0f172a",
                          flex: 1,
                        }}
                      >
                        @{req.username}
                      </Text>
                    </TouchableOpacity>
                    <View style={{ flexDirection: "row", gap: 8 }}>
                      <TouchableOpacity
                        onPress={() => handleRequest(req.username)}
                        style={{
                          flex: 1,
                          paddingVertical: 7,
                          borderRadius: 10,
                          backgroundColor: "#0f172a",
                          alignItems: "center",
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 12,
                            fontWeight: "600",
                            color: "#fff",
                          }}
                        >
                          Accept
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleRequest(req.username)}
                        style={{
                          flex: 1,
                          paddingVertical: 7,
                          borderRadius: 10,
                          backgroundColor: "#f1f5f9",
                          alignItems: "center",
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 12,
                            fontWeight: "600",
                            color: "#64748b",
                          }}
                        >
                          Decline
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      <CreatePost
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSubmit={handleAddPost}
      />

      <ConfirmDialog
        visible={confirmVisible}
        title="Delete Post"
        message="Are you sure you want to delete this post?"
        confirmText="Delete"
        cancelText="Cancel"
        onCancel={() => {
          setConfirmVisible(false);
          setSelectedDeleteId(null);
        }}
        onConfirm={async () => {
          if (!selectedDeleteId) return;

          try {
            await deletePost(selectedDeleteId);
            setPosts((prev) => prev.filter((p) => p._id !== selectedDeleteId));
          } catch (error) {
            Alert.alert("Error", "Failed to delete post");
          } finally {
            setConfirmVisible(false);
            setSelectedDeleteId(null);
          }
        }}
      />
    </WebLayout>
  );
}