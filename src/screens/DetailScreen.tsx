import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRoute, useNavigation, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { useApp } from "../context/AppContext";
import { T } from "../i18n/translations";
import { RootStackParamList } from "../navigation/AppNavigator";
import { useHistoricalRates } from "../hooks/useHistoricalRates";
import HistoryChart from "../components/HistoryChart";

// ─── Types ────────────────────────────────────────────────────────────────────

type DetailRoute = RouteProp<RootStackParamList, "Detail">;
type Nav         = NativeStackNavigationProp<RootStackParamList, "Detail">;

// ─── Flags ────────────────────────────────────────────────────────────────────

const FLAGS: Record<string, string> = {
  AUD:"🇦🇺", BGN:"🇧🇬", BRL:"🇧🇷", CAD:"🇨🇦", CHF:"🇨🇭",
  CNY:"🇨🇳", CZK:"🇨🇿", DKK:"🇩🇰", EUR:"🇪🇺", GBP:"🇬🇧",
  HKD:"🇭🇰", HUF:"🇭🇺", IDR:"🇮🇩", ILS:"🇮🇱", INR:"🇮🇳",
  ISK:"🇮🇸", JPY:"🇯🇵", KRW:"🇰🇷", MXN:"🇲🇽", MYR:"🇲🇾",
  NOK:"🇳🇴", NZD:"🇳🇿", PHP:"🇵🇭", PLN:"🇵🇱", RON:"🇷🇴",
  SEK:"🇸🇪", SGD:"🇸🇬", THB:"🇹🇭", TRY:"🇹🇷", USD:"🇺🇸",
  ZAR:"🇿🇦", MAD:"🇲🇦", AED:"🇦🇪",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function shadow(dark: boolean) {
  if (dark) return {};
  return Platform.select({
    ios:     { shadowColor:"#000", shadowOffset:{width:0,height:2}, shadowOpacity:0.08, shadowRadius:10 },
    android: { elevation:3 },
    default: {},
  }) ?? {};
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, accent, dark }: { label:string; value:string; accent?:string; dark:boolean }) {
  const bg  = dark ? "#1C1C28" : "#FFFFFF";
  const txt = dark ? "#F5F5FA" : "#1C1C1E";
  const muted = dark ? "#636366" : "#8E8E93";
  return (
    <View style={[st.statCard, { backgroundColor: bg, ...shadow(dark) }]}>
      <Text style={[st.statLabel, { color: muted }]}>{label}</Text>
      <Text style={[st.statValue, { color: accent ?? txt }]}>{value}</Text>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function DetailScreen() {
  const { theme, lang, darkMode, isInWatchlist, addToWatchlist, removeFromWatchlist } = useApp();
  const route      = useRoute<DetailRoute>();
  const navigation = useNavigation<Nav>();
  const t          = T[lang];

  const { code, name } = route.params;
  const baseCode = "EUR";           // on compare toujours vs EUR par défaut
  const flag     = FLAGS[code] ?? "🏳️";
  const followed = isInWatchlist(code);

  const { current, min, max, changePct, loading } = useHistoricalRates(baseCode, code, 30);

  const isPositive  = changePct !== null ? changePct >= 0 : true;
  const changeColor = isPositive ? "#34C759" : "#FF3B30";

  const toggleWatchlist = () => {
    if (followed) removeFromWatchlist(code);
    else          addToWatchlist(code);
  };

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: theme.bg }]}>
      <StatusBar style={darkMode ? "light" : "dark"} />

      {/* ── Header barre ── */}
      <View style={[s.topBar, { borderBottomColor: theme.border }]}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Text style={[s.backText, { color: theme.primary }]}>←</Text>
        </TouchableOpacity>

        <View style={s.topTitle}>
          <Text style={s.topFlag}>{flag}</Text>
          <Text style={[s.topCode, { color: theme.text }]}>{code}</Text>
        </View>

        {/* Bouton watchlist */}
        <TouchableOpacity
          style={[s.followBtn, { backgroundColor: followed ? theme.primary : "transparent", borderColor: theme.primary }]}
          onPress={toggleWatchlist}
          activeOpacity={0.8}
        >
          <Text style={[s.followBtnText, { color: followed ? "#FFF" : theme.primary }]}>
            {followed ? `★ ${t.detailUnfollow}` : `☆ ${t.detailFollow}`}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[s.scroll, { backgroundColor: theme.bg }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Nom de la devise ── */}
        <Text style={[s.currencyName, { color: theme.muted }]}>{name}</Text>

        {/* ── Stats row ── */}
        <View style={s.statsRow}>
          <StatCard
            label={t.detailCurrent}
            value={loading || current === null ? "…" : current.toFixed(4)}
            dark={darkMode}
          />
          <StatCard
            label={t.detailChange}
            value={loading || changePct === null ? "…" : `${isPositive ? "+" : ""}${changePct.toFixed(2)}%`}
            accent={loading ? undefined : changeColor}
            dark={darkMode}
          />
          <StatCard
            label={t.detailMin}
            value={loading || min === null ? "…" : min.toFixed(4)}
            dark={darkMode}
          />
          <StatCard
            label={t.detailMax}
            value={loading || max === null ? "…" : max.toFixed(4)}
            dark={darkMode}
          />
        </View>

        {/* ── Graphique 30 jours ── */}
        <View style={[s.chartCard, { backgroundColor: theme.card, ...shadow(darkMode) }]}>
          <Text style={[s.chartTitle, { color: theme.text }]}>{t.detailChart}</Text>
          <Text style={[s.chartSub, { color: theme.muted }]}>
            {baseCode} / {code} · {lang === "fr" ? "30 derniers jours" : "Last 30 days"}
          </Text>
          <View style={s.chartWrap}>
            <HistoryChart
              from={baseCode}
              to={code}
              dark={darkMode}
              primary={theme.primary}
              height={220}
            />
          </View>
        </View>

        {/* ── Info source ── */}
        <Text style={[s.source, { color: theme.muted }]}>{t.detailSource}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe: { flex: 1 },

  // Barre du haut
  topBar: {
    flexDirection:     "row",
    alignItems:        "center",
    justifyContent:    "space-between",
    paddingHorizontal: 16,
    paddingVertical:   10,
    borderBottomWidth: 1,
  },
  backBtn:      { padding: 6 },
  backText:     { fontSize: 22, fontWeight: "700" },
  topTitle:     { flexDirection: "row", alignItems: "center", gap: 8 },
  topFlag:      { fontSize: 24 },
  topCode:      { fontSize: 20, fontWeight: "800", letterSpacing: 1 },

  followBtn: {
    paddingHorizontal: 14,
    paddingVertical:    7,
    borderRadius:      20,
    borderWidth:        1,
  },
  followBtnText: { fontSize: 13, fontWeight: "700" },

  // Contenu scrollable
  scroll: { paddingHorizontal: 16, paddingBottom: 40 },

  currencyName: {
    fontSize:     15,
    marginTop:    12,
    marginBottom: 16,
    textAlign:    "center",
  },

  // Stats
  statsRow: {
    flexDirection:  "row",
    flexWrap:       "wrap",
    gap:            10,
    marginBottom:   20,
  },

  // Carte graphique
  chartCard: {
    borderRadius:  20,
    padding:       16,
    marginBottom:  16,
    overflow:      "hidden",
  },
  chartTitle: { fontSize: 17, fontWeight: "700", marginBottom: 2 },
  chartSub:   { fontSize: 12, marginBottom: 14 },
  chartWrap:  { borderRadius: 12, overflow: "hidden" },

  source: { fontSize: 11, textAlign: "center", marginTop: 4 },
});

const st = StyleSheet.create({
  statCard: {
    flex:              1,
    minWidth:          "45%",
    borderRadius:      14,
    padding:           14,
    alignItems:        "center",
  },
  statLabel: { fontSize: 10, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 6 },
  statValue: { fontSize: 16, fontWeight: "800" },
});
