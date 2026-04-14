import {
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { useApp } from "../context/AppContext";
import { T } from "../i18n/translations";
import Layout from "../components/Layout";
import { RootStackParamList } from "../navigation/AppNavigator";

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function ProfileScreen() {
  const {
    theme, lang, setLang, darkMode, setDarkMode,
    username, currentUserEmail, isLoggedIn,
    notificationsEnabled, setNotificationsEnabled,
    logout,
  } = useApp();
  const navigation = useNavigation<Nav>();
  const t          = T[lang];

  const guestLabel  = lang === "fr" ? "Invité" : "Guest";
  const displayName = username || guestLabel;
  const initials    = displayName.slice(0, 2).toUpperCase();

  return (
    <Layout showHeader={false}>
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

        {/* ── Avatar ── */}
        <View style={s.avatarSection}>
          <View style={[
            s.avatar,
            { backgroundColor: isLoggedIn ? theme.primary : theme.muted },
          ]}>
            <Text style={s.avatarText}>{initials}</Text>
          </View>
          <Text style={[s.name, { color: theme.text }]}>{displayName}</Text>
          {isLoggedIn && currentUserEmail ? (
            <Text style={[s.email, { color: theme.muted }]}>{currentUserEmail}</Text>
          ) : null}
          <Text style={[s.subtitle, { color: theme.muted }]}>
            {isLoggedIn
              ? (lang === "fr" ? "Membre depuis aujourd'hui" : "Member since today")
              : (lang === "fr" ? "Mode invité — connexion optionnelle" : "Guest mode — login optional")}
          </Text>
        </View>

        {/* ── Boutons connexion (mode invité uniquement) ── */}
        {!isLoggedIn && (
          <View style={s.authBlock}>
            <TouchableOpacity
              style={[s.authBtn, { backgroundColor: theme.primary }]}
              onPress={() => navigation.navigate("SignIn")}
              activeOpacity={0.8}
            >
              <Text style={s.authBtnText}>
                {lang === "fr" ? "🔑 Se connecter" : "🔑 Sign in"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[s.authBtnOutline, { borderColor: theme.primary }]}
              onPress={() => navigation.navigate("SignUp")}
              activeOpacity={0.8}
            >
              <Text style={[s.authBtnOutlineText, { color: theme.primary }]}>
                {lang === "fr" ? "✨ Créer un compte" : "✨ Create an account"}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Settings card ── */}
        <View style={[s.card, { backgroundColor: theme.card, ...mkShadow(darkMode) }]}>

          {/* Language */}
          <View style={[s.row, { borderBottomColor: theme.border }]}>
            <Text style={[s.rowLabel, { color: theme.text }]}>{t.settingsLang}</Text>
            <View style={s.langToggle}>
              {(["fr", "en"] as const).map((l) => (
                <TouchableOpacity
                  key={l}
                  style={[s.langBtn, lang === l && { backgroundColor: theme.primary }]}
                  onPress={() => setLang(l)}
                >
                  <Text style={[s.langBtnText, { color: lang === l ? "#FFF" : theme.muted }]}>
                    {l === "fr" ? "🇫🇷 FR" : "🇬🇧 EN"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Dark mode */}
          <View style={[s.row, { borderBottomColor: theme.border }]}>
            <Text style={[s.rowLabel, { color: theme.text }]}>{t.settingsDark}</Text>
            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
              trackColor={{ false: theme.border, true: theme.primary }}
              thumbColor="#FFF"
            />
          </View>

          {/* Notifications */}
          <View style={[s.row, { borderBottomColor: theme.border }]}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={[s.rowLabel, { color: theme.text }]}>{t.notifTitle}</Text>
              <Text style={[s.rowSub, { color: theme.muted }]}>{t.notifDesc}</Text>
            </View>
            <View style={s.notifRight}>
              <Text style={[s.notifStatus, { color: notificationsEnabled ? "#34C759" : "#FF3B30" }]}>
                {notificationsEnabled ? t.notifOn : t.notifOff}
              </Text>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: theme.border, true: "#34C759" }}
                thumbColor="#FFF"
              />
            </View>
          </View>

          {/* Version */}
          <View style={[s.row, { borderBottomColor: isLoggedIn ? theme.border : "transparent" }]}>
            <Text style={[s.rowLabel, { color: theme.muted }]}>Version</Text>
            <Text style={[s.rowValue, { color: theme.muted }]}>1.0.0</Text>
          </View>

          {/* Se déconnecter — uniquement si connecté */}
          {isLoggedIn && (
            <TouchableOpacity
              style={[s.row, { borderBottomWidth: 0 }]}
              onPress={logout}
            >
              <View>
                <Text style={[s.rowLabel, { color: "#FF3B30" }]}>
                  {lang === "fr" ? "🚪 Se déconnecter" : "🚪 Sign out"}
                </Text>
                <Text style={[s.rowSub, { color: theme.muted }]}>
                  {lang === "fr"
                    ? "Ce compte ne peut être utilisé qu'une seule fois"
                    : "This account can only be used once"}
                </Text>
              </View>
              <Text style={{ color: theme.muted, fontSize: 18 }}>›</Text>
            </TouchableOpacity>
          )}

        </View>

      </ScrollView>
    </Layout>
  );
}

function mkShadow(dark: boolean): object {
  if (dark) return {};
  return Platform.select({
    ios:     { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8 },
    android: { elevation: 3 },
    default: {},
  }) ?? {};
}

const s = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingBottom: 40 },

  avatarSection: { alignItems: "center", paddingTop: 36, paddingBottom: 20 },
  avatar:        { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  avatarText:    { fontSize: 28, fontWeight: "800", color: "#FFF" },
  name:          { fontSize: 22, fontWeight: "700" },
  email:         { fontSize: 13, marginTop: 2 },
  subtitle:      { fontSize: 14, marginTop: 4 },

  // Auth buttons (guest mode)
  authBlock: { marginBottom: 20, gap: 10 },
  authBtn: {
    borderRadius:   16,
    paddingVertical: 14,
    alignItems:     "center",
  },
  authBtnText: { color: "#FFF", fontSize: 16, fontWeight: "700" },
  authBtnOutline: {
    borderRadius:   16,
    borderWidth:    2,
    paddingVertical: 13,
    alignItems:     "center",
  },
  authBtnOutlineText: { fontSize: 16, fontWeight: "700" },

  card: { borderRadius: 20, overflow: "hidden" },
  row:  {
    flexDirection:     "row",
    alignItems:        "center",
    justifyContent:    "space-between",
    paddingVertical:   16,
    paddingHorizontal: 18,
    borderBottomWidth: 1,
  },
  rowLabel:   { fontSize: 16, fontWeight: "500" },
  rowValue:   { fontSize: 15 },
  langToggle:  { flexDirection: "row", gap: 8 },
  langBtn:     { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20 },
  langBtnText: { fontSize: 13, fontWeight: "600" },
  rowSub:      { fontSize: 12, marginTop: 2 },
  notifRight:  { flexDirection: "row", alignItems: "center", gap: 8 },
  notifStatus: { fontSize: 12, fontWeight: "700" },
});
