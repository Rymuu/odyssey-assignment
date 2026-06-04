import { useState, type ReactNode } from "react";
import { ScrollView, View, StyleSheet } from "react-native";
import {
  colors,
  spacing,
  radius,
  typography,
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

function Section({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text variant="heading">{title}</Text>
        {description ? <Text variant="label" tone="muted">{description}</Text> : null}
      </View>
      <Card elevation="sm" padding="2xl">
        <View style={styles.sectionBody}>{children}</View>
      </Card>
    </View>
  );
}

function SubBlock({ title, children, style }: { title: string; children: ReactNode; style?: object }) {
  return (
    <View style={[styles.subBlock, style]}>
      <Text variant="label" weight="semibold" tone="muted">{title}</Text>
      {children}
    </View>
  );
}

function Swatch({ name, hex }: { name: string; hex: string }) {
  return (
    <View style={styles.swatchWrap}>
      <View style={[styles.swatch, { backgroundColor: hex }]} />
      <Text variant="caption" weight="medium">{name}</Text>
      <Text variant="caption" tone="subtle">{hex}</Text>
    </View>
  );
}

const TYPO_WEIGHTS: { key: keyof typeof typography.fontWeight; label: string }[] = [
  { key: "bold", label: "Bold" }, { key: "semibold", label: "Semibold" },
  { key: "medium", label: "Medium" }, { key: "regular", label: "Regular" },
];
const TYPO_SIZES = [typography.fontSize.display, typography.fontSize["2xl"], typography.fontSize.xl, typography.fontSize.lg, typography.fontSize.base];
const BTN_SIZES: ("sm" | "md" | "lg")[] = ["sm", "md", "lg"];
const SPACINGS = [
  { key: "xs", val: spacing.xs }, { key: "sm", val: spacing.sm }, { key: "md", val: spacing.md },
  { key: "lg", val: spacing.lg }, { key: "xl", val: spacing.xl }, { key: "2xl", val: spacing["2xl"] }, { key: "3xl", val: spacing["3xl"] },
];
const RADII = [
  { key: "sm", val: radius.sm }, { key: "md", val: radius.md }, { key: "lg", val: radius.lg }, { key: "xl", val: radius.xl },
];

type DemoRow = { id: string; name: string; status: string; total: string };

export default function UILibrary() {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectVal, setSelectVal] = useState<string>("mains");
  const [selectEmpty, setSelectEmpty] = useState<string>();
  const [inputVal, setInputVal] = useState("");
  const toast = useToast();

  const demoData: DemoRow[] = [
    { id: "1", name: "Marie Dupont", status: "completed", total: "24,00 €" },
    { id: "2", name: "Ahmed Benali", status: "pending", total: "18,50 €" },
    { id: "3", name: "Léa Martin", status: "cancelled", total: "12,00 €" },
  ];
  const statusTone = (s: string) => (s === "completed" ? "success" : s === "pending" ? "warning" : "error");
  const demoColumns: Column<DemoRow>[] = [
    { key: "name", title: "Client", flex: 2, render: (r) => r.name },
    { key: "status", title: "Statut", render: (r) => <Badge label={r.status} tone={statusTone(r.status) as "success"} /> },
    { key: "total", title: "Total", align: "right", render: (r) => r.total },
  ];
  const categoryOptions = [
    { label: "Entrées", value: "starters" }, { label: "Plats", value: "mains" },
    { label: "Desserts", value: "desserts" }, { label: "Boissons", value: "drinks" },
  ];

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <View style={styles.pageHeader}>
        <Text variant="display">Design System</Text>
        <Text variant="body" tone="muted">Tokens et composants réutilisables — Odyssey.</Text>
      </View>

      <Section title="Couleurs" description="Palette 60-30-10 : dominante crème, neutres, accent corail.">
        <View style={styles.wrapRow}>
          <SubBlock title="Surfaces & accent">
            <View style={styles.row}>
              <Swatch name="background" hex={colors.background} />
              <Swatch name="surface" hex={colors.surface} />
              <Swatch name="surfaceAlt" hex={colors.surfaceAlt} />
              <Swatch name="primary" hex={colors.primary} />
              <Swatch name="primaryHover" hex={colors.primaryHover} />
              <Swatch name="primaryLight" hex={colors.primaryLight} />
            </View>
          </SubBlock>
        </View>
        <SubBlock title="Neutres">
          <View style={styles.row}>
            <Swatch name="text" hex={colors.text} />
            <Swatch name="textMuted" hex={colors.textMuted} />
            <Swatch name="textSubtle" hex={colors.textSubtle} />
            <Swatch name="border" hex={colors.border} />
            <Swatch name="borderStrong" hex={colors.borderStrong} />
          </View>
        </SubBlock>
        <SubBlock title="Sémantiques (pastel)">
          <View style={styles.row}>
            <Swatch name="success" hex={colors.successFg} />
            <Swatch name="warning" hex={colors.warningFg} />
            <Swatch name="error" hex={colors.errorFg} />
            <Swatch name="info" hex={colors.infoFg} />
          </View>
        </SubBlock>
      </Section>

      <Section title="Typographie" description="Police système. Colonnes = poids, lignes = tailles.">
        <View style={styles.fontInfo}>
          <Text variant="caption" tone="muted">POLICE</Text>
          <Text variant="body" weight="medium">Police système (system-ui)</Text>
          <Text variant="caption" tone="subtle">Police native de l'OS — aucune dépendance externe.</Text>
        </View>
        <View style={styles.typoGrid}>
          {TYPO_WEIGHTS.map((w) => (
            <View key={w.key} style={styles.typoColumn}>
              <View style={styles.typoColHeader}><Text variant="caption" tone="muted">{w.label}</Text></View>
              {TYPO_SIZES.map((size, i) => (
                <Text key={i} weight={w.key} style={{ fontSize: size }}>Menu</Text>
              ))}
            </View>
          ))}
        </View>
        <View style={styles.divider} />
        {/* Variantes ET tons côte à côte */}
        <View style={styles.dividedRow}>
          <View style={styles.dividedCol}>
            <Text variant="label" weight="semibold" tone="muted">Variantes (usages)</Text>
            <Text variant="display">Display</Text>
            <Text variant="title">Title</Text>
            <Text variant="heading">Heading</Text>
            <Text variant="body">Body — texte courant.</Text>
            <Text variant="label">Label</Text>
            <Text variant="caption" tone="muted">Caption</Text>
          </View>
          <View style={styles.dividedColLast}>
            <Text variant="label" weight="semibold" tone="muted">Tons</Text>
            <Text tone="default">Default</Text>
            <Text tone="muted">Muted</Text>
            <Text tone="subtle">Subtle</Text>
            <Text tone="primary">Primary</Text>
          </View>
        </View>
      </Section>

      {/* Spacing ET radius côte à côte */}
      <Section title="Espacements & rayons" description="Échelle d'espacement (4px) et arrondis.">
        <View style={styles.dividedRow}>
          <View style={styles.dividedCol}>
            <Text variant="label" weight="semibold" tone="muted">Spacing</Text>
            <View style={styles.spacingList}>
              {SPACINGS.map((sp) => (
                <View key={sp.key} style={styles.spacingRow}>
                  <Text variant="caption" tone="muted" style={styles.spacingLabel}>{sp.key} · {sp.val}</Text>
                  <View style={[styles.spacingBar, { width: sp.val * 4 }]} />
                </View>
              ))}
            </View>
          </View>
          <View style={styles.dividedColLast}>
            <Text variant="label" weight="semibold" tone="muted">Radius</Text>
            <View style={styles.row}>
              {RADII.map((r) => (
                <View key={r.key} style={styles.radiusWrap}>
                  <View style={[styles.radiusBox, { borderRadius: r.val }]} />
                  <Text variant="caption" tone="muted">{r.key} · {r.val}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </Section>

      {/* Grille boutons ET états côte à côte */}
      <Section title="Boutons" description="Grille variantes × tailles, et états.">
        <View style={styles.dividedRow}>
          <View style={styles.dividedCol}>
            <Text variant="label" weight="semibold" tone="muted">Variantes × tailles</Text>
            <View style={styles.btnGrid}>
              <View style={styles.btnGridRow}>
                <View style={styles.btnRowLabel} />
                <View style={styles.btnCell}><Text variant="caption" tone="muted">Primary</Text></View>
                <View style={styles.btnCell}><Text variant="caption" tone="muted">Secondary</Text></View>
                <View style={styles.btnCell}><Text variant="caption" tone="muted">Ghost</Text></View>
              </View>
              {BTN_SIZES.map((sz) => (
                <View key={sz} style={styles.btnGridRow}>
                  <View style={styles.btnRowLabel}><Text variant="caption" tone="muted">{sz}</Text></View>
                  <View style={styles.btnCell}><Button label="Button" variant="primary" size={sz} onPress={() => {}} /></View>
                  <View style={styles.btnCell}><Button label="Button" variant="secondary" size={sz} onPress={() => {}} /></View>
                  <View style={styles.btnCell}><Button label="Button" variant="ghost" size={sz} onPress={() => {}} /></View>
                </View>
              ))}
            </View>
          </View>
          <View style={styles.dividedColLast}>
            <Text variant="label" weight="semibold" tone="muted">États</Text>
            <View style={styles.btnGridRow}><Text variant="caption" tone="muted"> </Text></View>
            <View style={styles.btnWrap}><Button label="Normal" onPress={() => {}} /></View>
            <View style={styles.btnWrap}><Button label="Disabled" disabled onPress={() => {}} /></View>
            <View style={styles.btnWrap}><Button label="Loading" loading onPress={() => {}} /></View>
          </View>
        </View>
      </Section>

      <Section title="Badges" description="Statuts sémantiques pastel avec bordure douce.">
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
          <View style={styles.cardDemo}><Card elevation="sm"><Text variant="label" weight="semibold">Elevation sm</Text><Text variant="caption" tone="muted">Ombre légère</Text></Card></View>
          <View style={styles.cardDemo}><Card elevation="md"><Text variant="label" weight="semibold">Elevation md</Text><Text variant="caption" tone="muted">Ombre moyenne</Text></Card></View>
          <View style={styles.cardDemo}><Card elevation="lg"><Text variant="label" weight="semibold">Elevation lg</Text><Text variant="caption" tone="muted">Ombre forte</Text></Card></View>
        </View>
      </Section>

      {/* Formulaires ET Select côte à côte */}
      <Section title="Formulaires" description="Champs de saisie et sélecteur, avec leurs états.">
        <View style={styles.dividedRow}>
          <View style={styles.dividedCol}>
            <Text variant="label" weight="semibold" tone="muted">Champs</Text>
            <Input label="Nom du plat" placeholder="Ex. Burger maison" value={inputVal} onChangeText={setInputVal} />
            <Input label="Avec erreur" placeholder="..." error="Ce champ est requis" />
            <Input label="Désactivé" placeholder="..." disabled />
          </View>
          <View style={styles.dividedColLast}>
            <Text variant="label" weight="semibold" tone="muted">Select</Text>
            <Select label="Avec valeur" placeholder="Catégorie" value={selectVal} onChange={setSelectVal} options={categoryOptions} />
            <Select label="Vide" placeholder="Catégorie" value={selectEmpty} onChange={setSelectEmpty} options={categoryOptions} />
            <Select label="Désactivé" placeholder="Catégorie" value="mains" onChange={() => {}} options={categoryOptions} disabled />
          </View>
        </View>
      </Section>

      <Section title="Chargement" description="Skeletons : lignes et carte placeholder.">
        <View style={styles.dividedRow}>
          <View style={styles.dividedCol}>
            <Text variant="label" weight="semibold" tone="muted">Lignes</Text>
            <Skeleton width="100%" height={20} />
            <Skeleton width="60%" height={20} />
            <Skeleton width="80%" height={20} />
          </View>
          <View style={styles.dividedColLast}>
            <Text variant="label" weight="semibold" tone="muted">Carte</Text>
            <View style={styles.skeletonCard}>
              <Skeleton width="100%" height={90} borderRadius={radius.md} />
              <Skeleton width="70%" height={16} />
              <Skeleton width="40%" height={14} />
            </View>
          </View>
        </View>
      </Section>

      <Section title="Tableau" description="Composant générique (Orders, CRM).">
        <Table columns={demoColumns} data={demoData} keyExtractor={(r) => r.id} />
      </Section>

      {/* Modale ET notifications côte à côte */}
      <Section title="Modale & notifications" description="Conteneur create/edit et feedback (4 tones).">
        <View style={styles.dividedRow}>
          <View style={styles.dividedCol}>
            <Text variant="label" weight="semibold" tone="muted">Modale</Text>
            <View style={styles.btnWrap}><Button label="Ouvrir la modale" onPress={() => setModalOpen(true)} /></View>
          </View>
          <View style={styles.dividedColLast}>
            <Text variant="label" weight="semibold" tone="muted">Toasts</Text>
            <View style={styles.row}>
              <Button label="Succès" variant="secondary" onPress={() => toast.show("Commande créée", { tone: "success", description: "La commande #1024 a bien été enregistrée." })} />
              <Button label="Erreur" variant="secondary" onPress={() => toast.show("Échec de l'enregistrement", { tone: "error", description: "Vérifiez votre connexion et réessayez." })} />
              <Button label="Warning" variant="secondary" onPress={() => toast.show("Plat indisponible", { tone: "warning", description: "Ce plat est masqué du menu client." })} />
              <Button label="Info" variant="secondary" onPress={() => toast.show("Synchronisation", { tone: "info", description: "Les données ont été actualisées." })} />
            </View>
          </View>
        </View>
      </Section>

      <Modal
        visible={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Exemple de modale"
        footer={<><Button label="Annuler" variant="ghost" onPress={() => setModalOpen(false)} /><Button label="Confirmer" onPress={() => setModalOpen(false)} /></>}
      >
        <Text>Contenu de la modale. Idéal pour les flux de création/édition.</Text>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing["3xl"], gap: spacing["3xl"], maxWidth: 960, width: "100%", alignSelf: "center" },
  pageHeader: { gap: spacing.xs },
  section: { gap: spacing.md },
  sectionHeader: { gap: spacing.xs },
  sectionBody: { gap: spacing.lg },
  row: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md, alignItems: "center" },
  wrapRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing["2xl"] },
  // Deux colonnes séparées par une simple ligne verticale (pas de cadre)
  dividedRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing["2xl"],
  },
  dividedCol: {
    flex: 1,
    minWidth: 240,
    gap: spacing.sm,
    paddingRight: spacing["2xl"],
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  dividedColLast: {
    flex: 1,
    minWidth: 240,
    gap: spacing.sm,
  },
  subBlock: { gap: spacing.sm },
  cardDemo: { width: 180 },
  swatchWrap: { gap: 2, width: 88 },
  swatch: { height: 52, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border },
  fontInfo: { gap: 2, paddingBottom: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  typoGrid: { flexDirection: "row", gap: spacing["2xl"], flexWrap: "wrap" },
  typoColumn: { gap: spacing.sm, minWidth: 110, flex: 1 },
  typoColHeader: { paddingBottom: spacing.xs, borderBottomWidth: 1, borderBottomColor: colors.border, marginBottom: spacing.xs },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.sm },
  spacingList: { gap: spacing.sm },
  spacingRow: { flexDirection: "row", alignItems: "center", gap: spacing.lg },
  spacingLabel: { width: 80 },
  spacingBar: { height: 16, backgroundColor: colors.primaryLight, borderRadius: radius.sm },
  radiusWrap: { gap: spacing.xs, alignItems: "center" },
  radiusBox: { width: 56, height: 56, backgroundColor: colors.primaryLight, borderWidth: 1, borderColor: colors.primary },
  skeletonCard: { gap: spacing.sm, width: 220, padding: spacing.lg, backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border },
  btnGrid: { gap: spacing.md },
  btnGridRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  btnRowLabel: { width: 36 },
  btnCell: { width: 120, alignItems: "flex-start" },
  btnWrap: { alignSelf: "flex-start" },
});