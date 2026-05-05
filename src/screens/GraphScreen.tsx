import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { WebView } from "react-native-webview";
import { useApp } from "../context/AppContext";

const FLAGS: Record<string, string> = {
  EUR: "🇪🇺", USD: "🇺🇸", GBP: "🇬🇧", JPY: "🇯🇵", CHF: "🇨🇭",
  CAD: "🇨🇦", AUD: "🇦🇺", CNY: "🇨🇳", ILS: "🇮🇱", MAD: "🇲🇦",
  AED: "🇦🇪", BRL: "🇧🇷", INR: "🇮🇳", KRW: "🇰🇷", MXN: "🇲🇽",
  NOK: "🇳🇴", NZD: "🇳🇿", PLN: "🇵🇱", SEK: "🇸🇪", SGD: "🇸🇬",
  TRY: "🇹🇷", ZAR: "🇿🇦", HKD: "🇭🇰", DKK: "🇩🇰",
};

const PERIODS = [
  { key: "1W", labelFr: "1S", labelEn: "1W", days: 7 },
  { key: "1M", labelFr: "1M", labelEn: "1M", days: 30 },
  { key: "6M", labelFr: "6M", labelEn: "6M", days: 180 },
  { key: "1Y", labelFr: "1A", labelEn: "1Y", days: 365 },
] as const;

type PeriodKey = (typeof PERIODS)[number]["key"];

export default function GraphScreen() {
  const { theme, lang, darkMode, selectedFrom, selectedTo, setSelectedPair } = useApp();
  const [period, setPeriod] = useState<PeriodKey>("1M");
  const [currentRate, setCurrentRate] = useState<number | null>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Fetch data in React Native
  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const days = PERIODS.find(p => p.key === period)?.days ?? 30;
    const start = new Date();
    start.setDate(start.getDate() - days);
    const startStr = start.toISOString().split('T')[0];

    // Get latest rate
    fetch(`https://api.frankfurter.app/latest?from=${selectedFrom}&to=${selectedTo}`)
      .then(r => r.json())
      .then(res => { if (!cancelled) setCurrentRate(res.rates[selectedTo]); })
      .catch(() => {});

    // Get historical data
    fetch(`https://api.frankfurter.app/${startStr}..?from=${selectedFrom}&to=${selectedTo}`)
      .then(r => r.json())
      .then(res => {
        if (cancelled) return;
        const points = Object.entries(res.rates).map(([d, r]: any) => ({
          time: d,
          value: r[selectedTo]
        }));
        setChartData(points);
        setLoading(false);
      })
      .catch(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [selectedFrom, selectedTo, period]);

  const fromFlag = FLAGS[selectedFrom] ?? "🏳️";
  const toFlag = FLAGS[selectedTo] ?? "🏳️";

  // 2. Build HTML with injected data
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
      <script src="https://unpkg.com/lightweight-charts@4.1.1/dist/lightweight-charts.standalone.production.js"></script>
      <style>
        body { margin: 0; background: ${darkMode ? "#0F0F14" : "#F5F5FA"}; overflow: hidden; }
        #chart { width: 100vw; height: 100vh; }
      </style>
    </head>
    <body>
      <div id="chart"></div>
      <script>
        const chart = LightweightCharts.createChart(document.getElementById('chart'), {
          layout: { background: { color: '${darkMode ? "#0F0F14" : "#F5F5FA"}' }, textColor: '${darkMode ? "#E5E5EA" : "#1C1C1E"}' },
          grid: { vertLines: { visible: false }, horzLines: { color: '${darkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"}' } },
          timeScale: { borderColor: '${darkMode ? "#2C2C3A" : "#E5E5EA"}' },
          rightPriceScale: { borderColor: '${darkMode ? "#2C2C3A" : "#E5E5EA"}' },
        });
        const series = chart.addAreaSeries({
          lineColor: '#6B4EFF', topColor: '#6B4EFF44', bottomColor: '#6B4EFF00', lineWidth: 3
        });
        series.setData(${JSON.stringify(chartData)});
        chart.timeScale().fitContent();
      </script>
    </body>
    </html>
  `;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: darkMode ? "#0F0F14" : theme.bg }}>
      <StatusBar style={darkMode ? "light" : "dark"} />
      
      <View style={s.header}>
        <TouchableOpacity onPress={() => setSelectedPair(selectedTo, selectedFrom)} style={s.pairRow}>
          <Text style={[s.pairText, { color: theme.text }]}>
            {fromFlag} {selectedFrom} ⇄ {toFlag} {selectedTo}
          </Text>
          <View style={s.rateBlock}>
            <Text style={[s.rateText, { color: theme.primary }]}>
              {currentRate ? currentRate.toFixed(4) : "..."}
            </Text>
            <Text style={[s.rateCode, { color: theme.muted }]}>{selectedTo}</Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={s.periodBar}>
        {PERIODS.map(p => (
          <TouchableOpacity 
            key={p.key} 
            onPress={() => setPeriod(p.key)}
            style={[s.pBtn, period === p.key && { backgroundColor: theme.primary }]}
          >
            <Text style={[s.pText, { color: period === p.key ? "#FFF" : theme.muted }]}>
              {lang === "fr" ? p.labelFr : p.labelEn}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={s.chartContainer}>
        {loading && chartData.length === 0 ? (
          <View style={s.loader}><ActivityIndicator color={theme.primary} /></View>
        ) : (
          <WebView
            key={`${selectedFrom}-${selectedTo}-${period}-${darkMode}`}
            originWhitelist={['*']}
            source={{ html }}
            style={{ backgroundColor: 'transparent' }}
            scrollEnabled={false}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  header: { padding: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  pairRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pairText: { fontSize: 18, fontWeight: '700' },
  rateBlock: { alignItems: 'flex-end' },
  rateText: { fontSize: 18, fontWeight: '800' },
  rateCode: { fontSize: 10, fontWeight: '700', marginTop: -2 },
  periodBar: { flexDirection: 'row', justifyContent: 'space-around', padding: 12 },
  pBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  pText: { fontSize: 13, fontWeight: '700' },
  chartContainer: { flex: 1 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
