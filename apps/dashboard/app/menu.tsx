import { useState } from "react";
import { ScrollView, View, StyleSheet, Pressable, Image } from "react-native";
import {
  useGetCategories,
  useGetMenuItems,
  usePostMenuItems,
  usePatchMenuItemsId,
  useDeleteMenuItemsId,
} from "@odyssey/api-client";
import {
  colors, spacing, radius,
  Text, Card, Badge, Button, Input, Select, Modal, ConfirmDialog, useToast, useResponsive,
  FadeInView,
} from "@odyssey/shared";

type CategoryLike = { id: string; name: string };
type MenuItemLike = {
  id: string;
  categoryId: string;
  name: string;
  description?: string | null;
  priceCents: number;
  available: boolean;
  imageUrl?: string | null;
};

function euros(cents: number): string {
  return (cents / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
}

type FormState = { id?: string; name: string; description: string; priceEuros: string; categoryId: string; available: boolean; imageUrl: string };
const EMPTY_FORM: FormState = { name: "", description: "", priceEuros: "", categoryId: "", available: true, imageUrl: "" };

function MenuItemCard({
  item,
  onEdit,
  onToggle,
}: {
  item: MenuItemLike;
  onEdit: () => void;
  onToggle: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <Pressable
      style={[styles.itemCard, hovered ? styles.itemCardHovered : null]}
      onPress={onEdit}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
    >
      <Card elevation={hovered ? "lg" : "sm"} padding="none">
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.itemImage} resizeMode="cover" />
        ) : (
          <View style={styles.itemImagePlaceholder} />
        )}
        <View style={styles.itemContent}>
          <View style={styles.itemHeader}>
            <Text variant="label" weight="semibold">{item.name}</Text>
            <Text variant="label" weight="bold">{euros(item.priceCents)}</Text>
          </View>
          {item.description ? <Text variant="caption" tone="muted">{item.description}</Text> : null}
          <View style={styles.itemFooter}>
            <Badge label={item.available ? "Disponible" : "Indisponible"} tone={item.available ? "success" : "neutral"} />
            <Pressable onPress={onToggle}>
              <Text variant="caption" tone="primary">{item.available ? "Masquer" : "Activer"}</Text>
            </Pressable>
          </View>
        </View>
      </Card>
    </Pressable>
  );
}

