import { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  Pressable,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "@/contexts/AuthContext";
import { createPost } from "@/services/postService";
import { getProfile } from "@/services/profileService";
import type { Post } from "@/types/types";

interface CreatePostModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (post: Post) => void;
}

type LoadedProfile = {
  _id?: string;
  username?: string;
  email?: string;
  bio?: string;
  profilePic?: string;
  backgroundColor?: string;
  friends?: string[];
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

export default function CreatePostModal({
  visible,
  onClose,
  onSubmit,
}: CreatePostModalProps) {
  const { user } = useAuth();

  const [caption, setCaption] = useState("");
  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const [profile, setProfile] = useState<LoadedProfile | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      if (!visible || !user?._id) return;

      try {
        const latestProfile = await getProfile(user._id);
        setProfile(latestProfile);
        setAvatarError(false);
      } catch (error) {
        console.error("loadProfile error:", error);
      }
    };

    loadProfile();
  }, [visible, user?._id]);

  const myAvatar = useMemo(() => {
    return (
      getImageUri(profile?.profilePic || "") ||
      getImageUri((user as any)?.profilePic || "")
    );
  }, [profile?.profilePic, user]);

  const displayUsername = profile?.username || user?.username || "you";

  const pickImages = async () => {
    const remain = 4 - images.length;

    if (remain <= 0) {
      Alert.alert("You can upload up to 4 images only");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      selectionLimit: remain,
      quality: 0.8,
    });

    if (result.canceled) return;

    const selected = result.assets || [];
    setImages((prev) => [...prev, ...selected].slice(0, 4));
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_: any, i: number) => i !== index));
  };

  const handleSubmit = async () => {
    if (!user?._id) return;
    if (!caption.trim() && images.length === 0) return;

    try {
      setLoading(true);
      const created = await createPost(user._id, caption.trim(), images);
      onSubmit(created);
      setCaption("");
      setImages([]);
      onClose();
    } catch (error: any) {
      Alert.alert("Create post failed", error?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    setCaption("");
    setImages([]);
    setAvatarError(false);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <Pressable
        onPress={handleClose}
        style={{
          flex: 1,
          backgroundColor: "rgba(15,23,42,0.55)",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
        }}
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{
            backgroundColor: "#fff",
            borderRadius: 24,
            padding: 28,
            width: "100%",
            maxWidth: 480,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 20 },
            shadowOpacity: 0.18,
            shadowRadius: 40,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 24,
            }}
          >
            <View>
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: "800",
                  color: "#0f172a",
                  letterSpacing: -0.5,
                }}
              >
                Create Post
              </Text>
              <Text style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>
                Share something with your friends
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleClose}
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: "#f1f5f9",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ fontSize: 16, color: "#64748b", lineHeight: 20 }}>×</Text>
            </TouchableOpacity>
          </View>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              marginBottom: 16,
            }}
          >
            <View
              style={{
                width: 38,
                height: 38,
                borderRadius: 19,
                overflow: "hidden",
                borderWidth: 2,
                borderColor: "#f1f5f9",
                backgroundColor: "#f8fafc",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {myAvatar && !avatarError ? (
                <Image
                  source={{ uri: myAvatar }}
                  onError={() => setAvatarError(true)}
                  style={{ width: 38, height: 38 }}
                  resizeMode="cover"
                />
              ) : (
                <Text style={{ color: "#475569", fontSize: 13, fontWeight: "700" }}>
                  {displayUsername.charAt(0).toUpperCase()}
                </Text>
              )}
            </View>

            <View>
              <Text style={{ fontSize: 14, fontWeight: "700", color: "#0f172a" }}>
                @{displayUsername}
              </Text>
              <Text style={{ fontSize: 11, color: "#94a3b8" }}>Posting to Friends</Text>
            </View>
          </View>

          <TextInput
            value={caption}
            onChangeText={setCaption}
            placeholder="What's on your mind?"
            placeholderTextColor="#cbd5e1"
            multiline
            style={{
              borderWidth: 1,
              borderColor: "#f1f5f9",
              borderRadius: 14,
              padding: 14,
              fontSize: 14,
              color: "#0f172a",
              minHeight: 100,
              textAlignVertical: "top",
              backgroundColor: "#fafafa",
              marginBottom: 8,
              lineHeight: 22,
              outline: "none",
            } as any}
          />
          <Text
            style={{
              fontSize: 11,
              color: "#cbd5e1",
              textAlign: "right",
              marginBottom: 20,
            }}
          >
            {caption.length} / 300
          </Text>

          <TouchableOpacity
            onPress={pickImages}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              paddingVertical: 11,
              paddingHorizontal: 14,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: "#f1f5f9",
              borderStyle: "dashed",
              backgroundColor: "#fafafa",
              marginBottom: 14,
            }}
          >
            <Text style={{ fontSize: 16 }}>🖼</Text>
            <Text style={{ fontSize: 13, color: "#94a3b8" }}>
              Add a photo {images.length > 0 ? `(${images.length}/4)` : ""}
            </Text>
          </TouchableOpacity>

          {images.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
              {images.map((img: any, index: number) => (
                <View key={`${img.uri}-${index}`} style={{ marginRight: 10, position: "relative" }}>
                  <Image
                    source={{ uri: img.uri }}
                    style={{
                      width: 88,
                      height: 88,
                      borderRadius: 14,
                      backgroundColor: "#f1f5f9",
                    }}
                  />
                  <TouchableOpacity
                    onPress={() => removeImage(index)}
                    style={{
                      position: "absolute",
                      top: 6,
                      right: 6,
                      width: 22,
                      height: 22,
                      borderRadius: 11,
                      backgroundColor: "rgba(15,23,42,0.8)",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text style={{ color: "#fff", fontSize: 12 }}>×</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          )}

          <View style={{ flexDirection: "row", gap: 10 }}>
            <TouchableOpacity
              onPress={handleClose}
              style={{
                flex: 1,
                paddingVertical: 13,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: "#e2e8f0",
                alignItems: "center",
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: "600", color: "#64748b" }}>
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSubmit}
              disabled={loading || (!caption.trim() && images.length === 0)}
              style={{
                flex: 2,
                paddingVertical: 13,
                borderRadius: 14,
                alignItems: "center",
                backgroundColor:
                  loading || (!caption.trim() && images.length === 0)
                    ? "#e2e8f0"
                    : "#0f172a",
              }}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "700",
                    color:
                      !caption.trim() && images.length === 0 ? "#94a3b8" : "#fff",
                  }}
                >
                  Publish Post
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}