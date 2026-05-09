import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const THEME_STORAGE_KEY = "themePreference";

export const THEME_OPTIONS = [
  {
    key: "system",
    label: "Systémový",
    description: "Podľa nastavenia telefónu",
  },
  {
    key: "light",
    label: "Svetlý",
    description: "Jasné pozadie",
  },
  {
    key: "dark",
    label: "Tmavý",
    description: "Šetrnejší večer",
  },
];

const lightColors = {
  primary: "hsla(129, 56%, 43%, 1)",
  primaryPressed: "hsla(129, 56%, 43%, 0.8)",
  primarySoft: "rgba(129, 190, 95, 0.10)",
  background: "#edf7ef",
  dashboardBackground: "hsl(0, 0%, 95%)",
  authBackground: "#edf7ef",
  surface: "#ffffff",
  surfaceAlt: "#f8fafc",
  surfacePressed: "#e6f5e9",
  text: "#111827",
  textSoft: "#374151",
  mutedText: "#6b7280",
  subtleText: "#9ca3af",
  border: "#e5e7eb",
  inputBackground: "#fbfdfb",
  inputBorder: "#d1d5db",
  tabBackground: "hsl(0, 0%, 95%)",
  tabActiveBackground: "#ffffff",
  danger: "hsla(0, 73%, 60%, 0.96)",
  dangerSoft: "rgba(220, 53, 69, 0.06)",
  dangerPressed: "rgba(220, 53, 69, 0.12)",
  overlay: "rgba(0,0,0,0.4)",
  icon: "#111827",
  logoTile: "#ffffff",
  shadow: "#000000",
  placeholder: "rgba(0, 0, 0, 0.35)",
};

const darkColors = {
  primary: "hsla(129, 56%, 48%, 1)",
  primaryPressed: "hsla(129, 56%, 39%, 1)",
  primarySoft: "rgba(74, 222, 128, 0.14)",
  background: "#0f1712",
  dashboardBackground: "#0f1712",
  authBackground: "#0f1712",
  surface: "#17221b",
  surfaceAlt: "#1f2c24",
  surfacePressed: "#233529",
  text: "#f8fafc",
  textSoft: "#d1d5db",
  mutedText: "#a7b0b8",
  subtleText: "#7f8b94",
  border: "#2c3a31",
  inputBackground: "#101a14",
  inputBorder: "#31443a",
  tabBackground: "#141f18",
  tabActiveBackground: "#1f2c24",
  danger: "#f87171",
  dangerSoft: "rgba(248, 113, 113, 0.12)",
  dangerPressed: "rgba(248, 113, 113, 0.20)",
  overlay: "rgba(0,0,0,0.62)",
  icon: "#f8fafc",
  logoTile: "#ffffff",
  shadow: "#000000",
  placeholder: "rgba(248, 250, 252, 0.42)",
};

const ThemeContext = createContext(null);

export function AppThemeProvider({ children }) {
  const systemScheme = useColorScheme();
  const [themePreference, setThemePreferenceState] = useState("system");
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let isMounted = true;

    AsyncStorage.getItem(THEME_STORAGE_KEY)
      .then((storedPreference) => {
        if (!isMounted) return;
        if (["system", "light", "dark"].includes(storedPreference)) {
          setThemePreferenceState(storedPreference);
        }
      })
      .finally(() => {
        if (isMounted) setIsLoaded(true);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const setThemePreference = async (nextPreference) => {
    if (!["system", "light", "dark"].includes(nextPreference)) return;
    setThemePreferenceState(nextPreference);
    await AsyncStorage.setItem(THEME_STORAGE_KEY, nextPreference);
  };

  const resolvedTheme =
    themePreference === "system"
      ? systemScheme === "dark"
        ? "dark"
        : "light"
      : themePreference;

  const isDark = resolvedTheme === "dark";
  const colors = isDark ? darkColors : lightColors;

  const navigationTheme = useMemo(
    () => ({
      dark: isDark,
      colors: {
        primary: colors.primary,
        background: colors.background,
        card: colors.surface,
        text: colors.text,
        border: colors.border,
        notification: colors.primary,
      },
      fonts: {},
    }),
    [colors, isDark],
  );

  const value = useMemo(
    () => ({
      colors,
      isDark,
      isLoaded,
      navigationTheme,
      resolvedTheme,
      setThemePreference,
      themePreference,
    }),
    [colors, isDark, isLoaded, navigationTheme, resolvedTheme, themePreference],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useAppTheme must be used inside AppThemeProvider");
  }
  return context;
}
