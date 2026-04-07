import { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
} from "react-native";
import { useApp } from "../context/AppContext";

interface CustomInputProps extends TextInputProps {
  label:        string;
  error?:       string;
  isPassword?:  boolean;
}

export function CustomInput({ label, error, isPassword, style, ...props }: CustomInputProps) {
  const { theme } = useApp();
  const [visible, setVisible] = useState(false);

  const secureEntry = isPassword ? !visible : false;

  return (
    <View style={s.wrapper}>
      <Text style={[s.label, { color: theme.muted }]}>{label}</Text>
      <View style={[
        s.inputWrap,
        { backgroundColor: theme.input, borderColor: error ? "#FF3B30" : theme.border },
      ]}>
        <TextInput
          style={[s.input, { color: theme.text }, style]}
          placeholderTextColor={theme.muted}
          secureTextEntry={secureEntry}
          autoCapitalize="none"
          autoCorrect={false}
          {...props}
        />
        {isPassword && (
          <TouchableOpacity onPress={() => setVisible(!visible)} style={s.eyeBtn}>
            <Text style={s.eye}>{visible ? "🙈" : "👁️"}</Text>
          </TouchableOpacity>
        )}
      </View>
      {error ? <Text style={s.error}>{error}</Text> : null}
    </View>
  );
}

const s = StyleSheet.create({
  wrapper:   { marginBottom: 16 },
  label:     { fontSize: 13, fontWeight: "600", marginBottom: 8, letterSpacing: 0.3 },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    height: 54,
  },
  input:     { flex: 1, fontSize: 16, padding: 0 },
  eyeBtn:    { padding: 4 },
  eye:       { fontSize: 18 },
  error:     { fontSize: 12, color: "#FF3B30", marginTop: 6, marginLeft: 4 },
});