export default function Menu() {
  const { pagePadding } = useResponsive();
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const toast = useToast();

  const categoriesQuery = useGetCategories();
  const menuQuery = useGetMenuItems();
  const categories = (categoriesQuery.data?.data ?? []) as CategoryLike[];
  const items = (menuQuery.data?.data ?? []) as MenuItemLike[];

  const createItem = usePostMenuItems();
  const updateItem = usePatchMenuItemsId();
  const deleteItem = useDeleteMenuItemsId();

  const refetch = () => menuQuery.refetch();

  const openCreate = () => { setForm({ ...EMPTY_FORM, categoryId: categories[0]?.id ?? "" }); setModalOpen(true); };
  const openEdit = (it: MenuItemLike) => {
    setForm({ id: it.id, name: it.name, description: it.description ?? "", priceEuros: (it.priceCents / 100).toFixed(2), categoryId: it.categoryId, available: it.available, imageUrl: it.imageUrl ?? "" });
    setModalOpen(true);
  };

  const handleSave = () => {
    const priceCents = Math.round(parseFloat(form.priceEuros.replace(",", ".")) * 100);
    if (!form.name || isNaN(priceCents) || !form.categoryId) {
      toast.show("Champs manquants", { tone: "warning", description: "Nom, prix et catégorie sont requis." });
      return;
    }
    const payload = { name: form.name, description: form.description || undefined, priceCents, categoryId: form.categoryId, available: form.available, imageUrl: form.imageUrl || undefined };
    if (form.id) {
      updateItem.mutate({ id: form.id, data: payload }, {
        onSuccess: () => { toast.show("Plat modifié", { tone: "success" }); setModalOpen(false); refetch(); },
        onError: () => toast.show("Échec", { tone: "error" }),
      });
    } else {
      createItem.mutate({ data: payload }, {
        onSuccess: () => { toast.show("Plat ajouté", { tone: "success" }); setModalOpen(false); refetch(); },
        onError: () => toast.show("Échec", { tone: "error" }),
      });
    }
  };

  const requestDelete = () => setConfirmDelete(true);
  const handleDelete = () => {
    if (!form.id) return;
    deleteItem.mutate({ id: form.id }, {
      onSuccess: () => { toast.show("Plat supprimé", { tone: "success" }); setConfirmDelete(false); setModalOpen(false); refetch(); },
      onError: () => { toast.show("Échec", { tone: "error" }); setConfirmDelete(false); },
    });
  };

  const toggleAvailable = (it: MenuItemLike) => {
    updateItem.mutate({ id: it.id, data: { available: !it.available } }, {
      onSuccess: () => { toast.show(it.available ? "Plat masqué" : "Plat disponible", { tone: "info" }); refetch(); },
      onError: () => toast.show("Échec", { tone: "error" }),
    });
  };

  const itemsByCategory = (catId: string) => items.filter((i) => i.categoryId === catId);

  return (
    <ScrollView style={styles.page} contentContainerStyle={[styles.content, { padding: pagePadding }]}>
      <FadeInView delay={0}>
        <View style={styles.headerRow}>
          <View style={styles.header}>
            <Text variant="display">Menu</Text>
            <Text variant="body" tone="muted">Gérez vos catégories et plats.</Text>
          </View>
          <Button label="+ Ajouter un plat" onPress={openCreate} />
        </View>
      </FadeInView>

      {categories.map((cat, ci) => (
        <FadeInView key={cat.id} delay={80 + ci * 80} style={styles.categoryBlock}>
          <Text variant="heading">{cat.name}</Text>
          <View style={styles.itemsGrid}>
            {itemsByCategory(cat.id).map((it) => (
              <MenuItemCard key={it.id} item={it} onEdit={() => openEdit(it)} onToggle={() => toggleAvailable(it)} />
            ))}
            {itemsByCategory(cat.id).length === 0 ? <Text variant="caption" tone="muted">Aucun plat</Text> : null}
          </View>
        </FadeInView>
      ))}

      {/* Modale création / édition */}
      <Modal
        visible={modalOpen}
        onClose={() => setModalOpen(false)}
        title={form.id ? "Modifier le plat" : "Nouveau plat"}
        footer={
          <>
            {form.id ? <Button label="Supprimer" variant="ghost" onPress={requestDelete} /> : null}
            <Button label="Annuler" variant="ghost" onPress={() => setModalOpen(false)} />
            <Button label="Enregistrer" onPress={handleSave} loading={createItem.isPending || updateItem.isPending} />
          </>
        }
      >
        <View style={styles.form}>
          <Input label="Nom" placeholder="Ex. Burger maison" value={form.name} onChangeText={(t) => setForm({ ...form, name: t })} />
          <Input label="Description" placeholder="Ingrédients…" value={form.description} onChangeText={(t) => setForm({ ...form, description: t })} />
          <Input label="Prix (€)" placeholder="12.50" value={form.priceEuros} onChangeText={(t) => setForm({ ...form, priceEuros: t })} />
          <Input label="Image (URL)" placeholder="https://…" value={form.imageUrl} onChangeText={(t) => setForm({ ...form, imageUrl: t })} />
          <Select
            label="Catégorie"
            placeholder="Catégorie"
            value={form.categoryId}
            onChange={(v) => setForm({ ...form, categoryId: v })}
            options={categories.map((c) => ({ label: c.name, value: c.id }))}
          />
          <Pressable style={styles.toggleRow} onPress={() => setForm({ ...form, available: !form.available })}>
            <Text variant="label">Disponible</Text>
            <View style={[styles.switch, { backgroundColor: form.available ? colors.primary : colors.borderStrong }]}>
              <View style={[styles.knob, { alignSelf: form.available ? "flex-end" : "flex-start" }]} />
            </View>
          </Pressable>
        </View>
      </Modal>

      <ConfirmDialog
        visible={confirmDelete}
        title="Supprimer ce plat ?"
        message={`« ${form.name} » sera archivé et n'apparaîtra plus dans le menu. Cette action est irréversible.`}
        confirmLabel="Supprimer"
        destructive
        loading={deleteItem.isPending}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  content: { gap: spacing["2xl"], maxWidth: 1100, minWidth: 680, width: "100%", marginHorizontal: "auto" },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: spacing.md },
  header: { gap: spacing.xs },
  categoryBlock: { gap: spacing.md },
  itemsGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.lg },
  itemCard: { width: 260, transitionDuration: "150ms", transform: [{ scale: 1 }] } as object,
  itemCardHovered: { transform: [{ scale: 1.02 }] } as object,
  itemImage: { width: "100%", height: 120, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg },
  itemImagePlaceholder: { width: "100%", height: 120, backgroundColor: colors.surfaceAlt, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg },
  itemContent: { padding: spacing.lg },
  itemHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.xs },
  itemFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: spacing.md },
  form: { gap: spacing.md },
  toggleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  switch: { width: 44, height: 26, borderRadius: radius.full, padding: 3, justifyContent: "center" },
  knob: { width: 20, height: 20, borderRadius: radius.full, backgroundColor: colors.white },
});