import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
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

const CURRENCIES = [
  { code: "ILS", flag: "🇮🇱", name: { fr: "Shekel israélien", en: "Israeli Shekel" }, symbol: "₪" },
  { code: "USD", flag: "🇺🇸", name: { fr: "Dollar américain", en: "US Dollar" }, symbol: "$" },
  { code: "EUR", flag: "🇪🇺", name: { fr: "Euro", en: "Euro" }, symbol: "€" },
  { code: "GBP", flag: "🇬🇧", name: { fr: "Livre sterling", en: "British Pound" }, symbol: "£" },
  { code: "JPY", flag: "🇯🇵", name: { fr: "Yen japonais", en: "Japanese Yen" }, symbol: "¥" },
  { code: "CHF", flag: "🇨🇭", name: { fr: "Franc suisse", en: "Swiss Franc" }, symbol: "Fr" },
  { code: "CAD", flag: "🇨🇦", name: { fr: "Dollar canadien", en: "Canadian Dollar" }, symbol: "CA$" },
  { code: "AUD", flag: "🇦🇺", name: { fr: "Dollar australien", en: "Australian Dollar" }, symbol: "A$" },
  { code: "CNY", flag: "🇨🇳", name: { fr: "Yuan chinois", en: "Chinese Yuan" }, symbol: "¥" },
  { code: "MAD", flag: "🇲🇦", name: { fr: "Dirham marocain", en: "Moroccan Dirham" }, symbol: "د.m." },
  { code: "AED", flag: "🇦🇪", name: { fr: "Dirham des EAU", en: "UAE Dirham" }, symbol: "د.إ" },
  { code: "BRL", flag: "🇧🇷", name: { fr: "Réal brésilien", en: "Brazilian Real" }, symbol: "R$" },
  { code: "INR", flag: "🇮🇳", name: { fr: "Roupie indienne", en: "Indian Rupee" }, symbol: "₹" },
  { code: "KRW", flag: "🇰🇷", name: { fr: "Won sud-coréen", en: "South Korean Won" }, symbol: "₩" },
  { code: "MXN", flag: "🇲🇽", name: { fr: "Peso mexicain", en: "Mexican Peso" }, symbol: "$" },
  { code: "NOK", flag: "🇳🇴", name: { fr: "Couronne norvégienne", en: "Norwegian Krone" }, symbol: "kr" },
  { code: "NZD", flag: "🇳🇿", name: { fr: "Dollar néo-zélandais", en: "New Zealand Dollar" }, symbol: "NZ$" },
  { code: "PLN", flag: "🇵🇱", name: { fr: "Zloty polonais", en: "Polish Zloty" }, symbol: "zł" },
  { code: "SEK", flag: "🇸🇪", name: { fr: "Couronne suédoise", en: "Swedish Krona" }, symbol: "kr" },
  { code: "SGD", flag: "🇸🇬", name: { fr: "Dollar de Singapour", en: "Singapore Dollar" }, symbol: "S$" },
  { code: "TRY", flag: "🇹🇷", name: { fr: "Livre turque", en: "Turkish Lira" }, symbol: "₺" },
  { code: "ZAR", flag: "🇿🇦", name: { fr: "Rand sud-africain", en: "South African Rand" }, symbol: "R" },
  { code: "HKD", flag: "🇭🇰", name: { fr: "Dollar de HK", en: "Hong Kong Dollar" }, symbol: "HK$" },
  { code: "DKK", flag: "🇩🇰", name: { fr: "Couronne danoise", en: "Danish Krone" }, symbol: "kr" },
];

const SkeletonItem = ({ theme }: { theme: any }) => (
  <View style={[s.row, { backgroundColor: theme.card, opacity: 0.5 }]}>
    <View style={[s.flagCircle, { backgroundColor: theme.input }]} />
    <View style={s.info}>
      <View style={{ height: 16, width: 60, backgroundColor: theme.input, borderRadius: 4 }} />
      <View style={{ height: 12, width: 120, backgroundColor: theme.input, borderRadius: 4, marginTop: 6 }} />
    </View>
  </View>
);

