import { Platform, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator, BottomTabBarProps } from "@react-navigation/bottom-tabs";

import SignUpScreen      from "../screens/SignUpScreen";
import SignInScreen      from "../screens/SignInScreen";
import ConverterScreen   from "../screens/ConverterScreen";
import GraphScreen       from "../screens/GraphScreen";
import ProfileScreen     from "../screens/ProfileScreen";
import DetailScreen      from "../screens/DetailScreen";
import OnboardingScreen  from "../screens/OnboardingScreen";
import { useApp }        from "../context/AppContext";
import { T }             from "../i18n/translations";

// ─── Types ────────────────────────────────────────────────────────────────────

export type RootStackParamList = {
  Onboarding: undefined;
  SignUp:     undefined;
  SignIn:     undefined;
  Main:       undefined;
  Detail:     { code: string; name: string };
};

export type TabParamList = {
  Converter: undefined;
  Graph:     undefined;
  Profile:   undefined;
};

// ─── Constantes ───────────────────────────────────────────────────────────────

export const SIDEBAR_EXPANDED  = 220;
export const SIDEBAR_COLLAPSED = 64;
const BREAKPOINT = 768;

const ICONS: Record<string, string> = {
  Converter: "💱",
  Graph:     "📈",
  Profile:   "👤",
};

// ─── Smart Tab Bar ─────────────────────────────────────────────────────────────

