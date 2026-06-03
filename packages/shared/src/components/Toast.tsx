import { createContext, useContext, useState, useCallback, useRef, useEffect, type ReactNode } from "react";
import { View, StyleSheet, Animated } from "react-native";
import { colors, spacing, radius, shadows } from "../theme/tokens";
import { Text } from "./Text";

type ToastTone = "success" | "error" | "warning" | "info";
type ToastItem = { id: number; title: string; description?: string; tone: ToastTone };

type ToastContextValue = {
  show: (title: string, options?: { description?: string; tone?: ToastTone }) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast doit être utilisé dans un <ToastProvider>");
  return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(0);

  const show = useCallback(
    (title: string, options?: { description?: string; tone?: ToastTone }) => {
      const id = nextId.current++;
      setToasts((prev) => [
        ...prev,
        { id, title, description: options?.description, tone: options?.tone ?? "info" },
      ]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3500);
    },
    []
  );

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <View style={styles.container} pointerEvents="none">
        {toasts.map((t) => (
          <ToastView key={t.id} title={t.title} description={t.description} tone={t.tone} />
        ))}
      </View>
    </ToastContext.Provider>
  );
}

const ICON: Record<ToastTone, string> = {
  success: "✓",
  error: "✕",
  warning: "!",
  info: "i",
};

function ToastView({
  title,
  description,
  tone,
}: {
  title: string;
  description?: string;
  tone: ToastTone;
}) {
  const accent = toneAccent(tone);
  const translateX = useRef(new Animated.Value(40)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateX, { toValue: 0, duration: 250, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
    ]).start();
  }, [translateX, opacity]);

  return (
    <Animated.View
      style={[styles.toast, { transform: [{ translateX }], opacity }]}
    >
      {/* barre latérale colorée, arrondie à gauche, droite à droite */}
      <View style={[styles.accentBar, { backgroundColor: accent.fg }]} />
      {/* contenu */}
      <View style={styles.inner}>
        <View style={[styles.iconCircle, { backgroundColor: accent.bg }]}>
          <Text variant="label" weight="bold" style={{ color: accent.fg }}>
            {ICON[tone]}
          </Text>
        </View>
        <View style={styles.textBlock}>
          <Text variant="label" weight="semibold">
            {title}
          </Text>
          {description ? (
            <Text variant="caption" tone="muted">
              {description}
            </Text>
          ) : null}
        </View>
      </View>
    </Animated.View>
  );
}

function toneAccent(tone: ToastTone): { bg: string; fg: string } {
  switch (tone) {
    case "success": return { bg: colors.successBg, fg: colors.successFg };
    case "error":   return { bg: colors.errorBg, fg: colors.errorFg };
    case "warning": return { bg: colors.warningBg, fg: colors.warningFg };
    case "info":    return { bg: colors.infoBg, fg: colors.infoFg };
  }
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: spacing["2xl"],
    right: spacing["2xl"],
    alignItems: "flex-end",
    gap: spacing.sm,
  },
  toast: {
    flexDirection: "row",
    alignItems: "stretch",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    minWidth: 260,
    maxWidth: 360,
    overflow: "hidden",       // pour que la barre suive l'arrondi du conteneur
    ...shadows.md,
  },
  accentBar: {
    width: 4,
    // arrondi à gauche (suit le conteneur), droit à droite
    borderTopLeftRadius: radius.md,
    borderBottomLeftRadius: radius.md,
  },
  inner: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  iconCircle: {
    width: 24,
    height: 24,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  textBlock: { flex: 1, gap: 2 },
});