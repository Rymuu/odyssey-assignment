import { useState } from "react";
import { View, Pressable, Modal, StyleSheet } from "react-native";
import { colors, spacing, radius, shadows } from "../theme/tokens";
import { Text } from "./Text";

export type SelectOption = { label: string; value: string };

type SelectProps = {
  label?: string;
  placeholder?: string;
  value?: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
};

export function Select({
  label,
  placeholder = "Sélectionner…",
  value,
  options,
  onChange,
  disabled = false,
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const [hoveredTrigger, setHoveredTrigger] = useState(false);
  const [hoveredValue, setHoveredValue] = useState<string | null>(null);
  const selected = options.find((o) => o.value === value);

  return (
    <View style={styles.wrapper}>
      {label ? (
        <Text variant="label" tone="muted">{label}</Text>
      ) : null}

      <Pressable
        onPress={() => !disabled && setOpen(true)}
        onHoverIn={() => setHoveredTrigger(true)}
        onHoverOut={() => setHoveredTrigger(false)}
        style={[
          styles.trigger,
          { borderColor: hoveredTrigger ? colors.borderStrong : colors.border },
          disabled ? styles.disabled : null,
        ]}
      >
        <Text tone={selected ? "default" : "subtle"}>
          {selected ? selected.label : placeholder}
        </Text>
        <Text tone="muted">▼</Text>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.menu} onPress={(e) => e.stopPropagation()}>
            <View style={styles.menuHeader}>
              <Text variant="caption" tone="muted" weight="semibold">
                {placeholder.toUpperCase()}
              </Text>
            </View>
            {options.map((item) => {
              const isHovered = hoveredValue === item.value;
              const isSelected = item.value === value;
              return (
                <Pressable
                  key={item.value}
                  onPress={() => { onChange(item.value); setOpen(false); }}
                  onHoverIn={() => setHoveredValue(item.value)}
                  onHoverOut={() => setHoveredValue(null)}
                  style={[
                    styles.option,
                    isSelected ? styles.optionSelected : isHovered ? styles.optionHovered : null,
                  ]}
                >
                  <Text tone={isSelected ? "primary" : "default"} weight={isSelected ? "semibold" : "regular"}>
                    {item.label}
                  </Text>
                  {isSelected ? <Text tone="primary" weight="bold">✓</Text> : null}
                </Pressable>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing.xs },
  trigger: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  disabled: { backgroundColor: colors.surfaceAlt },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(42,37,33,0.3)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing["2xl"],
  },
  menu: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    width: "100%",
    maxWidth: 360,
    ...shadows.lg,
  },
  menuHeader: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: spacing.xs,
  },
  option: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    marginHorizontal: spacing.xs,
  },
  optionHovered: { backgroundColor: colors.surfaceAlt },
  optionSelected: { backgroundColor: colors.primaryLight },
});