import { View, Text, ActivityIndicator, ScrollView } from "react-native";
import { useGetCategories } from "@odyssey/api-client";

export default function Home() {
  const { data, isLoading, error } = useGetCategories();

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 12 }}>Chargement des catégories…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: "red" }}>Erreur de chargement</Text>
      </View>
    );
  }

  // data.data contient le tableau renvoyé par l'API (Orval enveloppe dans {data, status, headers})
  const categories = data?.data ?? [];

  return (
    <ScrollView style={{ flex: 1, padding: 24 }}>
      <Text style={{ fontSize: 24, fontWeight: "bold", marginBottom: 16 }}>
        Odyssey Dashboard
      </Text>
      <Text style={{ fontSize: 16, marginBottom: 12 }}>Catégories du menu :</Text>
      {categories.map((cat) => (
        <View
          key={cat.id}
          style={{ padding: 12, marginBottom: 8, backgroundColor: "#f0f0f0", borderRadius: 8 }}
        >
          <Text style={{ fontSize: 16 }}>{cat.name}</Text>
        </View>
      ))}
    </ScrollView>
  );
}