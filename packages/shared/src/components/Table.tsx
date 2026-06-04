import { useState, type ReactNode } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { colors, spacing, radius } from "../theme/tokens";
import { Text } from "./Text";
import { Skeleton } from "./Skeleton";

export type Column<T> = {
  key: string;
  title: string;
  flex?: number;
  align?: "left" | "right" | "center";
  render: (row: T) => ReactNode;
};

type TableProps<T> = {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  loading?: boolean;
  emptyMessage?: string;
  onRowPress?: (row: T) => void;
};

function alignToFlex(a?: "left" | "right" | "center") {
  return a === "right" ? "flex-end" : a === "center" ? "center" : "flex-start";
}

// Une ligne du tableau, avec gestion du hover (affordance de cliquabilité).
function TableRow<T>({
  row,
  columns,
  onPress,
  isLast,
}: {
  row: T;
  columns: Column<T>[];
  onPress?: (row: T) => void;
  isLast: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const clickable = !!onPress;

  const content = (
    <View
      style={[
        styles.row,
        isLast ? styles.rowLast : null,
        clickable && hovered ? styles.rowHovered : null,
      ]}
    >
      {columns.map((col) => {
        const rendered = col.render(row);
        return (
          <View key={col.key} style={{ flex: col.flex ?? 1, alignItems: alignToFlex(col.align) }}>
            {typeof rendered === "string" || typeof rendered === "number" ? (
              <Text variant="body">{rendered}</Text>
            ) : (
              rendered
            )}
          </View>
        );
      })}
      {/* Chevron : signale que la ligne est cliquable */}
      {clickable ? (
        <View style={styles.chevron}>
          <Feather name="chevron-right" size={16} color={hovered ? colors.primary : colors.textSubtle} />
        </View>
      ) : null}
    </View>
  );

  if (!clickable) return content;

  return (
    <Pressable
      onPress={() => onPress(row)}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={styles.pressable}
    >
      {content}
    </Pressable>
  );
}

export function Table<T>({
  columns,
  data,
  keyExtractor,
  loading = false,
  emptyMessage = "Aucune donnée",
  onRowPress,
}: TableProps<T>) {
  const hasChevron = !!onRowPress;
  return (
    <View style={styles.container}>
      {/* En-tête */}
      <View style={styles.headerRow}>
        {columns.map((col) => (
          <View key={col.key} style={{ flex: col.flex ?? 1, alignItems: alignToFlex(col.align) }}>
            <Text variant="caption" tone="muted" weight="semibold">
              {col.title.toUpperCase()}
            </Text>
          </View>
        ))}
        {hasChevron ? <View style={styles.chevron} /> : null}
      </View>

      {/* Corps */}
      {loading ? (
        [0, 1, 2, 3, 4].map((i) => (
          <View key={i} style={[styles.row, i === 4 ? styles.rowLast : null]}>
            {columns.map((col) => (
              <View key={col.key} style={{ flex: col.flex ?? 1 }}>
                <Skeleton width="70%" height={14} />
              </View>
            ))}
            {hasChevron ? <View style={styles.chevron} /> : null}
          </View>
        ))
      ) : data.length === 0 ? (
        <View style={styles.empty}>
          <Text tone="muted">{emptyMessage}</Text>
        </View>
      ) : (
        data.map((row, i) => (
          <TableRow
            key={keyExtractor(row)}
            row={row}
            columns={columns}
            onPress={onRowPress}
            isLast={i === data.length - 1}
          />
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surfaceAlt,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowLast: { borderBottomWidth: 0 },
  rowHovered: { backgroundColor: colors.surfaceAlt },
  // cursor: pointer pour le web (ignoré sur natif)
  pressable: { cursor: "pointer" } as object,
  chevron: { width: 24, alignItems: "flex-end" },
  empty: { padding: spacing["3xl"], alignItems: "center" },
});