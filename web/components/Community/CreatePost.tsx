import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Modal, Pressable, ScrollView } from "react-native";

interface CreatePostModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (caption: string) => void;
}

export default function CreatePostModal({ visible, onClose, onSubmit }: CreatePostModalProps) {
  const [caption, setCaption] = useState("");

  const handleSubmit = () => {
    if (!caption.trim()) return;
    onSubmit(caption.trim());
    setCaption("");
    onClose();
  };

  const handleClose = () => {
    setCaption("");
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
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
          {/* Header */}
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
            <View>
              <Text style={{ fontSize: 20, fontWeight: "800", color: "#0f172a", letterSpacing: -0.5 }}>
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

          {/* Author row */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <View
              style={{
                width: 38,
                height: 38,
                borderRadius: 19,
                overflow: "hidden",
                borderWidth: 2,
                borderColor: "#f1f5f9",
              }}
            >
              <img
                src="https://i.pravatar.cc/150?img=68"
                style={{ width: 38, height: 38, objectFit: "cover" }}
                alt="avatar"
              />
            </View>
            <View>
              <Text style={{ fontSize: 14, fontWeight: "700", color: "#0f172a" }}>@you</Text>
              <Text style={{ fontSize: 11, color: "#94a3b8" }}>Posting to Friends</Text>
            </View>
          </View>

          {/* Caption input */}
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
          <Text style={{ fontSize: 11, color: "#cbd5e1", textAlign: "right", marginBottom: 20 }}>
            {caption.length} / 300
          </Text>

          {/* Add photo hint */}
          <TouchableOpacity
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
              marginBottom: 20,
            }}
          >
            <Text style={{ fontSize: 16 }}>🖼</Text>
            <Text style={{ fontSize: 13, color: "#94a3b8" }}>Add a photo</Text>
          </TouchableOpacity>

          {/* Actions */}
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
              <Text style={{ fontSize: 14, fontWeight: "600", color: "#64748b" }}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSubmit}
              style={{
                flex: 2,
                paddingVertical: 13,
                borderRadius: 14,
                alignItems: "center",
                backgroundColor: caption.trim() ? "#0f172a" : "#e2e8f0",
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: "700", color: caption.trim() ? "#fff" : "#94a3b8" }}>
                Publish Post
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}