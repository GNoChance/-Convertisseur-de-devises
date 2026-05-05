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
  { key: "1W", labelFr: "1S",  labelEn: "1W",  months: 0,  days: 7   },
  { key: "1M", labelFr: "1M",  labelEn: "1M",  months: 1,  days: 0   },
  { key: "3M", labelFr: "3M",  labelEn: "3M",  months: 3,  days: 0   },
  { key: "6M", labelFr: "6M",  labelEn: "6M",  months: 6,  days: 0   },
  { key: "1Y", labelFr: "1A",  labelEn: "1Y",  months: 12, days: 0   },
] as const;

type PeriodKey = (typeof PERIODS)[number]["key"];

// ─── Stats type ───────────────────────────────────────────────────────────────

interface PeriodStats {
  current:    number;
  open:       number;
  min:        number;
  max:        number;
  changePct:  number;
  changeAbs:  number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getPeriodDates(periodKey: PeriodKey): { start: string; end: string } {
  const now   = new Date();
  const start = new Date(now);
  if      (periodKey === "1W") start.setDate(start.getDate() - 7);
  else if (periodKey === "1M") start.setMonth(start.getMonth() - 1);
  else if (periodKey === "3M") start.setMonth(start.getMonth() - 3);
  else if (periodKey === "6M") start.setMonth(start.getMonth() - 6);
  else                         start.setFullYear(start.getFullYear() - 1);
  return {
    start: start.toISOString().split("T")[0],
    end:   now.toISOString().split("T")[0],
  };
}

function fmt(v: number, precision = 4): string {
  return v.toFixed(precision);
}

// ─── HTML template avec lightweight-charts ────────────────────────────────────

function buildChartHtml(
  from: string,
  to: string,
  isDark: boolean,
  initialPeriod: PeriodKey,
): string {
  const bg        = isDark ? "#0F0F14" : "#FFFFFF";
  const textColor = isDark ? "#E5E5EA" : "#1C1C1E";
  const mutedColor= isDark ? "#636366" : "#8E8E93";
  const lineColor = "#6B4EFF";
  const areaTop   = "rgba(107,78,255,0.3)";
  const areaBot   = "rgba(107,78,255,0.0)";
  const grid      = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)";

  const safeFrom = from.replace(/[^A-Z]/g, "").slice(0, 3);
  const safeTo   = to.replace(/[^A-Z]/g, "").slice(0, 3);

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no"/>
  <script src="https://unpkg.com/lightweight-charts@5.1.0/dist/lightweight-charts.standalone.production.js"></script>
  <style>
    *      { margin:0; padding:0; box-sizing:border-box; }
    html, body { width:100%; height:100%; background:${bg}; overflow:hidden; font-family:-apple-system,sans-serif; touch-action:none; user-select:none; -webkit-user-select:none; }
    #chart { width:100vw; height:100vh; touch-action:none; }

    #overlay {
      position:absolute; inset:0;
      display:flex; flex-direction:column;
      justify-content:center; align-items:center;
      gap:12px; pointer-events:none;
    }
    #loader-text { color:${mutedColor}; font-size:14px; }
    #error-msg   { display:none; color:#FF3B30; font-size:14px; text-align:center; padding:20px; }

    #tooltip {
      position:absolute; top:12px; left:12px;
      background:${isDark ? "rgba(28,28,40,0.85)" : "rgba(255,255,255,0.9)"};
      border:1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"};
      border-radius:8px; padding:8px 12px;
      pointer-events:none; display:none;
    }
    #tooltip-date  { color:${mutedColor}; font-size:11px; margin-bottom:2px; }
    #tooltip-value { color:${lineColor}; font-size:16px; font-weight:700; }
  </style>
