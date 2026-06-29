import React, { createContext, useContext, useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { updateUser } from "../features/users/userSlice";

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);

  const [theme, setThemeState] = useState(() => {
    return localStorage.getItem("theme") || "system";
  });

  const [accentColor, setAccentColorState] = useState(() => {
    return localStorage.getItem("accentColor") || "default";
  });

  const [soundEnabled, setSoundEnabledState] = useState(() => {
    const saved = localStorage.getItem("soundEnabled");
    return saved !== null ? saved === "true" : true;
  });

  // Sync state from logged-in user if available
  useEffect(() => {
    if (user) {
      if (user.themePreference && user.themePreference !== theme) {
        setThemeState(user.themePreference);
        localStorage.setItem("theme", user.themePreference);
      }
      if (user.accentColor && user.accentColor !== accentColor) {
        setAccentColorState(user.accentColor);
        localStorage.setItem("accentColor", user.accentColor);
      }
      if (user.soundEnabled !== undefined && user.soundEnabled !== soundEnabled) {
        setSoundEnabledState(user.soundEnabled);
        localStorage.setItem("soundEnabled", user.soundEnabled ? "true" : "false");
      }
    }
  }, [user]);

  const updateUserPreferences = (preferences) => {
    if (user) {
      dispatch(updateUser({ id: "me", userData: preferences }));
    }
  };

  const setTheme = (newTheme) => {
    localStorage.setItem("theme", newTheme);
    setThemeState(newTheme);
    if (user && user.themePreference !== newTheme) {
      updateUserPreferences({ themePreference: newTheme });
    }
  };

  const setAccentColor = (newAccent) => {
    localStorage.setItem("accentColor", newAccent);
    setAccentColorState(newAccent);
    if (user && user.accentColor !== newAccent) {
      updateUserPreferences({ accentColor: newAccent });
    }
  };

  const setSoundEnabled = (enabled) => {
    localStorage.setItem("soundEnabled", enabled ? "true" : "false");
    setSoundEnabledState(enabled);
    if (user && user.soundEnabled !== enabled) {
      updateUserPreferences({ soundEnabled: enabled });
    }
  };

  useEffect(() => {
    const root = window.document.documentElement;
    
    const applyTheme = () => {
      root.classList.remove("dark");
      
      if (theme === "dark") {
        root.classList.add("dark");
      } else if (theme === "light") {
        // Already removed
      } else {
        // System preference
        const isSystemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        if (isSystemDark) {
          root.classList.add("dark");
        }
      }
    };

    applyTheme();

    // Listen for system theme changes if theme is set to 'system'
    if (theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleChange = () => applyTheme();
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
  }, [theme]);

  // Apply accent attribute on root html node
  useEffect(() => {
    const root = window.document.documentElement;
    root.setAttribute("data-accent", accentColor);
  }, [accentColor]);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        accentColor,
        setAccentColor,
        soundEnabled,
        setSoundEnabled,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
