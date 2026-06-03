import { useState } from "react";
import { View, Pressable, Modal, FlatList, StyleSheet } from "react-native";
import { colors, spacing, radius } from "../theme/tokens";
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

// Dropdown simple : un déclencheur + une liste d'options en overlay.
// (RN n'a pas de <select> natif, on le construit avec Modal + FlatList.)
export function Select({
  label,
  placeholder = "Sélectionner…",
  value,
  options,
  onChange,
  disabled = false,
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <View style={styles.wrapper}>
      {label ? (
        <Text variant="label" tone="muted">
          {label}
        </Text>
      ) : null}
      <Pressable
        onPress={() => !disabled && setOpen(true)}
        style={[styles.trigger, disabled ? styles.disabled : null]}
      >
        <Text tone={selected ? "default" : "subtle"}>
          {selected ? selected.label : placeholder}
        </Text>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <View style={styles.menu}>
            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.option}
                  onPress={() => {
                    onChange(item.value);
                    setOpen(false);
                  }}
                >
                  <Text tone={item.value === value ? "primary" : "default"}>
                    {item.label}
                  </Text>
                </Pressable>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { width: "100%", gap: spacing.xs },
  trigger: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  disabled: { backgroundColor: colors.surfaceAlt },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(42,37,33,0.3)",
    justifyContent: "center",
    padding: spacing["3xl"],
  },
  menu: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingVertical: spacing.sm,
    maxHeight: 320,
  },
  option: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
});