/**
 * Workshop CMS appearance, following NUSAKARYA HQ: light (default) or dark mode, and a sidebar
 * colour independent of the mode. Both are per-browser preferences, like the admin language.
 *
 * While the CMS is on screen, <html> carries `data-studio` (and the theme), which is the only
 * hook studio.css styles hang from — dialogs, menus and toasts render in portals outside the
 * page tree, so a wrapper class would miss them. Leaving the CMS removes it again, so the public
 * website never sees CMS styles.
 */
import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useState, type ReactNode } from "react";
import { DEFAULT_SIDEBAR, SIDEBAR_PRESETS, isHex, normalizeHex, paletteFor, type SidebarChoice } from "./sidebarPalette";
import "./studio.css";

export type StudioTheme = "light" | "dark";
export const STUDIO_THEME_KEY = "nk-studio-theme";
export const STUDIO_SIDEBAR_KEY = "nk-studio-sidebar";
const FONT_LINK_ID = "nk-studio-fonts";
const FONT_HREF = "https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@400;500&display=swap";

function readTheme(): StudioTheme {
  try {
    return window.localStorage.getItem(STUDIO_THEME_KEY) === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}

function readSidebar(): SidebarChoice {
  try {
    const stored = JSON.parse(window.localStorage.getItem(STUDIO_SIDEBAR_KEY) || "null") as Partial<SidebarChoice> | null;
    if (!stored) return DEFAULT_SIDEBAR;
    const preset = stored.preset === "custom" || SIDEBAR_PRESETS.some((item) => item.id === stored.preset) ? stored.preset! : DEFAULT_SIDEBAR.preset;
    return { preset, custom: isHex(stored.custom) ? normalizeHex(stored.custom!) : DEFAULT_SIDEBAR.custom };
  } catch {
    return DEFAULT_SIDEBAR;
  }
}

function store(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Private mode or blocked storage: the choice still applies for this visit.
  }
}

type StudioAppearance = {
  theme: StudioTheme;
  setTheme: (theme: StudioTheme) => void;
  sidebar: SidebarChoice;
  setSidebar: (choice: SidebarChoice) => void;
};

const StudioAppearanceContext = createContext<StudioAppearance>({
  theme: "light",
  setTheme: () => undefined,
  sidebar: DEFAULT_SIDEBAR,
  setSidebar: () => undefined,
});

export function useStudioAppearance() {
  return useContext(StudioAppearanceContext);
}

export function StudioThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<StudioTheme>(readTheme);
  const [sidebar, setSidebarState] = useState<SidebarChoice>(readSidebar);

  const setTheme = useCallback((next: StudioTheme) => {
    setThemeState(next);
    store(STUDIO_THEME_KEY, next);
  }, []);
  const setSidebar = useCallback((next: SidebarChoice) => {
    setSidebarState(next);
    store(STUDIO_SIDEBAR_KEY, JSON.stringify(next));
  }, []);

  // Mark <html> before paint so the first frame is already in CMS styles.
  useLayoutEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-studio", "");
    return () => {
      root.removeAttribute("data-studio");
      root.removeAttribute("data-studio-theme");
      root.style.removeProperty("color-scheme");
    };
  }, []);

  useLayoutEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-studio-theme", theme);
    root.style.setProperty("color-scheme", theme);
  }, [theme]);

  useLayoutEffect(() => {
    const root = document.documentElement;
    const { vars } = paletteFor(sidebar);
    for (const [name, value] of Object.entries(vars)) root.style.setProperty(`--sb-${name}`, value);
    return () => {
      for (const name of Object.keys(vars)) root.style.removeProperty(`--sb-${name}`);
    };
  }, [sidebar]);

  // Geist 400–700 and Geist Mono are only needed by the CMS, so they load here rather than on every public page.
  // The link goes again on leaving: its Geist faces would otherwise replace the public wordmark's Geist 600 file.
  useEffect(() => {
    if (document.getElementById(FONT_LINK_ID)) return;
    const link = document.createElement("link");
    link.id = FONT_LINK_ID;
    link.rel = "stylesheet";
    link.href = FONT_HREF;
    document.head.appendChild(link);
    return () => link.remove();
  }, []);

  const value = useMemo(() => ({ theme, setTheme, sidebar, setSidebar }), [theme, setTheme, sidebar, setSidebar]);
  return <StudioAppearanceContext.Provider value={value}>{children}</StudioAppearanceContext.Provider>;
}