export default function ListScreen() {
  const { theme, lang } = useApp();
  const navigation = useNavigation<BottomTabNavigationProp<TabParamList>>();
  const t = T[lang];
 
  const [base, setBase] = useState("EUR");
  const [rates, setRates] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [pickerVisible, setPickerVisible] = useState(false);
  const [error, setError] = useState<boolean>(false);
 
  const fetchRates = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    setError(false);
    try {
      const r = await fetch(`https://api.frankfurter.app/latest?from=${base}`);
      if (!r.ok) throw new Error("API Error");
      const data = await r.json();
      setRates(data.rates || {});
    } catch (e) {
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [base]);

  useEffect(() => {
    fetchRates();
  }, [fetchRates]);

  const filtered = useMemo(() => 
    CURRENCIES.filter(
      (c) =>
        c.code !== base &&
        (c.code.toLowerCase().includes(search.toLowerCase()) ||
          c.name[lang].toLowerCase().includes(search.toLowerCase()))
    ), [search, lang, base]
  );

  const baseCurrency = CURRENCIES.find(c => c.code === base) || CURRENCIES[0];

  const renderHeader = () => (
    <View style={s.headerContainer}>
      <Text style={[s.title, { color: theme.text }]}>Cours du marché</Text>
      
      <View style={s.baseRow}>
        <Text style={[s.subtitle, { color: theme.muted }]}>Base : 1 {baseCurrency.symbol || baseCurrency.code}</Text>
        <TouchableOpacity style={[s.changeBtn, { backgroundColor: theme.primary }]} onPress={() => setPickerVisible(true)}>
          <Text style={{ color: "#FFF", fontSize: 12, fontWeight: "700" }}>{lang === "fr" ? "Changer" : "Change"}</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={[s.search, { backgroundColor: theme.input, color: theme.text }]}
        placeholder={t.searchCurrency}
        placeholderTextColor={theme.muted}
        value={search}
        onChangeText={setSearch}
      />
      
      {error && (
        <View style={s.errorBox}>
          <Text style={{ color: 'red' }}>{lang === "fr" ? "Erreur de chargement" : "Loading error"}</Text>
        </View>
      )}
    </View>
  );

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={s.emptyBox}>
        <Text style={{ color: theme.muted }}>{lang === "fr" ? "Aucun résultat" : "No results"}</Text>
      </View>
    );
  };

  return (
    <LayoutComponent>
      <View style={s.container}>
        {loading && !refreshing ? (
          <View style={{ padding: 20 }}>
            {renderHeader()}
            {[1, 2, 3, 4, 5, 6].map(i => <SkeletonItem key={i} theme={theme} />)}
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.code}
            ListHeaderComponent={renderHeader}
            ListEmptyComponent={renderEmpty}
            contentContainerStyle={{ paddingBottom: 40 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchRates(true)} tintColor={theme.primary} />}
            // Optimisations demandées
            windowSize={10}
            maxToRenderPerBatch={10}
            removeClippedSubviews={true}
            renderItem={({ item, index }) => (
              <Animated.View entering={FadeInDown.delay(index * 50).duration(400)} layout={Layout.springify()}>
                <TouchableOpacity
                  style={[s.row, { backgroundColor: theme.card }]}
                  onPress={() => navigation.getParent()?.navigate("Detail", { code: item.code, name: item.name[lang] })}
                >
                  <View style={[s.flagCircle, { backgroundColor: theme.input }]}>
                    <Text style={s.flag}>{item.flag}</Text>
                  </View>
                  <View style={s.info}>
                    <Text style={[s.code, { color: theme.text }]}>{item.code}</Text>
                    <Text style={[s.name, { color: theme.muted }]}>{item.name[lang]}</Text>
                  </View>
                  <Text style={[s.rate, { color: theme.primary }]}>
                    {rates[item.code] ? `${rates[item.code].toFixed(4)} ${item.symbol || item.code}` : "—"}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            )}
          />
        )}
      </View>

      {/* Picker Modal */}
      <Modal visible={pickerVisible} animationType="slide" transparent>
        <Pressable style={s.overlay} onPress={() => setPickerVisible(false)} />
        <View style={[s.sheet, { backgroundColor: theme.card }]}>
          <FlatList
            data={CURRENCIES}
            keyExtractor={c => c.code}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={s.pRow} 
                onPress={() => { setBase(item.code); setPickerVisible(false); }}
              >
                <Text style={s.pFlag}>{item.flag}</Text>
                <Text style={{ flex: 1, marginLeft: 12, color: theme.text, fontWeight: base === item.code ? "700" : "400" }}>
                  {item.name[lang]} ({item.code})
                </Text>
                {base === item.code && <Text style={{ color: theme.primary }}>✓</Text>}
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>
    </LayoutComponent>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  headerContainer: { paddingHorizontal: 20, paddingTop: 10 },
  title: { fontSize: 28, fontWeight: "800" },
  baseRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginVertical: 10 },
  subtitle: { fontSize: 15 },
  changeBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  search: { borderRadius: 14, padding: 12, fontSize: 15, marginBottom: 20 },
  row: { flexDirection: "row", alignItems: "center", padding: 14, borderRadius: 18, marginBottom: 10, marginHorizontal: 20 },
  flagCircle: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  flag: { fontSize: 24 },
  info: { flex: 1, marginLeft: 14 },
  code: { fontSize: 16, fontWeight: "700" },
  name: { fontSize: 13 },
  rate: { fontSize: 15, fontWeight: "700" },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)" },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, height: "70%", marginTop: "auto" },
  pRow: { flexDirection: "row", alignItems: "center", paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: "rgba(0,0,0,0.05)" },
  pFlag: { fontSize: 24 },
  errorBox: { padding: 10, backgroundColor: '#FF000010', borderRadius: 10, marginBottom: 10, alignItems: 'center' },
  emptyBox: { padding: 40, alignItems: 'center' },
});
