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
import { useAppTheme } from "@/contexts/ThemeContext";
import { Fonts, Glyphs } from "@/constants/theme";

type MyProfileScreenProps = {
  readOnly?: boolean;
  username?: string;
};

const DEFAULT_BG = "#f4a0bb";
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
  const { theme: C } = useAppTheme();
  const F = Fonts as any;

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
      label: "Friends",
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
    if (readOnly && !username) { setLoading(false); return; }
    if (!readOnly && !currentUserId) { setLoading(false); return; }
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
      const nextBase64 = asset.base64 ? `data:${mimeType};base64,${asset.base64}` : "";
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
    if (!currentUserId) { Alert.alert("Error", "User not found"); return; }
    const errors = validateBySchema(dynamicSchema, formValues);
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      Alert.alert("Validation Error", "Please check the highlighted fields");
      return;
    }
    try {
      setSaving(true);
      const payload = buildPayloadFromSchema(dynamicSchema, formValues);
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

  const previewName    = String((isEditing ? formValues.username : profile?.username) || "");
  const previewBio     = String((isEditing ? formValues.bio : profile?.bio) || "");
  const previewRole    = String((isEditing ? formValues.role : profile?.role) || "user");
  const previewShowSocial = !!(isEditing
    ? getValueByPath(formValues, "preferences.showSocialLinks")
    : profile?.preferences?.showSocialLinks);
  const previewFacebook  = String((isEditing ? getValueByPath(formValues, "socialLinks.facebook") : profile?.socialLinks?.facebook) || "");
  const previewInstagram = String((isEditing ? getValueByPath(formValues, "socialLinks.instagram") : profile?.socialLinks?.instagram) || "");
  const previewGithub    = String((isEditing ? getValueByPath(formValues, "socialLinks.github") : profile?.socialLinks?.github) || "");
  const previewAdminCode = String((isEditing ? formValues.adminCode : profile?.adminCode) || "");

  // ── shared styles ──────────────────────────────────────────────────────────
  const sectionLabel = {
    fontSize: 10,
    fontWeight: "700" as const,
    letterSpacing: 2.5,
    textTransform: "uppercase" as const,
    color: C.mutedText,
    marginBottom: 8,
  };

  const detailCard = {
    backgroundColor: C.primarySoft,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: C.border,
    gap: 12,
  };

  const detailLabel = { fontSize: 11, color: C.mutedText };
  const detailValue = { fontSize: 14, color: C.inkText, fontWeight: "500" as const, fontFamily: F?.sans };

  return (
    <WebLayout>
      <ScrollView
        style={{ flex: 1, backgroundColor: C.background }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 24, paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ maxWidth: 672, marginHorizontal: "auto", width: "100%" }}>

          {/* ── Deco strip ── */}
          <View style={{ alignItems: "center", marginBottom: 16 }}>
            <Text style={{ fontSize: 11, color: C.accent, letterSpacing: 6 }}>
              {`${Glyphs.sparkle} ${Glyphs.soft} ${Glyphs.heart} ${Glyphs.soft} ${Glyphs.sparkle}`}
            </Text>
          </View>

          {/* ── Profile card ── */}
          <View
            style={{
              backgroundColor: C.surface,
              borderRadius: 24,
              borderWidth: 1,
              borderColor: C.border,
              overflow: "visible",
              marginBottom: 16,
              position: "relative",
              zIndex: 1,
              shadowColor: C.primary,
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.08,
              shadowRadius: 24,
            }}
          >
            {/* Cover */}
            <TouchableOpacity
              activeOpacity={isEditing && isOwner ? 0.85 : 1}
              onPress={() => isEditing && isOwner && setShowColorPicker((v) => !v)}
              disabled={!isOwner}
            >
              <View
                style={{
                  height: 100,
                  width: "100%",
                  borderTopLeftRadius: 24,
                  borderTopRightRadius: 24,
                  overflow: "hidden",
                  backgroundColor: currentCoverColor,
                  alignItems: "flex-end",
                  justifyContent: "flex-end",
                }}
              >
                {/* Soft shimmer overlay */}
                <View
                  style={{
                    position: "absolute",
                    inset: 0,
                    opacity: 0.25,
                    backgroundImage:
                      "radial-gradient(circle at 20% 50%, rgba(255,255,255,0.5) 0%, transparent 60%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.3) 0%, transparent 50%)",
                  } as any}
                />

                {/* Cover deco glyphs */}
                <View style={{ position: "absolute", left: 16, bottom: 10 }}>
                  <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", letterSpacing: 4 }}>
                    {`${Glyphs.soft} ${Glyphs.floral} ${Glyphs.heart}`}
                  </Text>
                </View>

                {isEditing && isOwner && (
                  <View
                    style={{
                      margin: 10,
                      backgroundColor: "rgba(0,0,0,0.18)",
                      borderRadius: 10,
                      paddingHorizontal: 10,
                      paddingVertical: 5,
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 5,
                    }}
                  >
                    <Ionicons name="color-palette-outline" size={13} color="white" />
                    <Text style={{ color: "white", fontSize: 11, fontWeight: "600" }}>
                      Change color
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>

            {/* Color picker popover */}
            {showColorPicker && isOwner && (
              <View
                style={{
                  position: "absolute",
                  top: 90,
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
                  <View style={{ paddingTop: 10 }}>
                    <TouchableOpacity
                      onPress={handleRandomColor}
                      style={{
                        backgroundColor: C.tagPill,
                        borderWidth: 1,
                        borderColor: C.border,
                        borderRadius: 12,
                        paddingHorizontal: 16,
                        paddingVertical: 12,
                        alignItems: "center",
                      }}
                    >
                      <Text style={{ color: C.primaryStrong, fontSize: 13, fontWeight: "600" }}>
                        🎲 Random background color
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}

            <View style={{ paddingHorizontal: 24, paddingBottom: 24 }}>

              {/* Avatar */}
              <View style={{ marginTop: -40, marginBottom: 4 }}>
                <TouchableOpacity
                  onPress={handlePickImage}
                  activeOpacity={isEditing && isOwner ? 0.7 : 1}
                  disabled={!isOwner}
                  style={{
                    width: 84,
                    height: 84,
                    borderRadius: 42,
                    borderWidth: 4,
                    borderColor: C.surface,
                    overflow: "hidden",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: C.primarySoft2,
                    shadowColor: C.primary,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.2,
                    shadowRadius: 10,
                  }}
                >
                  {currentAvatarUri ? (
                    <Image source={{ uri: currentAvatarUri }} style={{ width: 84, height: 84 }} />
                  ) : (
                    <Ionicons name="person" size={38} color={C.accent} />
                  )}
                  {isEditing && isOwner && (
                    <View
                      style={{
                        position: "absolute",
                        top: 0, left: 0, right: 0, bottom: 0,
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: "rgba(0,0,0,0.32)",
                      }}
                    >
                      <Ionicons name="camera" size={22} color="white" />
                    </View>
                  )}
                </TouchableOpacity>
              </View>

              {/* Loading */}
              {loading ? (
                <View style={{ paddingVertical: 40, alignItems: "center" }}>
                  <ActivityIndicator color={C.primary} />
                  <Text style={{ color: C.mutedText, fontSize: 13, marginTop: 10 }}>
                    Loading profile…
                  </Text>
                </View>
              ) : (
                <>
                  {/* Name + email/username */}
                  <View style={{ marginTop: 8, marginBottom: 20 }}>
                    <Text style={{
                      fontSize: 24,
                      fontWeight: "700",
                      color: C.inkText,
                      fontFamily: F?.display ?? F?.serif,
                    }}>
                      {previewName || "No name"}
                    </Text>

                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 }}>
                      <Text style={{ fontSize: 13, color: C.mutedText, fontFamily: F?.sans }}>
                        {!readOnly ? displayEmail : `@${profile?.username || username || ""}`}
                      </Text>
                      <Text style={{ color: C.accent, fontSize: 11 }}>{Glyphs.sparkle}</Text>
                    </View>
                  </View>

                  {/* Stats */}
                  <View
                    style={{
                      flexDirection: "row",
                      backgroundColor: C.primarySoft,
                      borderRadius: 18,
                      padding: 16,
                      marginBottom: 20,
                      borderWidth: 1,
                      borderColor: C.border,
                      gap: 8,
                    }}
                  >
                    {stats.map((s, i) => (
                      <View
                        key={s.label}
                        style={{
                          flex: 1,
                          alignItems: "center",
                          borderRightWidth: i < stats.length - 1 ? 1 : 0,
                          borderRightColor: C.border,
                        }}
                      >
                        <Text style={{ fontSize: 22, fontWeight: "700", color: C.primary }}>
                          {s.value}
                        </Text>
                        <Text style={{ fontSize: 11, color: C.mutedText, marginTop: 2 }}>
                          {s.label}
                        </Text>
                      </View>
                    ))}
                  </View>

                  {/* About */}
                  <View style={{ marginBottom: 20 }}>
                    <Text style={sectionLabel} onPress={() => alert("About me!!")}>
                      {`${Glyphs.soft} About`}
                    </Text>
                    <Text style={{ color: C.mutedText, fontSize: 14, lineHeight: 22, fontFamily: F?.sans }}>
                      {previewBio || "No bio yet"}
                    </Text>
                  </View>

                  {/* Profile details */}
                  <View style={{ marginBottom: 20 }}>
                    <Text style={sectionLabel}>
                      {`${Glyphs.sparkle} Profile Details`}
                    </Text>

                    <View style={detailCard}>
                      <View>
                        <Text style={detailLabel}>Role</Text>
                        <Text style={detailValue}>{previewRole || "-"}</Text>
                      </View>

                      {previewRole === "admin" && (
                        <View>
                          <Text style={detailLabel}>Admin Code</Text>
                          <Text style={detailValue}>{previewAdminCode || "-"}</Text>
                        </View>
                      )}

                      {previewShowSocial && (
                        <>
                          {[
                            { label: "Facebook", value: previewFacebook },
                            { label: "Instagram", value: previewInstagram },
                            { label: "GitHub", value: previewGithub },
                          ].map((item) => (
                            <View key={item.label}>
                              <Text style={detailLabel}>{item.label}</Text>
                              <Text style={detailValue}>{item.value || "-"}</Text>
                            </View>
                          ))}
                        </>
                      )}
                    </View>
                  </View>

                  {/* Dynamic form (edit mode) */}
                  {isEditing && isOwner && (
                    <View style={{ marginBottom: 20, zIndex: 10 }}>
                      <Text style={sectionLabel}>
                        {`${Glyphs.floral} Profile Form`}
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

          {/* ── Action buttons ── */}
          {!readOnly && (
            isEditing ? (
              <View style={{ flexDirection: "row", gap: 12 }}>
                <TouchableOpacity
                  onPress={handleCancel}
                  disabled={saving}
                  style={{
                    flex: 1,
                    paddingVertical: 14,
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: C.border,
                    backgroundColor: C.surface,
                    alignItems: "center",
                  }}
                >
                  <Text style={{ color: C.mutedText, fontSize: 14, fontWeight: "600" }}>
                    Cancel
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleSave}
                  disabled={saving}
                  style={{
                    flex: 1,
                    paddingVertical: 14,
                    borderRadius: 16,
                    backgroundColor: C.primary,
                    alignItems: "center",
                    shadowColor: C.primary,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 12,
                  }}
                >
                  {saving ? (
                    <ActivityIndicator color={C.surface} size="small" />
                  ) : (
                    <Text style={{ color: C.surface, fontSize: 14, fontWeight: "700" }}>
                      {`Save Changes ${Glyphs.sparkle}`}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                onPress={handleEdit}
                style={{
                  paddingVertical: 14,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: C.border,
                  backgroundColor: C.surface,
                  alignItems: "center",
                  shadowColor: C.primary,
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.06,
                  shadowRadius: 8,
                }}
              >
                <Text style={{ color: C.inkText, fontSize: 14, fontWeight: "600" }}>
                  {`✎ Edit Profile`}
                </Text>
              </TouchableOpacity>
            )
          )}

          {/* ── Bottom deco ── */}
          <View style={{ alignItems: "center", marginTop: 32 }}>
            <Text style={{ fontSize: 11, color: C.accent, letterSpacing: 4 }}>
              {`${Glyphs.star}˙${Glyphs.moon} ${Glyphs.soft} ${Glyphs.floral} ${Glyphs.soft} ${Glyphs.moon}˙${Glyphs.star}`}
            </Text>
          </View>

        </View>
      </ScrollView>
    </WebLayout>
  );
}