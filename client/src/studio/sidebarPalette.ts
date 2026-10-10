/**
 * Sidebar colour themes, ported from NUSAKARYA HQ (Settings → Appearance → Sidebar color).
 * One background colour derives the whole sidebar palette: text that reaches AA (4.5:1),
 * hairlines, a hover that always differs from the active item, and count badges.
 */
export type SidebarPresetId = "charcoal" | "purple" | "amber" | "ocean" | "emerald" | "rose";
export type SidebarChoice = { preset: SidebarPresetId | "custom"; custom: string };

export const SIDEBAR_PRESETS: Array<{ id: SidebarPresetId; name: string; bg: string; accent: string }> = [
  { id: "charcoal", name: "Modern Charcoal", bg: "#222631", accent: "#8fb0ff" },
  { id: "purple", name: "Vibrant Purple", bg: "#5631a8", accent: "#dccbff" },
  { id: "amber", name: "Golden Amber", bg: "#a65f12", accent: "#ffe2ad" },
  { id: "ocean", name: "Royal Blue", bg: "#2456a6", accent: "#c2d8ff" },
  { id: "emerald", name: "Rich Emerald", bg: "#087f65", accent: "#b4f2dc" },
  { id: "rose", name: "Rich Rose", bg: "#a33567", accent: "#ffcadf" },
];

export const DEFAULT_SIDEBAR: SidebarChoice = { preset: "charcoal", custom: "#2d3a4a" };

type Rgb = [number, number, number];
const toRgb = (hex: string): Rgb => {
  let h = hex.replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as Rgb;
};
const toHex = (rgb: number[]) => "#" + rgb.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0")).join("");
/** `t` is the share of `a`. */
const mix = (a: string, b: string, t: number) => { const A = toRgb(a), B = toRgb(b); return toHex(A.map((v, i) => v * t + B[i] * (1 - t))); };
const luminance = (hex: string) => {
  const f = (c: number) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
  const [r, g, b] = toRgb(hex);
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};
export const contrast = (a: string, b: string) => { const x = luminance(a), y = luminance(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };

function toHsl([r, g, b]: Rgb): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    h *= 60;
  }
  return [h, s, l];
}
function hslToHex(h: number, s: number, l: number) {
  const k = (n: number) => (n + h / 30) % 12, a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return toHex([f(0) * 255, f(8) * 255, f(4) * 255]);
}

export const isHex = (value: string | null | undefined) => /^#?[0-9a-f]{6}$/i.test((value || "").trim());
export const normalizeHex = (value: string) => "#" + value.trim().replace("#", "").toLowerCase();

/** Derives a full, readable sidebar palette from one background colour (HQ `sbPalette`). */
export function sidebarPalette(bg: string, accentHint?: string) {
  const dark = contrast(bg, "#ffffff") >= 4.5 || contrast(bg, "#ffffff") >= contrast(bg, "#111318");
  const fg = dark ? "#ffffff" : "#13151a";
  const fgContrast = contrast(fg, bg);
  const opposite = dark ? "#000000" : "#ffffff";
  const reach = (min: number, from: number) => {
    min = Math.min(min, fgContrast);
    let t = from;
    while (t < 1 && contrast(mix(fg, bg, t), bg) < min) t += 0.01;
    return mix(fg, bg, Math.min(1, t));
  };
  const muted = reach(Math.max(4.6, Math.min(7.5, fgContrast - 1.2)), 0.72);
  const faint = reach(Math.max(4.5, Math.min(5, fgContrast - 2)), 0.55);
  const tone = (t1: number, t2: number, text: string, min: number) => {
    const a = mix(fg, bg, t1);
    if (contrast(text, a) >= min) return a;
    const b = mix(opposite, bg, t2);
    return contrast(text, b) >= contrast(text, a) ? b : a;
  };
  let activeShare = 0;
  if (dark) for (let t = 0.18; t >= 0; t -= 0.005) if (contrast(fg, mix(fg, bg, t)) >= 4.5) { activeShare = t; break; }
  const active = dark ? mix(fg, bg, activeShare) : tone(0.1, 0.2, fg, 4.5);
  const hover = dark ? (activeShare >= 0.08 ? mix(fg, bg, activeShare * 0.45) : mix(opposite, bg, 0.13)) : tone(0.05, 0.1, muted, 4.5);
  const activeRing = mix(fg, bg, dark ? Math.max(0.26, activeShare + 0.12) : 0.18);
  let accent = accentHint;
  if (!accent) {
    const [h, s] = toHsl(toRgb(bg));
    const hue = s < 0.12 ? 222 : h;
    let L = dark ? 0.84 : 0.36;
    const S = s < 0.12 ? 0.8 : Math.min(0.9, s + 0.25);
    accent = hslToHex(hue, S, L);
    let n = 0;
    while (contrast(accent, bg) < 3.2 && n++ < 30) { L += dark ? 0.015 : -0.015; accent = hslToHex(hue, S, L); }
  }
  const [hotBg, hotFg] = dark ? ["#ffe3e1", "#b0241c"] : ["#c22f2a", "#ffffff"];
  const [warnBg, warnFg] = dark ? ["#ffeccb", "#874600"] : ["#a35a00", "#ffffff"];
  return {
    dark,
    vars: {
      bg, fg, muted, faint,
      border: mix(fg, bg, 0.14),
      "border-strong": mix(fg, bg, 0.28),
      hover, active,
      "active-ring": activeRing,
      input: dark ? mix(opposite, bg, 0.14) : mix("#ffffff", bg, 0.55),
      accent,
      "hot-bg": hotBg, "hot-fg": hotFg, "warn-bg": warnBg, "warn-fg": warnFg,
    } as Record<string, string>,
  };
}

export function paletteFor(choice: SidebarChoice) {
  if (choice.preset === "custom") return sidebarPalette(choice.custom);
  const preset = SIDEBAR_PRESETS.find((item) => item.id === choice.preset) ?? SIDEBAR_PRESETS[0];
  return sidebarPalette(preset.bg, preset.accent);
}
