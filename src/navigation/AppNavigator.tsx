import { createNativeStackNavigator } from "@react-navigation/native-stack";
import SignUpScreen    from "../screens/SignUpScreen";
import SignInScreen    from "../screens/SignInScreen";
import ConverterScreen from "../screens/ConverterScreen";

// ─── Route params ─────────────────────────────────────────────────────────────
// Extend this type when you add new screens.

export type RootStackParamList = {
  SignUp:    undefined;
  SignIn:    undefined;
  Converter: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="SignUp"
      screenOptions={{ headerShown: false, animation: "slide_from_right" }}
    >
      <Stack.Screen name="SignUp"    component={SignUpScreen} />
      <Stack.Screen name="SignIn"    component={SignInScreen} />
      <Stack.Screen name="Converter" component={ConverterScreen} />
    </Stack.Navigator>
  );
}
