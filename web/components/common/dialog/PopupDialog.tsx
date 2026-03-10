import { View, Text, Modal, TouchableOpacity } from "react-native";

type Button = {
  label: string;
  onPress: () => void;
  type?: "primary" | "danger" | "secondary";
};

type Props = {
  visible: boolean;
  title?: string;
  message?: string;
  buttons?: Button[];
  onClose?: () => void;
};

export default function PopupDialog({
  visible,
  title,
  message,
  buttons = [],
  onClose,
}: Props) {
  const getButtonStyle = (type?: string) => {
    switch (type) {
      case "primary":
        return { backgroundColor: "#1a1a1a" };
      case "danger":
        return { backgroundColor: "#ef4444" };
      default:
        return {
          borderWidth: 1,
          borderColor: "#e5e7eb",
        };
    }
  };

  const getTextColor = (type?: string) => {
    if (type === "secondary") return "#6b7280";
    return type ? "#fff" : "#374151";
  };

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.35)",
          justifyContent: "center",
          alignItems: "center",
          padding: 20,
        }}
      >
        <View
          style={{
            width: "100%",
            maxWidth: 380,
            backgroundColor: "#fff",
            borderRadius: 16,
            padding: 22,
          }}
        >
          {title && (
            <Text
              style={{
                fontSize: 18,
                fontWeight: "700",
                marginBottom: 8,
              }}
            >
              {title}
            </Text>
          )}

          {message && (
            <Text
              style={{
                color: "#6b7280",
                marginBottom: 20,
                lineHeight: 20,
              }}
            >
              {message}
            </Text>
          )}

          <View
            style={{
              flexDirection: "row",
              justifyContent: "flex-end",
              gap: 10,
            }}
          >
            {buttons.map((btn, i) => (
              <TouchableOpacity
                key={i}
                onPress={btn.onPress}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 9,
                  borderRadius: 10,
                  ...getButtonStyle(btn.type),
                }}
              >
                <Text
                  style={{
                    color: getTextColor(btn.type),
                    fontWeight: "600",
                  }}
                >
                  {btn.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}