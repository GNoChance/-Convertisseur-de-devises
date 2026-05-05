import { StyleSheet, Text, View } from "react-native";
import { useApp } from "../context/AppContext";

export default function Header() {
  const { theme, lang } = useApp();

  return (
    <View style={s.header}>
      <View style={s.headerLeft}>
        <Text style={[s.title, { color: theme.text }]} numberOfLines={1}>
          {lang === "fr" ? "Mon Portefeuille" : "My Portfolio"}
        </Text>
        <Text style={[s.subtitle, { color: theme.muted }]} numberOfLines={1}>
          {lang === "fr" ? "Bienvenue 👋" : "Welcome 👋"}
        </Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "flex-start", marginTop: 16, marginBottom: 28 },
  headerLeft: { flex: 1, overflow: "hidden" },
  title: { fontSize: 24, fontWeight: "700" },
  subtitle: { fontSize: 13, marginTop: 3 },
});
