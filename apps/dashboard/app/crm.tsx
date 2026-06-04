import { useState } from "react";
import { ScrollView, View, StyleSheet, Pressable } from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import {
  useGetCustomers,
  useGetCustomersId,
} from "@odyssey/api-client";
import {
  colors, spacing, radius,
  Text, Card, Badge, Table, Modal, Input,
  type Column, useResponsive,
  FadeInView, useCountUp,
} from "@odyssey/shared";

type CustomerLike = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  orderCount?: number;
  totalSpentCents?: number;
};
type OrderLike = { id: string; status: string; totalCents: number; createdAt: string };

const STATUS_TONE: Record<string, "success" | "warning" | "error" | "info" | "neutral"> = {
  completed: "success", ready: "success", pending: "warning",
  accepted: "info", preparing: "info", cancelled: "error",
};
const STATUS_LABEL: Record<string, string> = {
  pending: "En attente", accepted: "Acceptée", preparing: "En préparation",
  ready: "Prête", completed: "Terminée", cancelled: "Annulée",
};

function euros(cents: number): string {
  return (cents / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
}
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}
function initials(c: CustomerLike): string {
  return `${c.firstName?.[0] ?? ""}${c.lastName?.[0] ?? ""}`.toUpperCase();
}

function MiniStat({ icon, label, numValue, format, tone, delay = 0 }: {
  icon: keyof typeof Feather.glyphMap; label: string; numValue: number;
  format?: (n: number) => string; tone: { bg: string; fg: string }; delay?: number;
}) {
  const animated = useCountUp(numValue, 800, delay);
  const display = format ? format(animated) : String(animated);
  return (
    <FadeInView delay={delay} style={styles.statCard}>
      <Card elevation="sm" padding="lg">
        <View style={styles.statRow}>
          <View style={[styles.statIcon, { backgroundColor: tone.bg }]}>
            <Feather name={icon} size={18} color={tone.fg} />
          </View>
          <View style={{ gap: 2 }}>
            <Text variant="caption" tone="muted">{label}</Text>
            <Text variant="heading" weight="bold">{display}</Text>
          </View>
        </View>
      </Card>
    </FadeInView>
  );
}

