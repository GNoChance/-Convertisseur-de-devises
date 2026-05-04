import { useEffect, useRef } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
  ImageSourcePropType,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const SLIDE_ITEM_WIDTH = Dimensions.get("screen").width;

// ─── Types ────────────────────────────────────────────────────────────────────

interface SlideItemProps {
  isActive: boolean;
  backgroundImage: ImageSourcePropType;
  title: string;
  body: string;
  submitLabel?: string;
  isSubmitting?: boolean;
  onSubmit?: () => Promise<void>;
}

// ─── Composant ────────────────────────────────────────────────────────────────

export default function SlideItem({
  isActive,
  backgroundImage,
  title,
  body,
  submitLabel,
  isSubmitting,
  onSubmit,
}: SlideItemProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: isActive ? 1 : 0,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, [isActive]);

  return (
    <View style={[styles.container, { width: SLIDE_ITEM_WIDTH }]}>
      {/* ── Image de fond avec fade ── */}
      <Animated.View style={[styles.imageWrapper, { opacity: fadeAnim }]}>
        <Image source={backgroundImage} style={styles.image} />
        {/* Overlay gradient sombre */}
        <View style={styles.overlay} />
      </Animated.View>

      {/* ── Contenu texte en bas ── */}
      <View style={styles.content}>
        <View>
          <Text style={styles.title} numberOfLines={1} adjustsFontSizeToFit>
            {title}
          </Text>
          <Text style={styles.body} numberOfLines={2} adjustsFontSizeToFit>
            {body}
          </Text>
        </View>

        {/* ── Bouton d'action (dernier slide uniquement) ── */}
        {onSubmit && submitLabel ? (
          <TouchableOpacity
            onPress={onSubmit}
            activeOpacity={0.8}
            style={styles.cta}
          >
            <Text style={styles.ctaLabel}>{submitLabel}</Text>
            {isSubmitting && <ActivityIndicator color="white" />}
          </TouchableOpacity>
        ) : (
          <View style={{ height: 50 }} />
        )}
      </View>
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

  imageWrapper: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(11, 8, 24, 0.45)",
  },

  content: {
    flex: 1,
    justifyContent: "flex-end",
    paddingBottom: 80,
    paddingHorizontal: 32,
    gap: 20,
  },

  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  body: {
    fontSize: 18,
    fontWeight: "500",
    color: "rgba(255,255,255,0.75)",
    lineHeight: 26,
  },

  cta: {
    backgroundColor: PRIMARY,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: "row",
    gap: 8,
    ...Platform.select({
      ios: {
        shadowColor: PRIMARY,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.5,
        shadowRadius: 16,
      },
      android: { elevation: 8 },
      default: {},
    }),
  },
  ctaLabel: {
    fontWeight: "700",
    color: "white",
    fontSize: 17,
    letterSpacing: 0.3,
  },
});
