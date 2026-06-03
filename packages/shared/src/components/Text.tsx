import { Text as RNText, StyleSheet, type TextProps as RNTextProps, type TextStyle } from "react-native";
import { colors, typography } from "../theme/tokens";

type Variant = "display" | "title" | "heading" | "body" | "label" | "caption";
type Tone = "default" | "muted" | "subtle" | "primary" | "inverse";

type TextProps = RNTextProps & {
  variant?: Variant;
  tone?: Tone;
  weight?: keyof typeof typography.fontWeight;
};

// Composant typographique : applique les tokens de typo de façon
// cohérente, au lieu de répéter fontSize/fontWeight partout.
export function Text({
  variant = "body",
  tone = "default",
  weight,
  style,
  children,
  ...rest
}: TextProps) {
  const variantStyle = variantStyles[variant];
  const toneColor = toneStyles[tone];
  const weightStyle: TextStyle | null = weight
    ? { fontWeight: typography.fontWeight[weight] }
    : null;

  return (
    <RNText style={[{ fontFamily: typography.fontFamily.base }, variantStyle, { color: toneColor }, weightStyle, style]} {...rest}>
      {children}
    </RNText>
  );
}

const toneStyles: Record<Tone, string> = {
  default: colors.text,
  muted: colors.textMuted,
  subtle: colors.textSubtle,
  primary: colors.primaryText,
  inverse: colors.white,
};

const variantStyles = StyleSheet.create({
  display: { fontSize: typography.fontSize.display, fontWeight: typography.fontWeight.bold, lineHeight: typography.fontSize.display * typography.lineHeight.tight },
  title: { fontSize: typography.fontSize["2xl"], fontWeight: typography.fontWeight.bold, lineHeight: typography.fontSize["2xl"] * typography.lineHeight.tight },
  heading: { fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.semibold, lineHeight: typography.fontSize.xl * typography.lineHeight.tight },
  body: { fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.regular, lineHeight: typography.fontSize.base * typography.lineHeight.normal },
  label: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.medium, lineHeight: typography.fontSize.sm * typography.lineHeight.normal },
  caption: { fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.regular, lineHeight: typography.fontSize.xs * typography.lineHeight.normal },
});