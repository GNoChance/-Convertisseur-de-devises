import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import Animated, { FadeInDown, Layout } from "react-native-reanimated";

import { useApp } from "../context/AppContext";
import { T } from "../i18n/translations";
import { TabParamList } from "../navigation/AppNavigator";
import LayoutComponent from "../components/Layout";

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

type Nav = BottomTabNavigationProp<TabParamList>;

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const SkeletonItem = ({ theme }: { theme: any }) => (
  <View style={[s.row, { backgroundColor: theme.card, opacity: 0.5 }]}>
    <View style={[s.flagCircle, { backgroundColor: theme.input }]} />
    <View style={s.info}>
      <View style={{ height: 16, width: 60, backgroundColor: theme.input, borderRadius: 4 }} />
      <View style={{ height: 12, width: 120, backgroundColor: theme.input, borderRadius: 4, marginTop: 6 }} />
    </View>
    <View style={{ height: 20, width: 80, backgroundColor: theme.input, borderRadius: 4 }} />
  </View>
);

export default function ListScreen() {
  const { theme, lang, darkMode } = useApp();
  const navigation = useNavigation<Nav>();
  const t = T[lang];

  const [base, setBase] = useState("EUR");
  const [rates, setRates] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  const fetchRates = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    setError(null);
    try {
      const r = await fetch(`https://api.frankfurter.app/latest?from=${base}`);
      if (!r.ok) throw new Error("API Error");
      const data = await r.json();
      setRates(data.rates || {});
    } catch (e) {
      setError(lang === "fr" ? "Erreur de connexion" : "Connection error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [base, lang]);

  useEffect(() => {
    fetchRates();
  }, [fetchRates]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchRates(true);
  };

  const filtered = useMemo(() => 
    CURRENCIES.filter(
      (c) =>
        c.code !== base &&
        (c.code.toLowerCase().includes(search.toLowerCase()) ||
          c.name[lang].toLowerCase().includes(search.toLowerCase()))
    ), [base, search, lang]
  );

  const ds = useMemo(() => ({
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
  }), [theme, darkMode]);

  // ── List Header ─────────────────────────────────────────────────────────────
  const renderHeader = () => (
    <View style={s.headerContainer}>
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
      
      {error && (
        <TouchableOpacity style={s.errorBox} onPress={() => fetchRates()}>
          <Text style={s.errorText}>{error} - {lang === "fr" ? "Réessayer" : "Retry"}</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  // ── List Empty ──────────────────────────────────────────────────────────────
  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={s.emptyContainer}>
        <Text style={[s.emptyText, ds.muted]}>
          {lang === "fr" ? "Aucun résultat trouvé" : "No results found"}
        </Text>
      </View>
    );
  };

  return (
    <LayoutComponent>
      <View style={s.container}>
        {loading && !refreshing ? (
          <View style={s.skeletonList}>
            {renderHeader()}
            {[1, 2, 3, 4, 5, 6].map((i) => <SkeletonItem key={i} theme={theme} />)}
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.code}
            ListHeaderComponent={renderHeader}
            ListEmptyComponent={renderEmpty}
            contentContainerStyle={s.listContent}
            refreshControl={
              <RefreshControl 
                refreshing={refreshing} 
                onRefresh={onRefresh} 
                tintColor={theme.primary} 
                colors={[theme.primary]}
              />
            }
            // Performance optimizations
            windowSize={10}
            maxToRenderPerBatch={10}
            initialNumToRender={12}
            removeClippedSubviews={true}
            renderItem={({ item, index }) => (
              <Animated.View 
                entering={FadeInDown.delay(index * 50).duration(400)}
                layout={Layout.springify()}
              >
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
              </Animated.View>
            )}
          />
        )}
      </View>
    </LayoutComponent>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  headerContainer: { paddingHorizontal: 20, paddingTop: 10 },
  title: { fontSize: 28, fontWeight: "800" },
  subtitle: { fontSize: 15, marginBottom: 20, marginTop: 4 },
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
    marginHorizontal: 20,
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
  skeletonList: { flex: 1 },
  errorBox: {
    backgroundColor: "#FF3B3015",
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: "center",
  },
  errorText: { color: "#FF3B30", fontWeight: "600", fontSize: 14 },
  emptyContainer: { alignItems: "center", marginTop: 40 },
  emptyText: { fontSize: 15 },
});
