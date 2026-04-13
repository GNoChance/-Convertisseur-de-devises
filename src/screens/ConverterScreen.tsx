import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle, Defs, G, Line, LinearGradient, Path, Rect, Stop, Text as SvgText } from "react-native-svg";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { useApp } from "../context/AppContext";
import { T } from "../i18n/translations";
import { RootStackParamList } from "../navigation/AppNavigator";

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
const PERIODS = ["1W", "1M", "3M", "6M", "1Y", "Max"] as const;
type Period   = (typeof PERIODS)[number];

const RED   = "#FF3B30";
const GREEN = "#34C759";

function getCurrency(code: string): Currency {
  return CURRENCIES.find((c) => c.code === code) ?? CURRENCIES[0];
}
function fmtNum(v: number) {
  return v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtRate(v: number): string {
  if (v >= 10000) return v.toFixed(0);
  if (v >= 1000)  return v.toFixed(1);
  if (v >= 100)   return v.toFixed(2);
  if (v >= 10)    return v.toFixed(3);
  if (v >= 1)     return v.toFixed(4);
  return v.toFixed(5);
}
function fmtDateLabel(date: string): string {
  if (!date) return "";
  const parts = date.split("-");
  if (parts.length !== 3) return date;
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${months[parseInt(parts[1]) - 1]} ${parseInt(parts[2])}`;
}
function mkShadow(color = "#000", dark = false): object {
  if (dark) return {};
  return Platform.select({
    ios:     { shadowColor: color, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.09, shadowRadius: 8 },
    android: { elevation: 3 },
    default: {},
  }) ?? {};
}

// ─── Mini graph (card preview) ────────────────────────────────────────────────

function MiniGraph({ points, color, W = 110, H = 36 }: { points: number[]; color: string; W?: number; H?: number }) {
  if (points.length < 2) return null;
  const min = Math.min(...points), max = Math.max(...points), range = max - min || 1;
  const xs   = points.map((_, i) => (i / (points.length - 1)) * W);
  const ys   = points.map((v) => H - ((v - min) / range) * H * 0.8 - H * 0.1);
  const line = xs.map((x, i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${ys[i].toFixed(1)}`).join(" ");
  const area = line + ` L${W},${H} L0,${H} Z`;
  return (
    <Svg width={W} height={H}>
      <Defs>
        <LinearGradient id="mg" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={color} stopOpacity="0.25" />
          <Stop offset="1" stopColor={color} stopOpacity="0" />
        </LinearGradient>
      </Defs>
      <Path d={area} fill="url(#mg)" />
      <Path d={line} stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ─── TradingView-style chart ──────────────────────────────────────────────────

type TradingChartProps = {
  points:  number[];
  dates:   string[];
  isUp:    boolean;
  theme:   typeof import("../context/AppContext").LIGHT;
  darkMode: boolean;
};

function TradingChart({ points, dates, isUp, theme, darkMode }: TradingChartProps) {
  const { width: screenW } = useWindowDimensions();
  const W     = Math.max(screenW - 40, 280);
  const H     = 210;
  const PL    = 56; // padding left (for Y labels)
  const PR    = 10; // padding right
  const PT    = 18; // padding top
  const PB    = 34; // padding bottom (for X labels)
  const iw    = W - PL - PR;
  const ih    = H - PT - PB;

  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  // Ref so PanResponder callbacks always see latest values
  const ctxRef = useRef({ points, iw, PL });
  ctxRef.current = { points, iw, PL };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder:  () => true,
      onPanResponderGrant: (e) => {
        const { points: pts, iw: _iw, PL: _pl } = ctxRef.current;
        if (pts.length < 2) return;
        const relX = e.nativeEvent.locationX - _pl;
        const idx  = Math.round((relX / _iw) * (pts.length - 1));
        setActiveIdx(Math.max(0, Math.min(pts.length - 1, idx)));
      },
      onPanResponderMove: (e) => {
        const { points: pts, iw: _iw, PL: _pl } = ctxRef.current;
        if (pts.length < 2) return;
        const relX = e.nativeEvent.locationX - _pl;
        const idx  = Math.round((relX / _iw) * (pts.length - 1));
        setActiveIdx(Math.max(0, Math.min(pts.length - 1, idx)));
      },
      onPanResponderRelease: () => {
        setTimeout(() => setActiveIdx(null), 2500);
      },
    })
  ).current;

  if (points.length < 2) {
    return <View style={{ height: H, justifyContent: "center", alignItems: "center" }} />;
  }

  const min   = Math.min(...points);
  const max   = Math.max(...points);
  const range = max - min || 0.00001;
  const color = isUp ? GREEN : RED;

  const toX = (i: number) => PL + (i / (points.length - 1)) * iw;
  const toY = (v: number) => PT + ih - ((v - min) / range) * ih;

  // SVG paths
  const linePath = points.map((v, i) => `${i === 0 ? "M" : "L"}${toX(i).toFixed(1)},${toY(v).toFixed(1)}`).join(" ");
  const areaPath = `${linePath} L${toX(points.length - 1).toFixed(1)},${(PT + ih).toFixed(1)} L${PL},${(PT + ih).toFixed(1)} Z`;

  // Y-axis grid (5 horizontal lines)
  const GRID_Y = 5;
  const yLevels = Array.from({ length: GRID_Y }, (_, i) => {
    const frac = i / (GRID_Y - 1);
    const v    = min + frac * range;
    return { v, y: toY(v) };
  });

  // X-axis labels (4 ticks)
  const X_TICKS = 4;
  const xTicks = Array.from({ length: X_TICKS }, (_, i) => {
    const idx = Math.round((i / (X_TICKS - 1)) * (points.length - 1));
    return { idx, x: toX(idx), label: fmtDateLabel(dates[idx] ?? "") };
  });

  // Crosshair state
  const hasActive  = activeIdx !== null;
  const aX         = hasActive ? toX(activeIdx!) : null;
  const aY         = hasActive ? toY(points[activeIdx!]) : null;
  const aVal       = hasActive ? points[activeIdx!] : null;
  const aDate      = hasActive ? (dates[activeIdx!] ?? "") : "";

  // Tooltip: flip to left side when near right edge
  const TOOLTIP_W  = 120;
  const TOOLTIP_H  = 34;
  const tooltipX   = aX !== null ? (aX > W * 0.6 ? aX - TOOLTIP_W - 8 : aX + 8) : 0;
  const tooltipY   = aY !== null ? Math.max(PT, aY - TOOLTIP_H - 4) : 0;

  const gridStroke  = darkMode ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)";
  const mutedFill   = theme.muted;
  const gradId      = `tvg-${isUp ? "up" : "dn"}`;

  return (
    <View {...panResponder.panHandlers}>
      <Svg width={W} height={H}>
        <Defs>
          <LinearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0"   stopColor={color} stopOpacity="0.32" />
            <Stop offset="0.6" stopColor={color} stopOpacity="0.08" />
            <Stop offset="1"   stopColor={color} stopOpacity="0"    />
          </LinearGradient>
        </Defs>

        {/* Y-axis grid lines + labels */}
        {yLevels.map(({ v, y }, i) => (
          <G key={`y${i}`}>
            <Line
              x1={PL} y1={y}
              x2={W - PR} y2={y}
              stroke={gridStroke}
              strokeWidth="1"
            />
            <SvgText
              x={PL - 5} y={y + 3.5}
              textAnchor="end"
              fontSize="9"
              fill={mutedFill}
            >
              {fmtRate(v)}
            </SvgText>
          </G>
        ))}

        {/* Area fill */}
        <Path d={areaPath} fill={`url(#${gradId})`} />

        {/* Main line */}
        <Path
          d={linePath}
          stroke={color}
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Last price dot (pulse) — only when no crosshair */}
        {!hasActive && (
          <G>
            <Circle
              cx={toX(points.length - 1)}
              cy={toY(points[points.length - 1])}
              r="8"
              fill={color}
              opacity="0.18"
            />
            <Circle
              cx={toX(points.length - 1)}
              cy={toY(points[points.length - 1])}
              r="4"
              fill={color}
            />
          </G>
        )}

        {/* X-axis date labels */}
        {xTicks.map(({ x, label }, i) => (
          <SvgText
            key={`x${i}`}
            x={x} y={H - 6}
            textAnchor={i === 0 ? "start" : i === X_TICKS - 1 ? "end" : "middle"}
            fontSize="9.5"
            fill={mutedFill}
          >
            {label}
          </SvgText>
        ))}

        {/* ── Crosshair ── */}
        {hasActive && aX !== null && aY !== null && aVal !== null && (
          <G>
            {/* Vertical dashed line */}
            <Line
              x1={aX} y1={PT}
              x2={aX} y2={PT + ih}
              stroke={color}
              strokeWidth="1.5"
              strokeDasharray="5,3"
              opacity="0.75"
            />
            {/* Dot */}
            <Circle cx={aX} cy={aY} r="10" fill={color} opacity="0.18" />
            <Circle cx={aX} cy={aY} r="5"  fill={color} />
            {/* Tooltip background */}
            <Rect
              x={tooltipX} y={tooltipY}
              width={TOOLTIP_W} height={TOOLTIP_H}
              rx="8"
              fill={color}
              opacity="0.93"
            />
            {/* Tooltip value */}
            <SvgText
              x={tooltipX + TOOLTIP_W / 2}
              y={tooltipY + 13}
              textAnchor="middle"
              fontSize="12"
              fontWeight="700"
              fill="#FFF"
            >
              {fmtRate(aVal)}
            </SvgText>
            {/* Tooltip date */}
            <SvgText
              x={tooltipX + TOOLTIP_W / 2}
              y={tooltipY + 27}
              textAnchor="middle"
              fontSize="9"
              fill="#FFF"
              opacity="0.85"
            >
              {aDate}
            </SvgText>
          </G>
        )}
      </Svg>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

