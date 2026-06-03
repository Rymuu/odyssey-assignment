import { useState } from "react";
import { View, TextInput, StyleSheet, type TextInputProps } from "react-native";
import { colors, spacing, radius, typography } from "../theme/tokens";
import { Text } from "./Text";

type InputProps = TextInputProps & {
  label?: string;
  error?: string;
  disabled?: boolean;
};

// Champ de saisie avec label, états focus/erreur/disabled.
export function Input({ label, error, disabled = false, style, ...rest }: InputProps) {
  const [focused, setFocused] = useState(false);

  const borderColor = error
    ? colors.errorFg
    : focused
    ? colors.primary
    : colors.border;

  return (
    <View style={styles.wrapper}>
      {label ? (
        <Text variant="label" tone="muted" style={styles.label}>
          {label}
        </Text>
      ) : null}
      <TextInput
        editable={!disabled}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholderTextColor={colors.textSubtle}
        style={[
          styles.input,
          { borderColor },
          disabled ? styles.disabled : null,
          style,
        ]}
        {...rest}
      />
      {error ? (
        <Text variant="caption" style={styles.errorText}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { width: "100%", gap: spacing.xs },
  label: {},
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    fontSize: typography.fontSize.base,
    color: colors.text,
  },
  disabled: { backgroundColor: colors.surfaceAlt, color: colors.textSubtle },
  errorText: { color: colors.errorFg },
});