function SmartTabBar({ state, navigation }: BottomTabBarProps) {
  const { theme, lang, darkMode, sidebarCollapsed, setSidebarCollapsed } = useApp();
  const { width }  = useWindowDimensions();
  const isDesktop  = Platform.OS === "web" && width >= BREAKPOINT;
  const t          = T[lang];

  const labels: Record<string, string> = {
    Converter: t.navHome,
    Graph:     t.navChart,
    Profile:   t.navProfile,
  };

  // ── Sidebar desktop ────────────────────────────────────────────────────────
  if (isDesktop) {
    const W = sidebarCollapsed ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED;

    return (
      <View style={[
        sb.container,
        {
          width:            W,
          backgroundColor:  theme.card,
          borderRightColor: theme.border,
        },
      ]}>
        {/* ── Header : logo + bouton collapse ── */}
        <View style={[sb.headerRow, sidebarCollapsed && sb.headerRowCollapsed]}>
          {!sidebarCollapsed && (
            <View style={sb.logoRow}>
              <View style={[sb.logoIcon, { backgroundColor: theme.primary + "22" }]}>
                <Text style={{ fontSize: 18 }}>💱</Text>
              </View>
              <Text style={[sb.logoLabel, { color: theme.text }]}>DeviseX</Text>
            </View>
          )}
          <TouchableOpacity
            style={[sb.collapseBtn, { backgroundColor: theme.input }]}
            onPress={() => setSidebarCollapsed(!sidebarCollapsed)}
            activeOpacity={0.7}
          >
            <Text style={[sb.collapseIcon, { color: theme.muted }]}>
              {sidebarCollapsed ? "›" : "‹"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── Nav items ── */}
        <View style={sb.navList}>
          {state.routes.map((route, i) => {
            const focused = state.index === i;
            const label   = labels[route.name] ?? route.name;
            const icon    = ICONS[route.name] ?? "●";

            return (
              <TouchableOpacity
                key={route.key}
                style={[
                  sb.navItem,
                  sidebarCollapsed && sb.navItemCollapsed,
                  focused && { backgroundColor: theme.primary + "18" },
                ]}
                onPress={() => navigation.navigate(route.name)}
                activeOpacity={0.75}
              >
                <View style={[
                  sb.navIcon,
                  focused && { backgroundColor: theme.primary + "28" },
                ]}>
                  <Text style={{ fontSize: 18 }}>{icon}</Text>
                </View>

                {!sidebarCollapsed && (
                  <Text style={[
                    sb.navLabel,
                    { color: focused ? theme.primary : theme.muted },
                    focused && { fontWeight: "700" },
                  ]}>
                    {label}
                  </Text>
                )}

                {/* Point actif — visible même en mode réduit */}
                {focused && !sidebarCollapsed && (
                  <View style={[sb.activePip, { backgroundColor: theme.primary }]} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Footer ── */}
        {!sidebarCollapsed && (
          <View style={[sb.footer, { borderTopColor: theme.border }]}>
            <Text style={[sb.footerText, { color: theme.muted }]}>
              {darkMode ? "🌙" : "☀️"}  v1.0.0
            </Text>
          </View>
        )}
      </View>
    );
  }

  // ── Bottom bar mobile ──────────────────────────────────────────────────────
  return (
    <View style={[
      bb.container,
      {
        backgroundColor: theme.card,
        borderTopColor:  theme.border,
        height:          Platform.OS === "ios" ? 82 : 62,
        paddingBottom:   Platform.OS === "ios" ? 24 : 8,
        ...Platform.select({
          ios:     { shadowColor:"#000", shadowOffset:{width:0,height:-2}, shadowOpacity:0.06, shadowRadius:8 },
          android: { elevation:8 },
          default: {},
        }),
      },
    ]}>
      {state.routes.map((route, i) => {
        const focused = state.index === i;
        return (
          <TouchableOpacity
            key={route.key}
            style={bb.item}
            onPress={() => navigation.navigate(route.name)}
            activeOpacity={0.7}
          >
            <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.4 }}>
              {ICONS[route.name] ?? "●"}
            </Text>
            <Text style={[
              bb.label,
              { color: focused ? theme.primary : theme.muted },
              focused && { fontWeight: "700" },
            ]}>
              {labels[route.name] ?? route.name}
            </Text>
            {focused && <View style={[bb.dot, { backgroundColor: theme.primary }]} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ─── Main Tabs ────────────────────────────────────────────────────────────────

const Tab = createBottomTabNavigator<TabParamList>();

function MainTabs() {
  const { width }          = useWindowDimensions();
  const { sidebarCollapsed } = useApp();
  const isDesktop          = Platform.OS === "web" && width >= BREAKPOINT;

  const sidebarW = sidebarCollapsed ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED;

  return (
    <Tab.Navigator
      tabBar={(props) => <SmartTabBar {...props} />}
      // @ts-ignore — sceneStyle est valide en React Navigation v7
      sceneStyle={isDesktop ? { marginLeft: sidebarW } : undefined}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Converter" component={ConverterScreen} />
      <Tab.Screen name="Graph"     component={GraphScreen} />
      <Tab.Screen name="Profile"   component={ProfileScreen} />
    </Tab.Navigator>
  );
}

// ─── Root Stack ───────────────────────────────────────────────────────────────

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const { hasOnboarded } = useApp();

  return (
    // Si l'utilisateur n'a pas fait l'onboarding, on démarre dessus.
    // Sinon on va directement sur Main (mode invité).
    <Stack.Navigator
      initialRouteName={hasOnboarded ? "Main" : "Onboarding"}
      screenOptions={{ headerShown: false, animation: "slide_from_right" }}
    >
      {!hasOnboarded && (
        <Stack.Screen
          name="Onboarding"
          component={OnboardingScreen}
          options={{ animation: "fade" }}
        />
      )}
      <Stack.Screen name="Main"    component={MainTabs} />
      <Stack.Screen name="Detail"  component={DetailScreen} />
      <Stack.Screen name="SignIn"  component={SignInScreen} />
      <Stack.Screen name="SignUp"  component={SignUpScreen} />
    </Stack.Navigator>
  );
}

// ─── Styles — Sidebar ─────────────────────────────────────────────────────────

const sb = StyleSheet.create({
  container: {
    position:         "absolute",
    top:              0,
    left:             0,
    bottom:           0,
    borderRightWidth: 1,
    paddingTop:       20,
    zIndex:           100,
    // Transition douce sur web
    ...(Platform.OS === "web" ? ({ transition: "width 0.2s ease" } as any) : {}),
  },

  // Header (logo + bouton collapse)
  headerRow: {
    flexDirection:     "row",
    alignItems:        "center",
    justifyContent:    "space-between",
    paddingHorizontal: 12,
    paddingBottom:     20,
  },
  headerRowCollapsed: {
    justifyContent: "center",
  },
  logoRow: {
    flexDirection: "row",
    alignItems:    "center",
    gap:           10,
    flex:          1,
  },
  logoIcon:  { width:36, height:36, borderRadius:10, alignItems:"center", justifyContent:"center" },
  logoLabel: { fontSize:17, fontWeight:"800" },

  // Bouton collapse ‹ / ›
  collapseBtn: {
    width:          28,
    height:         28,
    borderRadius:   8,
    alignItems:     "center",
    justifyContent: "center",
    flexShrink:     0,
  },
  collapseIcon: { fontSize:16, fontWeight:"700", lineHeight:20 },

  // Nav
  navList: { flex:1, paddingHorizontal:8, gap:4 },
  navItem: {
    flexDirection:     "row",
    alignItems:        "center",
    gap:               10,
    borderRadius:      12,
    paddingVertical:   10,
    paddingHorizontal: 10,
    position:          "relative",
  },
  navItemCollapsed: {
    justifyContent: "center",
    paddingHorizontal: 0,
  },
  navIcon:   { width:36, height:36, borderRadius:10, alignItems:"center", justifyContent:"center", flexShrink:0 },
  navLabel:  { fontSize:14, fontWeight:"500", flex:1 },
  activePip: { position:"absolute", right:10, width:6, height:6, borderRadius:3 },

  // Footer
  footer:     { borderTopWidth:1, paddingHorizontal:16, paddingVertical:12 },
  footerText: { fontSize:11 },
});

// ─── Styles — Bottom bar ──────────────────────────────────────────────────────

const bb = StyleSheet.create({
  container: { flexDirection:"row", borderTopWidth:1, paddingTop:8 },
  item:      { flex:1, alignItems:"center", justifyContent:"center", gap:3 },
  label:     { fontSize:11 },
  dot:       { position:"absolute", bottom:0, width:4, height:4, borderRadius:2 },
});
