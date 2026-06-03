import { View, Text, StyleSheet } from "react-native";
import { colors, spacing, radius, typography } from "../theme/tokens";

type Tone = "success" | "warning" | "error" | "info" | "neutral";

type BadgeProps = {
  label: string;
  tone?: Tone;
};

// Pastille de statut. Couples bg/fg sémantiques des tokens.
// Idéal pour les statuts de commande (pending, completed, cancelled…).
export function Badge({ label, tone = "neutral" }: BadgeProps) {
  const palette = tonePalette(tone);
  return (
    <View style={[styles.base, { backgroundColor: palette.bg }]}>
      <Text style={[styles.text, { color: palette.fg }]}>{label}</Text>
    </View>
  );
}

function tonePalette(tone: Tone): { bg: string; fg: string } {
  switch (tone) {
    case "success": return { bg: colors.successBg, fg: colors.successFg };
    case "warning": return { bg: colors.warningBg, fg: colors.warningFg };
    case "error":   return { bg: colors.errorBg, fg: colors.errorFg };
    case "info":    return { bg: colors.infoBg, fg: colors.infoFg };
    case "neutral": return { bg: colors.surfaceAlt, fg: colors.textMuted };
  }
}

const styles = StyleSheet.create({
  base: {
    alignSelf: "flex-start",
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
  },
  text: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
  },
});