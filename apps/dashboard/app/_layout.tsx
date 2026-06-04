import { useState } from "react";
import { View, StyleSheet } from "react-native";
import { Slot } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ToastProvider, colors } from "@odyssey/shared";
import { Sidebar } from "../components/Sidebar";

export default function RootLayout() {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        {/* Layout dashboard : sidebar fixe à gauche + contenu de la page à droite */}
        <View style={styles.shell}>
          <Sidebar />
          <View style={styles.content}>
            <Slot />
          </View>
        </View>
      </ToastProvider>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
  },
});