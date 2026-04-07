import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";

import { useApp } from "../context/AppContext";
import { T } from "../i18n/translations";
import { CustomInput } from "../components/CustomInput";
import { CustomButton } from "../components/CustomButton";
import { signIn, AuthError } from "../services/authService";
import { RootStackParamList } from "../navigation/AppNavigator";

type Nav = NativeStackNavigationProp<RootStackParamList, "SignIn">;

export default function SignInScreen() {
  const { theme, lang, setUsername } = useApp();
  const navigation      = useNavigation<Nav>();
  const t               = T[lang];

  const [email,     setEmail]     = useState("");
  const [password,  setPassword]  = useState("");
  const [error,     setError]     = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim() || !password) {
      setError(t.errGeneric);
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      const user = await signIn(email.trim(), password);
      setUsername(user.username);
      navigation.replace("Converter");
    } catch (err) {
      const authErr = err as AuthError;
      setError(authErr.message ?? t.errGeneric);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: theme.bg }]}>
      <KeyboardAvoidingView
        style={s.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 24}
      >
        <ScrollView
          contentContainerStyle={s.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Header ── */}
          <View style={s.headerBlock}>
            <View style={[s.logoWrap, { backgroundColor: theme.primary + "18" }]}>
              <Text style={s.logo}>💱</Text>
            </View>
            <Text style={[s.title, { color: theme.text }]}>{t.signInTitle}</Text>
            <Text style={[s.subtitle, { color: theme.muted }]}>{t.signInSubtitle}</Text>
          </View>

          {/* ── Form card ── */}
          <View style={[s.card, { backgroundColor: theme.card }]}>
            {error && (
              <View style={s.errorBanner}>
                <Text style={s.errorText}>⚠️  {error}</Text>
              </View>
            )}

            <CustomInput
              label={t.email}
              placeholder={t.phEmail}
              value={email}
              onChangeText={(v) => { setEmail(v); setError(null); }}
              keyboardType="email-address"
              returnKeyType="next"
            />
            <CustomInput
              label={t.password}
              placeholder={t.phPassword}
              value={password}
              onChangeText={(v) => { setPassword(v); setError(null); }}
              isPassword
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
            />

            {/* Demo hint */}
            <Text style={[s.hint, { color: theme.muted }]}>
              💡 demo@example.com / password123
            </Text>

            <CustomButton
              label={t.signIn}
              onPress={handleSubmit}
              isLoading={isLoading}
              style={{ marginTop: 8 }}
            />
          </View>

          {/* ── Link to SignUp ── */}
          <View style={s.footer}>
            <Text style={[s.footerText, { color: theme.muted }]}>{t.noAccount} </Text>
            <TouchableOpacity onPress={() => navigation.navigate("SignUp")}>
              <Text style={[s.footerLink, { color: theme.primary }]}>{t.createAccount}</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1 },
  flex:   { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 20, paddingBottom: 40 },

  headerBlock: { alignItems: "center", paddingTop: 32, paddingBottom: 28 },
  logoWrap:    { width: 72, height: 72, borderRadius: 24, alignItems: "center", justifyContent: "center", marginBottom: 16 },
  logo:        { fontSize: 36 },
  title:       { fontSize: 28, fontWeight: "800", letterSpacing: -0.5 },
  subtitle:    { fontSize: 15, marginTop: 6 },

  card: {
    borderRadius: 24,
    padding: 24,
    ...Platform.select({
      ios:     { shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 16 },
      android: { elevation: 4 },
      default: {},
    }),
  },

  errorBanner: {
    backgroundColor: "#FF3B3015",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: "#FF3B30",
  },
  errorText: { fontSize: 14, color: "#FF3B30", fontWeight: "500" },

  hint:       { fontSize: 12, textAlign: "center", marginBottom: 12, fontStyle: "italic" },
  footer:     { flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: 24 },
  footerText: { fontSize: 14 },
  footerLink: { fontSize: 14, fontWeight: "700" },
});
