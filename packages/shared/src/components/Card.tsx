import { ReactNode } from 'react';
import { View, StyleSheet, type ViewStyle } from "react-native";
import { colors, spacing, radius, shadows } from "../theme/tokens";

type Elevation = "none" | "sm" | "md" | "lg";
type Padding = keyof typeof spacing;

type CardProps = {
  children: ReactNode;
  elevation?: Elevation;
  padding?: Padding;
  style?: ViewStyle;
};

// Surface de base : carte blanche, coins arrondis, ombre douce.
// Brique de conteneur réutilisée partout (KPI, listes, formulaires).
export function Card({
  children,
  elevation = "sm",
  padding = "lg",
  style,
}: CardProps) {
  return (
    <View
      style={[
        styles.base,
        { padding: spacing[padding] },
        shadows[elevation],
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
});