import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableOpacityProps,
} from "react-native";
import { useApp } from "../context/AppContext";

interface CustomButtonProps extends TouchableOpacityProps {
  label:      string;
  isLoading?: boolean;
  variant?:   "primary" | "ghost";
}

export function CustomButton({
  label,
  isLoading,
  variant = "primary",
  style,
  disabled,
  ...props
}: CustomButtonProps) {
  const { theme } = useApp();
  const isPrimary = variant === "primary";

  return (
    <TouchableOpacity
      style={[
        s.btn,
        isPrimary
          ? { backgroundColor: theme.primary }
          : { backgroundColor: "transparent" },
        (disabled || isLoading) && s.disabled,
        style,
      ]}
      disabled={disabled || isLoading}
      activeOpacity={0.82}
      {...props}
    >
      {isLoading ? (
        <ActivityIndicator color={isPrimary ? "#FFF" : theme.primary} />
      ) : (
        <Text style={[s.label, { color: isPrimary ? "#FFF" : theme.primary }]}>
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  btn: {
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  label:   { fontSize: 17, fontWeight: "700" },
  disabled:{ opacity: 0.6 },
});
