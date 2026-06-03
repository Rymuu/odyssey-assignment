import { createContext, useContext, useState, useCallback, useRef, type ReactNode } from "react";
import { View, StyleSheet } from "react-native";
import { colors, spacing, radius, shadows } from "../theme/tokens";
import { Text } from "./Text";

type ToastTone = "success" | "error" | "info";
type ToastItem = { id: number; message: string; tone: ToastTone };

type ToastContextValue = {
  show: (message: string, tone?: ToastTone) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

// Hook pour déclencher un toast depuis n'importe quel composant.
export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast doit être utilisé dans un <ToastProvider>");
  return ctx;
}

// Provider à placer haut dans l'arbre (dans le _layout).
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(0);

  const show = useCallback((message: string, tone: ToastTone = "info") => {
    const id = nextId.current++;
    setToasts((prev) => [...prev, { id, message, tone }]);
    // auto-dismiss après 3s
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <View style={styles.container} pointerEvents="none">
        {toasts.map((t) => (
          <ToastView key={t.id} message={t.message} tone={t.tone} />
        ))}
      </View>
    </ToastContext.Provider>
  );
}

function ToastView({ message, tone }: { message: string; tone: ToastTone }) {
  const palette = tonePalette(tone);
  return (
    <View style={[styles.toast, { backgroundColor: palette.bg }]}>
      <Text variant="label" style={{ color: palette.fg }}>
        {message}
      </Text>
    </View>
  );
}

function tonePalette(tone: ToastTone): { bg: string; fg: string } {
  switch (tone) {
    case "success": return { bg: colors.successBg, fg: colors.successFg };
    case "error":   return { bg: colors.errorBg, fg: colors.errorFg };
    case "info":    return { bg: colors.infoBg, fg: colors.infoFg };
  }
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: spacing["2xl"],
    left: 0,
    right: 0,
    alignItems: "center",
    gap: spacing.sm,
  },
  toast: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    ...shadows.md,
  },
});