</head>
<body>
  <div id="chart"></div>

  <div id="overlay">
    <div style="font-size:28px">📈</div>
    <div id="loader-text">Chargement…</div>
    <div id="error-msg">Données indisponibles<br/>Vérifiez votre connexion</div>
  </div>

  <div id="tooltip">
    <div id="tooltip-date"></div>
    <div id="tooltip-value"></div>
  </div>

  <script>
    const chart = LightweightCharts.createChart(document.getElementById('chart'), {
      width:  window.innerWidth,
      height: window.innerHeight,
      layout: {
        background: { type: 'solid', color: '${bg}' },
        textColor:  '${textColor}',
      },
      grid: {
        vertLines: { color: '${grid}' },
        horzLines: { color: '${grid}' },
      },
      crosshair: { mode: LightweightCharts.CrosshairMode.Normal },
      rightPriceScale: { borderColor: '${grid}' },
      timeScale: {
        borderColor: '${grid}',
        timeVisible: true,
        fixLeftEdge: true,
        fixRightEdge: true,
      },
      handleScroll: { mouseWheel: true, pressedMouseMove: true, horzTouchDrag: true },
      handleScale:  { mouseWheel: true, pinch: true },
    });

    const areaSeries = chart.addAreaSeries({
      lineColor:   '${lineColor}',
      topColor:    '${areaTop}',
      bottomColor: '${areaBot}',
      lineWidth:   2,
      priceFormat: { type: 'price', precision: 5, minMove: 0.00001 },
    });

    const tooltip      = document.getElementById('tooltip');
    const tooltipDate  = document.getElementById('tooltip-date');
    const tooltipValue = document.getElementById('tooltip-value');

    chart.subscribeCrosshairMove(param => {
      if (!param.time || !param.seriesData.size) {
        tooltip.style.display = 'none';
        return;
      }
      const data = param.seriesData.get(areaSeries);
      if (!data) { tooltip.style.display = 'none'; return; }
      tooltip.style.display = 'block';
      tooltipDate.textContent  = param.time;
      tooltipValue.textContent = data.value.toFixed(5) + '  ${safeTo}';
    });

    window.addEventListener('resize', () => {
      chart.applyOptions({ width: window.innerWidth, height: window.innerHeight });
    });

    window.loadPeriod = function(periodKey) {
      const loaderText = document.getElementById('loader-text');
      const errorMsg   = document.getElementById('error-msg');
      loaderText.style.display = 'block';
      errorMsg.style.display   = 'none';

      const now = new Date();
      let start = new Date(now);
      if      (periodKey === '1W') start.setDate(start.getDate() - 7);
      else if (periodKey === '1M') start.setMonth(start.getMonth() - 1);
      else if (periodKey === '3M') start.setMonth(start.getMonth() - 3);
      else if (periodKey === '6M') start.setMonth(start.getMonth() - 6);
      else                         start.setFullYear(start.getFullYear() - 1);

      const startStr = start.toISOString().split('T')[0];
      const endStr   = now.toISOString().split('T')[0];

      fetch('https://api.frankfurter.app/' + startStr + '..' + endStr + '?from=${safeFrom}&to=${safeTo}')
        .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
        .then(data => {
          loaderText.style.display = 'none';
          if (!data.rates || !Object.keys(data.rates).length) throw new Error('empty');

          const series = Object.entries(data.rates)
            .map(([date, rates]) => ({ time: date, value: rates['${safeTo}'] }))
            .filter(p => p.value != null)
            .sort((a, b) => a.time < b.time ? -1 : 1);

          areaSeries.setData(series);
          chart.timeScale().fitContent();
        })
        .catch(() => {
          loaderText.style.display = 'none';
          errorMsg.style.display   = 'block';
        });
    };

    window.loadPeriod('${initialPeriod}');
  </script>
