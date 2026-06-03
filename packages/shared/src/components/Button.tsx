import { useState } from "react";
import {
  Pressable,
  Text,
  ActivityIndicator,
  StyleSheet,
  View,
  type PressableProps,
  type ViewStyle,
  type TextStyle,
} from "react-native";
import { colors, spacing, radius, typography } from "../theme/tokens";

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md" | "lg";

type ButtonProps = {
  label: string;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  loading?: boolean;
  onPress?: PressableProps["onPress"];
  fullWidth?: boolean;
};

export function Button({
  label,
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  onPress,
  fullWidth = false,
}: ButtonProps) {
  // RN Web n'a pas de :hover CSS -> on gère l'état nous-mêmes.
  const [hovered, setHovered] = useState(false);
  const isDisabled = disabled || loading;

  const containerStyle: ViewStyle[] = [
    styles.base,
    sizeStyles[size].container,
    variantContainer(variant, hovered, isDisabled),
    fullWidth ? styles.fullWidth : null,
  ].filter(Boolean) as ViewStyle[];

  const textStyle: TextStyle[] = [
    styles.textBase,
    sizeStyles[size].text,
    variantText(variant, isDisabled),
  ];

  return (
    <Pressable
      onPress={isDisabled ? undefined : onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      disabled={isDisabled}
      style={containerStyle}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
    >
      {loading ? (
        <View style={styles.row}>
          <ActivityIndicator
            size="small"
            color={variant === "primary" ? colors.white : colors.primary}
          />
          <Text style={[...textStyle, styles.loadingText]}>{label}</Text>
        </View>
      ) : (
        <Text style={textStyle}>{label}</Text>
      )}
    </Pressable>
  );
}

function variantContainer(
  variant: Variant,
  hovered: boolean,
  disabled: boolean
): ViewStyle {
  if (disabled) {
    if (variant === "primary") return { backgroundColor: colors.borderStrong };
    if (variant === "secondary")
      return { backgroundColor: colors.surfaceAlt, borderColor: colors.border, borderWidth: 1 };
    return { backgroundColor: "transparent" };
  }
  switch (variant) {
    case "primary":
      return { backgroundColor: hovered ? colors.primaryHover : colors.primary };
    case "secondary":
      return {
        backgroundColor: hovered ? colors.surfaceAlt : colors.surface,
        borderColor: colors.borderStrong,
        borderWidth: 1,
      };
    case "ghost":
      return { backgroundColor: hovered ? colors.surfaceAlt : "transparent" };
  }
}

function variantText(variant: Variant, disabled: boolean): TextStyle {
  if (disabled) return { color: colors.textSubtle };
  switch (variant) {
    case "primary":
      return { color: colors.white };
    case "secondary":
      return { color: colors.text };
    case "ghost":
      return { color: colors.primaryText };
  }
}

const sizeStyles: Record<Size, { container: ViewStyle; text: TextStyle }> = {
  sm: {
    container: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md },
    text: { fontSize: typography.fontSize.sm },
  },
  md: {
    container: { paddingVertical: spacing.md, paddingHorizontal: spacing.lg },
    text: { fontSize: typography.fontSize.base },
  },
  lg: {
    container: { paddingVertical: spacing.lg, paddingHorizontal: spacing.xl },
    text: { fontSize: typography.fontSize.lg },
  },
};

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  fullWidth: { width: "100%" },
  textBase: {
    fontWeight: typography.fontWeight.medium,
    textAlign: "center",
  },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  loadingText: {},
});