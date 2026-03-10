import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useEffect, useMemo, useState, useCallback } from "react";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import WebLayout from "../common/WebLayout";
import { useAuth } from "@/contexts/AuthContext";
import { getProfile, updateProfile } from "@/services/profileService";
import ColorPickerPanel from "@/components/common/ColorPickerPanel";

type ProfileData = {
  _id?: string;
  username?: string;
  name?: string;
  email?: string;
  bio?: string;
  profilePic?: string;
  backgroundColor?: string;
  friends?: string[];
  friendCount?: number;
  postCount?: number;
};

const DEFAULT_BG = "#9ca3af";

export default function MyProfileScreen() {
  const { user } = useAuth() as any;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [profilePic, setProfilePic] = useState("");
  const [backgroundColor, setBackgroundColor] = useState(DEFAULT_BG);

  const [draftName, setDraftName] = useState("");
  const [draftBio, setDraftBio] = useState("");
  const [draftProfilePic, setDraftProfilePic] = useState("");
  const [draftBackgroundColor, setDraftBackgroundColor] = useState(DEFAULT_BG);
  const [imageBase64, setImageBase64] = useState("");

  const userId = user?._id || user?.id;
  const displayEmail = profile?.email || user?.email || "No email";

  const currentCoverColor = useMemo(
    () =>
      isEditing
        ? draftBackgroundColor || DEFAULT_BG
        : backgroundColor || DEFAULT_BG,
    [isEditing, draftBackgroundColor, backgroundColor]
  );

  const currentAvatarUri = useMemo(
    () => (isEditing ? draftProfilePic : profilePic),
    [isEditing, draftProfilePic, profilePic]
  );

  const stats = [
    {
      label: "Friend",
      value: String(
        profile?.friendCount ??
          profile?.friends?.length ??
          user?.friendCount ??
          user?.friends?.length ??
          0
      ),
    },
    {
      label: "Posts",
      value: String(profile?.postCount ?? user?.postCount ?? 0),
    },
  ];

  const applyProfileToState = useCallback(
    (data: ProfileData) => {
      const nextName =
        data?.username || data?.name || user?.username || user?.name || "";
      const nextBio = data?.bio || "";
      const nextProfilePic = data?.profilePic || "";
      const nextBg = data?.backgroundColor || DEFAULT_BG;

      setProfile(data);
      setName(nextName);
      setBio(nextBio);
      setProfilePic(nextProfilePic);
      setBackgroundColor(nextBg);
      setDraftName(nextName);
      setDraftBio(nextBio);
      setDraftProfilePic(nextProfilePic);
      setDraftBackgroundColor(nextBg);
    },
    [user]
  );

  const fetchProfile = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await getProfile(userId);
      applyProfileToState(data);
    } catch (error: any) {
      Alert.alert("Error", error?.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  }, [userId, applyProfileToState]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleEdit = () => {
    setDraftName(name);
    setDraftBio(bio);
    setDraftProfilePic(profilePic || "");
    setDraftBackgroundColor(backgroundColor || DEFAULT_BG);
    setImageBase64("");
    setIsEditing(true);
  };

  const handleCancel = () => {
    setDraftName(name);
    setDraftBio(bio);
    setDraftProfilePic(profilePic || "");
    setDraftBackgroundColor(backgroundColor || DEFAULT_BG);
    setImageBase64("");
    setShowColorPicker(false);
    setIsEditing(false);
  };

  const handlePickImage = async () => {
    if (!isEditing) return;
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          "Permission denied",
          "Please allow photo library access first."
        );
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
        allowsEditing: true,
        aspect: [1, 1],
        base64: true,
      });
      if (result.canceled) return;
      const asset = result.assets?.[0];
      if (!asset) return;
      const mimeType = asset.mimeType || "image/jpeg";
      const nextBase64 = asset.base64
        ? `data:${mimeType};base64,${asset.base64}`
        : "";
      setImageBase64(nextBase64);
      setDraftProfilePic(nextBase64 || asset.uri || "");
    } catch (error: any) {
      Alert.alert("Error", error?.message || "Failed to pick image");
    }
  };

  const handleSave = async () => {
    if (!userId) {
      Alert.alert("Error", "User not found");
      return;
    }
    try {
      setSaving(true);
      const updated = await updateProfile(userId, {
        username: draftName.trim(),
        bio: draftBio.trim(),
        backgroundColor: draftBackgroundColor || DEFAULT_BG,
        imageBase64: imageBase64 || undefined,
      });
      applyProfileToState(updated);
      setImageBase64("");
      setShowColorPicker(false);
      setIsEditing(false);
      Alert.alert("Success", "Profile updated successfully");
    } catch (error: any) {
      Alert.alert("Error", error?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <WebLayout>
      <ScrollView className="flex-1 px-4 py-6">
        <View className="max-w-2xl mx-auto w-full">
          <View
            className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-visible mb-4"
            style={{ position: "relative" }}
          >
            <TouchableOpacity
              activeOpacity={isEditing ? 0.85 : 1}
              onPress={() => isEditing && setShowColorPicker((v) => !v)}
            >
              <View
                className="h-24 w-full items-end justify-end rounded-t-2xl overflow-hidden"
                style={{ backgroundColor: currentCoverColor }}
              >
                <View
                  className="absolute inset-0 opacity-20"
                  style={
                    {
                      backgroundImage:
                        "radial-gradient(circle at 20% 50%, rgba(255,255,255,0.35) 0%, transparent 60%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.20) 0%, transparent 50%)",
                    } as any
                  }
                />
                {isEditing && (
                  <View className="m-3 bg-black/15 rounded-lg px-2 py-1 flex-row items-center gap-1">
                    <Ionicons
                      name="color-palette-outline"
                      size={13}
                      color="white"
                    />
                    <Text className="text-white text-xs font-medium ml-1">
                      Change color
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>

            {showColorPicker && (
              <ColorPickerPanel
                value={draftBackgroundColor}
                onChange={setDraftBackgroundColor}
                onClose={() => setShowColorPicker(false)}
              />
            )}

            <View className="px-8 pb-8">
              <View style={{ marginTop: -40, marginBottom: 4 }}>
                <TouchableOpacity
                  onPress={handlePickImage}
                  activeOpacity={isEditing ? 0.7 : 1}
                  className="rounded-full border-4 border-white shadow-md overflow-hidden items-center justify-center bg-gray-100"
                  style={{ width: 80, height: 80 }}
                >
                  {currentAvatarUri ? (
                    <Image
                      source={{ uri: currentAvatarUri }}
                      style={{ width: 80, height: 80 }}
                    />
                  ) : (
                    <Ionicons name="person" size={38} color="#9ca3af" />
                  )}
                  {isEditing && (
                    <View
                      className="absolute inset-0 items-center justify-center"
                      style={{ backgroundColor: "rgba(0,0,0,0.35)" }}
                    >
                      <Ionicons name="camera" size={22} color="white" />
                    </View>
                  )}
                </TouchableOpacity>
              </View>

              {loading ? (
                <View className="py-10 items-center">
                  <ActivityIndicator />
                  <Text className="text-gray-400 text-sm mt-3">
                    Loading profile...
                  </Text>
                </View>
              ) : (
                <>
                  <View className="mt-2 mb-6">
                    {isEditing ? (
                      <TextInput
                        value={draftName}
                        onChangeText={setDraftName}
                        placeholder="Your name"
                        className="text-2xl font-bold text-gray-900 border-b border-pink-200 pb-1 mb-1"
                        style={{ outline: "none" } as any}
                      />
                    ) : (
                      <Text className="text-2xl font-bold text-gray-900">
                        {name || "No name"}
                      </Text>
                    )}
                    <Text className="text-gray-400 text-sm mt-0.5">
                      {displayEmail}
                    </Text>
                  </View>

                  <View className="flex-row bg-gray-50 rounded-2xl p-4 mb-6 gap-2">
                    {stats.map((s, i) => (
                      <View
                        key={s.label}
                        className={`flex-1 items-center ${
                          i < stats.length - 1 ? "border-r border-gray-200" : ""
                        }`}
                      >
                        <Text className="text-xl font-bold text-gray-900">
                          {s.value}
                        </Text>
                        <Text className="text-gray-400 text-xs mt-0.5">
                          {s.label}
                        </Text>
                      </View>
                    ))}
                  </View>

                  <View className="mb-5">
                    <Text className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
                      About
                    </Text>
                    {isEditing ? (
                      <TextInput
                        value={draftBio}
                        onChangeText={setDraftBio}
                        multiline
                        numberOfLines={4}
                        placeholder="Write something about yourself..."
                        placeholderTextColor="#9ca3af"
                        className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-gray-700 text-sm leading-relaxed"
                        style={
                          {
                            minHeight: 96,
                            outline: "none",
                            textAlignVertical: "top",
                          } as any
                        }
                      />
                    ) : (
                      <Text className="text-gray-600 text-sm leading-relaxed">
                        {bio || "No bio yet"}
                      </Text>
                    )}
                  </View>
                </>
              )}
            </View>
          </View>

          <View className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-4">
            <View className="px-6 py-4 border-b border-gray-50">
              <Text className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
                Account
              </Text>
            </View>
            {[
              { icon: "🔒", label: "Privacy & Security", hint: "Password, 2FA" },
              { icon: "🎨", label: "Appearance", hint: "Theme" },
            ].map((item, i, arr) => (
              <TouchableOpacity
                key={item.label}
                className={`flex-row items-center px-6 py-4 ${
                  i < arr.length - 1 ? "border-b border-gray-50" : ""
                }`}
              >
                <Text className="text-lg mr-4">{item.icon}</Text>
                <View className="flex-1">
                  <Text className="text-gray-800 font-medium text-sm">
                    {item.label}
                  </Text>
                  <Text className="text-gray-400 text-xs mt-0.5">
                    {item.hint}
                  </Text>
                </View>
                <Text className="text-gray-300 text-lg">›</Text>
              </TouchableOpacity>
            ))}
          </View>

          {isEditing ? (
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={handleCancel}
                disabled={saving}
                className="flex-1 py-4 rounded-2xl border border-gray-200 bg-white items-center"
              >
                <Text className="text-gray-500 text-sm font-semibold">
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSave}
                disabled={saving}
                className="flex-1 py-4 rounded-2xl bg-pink-500 items-center"
              >
                {saving ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text className="text-white text-sm font-semibold">
                    Save Changes
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              onPress={handleEdit}
              className="py-4 rounded-2xl border border-gray-200 bg-white items-center"
            >
              <Text className="text-gray-600 text-sm font-semibold">
                ✎ Edit Profile
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </WebLayout>
  );
}