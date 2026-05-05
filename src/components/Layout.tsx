import { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useApp } from "../context/AppContext";
import Header from "./Header";

interface LayoutProps {
  children:    ReactNode;
  showHeader?: boolean;
}

export default function Layout({ children, showHeader = true }: LayoutProps) {
  const { theme, darkMode } = useApp();

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: theme.bg }]}>
      <StatusBar style={darkMode ? "light" : "dark"} />
      {showHeader && (
        <View style={s.headerWrapper}>
          <Header />
        </View>
      )}
      <View style={s.content}>{children}</View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  headerWrapper: { paddingHorizontal: 20 },
  content: { flex: 1 },
});
