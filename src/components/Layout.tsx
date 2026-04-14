import { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

import { useApp } from "../context/AppContext";
import Header from "./Header";

// ─── Types ────────────────────────────────────────────────────────────────────

interface LayoutProps {
  children:             ReactNode;
  onNotificationPress?: () => void;
  onSettingsPress?:     () => void;
  showHeader?:          boolean;
  showBadge?:           boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Layout — encapsule chaque écran.
 *
 *  ┌──────────────────────────┐
 *  │  Header (Mon Portefeuille│  ← Header.tsx
 *  ├──────────────────────────┤
 *  │                          │
 *  │       {children}         │  ← contenu de l'écran
 *  │                          │
 *  └──────────────────────────┘
 *       Tab bar (React Navigation l'ajoute en dessous automatiquement)
 */
export default function Layout({
  children,
  onNotificationPress = () => {},
  onSettingsPress     = () => {},
  showHeader          = true,
  showBadge           = true,
}: LayoutProps) {
  const { theme, darkMode } = useApp();

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: theme.bg }]}>
      <StatusBar style={darkMode ? "light" : "dark"} />

      {showHeader && (
        <View style={[s.headerWrapper, { borderBottomColor: theme.border }]}>
          <Header
            onNotificationPress={onNotificationPress}
            onSettingsPress={onSettingsPress}
            showBadge={showBadge}
          />
        </View>
      )}

      <View style={s.content}>
        {children}
      </View>

    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe: {
    flex: 1,
  },
  headerWrapper: {
    paddingHorizontal: 20,
    borderBottomWidth: 0, // mettre à 1 si tu veux un séparateur visible
  },
  content: {
    flex: 1,
  },
});