</body>
</html>`;
}

// ─── Stats Card ───────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  accent,
  dark,
}: {
  label: string;
  value: string;
  accent?: string;
  dark: boolean;
}) {
  const cardBg  = dark ? "#1C1C28" : "#FFFFFF";
  const textClr = dark ? "#F5F5FA" : "#1C1C1E";
  return (
    <View style={[sc.card, { backgroundColor: cardBg }]}>
      <Text style={[sc.label, { color: dark ? "#636366" : "#8E8E93" }]}>{label}</Text>
      <Text style={[sc.value, { color: accent ?? textClr }]}>{value}</Text>
    </View>
  );
}

const sc = StyleSheet.create({
  card:  {
    flex:           1,
    borderRadius:   12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems:     "center",
  },
  label: { fontSize: 10, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 },
  value: { fontSize: 14, fontWeight: "700" },
});

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function GraphScreen() {
  const { theme, lang, darkMode, selectedFrom, selectedTo, twelveDataKey } = useApp();
  const [period, setPeriod] = useState<PeriodKey>("1M");
  const [stats, setStats] = useState<PeriodStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  const tvUrl    = `https://www.tradingview.com/chart/?symbol=FX:${selectedFrom}${selectedTo}`;
  const bg       = darkMode ? "#0F0F14" : theme.bg;

  useEffect(() => {
    let cancelled = false;
    setStats(null);
    setStatsLoading(true);

    const symbol = `${selectedFrom}/${selectedTo}`;
    fetch(`https://api.twelvedata.com/quote?symbol=${symbol}&apikey=${twelveDataKey}`)
      .then(r => r.json())
      .then(res => {
        if (cancelled) return;
        if (res.price) {
          setStats({
            current:   parseFloat(res.price),
            open:      parseFloat(res.open),
            min:       parseFloat(res.low),
            max:       parseFloat(res.high),
            changePct: parseFloat(res.percent_change),
            changeAbs: parseFloat(res.change),
          });
        }
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setStatsLoading(false); });

    return () => { cancelled = true; };
  }, [selectedFrom, selectedTo, twelveDataKey]);

  const handlePeriod = (p: PeriodKey) => {
    setPeriod(p);
  };

  // ── Labels i18n ───────────────────────────────────────────────────────────

  const isPositive = stats ? stats.changePct >= 0 : true;
  const changeColor = isPositive ? "#34C759" : "#FF3B30";

  const labelChange  = lang === "fr" ? "Variation" : "Change";
  const labelMin     = "Min";
  const labelMax     = "Max";
  const labelCurrent = lang === "fr" ? "Actuel" : "Current";

  // ── Web fallback ──────────────────────────────────────────────────────────

  if (Platform.OS === "web") {
    return (
      <SafeAreaView style={[s.safe, { backgroundColor: bg }]}>
        <StatusBar style={darkMode ? "light" : "dark"} />
        <View style={[s.header, { borderBottomColor: theme.border }]}>
          <Text style={[s.pair, { color: theme.text }]}>
            {fromFlag} {selectedFrom} / {toFlag} {selectedTo}
          </Text>
        </View>
        <View style={s.fallback}>
          <Text style={s.fallbackIcon}>📈</Text>
          <Text style={[s.pair, { color: theme.text, marginBottom: 8, textAlign: "center" }]}>
            {selectedFrom} / {selectedTo}
          </Text>
          <Text style={[s.sub, { color: theme.muted, textAlign: "center", marginBottom: 28 }]}>
            {lang === "fr"
              ? "Le graphique interactif nécessite l'app mobile."
              : "The interactive chart requires the mobile app."}
          </Text>
          <TouchableOpacity
            style={[s.openBtn, { backgroundColor: theme.primary }]}
            onPress={() => Linking.openURL(tvUrl)}
            activeOpacity={0.85}
          >
            <Text style={s.openBtnText}>
              {lang === "fr" ? "Ouvrir sur TradingView ↗" : "Open on TradingView ↗"}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: bg }]} edges={["top", "left", "right"]}>
      <StatusBar style={darkMode ? "light" : "dark"} />

      {/* ── Header ── */}
      <View style={[s.header, { backgroundColor: bg, borderBottomColor: darkMode ? "rgba(255,255,255,0.08)" : theme.border }]}>
        <View>
          <Text style={[s.pair, { color: theme.text }]}>
            {fromFlag} {selectedFrom} / {toFlag} {selectedTo}
          </Text>
          <Text style={[s.sub, { color: theme.muted }]}>
            {lang === "fr" ? "Données historiques · Frankfurter" : "Historical data · Frankfurter"}
          </Text>
        </View>
        <TouchableOpacity
          style={[s.extBtn, { backgroundColor: theme.primary + "18", borderColor: theme.primary + "55" }]}
          onPress={() => Linking.openURL(tvUrl)}
          activeOpacity={0.75}
        >
          <Text style={[s.extBtnText, { color: theme.primary }]}>↗</Text>
        </TouchableOpacity>
      </View>

      {/* ── Stats bar ── */}
      <View style={[s.statsBar, { backgroundColor: bg, borderBottomColor: darkMode ? "rgba(255,255,255,0.06)" : theme.border }]}>
        {statsLoading ? (
          <View style={s.statsLoading}>
            <ActivityIndicator color={theme.primary} size="small" />
          </View>
        ) : stats ? (
          <View style={s.statsRow}>
            <StatCard
              label={labelCurrent}
              value={fmt(stats.current)}
              dark={darkMode}
            />
            <View style={[s.statsDivider, { backgroundColor: darkMode ? "rgba(255,255,255,0.08)" : "#E5E5EA" }]} />
            <StatCard
              label={labelChange}
              value={`${stats.changePct >= 0 ? "+" : ""}${stats.changePct.toFixed(2)}%`}
              accent={changeColor}
              dark={darkMode}
            />
            <View style={[s.statsDivider, { backgroundColor: darkMode ? "rgba(255,255,255,0.08)" : "#E5E5EA" }]} />
            <StatCard
              label={labelMin}
              value={fmt(stats.min)}
              dark={darkMode}
            />
            <View style={[s.statsDivider, { backgroundColor: darkMode ? "rgba(255,255,255,0.08)" : "#E5E5EA" }]} />
            <StatCard
              label={labelMax}
              value={fmt(stats.max)}
              dark={darkMode}
            />
          </View>
        ) : (
          <View style={s.statsLoading}>
            <Text style={[s.sub, { color: theme.muted }]}>
              {lang === "fr" ? "Stats indisponibles" : "Stats unavailable"}
            </Text>
          </View>
        )}
      </View>

      {/* ── Sélecteur de période ── */}
      <View style={[s.periodBar, { backgroundColor: bg, borderBottomColor: darkMode ? "rgba(255,255,255,0.06)" : theme.border }]}>
        {PERIODS.map((p) => {
          const active = period === p.key;
          const label  = lang === "fr" ? p.labelFr : p.labelEn;
          return (
            <TouchableOpacity
              key={p.key}
              style={[s.periodBtn, active && { backgroundColor: theme.primary }]}
              onPress={() => handlePeriod(p.key)}
              activeOpacity={0.7}
            >
              <Text style={[s.periodLabel, { color: active ? "#FFF" : theme.muted }]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── Chart (Native) ── */}
      <View style={s.chartContainer}>
        <NativeHistoryChart
          from={selectedFrom}
          to={selectedTo}
          height={300}
        />
        <Text style={[s.sub, { color: theme.muted, textAlign: "center", marginTop: 20 }]}>
          {lang === "fr" ? "Source : Twelve Data API" : "Source: Twelve Data API"}
        </Text>
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe: { flex: 1 },

  header: {
    flexDirection:     "row",
    alignItems:        "center",
    justifyContent:    "space-between",
    paddingHorizontal: 20,
    paddingVertical:   12,
    borderBottomWidth: 1,
  },
  pair: { fontSize: 17, fontWeight: "700" },
  sub:  { fontSize: 12, marginTop: 2 },

  extBtn: {
    width:          36,
    height:         36,
    borderRadius:   18,
    borderWidth:    1,
    alignItems:     "center",
    justifyContent: "center",
  },
  extBtnText: { fontSize: 16, fontWeight: "700" },

  // Stats bar
  statsBar: {
    borderBottomWidth: 1,
    paddingHorizontal: 12,
    paddingVertical:   10,
    minHeight:         64,
    justifyContent:    "center",
  },
  statsLoading: {
    alignItems:     "center",
    justifyContent: "center",
    height:         44,
  },
  statsRow: {
    flexDirection: "row",
    alignItems:    "center",
    gap:           4,
  },
  statsDivider: {
    width:  1,
    height: 32,
    marginHorizontal: 2,
  },

  periodBar: {
    flexDirection:     "row",
    alignItems:        "center",
    justifyContent:    "space-around",
    paddingHorizontal: 16,
    paddingVertical:   8,
    borderBottomWidth: 1,
  },
  periodBtn: {
    paddingHorizontal: 16,
    paddingVertical:   6,
    borderRadius:      20,
  },
  periodLabel: { fontSize: 13, fontWeight: "700" },

  chartContainer: { flex: 1, position: "relative" },
  chartLoader: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems:     "center",
    zIndex:         10,
  },
  webview: { flex: 1 },

  // Web fallback
  fallback: {
    flex:              1,
    justifyContent:    "center",
    alignItems:        "center",
    paddingHorizontal: 32,
  },
  fallbackIcon: { fontSize: 64, marginBottom: 20 },
  openBtn:      { borderRadius: 16, paddingVertical: 16, paddingHorizontal: 32 },
  openBtnText:  { fontSize: 16, fontWeight: "700", color: "#FFF" },
});
