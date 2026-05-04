import { useState } from "react";
import {
  Animated,
  Dimensions,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import SlideItem from "../components/SlideItem";
import { useApp } from "../context/AppContext";
import type { RootStackParamList } from "../navigation/AppNavigator";

// ─── Types ────────────────────────────────────────────────────────────────────

type Nav = NativeStackNavigationProp<RootStackParamList, "Onboarding">;

interface SlideData {
  title: string;
  body: string;
  backgroundImage: any;
  submitLabel?: string;
  onSubmit?: () => Promise<void>;
  isSubmitting?: boolean;
}

// ─── Écran ────────────────────────────────────────────────────────────────────

export default function OnboardingScreen() {
  const [isSaving, setIsSaving] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const navigation = useNavigation<Nav>();
  const { top, bottom } = useSafeAreaInsets();
  const { setHasOnboarded } = useApp();

  // ── Action du bouton "Commencer" ──────────────────────────────────────────
  const onPressExplore = async () => {
    setIsSaving(true);
    try {
      // Petit délai pour le feedback visuel (comme le prof)
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setHasOnboarded(true);
      navigation.replace("Main");
    } finally {
      setIsSaving(false);
    }
  };

  // ── Données des slides ────────────────────────────────────────────────────
  const data: SlideData[] = [
    {
      title: "Bienvenue sur DeviseX",
      body: "Votre convertisseur de devises intelligent en temps réel",
      backgroundImage: require("../../assets/bg-onboarding-1.png"),
    },
    {
      title: "Convertissez Facilement",
      body: "Plus de 150 devises disponibles avec des taux actualisés en continu",
      backgroundImage: require("../../assets/bg-onboarding-2.png"),
    },
    {
      title: "Suivez les Marchés",
      body: "Graphiques interactifs et historique des taux pour prendre les meilleures décisions",
      backgroundImage: require("../../assets/bg-onboarding-3.png"),
      onSubmit: onPressExplore,
      isSubmitting: isSaving,
      submitLabel: "Commencer",
    },
  ];

  // ── Gestion du scroll pour tracker l'index actif ──────────────────────────
  const onScroll = (event: any) => {
    const totalWidth = event.nativeEvent.layoutMeasurement.width;
    const xPosition = event.nativeEvent.contentOffset.x;
    const newIndex = Math.round(xPosition / totalWidth);
    if (newIndex !== activeIndex) {
      setActiveIndex(newIndex);
    }
  };

  const isLastIndex = data.length - 1 === activeIndex;

  return (
    <View style={styles.container}>
      {/* ── FlatList horizontale paginée (comme le prof) ── */}
      <FlatList
        data={data}
        pagingEnabled
        onScroll={onScroll}
        scrollEventThrottle={20}
        renderItem={({ item, index }) => (
          <SlideItem {...item} isActive={index === activeIndex} />
        )}
        showsHorizontalScrollIndicator={false}
        horizontal
        keyExtractor={(_, index) => index.toString()}
      />

      {/* ── Titre de l'app en haut ── */}
      <View
        style={[
          styles.header,
          {
            paddingTop: top + 20,
          },
        ]}
      >
        <Text style={styles.appTitle}>{"💱"}</Text>
        <Text style={styles.appName}>{"DeviseX"}</Text>
      </View>

      {/* ── Indicateurs de pagination (dots) ── */}
      {!isLastIndex && (
        <View
          style={[
            styles.dotsContainer,
            { paddingBottom: bottom + 24 },
          ]}
        >
          {data.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                activeIndex === index
                  ? styles.dotActive
                  : styles.dotInactive,
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const PRIMARY = "#6B4EFF";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B0818",
  },

  // ── Header ──
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    paddingHorizontal: 32,
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
  },
  appTitle: {
    fontSize: 36,
  },
  appName: {
    fontSize: 32,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -1,
    textShadowColor: "rgba(107, 78, 255, 0.5)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 12,
  },

  // ── Dots ──
  dotsContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  dot: {
    height: 8,
    width: 8,
    borderRadius: 4,
  },
  dotActive: {
    backgroundColor: "#FFFFFF",
    width: 24,
  },
  dotInactive: {
    backgroundColor: "rgba(255,255,255,0.4)",
  },
});
