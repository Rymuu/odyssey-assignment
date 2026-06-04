import { useState, useEffect } from "react";
import { ScrollView, View, StyleSheet, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import {
  useGetSettings,
  usePatchSettings,
} from "@odyssey/api-client";
import {
  colors, spacing, radius,
  Text, Card, Button, Input, useToast, useResponsive,
  FadeInView,
} from "@odyssey/shared";

type DayHours = { open: string; close: string; closed: boolean };
type OpeningHours = Record<string, DayHours>;
type SettingsLike = {
  prepTimeMinutes: number;
  autoAccept: boolean;
  acceptingOrders: boolean;
  openingHours?: OpeningHours | null;
};

const DAYS: { key: string; label: string }[] = [
  { key: "lundi", label: "Lundi" },
  { key: "mardi", label: "Mardi" },
  { key: "mercredi", label: "Mercredi" },
  { key: "jeudi", label: "Jeudi" },
  { key: "vendredi", label: "Vendredi" },
  { key: "samedi", label: "Samedi" },
  { key: "dimanche", label: "Dimanche" },
];

function defaultHours(): OpeningHours {
  const h: OpeningHours = {};
  DAYS.forEach((d) => { h[d.key] = { open: "11:00", close: "22:00", closed: d.key === "dimanche" }; });
  return h;
}

function Toggle({ label, description, value, onToggle }: { label: string; description?: string; value: boolean; onToggle: () => void }) {
  return (
    <Pressable style={styles.toggleRow} onPress={onToggle}>
      <View style={styles.toggleText}>
        <Text variant="label" weight="semibold">{label}</Text>
        {description ? <Text variant="caption" tone="muted">{description}</Text> : null}
      </View>
      <View style={[styles.switch, { backgroundColor: value ? colors.primary : colors.borderStrong }]}>
        <View style={[styles.knob, { alignSelf: value ? "flex-end" : "flex-start" }]} />
      </View>
    </Pressable>
  );
}

export default function Settings() {
  const { pagePadding } = useResponsive();
  const settingsQuery = useGetSettings();
  const patchSettings = usePatchSettings();
  const toast = useToast();

  const remote = settingsQuery.data?.data as SettingsLike | undefined;

  const [prepTime, setPrepTime] = useState("20");
  const [autoAccept, setAutoAccept] = useState(false);
  const [acceptingOrders, setAcceptingOrders] = useState(true);
  const [hours, setHours] = useState<OpeningHours>(defaultHours());

  useEffect(() => {
    if (remote) {
      setPrepTime(String(remote.prepTimeMinutes ?? 20));
      setAutoAccept(remote.autoAccept ?? false);
      setAcceptingOrders(remote.acceptingOrders ?? true);
      setHours(remote.openingHours && Object.keys(remote.openingHours).length > 0 ? remote.openingHours : defaultHours());
    }
  }, [remote]);

  const setDay = (key: string, patch: Partial<DayHours>) => {
    setHours((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));
  };

  // Détection des modifications non enregistrées (dirty state)
  const currentForm = {
    prepTimeMinutes: parseInt(prepTime, 10) || 0,
    autoAccept,
    acceptingOrders,
    openingHours: hours,
  };
  const remoteForm = remote
    ? {
        prepTimeMinutes: remote.prepTimeMinutes ?? 0,
        autoAccept: remote.autoAccept ?? false,
        acceptingOrders: remote.acceptingOrders ?? true,
        openingHours: remote.openingHours && Object.keys(remote.openingHours).length > 0 ? remote.openingHours : defaultHours(),
      }
    : null;
  const isDirty = remoteForm ? JSON.stringify(currentForm) !== JSON.stringify(remoteForm) : false;

  // Avertir si l'utilisateur ferme/recharge l'onglet avec des modifs en attente
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) { e.preventDefault(); e.returnValue = ""; }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  const handleSave = () => {
    const prep = parseInt(prepTime, 10);
    if (isNaN(prep) || prep < 0) {
      toast.show("Valeur invalide", { tone: "warning", description: "Le temps de préparation doit être un nombre positif." });
      return;
    }
    patchSettings.mutate(
      { data: { prepTimeMinutes: prep, autoAccept, acceptingOrders, openingHours: hours } },
      {
        onSuccess: () => { toast.show("Réglages enregistrés", { tone: "success" }); settingsQuery.refetch(); },
        onError: () => toast.show("Échec", { tone: "error" }),
      }
    );
  };

  return (
    <ScrollView style={styles.page} contentContainerStyle={[styles.content, { padding: pagePadding }]}>
      <FadeInView delay={0}>
        <View style={styles.header}>
          <Text variant="display">Paramètres</Text>
          <Text variant="body" tone="muted">Configuration du service et des commandes.</Text>
        </View>
      </FadeInView>

      {isDirty ? (
        <FadeInView>
          <View style={styles.dirtyBanner}>
            <Feather name="alert-circle" size={16} color={colors.warningFg} />
            <Text variant="label" weight="medium" style={{ color: colors.warningFg, flex: 1 }}>
              Vous avez des modifications non enregistrées.
            </Text>
          </View>
        </FadeInView>
      ) : null}

      <View style={styles.formColumn}>
        {/* Service */}
        <FadeInView delay={80}>
        <Card elevation="sm" padding="xl">
          <View style={styles.cardBody}>
            <Text variant="heading">Service</Text>
            <Toggle label="Accepter les commandes" description="Désactivez pour fermer temporairement les commandes." value={acceptingOrders} onToggle={() => setAcceptingOrders((v) => !v)} />
            <View style={styles.divider} />
            <Toggle label="Acceptation automatique" description="Les nouvelles commandes sont acceptées sans validation manuelle." value={autoAccept} onToggle={() => setAutoAccept((v) => !v)} />
          </View>
        </Card>
        </FadeInView>

        {/* Préparation */}
        <FadeInView delay={160}>
        <Card elevation="sm" padding="xl">
          <View style={styles.cardBody}>
            <Text variant="heading">Préparation</Text>
            <Input label="Temps de préparation (minutes)" placeholder="20" value={prepTime} onChangeText={setPrepTime} />
          </View>
        </Card>
        </FadeInView>

        {/* Horaires d'ouverture */}
        <FadeInView delay={240}>
        <Card elevation="sm" padding="xl">
          <View style={styles.cardBody}>
            <Text variant="heading">Horaires d'ouverture</Text>
            {DAYS.map((d, i) => {
              const dh = hours[d.key] ?? { open: "11:00", close: "22:00", closed: false };
              return (
                <View key={d.key}>
                  {i > 0 ? <View style={styles.divider} /> : null}
                  <View style={styles.dayRow}>
                    <Text variant="label" weight="semibold" style={styles.dayLabel}>{d.label}</Text>
                    {dh.closed ? (
                      <Text variant="label" tone="muted" style={styles.closedText}>Fermé</Text>
                    ) : (
                      <View style={styles.hoursInputs}>
                        <View style={styles.timeInput}>
                          <Input placeholder="11:00" value={dh.open} onChangeText={(t) => setDay(d.key, { open: t })} />
                        </View>
                        <Text variant="label" tone="muted">—</Text>
                        <View style={styles.timeInput}>
                          <Input placeholder="22:00" value={dh.close} onChangeText={(t) => setDay(d.key, { close: t })} />
                        </View>
                      </View>
                    )}
                    <Pressable
                      style={[styles.closedToggle, { backgroundColor: dh.closed ? colors.errorBg : colors.surfaceAlt }]}
                      onPress={() => setDay(d.key, { closed: !dh.closed })}
                    >
                      <Text variant="caption" weight="medium" style={{ color: dh.closed ? colors.errorFg : colors.textMuted }}>
                        {dh.closed ? "Ouvrir" : "Fermer"}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </View>
        </Card>
        </FadeInView>

        <FadeInView delay={320}>
          <Button label={isDirty ? "Enregistrer les modifications" : "Aucune modification"} onPress={handleSave} loading={patchSettings.isPending} disabled={!isDirty} fullWidth />
        </FadeInView>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  content: { gap: spacing["2xl"], maxWidth: 760, minWidth: 560, width: "100%", marginHorizontal: "auto" },
  header: { gap: spacing.xs },
  dirtyBanner: { flexDirection: "row", alignItems: "center", gap: spacing.sm, backgroundColor: colors.warningBg, borderWidth: 1, borderColor: colors.warningBorder, paddingVertical: spacing.md, paddingHorizontal: spacing.lg, borderRadius: radius.md },
  formColumn: { gap: spacing.lg },
  cardBody: { gap: spacing.lg },
  toggleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: spacing.lg },
  toggleText: { flex: 1, gap: 2 },
  switch: { width: 44, height: 26, borderRadius: radius.full, padding: 3, justifyContent: "center" },
  knob: { width: 20, height: 20, borderRadius: radius.full, backgroundColor: colors.white },
  divider: { height: 1, backgroundColor: colors.border },
  dayRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: spacing.sm },
  dayLabel: { width: 90 },
  closedText: { flex: 1 },
  hoursInputs: { flex: 1, flexDirection: "row", alignItems: "center", gap: spacing.sm },
  timeInput: { width: 90 },
  closedToggle: { paddingVertical: spacing.xs, paddingHorizontal: spacing.md, borderRadius: radius.md },
});