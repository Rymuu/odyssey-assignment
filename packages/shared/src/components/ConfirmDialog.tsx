import { Modal } from "./Modal";
import { Button } from "./Button";
import { Text } from "./Text";
import { View, StyleSheet } from "react-native";
import { spacing } from "../theme/tokens";

type ConfirmDialogProps = {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

// Dialogue de confirmation réutilisable pour les actions sensibles.
export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel = "Confirmer",
  cancelLabel = "Annuler",
  destructive = false,
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal
      visible={visible}
      onClose={onCancel}
      title={title}
      footer={
        <>
          <Button label={cancelLabel} variant="ghost" onPress={onCancel} />
          <Button
            label={confirmLabel}
            variant={destructive ? "secondary" : "primary"}
            onPress={onConfirm}
            loading={loading}
          />
        </>
      }
    >
      <View style={styles.body}>
        <Text variant="body">{message}</Text>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  body: { paddingVertical: spacing.xs },
});