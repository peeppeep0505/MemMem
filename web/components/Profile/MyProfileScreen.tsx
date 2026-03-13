import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useEffect, useMemo, useState, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import WebLayout from "../common/WebLayout";
import { useAuth } from "@/contexts/AuthContext";
import {
  getProfile,
  updateProfile,
  getProfileByUsername,
  type ProfileData,
} from "@/services/profileService";
import ColorPickerPanel from "@/components/common/ColorPickerPanel";
import DynamicProfileForm from "./DynamicProfileForm";
import { PROFILE_FORM_CONFIG } from "./profileFormConfig";
import {
  applyDefaultsFromSchema,
  buildPayloadFromSchema,
  getValueByPath,
  normalizeProfileSchema,
  setValueByPath,
  validateBySchema,
  type ProfileFieldSchema,
} from "./profileFormSchema";

type MyProfileScreenProps = {
  readOnly?: boolean;
  username?: string;
};

const DEFAULT_BG = "#9ca3af";
const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || "http://localhost:5000/api";
const UPLOAD_BASE = API_BASE_URL.replace(/\/api$/, "");

function getImageUri(path?: string) {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  if (path.startsWith("data:")) return path;
  return `${UPLOAD_BASE}/uploads/${path}`;
}

function randomHexColor() {
  const value = Math.floor(Math.random() * 0xffffff);
  return `#${value.toString(16).padStart(6, "0")}`;
}

function buildSeedData(profile: ProfileData | null, user: any) {
  return {
    ...(profile?.dynamicProfileData || {}),
    username: profile?.username || user?.username || "",
    bio: profile?.bio || "",
    role: profile?.role || user?.role || "user",
    adminCode: profile?.adminCode || "",
    preferences: {
      showSocialLinks:
        profile?.preferences?.showSocialLinks ??
        profile?.dynamicProfileData?.preferences?.showSocialLinks ??
        false,
    },
    socialLinks: {
      facebook:
        profile?.socialLinks?.facebook ||
        profile?.dynamicProfileData?.socialLinks?.facebook ||
        "",
      instagram:
        profile?.socialLinks?.instagram ||
        profile?.dynamicProfileData?.socialLinks?.instagram ||
        "",
      github:
        profile?.socialLinks?.github ||
        profile?.dynamicProfileData?.socialLinks?.github ||
        "",
    },
  };
}

