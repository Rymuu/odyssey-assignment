import { type ReactNode } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { colors, spacing, radius } from "../theme/tokens";
import { Text } from "./Text";
import { Skeleton } from "./Skeleton";

// Définition d'une colonne : titre, largeur relative (flex),
// alignement, et comment rendre la cellule depuis une ligne.
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

// Tableau générique réutilisable (Orders, CRM…).
// En RN il n'y a pas de <table> : on aligne des lignes via flexbox.
export function Table<T>({
  columns,
  data,
  keyExtractor,
  loading = false,
  emptyMessage = "Aucune donnée",
  onRowPress,
}: TableProps<T>) {
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
      </View>

      {/* Corps */}
      {loading ? (
        [0, 1, 2, 3, 4].map((i) => (
          <View key={i} style={styles.row}>
            {columns.map((col) => (
              <View key={col.key} style={{ flex: col.flex ?? 1 }}>
                <Skeleton width="70%" height={14} />
              </View>
            ))}
          </View>
        ))
      ) : data.length === 0 ? (
        <View style={styles.empty}>
          <Text tone="muted">{emptyMessage}</Text>
        </View>
      ) : (
        data.map((row) => {
          const cells = (
            <View style={styles.row}>
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
            </View>
          );
          return onRowPress ? (
            <Pressable key={keyExtractor(row)} onPress={() => onRowPress(row)}>
              {cells}
            </Pressable>
          ) : (
            <View key={keyExtractor(row)}>{cells}</View>
          );
        })
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
  empty: { padding: spacing["3xl"], alignItems: "center" },
});