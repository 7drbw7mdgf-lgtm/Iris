import { useState, useEffect, useCallback } from "react";
import { UserSettings, DEFAULT_SETTINGS } from "../../types";

export const SETTINGS_STORAGE_KEY = "iris_user_settings";

export function loadSavedSettings(): UserSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {}
  return DEFAULT_SETTINGS;
}

export function useAppSettings() {
  const [settings, setSettings] = useState<UserSettings>(loadSavedSettings);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [actionNotice, setActionNotice] = useState("");

  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const s = loadSavedSettings();
    if (s.shellTheme === "dark") return "dark";
    if (s.shellTheme === "system" && typeof window !== "undefined") {
      return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    }
    return "light";
  });

  const notify = useCallback((msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(""), 3500);
  }, []);

  const handleSaveSettings = (patch: Partial<UserSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      try {
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const handleResetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(DEFAULT_SETTINGS));
    } catch {}
  };

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    handleSaveSettings({ shellTheme: next });
  };

  useEffect(() => {
    if (settings.shellTheme === "system") {
      const isDark =
        typeof window !== "undefined" &&
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches;
      setTheme(isDark ? "dark" : "light");
    } else {
      setTheme(settings.shellTheme);
    }
  }, [settings.shellTheme]);

  useEffect(() => {
    if (settings.accentColor) {
      document.documentElement.style.setProperty("--accent", settings.accentColor);
    }
  }, [settings.accentColor]);

  return {
    settings,
    setSettings,
    settingsModalOpen,
    setSettingsModalOpen,
    theme,
    toggleTheme,
    actionNotice,
    notify,
    handleSaveSettings,
    handleResetSettings,
  };
}
