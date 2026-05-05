import { useEffect, useState } from "react";
import { ActivityIndicator, Linking, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { WebView } from "react-native-webview";
import { useApp } from "../context/AppContext";

// ─── Flags ────────────────────────────────────────────────────────────────────
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

// ─── HTML Template (High Performance Chart) ───────────────────────────────────
function buildChartHtml(from: string, to: string, isDark: boolean, period: PeriodKey) {
  const bg = isDark ? "#0F0F14" : "#FFFFFF";
  const text = isDark ? "#E5E5EA" : "#1C1C1E";
  const grid = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)";
  const color = "#6B4EFF";

  const periodDays = PERIODS.find(p => p.key === period)?.days ?? 30;
  const start = new Date();
  start.setDate(start.getDate() - periodDays);
  const startStr = start.toISOString().split('T')[0];

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
      <script src="https://unpkg.com/lightweight-charts@5.1.0/dist/lightweight-charts.standalone.production.js"></script>
      <style>
        body { margin: 0; background: ${bg}; overflow: hidden; font-family: -apple-system, sans-serif; }
        #chart { width: 100vw; height: 100vh; }
        #loader { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; color: ${text}; font-size: 14px; }
      </style>
    </head>
    <body>
      <div id="loader">Chargement...</div>
      <div id="chart"></div>
      <script>
        const chart = LightweightCharts.createChart(document.getElementById('chart'), {
          layout: { background: { color: '${bg}' }, textColor: '${text}' },
          grid: { vertLines: { color: '${grid}' }, horzLines: { color: '${grid}' } },
          timeScale: { borderColor: '${grid}', fixLeftEdge: true, fixRightEdge: true },
          rightPriceScale: { borderColor: '${grid}' },
          handleScroll: true, handleScale: true,
        });
        const series = chart.addAreaSeries({
          lineColor: '${color}', topColor: '${color}44', bottomColor: '${color}00',
          lineWidth: 2, priceFormat: { type: 'price', precision: 4, minMove: 0.0001 }
        });

        fetch('https://api.frankfurter.app/${startStr}..?from=${from}&to=${to}')
          .then(r => r.json())
          .then(data => {
            document.getElementById('loader').style.display = 'none';
            const points = Object.entries(data.rates).map(([d, r]) => ({ time: d, value: r['${to}'] }));
            series.setData(points);
            chart.timeScale().fitContent();
          })
          .catch(() => {
            document.getElementById('loader').textContent = 'Erreur de chargement';
          });

        window.addEventListener('resize', () => {
          chart.applyOptions({ width: window.innerWidth, height: window.innerHeight });
        });
      </script>
    </body>
    </html>
  `;
}

export default function GraphScreen() {
  const { theme, lang, darkMode, selectedFrom, selectedTo, setSelectedPair } = useApp();
  const [period, setPeriod] = useState<PeriodKey>("1M");
  const [currentRate, setCurrentRate] = useState<number | null>(null);

  const fromFlag = FLAGS[selectedFrom] ?? "🏳️";
  const toFlag = FLAGS[selectedTo] ?? "🏳️";

  useEffect(() => {
    fetch(`https://api.frankfurter.app/latest?from=${selectedFrom}&to=${selectedTo}`)
      .then(r => r.json())
      .then(res => setCurrentRate(res.rates[selectedTo]))
      .catch(() => {});
  }, [selectedFrom, selectedTo]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: darkMode ? "#0F0F14" : theme.bg }}>
      <StatusBar style={darkMode ? "light" : "dark"} />
      
      <View style={s.header}>
        <TouchableOpacity onPress={() => setSelectedPair(selectedTo, selectedFrom)} style={s.pairRow}>
          <Text style={[s.pairText, { color: theme.text }]}>
            {fromFlag} {selectedFrom} ⇄ {toFlag} {selectedTo}
          </Text>
          <Text style={[s.rateText, { color: theme.primary }]}>
            {currentRate ? currentRate.toFixed(4) : "..."}
          </Text>
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
        <WebView
          key={`${selectedFrom}-${selectedTo}-${period}-${darkMode}`}
          originWhitelist={['*']}
          source={{ html: buildChartHtml(selectedFrom, selectedTo, darkMode, period) }}
          style={{ backgroundColor: 'transparent' }}
          scrollEnabled={false}
        />
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  header: { padding: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  pairRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pairText: { fontSize: 18, fontWeight: '700' },
  rateText: { fontSize: 18, fontWeight: '800' },
  periodBar: { flexDirection: 'row', justifyContent: 'space-around', padding: 12 },
  pBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  pText: { fontSize: 13, fontWeight: '700' },
  chartContainer: { flex: 1 },
});
