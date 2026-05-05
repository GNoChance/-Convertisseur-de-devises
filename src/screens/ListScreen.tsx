import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";

import { useApp } from "../context/AppContext";
import { T } from "../i18n/translations";
import { TabParamList } from "../navigation/AppNavigator";
import Layout from "../components/Layout";

// ─── Data ─────────────────────────────────────────────────────────────────────

const CURRENCIES = [
  { code: "ILS", name: { fr: "Shekel israélien",     en: "Israeli Shekel" },     flag: "🇮🇱" },
  { code: "USD", name: { fr: "Dollar américain",     en: "US Dollar" },          flag: "🇺🇸" },
  { code: "EUR", name: { fr: "Euro",                 en: "Euro" },               flag: "🇪🇺" },
  { code: "GBP", name: { fr: "Livre sterling",       en: "British Pound" },      flag: "🇬🇧" },
  { code: "JPY", name: { fr: "Yen japonais",         en: "Japanese Yen" },       flag: "🇯🇵" },
  { code: "CHF", name: { fr: "Franc suisse",         en: "Swiss Franc" },        flag: "🇨🇭" },
  { code: "CAD", name: { fr: "Dollar canadien",      en: "Canadian Dollar" },    flag: "🇨🇦" },
  { code: "AUD", name: { fr: "Dollar australien",    en: "Australian Dollar" },  flag: "🇦🇺" },
  { code: "CNY", name: { fr: "Yuan chinois",         en: "Chinese Yuan" },       flag: "🇨🇳" },
  { code: "MAD", name: { fr: "Dirham marocain",      en: "Moroccan Dirham" },    flag: "🇲🇦" },
  { code: "AED", name: { fr: "Dirham des EAU",       en: "UAE Dirham" },         flag: "🇦🇪" },
  { code: "BRL", name: { fr: "Réal brésilien",       en: "Brazilian Real" },     flag: "🇧🇷" },
  { code: "INR", name: { fr: "Roupie indienne",      en: "Indian Rupee" },       flag: "🇮🇳" },
  { code: "KRW", name: { fr: "Won sud-coréen",       en: "South Korean Won" },   flag: "🇰🇷" },
  { code: "MXN", name: { fr: "Peso mexicain",        en: "Mexican Peso" },       flag: "🇲🇽" },
  { code: "NOK", name: { fr: "Couronne norvégienne", en: "Norwegian Krone" },    flag: "🇳🇴" },
  { code: "NZD", name: { fr: "Dollar néo-zélandais", en: "New Zealand Dollar" }, flag: "🇳🇿" },
  { code: "PLN", name: { fr: "Zloty polonais",       en: "Polish Zloty" },       flag: "🇵🇱" },
  { code: "SEK", name: { fr: "Couronne suédoise",    en: "Swedish Krona" },      flag: "🇸🇪" },
  { code: "SGD", name: { fr: "Dollar de Singapour",  en: "Singapore Dollar" },   flag: "🇸🇬" },
  { code: "TRY", name: { fr: "Livre turque",         en: "Turkish Lira" },       flag: "🇹🇷" },
  { code: "ZAR", name: { fr: "Rand sud-africain",    en: "South African Rand" }, flag: "🇿🇦" },
  { code: "HKD", name: { fr: "Dollar de HK",         en: "Hong Kong Dollar" },   flag: "🇭🇰" },
  { code: "DKK", name: { fr: "Couronne danoise",     en: "Danish Krone" },       flag: "🇩🇰" },
];

const FLAGS: Record<string, string> = Object.fromEntries(CURRENCIES.map((c) => [c.code, c.flag]));

type Nav = BottomTabNavigationProp<TabParamList>;

export default function ListScreen() {
  const { theme, lang, darkMode } = useApp();
  const navigation = useNavigation<Nav>();
  const t = T[lang];

  const [base, setBase] = useState("EUR");
  const [rates, setRates] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setLoading(true);
    fetch(`https://api.frankfurter.app/latest?from=${base}`)
      .then((r) => r.json())
      .then((data) => {
        setRates(data.rates || {});
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [base]);

  const filtered = CURRENCIES.filter(
    (c) =>
      c.code !== base &&
      (c.code.toLowerCase().includes(search.toLowerCase()) ||
        c.name[lang].toLowerCase().includes(search.toLowerCase()))
  );

  const ds = {
    card: {
      backgroundColor: theme.card,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: darkMode ? 0 : 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    text: { color: theme.text },
    muted: { color: theme.muted },
    input: { backgroundColor: theme.input },
  };

  return (
    <Layout>
      <View style={s.container}>
        <Text style={[s.title, ds.text]}>
          {lang === "fr" ? "Cours du marché" : "Market Rates"}
        </Text>
        <Text style={[s.subtitle, ds.muted]}>
          {lang === "fr" ? `Base : 1 ${base}` : `Base: 1 ${base}`}
        </Text>

        <TextInput
          style={[s.search, ds.input, ds.text]}
          placeholder={t.searchCurrency}
          placeholderTextColor={theme.muted}
          value={search}
          onChangeText={setSearch}
        />

        {loading ? (
          <ActivityIndicator color={theme.primary} style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.code}
            contentContainerStyle={s.listContent}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[s.row, ds.card]}
                activeOpacity={0.7}
                onPress={() =>
                  navigation.getParent()?.navigate("Detail", {
                    code: item.code,
                    name: item.name[lang],
                  })
                }
              >
                <View style={[s.flagCircle, ds.input]}>
                  <Text style={s.flag}>{item.flag}</Text>
                </View>
                <View style={s.info}>
                  <Text style={[s.code, ds.text]}>{item.code}</Text>
                  <Text style={[s.name, ds.muted]} numberOfLines={1}>
                    {item.name[lang]}
                  </Text>
                </View>
                <View style={s.rateBlock}>
                  <Text style={[s.rate, { color: theme.primary }]}>
                    {rates[item.code]?.toFixed(4) || "—"}
                  </Text>
                  <Text style={[s.chevron, ds.muted]}>›</Text>
                </View>
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    </Layout>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20 },
  title: { fontSize: 28, fontWeight: "800", marginTop: 10 },
  subtitle: { fontSize: 15, marginBottom: 20 },
  search: {
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: 20,
  },
  listContent: { paddingBottom: 40 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 18,
    marginBottom: 10,
  },
  flagCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  flag: { fontSize: 24 },
  info: { flex: 1, marginLeft: 14 },
  code: { fontSize: 16, fontWeight: "700" },
  name: { fontSize: 13, marginTop: 2 },
  rateBlock: { flexDirection: "row", alignItems: "center" },
  rate: { fontSize: 17, fontWeight: "700", marginRight: 8 },
  chevron: { fontSize: 20 },
});
