import {
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { useApp } from "../context/AppContext";
import { T } from "../i18n/translations";
import { RootStackParamList } from "../navigation/AppNavigator";

type Nav = NativeStackNavigationProp<RootStackParamList, "Main">;

export default function ProfileScreen() {
  const { theme, lang, setLang, darkMode, setDarkMode, username, setUsername } = useApp();
  const navigation = useNavigation<Nav>();
  const t = T[lang];

  const initials = username
    ? username.slice(0, 2).toUpperCase()
    : "?";

  const handleSignOut = () => {
    setUsername("");
    navigation.getParent()?.navigate("SignIn");
  };

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: theme.bg }]}>
      <StatusBar style={darkMode ? "light" : "dark"} />
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

        {/* ── Avatar ── */}
        <View style={s.avatarSection}>
          <View style={[s.avatar, { backgroundColor: theme.primary }]}>
            <Text style={s.avatarText}>{initials}</Text>
          </View>
          <Text style={[s.name, { color: theme.text }]}>{username || "—"}</Text>
          <Text style={[s.subtitle, { color: theme.muted }]}>
            {lang === "fr" ? "Membre depuis aujourd'hui" : "Member since today"}
          </Text>
        </View>

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

          {/* Version */}
          <View style={[s.row, { borderBottomColor: theme.border }]}>
            <Text style={[s.rowLabel, { color: theme.muted }]}>
              {lang === "fr" ? "Version" : "Version"}
            </Text>
            <Text style={[s.rowValue, { color: theme.muted }]}>1.0.0</Text>
          </View>

          {/* Sign out */}
          <TouchableOpacity style={[s.row, { borderBottomWidth: 0 }]} onPress={handleSignOut}>
            <Text style={[s.rowLabel, { color: "#FF3B30" }]}>
              {lang === "fr" ? "🔓 Se déconnecter" : "🔓 Sign out"}
            </Text>
            <Text style={{ color: theme.muted, fontSize: 18 }}>›</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
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
  safe:    { flex: 1 },
  content: { paddingHorizontal: 20, paddingBottom: 40 },

  avatarSection: { alignItems: "center", paddingTop: 36, paddingBottom: 28 },
  avatar:        { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  avatarText:    { fontSize: 28, fontWeight: "800", color: "#FFF" },
  name:          { fontSize: 22, fontWeight: "700" },
  subtitle:      { fontSize: 14, marginTop: 4 },

  card: { borderRadius: 20, overflow: "hidden" },
  row:  {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderBottomWidth: 1,
  },
  rowLabel:  { fontSize: 16, fontWeight: "500" },
  rowValue:  { fontSize: 15 },
  langToggle:{ flexDirection: "row", gap: 8 },
  langBtn:   { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20 },
  langBtnText:{ fontSize: 13, fontWeight: "600" },
});
