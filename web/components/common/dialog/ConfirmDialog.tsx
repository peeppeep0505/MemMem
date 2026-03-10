import PopupDialog from "./PopupDialog";

type Props = {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmDialog({
  visible,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
}: Props) {
  return (
    <PopupDialog
      visible={visible}
      title={title}
      message={message}
      buttons={[
        {
          label: cancelText,
          onPress: onCancel,
          type: "secondary",
        },
        {
          label: confirmText,
          onPress: onConfirm,
          type: "danger",
        },
      ]}
    />
  );
}