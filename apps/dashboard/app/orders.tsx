import { useState, useEffect } from "react";
import { ScrollView, View, StyleSheet, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, router } from "expo-router";
import {
  useGetOrders,
  useGetOrdersId,
  usePatchOrdersIdStatus,
  usePostOrders,
  useGetCustomers,
  useGetMenuItems,
  type UpdateOrderStatusStatus,
} from "@odyssey/api-client";
import {
  colors, spacing, radius,
  Text, Card, Badge, Button, Table, Modal, Select, Input, ConfirmDialog, useToast, useResponsive,
  FadeInView, useCountUp,
  type Column,
} from "@odyssey/shared";
import { addToCart, changeQty, cartTotal } from "../lib/cart";

type OrderLike = { id: string; status: string; totalCents: number; createdAt: string; customerId?: string };
type OrderItemLike = { id: string; nameSnapshot: string; unitPriceCents: number; quantity: number };
type CustomerLike = { id: string; firstName: string; lastName: string };
type MenuItemLike = { id: string; name: string; priceCents: number; available: boolean };
type CartLine = { menuItemId: string; quantity: number };

const STATUS_TONE: Record<string, "success" | "warning" | "error" | "info" | "neutral"> = {
  completed: "success", ready: "success", pending: "warning",
  accepted: "info", preparing: "info", cancelled: "error",
};
const STATUS_LABEL: Record<string, string> = {
  pending: "En attente", accepted: "Acceptée", preparing: "En préparation",
  ready: "Prête", completed: "Terminée", cancelled: "Annulée",
};
// Libellés à l'infinitif pour les boutons d'action (faire avancer le statut)
const ACTION_LABEL: Record<string, string> = {
  accepted: "Accepter", preparing: "Préparer", ready: "Marquer prête",
  completed: "Terminer", cancelled: "Annuler",
};
const ORDER_TRANSITIONS: Record<string, string[]> = {
  pending: ["accepted", "cancelled"],
  accepted: ["preparing", "cancelled"],
  preparing: ["ready", "cancelled"],
  ready: ["completed"],
  completed: [],
  cancelled: [],
};
const STATUS_FILTER_OPTIONS = [
  { label: "Tous les statuts", value: "all" },
  { label: "En attente", value: "pending" },
  { label: "Acceptée", value: "accepted" },
  { label: "En préparation", value: "preparing" },
  { label: "Prête", value: "ready" },
  { label: "Terminée", value: "completed" },
  { label: "Annulée", value: "cancelled" },
];

