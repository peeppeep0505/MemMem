import React, { createContext, useContext, useMemo, useState } from "react";
import { Colors, type ThemeMode } from "@/constants/theme";

type ThemeContextType = {
  mode: ThemeMode;
  theme: (typeof Colors)["light"];
  toggleTheme: () => void;
  setThemeMode: (mode: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>("light");

  const toggleTheme = () => {
    setMode((prev) => (prev === "light" ? "dark" : "light"));
  };

  const value = useMemo(
    () => ({
      mode,
      theme: Colors[mode],
      toggleTheme,
      setThemeMode: setMode,
    }),
    [mode]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useAppTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useAppTheme must be used inside ThemeProvider");
  }

  return context;
}