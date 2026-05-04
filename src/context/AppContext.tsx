import { createContext, useContext, useState, ReactNode } from "react";
import { Platform } from "react-native";
import { Lang } from "../i18n/translations";

export const LIGHT = {
  primary: "#6B4EFF",
  bg:      "#F5F5FA",
  card:    "#FFFFFF",
  text:    "#1C1C1E",
  muted:   "#8E8E93",
  border:  "#E5E5EA",
  input:   "#F5F5FA",
};

export const DARK = {
  primary: "#7B61FF",
  bg:      "#0F0F14",
  card:    "#1C1C28",
  text:    "#F5F5FA",
  muted:   "#8E8E93",
  border:  "#2C2C3A",
  input:   "#2C2C3A",
};

export type Theme = typeof LIGHT;

// ─── Persistance web via localStorage ────────────────────────────────────────

function loadLS<T>(key: string, fallback: T): T {
  if (Platform.OS !== "web") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw !== null ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function saveLS<T>(key: string, value: T): void {
  if (Platform.OS !== "web") return;
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface AppContextValue {
  lang:          Lang;
  setLang:       (l: Lang) => void;
  darkMode:      boolean;
  setDarkMode:   (v: boolean) => void;
  theme:         Theme;
  username:      string;
  setUsername:   (name: string) => void;
  selectedFrom:  string;
  selectedTo:    string;
  setSelectedPair: (from: string, to: string) => void;
  // Watchlist
  watchlist:           string[];
  addToWatchlist:      (code: string) => void;
  removeFromWatchlist: (code: string) => void;
  isInWatchlist:       (code: string) => boolean;
  // Notifications
  notificationsEnabled:    boolean;
  setNotificationsEnabled: (v: boolean) => void;
  // Sidebar
  sidebarCollapsed:    boolean;
  setSidebarCollapsed: (v: boolean) => void;
  // Auth
  isLoggedIn:       boolean;
  currentUserEmail: string;
  login:            (email: string, name: string) => void;
  logout:           () => void;
  // Onboarding
  hasOnboarded:    boolean;
  setHasOnboarded: (v: boolean) => void;
}

const AppContext = createContext<AppContextValue>({} as AppContextValue);

export function AppProvider({ children }: { children: ReactNode }) {
  const [lang,         setLang]         = useState<Lang>("fr");
  const [darkMode,     setDarkMode]     = useState(false);
  const [username,     setUsername]     = useState("");
  const [selectedFrom, setSelectedFrom] = useState("EUR");
  const [selectedTo,   setSelectedTo]   = useState("USD");

  const [watchlist, setWatchlist] = useState<string[]>(() =>
    loadLS<string[]>("wl", ["USD", "GBP", "JPY"])
  );

  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(() =>
    loadLS<boolean>("notif", true)
  );

  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() =>
    loadLS<boolean>("sidebarCollapsed", false)
  );

  // ── Onboarding ──────────────────────────────────────────────────────────────
  const [hasOnboarded, _setHasOnboarded] = useState<boolean>(() =>
    loadLS<boolean>("dx_onboarded", false)
  );
  const setHasOnboarded = (v: boolean) => {
    _setHasOnboarded(v);
    saveLS("dx_onboarded", v);
  };

  // ── Auth ────────────────────────────────────────────────────────────────────
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() =>
    loadLS<boolean>("dx_logged_in", false)
  );
  const [currentUserEmail, setCurrentUserEmail] = useState<string>(() =>
    loadLS<string>("dx_current_email", "")
  );

  const theme = darkMode ? DARK : LIGHT;

  const setSelectedPair = (from: string, to: string) => {
    setSelectedFrom(from);
    setSelectedTo(to);
  };

  const addToWatchlist = (code: string) => {
    setWatchlist((prev) => {
      if (prev.includes(code)) return prev;
      const next = [...prev, code];
      saveLS("wl", next);
      return next;
    });
  };

  const removeFromWatchlist = (code: string) => {
    setWatchlist((prev) => {
      const next = prev.filter((c) => c !== code);
      saveLS("wl", next);
      return next;
    });
  };

  const isInWatchlist = (code: string) => watchlist.includes(code);

  const login = (email: string, name: string) => {
    setIsLoggedIn(true);
    setCurrentUserEmail(email);
    setUsername(name);
    saveLS("dx_logged_in", true);
    saveLS("dx_current_email", email);
  };

  const logout = () => {
    setIsLoggedIn(false);
    setCurrentUserEmail("");
    setUsername("");
    saveLS("dx_logged_in", false);
    saveLS("dx_current_email", "");
  };

  return (
    <AppContext.Provider value={{
      lang, setLang,
      darkMode, setDarkMode,
      theme,
      username, setUsername,
      selectedFrom, selectedTo, setSelectedPair,
      watchlist, addToWatchlist, removeFromWatchlist, isInWatchlist,
      notificationsEnabled, setNotificationsEnabled,
      sidebarCollapsed, setSidebarCollapsed,
      isLoggedIn, currentUserEmail, login, logout,
      hasOnboarded, setHasOnboarded,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
