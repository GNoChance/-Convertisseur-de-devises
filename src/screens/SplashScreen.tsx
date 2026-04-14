import { useEffect, useRef } from "react";
import { Animated, Platform, StyleSheet, Text, View } from "react-native";

interface Props {
  onFinish: () => void;
}

export default function AppSplash({ onFinish }: Props) {
  // ── Valeurs animées ──────────────────────────────────────────────────────────
  const screenOpacity = useRef(new Animated.Value(1)).current;
  const logoScale     = useRef(new Animated.Value(0.3)).current;
  const logoOpacity   = useRef(new Animated.Value(0)).current;
  const ringScale     = useRef(new Animated.Value(0.6)).current;
  const ringOpacity   = useRef(new Animated.Value(0)).current;
  const textOpacity   = useRef(new Animated.Value(0)).current;
  const tagOpacity    = useRef(new Animated.Value(0)).current;
  const barProgress   = useRef(new Animated.Value(0)).current;
  const pulseScale    = useRef(new Animated.Value(1)).current;
  const dotOpacity    = [
    useRef(new Animated.Value(0.3)).current,
    useRef(new Animated.Value(0.3)).current,
    useRef(new Animated.Value(0.3)).current,
  ];

  useEffect(() => {
    // ── Animation pulse en boucle ──────────────────────────────────────────
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseScale, { toValue: 1.12, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseScale, { toValue: 1,    duration: 900, useNativeDriver: true }),
      ])
    ).start();

    // ── Animation des points ───────────────────────────────────────────────
    const animateDots = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(dotOpacity[0], { toValue: 1,   duration: 250, useNativeDriver: true }),
          Animated.timing(dotOpacity[1], { toValue: 1,   duration: 250, useNativeDriver: true }),
          Animated.timing(dotOpacity[2], { toValue: 1,   duration: 250, useNativeDriver: true }),
          Animated.delay(300),
          Animated.parallel([
            Animated.timing(dotOpacity[0], { toValue: 0.3, duration: 200, useNativeDriver: true }),
            Animated.timing(dotOpacity[1], { toValue: 0.3, duration: 200, useNativeDriver: true }),
            Animated.timing(dotOpacity[2], { toValue: 0.3, duration: 200, useNativeDriver: true }),
          ]),
        ])
      ).start();
    };

    // ── Séquence principale ────────────────────────────────────────────────
    Animated.sequence([
      Animated.delay(100),

      // 1) Anneau + logo apparaissent ensemble
      Animated.parallel([
        Animated.spring(logoScale,   { toValue: 1, friction: 6, tension: 80, useNativeDriver: true }),
        Animated.timing(logoOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.spring(ringScale,   { toValue: 1, friction: 5, tension: 60, useNativeDriver: true }),
        Animated.timing(ringOpacity, { toValue: 0.3, duration: 600, useNativeDriver: true }),
      ]),

      Animated.delay(150),

      // 2) Nom de l'app
      Animated.timing(textOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),

      // 3) Tagline
      Animated.timing(tagOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),

      Animated.delay(100),

      // 4) Barre de chargement (utilise useNativeDriver: false car width)
      Animated.timing(barProgress, { toValue: 1, duration: 1400, useNativeDriver: false }),

      Animated.delay(300),

      // 5) Fondu sortant
      Animated.timing(screenOpacity, { toValue: 0, duration: 450, useNativeDriver: true }),

    ]).start(() => onFinish());

    animateDots();
  }, []);

  const barWidth = barProgress.interpolate({
    inputRange:  [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <Animated.View style={[s.container, { opacity: screenOpacity }]}>

      {/* ── Cercles de fond décoratifs ── */}
      <View style={s.bgCircle1} />
      <View style={s.bgCircle2} />

      {/* ── Centre ── */}
      <View style={s.center}>

        {/* Anneau pulse */}
        <Animated.View style={[
          s.ring,
          {
            opacity: ringOpacity,
            transform: [{ scale: Animated.multiply(ringScale, pulseScale) }],
          },
        ]} />

        {/* Cercle logo */}
        <Animated.View style={[
          s.logoCircle,
          {
            opacity:   logoOpacity,
            transform: [{ scale: logoScale }],
          },
        ]}>
          <Text style={s.logoEmoji}>💱</Text>
        </Animated.View>

        {/* Nom */}
        <Animated.Text style={[s.appName, { opacity: textOpacity }]}>
          DeviseX
        </Animated.Text>

        {/* Tagline */}
        <Animated.Text style={[s.tagline, { opacity: tagOpacity }]}>
          Convertisseur de devises
        </Animated.Text>

        {/* Dots animés */}
        <Animated.View style={[s.dotsRow, { opacity: tagOpacity }]}>
          {dotOpacity.map((op, i) => (
            <Animated.View
              key={i}
              style={[s.dot, { opacity: op }]}
            />
          ))}
        </Animated.View>
      </View>

      {/* ── Barre de progression bas ── */}
      <View style={s.barArea}>
        <View style={s.barTrack}>
          <Animated.View style={[s.barFill, { width: barWidth }]} />
        </View>
        <Text style={s.barLabel}>Chargement en cours…</Text>
      </View>

    </Animated.View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const PRIMARY  = "#6B4EFF";
const BG       = "#0B0818";
const BG2      = "#120D2A";

const s = StyleSheet.create({
  container: {
    flex:            1,
    backgroundColor: BG,
    alignItems:      "center",
    justifyContent:  "center",
    position:        "relative",
    overflow:        "hidden",
    // Sur web, plein écran
    ...(Platform.OS === "web" ? { minHeight: "100vh" as any } : {}),
  },

  // ── Cercles décoratifs fond ──
  bgCircle1: {
    position:        "absolute",
    top:             -120,
    right:           -80,
    width:           300,
    height:          300,
    borderRadius:    150,
    backgroundColor: PRIMARY + "18",
  },
  bgCircle2: {
    position:        "absolute",
    bottom:          -100,
    left:            -60,
    width:           240,
    height:          240,
    borderRadius:    120,
    backgroundColor: PRIMARY + "10",
  },

  // ── Logo ──
  center: {
    alignItems: "center",
    flex:       1,
    justifyContent: "center",
    paddingBottom:  60,
  },

  ring: {
    position:        "absolute",
    width:           160,
    height:          160,
    borderRadius:    80,
    borderWidth:     2,
    borderColor:     PRIMARY,
    backgroundColor: "transparent",
  },

  logoCircle: {
    width:           120,
    height:          120,
    borderRadius:    36,
    backgroundColor: PRIMARY,
    alignItems:      "center",
    justifyContent:  "center",
    marginBottom:    28,
    ...Platform.select({
      ios:     { shadowColor: PRIMARY, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.6, shadowRadius: 24 },
      android: { elevation: 12 },
      default: { boxShadow: `0 8px 40px ${PRIMARY}80` } as any,
    }),
  },
  logoEmoji: { fontSize: 52 },

  appName: {
    fontSize:    42,
    fontWeight:  "800",
    color:       "#FFFFFF",
    letterSpacing: -1,
    marginBottom:  8,
  },

  tagline: {
    fontSize:    15,
    color:       "#FFFFFF80",
    fontWeight:  "500",
    letterSpacing: 0.5,
    marginBottom:  20,
  },

  dotsRow: {
    flexDirection: "row",
    gap:           8,
    marginTop:     4,
  },
  dot: {
    width:           8,
    height:          8,
    borderRadius:    4,
    backgroundColor: PRIMARY,
  },

  // ── Barre de progression ──
  barArea: {
    position:         "absolute",
    bottom:           48,
    left:             40,
    right:            40,
    alignItems:       "center",
    gap:              10,
  },
  barTrack: {
    width:           "100%",
    height:          4,
    borderRadius:    2,
    backgroundColor: "#FFFFFF15",
    overflow:        "hidden",
  },
  barFill: {
    height:          4,
    borderRadius:    2,
    backgroundColor: PRIMARY,
  },
  barLabel: {
    fontSize:    12,
    color:       "#FFFFFF40",
    fontWeight:  "500",
    letterSpacing: 0.3,
  },
});
