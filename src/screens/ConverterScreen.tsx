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

// Lookup rapide flag par code (utilisé dans la liste API)
const FLAGS: Record<string, string> = Object.fromEntries(CURRENCIES.map((c) => [c.code, c.flag]));

const RED = "#FF3B30";

function getCurrency(code: string): Currency {
  return CURRENCIES.find((c) => c.code === code) ?? CURRENCIES[0];
}
function fmtNum(v: number) {
  return v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function mkShadow(color = "#000", dark = false): object {
  if (dark) return {};
  return Platform.select({
    ios:     { shadowColor: color, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.09, shadowRadius: 8 },
    android: { elevation: 3 },
    default: {},
  }) ?? {};
}

// ─── Screen ───────────────────────────────────────────────────────────────────

type Nav = BottomTabNavigationProp<TabParamList>;

export default function ConverterScreen() {
  const {
    theme, lang, darkMode, setDarkMode, setLang,
    watchlist, addToWatchlist, removeFromWatchlist, isInWatchlist,
  } = useApp();
  const navigation = useNavigation<Nav>();
  const t          = T[lang];
  const primary    = theme.primary;

  const [fromCurrency, setFromCurrency] = useState<Currency>(getCurrency("EUR"));
  const [toCurrency,   setToCurrency]   = useState<Currency>(getCurrency("USD"));
  const [fromAmount,   setFromAmount]   = useState("1");
  const [rate,         setRate]         = useState<number | null>(null);
  const [rateDate,     setRateDate]     = useState("");
  const [loadingRate,  setLoadingRate]  = useState(false);
  const [rateError,    setRateError]    = useState(false);
  const [pickerVisible,   setPickerVisible]   = useState(false);
  const [pickerTarget,    setPickerTarget]    = useState<"from" | "to">("from");
  const [search,          setSearch]          = useState("");
  const [alertVisible,    setAlertVisible]    = useState(false);
  const [notifyTarget,    setNotifyTarget]    = useState<Currency | null>(null);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [confirmVisible,  setConfirmVisible]  = useState(false);
  const [exchangeDone,    setExchangeDone]    = useState(false);
  const [exchangeErr,     setExchangeErr]     = useState<string | null>(null);

  // ── Watchlist ──
  const [wlPickerVisible,  setWlPickerVisible]  = useState(false);
  const [wlRates,          setWlRates]          = useState<Record<string, number>>({});
  const [wlSearch,         setWlSearch]         = useState("");

  const { twelveDataKey } = useApp();
 
  // Récupère les taux pour toutes les devises de la watchlist
  useEffect(() => {
    if (watchlist.length === 0) return;
    const symbols = watchlist.map(code => `${fromCurrency.code}/${code}`).join(",");
    fetch(
      `https://api.twelvedata.com/price?symbol=${symbols}&apikey=${twelveDataKey}`
    )
      .then((r) => r.json())
      .then((data) => {
        const newRates: Record<string, number> = {};
        if (watchlist.length === 1) {
          if (data.price) newRates[watchlist[0]] = parseFloat(data.price);
        } else {
          Object.entries(data).forEach(([symbol, info]: [string, any]) => {
            const code = symbol.split("/")[1];
            if (info.price) newRates[code] = parseFloat(info.price);
          });
        }
        setWlRates(newRates);
      })
      .catch(() => {});
  }, [watchlist, fromCurrency.code, twelveDataKey]);

  // ── Liste complète depuis Frankfurter API ──
  const [apiCurrencies,        setApiCurrencies]        = useState<{ code: string; name: string }[]>([]);
  const [loadingApiCurrencies, setLoadingApiCurrencies] = useState(true);

  const numFrom = parseFloat(fromAmount.replace(",", ".")) || 0;
  const numTo   = rate !== null ? numFrom * rate : null;

  const fetchRate = useCallback(async () => {
    if (fromCurrency.code === toCurrency.code) { setRate(1); setRateError(false); return; }
    setLoadingRate(true);
    setRateError(false);
    try {
      const symbol = `${fromCurrency.code}/${toCurrency.code}`;
      const res  = await fetch(
        `https://api.twelvedata.com/price?symbol=${symbol}&apikey=${twelveDataKey}`
      );
      const data = await res.json();
      if (data.price) {
        setRate(parseFloat(data.price));
        setRateDate(new Date().toLocaleDateString());
      } else {
        throw new Error("rate_missing");
      }
    } catch {
      setRate(null);
      setRateError(true);
    }
    finally  { setLoadingRate(false); }
  }, [fromCurrency.code, toCurrency.code, twelveDataKey]);

  useEffect(() => { fetchRate(); }, [fetchRate]);

  // Charge la liste complète des devises depuis Frankfurter au montage
  useEffect(() => {
    fetch("https://api.frankfurter.app/currencies", { headers: { Accept: "application/json" } })
      .then((r) => r.json())
      .then((data: Record<string, string>) => {
        setApiCurrencies(
          Object.entries(data).map(([code, name]) => ({ code, name }))
        );
      })
      .catch(() => {})
      .finally(() => setLoadingApiCurrencies(false));
  }, []);

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

  const handleExchangePress = () => {
    if (numFrom <= 0)     { setExchangeErr(t.exchangeErrZero);    return; }
    if (rate === null)    { setExchangeErr(t.exchangeErrNoRate);   return; }
    setExchangeErr(null);
    setExchangeDone(false);
    setConfirmVisible(true);
  };

  const handleConfirm = () => {
    setExchangeDone(true);
    // Simule l'exécution de l'ordre
    setTimeout(() => {
      setConfirmVisible(false);
      setExchangeDone(false);
      setFromAmount("1");
    }, 2000);
  };

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
    <Layout
      onNotificationPress={() => setAlertVisible(true)}
      onSettingsPress={() => setSettingsVisible(true)}
    >

      <ScrollView style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

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
          {rateError && !loadingRate && (
            <TouchableOpacity style={s.retryRow} onPress={fetchRate}>
              <Text style={s.retryText}>
                {lang === "fr" ? "⚠️  Taux indisponible — Réessayer ↻" : "⚠️  Rate unavailable — Retry ↻"}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── Exchange ── */}
        {exchangeErr && (
          <View style={s.exchangeErrBanner}>
            <Text style={s.exchangeErrText}>⚠️  {exchangeErr}</Text>
          </View>
        )}
        <TouchableOpacity
          style={[s.exchangeBtn, { backgroundColor: primary, ...(mkShadow(primary, darkMode)), opacity: (numFrom <= 0 || rate === null) ? 0.5 : 1 }]}
          activeOpacity={0.85}
          onPress={handleExchangePress}
        >
          <Text style={s.exchangeText}>{t.exchange}</Text>
        </TouchableOpacity>

        {/* ══ Watchlist ══ */}
        <View style={s.wlHeader}>
          <Text style={[s.sectionTitle, ds.muted, { marginTop: 0 }]}>{t.watchlistTitle}</Text>
          <TouchableOpacity
            style={[s.wlAddBtn, { backgroundColor: primary + "18", borderColor: primary + "55" }]}
            onPress={() => { setWlSearch(""); setWlPickerVisible(true); }}
            activeOpacity={0.75}
          >
            <Text style={[s.wlAddText, { color: primary }]}>+ {t.watchlistAdd}</Text>
          </TouchableOpacity>
        </View>

        {watchlist.length === 0 ? (
          <View style={[s.wlEmpty, { backgroundColor: theme.card }]}>
            <Text style={{ fontSize: 32, marginBottom: 8 }}>👀</Text>
            <Text style={[s.wlEmptyText, ds.muted]}>{t.watchlistEmpty}</Text>
          </View>
        ) : (
          watchlist.map((code) => {
            const wlCur     = CURRENCIES.find((c) => c.code === code);
            const wlFlag    = wlCur?.flag ?? FLAGS[code] ?? "🏳️";
            const wlRate    = wlRates[code];
            const wlName    = apiCurrencies.find((c) => c.code === code)?.name ?? code;
            return (
              <TouchableOpacity
                key={code}
                style={[s.wlRow, ds.card]}
                activeOpacity={0.75}
                onPress={() => navigation.getParent()?.navigate("Detail", { code, name: wlName })}
              >
                <View style={[s.pickerCircle, ds.pill]}>
                  <Text style={s.pickerFlag}>{wlFlag}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[s.pickerName, ds.text]}>{code}</Text>
                  {wlRate !== undefined ? (
                    <Text style={[s.pickerRate, ds.muted]}>
                      1 {fromCurrency.code} = {wlRate.toFixed(4)} {code}
                    </Text>
                  ) : (
                    <Text style={[s.pickerRate, ds.muted]}>…</Text>
                  )}
                </View>
                <TouchableOpacity
                  style={[s.wlRemoveBtn, { backgroundColor: "#FF3B3015" }]}
                  onPress={() => removeFromWatchlist(code)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={{ fontSize: 16, color: "#FF3B30" }}>✕</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            );
          })
        )}

        {/* ── Liste des devises (source Frankfurter API) ── */}
        <Text style={[s.sectionTitle, ds.muted]}>
          {lang === "fr" ? "Toutes les devises" : "All currencies"}
        </Text>

        {loadingApiCurrencies ? (
          <ActivityIndicator color={primary} style={{ marginVertical: 20 }} />
        ) : (
          apiCurrencies.map(({ code, name }) => (
            <TouchableOpacity
              key={code}
              style={[s.currencyRow, ds.card]}
              activeOpacity={0.75}
              onPress={() => navigation.getParent()?.navigate("Detail", { code, name })}
            >
              <View style={[s.pickerCircle, ds.pill]}>
                <Text style={s.pickerFlag}>{FLAGS[code] ?? "🏳️"}</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[s.pickerName, ds.text]}>{code}</Text>
                <Text style={[s.pickerRate, ds.muted]} numberOfLines={1}>{name}</Text>
              </View>
              <Text style={[s.chevron, ds.muted]}>›</Text>
            </TouchableOpacity>
          ))
        )}

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

          {/* Bouton sign-out supprimé — accès libre sans auth */}

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

      {/* ══ Confirmation échange ══ */}
      <Modal visible={confirmVisible} animationType="fade" transparent>
        <View style={s.confirmOverlay}>
          <View style={[s.confirmCard, ds.sheet]}>

            {!exchangeDone ? (
              <>
                <Text style={[s.confirmTitle, ds.text]}>{t.exchangeConfirmTitle}</Text>

                {/* Résumé */}
                <View style={[s.confirmSummary, { backgroundColor: theme.input }]}>
                  <View style={s.confirmRow}>
                    <Text style={s.confirmFlag}>{fromCurrency.flag}</Text>
                    <Text style={[s.confirmAmount, ds.text]}>
                      {fmtNum(numFrom)} {fromCurrency.code}
                    </Text>
                  </View>
                  <Text style={[s.confirmArrow, { color: primary }]}>↓</Text>
                  <View style={s.confirmRow}>
                    <Text style={s.confirmFlag}>{toCurrency.flag}</Text>
                    <Text style={[s.confirmAmount, { color: primary }]}>
                      {numTo !== null ? fmtNum(numTo) : "—"} {toCurrency.code}
                    </Text>
                  </View>
                </View>

                {rate !== null && (
                  <Text style={[s.confirmRate, ds.muted]}>
                    {t.rateLabel(fromCurrency.code, rate.toFixed(4), toCurrency.code)}
                  </Text>
                )}

                {/* Boutons */}
                <View style={s.confirmBtns}>
                  <TouchableOpacity
                    style={[s.confirmBtn, { backgroundColor: theme.input }]}
                    onPress={() => setConfirmVisible(false)}
                  >
                    <Text style={[s.confirmBtnText, ds.muted]}>{t.exchangeCancelBtn}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[s.confirmBtn, { backgroundColor: primary }]}
                    onPress={handleConfirm}
                  >
                    <Text style={[s.confirmBtnText, { color: "#FFF" }]}>{t.exchangeConfirmBtn} ✓</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              /* ── Succès ── */
              <View style={s.successBlock}>
                <Text style={s.successEmoji}>✅</Text>
                <Text style={[s.confirmTitle, ds.text, { textAlign: "center" }]}>
                  {t.exchangeSuccessTitle}
                </Text>
                <Text style={[s.confirmRate, ds.muted, { textAlign: "center", marginTop: 6 }]}>
                  {t.exchangeSuccessBody(
                    `${fmtNum(numFrom)} ${fromCurrency.code}`,
                    `${numTo !== null ? fmtNum(numTo) : "—"} ${toCurrency.code}`
                  )}
                </Text>
              </View>
            )}

          </View>
        </View>
      </Modal>

      {/* ══ Watchlist picker ══ */}
      <Modal visible={wlPickerVisible} animationType="slide" transparent>
        <Pressable style={s.overlay} onPress={() => setWlPickerVisible(false)} />
        <View style={[s.sheet, ds.sheet]}>
          <View style={s.handle} />
          <Text style={[s.sheetTitle, ds.text]}>{t.watchlistAdd}</Text>
          <TextInput
            style={[s.searchBox, ds.inputBg, ds.text]}
            value={wlSearch}
            onChangeText={setWlSearch}
            placeholder={t.searchCurrency}
            placeholderTextColor={theme.muted}
            autoFocus
          />
          <FlatList
            data={CURRENCIES.filter((c) =>
              c.code.toLowerCase().includes(wlSearch.toLowerCase()) ||
              c.name[lang].toLowerCase().includes(wlSearch.toLowerCase())
            )}
            keyExtractor={(c) => c.code}
            style={{ maxHeight: 360 }}
            renderItem={({ item }) => {
              const inList = isInWatchlist(item.code);
              return (
                <TouchableOpacity
                  style={[s.pickerRow, { borderBottomColor: theme.border }]}
                  onPress={() => { addToWatchlist(item.code); setWlPickerVisible(false); }}
                  disabled={inList}
                  activeOpacity={inList ? 1 : 0.7}
                >
                  <View style={[s.pickerCircle, ds.pill]}>
                    <Text style={s.pickerFlag}>{item.flag}</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={[s.pickerName, ds.text]}>{item.name[lang]} ({item.code})</Text>
                  </View>
                  {inList
                    ? <Text style={{ color: primary, fontWeight: "700", fontSize: 16 }}>★</Text>
                    : <Text style={[s.chevron, ds.muted]}>+</Text>
                  }
                </TouchableOpacity>
              );
            }}
          />
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

    </Layout>
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

  chevron: { fontSize: 18 },

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

  exchangeErrBanner: { backgroundColor: "#FF3B3015", borderRadius: 12, padding: 12, marginBottom: 8, borderLeftWidth: 3, borderLeftColor: RED },
  exchangeErrText:   { fontSize: 13, color: RED, fontWeight: "500" },

  retryRow:  { marginTop: 8, paddingVertical: 4 },
  retryText: { fontSize: 13, color: RED, fontWeight: "600" },

  confirmOverlay:  { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", padding: 24 },
  confirmCard:     { borderRadius: 24, padding: 24, width: "100%" },
  confirmTitle:    { fontSize: 20, fontWeight: "700", marginBottom: 20 },
  confirmSummary:  { borderRadius: 16, padding: 18, marginBottom: 14, gap: 8 },
  confirmRow:      { flexDirection: "row", alignItems: "center", gap: 12 },
  confirmFlag:     { fontSize: 28 },
  confirmAmount:   { fontSize: 22, fontWeight: "700" },
  confirmArrow:    { fontSize: 22, fontWeight: "700", textAlign: "center" },
  confirmRate:     { fontSize: 13, marginBottom: 20 },
  confirmBtns:     { flexDirection: "row", gap: 12 },
  confirmBtn:      { flex: 1, borderRadius: 14, paddingVertical: 14, alignItems: "center" },
  confirmBtnText:  { fontSize: 15, fontWeight: "700" },
  successBlock:    { alignItems: "center", paddingVertical: 12, gap: 10 },
  successEmoji:    { fontSize: 52 },

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

  // ── Currency list ──
  sectionTitle: {
    fontSize:        12,
    fontWeight:      "700",
    textTransform:   "uppercase",
    letterSpacing:   0.9,
    marginTop:       32,
    marginBottom:    10,
  },
  currencyRow: {
    flexDirection: "row",
    alignItems:    "center",
    padding:       14,
    borderRadius:  16,
    marginBottom:  6,
  },
  // ── Watchlist ──
  wlHeader: {
    flexDirection:  "row",
    alignItems:     "center",
    justifyContent: "space-between",
    marginTop:      32,
    marginBottom:   10,
  },
  wlAddBtn: {
    borderRadius:      20,
    borderWidth:        1,
    paddingHorizontal: 12,
    paddingVertical:    6,
  },
  wlAddText:    { fontSize: 12, fontWeight: "700" },
  wlRow: {
    flexDirection: "row",
    alignItems:    "center",
    padding:       14,
    borderRadius:  16,
    marginBottom:  6,
  },
  wlRemoveBtn: {
    width:        32,
    height:       32,
    borderRadius: 16,
    alignItems:   "center",
    justifyContent: "center",
  },
  wlEmpty: {
    borderRadius:  16,
    padding:       24,
    alignItems:    "center",
    marginBottom:  8,
  },
  wlEmptyText: { fontSize: 14 },
});
