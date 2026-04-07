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
import { signUp, AuthError } from "../services/authService";
import { RootStackParamList } from "../navigation/AppNavigator";

// ─── Validation ───────────────────────────────────────────────────────────────

interface FormErrors {
  username?:       string;
  email?:          string;
  password?:       string;
  confirmPassword?: string;
  global?:         string;
}

function validate(
  username: string,
  email: string,
  password: string,
  confirm: string,
  t: typeof T["fr"]
): FormErrors {
  const errors: FormErrors = {};
  if (!username.trim())
    errors.username = t.errUsernameRequired;
  else if (username.trim().length < 3)
    errors.username = t.errUsernameMin;

  if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    errors.email = t.errEmailInvalid;

  if (password.length < 8)
    errors.password = t.errPasswordMin;

  if (confirm !== password)
    errors.confirmPassword = t.errPasswordMatch;

  return errors;
}

// ─── Screen ───────────────────────────────────────────────────────────────────

type Nav = NativeStackNavigationProp<RootStackParamList, "SignUp">;

export default function SignUpScreen() {
  const { theme, lang, setUsername: setAppUsername } = useApp();
  const navigation      = useNavigation<Nav>();
  const t               = T[lang];

  const [username,        setUsername]        = useState("");
  const [email,           setEmail]           = useState("");
  const [password,        setPassword]        = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors,          setErrors]          = useState<FormErrors>({});
  const [isLoading,       setIsLoading]       = useState(false);
  const [success,         setSuccess]         = useState(false);

  // Real-time clear on change
  const clearError = (field: keyof FormErrors) =>
    setErrors((prev) => ({ ...prev, [field]: undefined }));

  const handleSubmit = async () => {
    const formErrors = validate(username, email, password, confirmPassword, t);
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }
    setErrors({});
    setIsLoading(true);
    try {
      const user = await signUp({ username: username.trim(), email: email.trim(), password });
      setAppUsername(user.username);
      setSuccess(true);
      // Navigate to Converter after short delay
      setTimeout(() => navigation.replace("Converter"), 1200);
    } catch (err) {
      const authErr = err as AuthError;
      if (authErr.field === "email") {
        setErrors({ email: authErr.message });
      } else {
        setErrors({ global: t.errGeneric });
      }
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
            <Text style={[s.title, { color: theme.text }]}>{t.signUpTitle}</Text>
            <Text style={[s.subtitle, { color: theme.muted }]}>{t.signUpSubtitle}</Text>
          </View>

          {/* ── Form card ── */}
          <View style={[s.card, { backgroundColor: theme.card }]}>

            {/* Global error */}
            {errors.global && (
              <View style={s.globalError}>
                <Text style={s.globalErrorText}>⚠️  {errors.global}</Text>
              </View>
            )}

            {/* Success */}
            {success && (
              <View style={s.successBanner}>
                <Text style={s.successText}>✅  {t.successSignUp}</Text>
              </View>
            )}

            <CustomInput
              label={t.username}
              placeholder={t.phUsername}
              value={username}
              onChangeText={(v) => { setUsername(v); clearError("username"); }}
              error={errors.username}
              returnKeyType="next"
            />
            <CustomInput
              label={t.email}
              placeholder={t.phEmail}
              value={email}
              onChangeText={(v) => { setEmail(v); clearError("email"); }}
              error={errors.email}
              keyboardType="email-address"
              returnKeyType="next"
            />
            <CustomInput
              label={t.password}
              placeholder={t.phPassword}
              value={password}
              onChangeText={(v) => { setPassword(v); clearError("password"); }}
              error={errors.password}
              isPassword
              returnKeyType="next"
            />

            {/* Password strength bar */}
            {password.length > 0 && (
              <PasswordStrength password={password} theme={theme} />
            )}

            <CustomInput
              label={t.confirmPassword}
              placeholder={t.phConfirm}
              value={confirmPassword}
              onChangeText={(v) => { setConfirmPassword(v); clearError("confirmPassword"); }}
              error={errors.confirmPassword}
              isPassword
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
            />

            <CustomButton
              label={t.createAccount}
              onPress={handleSubmit}
              isLoading={isLoading}
              disabled={success}
              style={{ marginTop: 8 }}
            />
          </View>

          {/* ── Link to SignIn ── */}
          <View style={s.footer}>
            <Text style={[s.footerText, { color: theme.muted }]}>{t.alreadyAccount} </Text>
            <TouchableOpacity onPress={() => navigation.navigate("SignIn")}>
              <Text style={[s.footerLink, { color: theme.primary }]}>{t.signIn}</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Password strength indicator ─────────────────────────────────────────────

function PasswordStrength({ password, theme }: { password: string; theme: typeof import("../context/AppContext").LIGHT }) {
  const len    = password.length;
  const hasUpper = /[A-Z]/.test(password);
  const hasNum   = /[0-9]/.test(password);
  const hasSpec  = /[^A-Za-z0-9]/.test(password);
  const score    = (len >= 8 ? 1 : 0) + (hasUpper ? 1 : 0) + (hasNum ? 1 : 0) + (hasSpec ? 1 : 0);

  const colors = ["#FF3B30", "#FF9500", "#FFCC00", "#34C759"];
  const labels_fr = ["Très faible", "Faible", "Moyen", "Fort"];
  const labels_en = ["Very weak", "Weak", "Medium", "Strong"];
  const color = colors[score - 1] ?? "#FF3B30";

  return (
    <View style={s.strengthWrap}>
      <View style={s.bars}>
        {[0, 1, 2, 3].map((i) => (
          <View
            key={i}
            style={[
              s.bar,
              { backgroundColor: i < score ? color : theme.border },
            ]}
          />
        ))}
      </View>
      <Text style={[s.strengthLabel, { color }]}>
        {labels_fr[score - 1] ?? ""}
      </Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
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

  globalError: {
    backgroundColor: "#FF3B3015",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: "#FF3B30",
  },
  globalErrorText: { fontSize: 14, color: "#FF3B30", fontWeight: "500" },

  successBanner: {
    backgroundColor: "#34C75915",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: "#34C759",
  },
  successText: { fontSize: 14, color: "#34C759", fontWeight: "500" },

  strengthWrap:  { flexDirection: "row", alignItems: "center", marginBottom: 16, gap: 8 },
  bars:          { flexDirection: "row", gap: 4, flex: 1 },
  bar:           { flex: 1, height: 4, borderRadius: 2 },
  strengthLabel: { fontSize: 12, fontWeight: "600", width: 70, textAlign: "right" },

  footer:     { flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: 24 },
  footerText: { fontSize: 14 },
  footerLink: { fontSize: 14, fontWeight: "700" },
});