type Nav = NativeStackNavigationProp<RootStackParamList, "Main">;

export default function ConverterScreen() {
  const { theme, lang, darkMode, setDarkMode, setLang, username } = useApp();
  const navigation = useNavigation<Nav>();
  const t          = T[lang];
  const primary    = theme.primary;

  const [fromCurrency, setFromCurrency] = useState<Currency>(getCurrency("ILS"));
  const [toCurrency,   setToCurrency]   = useState<Currency>(getCurrency("USD"));
  const [fromAmount,   setFromAmount]   = useState("126.56");
  const [rate,         setRate]         = useState<number | null>(null);
  const [rateDate,     setRateDate]     = useState("");
  const [loadingRate,  setLoadingRate]  = useState(false);
  const [graphPoints,  setGraphPoints]  = useState<number[]>([]);
  const [graphDates,   setGraphDates]   = useState<string[]>([]);
  const [activePeriod, setActivePeriod] = useState<Period>("1M");
  const [loadingGraph, setLoadingGraph] = useState(false);

  const [pickerVisible,   setPickerVisible]   = useState(false);
  const [pickerTarget,    setPickerTarget]    = useState<"from" | "to">("from");
  const [search,          setSearch]          = useState("");
  const [graphVisible,    setGraphVisible]    = useState(false);
  const [foresightOpen,   setForesightOpen]   = useState(false);
  const [alertVisible,    setAlertVisible]    = useState(false);
  const [notifyTarget,    setNotifyTarget]    = useState<Currency | null>(null);
  const [settingsVisible, setSettingsVisible] = useState(false);

  const numFrom = parseFloat(fromAmount.replace(",", ".")) || 0;
  const numTo   = rate !== null ? numFrom * rate : null;

  const fetchRate = useCallback(async () => {
    if (fromCurrency.code === toCurrency.code) { setRate(1); return; }
    setLoadingRate(true);
    try {
      const res  = await fetch(`https://api.frankfurter.dev/v2/rates?base=${fromCurrency.code}&quotes=${toCurrency.code}`);
      const data = await res.json();
      setRate(data.rates[toCurrency.code] ?? null);
      setRateDate(data.date ?? "");
    } catch { setRate(null); }
    finally  { setLoadingRate(false); }
  }, [fromCurrency.code, toCurrency.code]);

  const fetchHistory = useCallback(async (period: Period) => {
    setLoadingGraph(true);
    setGraphPoints([]);
    setGraphDates([]);
    const now = new Date();
    const toDate = now.toISOString().split("T")[0];
    const from = new Date(now);
    if      (period === "1W")  from.setDate(now.getDate() - 7);
    else if (period === "1M")  from.setMonth(now.getMonth() - 1);
    else if (period === "3M")  from.setMonth(now.getMonth() - 3);
    else if (period === "6M")  from.setMonth(now.getMonth() - 6);
    else if (period === "1Y")  from.setFullYear(now.getFullYear() - 1);
    else                       from.setFullYear(now.getFullYear() - 5);
    const fromDate = from.toISOString().split("T")[0];
    try {
      const res  = await fetch(
        `https://api.frankfurter.dev/v2/rates?base=${fromCurrency.code}&quotes=${toCurrency.code}&from=${fromDate}&to=${toDate}`
      );
      const data = await res.json();
      if (data.rates) {
        const entries = (Object.entries(data.rates) as [string, Record<string, number>][])
          .sort(([a], [b]) => a.localeCompare(b));
        setGraphPoints(entries.map(([, r]) => r[toCurrency.code]));
        setGraphDates(entries.map(([date]) => date));
      }
    } catch {}
    finally { setLoadingGraph(false); }
  }, [fromCurrency.code, toCurrency.code]);

  useEffect(() => { fetchRate(); },                                        [fetchRate]);
  useEffect(() => { if (graphVisible) fetchHistory(activePeriod); },      [graphVisible, activePeriod, fetchHistory]);
  useEffect(() => { fetchHistory("1M"); },                                 [fetchHistory]);

  const openPicker = (target: "from" | "to") => {
    setPickerTarget(target); setSearch(""); setPickerVisible(true);
  };
  const selectCurrency = (c: Currency) => {
    if (pickerTarget === "from") {
      if (c.code === toCurrency.code) setToCurrency(fromCurrency);
      setFromCurrency(c);
    } else {
      if (c.code === fromCurrency.code) setFromCurrency(toCurrency);
      setToCurrency(c);
    }
    setPickerVisible(false);
  };
  const swap = () => {
    const prev = fromCurrency;
    setFromCurrency(toCurrency);
    setToCurrency(prev);
    if (numTo !== null) setFromAmount(numTo.toFixed(2));
  };

  const graphTrend =
    graphPoints.length > 1
      ? ((graphPoints[graphPoints.length - 1] - graphPoints[0]) / graphPoints[0]) * 100
      : null;
  const graphIsUp  = (graphTrend ?? 0) >= 0;
  const graphColor = graphIsUp ? GREEN : RED;

  const periodHigh   = graphPoints.length > 0 ? Math.max(...graphPoints) : null;
  const periodLow    = graphPoints.length > 0 ? Math.min(...graphPoints) : null;
  const periodChange = graphPoints.length > 1
    ? graphPoints[graphPoints.length - 1] - graphPoints[0]
    : null;

  const filtered = CURRENCIES.filter(
    (c) =>
      c.code.toLowerCase().includes(search.toLowerCase()) ||
      c.name[lang].toLowerCase().includes(search.toLowerCase())
  );

  const ds = {
    bg:      { backgroundColor: theme.bg },
    card:    { backgroundColor: theme.card, ...mkShadow("#000", darkMode) },
    text:    { color: theme.text },
    muted:   { color: theme.muted },
    pill:    { backgroundColor: theme.input },
    sheet:   { backgroundColor: theme.card },
    inputBg: { backgroundColor: theme.input },
  };

  return (
    <SafeAreaView style={[s.safe, ds.bg]}>
      <StatusBar style={darkMode ? "light" : "dark"} />

      <ScrollView style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* ── Header ── */}
        <View style={s.header}>
          <View style={s.headerLeft}>
            <Text style={[s.greeting, ds.text]} numberOfLines={1} ellipsizeMode="tail">
              {lang === "fr" ? "Bonjour" : "Hi"} {username || "—"},
            </Text>
            <Text style={[s.balance, ds.muted]} numberOfLines={1}>{t.balance} : $6,000,000,213.11</Text>
          </View>
          <View style={s.headerIcons}>
            <TouchableOpacity onPress={() => setAlertVisible(true)} style={s.iconWrap}>
              <Text style={s.iconEmoji}>🔔</Text>
              <View style={s.badge} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setSettingsVisible(true)} style={s.iconWrap}>
              <Text style={s.iconEmoji}>⚙️</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── You send ── */}
        <View style={[s.card, ds.card]}>
          <Text style={[s.label, ds.muted]}>{t.youSend}</Text>
          <View style={s.row}>
            <View style={s.amountWrap}>
              <Text style={[s.symbol, ds.text]}>{fromCurrency.symbol}</Text>
              <TextInput
                style={[s.amountField, ds.text]}
                value={fromAmount}
                onChangeText={setFromAmount}
                keyboardType="decimal-pad"
                selectTextOnFocus
                placeholderTextColor={theme.muted}
              />
            </View>
            <TouchableOpacity style={[s.flagPill, ds.pill]} onPress={() => openPicker("from")} activeOpacity={0.75}>
              <View style={s.flagCircle}><Text style={s.flagEmoji}>{fromCurrency.flag}</Text></View>
              <Text style={[s.pillCode, ds.text]}>{fromCurrency.code}</Text>
              <Text style={[s.pillChevron, ds.muted]}>▾</Text>
            </TouchableOpacity>
          </View>
          {rate !== null && (
            <Text style={[s.rateHint, ds.muted]}>
              {fromCurrency.symbol}0.11 = {toCurrency.symbol}{(0.11 * rate).toFixed(3)}{"    "}{rateDate}
            </Text>
          )}
        </View>

        {/* ── Swap ── */}
        <TouchableOpacity
          style={[s.swapBtn, { backgroundColor: primary, ...(mkShadow(primary, darkMode)) }]}
          onPress={swap} activeOpacity={0.8}
        >
          <Text style={s.swapIcon}>⇅</Text>
        </TouchableOpacity>

        {/* ── They get ── */}
        <View style={[s.card, ds.card]}>
          <Text style={[s.label, ds.muted]}>{t.theyGet}</Text>
          <View style={s.row}>
            <View style={s.amountWrap}>
              <Text style={[s.symbol, { color: primary }]}>{toCurrency.symbol}</Text>
              {loadingRate
                ? <ActivityIndicator color={primary} style={{ marginLeft: 8 }} />
                : <Text style={[s.amountField, { color: primary }]}>{numTo !== null ? fmtNum(numTo) : "—"}</Text>
              }
            </View>
            <TouchableOpacity style={[s.flagPill, ds.pill]} onPress={() => openPicker("to")} activeOpacity={0.75}>
              <View style={s.flagCircle}><Text style={s.flagEmoji}>{toCurrency.flag}</Text></View>
              <Text style={[s.pillCode, ds.text]}>{toCurrency.code}</Text>
              <Text style={[s.pillChevron, ds.muted]}>▾</Text>
            </TouchableOpacity>
          </View>
          {rate !== null && (
            <Text style={[s.rateHint, ds.muted]}>{t.rateLabel(fromCurrency.code, rate.toFixed(4), toCurrency.code)}</Text>
          )}
        </View>

        {/* ── Foresight ── */}
        <View style={[s.card, ds.card]}>
          <TouchableOpacity style={s.cardHead} onPress={() => setForesightOpen(!foresightOpen)}>
            <View>
              <Text style={[s.cardTitle, ds.text]}>{t.foresightTitle}</Text>
              <Text style={[s.cardSub, ds.muted]}>{t.foresightSub}</Text>
            </View>
            <Text style={[s.chevron, ds.muted]}>{foresightOpen ? "▴" : "▾"}</Text>
          </TouchableOpacity>
          {foresightOpen && (
            <View style={s.foresightBody}>
              {t.foresightTips.map((tip, i) => (
                <View key={i} style={s.tipRow}>
                  <View style={[s.tipDot, { backgroundColor: primary }]} />
                  <Text style={[s.tipText, ds.muted]}>{tip}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* ── Graph card ── */}
        <TouchableOpacity style={[s.card, ds.card]} onPress={() => setGraphVisible(true)} activeOpacity={0.85}>
          <View style={s.graphCardRow}>
            <View style={{ flex: 1 }}>
              <Text style={[s.cardTitle, ds.text]}>{t.graph}</Text>
              {graphTrend !== null && (
                <View style={s.trendRow}>
                  <View style={[s.trendPill, { backgroundColor: graphColor + "22" }]}>
                    <Text style={[s.trendPillText, { color: graphColor }]}>
                      {graphIsUp ? "▲" : "▼"} {Math.abs(graphTrend).toFixed(2)}%
                    </Text>
                  </View>
                  <Text style={[s.cardSub, ds.muted]}>1M</Text>
                </View>
              )}
            </View>
            {graphPoints.length > 1
              ? <MiniGraph points={graphPoints} color={graphColor} />
              : <Text style={[s.chevron, ds.muted]}>›</Text>
            }
          </View>
        </TouchableOpacity>

        {/* ── Exchange ── */}
        <TouchableOpacity
          style={[s.exchangeBtn, { backgroundColor: primary, ...(mkShadow(primary, darkMode)) }]}
          activeOpacity={0.85}
        >
          <Text style={s.exchangeText}>{t.exchange}</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* ══ Settings ══ */}
      <Modal visible={settingsVisible} animationType="slide" transparent>
        <Pressable style={s.overlay} onPress={() => setSettingsVisible(false)} />
        <View style={[s.sheet, ds.sheet]}>
          <View style={s.handle} />
          <Text style={[s.sheetTitle, ds.text]}>{t.settingsTitle}</Text>

          <View style={[s.settingsRow, { borderBottomColor: theme.border }]}>
            <Text style={[s.settingsLabel, ds.text]}>{t.settingsLang}</Text>
            <View style={s.langToggle}>
              {(["fr", "en"] as const).map((l) => (
                <TouchableOpacity
                  key={l}
                  style={[s.langBtn, lang === l && { backgroundColor: primary }]}
                  onPress={() => setLang(l)}
                >
                  <Text style={[s.langBtnText, lang === l ? { color: "#FFF" } : ds.muted]}>
                    {l === "fr" ? "🇫🇷 FR" : "🇬🇧 EN"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={[s.settingsRow, { borderBottomColor: theme.border }]}>
            <Text style={[s.settingsLabel, ds.text]}>{t.settingsDark}</Text>
            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
              trackColor={{ false: theme.border, true: primary }}
              thumbColor="#FFF"
            />
          </View>

          <TouchableOpacity
            style={[s.settingsRow, { borderBottomColor: theme.border }]}
            onPress={() => { setSettingsVisible(false); navigation.getParent()?.navigate("SignIn"); }}
          >
            <Text style={[s.settingsLabel, ds.text]}>🔓 {lang === "fr" ? "Se déconnecter" : "Sign out"}</Text>
            <Text style={[s.chevron, ds.muted]}>›</Text>
          </TouchableOpacity>

          <Text style={[s.settingsVersion, ds.muted]}>{t.settingsVersion}</Text>
          <TouchableOpacity style={[s.exchangeBtn, { backgroundColor: primary, marginTop: 8 }]} onPress={() => setSettingsVisible(false)}>
            <Text style={s.exchangeText}>{t.settingsDone}</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* ══ Currency picker ══ */}
      <Modal visible={pickerVisible} animationType="slide" transparent>
        <Pressable style={s.overlay} onPress={() => setPickerVisible(false)} />
        <View style={[s.sheet, ds.sheet]}>
          <View style={s.handle} />
          <Text style={[s.sheetTitle, ds.text]}>
            {pickerTarget === "from" ? t.youSendLabel : t.theyGetLabel}
          </Text>
          <TextInput
            style={[s.searchBox, ds.inputBg, ds.text]}
            value={search}
            onChangeText={setSearch}
            placeholder={t.searchCurrency}
            placeholderTextColor={theme.muted}
            autoFocus
          />
          <FlatList
            data={filtered}
            keyExtractor={(c) => c.code}
            style={{ maxHeight: 380 }}
            renderItem={({ item }) => {
              const active = (pickerTarget === "from" ? fromCurrency : toCurrency).code === item.code;
              return (
                <TouchableOpacity style={[s.pickerRow, { borderBottomColor: theme.border }]} onPress={() => selectCurrency(item)}>
                  <View style={[s.pickerCircle, ds.pill]}>
                    <Text style={s.pickerFlag}>{item.flag}</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={[s.pickerName, ds.text]}>{item.name[lang]} ({item.code})</Text>
                    {rate !== null && !active && (
                      <Text style={[s.pickerRate, ds.muted]}>{t.goToNow(rate.toFixed(3), item.code)}</Text>
                    )}
                  </View>
                  {active ? (
                    <Text style={{ fontWeight: "700", fontSize: 16, color: primary }}>✓</Text>
                  ) : (
                    <TouchableOpacity
                      style={[s.notifyPill, ds.pill]}
                      onPress={() => { setNotifyTarget(item); setAlertVisible(true); }}
                    >
                      <Text style={[s.notifyText, { color: primary }]}>{t.notifyBtn}</Text>
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </Modal>

      {/* ══ TradingView Chart Modal ══ */}
      <Modal visible={graphVisible} animationType="slide" transparent>
        <Pressable style={s.overlay} onPress={() => setGraphVisible(false)} />
        <View style={[s.sheet, ds.sheet, s.chartSheet]}>
          <View style={s.handle} />

          {/* ── Pair header ── */}
          <View style={s.chartHeader}>
            <View style={{ flex: 1 }}>
              <Text style={[s.chartPair, ds.muted]}>
                {fromCurrency.flag} {fromCurrency.code} / {toCurrency.flag} {toCurrency.code}
              </Text>
              <View style={s.chartRateRow}>
                <Text style={[s.chartBigRate, ds.text]}>
                  {graphPoints.length > 0 ? fmtRate(graphPoints[graphPoints.length - 1]) : "—"}
                </Text>
                {graphTrend !== null && (
                  <View style={[s.chartBadge, { backgroundColor: graphColor + "22" }]}>
                    <Text style={[s.chartBadgeText, { color: graphColor }]}>
                      {graphIsUp ? "▲" : "▼"} {Math.abs(graphTrend).toFixed(2)}%
                    </Text>
                  </View>
                )}
              </View>
              {periodChange !== null && (
                <Text style={[s.chartChangeAbs, { color: graphColor }]}>
                  {periodChange >= 0 ? "+" : ""}{fmtRate(periodChange)} · {activePeriod}
                </Text>
              )}
            </View>

            {/* High / Low */}
            {periodHigh !== null && periodLow !== null && (
              <View style={s.hiloBlock}>
                <View style={s.hiloRow}>
                  <Text style={[s.hiloLabel, { color: GREEN }]}>H</Text>
                  <Text style={[s.hiloVal, ds.text]}>{fmtRate(periodHigh)}</Text>
                </View>
                <View style={s.hiloRow}>
                  <Text style={[s.hiloLabel, { color: RED }]}>L</Text>
                  <Text style={[s.hiloVal, ds.text]}>{fmtRate(periodLow)}</Text>
                </View>
              </View>
            )}
          </View>

          {/* ── Chart ── */}
          <View style={s.chartWrap}>
            {loadingGraph ? (
              <View style={s.chartLoader}>
                <ActivityIndicator color={primary} size="large" />
              </View>
            ) : graphPoints.length > 1 ? (
              <TradingChart
                points={graphPoints}
                dates={graphDates}
                isUp={graphIsUp}
                theme={theme}
                darkMode={darkMode}
              />
            ) : (
              <View style={s.chartLoader}>
                <Text style={ds.muted}>{lang === "fr" ? "Données insuffisantes" : "Not enough data"}</Text>
              </View>
            )}
          </View>

          {/* ── Period selector ── */}
          <View style={s.periodRow}>
            {PERIODS.map((p) => (
              <TouchableOpacity
                key={p}
                style={[s.periodBtn, activePeriod === p && { backgroundColor: primary }]}
                onPress={() => setActivePeriod(p)}
              >
                <Text style={[s.periodText, activePeriod === p ? { color: "#FFF" } : ds.muted]}>{p}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ── Touch hint ── */}
          <Text style={[s.chartHint, ds.muted]}>
            {lang === "fr" ? "Touchez et glissez pour explorer" : "Touch & drag to explore"}
          </Text>
        </View>
      </Modal>

      {/* ══ Alert ══ */}
      <Modal visible={alertVisible} animationType="fade" transparent>
        <Pressable style={s.alertOverlay} onPress={() => { setAlertVisible(false); setNotifyTarget(null); }}>
          <View style={[s.alertCard, ds.sheet]}>
            <Text style={[s.alertTitle, ds.text]}>{t.alertTitle}</Text>
            <Text style={[s.alertBody, ds.muted]}>{t.alertBody(notifyTarget?.code)}</Text>
            <TouchableOpacity style={[s.alertBtn, { backgroundColor: primary }]} onPress={() => { setAlertVisible(false); setNotifyTarget(null); }}>
              <Text style={s.exchangeText}>{t.alertConfirm}</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe:    { flex: 1 },
  scroll:  { flex: 1 },
  content: { paddingHorizontal: 20, paddingBottom: 48 },

  header:      { flexDirection: "row", alignItems: "flex-start", marginTop: 16, marginBottom: 28 },
  greeting:    { fontSize: 24, fontWeight: "700" },
  balance:     { fontSize: 13, marginTop: 3 },
  headerLeft:  { flex: 1, overflow: "hidden", marginRight: 8 },
  headerIcons: { flexDirection: "row", gap: 8, alignItems: "center", flexShrink: 0 },
  iconWrap:    { position: "relative", padding: 4 },
  iconEmoji:   { fontSize: 22 },
  badge:       { position: "absolute", top: 4, right: 4, width: 10, height: 10, borderRadius: 5, backgroundColor: RED, borderWidth: 2, borderColor: "transparent" },

  card:       { borderRadius: 18, padding: 18, marginBottom: 10 },
  label:      { fontSize: 11, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.9, marginBottom: 10 },
  row:        { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  amountWrap: { flexDirection: "row", alignItems: "center", flex: 1 },
  symbol:     { fontSize: 30, fontWeight: "300", marginRight: 2 },
  amountField:{ fontSize: 38, fontWeight: "700", padding: 0, minWidth: 60 },
  rateHint:   { fontSize: 12, marginTop: 8 },

  flagPill:    { flexDirection: "row", alignItems: "center", borderRadius: 24, paddingHorizontal: 10, paddingVertical: 7, gap: 6 },
  flagCircle:  { width: 30, height: 30, borderRadius: 15, backgroundColor: "#E8E8EE", alignItems: "center", justifyContent: "center" },
  flagEmoji:   { fontSize: 20 },
  pillCode:    { fontSize: 14, fontWeight: "700" },
  pillChevron: { fontSize: 11 },

  swapBtn:  { alignSelf: "center", width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", marginVertical: 2, marginBottom: 10 },
  swapIcon: { fontSize: 20, color: "#FFF" },

  cardHead:      { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  cardTitle:     { fontSize: 16, fontWeight: "700" },
  cardSub:       { fontSize: 12, marginTop: 2 },
  chevron:       { fontSize: 18 },
  foresightBody: { marginTop: 14, gap: 8 },
  tipRow:        { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  tipDot:        { width: 6, height: 6, borderRadius: 3, marginTop: 5 },
  tipText:       { flex: 1, fontSize: 13, lineHeight: 18 },
  graphCardRow:  { flexDirection: "row", alignItems: "center" },

  trendRow:      { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 },
  trendPill:     { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  trendPillText: { fontSize: 12, fontWeight: "700" },

  exchangeBtn:  { borderRadius: 16, paddingVertical: 18, alignItems: "center", marginTop: 6 },
  exchangeText: { fontSize: 17, fontWeight: "700", color: "#FFF" },

  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.35)" },
  sheet:   { borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 24 },
  handle:  { width: 40, height: 4, borderRadius: 2, backgroundColor: "#E5E5EA", alignSelf: "center", marginBottom: 18 },
  sheetTitle: { fontSize: 19, fontWeight: "700", marginBottom: 16 },
  searchBox:  { borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, fontSize: 15, marginBottom: 8 },

  pickerRow:    { flexDirection: "row", alignItems: "center", paddingVertical: 13, borderBottomWidth: 1 },
  pickerCircle: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center" },
  pickerFlag:   { fontSize: 26 },
  pickerName:   { fontSize: 14, fontWeight: "600" },
  pickerRate:   { fontSize: 12, marginTop: 2 },
  notifyPill:   { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
  notifyText:   { fontSize: 11, fontWeight: "600" },

  // ── Trading chart modal
  chartSheet:    { paddingBottom: 32 },
  chartHeader:   { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 },
  chartPair:     { fontSize: 13, fontWeight: "600", marginBottom: 4, letterSpacing: 0.3 },
  chartRateRow:  { flexDirection: "row", alignItems: "center", gap: 10 },
  chartBigRate:  { fontSize: 32, fontWeight: "800", letterSpacing: -0.5 },
  chartBadge:    { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  chartBadgeText:{ fontSize: 14, fontWeight: "700" },
  chartChangeAbs:{ fontSize: 13, fontWeight: "600", marginTop: 3 },
  chartWrap:     { marginVertical: 8 },
  chartLoader:   { height: 210, justifyContent: "center", alignItems: "center" },
  chartHint:     { fontSize: 11, textAlign: "center", marginTop: 8, fontStyle: "italic" },

  hiloBlock: { alignItems: "flex-end", gap: 6 },
  hiloRow:   { flexDirection: "row", alignItems: "center", gap: 6 },
  hiloLabel: { fontSize: 11, fontWeight: "800", width: 12 },
  hiloVal:   { fontSize: 13, fontWeight: "600" },

  periodRow:  { flexDirection: "row", justifyContent: "space-around", marginTop: 4 },
  periodBtn:  { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20 },
  periodText: { fontSize: 13, fontWeight: "600" },

  alertOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", padding: 32 },
  alertCard:    { borderRadius: 22, padding: 26, width: "100%" },
  alertTitle:   { fontSize: 20, fontWeight: "700", marginBottom: 10 },
  alertBody:    { fontSize: 15, lineHeight: 22, marginBottom: 22 },
  alertBtn:     { borderRadius: 14, paddingVertical: 14, alignItems: "center" },

  settingsRow:    { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 16, borderBottomWidth: 1 },
  settingsLabel:  { fontSize: 16, fontWeight: "500" },
  settingsVersion:{ fontSize: 13, textAlign: "center", marginTop: 20, marginBottom: 8 },
  langToggle:     { flexDirection: "row", gap: 8 },
  langBtn:        { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  langBtnText:    { fontSize: 14, fontWeight: "600" },
});
