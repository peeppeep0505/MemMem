import { useState } from "react";
import { View, Text, Image, ScrollView, TouchableOpacity } from "react-native";
import WebLayout from "../common/WebLayout";
import CreatePost from "./CreatePost";


// ─── Data ────────────────────────────────────────────────────────────────────

type FeedFilter = "friends" | "mine";

const MY_USERNAME = "you";

const INITIAL_POSTS = [
  {
    id: 1,
    username: "sarah_creates",
    avatar: "https://i.pravatar.cc/150?img=47",
    image: "https://picsum.photos/seed/morning/600/400",
    caption: "Golden hour never disappoints 🌅",
    likes: 142,
    time: "2h ago",
  },
  {
    id: 2,
    username: "alex.travels",
    avatar: "https://i.pravatar.cc/150?img=12",
    image: "https://picsum.photos/seed/city/600/400",
    caption: "Lost in the city streets 🏙️",
    likes: 89,
    time: "5h ago",
  },
  {
    id: 3,
    username: "mia.journal",
    avatar: "https://i.pravatar.cc/150?img=32",
    image: "https://picsum.photos/seed/cafe/600/400",
    caption: "Coffee & quiet mornings ☕",
    likes: 204,
    time: "1d ago",
  },
];

const FRIENDS = [
  { username: "sarah_creates", avatar: "https://i.pravatar.cc/150?img=47", mutuals: 4 },
  { username: "alex.travels",  avatar: "https://i.pravatar.cc/150?img=12", mutuals: 2 },
  { username: "mia.journal",   avatar: "https://i.pravatar.cc/150?img=32", mutuals: 6 },
];

const FRIEND_REQUESTS = [
  { username: "luna.frames", avatar: "https://i.pravatar.cc/150?img=5" },
  { username: "kai.wanders", avatar: "https://i.pravatar.cc/150?img=11" },
];

// ─── Styles ───────────────────────────────────────────────────────────────────

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

// ─── Component ────────────────────────────────────────────────────────────────