export default function MyProfileScreen({
  readOnly = false,
  username,
}: MyProfileScreenProps) {
  const { user } = useAuth() as any;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [profilePic, setProfilePic] = useState("");
  const [backgroundColor, setBackgroundColor] = useState(DEFAULT_BG);

  const [draftProfilePic, setDraftProfilePic] = useState("");
  const [draftBackgroundColor, setDraftBackgroundColor] = useState(DEFAULT_BG);
  const [imageBase64, setImageBase64] = useState("");

  const currentUserId = user?._id || user?.id;
  const isOwner = !readOnly;

  const dynamicSchema = useMemo<ProfileFieldSchema[]>(() => {
    const next = normalizeProfileSchema(PROFILE_FORM_CONFIG as ProfileFieldSchema[]);
    console.log("dynamicSchema", next);
    return next;
  }, [JSON.stringify(PROFILE_FORM_CONFIG)]);

  const displayEmail = readOnly ? "" : profile?.email || user?.email || "No email";

  const currentCoverColor = useMemo(
    () => (isEditing ? draftBackgroundColor || DEFAULT_BG : backgroundColor || DEFAULT_BG),
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
      const nextProfilePic = getImageUri(data?.profilePic || "");
      const nextBg = data?.backgroundColor || DEFAULT_BG;
      const seeded = buildSeedData(data, user);
      const withDefaults = applyDefaultsFromSchema(dynamicSchema, seeded);

      setProfile(data);
      setProfilePic(nextProfilePic);
      setBackgroundColor(nextBg);

      setDraftProfilePic(nextProfilePic);
      setDraftBackgroundColor(nextBg);

      setFormValues(withDefaults);
      setFormErrors({});
    },
    [dynamicSchema, user]
  );

  const syncUserToStorage = useCallback(
    async (updated: ProfileData) => {
      try {
        if (!user) return;

        const nextUser = {
          ...user,
          username: updated.username || user.username,
          email: updated.email || user.email,
          role: updated.role || user.role,
          profilePic: updated.profilePic || user.profilePic,
          backgroundColor: updated.backgroundColor || user.backgroundColor,
          friends: updated.friends || user.friends,
        };

        await AsyncStorage.setItem("@user", JSON.stringify(nextUser));
      } catch (err) {
        console.log("syncUserToStorage error", err);
      }
    },
    [user]
  );

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);

      const data =
        readOnly && username
          ? await getProfileByUsername(username)
          : await getProfile(currentUserId);

      applyProfileToState(data);
    } catch (error: any) {
      Alert.alert("Error", error?.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  }, [readOnly, username, currentUserId, applyProfileToState]);

  useEffect(() => {
    if (readOnly && !username) {
      setLoading(false);
      return;
    }

    if (!readOnly && !currentUserId) {
      setLoading(false);
      return;
    }

    fetchProfile();
  }, [fetchProfile, readOnly, username, currentUserId]);

  const handleEdit = () => {
    if (!isOwner || !profile) return;

    const seeded = buildSeedData(profile, user);
    const withDefaults = applyDefaultsFromSchema(dynamicSchema, seeded);

    setFormValues(withDefaults);
    setDraftProfilePic(profilePic || "");
    setDraftBackgroundColor(backgroundColor || DEFAULT_BG);
    setImageBase64("");
    setFormErrors({});
    setIsEditing(true);
  };

  const handleCancel = () => {
    const seeded = buildSeedData(profile, user);
    const withDefaults = applyDefaultsFromSchema(dynamicSchema, seeded);

    setFormValues(withDefaults);
    setDraftProfilePic(profilePic || "");
    setDraftBackgroundColor(backgroundColor || DEFAULT_BG);
    setImageBase64("");
    setFormErrors({});
    setShowColorPicker(false);
    setIsEditing(false);
  };

  const handleFieldChange = (path: string, value: any) => {
    const nextValues = setValueByPath(formValues, path, value);
    setFormValues(nextValues);
    setFormErrors(validateBySchema(dynamicSchema, nextValues));
  };

  const handlePickImage = async () => {
    if (!isEditing || !isOwner) return;

    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Permission denied", "Please allow photo library access first.");
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

  const handleRandomColor = () => {
    if (!isEditing || !isOwner) return;
    setDraftBackgroundColor(randomHexColor());
  };

  const handleSave = async () => {
    if (!currentUserId) {
      Alert.alert("Error", "User not found");
      return;
    }

    const errors = validateBySchema(dynamicSchema, formValues);
    setFormErrors(errors);

    if (Object.keys(errors).length > 0) {
      Alert.alert("Validation Error", "Please check the highlighted fields");
      return;
    }

    try {
      setSaving(true);

      const payload = buildPayloadFromSchema(dynamicSchema, formValues);

      console.log("Dynamic profile payload:", payload);

      const updated = await updateProfile(currentUserId, {
        ...payload,
        dynamicProfileData: payload,
        backgroundColor: draftBackgroundColor || DEFAULT_BG,
        imageBase64: imageBase64 || undefined,
      });

      applyProfileToState(updated);
      await syncUserToStorage(updated);

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

  const previewName = String(
    (isEditing ? formValues.username : profile?.username) || ""
  );

  const previewBio = String(
    (isEditing ? formValues.bio : profile?.bio) || ""
  );

  const previewRole = String(
    (isEditing ? formValues.role : profile?.role) || "user"
  );

  const previewShowSocial = !!(
    isEditing
      ? getValueByPath(formValues, "preferences.showSocialLinks")
      : profile?.preferences?.showSocialLinks
  );

  const previewFacebook = String(
    (isEditing
      ? getValueByPath(formValues, "socialLinks.facebook")
      : profile?.socialLinks?.facebook) || ""
  );

  const previewInstagram = String(
    (isEditing
      ? getValueByPath(formValues, "socialLinks.instagram")
      : profile?.socialLinks?.instagram) || ""
  );

  const previewGithub = String(
    (isEditing
      ? getValueByPath(formValues, "socialLinks.github")
      : profile?.socialLinks?.github) || ""
  );

  const previewAdminCode = String(
    (isEditing ? formValues.adminCode : profile?.adminCode) || ""
  );

  return (
    <WebLayout>
      <ScrollView className="flex-1 px-4 py-6">
        <View className="max-w-2xl mx-auto w-full">
          <View
            className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-visible mb-4"
            style={{ position: "relative", zIndex: 1 }}
          >
            <TouchableOpacity
              activeOpacity={isEditing && isOwner ? 0.85 : 1}
              onPress={() =>
                isEditing && isOwner && setShowColorPicker((v) => !v)
              }
              disabled={!isOwner}
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
                {isEditing && isOwner && (
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

            {showColorPicker && isOwner && (
              <View
                style={{
                  position: "absolute",
                  top: 88,
                  right: 16,
                  zIndex: 9999,
                  elevation: 9999,
                  width: 320,
                }}
              >
                <ColorPickerPanel
                  value={draftBackgroundColor}
                  onChange={setDraftBackgroundColor}
                  onClose={() => setShowColorPicker(false)}
                />

                {isEditing && (
                  <View className="pt-3">
                    <TouchableOpacity
                      onPress={handleRandomColor}
                      className="bg-pink-50 border border-pink-200 rounded-xl px-4 py-3 items-center"
                    >
                      <Text className="text-pink-600 text-sm font-semibold">
                        🎲 Random background color
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}

            <View className="px-8 pb-8">
              <View style={{ marginTop: -40, marginBottom: 4 }}>
                <TouchableOpacity
                  onPress={handlePickImage}
                  activeOpacity={isEditing && isOwner ? 0.7 : 1}
                  disabled={!isOwner}
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
                  {isEditing && isOwner && (
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
                    <Text className="text-2xl font-bold text-gray-900">
                      {previewName || "No name"}
                    </Text>

                    {!readOnly ? (
                      <Text className="text-gray-400 text-sm mt-0.5">
                        {displayEmail}
                      </Text>
                    ) : (
                      <Text className="text-gray-400 text-sm mt-0.5">
                        @{profile?.username || username || ""}
                      </Text>
                    )}
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
                    <Text
                      className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2"
                      onPress={() => alert("about me!")}
                    >
                      About
                    </Text>
                    <Text className="text-gray-600 text-sm leading-relaxed">
                      {previewBio || "No bio yet"}
                    </Text>
                  </View>

                  <View className="mb-5">
                    <Text className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
                      Profile Details
                    </Text>

                    <View className="bg-gray-50 rounded-2xl p-4 border border-gray-200 gap-3">
                      <View>
                        <Text className="text-xs text-gray-400">Role</Text>
                        <Text className="text-sm text-gray-800 font-medium">
                          {previewRole || "-"}
                        </Text>
                      </View>

                      {previewRole === "admin" && (
                        <View>
                          <Text className="text-xs text-gray-400">Admin Code</Text>
                          <Text className="text-sm text-gray-800">
                            {previewAdminCode || "-"}
                          </Text>
                        </View>
                      )}

                      {previewShowSocial && (
                        <>
                          <View>
                            <Text className="text-xs text-gray-400">Facebook</Text>
                            <Text className="text-sm text-gray-800">
                              {previewFacebook || "-"}
                            </Text>
                          </View>

                          <View>
                            <Text className="text-xs text-gray-400">Instagram</Text>
                            <Text className="text-sm text-gray-800">
                              {previewInstagram || "-"}
                            </Text>
                          </View>

                          <View>
                            <Text className="text-xs text-gray-400">GitHub</Text>
                            <Text className="text-sm text-gray-800">
                              {previewGithub || "-"}
                            </Text>
                          </View>
                        </>
                      )}
                    </View>
                  </View>

                  {isEditing && isOwner && (
                    <View className="mb-5" style={{ zIndex: 10 }}>
                      <Text className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
                        Dynamic Profile Form
                      </Text>

                      <DynamicProfileForm
                        fields={dynamicSchema}
                        values={formValues}
                        errors={formErrors}
                        onChange={handleFieldChange}
                      />
                    </View>
                  )}
                </>
              )}
            </View>
          </View>

          {!readOnly &&
            (isEditing ? (
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
            ))}
        </View>
      </ScrollView>
    </WebLayout>
  );
}