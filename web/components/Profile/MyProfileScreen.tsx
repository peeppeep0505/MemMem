import { View, Text, Image, TextInput, TouchableOpacity, ScrollView } from "react-native";
import { useState } from "react";
import WebLayout from "../common/WebLayout";

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [bio, setBio] = useState(
    "Product designer & developer. Passionate about building tools that feel intuitive and delightful. Currently working on something new."
  );
  const [draftBio, setDraftBio] = useState(bio);
  const [name, setName] = useState("Aemeath");
  const [draftName, setDraftName] = useState(name);

  const handleEdit = () => {
    setDraftBio(bio);
    setDraftName(name);
    setIsEditing(true);
  };

  const handleSave = () => {
    setBio(draftBio);
    setName(draftName);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const stats = [
    { label: "Tasks Done", value: "128" },
    { label: "This Week", value: "14" },
    { label: "Streak", value: "7d" },
  ];

  return (
    <WebLayout>
      <View className="max-w-2xl mx-auto w-full">

        {/* Page Title */}
        <Text className="text-4xl font-bold text-gray-900 tracking-tight mb-8">
          My Profile
        </Text>

        {/* Profile Card */}
        <View className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-4">

          {/* Cover strip */}
          <View
            className="h-24 w-full"
            style={{ backgroundColor: "#fdf2f8" }}
          >
            <View
              className="absolute inset-0 opacity-30"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 20% 50%, #f9a8d4 0%, transparent 60%), radial-gradient(circle at 80% 20%, #fbcfe8 0%, transparent 50%)",
              } as any}
            />
          </View>

          <View className="px-8 pb-8">
            {/* Avatar */}
            <View className="flex-row items-end justify-between" style={{ marginTop: -40 }}>
              <View
                className="rounded-full border-4 border-white shadow-md overflow-hidden"
                style={{ width: 80, height: 80 }}
              >
                <Image
                  source={require('../../assets/images/profile.jpg')}
                  style={{ width: 80, height: 80 }}
                />
              </View>

              {/* Action Buttons */}
              <View className="flex-row gap-2 pb-1">
                {isEditing ? (
                  <>
                    <TouchableOpacity
                      onPress={handleCancel}
                      className="px-4 py-2 rounded-xl border border-gray-200"
                    >
                      <Text className="text-gray-500 text-sm font-medium">Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={handleSave}
                      className="px-5 py-2 rounded-xl bg-pink-500"
                    >
                      <Text className="text-white text-sm font-semibold">Save</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <TouchableOpacity
                    onPress={handleEdit}
                    className="flex-row items-center px-4 py-2 rounded-xl border border-gray-200"
                  >
                    <Text className="text-gray-600 text-sm font-medium">✎  Edit Profile</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Name & Email */}
            <View className="mt-4 mb-6">
              {isEditing ? (
                <TextInput
                  value={draftName}
                  onChangeText={setDraftName}
                  className="text-2xl font-bold text-gray-900 border-b border-pink-200 pb-1 mb-1"
                  style={{ outline: "none" } as any}
                />
              ) : (
                <Text className="text-2xl font-bold text-gray-900">{name}</Text>
              )}
              <Text className="text-gray-400 text-sm mt-0.5">aemeath@email.com</Text>

              {/* Tags */}
              <View className="flex-row flex-wrap gap-2 mt-3">
                {["Designer", "Developer", "Open to work"].map((tag) => (
                  <View
                    key={tag}
                    className="px-3 py-1 rounded-full bg-pink-50 border border-pink-100"
                  >
                    <Text className="text-pink-600 text-xs font-medium">{tag}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Stats Row */}
            <View className="flex-row bg-gray-50 rounded-2xl p-4 mb-6 gap-2">
              {stats.map((s, i) => (
                <View key={s.label} className={`flex-1 items-center ${i < stats.length - 1 ? "border-r border-gray-200" : ""}`}>
                  <Text className="text-xl font-bold text-gray-900">{s.value}</Text>
                  <Text className="text-gray-400 text-xs mt-0.5">{s.label}</Text>
                </View>
              ))}
            </View>

            {/* Bio */}
            <View>
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
                  style={{ minHeight: 96, outline: "none", textAlignVertical: "top" } as any}
                />
              ) : (
                <Text className="text-gray-600 text-sm leading-relaxed">{bio}</Text>
              )}
            </View>
          </View>
        </View>

        {/* Account Section */}
        <View className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <View className="px-6 py-4 border-b border-gray-50">
            <Text className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
              Account
            </Text>
          </View>

          {[
            { icon: "🔔", label: "Notifications", hint: "Manage alerts" },
            { icon: "🔒", label: "Privacy & Security", hint: "Password, 2FA" },
            { icon: "🎨", label: "Appearance", hint: "Theme, language" },
          ].map((item, i, arr) => (
            <TouchableOpacity
              key={item.label}
              className={`flex-row items-center px-6 py-4 ${i < arr.length - 1 ? "border-b border-gray-50" : ""}`}
            >
              <Text className="text-lg mr-4">{item.icon}</Text>
              <View className="flex-1">
                <Text className="text-gray-800 font-medium text-sm">{item.label}</Text>
                <Text className="text-gray-400 text-xs mt-0.5">{item.hint}</Text>
              </View>
              <Text className="text-gray-300 text-lg">›</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Sign Out */}
        <TouchableOpacity className="mt-4 py-4 rounded-2xl border border-red-100 bg-red-50 items-center">
          <Text className="text-red-400 text-sm font-semibold">Sign Out</Text>
        </TouchableOpacity>

      </View>
    </WebLayout>
  );
}