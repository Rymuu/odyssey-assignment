import { useState } from "react";
import { View, Pressable, StyleSheet, useWindowDimensions } from "react-native";
import { Slot } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ToastProvider, colors, spacing, radius, shadows } from "@odyssey/shared";
import { Sidebar } from "../components/Sidebar";

const BREAKPOINT = 640;

export default function RootLayout() {
  const [queryClient] = useState(() => new QueryClient());
  const { width } = useWindowDimensions();
  const isMobile = width < BREAKPOINT;
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <View style={styles.shell}>
          {/* Desktop : sidebar fixe à gauche */}
          {!isMobile ? <Sidebar /> : null}

          {/* Contenu */}
          <View style={styles.content}>
            <Slot />
          </View>

          {/* Mobile : bouton burger flottant */}
          {isMobile && !menuOpen ? (
            <Pressable style={styles.burger} onPress={() => setMenuOpen(true)}>
              <Feather name="menu" size={22} color={colors.text} />
            </Pressable>
          ) : null}

          {/* Mobile : sidebar en overlay */}
          {isMobile && menuOpen ? (
            <View style={styles.overlay}>
              <Pressable style={styles.backdrop} onPress={() => setMenuOpen(false)} />
              <View style={styles.drawer}>
                <Sidebar onNavigate={() => setMenuOpen(false)} />
              </View>
            </View>
          ) : null}
        </View>
      </ToastProvider>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1, flexDirection: "row", backgroundColor: colors.background },
  content: { flex: 1, minWidth: 0 },
  burger: {
    position: "absolute",
    top: spacing.lg,
    left: spacing.lg,
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 50,
    ...shadows.sm,
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    zIndex: 100,
  },
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(42,37,33,0.4)",
  },
  drawer: {
    ...shadows.lg,
  },
});