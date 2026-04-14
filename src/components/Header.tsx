import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useApp } from "../context/AppContext";

// ─── Types ────────────────────────────────────────────────────────────────────

interface HeaderProps {
  onNotificationPress: () => void;
  onSettingsPress:     () => void;
  showBadge?:          boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const RED = "#FF3B30";

// ─── Component ────────────────────────────────────────────────────────────────

export default function Header({ onNotificationPress, onSettingsPress, showBadge = true }: HeaderProps) {
  const { theme, lang } = useApp();

  return (
    <View style={s.header}>

      {/* Title block — shrinks and truncates on small screens */}
      <View style={s.headerLeft}>
        <Text
          style={[s.title, { color: theme.text }]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {lang === "fr" ? "Mon Portefeuille" : "My Portfolio"}
        </Text>
        <Text style={[s.subtitle, { color: theme.muted }]} numberOfLines={1}>
          {lang === "fr" ? "Bienvenue 👋" : "Welcome 👋"}
        </Text>
      </View>

      {/* Icon row — never shrinks, always visible */}
      <View style={s.headerIcons}>
        <TouchableOpacity onPress={onNotificationPress} style={s.iconWrap} activeOpacity={0.7}>
          <Text style={s.iconEmoji}>🔔</Text>
          {showBadge && (
            <View style={[s.badge, { borderColor: theme.bg }]} />
          )}
        </TouchableOpacity>
        <TouchableOpacity onPress={onSettingsPress} style={s.iconWrap} activeOpacity={0.7}>
          <Text style={s.iconEmoji}>⚙️</Text>
        </TouchableOpacity>
      </View>

    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  header: {
    flexDirection:  "row",
    alignItems:     "flex-start",
    marginTop:      16,
    marginBottom:   28,
  },
  headerLeft: {
    flex:       1,
    overflow:   "hidden",  // clips text before ellipsis kicks in
    marginRight: 8,
  },
  title: {
    fontSize:   24,
    fontWeight: "700",
    // numberOfLines + ellipsizeMode handle truncation in RN (no CSS needed)
  },
  subtitle: {
    fontSize:  13,
    marginTop: 3,
  },
  headerIcons: {
    flexDirection: "row",
    gap:           8,
    alignItems:    "center",
    flexShrink:    0, // never compress — icons always visible
  },
  iconWrap: {
    position: "relative",
    padding:  4,
  },
  iconEmoji: {
    fontSize: 22,
  },
  badge: {
    position:    "absolute",
    top:         4,
    right:       4,
    width:       10,
    height:      10,
    borderRadius: 5,
    backgroundColor: RED,
    borderWidth:  2,
  },
});
