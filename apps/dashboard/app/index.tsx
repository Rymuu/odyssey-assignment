import { ScrollView, View, StyleSheet, Image } from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import {
  useGetOrders,
  useGetCustomers,
  useGetMenuItems,
  useGetStatsPopularItems,
} from "@odyssey/api-client";
import {
  colors, spacing, radius,
  Text, Card, Badge, Table, BarChart, DonutChart, useResponsive,
  FadeInView, useCountUp,
  type Column, type BarDatum, type DonutSegment,
} from "@odyssey/shared";
import { totalRevenue, completionRate, averageBasket } from "../lib/stats";

type OrderLike = { id: string; status: string; totalCents: number; createdAt: string };
type PopularItemLike = { id: string; name: string; priceCents: number; imageUrl?: string | null; orderCount: number };

const STATUS_TONE: Record<string, "success" | "warning" | "error" | "info" | "neutral"> = {
  completed: "success", ready: "success",
  pending: "warning", accepted: "info", preparing: "info", cancelled: "error",
};
const STATUS_LABEL: Record<string, string> = {
  pending: "En attente", accepted: "Acceptée", preparing: "En préparation",
  ready: "Prête", completed: "Terminée", cancelled: "Annulée",
};
// Palette pastel distincte (validée)
const STATUS_COLOR: Record<string, string> = {
  completed: "#7FC8A0", ready: "#A8D8C0", pending: "#F4C97A",
  preparing: "#88AEE0", accepted: "#B0C8EC", cancelled: "#EF9E8C",
};
const DAY_LABELS = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