export default function CRM() {
  const { pagePadding } = useResponsive();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState<string>("");

  const customersQuery = useGetCustomers();
  const customers = (customersQuery.data?.data ?? []) as CustomerLike[];

  // Stats CRM
  const totalCustomers = customers.length;
  const totalSpent = customers.reduce((sum, c) => sum + (c.totalSpentCents ?? 0), 0);
  const totalOrders = customers.reduce((sum, c) => sum + (c.orderCount ?? 0), 0);
  const avgPerCustomer = totalCustomers ? totalSpent / totalCustomers : 0;

  const filteredCustomers = search.trim()
    ? customers.filter((c) => {
        const q = search.toLowerCase();
        return `${c.firstName} ${c.lastName}`.toLowerCase().includes(q) || c.email.toLowerCase().includes(q);
      })
    : customers;

  const detailQuery = useGetCustomersId(selectedId ?? "", { query: { enabled: !!selectedId } });
  const detail = detailQuery.data?.data as (CustomerLike & { orders?: OrderLike[] }) | undefined;

  const columns: Column<CustomerLike>[] = [
    {
      key: "name", title: "Client", flex: 3,
      render: (c) => (
        <View style={styles.clientCell}>
          <View style={styles.avatar}><Text variant="caption" weight="bold" style={{ color: colors.primaryText }}>{initials(c)}</Text></View>
          <View>
            <Text variant="label" weight="semibold">{c.firstName} {c.lastName}</Text>
            <Text variant="caption" tone="muted">{c.email}</Text>
          </View>
        </View>
      ),
    },
    { key: "orders", title: "Commandes", align: "center", render: (c) => String(c.orderCount ?? 0) },
    { key: "spent", title: "Dépenses", align: "right", render: (c) => euros(c.totalSpentCents ?? 0) },
  ];

  return (
    <ScrollView style={styles.page} contentContainerStyle={[styles.content, { padding: pagePadding }]}>
      <FadeInView delay={0}>
        <View style={styles.header}>
          <Text variant="display">Clients</Text>
          <Text variant="body" tone="muted">Votre base clients et leur historique.</Text>
        </View>
      </FadeInView>

      <View style={styles.statsGrid}>
        <MiniStat icon="users" label="Clients" numValue={totalCustomers} tone={{ bg: colors.primaryLight, fg: colors.primaryText }} delay={0} />
        <MiniStat icon="shopping-bag" label="Commandes totales" numValue={totalOrders} tone={{ bg: colors.infoBg, fg: colors.infoFg }} delay={80} />
        <MiniStat icon="trending-up" label="CA total" numValue={totalSpent} format={euros} tone={{ bg: colors.successBg, fg: colors.successFg }} delay={160} />
        <MiniStat icon="user-check" label="Panier moyen / client" numValue={avgPerCustomer} format={euros} tone={{ bg: colors.warningBg, fg: colors.warningFg }} delay={240} />
      </View>

      <View style={styles.searchWrap}>
        <Input placeholder="Rechercher un client (nom ou email)…" value={search} onChangeText={setSearch} />
      </View>

      <FadeInView delay={320}>
      <Table
        columns={columns}
        data={filteredCustomers}
        keyExtractor={(c) => c.id}
        loading={customersQuery.isLoading}
        emptyMessage="Aucun client"
        onRowPress={(c) => setSelectedId(c.id)}
      />
      </FadeInView>

      {/* Fiche client */}
      <Modal
        visible={!!selectedId}
        onClose={() => setSelectedId(null)}
        title={detail ? `${detail.firstName} ${detail.lastName}` : "Chargement…"}
      >
        {detailQuery.isLoading ? (
          <Text tone="muted">Chargement…</Text>
        ) : detail ? (
          <View style={styles.detailBody}>
            <View style={styles.detailRow}><Text variant="label" tone="muted">Email</Text><Text variant="label">{detail.email}</Text></View>
            {detail.phone ? <View style={styles.detailRow}><Text variant="label" tone="muted">Téléphone</Text><Text variant="label">{detail.phone}</Text></View> : null}
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text variant="title" weight="bold">{detail.orderCount ?? (detail.orders?.length ?? 0)}</Text>
                <Text variant="caption" tone="muted">Commandes</Text>
              </View>
              <View style={styles.statBox}>
                <Text variant="title" weight="bold">{euros(detail.totalSpentCents ?? 0)}</Text>
                <Text variant="caption" tone="muted">Total dépensé</Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.recentHeader}>
              <Text variant="label" weight="semibold" tone="muted">Commandes récentes</Text>
              <Text variant="caption" tone="primary" weight="semibold" onPress={() => { const id = detail.id; setSelectedId(null); router.push({ pathname: "/orders", params: { customer: id } }); }}>
                Voir toutes →
              </Text>
            </View>
            {(detail.orders ?? []).slice(0, 5).map((o) => (
              <Pressable
                key={o.id}
                style={styles.orderRow}
                onPress={() => { setSelectedId(null); router.push({ pathname: "/orders", params: { id: o.id } }); }}
              >
                <Text variant="caption" tone="muted">{formatDate(o.createdAt)}</Text>
                <Badge label={STATUS_LABEL[o.status] ?? o.status} tone={STATUS_TONE[o.status] ?? "neutral"} />
                <Text variant="label" weight="semibold">{euros(o.totalCents ?? 0)}</Text>
                <Feather name="chevron-right" size={14} color={colors.textSubtle} />
              </Pressable>
            ))}
            {(detail.orders ?? []).length === 0 ? <Text variant="caption" tone="muted">Aucune commande</Text> : null}
          </View>
        ) : (
          <Text tone="muted">Client introuvable</Text>
        )}
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  content: { gap: spacing["2xl"], maxWidth: 1100, minWidth: 680, width: "100%", marginHorizontal: "auto" },
  header: { gap: spacing.xs },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  statCard: { flex: 1, minWidth: 160 },
  statRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  statIcon: { width: 38, height: 38, borderRadius: radius.md, alignItems: "center", justifyContent: "center" },
  searchWrap: { maxWidth: 360 },
  clientCell: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  avatar: { width: 36, height: 36, borderRadius: radius.full, backgroundColor: colors.primaryLight, alignItems: "center", justifyContent: "center" },
  detailBody: { gap: spacing.md },
  detailRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  statsRow: { flexDirection: "row", gap: spacing.lg, marginVertical: spacing.sm },
  statBox: { flex: 1, alignItems: "center", padding: spacing.lg, backgroundColor: colors.surfaceAlt, borderRadius: radius.md, gap: 2 },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.xs },
  orderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: spacing.sm, paddingVertical: spacing.xs },
  recentHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
});