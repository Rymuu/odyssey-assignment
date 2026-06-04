import { ScrollView, View, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import {
  useGetOrders,
  useGetCustomers,
  useGetMenuItems,
} from "@odyssey/api-client";
import {
  colors,
  spacing,
  radius,
  Text,
  Card,
  Badge,
  Table,
  type Column,
} from "@odyssey/shared";

// Types souples : on lit les champs attendus sans dépendre du type exact généré.
type OrderLike = {
  id: string;
  status: string;
  totalCents: number;
  createdAt: string;
  customerId?: string;
};

const STATUS_TONE: Record<string, "success" | "warning" | "error" | "info" | "neutral"> = {
  completed: "success",
  ready: "success",
  pending: "warning",
  accepted: "info",
  preparing: "info",
  cancelled: "error",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "En attente",
  accepted: "Acceptée",
  preparing: "En préparation",
  ready: "Prête",
  completed: "Terminée",
  cancelled: "Annulée",
};

function euros(cents: number): string {
  return (cents / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
}

function KpiCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value: string;
  tone: { bg: string; fg: string };
}) {
  return (
    <View style={styles.kpiCard}>
      <Card elevation="sm" padding="xl">
        <View style={styles.kpiRow}>
          <View style={[styles.kpiIcon, { backgroundColor: tone.bg }]}>
            <Feather name={icon} size={20} color={tone.fg} />
          </View>
          <View style={styles.kpiText}>
            <Text variant="caption" tone="muted">{label}</Text>
            <Text variant="title" weight="bold">{value}</Text>
          </View>
        </View>
      </Card>
    </View>
  );
}

export default function Home() {
  const ordersQuery = useGetOrders();
  const customersQuery = useGetCustomers();
  const menuQuery = useGetMenuItems();

  const orders = (ordersQuery.data?.data ?? []) as OrderLike[];
  const customers = (customersQuery.data?.data ?? []) as unknown[];
  const menuItems = (menuQuery.data?.data ?? []) as unknown[];

  // KPIs
  const totalOrders = orders.length;
  const revenue = orders
    .filter((o) => o.status !== "cancelled")
    .reduce((sum, o) => sum + (o.totalCents ?? 0), 0);
  const pendingCount = orders.filter((o) => o.status === "pending").length;
  const menuCount = menuItems.length;

  // 5 dernières commandes
  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const columns: Column<OrderLike>[] = [
    { key: "id", title: "Commande", flex: 2, render: (o) => `#${o.id.slice(0, 8)}` },
    {
      key: "status",
      title: "Statut",
      render: (o) => <Badge label={STATUS_LABEL[o.status] ?? o.status} tone={STATUS_TONE[o.status] ?? "neutral"} />,
    },
    { key: "total", title: "Total", align: "right", render: (o) => euros(o.totalCents ?? 0) },
  ];

  const loading = ordersQuery.isLoading || customersQuery.isLoading || menuQuery.isLoading;

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text variant="display">Tableau de bord</Text>
        <Text variant="body" tone="muted">Vue d'ensemble de l'activité du restaurant.</Text>
      </View>

      {/* KPIs */}
      <View style={styles.kpiGrid}>
        <KpiCard icon="shopping-bag" label="Commandes" value={String(totalOrders)} tone={{ bg: colors.primaryLight, fg: colors.primaryText }} />
        <KpiCard icon="dollar-sign" label="Revenu" value={euros(revenue)} tone={{ bg: colors.successBg, fg: colors.successFg }} />
        <KpiCard icon="clock" label="En attente" value={String(pendingCount)} tone={{ bg: colors.warningBg, fg: colors.warningFg }} />
        <KpiCard icon="book-open" label="Plats au menu" value={String(menuCount)} tone={{ bg: colors.infoBg, fg: colors.infoFg }} />
      </View>

      {/* Dernières commandes */}
      <View style={styles.sectionBlock}>
        <Text variant="heading">Dernières commandes</Text>
        <Table
          columns={columns}
          data={recentOrders}
          keyExtractor={(o) => o.id}
          loading={loading}
          emptyMessage="Aucune commande pour le moment"
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing["3xl"], gap: spacing["3xl"], maxWidth: 1100, width: "100%" },
  header: { gap: spacing.xs },
  kpiGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.lg },
  kpiCard: { flex: 1, minWidth: 200 },
  kpiRow: { flexDirection: "row", alignItems: "center", gap: spacing.lg },
  kpiIcon: {
    width: 44, height: 44, borderRadius: radius.md,
    alignItems: "center", justifyContent: "center",
  },
  kpiText: { gap: 2 },
  sectionBlock: { gap: spacing.md },
});