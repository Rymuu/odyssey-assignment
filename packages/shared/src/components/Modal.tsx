import { type ReactNode } from "react";
import { Modal as RNModal, View, Pressable, StyleSheet } from "react-native";
import { colors, spacing, radius, shadows } from "../theme/tokens";
import { Text } from "./Text";

type ModalProps = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
};

// Fenêtre modale pour les flux create/edit.
// Overlay sombre + panneau centré. Fermeture par clic sur l'overlay
// ou la croix.
export function Modal({ visible, onClose, title, children, footer }: ModalProps) {
  return (
    <RNModal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        {/* stopPropagation : un clic dans le panneau ne ferme pas */}
        <Pressable style={styles.panel} onPress={(e) => e.stopPropagation()}>
          {title ? (
            <View style={styles.header}>
              <Text variant="heading">{title}</Text>
              <Pressable onPress={onClose} hitSlop={8}>
                <Text variant="heading" tone="muted">×</Text>
              </Pressable>
            </View>
          ) : null}
          <View style={styles.body}>{children}</View>
          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </Pressable>
      </Pressable>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(42,37,33,0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing["2xl"],
  },
  panel: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing["2xl"],
    width: "100%",
    maxWidth: 480,
    gap: spacing.lg,
    ...shadows.lg,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  body: { gap: spacing.md },
  footer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: spacing.sm,
  },
});