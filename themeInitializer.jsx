// themeInitializer.jsx
// Theme initialization utility — runs before app paint to prevent FOUC.
//
// FIX: persistThemeChoice now writes to BOTH localStorage and Capacitor
// Preferences. localStorage is the fast sync source for first paint
// (no async needed). Capacitor Preferences is the OS-safe persistent
// source that survives mobile OS cache clears.
//
// If the OS clears localStorage, AppContext.jsx has a useEffect that
// reads from Preferences and restores the theme after mount — preventing
// the user's dark mode choice from being lost permanently.

import { Preferences } from '@capacitor/preferences';

const LIGHT_STATUS_BG = '#F0F7E8';
const DARK_STATUS_BG = '#001A00';
const THEME_STORAGE_KEY = 'routenet_pref_theme';

export const initializeTheme = () => {
  // Read from localStorage synchronously for first paint — no FOUC.
  // AppContext handles the async Preferences backfill if localStorage
  // was cleared by the OS.
  let savedTheme = 'light';
  try {
    savedTheme = localStorage.getItem(THEME_STORAGE_KEY) || 'light';
  } catch (e) {
    savedTheme = 'light';
  }

  document.documentElement.classList.remove('light', 'dark');
  document.documentElement.classList.add(savedTheme);
  updateThemeColorMeta(savedTheme);
  updateAppleStatusBar(savedTheme);
  return savedTheme;
};

export const updateThemeColorMeta = (theme) => {
  try {
    const color = theme === 'dark' ? DARK_STATUS_BG : LIGHT_STATUS_BG;
    let meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'theme-color';
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', color);
    meta.setAttribute('media', '(prefers-color-scheme: ' + theme + ')');
  } catch (e) {}
};

export const updateAppleStatusBar = (theme) => {
  try {
    let meta = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'apple-mobile-web-app-status-bar-style';
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', 'black');
  } catch (e) {}
};

export const persistThemeChoice = (theme) => {
  // FIX: Write to localStorage AND Capacitor Preferences.
  // localStorage alone is not reliable on mobile — the OS can clear it.
  // Writing to both ensures the theme is never lost:
  //   - localStorage: read synchronously on next paint (no FOUC)
  //   - Preferences: read asynchronously by AppContext on cold start
  //     if localStorage was cleared
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch (e) {}

  // Preferences.set is async — fire and forget, non-blocking
  Preferences.set({ key: THEME_STORAGE_KEY, value: theme }).catch(() => {});
};

export const applyThemeToDocument = (theme) => {
  document.documentElement.classList.remove('light', 'dark');
  document.documentElement.classList.add(theme);
  updateThemeColorMeta(theme);
  updateAppleStatusBar(theme);
  persistThemeChoice(theme);
};
