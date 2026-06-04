import { View, Text, StyleSheet } from "react-native";
import { colors, spacing, radius, typography } from "../theme/tokens";

type Tone = "success" | "warning" | "error" | "info" | "neutral";

type BadgeProps = {
  label: string;
  tone?: Tone;
};

// Pastille de statut : fond pâle + bordure douce + texte, assortis au ton.
export function Badge({ label, tone = "neutral" }: BadgeProps) {
  const palette = tonePalette(tone);
  return (
    <View style={[styles.base, { backgroundColor: palette.bg, borderColor: palette.border }]}>
      <Text style={[styles.text, { color: palette.fg }]}>{label}</Text>
    </View>
  );
}

function tonePalette(tone: Tone): { bg: string; fg: string; border: string } {
  switch (tone) {
    case "success": return { bg: colors.successBg, fg: colors.successFg, border: colors.successBorder };
    case "warning": return { bg: colors.warningBg, fg: colors.warningFg, border: colors.warningBorder };
    case "error":   return { bg: colors.errorBg, fg: colors.errorFg, border: colors.errorBorder };
    case "info":    return { bg: colors.infoBg, fg: colors.infoFg, border: colors.infoBorder };
    case "neutral": return { bg: colors.surfaceAlt, fg: colors.textMuted, border: colors.border };
  }
}

const styles = StyleSheet.create({
  base: {
    alignSelf: "flex-start",
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  text: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
  },
});