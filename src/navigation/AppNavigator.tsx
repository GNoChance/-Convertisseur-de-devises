import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator }   from "@react-navigation/bottom-tabs";
import { Text, View, Platform }       from "react-native";

import SignUpScreen    from "../screens/SignUpScreen";
import SignInScreen    from "../screens/SignInScreen";
import ConverterScreen from "../screens/ConverterScreen";
import ProfileScreen   from "../screens/ProfileScreen";
import { useApp }      from "../context/AppContext";
import { T }           from "../i18n/translations";

// ─── Param lists ──────────────────────────────────────────────────────────────

export type RootStackParamList = {
  SignUp: undefined;
  SignIn: undefined;
  Main:   undefined;
};

export type TabParamList = {
  Converter: undefined;
  Profile:   undefined;
};

// ─── Tab icons ────────────────────────────────────────────────────────────────

function TabIcon({ name, focused, color }: { name: string; focused: boolean; color: string }) {
  const icons: Record<string, { active: string; inactive: string }> = {
    Converter: { active: "💱", inactive: "💱" },
    Profile:   { active: "👤", inactive: "👤" },
  };
  return (
    <View style={{ alignItems: "center", justifyContent: "center" }}>
      <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.45 }}>{icons[name]?.active ?? "●"}</Text>
      {focused && (
        <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: color, marginTop: 3 }} />
      )}
    </View>
  );
}

// ─── Tab navigator ────────────────────────────────────────────────────────────

const Tab = createBottomTabNavigator<TabParamList>();

function MainTabs() {
  const { theme, lang } = useApp();
  const t = T[lang];

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.muted,
        tabBarStyle: {
          backgroundColor: theme.card,
          borderTopColor:  theme.border,
          borderTopWidth:  1,
          height:          Platform.OS === "ios" ? 82 : 62,
          paddingBottom:   Platform.OS === "ios" ? 24 : 8,
          paddingTop:      8,
          ...Platform.select({
            ios:     { shadowColor: "#000", shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.06, shadowRadius: 8 },
            android: { elevation: 8 },
            default: {},
          }),
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          marginTop: 2,
        },
        tabBarIcon: ({ focused, color }) => (
          <TabIcon name={route.name} focused={focused} color={color} />
        ),
      })}
    >
      <Tab.Screen
        name="Converter"
        component={ConverterScreen}
        options={{ tabBarLabel: lang === "fr" ? "Accueil" : "Home" }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarLabel: lang === "fr" ? "Profil" : "Profile" }}
      />
    </Tab.Navigator>
  );
}

// ─── Root stack ───────────────────────────────────────────────────────────────

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="SignUp"
      screenOptions={{ headerShown: false, animation: "slide_from_right" }}
    >
      <Stack.Screen name="SignUp" component={SignUpScreen} />
      <Stack.Screen name="SignIn" component={SignInScreen} />
      <Stack.Screen name="Main"   component={MainTabs} />
    </Stack.Navigator>
  );
}
