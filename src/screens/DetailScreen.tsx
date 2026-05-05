import { useEffect, useState } from "react";
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRoute, useNavigation, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useApp } from "../context/AppContext";
import { T } from "../i18n/translations";
import { RootStackParamList } from "../navigation/AppNavigator";
import NativeHistoryChart from "../components/NativeHistoryChart";

type DetailRoute = RouteProp<RootStackParamList, "Detail">;
type Nav         = NativeStackNavigationProp<RootStackParamList, "Detail">;

const FLAGS: Record<string, string> = {
  AUD:"🇦🇺", BGN:"🇧🇬", BRL:"🇧🇷", CAD:"🇨🇦", CHF:"🇨🇭",
  CNY:"🇨🇳", CZK:"🇨🇿", DKK:"🇩🇰", EUR:"🇪🇺", GBP:"🇬🇧",
  HKD:"🇭🇰", HUF:"🇭🇺", IDR:"🇮🇩", ILS:"🇮🇱", INR:"🇮🇳",
  ISK:"🇮🇸", JPY:"🇯🇵", KRW:"🇰🇷", MXN:"🇲🇽", MYR:"🇲🇾",
  NOK:"🇳🇴", NZD:"🇳🇿", PHP:"🇵🇭", PLN:"🇵🇱", RON:"🇷🇴",
  SEK:"🇸🇪", SGD:"🇸🇬", THB:"🇹🇭", TRY:"🇹🇷", USD:"🇺🇸",
  ZAR:"🇿🇦", MAD:"🇲🇦", AED:"🇦🇪",
};

export default function DetailScreen() {
  const { theme, lang, darkMode } = useApp();
  const route = useRoute<DetailRoute>();
  const navigation = useNavigation<Nav>();
  const t = T[lang];
  const { code, name } = route.params;
  const [current, setCurrent] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`https://api.frankfurter.app/latest?from=EUR&to=${code}`)
      .then(r => r.json())
      .then(res => {
        if (res.rates && res.rates[code]) setCurrent(res.rates[code]);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [code]);

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: theme.bg }]}>
      <StatusBar style={darkMode ? "light" : "dark"} />
      <View style={[s.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={[s.backText, { color: theme.primary }]}>←</Text>
        </TouchableOpacity>
        <Text style={[s.title, { color: theme.text }]}>{FLAGS[code] ?? "🏳️"} {code}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={s.scroll}>
        <Text style={[s.name, { color: theme.muted }]}>{name}</Text>
        <View style={[s.statCard, { backgroundColor: theme.card }]}>
          <Text style={[s.statLabel, { color: theme.muted }]}>{t.detailCurrent}</Text>
          <Text style={[s.statValue, { color: theme.text }]}>
            {loading || current === null ? "…" : current.toFixed(4)}
          </Text>
        </View>

        <View style={[s.chartCard, { backgroundColor: theme.card }]}>
          <Text style={[s.chartTitle, { color: theme.text }]}>{t.detailChart}</Text>
          <NativeHistoryChart from="EUR" to={code} height={220} period="1M" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, borderBottomWidth: 1 },
  backBtn: { padding: 8 },
  backText: { fontSize: 24, fontWeight: "bold" },
  title: { fontSize: 20, fontWeight: "bold" },
  scroll: { padding: 16 },
  name: { fontSize: 16, textAlign: "center", marginBottom: 20 },
  statCard: { borderRadius: 16, padding: 20, alignItems: "center", marginBottom: 16 },
  statLabel: { fontSize: 12, textTransform: "uppercase", marginBottom: 8 },
  statValue: { fontSize: 24, fontWeight: "bold" },
  chartCard: { borderRadius: 16, padding: 16 },
  chartTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 16 },
});
