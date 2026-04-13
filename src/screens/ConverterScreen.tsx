import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Linking,
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
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Defs, LinearGradient, Path, Stop } from "react-native-svg";

// WebView n'est pas disponible sur Expo Web
const WebView = Platform.OS !== "web"
  ? require("react-native-webview").WebView
  : null;
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
function mkShadow(color = "#000", dark = false): object {
  if (dark) return {};
  return Platform.select({
    ios:     { shadowColor: color, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.09, shadowRadius: 8 },
    android: { elevation: 3 },
    default: {},
  }) ?? {};
}

// ─── Mini sparkline (card preview) ───────────────────────────────────────────

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

// ─── TradingView HTML template ────────────────────────────────────────────────

function buildTVHtml(symbol: string, isDark: boolean, locale: string): string {
  const theme = isDark ? "dark" : "light";
  const bg    = isDark ? "#131722" : "#ffffff";
  // Sanitize symbol to prevent injection
  const safeSym = symbol.replace(/[^A-Z0-9:_/]/g, "").slice(0, 20);
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no"/>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    html,body{width:100%;height:100%;background:${bg};overflow:hidden}
    .tv-container{width:100%;height:100vh}
    .tv-container__widget{height:100%}
  </style>
</head>
<body>
  <div class="tv-container">
    <div class="tv-container__widget"></div>
    <script type="text/javascript"
      src="https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js"
      async>
    {
      "autosize": true,
      "symbol": "${safeSym}",
      "interval": "D",
      "timezone": "Etc/UTC",
      "theme": "${theme}",
      "style": "1",
      "locale": "${locale}",
      "allow_symbol_change": false,
      "save_image": false,
      "hide_top_toolbar": false,
      "withdateranges": true,
      "calendar": false,
      "support_host": "https://www.tradingview.com"
    }
    </script>
  </div>
</body>
</html>`;
}

// ─── Screen ───────────────────────────────────────────────────────────────────

type Nav = NativeStackNavigationProp<RootStackParamList, "Main">;

export default function ConverterScreen() {
  const { theme, lang, darkMode, setDarkMode, setLang, username } = useApp();
  const navigation = useNavigation<Nav>();
  const t          = T[lang];
  const primary    = theme.primary;

  const [fromCurrency, setFromCurrency] = useState<Currency>(getCurrency("EUR"));
  const [toCurrency,   setToCurrency]   = useState<Currency>(getCurrency("USD"));
  const [fromAmount,   setFromAmount]   = useState("1");
  const [rate,         setRate]         = useState<number | null>(null);
  const [rateDate,     setRateDate]     = useState("");
  const [loadingRate,  setLoadingRate]  = useState(false);
  const [graphPoints,  setGraphPoints]  = useState<number[]>([]);
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
      const res  = await fetch(`https://api.frankfurter.app/latest?from=${fromCurrency.code}&to=${toCurrency.code}`);
      const data = await res.json();
      setRate(data.rates[toCurrency.code] ?? null);
      setRateDate(data.date ?? "");
    } catch { setRate(null); }
    finally  { setLoadingRate(false); }
  }, [fromCurrency.code, toCurrency.code]);

  // Fetch 1-month history for the card sparkline preview
  const fetchSparkline = useCallback(async () => {
    setLoadingGraph(true);
    setGraphPoints([]);
    const now      = new Date();
    const toDate   = now.toISOString().split("T")[0];
    const fromDate = new Date(now.setMonth(now.getMonth() - 1)).toISOString().split("T")[0];
    try {
      const res  = await fetch(
        `https://api.frankfurter.app/${fromDate}..${toDate}?from=${fromCurrency.code}&to=${toCurrency.code}`
      );
      const data = await res.json();
      if (data.rates) {
        const entries = (Object.entries(data.rates) as [string, Record<string, number>][])
          .sort(([a], [b]) => a.localeCompare(b));
        setGraphPoints(entries.map(([, r]) => r[toCurrency.code]));
      }
    } catch {}
    finally { setLoadingGraph(false); }
  }, [fromCurrency.code, toCurrency.code]);

  useEffect(() => { fetchRate(); },      [fetchRate]);
  useEffect(() => { fetchSparkline(); }, [fetchSparkline]);

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

  // TradingView symbol — format: FX:EURUSD
  const tvSymbol = `FX:${fromCurrency.code}${toCurrency.code}`;

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
              {lang === "fr" ? "Bonjour" : "Hi"} {username || (lang === "fr" ? "Invité" : "Guest")},
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
              {fromCurrency.symbol}1 = {toCurrency.symbol}{rate.toFixed(4)}{"    "}{rateDate}
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

        {/* ── Graph card (sparkline preview) ── */}
        <TouchableOpacity style={[s.card, ds.card]} onPress={() => setGraphVisible(true)} activeOpacity={0.85}>
          <View style={s.graphCardRow}>
            <View style={{ flex: 1 }}>
              <Text style={[s.cardTitle, ds.text]}>{t.graph}</Text>
              <View style={s.trendRow}>
                {graphTrend !== null ? (
                  <View style={[s.trendPill, { backgroundColor: graphColor + "22" }]}>
                    <Text style={[s.trendPillText, { color: graphColor }]}>
                      {graphIsUp ? "▲" : "▼"} {Math.abs(graphTrend).toFixed(2)}%
                    </Text>
                  </View>
                ) : null}
                <Text style={[s.cardSub, ds.muted]}>1M · {lang === "fr" ? "Ouvrir TradingView" : "Open TradingView"}</Text>
              </View>
            </View>
            {loadingGraph
              ? <ActivityIndicator color={primary} size="small" />
              : graphPoints.length > 1
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

      {/* ══ TradingView Chart (full screen) ══ */}
      <Modal visible={graphVisible} animationType="slide" transparent={false}>
        <SafeAreaView style={[s.tvSafe, { backgroundColor: darkMode ? "#131722" : "#F5F5F7" }]}>

          {/* Header bar */}
          <View style={[s.tvHeader, { borderBottomColor: darkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)" }]}>
            <TouchableOpacity style={s.tvCloseBtn} onPress={() => setGraphVisible(false)}>
              <Text style={[s.tvCloseText, ds.text]}>✕</Text>
            </TouchableOpacity>

            <View style={s.tvTitleBlock}>
              <Text style={[s.tvPair, ds.text]}>
                {fromCurrency.flag} {fromCurrency.code} / {toCurrency.flag} {toCurrency.code}
              </Text>
              {rate !== null && (
                <Text style={[s.tvRate, { color: graphColor }]}>{fmtRate(rate)}</Text>
              )}
            </View>

            {graphTrend !== null && (
              <View style={[s.tvBadge, { backgroundColor: graphColor + "22" }]}>
                <Text style={[s.tvBadgeText, { color: graphColor }]}>
                  {graphIsUp ? "▲" : "▼"} {Math.abs(graphTrend).toFixed(2)}%
                </Text>
              </View>
            )}
          </View>

          {/* TradingView WebView — natif uniquement */}
          {WebView ? (
            <WebView
              style={s.tvWebView}
              source={{ html: buildTVHtml(tvSymbol, darkMode, lang) }}
              javaScriptEnabled
              domStorageEnabled
              originWhitelist={["*"]}
              mixedContentMode="always"
              scrollEnabled={false}
              startInLoadingState
              renderLoading={() => (
                <View style={s.tvLoader}>
                  <ActivityIndicator color={primary} size="large" />
                  <Text style={[s.tvLoaderText, ds.muted]}>
                    {lang === "fr" ? "Chargement du graphique…" : "Loading chart…"}
                  </Text>
                </View>
              )}
            />
          ) : (
            // Fallback Expo Web : bouton pour ouvrir dans le navigateur
            <View style={s.tvWebFallback}>
              <Text style={{ fontSize: 48, marginBottom: 16 }}>📈</Text>
              <Text style={[s.tvPair, ds.text, { marginBottom: 6, textAlign: "center" }]}>
                {fromCurrency.code} / {toCurrency.code}
              </Text>
              {rate !== null && (
                <Text style={[s.tvRate, { color: graphColor, marginBottom: 24, textAlign: "center" }]}>
                  {fmtRate(rate)}
                </Text>
              )}
              <TouchableOpacity
                style={[s.exchangeBtn, { backgroundColor: primary, paddingHorizontal: 36 }]}
                onPress={() => Linking.openURL(`https://www.tradingview.com/symbols/${fromCurrency.code}${toCurrency.code}/`)}
              >
                <Text style={s.exchangeText}>
                  {lang === "fr" ? "Ouvrir sur TradingView ↗" : "Open on TradingView ↗"}
                </Text>
              </TouchableOpacity>
              <Text style={[s.tvLoaderText, ds.muted, { marginTop: 16, textAlign: "center" }]}>
                {lang === "fr"
                  ? "Le graphique interactif nécessite l'app mobile"
                  : "Interactive chart requires the mobile app"}
              </Text>
            </View>
          )}
        </SafeAreaView>
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

  // ── TradingView full screen
  tvSafe:       { flex: 1 },
  tvHeader:     { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  tvCloseBtn:   { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", marginRight: 12 },
  tvCloseText:  { fontSize: 18, fontWeight: "600" },
  tvTitleBlock: { flex: 1 },
  tvPair:       { fontSize: 15, fontWeight: "700" },
  tvRate:       { fontSize: 20, fontWeight: "800", marginTop: 1 },
  tvBadge:      { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, marginLeft: 8 },
  tvBadgeText:  { fontSize: 13, fontWeight: "700" },
  tvWebView:     { flex: 1 },
  tvLoader:      { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, justifyContent: "center", alignItems: "center", gap: 12 },
  tvLoaderText:  { fontSize: 14 },
  tvWebFallback: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 32 },

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