export default function CommunityPage() {
  const [posts, setPosts] = useState(INITIAL_POSTS);
  const [likedPosts, setLikedPosts] = useState<Set<number>>(new Set());
  const [modalVisible, setModalVisible] = useState(false);
  const [filter, setFilter] = useState<FeedFilter>("friends");
  const [requests, setRequests] = useState(FRIEND_REQUESTS);

  const toggleLike = (id: number) => {
    setLikedPosts((prev) => {
      const next = new Set(prev);
      const wasLiked = next.has(id);
      wasLiked ? next.delete(id) : next.add(id);
      setPosts((p) =>
        p.map((post) =>
          post.id === id
            ? { ...post, likes: post.likes + (wasLiked ? -1 : 1) }
            : post
        )
      );
      return next;
    });
  };

  const handleAddPost = (caption: string) => {
    const newPost = {
      id: Date.now(),
      username: MY_USERNAME,
      avatar: "https://i.pravatar.cc/150?img=68",
      image: `https://picsum.photos/seed/${Date.now()}/600/400`,
      caption,
      likes: 0,
      time: "Just now",
    };
    setPosts([newPost, ...posts]);
  };

  const handleRequest = (username: string) => {
    setRequests((r) => r.filter((req) => req.username !== username));
  };

  const filteredPosts =
    filter === "mine"
      ? posts.filter((p) => p.username === MY_USERNAME)
      : posts.filter((p) => p.username !== MY_USERNAME);

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

            {/* Header */}
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <View>
                <Text style={{ fontSize: 26, fontWeight: "800", color: "#0f172a", letterSpacing: -0.5 }}>
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
                <Text style={{ color: "#fff", fontSize: 17, lineHeight: 20 }}>+</Text>
                <Text style={{ color: "#fff", fontWeight: "600", fontSize: 13 }}>New Post</Text>
              </TouchableOpacity>
            </View>

            {/* Filter Tabs */}
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
                    backgroundColor: filter === tab.value ? "#fff" : "transparent",
                    shadowColor: filter === tab.value ? "#94a3b8" : "transparent",
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

            {/* Empty state */}
            {filteredPosts.length === 0 && (
              <View style={{ alignItems: "center", paddingVertical: 64 }}>
                <Text style={{ fontSize: 32, marginBottom: 10 }}>✦</Text>
                <Text style={{ fontSize: 14, color: "#94a3b8" }}>
                  {filter === "mine"
                    ? "You haven't posted anything yet"
                    : "No posts from friends yet"}
                </Text>
                {filter === "mine" && (
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
                    <Text style={{ color: "#fff", fontWeight: "600", fontSize: 13 }}>
                      Create your first post
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Posts */}
            {filteredPosts.map((post) => (
              <View
                key={post.id}
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
                {/* Post header */}
                <View style={{ flexDirection: "row", alignItems: "center", padding: 14, gap: 10 }}>
                  <Image
                    source={{ uri: post.avatar }}
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 19,
                      borderWidth: 2,
                      borderColor: "#f1f5f9",
                    }}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: "700", fontSize: 14, color: "#0f172a" }}>
                      @{post.username}
                    </Text>
                    <Text style={{ fontSize: 12, color: "#94a3b8" }}>{post.time}</Text>
                  </View>
                  <TouchableOpacity style={{ padding: 4 }}>
                    <Text style={{ color: "#cbd5e1", fontSize: 18, letterSpacing: 1 }}>···</Text>
                  </TouchableOpacity>
                </View>

                {/* Post image */}
                <Image
                  source={{ uri: post.image }}
                  style={{ width: "100%", height: 220 }}
                  resizeMode="cover"
                />

                {/* Post footer */}
                <View style={{ padding: 14 }}>
                  <Text style={{ fontSize: 14, color: "#334155", marginBottom: 14, lineHeight: 21 }}>
                    {post.caption}
                  </Text>

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
                      onPress={() => toggleLike(post.id)}
                      style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
                    >
                      <Text style={{ fontSize: 20 }}>
                        {likedPosts.has(post.id) ? "❤️" : "🤍"}
                      </Text>
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: "600",
                          color: likedPosts.has(post.id) ? "#e11d48" : "#94a3b8",
                        }}
                      >
                        {post.likes}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </View>

          {/* ── RIGHT: Sidebar ─────────────────────────────────────── */}
          <View style={{ width: 248, flexShrink: 0 }}>

            {/* My Profile */}
            <View style={sideCard}>
              <Text style={{ fontWeight: "700", fontSize: 13, color: "#0f172a", marginBottom: 14 }}>
                My Profile
              </Text>
              <View style={{ alignItems: "center" }}>
                <View style={{ position: "relative", marginBottom: 10 }}>
                  <Image
                    source={{ uri: "https://i.pravatar.cc/150?img=68" }}
                    style={{
                      width: 60,
                      height: 60,
                      borderRadius: 30,
                      borderWidth: 3,
                      borderColor: "#f1f5f9",
                    }}
                  />
                  {/* Online dot */}
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
                <Text style={{ fontWeight: "700", fontSize: 15, color: "#0f172a" }}>John Doe</Text>
                <Text style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>@you</Text>

                <View
                  style={{
                    flexDirection: "row",
                    gap: 0,
                    marginTop: 14,
                    paddingTop: 14,
                    borderTopWidth: 1,
                    borderTopColor: "#f8fafc",
                    width: "100%",
                  }}
                >
                  {[
                    {
                      label: "Posts",
                      value: String(posts.filter((p) => p.username === MY_USERNAME).length),
                    },
                    { label: "Friends", value: String(FRIENDS.length) },
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
                      <Text style={{ fontSize: 17, fontWeight: "800", color: "#0f172a" }}>
                        {s.value}
                      </Text>
                      <Text style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{s.label}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>

            {/* Friends */}
            <View style={sideCard}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <Text style={{ fontWeight: "700", fontSize: 13, color: "#0f172a" }}>Friends</Text>
                <Text style={{ fontSize: 11, color: "#94a3b8" }}>{FRIENDS.length} total</Text>
              </View>

              {FRIENDS.map((f, i) => (
                <View
                  key={f.username}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                    paddingVertical: 9,
                    borderBottomWidth: i < FRIENDS.length - 1 ? 1 : 0,
                    borderBottomColor: "#f8fafc",
                  }}
                >
                  <Image
                    source={{ uri: f.avatar }}
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 17,
                      borderWidth: 1.5,
                      borderColor: "#f1f5f9",
                    }}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: "600", color: "#0f172a" }}>
                      @{f.username}
                    </Text>
                    <Text style={{ fontSize: 11, color: "#94a3b8" }}>{f.mutuals} mutual</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Friend Requests */}
            {requests.length > 0 && (
              <View style={sideCard}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <Text style={{ fontWeight: "700", fontSize: 13, color: "#0f172a" }}>
                    Friend Requests
                  </Text>
                  <View
                    style={{
                      backgroundColor: "#fce7f3",
                      paddingHorizontal: 8,
                      paddingVertical: 2,
                      borderRadius: 10,
                    }}
                  >
                    <Text style={{ fontSize: 11, fontWeight: "700", color: "#be185d" }}>
                      {requests.length}
                    </Text>
                  </View>
                </View>

                {requests.map((req, i) => (
                  <View
                    key={req.username}
                    style={{
                      paddingVertical: 10,
                      borderBottomWidth: i < requests.length - 1 ? 1 : 0,
                      borderBottomColor: "#f8fafc",
                    }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 }}>
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
                      <Text style={{ fontSize: 13, fontWeight: "600", color: "#0f172a", flex: 1 }}>
                        @{req.username}
                      </Text>
                    </View>
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
                        <Text style={{ fontSize: 12, fontWeight: "600", color: "#fff" }}>Accept</Text>
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
                        <Text style={{ fontSize: 12, fontWeight: "600", color: "#64748b" }}>Decline</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}

          </View>
        </View>
      </ScrollView>

      {/* Create Post Modal — centered popup */}
      <CreatePost
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSubmit={handleAddPost}
      />
    </WebLayout>
  );
}