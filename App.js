import React, { useState } from 'react';
import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from "expo-status-bar";
import HomeScreen from './HomeScreen';
import RegistrationScreen from './RegistrationScreen';
import Dashboard from './Dashboard/Dashboard';
import ForgetPass from "./ForgetPass";
import ResetPass from "./ResetPass";
import ProfileCompletition from './ProfileCompletition';    
import CameraScreen from './CameraScreen';
import WelcomeScreen from "./WelcomeScreen";
import { AppThemeProvider, useAppTheme } from "./ThemeContext";
import { AlertProvider } from "./AlertContext";
import { APP_BASE_URL } from "./apiConfig";

const Stack = createNativeStackNavigator();

function AppNavigator() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const { colors, isDark } = useAppTheme();

  const navigationTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      primary: colors.primary,
      background: colors.background,
      card: colors.surface,
      text: colors.text,
      border: colors.border,
      notification: colors.primary,
    },
  };

  // ---- Deeplink konfigurácia ----
  const linking = {
    prefixes: APP_BASE_URL ? [APP_BASE_URL] : [],
    config: {
      screens: {
        ResetPass: "reset-password",
        // Tu môžeš pridať ďalšie deeplinky, ak chceš
      },
    },
  };

  return (
    <NavigationContainer linking={linking} fallback={<></>} theme={navigationTheme}>
      <StatusBar style={isDark ? "light" : "dark"} backgroundColor={colors.background} />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="WelcomeScreen" component={WelcomeScreen}/>
        <Stack.Screen name="HomeScreen">
          {(props) => <HomeScreen {...props} setIsLoggedIn={setIsLoggedIn} />}
        </Stack.Screen>
        <Stack.Screen name="RegistrationScreen" component={RegistrationScreen} />
        <Stack.Screen
          name="Dashboard"
          options={{
            gestureEnabled: false,
          }}
        >
          {(props) => <Dashboard {...props} setIsLoggedIn={setIsLoggedIn} />}
        </Stack.Screen>
        <Stack.Screen name="CameraScreen" component={CameraScreen}></Stack.Screen>
        <Stack.Screen name="ForgetPass" component={ForgetPass} />
        <Stack.Screen name="ResetPass" component={ResetPass} />
        <Stack.Screen name="ProfileCompletition">
          {(props) => (
            <ProfileCompletition {...props} setIsLoggedIn={setIsLoggedIn} />
          )}
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AppThemeProvider>
      <AlertProvider>
        <AppNavigator />
      </AlertProvider>
    </AppThemeProvider>
  );
}
