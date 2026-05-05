import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
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
  { code: "ILS", name: { fr: "Shekel israélien",     en: "Israeli Shekel" },     flag: "🇮🇱", symbol: "₪" },
  { code: "USD", name: { fr: "Dollar américain",     en: "US Dollar" },          flag: "🇺🇸", symbol: "$" },
  { code: "EUR", name: { fr: "Euro",                 en: "Euro" },               flag: "🇪🇺", symbol: "€" },
  { code: "GBP", name: { fr: "Livre sterling",       en: "British Pound" },      flag: "🇬🇧", symbol: "£" },
  { code: "JPY", name: { fr: "Yen japonais",         en: "Japanese Yen" },       flag: "🇯🇵", symbol: "¥" },
  { code: "CHF", name: { fr: "Franc suisse",         en: "Swiss Franc" },        flag: "🇨🇭", symbol: "Fr" },
  { code: "CAD", name: { fr: "Dollar canadien",      en: "Canadian Dollar" },    flag: "🇨🇦", symbol: "CA$" },
  { code: "AUD", name: { fr: "Dollar australien",    en: "Australian Dollar" },  flag: "🇦🇺", symbol: "A$" },
  { code: "CNY", name: { fr: "Yuan chinois",         en: "Chinese Yuan" },       flag: "🇨🇳", symbol: "¥" },
  { code: "MAD", name: { fr: "Dirham marocain",      en: "Moroccan Dirham" },    flag: "🇲🇦", symbol: "د.م." },
  { code: "AED", name: { fr: "Dirham des EAU",       en: "UAE Dirham" },         flag: "🇦🇪", symbol: "د.إ" },
  { code: "BRL", name: { fr: "Réal brésilien",       en: "Brazilian Real" },     flag: "🇧🇷", symbol: "R$" },
  { code: "INR", name: { fr: "Roupie indienne",      en: "Indian Rupee" },       flag: "🇮🇳", symbol: "₹" },
  { code: "KRW", name: { fr: "Won sud-coréen",       en: "South Korean Won" },   flag: "🇰🇷", symbol: "₩" },
  { code: "MXN", name: { fr: "Peso mexicain",        en: "Mexican Peso" },       flag: "🇲🇽", symbol: "$" },
  { code: "NOK", name: { fr: "Couronne norvégienne", en: "Norwegian Krone" },    flag: "🇳🇴", symbol: "kr" },
  { code: "NZD", name: { fr: "Dollar néo-zélandais", en: "New Zealand Dollar" }, flag: "🇳🇿", symbol: "NZ$" },
  { code: "PLN", name: { fr: "Zloty polonais",       en: "Polish Zloty" },       flag: "🇵🇱", symbol: "zł" },
  { code: "SEK", name: { fr: "Couronne suédoise",    en: "Swedish Krona" },      flag: "🇸🇪", symbol: "kr" },
  { code: "SGD", name: { fr: "Dollar de Singapour",  en: "Singapore Dollar" },   flag: "🇸🇬", symbol: "S$" },
  { code: "TRY", name: { fr: "Livre turque",         en: "Turkish Lira" },       flag: "🇹🇷", symbol: "₺" },
  { code: "ZAR", name: { fr: "Rand sud-africain",    en: "South African Rand" }, flag: "🇿🇦", symbol: "R" },
  { code: "HKD", name: { fr: "Dollar de HK",         en: "Hong Kong Dollar" },   flag: "🇭🇰", symbol: "HK$" },
  { code: "DKK", name: { fr: "Couronne danoise",     en: "Danish Krone" },       flag: "🇩🇰", symbol: "kr" },
];

type Currency = (typeof CURRENCIES)[number];
const FLAGS: Record<string, string> = Object.fromEntries(CURRENCIES.map((c) => [c.code, c.flag]));

function getCurrency(code: string): Currency {
  return CURRENCIES.find((c) => c.code === code) ?? CURRENCIES[0];
}

