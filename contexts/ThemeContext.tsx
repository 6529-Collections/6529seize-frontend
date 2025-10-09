"use client";

import { THEME_PREFERENCE_COOKIE } from "@/constants";
import Cookies from "js-cookie";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type ThemePreference = "dark" | "light";

interface ThemeContextValue {
  readonly theme: ThemePreference;
  readonly setTheme: (theme: ThemePreference) => void;
  readonly toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const DEFAULT_THEME: ThemePreference = "dark";
const THEME_COOKIE_EXPIRATION_DAYS = 365;

function readInitialTheme(): ThemePreference {
  if (typeof document === "undefined") {
    return DEFAULT_THEME;
  }

  if (document.body.classList.contains("theme-light")) {
    return "light";
  }

  return DEFAULT_THEME;
}

export function ThemeProvider({
  children,
}: {
  readonly children: React.ReactNode;
}): React.ReactElement {
  const [theme, setThemeState] = useState<ThemePreference>(readInitialTheme);

  useEffect(() => {
    const cookieTheme = Cookies.get(THEME_PREFERENCE_COOKIE);
    if (cookieTheme === "light" || cookieTheme === "dark") {
      setThemeState(cookieTheme);
    }
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const root = document.documentElement;
    const body = document.body;

    if (theme === "dark") {
      root.classList.add("dark");
      body.classList.remove("theme-light");
      body.classList.add("theme-dark");
      body.dataset.theme = "dark";
    } else {
      root.classList.remove("dark");
      body.classList.add("theme-light");
      body.classList.remove("theme-dark");
      body.dataset.theme = "light";
    }

    Cookies.set(THEME_PREFERENCE_COOKIE, theme, {
      expires: THEME_COOKIE_EXPIRATION_DAYS,
      sameSite: "lax",
    });
  }, [theme]);

  const setTheme = useCallback((value: ThemePreference) => {
    setThemeState(value);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((previous) => (previous === "dark" ? "light" : "dark"));
  }, []);

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      toggleTheme,
    }),
    [theme, setTheme, toggleTheme]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
