import { useState, type ReactNode } from "react";
import { ScrollView, View, StyleSheet } from "react-native";
import {
  colors,
  spacing,
  radius,
  Text,
  Button,
  Card,
  Badge,
  Input,
  Select,
  Modal,
  Skeleton,
  Table,
  type Column,
  useToast,
} from "@odyssey/shared";

// Chaque section est un bloc distinct (titre + carte), façon doc de design system.
function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text variant="heading">{title}</Text>
        {description ? (
          <Text variant="label" tone="muted">
            {description}
          </Text>
        ) : null}
      </View>
      <Card elevation="sm" padding="2xl">
        <View style={styles.sectionBody}>{children}</View>
      </Card>
    </View>
  );
}

function Swatch({ name, color, fg }: { name: string; color: string; fg?: string }) {
  return (
    <View style={[styles.swatch, { backgroundColor: color }]}>
      <Text variant="caption" style={{ color: fg ?? colors.text }}>
        {name}
      </Text>
    </View>
  );
}

type DemoRow = { id: string; name: string; status: string; total: string };

export default function UILibrary() {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectVal, setSelectVal] = useState<string>();
  const [inputVal, setInputVal] = useState("");
  const toast = useToast();

  const demoData: DemoRow[] = [
    { id: "1", name: "Marie Dupont", status: "completed", total: "24,00 €" },
    { id: "2", name: "Ahmed Benali", status: "pending", total: "18,50 €" },
  ];
  const demoColumns: Column<DemoRow>[] = [
    { key: "name", title: "Client", flex: 2, render: (r) => r.name },
    {
      key: "status",
      title: "Statut",
      render: (r) => (
        <Badge label={r.status} tone={r.status === "completed" ? "success" : "warning"} />
      ),
    },
    { key: "total", title: "Total", align: "right", render: (r) => r.total },
  ];

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <View style={styles.pageHeader}>
        <Text variant="display">Design System</Text>
        <Text variant="body" tone="muted">
          Tokens et composants réutilisables — Odyssey.
        </Text>
      </View>

      <Section title="Couleurs" description="Palette 60-30-10 : dominante crème, neutres, accent corail.">
        <View style={styles.row}>
          <Swatch name="background" color={colors.background} />
          <Swatch name="surface" color={colors.surface} />
          <Swatch name="surfaceAlt" color={colors.surfaceAlt} />
          <Swatch name="primary" color={colors.primary} fg={colors.white} />
          <Swatch name="primaryHover" color={colors.primaryHover} fg={colors.white} />
        </View>
        <View style={styles.row}>
          <Swatch name="success" color={colors.successBg} fg={colors.successFg} />
          <Swatch name="warning" color={colors.warningBg} fg={colors.warningFg} />
          <Swatch name="error" color={colors.errorBg} fg={colors.errorFg} />
          <Swatch name="info" color={colors.infoBg} fg={colors.infoFg} />
        </View>
      </Section>

      <Section title="Typographie" description="Échelle de tailles et de poids.">
        <Text variant="display">Display 36</Text>
        <Text variant="title">Title 28</Text>
        <Text variant="heading">Heading 22</Text>
        <Text variant="body">Body 16 — le texte courant des interfaces.</Text>
        <Text variant="label">Label 14</Text>
        <Text variant="caption" tone="muted">
          Caption 12
        </Text>
      </Section>

      <Section title="Boutons" description="Variantes, tailles et états.">
        <View style={styles.row}>
          <Button label="Primary" variant="primary" onPress={() => {}} />
          <Button label="Secondary" variant="secondary" onPress={() => {}} />
          <Button label="Ghost" variant="ghost" onPress={() => {}} />
        </View>
        <View style={styles.row}>
          <Button label="Small" size="sm" onPress={() => {}} />
          <Button label="Medium" size="md" onPress={() => {}} />
          <Button label="Large" size="lg" onPress={() => {}} />
        </View>
        <View style={styles.row}>
          <Button label="Disabled" disabled onPress={() => {}} />
          <Button label="Loading" loading onPress={() => {}} />
        </View>
      </Section>

      <Section title="Badges" description="Statuts sémantiques.">
        <View style={styles.row}>
          <Badge label="completed" tone="success" />
          <Badge label="pending" tone="warning" />
          <Badge label="cancelled" tone="error" />
          <Badge label="info" tone="info" />
          <Badge label="neutral" tone="neutral" />
        </View>
      </Section>

      <Section title="Surfaces & élévations" description="Trois niveaux d'ombre.">
        <View style={styles.row}>
          <View style={styles.cardDemo}>
            <Card elevation="sm">
              <Text variant="label">Elevation sm</Text>
            </Card>
          </View>
          <View style={styles.cardDemo}>
            <Card elevation="md">
              <Text variant="label">Elevation md</Text>
            </Card>
          </View>
          <View style={styles.cardDemo}>
            <Card elevation="lg">
              <Text variant="label">Elevation lg</Text>
            </Card>
          </View>
        </View>
      </Section>

      <Section title="Champs de formulaire" description="Largeur contrainte, comme dans un vrai formulaire.">
        <View style={styles.formColumn}>
          <Input
            label="Nom du plat"
            placeholder="Ex. Burger maison"
            value={inputVal}
            onChangeText={setInputVal}
          />
          <Input label="Avec erreur" placeholder="..." error="Ce champ est requis" />
          <Input label="Désactivé" placeholder="..." disabled />
          <Select
            label="Catégorie"
            placeholder="Catégorie"
            value={selectVal}
            onChange={setSelectVal}
            options={[
              { label: "Entrées", value: "starters" },
              { label: "Plats", value: "mains" },
              { label: "Desserts", value: "desserts" },
            ]}
          />
        </View>
      </Section>

      <Section title="Chargement" description="Skeletons pendant le fetch.">
        <View style={styles.formColumn}>
          <Skeleton width="100%" height={20} />
          <Skeleton width="60%" height={20} />
          <Skeleton width="80%" height={20} />
        </View>
      </Section>

      <Section title="Tableau" description="Composant générique (Orders, CRM).">
        <Table columns={demoColumns} data={demoData} keyExtractor={(r) => r.id} />
      </Section>

      <Section title="Modale & notifications" description="Flux create/edit et feedback (4 tones).">
        <View style={styles.row}>
          <Button label="Ouvrir la modale" onPress={() => setModalOpen(true)} />
          <Button
            label="Toast succès"
            variant="secondary"
            onPress={() =>
              toast.show("Commande créée", {
                tone: "success",
                description: "La commande #1024 a bien été enregistrée.",
              })
            }
          />
          <Button
            label="Toast erreur"
            variant="secondary"
            onPress={() =>
              toast.show("Échec de l'enregistrement", {
                tone: "error",
                description: "Vérifiez votre connexion et réessayez.",
              })
            }
          />
          <Button
            label="Toast warning"
            variant="secondary"
            onPress={() =>
              toast.show("Plat indisponible", {
                tone: "warning",
                description: "Ce plat est masqué du menu client.",
              })
            }
          />
          <Button
            label="Toast info"
            variant="secondary"
            onPress={() =>
              toast.show("Synchronisation", {
                tone: "info",
                description: "Les données ont été actualisées.",
              })
            }
          />
        </View>
      </Section>

      <Modal
        visible={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Exemple de modale"
        footer={
          <>
            <Button label="Annuler" variant="ghost" onPress={() => setModalOpen(false)} />
            <Button label="Confirmer" onPress={() => setModalOpen(false)} />
          </>
        }
      >
        <Text>Contenu de la modale. Idéal pour les flux de création/édition.</Text>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  content: {
    padding: spacing["3xl"],
    gap: spacing["3xl"],
    maxWidth: 960,
    width: "100%",
    alignSelf: "center",
  },
  pageHeader: { gap: spacing.xs },
  section: { gap: spacing.md },
  sectionHeader: { gap: spacing.xs },
  sectionBody: { gap: spacing.lg },
  row: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md, alignItems: "center" },
  formColumn: { gap: spacing.md, maxWidth: 360, width: "100%" },
  cardDemo: { width: 160 },
  swatch: {
    width: 110,
    height: 64,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: "flex-end",
    padding: spacing.sm,
  },
});