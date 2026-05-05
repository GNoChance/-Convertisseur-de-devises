import { useEffect, useState } from "react";
import { ActivityIndicator, Linking, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import NativeHistoryChart from "../components/NativeHistoryChart";
import { useApp } from "../context/AppContext";

// ─── Flags ────────────────────────────────────────────────────────────────────

const FLAGS: Record<string, string> = {
  EUR: "🇪🇺", USD: "🇺🇸", GBP: "🇬🇧", JPY: "🇯🇵", CHF: "🇨🇭",
  CAD: "🇨🇦", AUD: "🇦🇺", CNY: "🇨🇳", ILS: "🇮🇱", MAD: "🇲🇦",
  AED: "🇦🇪", BRL: "🇧🇷", INR: "🇮🇳", KRW: "🇰🇷", MXN: "🇲🇽",
  NOK: "🇳🇴", NZD: "🇳🇿", PLN: "🇵🇱", SEK: "🇸🇪", SGD: "🇸🇬",
  TRY: "🇹🇷", ZAR: "🇿🇦", HKD: "🇭🇰", DKK: "🇩🇰",
};

// ─── Periods ──────────────────────────────────────────────────────────────────

const PERIODS = [
  { key: "1W", labelFr: "1S",  labelEn: "1W" },
  { key: "1M", labelFr: "1M",  labelEn: "1M" },
  { key: "3M", labelFr: "3M",  labelEn: "3M" },
  { key: "6M", labelFr: "6M",  labelEn: "6M" },
  { key: "1Y", labelFr: "1A",  labelEn: "1Y" },
] as const;

type PeriodKey = (typeof PERIODS)[number]["key"];

interface PeriodStats {
  current: number;
}

// ─── Stats Card ───────────────────────────────────────────────────────────────

function StatCard({ label, value, dark }: { label: string; value: string; dark: boolean }) {
  const cardBg  = dark ? "#1C1C28" : "#FFFFFF";
  return (
    <View style={[sc.card, { backgroundColor: cardBg }]}>
      <Text style={[sc.label, { color: dark ? "#636366" : "#8E8E93" }]}>{label}</Text>
      <Text style={[sc.value, { color: dark ? "#F5F5FA" : "#1C1C1E" }]}>{value}</Text>
    </View>
  );
}

const sc = StyleSheet.create({
  card: { flex: 1, borderRadius: 12, paddingVertical: 10, alignItems: "center" },
  label: { fontSize: 10, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 },
  value: { fontSize: 14, fontWeight: "700" },
});

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function GraphScreen() {
  const { theme, lang, darkMode, selectedFrom, selectedTo, setSelectedPair } = useApp();
  const [period, setPeriod] = useState<PeriodKey>("1M");
  const [stats, setStats] = useState<PeriodStats | null>(null);
  const [loading, setLoading] = useState(false);

  const swapCurrencies = () => setSelectedPair(selectedTo, selectedFrom);
  
  const fromFlag = FLAGS[selectedFrom] ?? "🏳️";
  const toFlag   = FLAGS[selectedTo]   ?? "🏳️";
  const bg       = darkMode ? "#0F0F14" : theme.bg;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`https://api.frankfurter.app/latest?from=${selectedFrom}&to=${selectedTo}`)
      .then(r => r.json())
      .then(res => {
        if (cancelled) return;
        if (res.rates && res.rates[selectedTo]) {
          setStats({ current: res.rates[selectedTo] });
        }
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [selectedFrom, selectedTo]);

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: bg }]} edges={["top", "left", "right"]}>
      <StatusBar style={darkMode ? "light" : "dark"} />

      <View style={[s.header, { borderBottomColor: darkMode ? "#2C2C3A" : "#E5E5EA" }]}>
        <View style={s.pairRow}>
          <TouchableOpacity onPress={swapCurrencies} activeOpacity={0.7} style={s.pairBtn}>
            <Text style={[s.pairText, { color: theme.text }]}>
              {fromFlag} {selectedFrom} ⇄ {toFlag} {selectedTo}
            </Text>
          </TouchableOpacity>
          <Text style={[s.sub, { color: theme.muted }]}>
            {lang === "fr" ? "Données Frankfurter · Quotidien" : "Frankfurter · Daily data"}
          </Text>
        </View>
      </View>

      <View style={[s.statsBar, { borderBottomColor: darkMode ? "#2C2C3A" : "#E5E5EA" }]}>
        <StatCard 
          label={lang === "fr" ? "Actuel" : "Current"} 
          value={loading || !stats ? "…" : stats.current.toFixed(4)} 
          dark={darkMode} 
        />
      </View>

      <View style={s.periodBar}>
        {PERIODS.map((p) => (
          <TouchableOpacity
            key={p.key}
            style={[s.periodBtn, period === p.key && { backgroundColor: theme.primary }]}
            onPress={() => setPeriod(p.key)}
          >
            <Text style={[s.periodLabel, { color: period === p.key ? "#FFF" : theme.muted }]}>
              {lang === "fr" ? p.labelFr : p.labelEn}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={s.chartContainer}>
        <NativeHistoryChart from={selectedFrom} to={selectedTo} period={period} height={300} />
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  header: { paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1 },
  pairRow: { flex: 1 },
  pairBtn: { paddingVertical: 4 },
  pairText: { fontSize: 18, fontWeight: "700" },
  sub: { fontSize: 12, marginTop: 2 },
  statsBar: { padding: 12, borderBottomWidth: 1 },
  periodBar: { flexDirection: "row", justifyContent: "space-around", padding: 12 },
  periodBtn: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20 },
  periodLabel: { fontSize: 13, fontWeight: "700" },
  chartContainer: { flex: 1, padding: 10 },
});