function euros(cents: number): string {
  return (cents / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
}

function KpiCard({ icon, label, value, format, tone, delay = 0 }: {
  icon: keyof typeof Feather.glyphMap; label: string; value: number;
  format?: (n: number) => string; tone: { bg: string; fg: string }; delay?: number;
}) {
  const animated = useCountUp(value, 800, delay);
  const display = format ? format(animated) : String(animated);
  return (
    <FadeInView delay={delay} style={styles.kpiCard}>
      <Card elevation="sm" padding="xl">
        <View style={styles.kpiRow}>
          <View style={[styles.kpiIcon, { backgroundColor: tone.bg }]}>
            <Feather name={icon} size={20} color={tone.fg} />
          </View>
          <View style={styles.kpiText}>
            <Text variant="caption" tone="muted">{label}</Text>
            <Text variant="title" weight="bold">{display}</Text>
          </View>
        </View>
      </Card>
    </FadeInView>
  );
}

function StatRow({ icon, label, value }: { icon: keyof typeof Feather.glyphMap; label: string; value: string }) {
  return (
    <View style={styles.statRow}>
      <View style={styles.statLeft}>
        <Feather name={icon} size={16} color={colors.textMuted} />
        <Text variant="label" tone="muted">{label}</Text>
      </View>
      <Text variant="label" weight="semibold">{value}</Text>
    </View>
  );
}

function PopularItemRow({ item }: { item: PopularItemLike }) {
  return (
    <View style={styles.popularRow}>
      {item.imageUrl ? (
        <Image source={{ uri: item.imageUrl }} style={styles.popularImage} resizeMode="cover" />
      ) : (
        <View style={[styles.popularImage, { backgroundColor: colors.surfaceAlt }]} />
      )}
      <View style={styles.popularInfo}>
        <Text variant="label" weight="semibold" numberOfLines={1}>{item.name}</Text>
        <Text variant="label" weight="bold" tone="primary">{euros(item.priceCents)}</Text>
      </View>
      <View style={styles.popularMeta}>
        <Feather name="shopping-bag" size={13} color={colors.textMuted} />
        <Text variant="caption" tone="muted">{item.orderCount}</Text>
      </View>
    </View>
  );
}

export default function Home() {
  const { pagePadding } = useResponsive();

  const ordersQuery = useGetOrders();
  const customersQuery = useGetCustomers();
  const menuQuery = useGetMenuItems();
  const popularQuery = useGetStatsPopularItems();

  const orders = (ordersQuery.data?.data ?? []) as OrderLike[];
  const customers = (customersQuery.data?.data ?? []) as unknown[];
  const menuItems = (menuQuery.data?.data ?? []) as unknown[];
  const popularItems = (popularQuery.data?.data ?? []) as PopularItemLike[];

  const totalOrders = orders.length;
  const validOrders = orders.filter((o) => o.status !== "cancelled");
  const revenue = totalRevenue(orders);
  const pendingCount = orders.filter((o) => o.status === "pending").length;
  const menuCount = menuItems.length;

  // Indicateurs clés (calculs purs extraits dans lib/stats)
  const avgBasket = averageBasket(orders);
  const completionPercent = completionRate(orders);
  const cancelledCount = orders.filter((o) => o.status === "cancelled").length;

  // Revenu par jour
  const now = new Date();
  const revenueData: BarDatum[] = [];
  for (let offset = 6; offset >= 0; offset--) {
    const day = new Date(now);
    day.setDate(day.getDate() - offset);
    const start = new Date(day); start.setHours(0, 0, 0, 0);
    const end = new Date(day); end.setHours(23, 59, 59, 999);
    const value = validOrders
      .filter((o) => { const t = new Date(o.createdAt).getTime(); return t >= start.getTime() && t <= end.getTime(); })
      .reduce((s, o) => s + (o.totalCents ?? 0), 0);
    revenueData.push({ label: DAY_LABELS[day.getDay()], value });
  }

  // Répartition par statut
  const statusCounts: Record<string, number> = {};
  orders.forEach((o) => { statusCounts[o.status] = (statusCounts[o.status] ?? 0) + 1; });
  const statusData: DonutSegment[] = Object.entries(statusCounts).map(([status, count]) => ({
    label: STATUS_LABEL[status] ?? status, value: count, color: STATUS_COLOR[status] ?? colors.textMuted,
  }));

  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6);

  const columns: Column<OrderLike>[] = [
    { key: "id", title: "Commande", flex: 2, render: (o) => `#${o.id.slice(0, 8)}` },
    { key: "status", title: "Statut", render: (o) => <Badge label={STATUS_LABEL[o.status] ?? o.status} tone={STATUS_TONE[o.status] ?? "neutral"} /> },
    { key: "total", title: "Total", align: "right", render: (o) => euros(o.totalCents ?? 0) },
  ];

  const loading = ordersQuery.isLoading || customersQuery.isLoading || menuQuery.isLoading;

  return (
    <ScrollView style={styles.page} contentContainerStyle={[styles.content, { padding: pagePadding }]}>
      <FadeInView delay={0}>
        <View style={styles.header}>
          <Text variant="display">Tableau de bord</Text>
          <Text variant="body" tone="muted">Vue d'ensemble de l'activité du restaurant.</Text>
        </View>
      </FadeInView>

      <View style={styles.kpiGrid}>
        <KpiCard icon="shopping-bag" label="Commandes" value={totalOrders} tone={{ bg: colors.primaryLight, fg: colors.primaryText }} delay={0} />
        <KpiCard icon="trending-up" label="Revenu" value={revenue} format={euros} tone={{ bg: colors.successBg, fg: colors.successFg }} delay={80} />
        <KpiCard icon="clock" label="En attente" value={pendingCount} tone={{ bg: colors.warningBg, fg: colors.warningFg }} delay={160} />
        <KpiCard icon="book-open" label="Plats au menu" value={menuCount} tone={{ bg: colors.infoBg, fg: colors.infoFg }} delay={240} />
      </View>

      {/* Mise en page 2 colonnes : graphiques à gauche, panneaux à droite */}
      <View style={styles.mainGrid}>
        {/* Colonne gauche : graphiques empilés */}
        <View style={styles.leftCol}>
          <FadeInView delay={320}>
            <Card elevation="sm" padding="xl">
              <View style={styles.cardHeader}>
                <Text variant="heading">Revenu</Text>
                <Text variant="caption" tone="muted">7 derniers jours</Text>
              </View>
              <BarChart data={revenueData} formatValue={euros} />
            </Card>
          </FadeInView>

          <FadeInView delay={380}>
            <Card elevation="sm" padding="xl">
              <View style={styles.cardHeader}>
                <Text variant="heading">Répartition des commandes</Text>
                <Text variant="caption" tone="muted">Par statut</Text>
              </View>
              {statusData.length > 0 ? <DonutChart data={statusData} /> : <Text variant="body" tone="muted">Aucune donnée</Text>}
            </Card>
          </FadeInView>
        </View>

        {/* Colonne droite : plats populaires, indicateurs, dernières commandes */}
        <View style={styles.rightCol}>
          <FadeInView delay={360} style={styles.panel}>
            <Text variant="heading">Plats populaires</Text>
            <Card elevation="sm" padding="lg">
              <View style={styles.popularList}>
                {popularItems.length > 0 ? popularItems.map((it) => (
                  <PopularItemRow key={it.id} item={it} />
                )) : <Text variant="caption" tone="muted">Aucune donnée</Text>}
              </View>
            </Card>
          </FadeInView>

          <FadeInView delay={420} style={styles.panel}>
            <Text variant="heading">Indicateurs clés</Text>
            <Card elevation="sm" padding="xl">
              <View style={styles.statsList}>
                <StatRow icon="shopping-cart" label="Panier moyen" value={euros(avgBasket)} />
                <View style={styles.statDivider} />
                <StatRow icon="users" label="Clients" value={String(customers.length)} />
                <View style={styles.statDivider} />
                <StatRow icon="check-circle" label="Taux de complétion" value={`${completionPercent} %`} />
                <View style={styles.statDivider} />
                <StatRow icon="x-circle" label="Commandes annulées" value={String(cancelledCount)} />
              </View>
            </Card>
          </FadeInView>

          <FadeInView delay={480} style={styles.panel}>
            <Text variant="heading">Dernières commandes</Text>
            <Table columns={columns} data={recentOrders} keyExtractor={(o) => o.id} loading={loading} emptyMessage="Aucune commande pour le moment" onRowPress={(o) => router.push({ pathname: "/orders", params: { id: o.id } })} />
          </FadeInView>
        </View>
      </View>


    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  content: { gap: spacing["2xl"], maxWidth: 1200, minWidth: 680, width: "100%", marginHorizontal: "auto" },
  header: { gap: spacing.xs },
  kpiGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.lg },
  kpiCard: { flex: 1, minWidth: 200 },
  kpiRow: { flexDirection: "row", alignItems: "center", gap: spacing.lg },
  kpiIcon: { width: 44, height: 44, borderRadius: radius.md, alignItems: "center", justifyContent: "center" },
  kpiText: { gap: 2 },
  mainGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.lg, alignItems: "flex-start" },
  leftCol: { flex: 2, minWidth: 340, gap: spacing.lg },
  rightCol: { flex: 1, minWidth: 300, gap: spacing["2xl"] },
  panel: { gap: spacing.md },
  cardHeader: { gap: 2, marginBottom: spacing.lg },
  popularList: { gap: spacing.md },
  popularRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  popularImage: { width: 48, height: 48, borderRadius: radius.md },
  popularInfo: { flex: 1, gap: 2 },
  popularMeta: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  statsList: { gap: spacing.sm },
  statRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  statLeft: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  statDivider: { height: 1, backgroundColor: colors.border },
});