export default function ConverterScreen() {
  const {
    theme, lang, darkMode, setDarkMode,
    watchlist, addToWatchlist, removeFromWatchlist, isInWatchlist,
  } = useApp();
  const navigation = useNavigation<BottomTabNavigationProp<TabParamList>>();
  const t          = T[lang];

  const [fromCurrency, setFromCurrency] = useState<Currency>(getCurrency("EUR"));
  const [toCurrency,   setToCurrency]   = useState<Currency>(getCurrency("USD"));
  const [fromAmount,   setFromAmount]   = useState("1");
  const [rate,         setRate]         = useState<number | null>(null);
  const [loadingRate,  setLoadingRate]  = useState(false);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerTarget,  setPickerTarget]  = useState<"from" | "to">("from");
  const [wlPickerVisible, setWlPickerVisible] = useState(false);
  const [search,         setSearch]        = useState("");
  const [wlSearch,       setWlSearch]      = useState("");
  const [wlRates,          setWlRates]          = useState<Record<string, number>>({});

  useEffect(() => {
    if (watchlist.length === 0) return;
    fetch(`https://api.frankfurter.app/latest?from=${fromCurrency.code}`)
      .then(r => r.json())
      .then(data => setWlRates(data.rates || {}))
      .catch(() => {});
  }, [watchlist, fromCurrency.code]);

  useEffect(() => {
    if (fromCurrency.code === toCurrency.code) { setRate(1); return; }
    setLoadingRate(true);
    fetch(`https://api.frankfurter.app/latest?from=${fromCurrency.code}&to=${toCurrency.code}`)
      .then(r => r.json())
      .then(data => setRate(data.rates[toCurrency.code]))
      .catch(() => setRate(null))
      .finally(() => setLoadingRate(false));
  }, [fromCurrency.code, toCurrency.code]);

  const numFrom = parseFloat(fromAmount.replace(",", ".")) || 0;
  const numTo   = rate !== null ? numFrom * rate : null;

  const selectCurrency = (c: Currency) => {
    if (pickerTarget === "from") setFromCurrency(c);
    else setToCurrency(c);
    setPickerVisible(false);
  };

  const filtered = CURRENCIES.filter(
    (c) =>
      c.code.toLowerCase().includes(search.toLowerCase()) ||
      c.name[lang].toLowerCase().includes(search.toLowerCase())
  );

  const wlFiltered = CURRENCIES.filter(
    (c) =>
      c.code.toLowerCase().includes(wlSearch.toLowerCase()) ||
      c.name[lang].toLowerCase().includes(wlSearch.toLowerCase())
  );

  return (
    <Layout>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
        
        {/* Vous envoyez */}
        <View style={[s.card, { backgroundColor: theme.card }]}>
          <Text style={[s.label, { color: theme.muted }]}>{t.youSend}</Text>
          <View style={s.row}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <TextInput
                style={[s.amount, { color: theme.text }]}
                value={fromAmount}
                onChangeText={setFromAmount}
                keyboardType="decimal-pad"
              />
              <Text style={[s.unit, { color: theme.muted }]}>{fromCurrency.symbol}</Text>
            </View>
            <TouchableOpacity style={[s.pill, { backgroundColor: theme.input }]} onPress={() => { setPickerTarget("from"); setPickerVisible(true); }}>
              <Text style={{ color: theme.text }}>{fromCurrency.flag} {fromCurrency.code}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity 
          style={[s.swap, { backgroundColor: theme.primary }]} 
          onPress={() => { setFromCurrency(toCurrency); setToCurrency(fromCurrency); }}
        >
          <Text style={{ color: "#FFF", fontSize: 20 }}>⇅</Text>
        </TouchableOpacity>

        {/* Ils reçoivent */}
        <View style={[s.card, { backgroundColor: theme.card }]}>
          <Text style={[s.label, { color: theme.muted }]}>{t.theyGet}</Text>
          <View style={s.row}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <Text style={[s.amount, { color: theme.primary }]}>
                {loadingRate ? "..." : (numTo?.toFixed(2) || "—")}
              </Text>
              <Text style={[s.unit, { color: theme.primary, marginLeft: 8 }]}>{toCurrency.symbol}</Text>
            </View>
            <TouchableOpacity style={[s.pill, { backgroundColor: theme.input }]} onPress={() => { setPickerTarget("to"); setPickerVisible(true); }}>
              <Text style={{ color: theme.text }}>{toCurrency.flag} {toCurrency.code}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Watchlist Header */}
        <View style={s.wlHeader}>
          <Text style={[s.sectionTitle, { color: theme.muted, marginTop: 0 }]}>{t.watchlistTitle}</Text>
          <TouchableOpacity 
            style={[s.wlAddBtn, { backgroundColor: theme.primary + "20" }]} 
            onPress={() => { setWlSearch(""); setWlPickerVisible(true); }}
          >
            <Text style={{ color: theme.primary, fontWeight: "700", fontSize: 12 }}>+ Ajouter</Text>
          </TouchableOpacity>
        </View>

        {watchlist.length === 0 ? (
          <View style={[s.emptyWl, { backgroundColor: theme.card }]}>
            <Text style={{ color: theme.muted }}>{t.watchlistEmpty}</Text>
          </View>
        ) : (
          watchlist.map(code => {
            const cur = CURRENCIES.find(c => c.code === code);
            const val = wlRates[code];
            return (
              <TouchableOpacity 
                key={code} 
                style={[s.wlRow, { backgroundColor: theme.card }]}
                onPress={() => navigation.getParent()?.navigate("Detail", { code, name: cur?.name[lang] || code })}
              >
                <Text style={s.flag}>{cur?.flag}</Text>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={{ fontWeight: "700", color: theme.text }}>{code}</Text>
                  <Text style={{ fontSize: 13, color: theme.muted }}>
                    1 {fromCurrency.symbol} = {val ? `${val.toFixed(4)} ${cur?.symbol || code}` : "..."}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => removeFromWatchlist(code)} style={{ padding: 8 }}>
                  <Text style={{ color: "red", fontWeight: "bold" }}>✕</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            );
          })
        )}

      </ScrollView>

      {/* Main Picker Modal */}
      <Modal visible={pickerVisible} animationType="slide" transparent>
        <Pressable style={s.overlay} onPress={() => setPickerVisible(false)} />
        <View style={[s.sheet, { backgroundColor: theme.card }]}>
          <TextInput 
            style={[s.search, { backgroundColor: theme.input, color: theme.text }]}
            placeholder={t.searchCurrency}
            placeholderTextColor={theme.muted}
            value={search}
            onChangeText={setSearch}
          />
          <FlatList
            data={filtered}
            keyExtractor={c => c.code}
            renderItem={({ item }) => (
              <TouchableOpacity style={s.pRow} onPress={() => selectCurrency(item)}>
                <Text style={s.flag}>{item.flag}</Text>
                <Text style={{ flex: 1, marginLeft: 12, color: theme.text }}>{item.name[lang]} ({item.code})</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>

      {/* Watchlist Picker Modal */}
      <Modal visible={wlPickerVisible} animationType="slide" transparent>
        <Pressable style={s.overlay} onPress={() => setWlPickerVisible(false)} />
        <View style={[s.sheet, { backgroundColor: theme.card }]}>
          <Text style={{ fontSize: 18, fontWeight: "700", marginBottom: 15, color: theme.text }}>Ajouter aux favoris</Text>
          <TextInput 
            style={[s.search, { backgroundColor: theme.input, color: theme.text }]}
            placeholder={t.searchCurrency}
            placeholderTextColor={theme.muted}
            value={wlSearch}
            onChangeText={setWlSearch}
          />
          <FlatList
            data={wlFiltered}
            keyExtractor={c => c.code}
            renderItem={({ item }) => {
              const inList = isInWatchlist(item.code);
              return (
                <TouchableOpacity 
                  style={[s.pRow, inList && { opacity: 0.5 }]} 
                  onPress={() => { if(!inList){ addToWatchlist(item.code); setWlPickerVisible(false); } }}
                >
                  <Text style={s.flag}>{item.flag}</Text>
                  <Text style={{ flex: 1, marginLeft: 12, color: theme.text }}>{item.name[lang]} ({item.code})</Text>
                  {inList && <Text style={{ color: theme.primary }}>★</Text>}
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </Modal>
    </Layout>
  );
}

const s = StyleSheet.create({
  card: { borderRadius: 18, padding: 18, marginBottom: 10 },
  label: { fontSize: 11, fontWeight: "600", textTransform: "uppercase", marginBottom: 10 },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  amount: { fontSize: 28, fontWeight: "700" },
  unit: { fontSize: 18, fontWeight: "600", marginLeft: 6, marginTop: 4 },
  pill: { flexDirection: "row", alignItems: "center", padding: 8, borderRadius: 20 },
  swap: { alignSelf: "center", width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", marginVertical: 10 },
  sectionTitle: { fontSize: 12, fontWeight: "700", textTransform: "uppercase" },
  wlHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, marginBottom: 10 },
  wlAddBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  wlRow: { flexDirection: "row", alignItems: "center", padding: 14, borderRadius: 16, marginBottom: 8 },
  emptyWl: { padding: 30, alignItems: 'center', borderRadius: 16 },
  flag: { fontSize: 24 },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)" },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, height: "70%", marginTop: 'auto' },
  search: { borderRadius: 12, padding: 12, marginBottom: 10 },
  pRow: { flexDirection: "row", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
});
