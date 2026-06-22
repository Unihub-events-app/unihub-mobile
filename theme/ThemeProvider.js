import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useColorScheme, useWindowDimensions } from "react-native";
import { getFlag, setFlag } from "../lib/storage";
import { defaultTheme, themeNames, themeStorageKey, themes } from "./tokens";

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const colorScheme = useColorScheme();
  const { width, height } = useWindowDimensions();
  const [themeMode, setThemeMode] = useState(defaultTheme);
  const [hydrated, setHydrated] = useState(false);
  const orientation = width > height ? "landscape" : "portrait";

  useEffect(() => {
    let alive = true;

    const hydrateTheme = async () => {
      const storedTheme = await getFlag(themeStorageKey);
      if (!alive) return;
      if (storedTheme && themeNames.includes(storedTheme)) {
        setThemeMode(storedTheme);
      }
      setHydrated(true);
    };

    hydrateTheme();

    return () => {
      alive = false;
    };
  }, []);

  const resolvedMode =
    themeMode === "system"
      ? colorScheme === "dark"
        ? "dark"
        : "light"
      : themeMode;

  const theme = themes[resolvedMode];

  const setPersistedThemeMode = async (nextMode) => {
    const mode = themeNames.includes(nextMode) ? nextMode : defaultTheme;
    setThemeMode(mode);
    await setFlag(themeStorageKey, mode);
  };

  const value = useMemo(
    () => ({
      themeMode,
      setThemeMode: setPersistedThemeMode,
      resolvedMode,
      orientation,
      theme,
      hydrated,
    }),
    [themeMode, resolvedMode, orientation, theme, hydrated]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