function euros(cents: number): string {
  return (cents / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
}
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
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

export default function Orders() {
  const { pagePadding } = useResponsive();
  const params = useLocalSearchParams<{ id?: string; customer?: string }>();

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [customerFilter, setCustomerFilter] = useState<string>("all");
  const [search, setSearch] = useState<string>("");
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const toast = useToast();

  // Synchroniser l'état avec les paramètres d'URL (navigation croisée)
  useEffect(() => {
    if (params.id) setSelectedId(params.id);
  }, [params.id]);
  useEffect(() => {
    if (params.customer) setCustomerFilter(params.customer);
  }, [params.customer]);

  const ordersQuery = useGetOrders();
  const orders = (ordersQuery.data?.data ?? []) as OrderLike[];
  const customersQuery = useGetCustomers();
  const customers = (customersQuery.data?.data ?? []) as CustomerLike[];
  const customerName = (id?: string) => {
    const c = customers.find((x) => x.id === id);
    return c ? `${c.firstName} ${c.lastName}` : "—";
  };

  const detailQuery = useGetOrdersId(selectedId ?? "", { query: { enabled: !!selectedId } });
  const detail = detailQuery.data?.data as (OrderLike & { items?: OrderItemLike[] }) | undefined;

  const patchStatus = usePatchOrdersIdStatus();
  const createOrderMut = usePostOrders();
  const menuQuery = useGetMenuItems();
  const menuItems = (menuQuery.data?.data ?? []) as MenuItemLike[];

  // Création de commande
  const [createOpen, setCreateOpen] = useState(false);
  const [newCustomerId, setNewCustomerId] = useState<string>("");
  const [cart, setCart] = useState<CartLine[]>([]);

  const availableMenu = menuItems.filter((m) => m.available);
  const handleAddToCart = (menuItemId: string) => setCart((prev) => addToCart(prev, menuItemId));
  const handleChangeQty = (menuItemId: string, delta: number) => setCart((prev) => changeQty(prev, menuItemId, delta));
  const total = cartTotal(cart, menuItems);
  const resetCreate = () => { setNewCustomerId(""); setCart([]); setCreateOpen(false); };

  const handleCreate = () => {
    if (!newCustomerId) { toast.show("Client requis", { tone: "warning", description: "Choisissez un client." }); return; }
    if (cart.length === 0) { toast.show("Panier vide", { tone: "warning", description: "Ajoutez au moins un plat." }); return; }
    createOrderMut.mutate(
      { data: { customerId: newCustomerId, items: cart } },
      {
        onSuccess: () => { toast.show("Commande créée", { tone: "success" }); resetCreate(); ordersQuery.refetch(); },
        onError: () => toast.show("Échec", { tone: "error", description: "La création a échoué." }),
      }
    );
  };

  // Stats
  const totalOrders = orders.length;
  const pendingCount = orders.filter((o) => o.status === "pending").length;
  const activeCount = orders.filter((o) => ["accepted", "preparing", "ready"].includes(o.status)).length;
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const todayRevenue = orders
    .filter((o) => o.status !== "cancelled" && new Date(o.createdAt).getTime() >= todayStart.getTime())
    .reduce((s, o) => s + (o.totalCents ?? 0), 0);

  // Filtres + recherche + tri
  let filtered = orders;
  if (statusFilter !== "all") filtered = filtered.filter((o) => o.status === statusFilter);
  if (customerFilter !== "all") filtered = filtered.filter((o) => o.customerId === customerFilter);
  if (search.trim()) {
    const q = search.toLowerCase();
    filtered = filtered.filter((o) =>
      o.id.toLowerCase().includes(q) || customerName(o.customerId).toLowerCase().includes(q)
    );
  }
  const sorted = [...filtered].sort((a, b) => {
    const d = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    return sortDir === "asc" ? d : -d;
  });

  const customerOptions = [
    { label: "Tous les clients", value: "all" },
    ...customers.map((c) => ({ label: `${c.firstName} ${c.lastName}`, value: c.id })),
  ];

  const columns: Column<OrderLike>[] = [
    { key: "id", title: "Commande", flex: 2, render: (o) => `#${o.id.slice(0, 8)}` },
    { key: "customer", title: "Client", flex: 2, render: (o) => customerName(o.customerId) },
    { key: "date", title: "Date", flex: 2, render: (o) => formatDate(o.createdAt) },
    { key: "status", title: "Statut", render: (o) => <Badge label={STATUS_LABEL[o.status] ?? o.status} tone={STATUS_TONE[o.status] ?? "neutral"} /> },
    { key: "total", title: "Total", align: "right", render: (o) => euros(o.totalCents ?? 0) },
  ];

  const closeDetail = () => {
    setSelectedId(null);
    // Nettoyer l'URL si on était arrivé via ?id=
    if (params.id) router.setParams({ id: undefined });
  };

  const handleStatusChange = (newStatus: string) => {
    if (!selectedId) return;
    patchStatus.mutate(
      { id: selectedId, data: { status: newStatus as UpdateOrderStatusStatus } },
      {
        onSuccess: () => {
          toast.show("Statut mis à jour", { tone: "success", description: `Commande passée en « ${STATUS_LABEL[newStatus]} ».` });
          ordersQuery.refetch();
          detailQuery.refetch();
        },
        onError: () => toast.show("Échec", { tone: "error", description: "La transition a échoué." }),
      }
    );
  };

  const nextStatuses = detail ? (ORDER_TRANSITIONS[detail.status] ?? []) : [];
  const activeCustomerName = customerFilter !== "all" ? customerName(customerFilter) : null;

  return (
    <ScrollView style={styles.page} contentContainerStyle={[styles.content, { padding: pagePadding }]}>
      <FadeInView delay={0}>
        <View style={styles.headerRow}>
          <View style={styles.header}>
            <Text variant="display">Commandes</Text>
            <Text variant="body" tone="muted">Gérez les commandes et leur statut.</Text>
          </View>
          <Button label="+ Nouvelle commande" onPress={() => setCreateOpen(true)} />
        </View>
      </FadeInView>

      <View style={styles.statsGrid}>
        <MiniStat icon="shopping-bag" label="Total" numValue={totalOrders} tone={{ bg: colors.primaryLight, fg: colors.primaryText }} delay={0} />
        <MiniStat icon="clock" label="En attente" numValue={pendingCount} tone={{ bg: colors.warningBg, fg: colors.warningFg }} delay={80} />
        <MiniStat icon="activity" label="En cours" numValue={activeCount} tone={{ bg: colors.infoBg, fg: colors.infoFg }} delay={160} />
        <MiniStat icon="trending-up" label="Revenu du jour" numValue={todayRevenue} format={euros} tone={{ bg: colors.successBg, fg: colors.successFg }} delay={240} />
      </View>

      {/* Filtres + recherche + tri */}
      <View style={styles.toolbar}>
        <View style={styles.searchWrap}>
          <Input placeholder="Rechercher (n° ou client)…" value={search} onChangeText={setSearch} />
        </View>
        <View style={styles.filterWrap}>
          <Select placeholder="Statut" value={statusFilter} onChange={setStatusFilter} options={STATUS_FILTER_OPTIONS} />
        </View>
        <View style={styles.filterWrap}>
          <Select placeholder="Client" value={customerFilter} onChange={setCustomerFilter} options={customerOptions} />
        </View>
        <Pressable style={styles.sortBtn} onPress={() => setSortDir((d) => d === "desc" ? "asc" : "desc")}>
          <Feather name={sortDir === "desc" ? "arrow-down" : "arrow-up"} size={15} color={colors.text} />
          <Text variant="caption">{sortDir === "desc" ? "Récent" : "Ancien"}</Text>
        </Pressable>
        <Text variant="caption" tone="muted">{sorted.length} commande{sorted.length > 1 ? "s" : ""}</Text>
      </View>

      {/* Bandeau filtre client actif (venant d'une navigation depuis le CRM) */}
      {activeCustomerName ? (
        <View style={styles.activeFilter}>
          <Feather name="filter" size={14} color={colors.primaryText} />
          <Text variant="caption" tone="primary">Commandes de {activeCustomerName}</Text>
          <Text variant="caption" tone="primary" weight="semibold" onPress={() => setCustomerFilter("all")}>  ✕ Retirer</Text>
        </View>
      ) : null}

      <FadeInView delay={320}>
        <Table
          columns={columns}
          data={sorted}
          keyExtractor={(o) => o.id}
          loading={ordersQuery.isLoading}
          emptyMessage="Aucune commande"
          onRowPress={(o) => setSelectedId(o.id)}
        />
      </FadeInView>

      <Modal
        visible={!!selectedId}
        onClose={closeDetail}
        title={detail ? `Commande #${detail.id.slice(0, 8)}` : "Chargement…"}
        footer={
          nextStatuses.length > 0 ? (
            <>
              {nextStatuses.map((st) => (
                <Button
                  key={st}
                  label={ACTION_LABEL[st] ?? st}
                  variant={st === "cancelled" ? "ghost" : "primary"}
                  onPress={() => st === "cancelled" ? setConfirmCancel(true) : handleStatusChange(st)}
                  loading={patchStatus.isPending}
                />
              ))}
            </>
          ) : (
            <Text variant="caption" tone="muted">Aucune action disponible</Text>
          )
        }
      >
        {detailQuery.isLoading ? (
          <Text tone="muted">Chargement du détail…</Text>
        ) : detail ? (
          <View style={styles.detailBody}>
            <View style={styles.detailRow}>
              <Text variant="label" tone="muted">Client</Text>
              <Text variant="label" weight="semibold">{customerName(detail.customerId)}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text variant="label" tone="muted">Statut</Text>
              <Badge label={STATUS_LABEL[detail.status] ?? detail.status} tone={STATUS_TONE[detail.status] ?? "neutral"} />
            </View>
            <View style={styles.detailRow}>
              <Text variant="label" tone="muted">Date</Text>
              <Text variant="label">{formatDate(detail.createdAt)}</Text>
            </View>
            <View style={styles.divider} />
            <Text variant="label" weight="semibold" tone="muted">Articles</Text>
            {(detail.items ?? []).map((it) => (
              <View key={it.id} style={styles.itemRow}>
                <Text variant="label">{it.quantity} × {it.nameSnapshot}</Text>
                <Text variant="label">{euros(it.unitPriceCents * it.quantity)}</Text>
              </View>
            ))}
            <View style={styles.divider} />
            <View style={styles.detailRow}>
              <Text variant="heading">Total</Text>
              <Text variant="heading" weight="bold">{euros(detail.totalCents ?? 0)}</Text>
            </View>
          </View>
        ) : (
          <Text tone="muted">Commande introuvable</Text>
        )}
      </Modal>

      {/* Modale : créer une commande */}
      <Modal
        visible={createOpen}
        onClose={resetCreate}
        title="Nouvelle commande"
        footer={
          <>
            <Button label="Annuler" variant="ghost" onPress={resetCreate} />
            <Button label={`Créer (${euros(total)})`} onPress={handleCreate} loading={createOrderMut.isPending} />
          </>
        }
      >
        <View style={styles.createBody}>
          <Select
            label="Client"
            placeholder="Choisir un client"
            value={newCustomerId}
            onChange={setNewCustomerId}
            options={customers.map((c) => ({ label: `${c.firstName} ${c.lastName}`, value: c.id }))}
          />

          <Text variant="label" weight="semibold" tone="muted">Ajouter des plats</Text>
          <View style={styles.menuPicker}>
            {availableMenu.map((m) => (
              <Pressable key={m.id} style={styles.menuChip} onPress={() => handleAddToCart(m.id)}>
                <Feather name="plus" size={13} color={colors.primaryText} />
                <Text variant="caption" weight="medium">{m.name}</Text>
                <Text variant="caption" tone="muted">{euros(m.priceCents)}</Text>
              </Pressable>
            ))}
          </View>

          {cart.length > 0 ? (
            <View style={styles.cart}>
              <Text variant="label" weight="semibold" tone="muted">Panier</Text>
              {cart.map((l) => {
                const m = menuItems.find((x) => x.id === l.menuItemId);
                if (!m) return null;
                return (
                  <View key={l.menuItemId} style={styles.cartLine}>
                    <Text variant="label" style={{ flex: 1 }}>{m.name}</Text>
                    <View style={styles.qtyControls}>
                      <Pressable style={styles.qtyBtn} onPress={() => handleChangeQty(l.menuItemId, -1)}>
                        <Feather name="minus" size={14} color={colors.text} />
                      </Pressable>
                      <Text variant="label" weight="semibold">{l.quantity}</Text>
                      <Pressable style={styles.qtyBtn} onPress={() => handleChangeQty(l.menuItemId, 1)}>
                        <Feather name="plus" size={14} color={colors.text} />
                      </Pressable>
                    </View>
                    <Text variant="label" weight="semibold" style={styles.cartPrice}>{euros(m.priceCents * l.quantity)}</Text>
                  </View>
                );
              })}
              <View style={styles.divider} />
              <View style={styles.detailRow}>
                <Text variant="heading">Total</Text>
                <Text variant="heading" weight="bold">{euros(total)}</Text>
              </View>
            </View>
          ) : (
            <Text variant="caption" tone="muted">Aucun plat ajouté.</Text>
          )}
        </View>
      </Modal>

      <ConfirmDialog
        visible={confirmCancel}
        title="Annuler cette commande ?"
        message="La commande sera définitivement annulée. Cette action est irréversible."
        confirmLabel="Annuler la commande"
        cancelLabel="Retour"
        destructive
        loading={patchStatus.isPending}
        onConfirm={() => { handleStatusChange("cancelled"); setConfirmCancel(false); }}
        onCancel={() => setConfirmCancel(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  content: { gap: spacing["2xl"], maxWidth: 1100, minWidth: 680, width: "100%", marginHorizontal: "auto" },
  header: { gap: spacing.xs },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: spacing.md },
  createBody: { gap: spacing.md },
  menuPicker: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  menuChip: { flexDirection: "row", alignItems: "center", gap: spacing.xs, backgroundColor: colors.primaryLight, paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: radius.full },
  cart: { gap: spacing.sm, marginTop: spacing.sm },
  cartLine: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  qtyControls: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  qtyBtn: { width: 28, height: 28, borderRadius: radius.sm, backgroundColor: colors.surfaceAlt, alignItems: "center", justifyContent: "center" },
  cartPrice: { width: 70, textAlign: "right" },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  statCard: { flex: 1, minWidth: 160 },
  statRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  statIcon: { width: 38, height: 38, borderRadius: radius.md, alignItems: "center", justifyContent: "center" },
  toolbar: { flexDirection: "row", alignItems: "center", gap: spacing.md, flexWrap: "wrap" },
  filterWrap: { width: 200 },
  searchWrap: { flex: 1, minWidth: 200 },
  sortBtn: { flexDirection: "row", alignItems: "center", gap: spacing.xs, paddingVertical: spacing.md, paddingHorizontal: spacing.lg, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.surface },
  activeFilter: { flexDirection: "row", alignItems: "center", gap: spacing.xs, backgroundColor: colors.primaryLight, paddingVertical: spacing.sm, paddingHorizontal: spacing.lg, borderRadius: radius.md, alignSelf: "flex-start" },
  detailBody: { gap: spacing.md },
  detailRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  itemRow: { flexDirection: "row", justifyContent: "space-between" },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.xs },
});