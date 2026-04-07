import { createContext, useContext, useState, ReactNode } from "react";
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

interface AppContextValue {
  lang:       Lang;
  setLang:    (l: Lang) => void;
  darkMode:   boolean;
  setDarkMode:(v: boolean) => void;
  theme:      Theme;
  username:   string;
  setUsername:(name: string) => void;
}

const AppContext = createContext<AppContextValue>({} as AppContextValue);

export function AppProvider({ children }: { children: ReactNode }) {
  const [lang,     setLang]     = useState<Lang>("fr");
  const [darkMode, setDarkMode] = useState(false);
  const [username, setUsername] = useState("");
  const theme = darkMode ? DARK : LIGHT;

  return (
    <AppContext.Provider value={{ lang, setLang, darkMode, setDarkMode, theme, username, setUsername }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
