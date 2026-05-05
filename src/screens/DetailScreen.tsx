import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { WebView } from "react-native-webview";
import { useRoute, useNavigation, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useApp } from "../context/AppContext";
import { T } from "../i18n/translations";
import { RootStackParamList } from "../navigation/AppNavigator";

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
  const { code, name } = route.params;
  const [rate, setRate] = useState<number | null>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    fetch(`https://api.frankfurter.app/latest?from=EUR&to=${code}`)
      .then(r => r.json())
      .then(res => { if (!cancelled) setRate(res.rates[code]); })
      .catch(() => {});

    const start = new Date();
    start.setDate(start.getDate() - 30);
    const startStr = start.toISOString().split('T')[0];

    fetch(`https://api.frankfurter.app/${startStr}..?from=EUR&to=${code}`)
      .then(r => r.json())
      .then(res => {
        if (cancelled) return;
        const points = Object.entries(res.rates).map(([d, r]: any) => ({
          time: d,
          value: r[code]
        }));
        setChartData(points);
        setLoading(false);
      })
      .catch(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [code]);

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
      <script src="https://unpkg.com/lightweight-charts@4.1.1/dist/lightweight-charts.standalone.production.js"></script>
      <style>
        body { margin: 0; background: ${darkMode ? "#1C1C28" : "#FFFFFF"}; overflow: hidden; }
        #chart { width: 100vw; height: 100vh; }
      </style>
    </head>
    <body>
      <div id="chart"></div>
      <script>
        const chart = LightweightCharts.createChart(document.getElementById('chart'), {
          layout: { background: { color: '${darkMode ? "#1C1C28" : "#FFFFFF"}' }, textColor: '${darkMode ? "#E5E5EA" : "#1C1C1E"}' },
          grid: { vertLines: { visible: false }, horzLines: { visible: false } },
          timeScale: { visible: false },
          rightPriceScale: { visible: false },
          handleScroll: false, handleScale: false,
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
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      <StatusBar style={darkMode ? "light" : "dark"} />
      
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}>
          <Text style={[s.backTxt, { color: theme.primary }]}>←</Text>
        </TouchableOpacity>
        <Text style={[s.title, { color: theme.text }]}>{FLAGS[code] ?? "🏳️"} {code}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={s.content}>
        <Text style={[s.name, { color: theme.muted }]}>{name}</Text>
        
        <View style={[s.card, { backgroundColor: theme.card }]}>
          <Text style={[s.val, { color: theme.text }]}>
            {rate ? `1 EUR = ${rate.toFixed(4)} ${code}` : "..."}
          </Text>
        </View>

        <View style={[s.chartCard, { backgroundColor: theme.card }]}>
          <Text style={[s.chartTitle, { color: theme.text }]}>Historique 30j</Text>
          <View style={s.chart}>
            {loading ? (
              <View style={s.loader}><ActivityIndicator color={theme.primary} /></View>
            ) : (
              <WebView key={code} originWhitelist={['*']} source={{ html }} style={{ backgroundColor: 'transparent' }} scrollEnabled={false} />
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16 },
  back: { padding: 8 },
  backTxt: { fontSize: 28, fontWeight: "bold" },
  title: { fontSize: 22, fontWeight: "800" },
  content: { padding: 16 },
  name: { fontSize: 16, textAlign: "center", marginBottom: 20 },
  card: { borderRadius: 20, padding: 24, alignItems: "center", marginBottom: 16 },
  val: { fontSize: 22, fontWeight: "800" },
  chartCard: { borderRadius: 20, padding: 16 },
  chartTitle: { fontSize: 18, fontWeight: "700", marginBottom: 16 },
  chart: { height: 250, borderRadius: 12, overflow: 'hidden' },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
