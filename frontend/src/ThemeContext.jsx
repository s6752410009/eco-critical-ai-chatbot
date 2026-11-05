import React, { createContext, useContext, useEffect } from "react";
import { useTheme } from "./hooks/useTheme";
import { paletteStore } from "./palettes";

const ThemeContext = createContext();

export function ThemeProvider({ children, publicDemo = false }) {
  const themeValue = useTheme();

  useEffect(() => {
    if (!publicDemo) paletteStore.refresh();
  }, [publicDemo]);

  return (
    <ThemeContext.Provider value={themeValue}>{children}</ThemeContext.Provider>
  );
}

export function useThemeContext() {
  return useContext(ThemeContext);
}
