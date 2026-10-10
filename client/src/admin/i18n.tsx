/**
 * Language of the admin panel (CMS interface) — separate from the public
 * website's language. The website follows its URL (/ English, /id
 * Indonesian) for visitors; the admin panel follows this per-browser choice
 * for administrators. Neither changes the other, and the EN/ID columns in
 * the content editors always refer to the website's languages.
 *
 * Phrases are keyed by the text as written in code; a key missing from the
 * dictionaries is a type error, so no admin text can go untranslated.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { Languages } from "lucide-react";
import { ADMIN_PHRASES, type AdminPhrase } from "./phrases";

export type AdminLocale = "id" | "en";
export const ADMIN_LOCALE_STORAGE_KEY = "nk-admin-locale";
const DEFAULT_ADMIN_LOCALE: AdminLocale = "id";

function readStoredLocale(): AdminLocale {
  try {
    const stored = window.localStorage.getItem(ADMIN_LOCALE_STORAGE_KEY);
    return stored === "en" || stored === "id" ? stored : DEFAULT_ADMIN_LOCALE;
  } catch {
    return DEFAULT_ADMIN_LOCALE;
  }
}

type AdminLocaleState = { locale: AdminLocale; setLocale: (locale: AdminLocale) => void };
const AdminLocaleContext = createContext<AdminLocaleState>({ locale: DEFAULT_ADMIN_LOCALE, setLocale: () => undefined });

export function AdminLocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<AdminLocale>(readStoredLocale);
  const setLocale = useCallback((next: AdminLocale) => {
    setLocaleState(next);
    try {
      window.localStorage.setItem(ADMIN_LOCALE_STORAGE_KEY, next);
    } catch {
      // Private mode or blocked storage: the choice still applies for this visit.
    }
  }, []);
  const value = useMemo(() => ({ locale, setLocale }), [locale, setLocale]);
  return <AdminLocaleContext.Provider value={value}>{children}</AdminLocaleContext.Provider>;
}

export function useAdminLocale() {
  return useContext(AdminLocaleContext);
}

/**
 * Sets <html lang> to the admin language. Used only on admin screens: the
 * provider wraps the public site too, and must not override its language.
 */
export function useAdminDocumentLang() {
  const { locale } = useAdminLocale();
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
}

export type Translate = (phrase: AdminPhrase, vars?: Record<string, string | number>) => string;

/** Translates an admin phrase; `{name}` placeholders are filled from `vars`. */
export function translateAdmin(locale: AdminLocale, phrase: AdminPhrase, vars?: Record<string, string | number>): string {
  // A phrase missing at runtime (e.g. a server message passed through) is shown as written, never thrown.
  const entry = (ADMIN_PHRASES as Record<string, { id: string; en: string } | undefined>)[phrase];
  const text: string = entry ? entry[locale] : phrase;
  return vars ? text.replace(/\{(\w+)\}/g, (match, name) => (name in vars ? String(vars[name]) : match)) : text;
}

export function useT(): Translate {
  const { locale } = useAdminLocale();
  return useCallback((phrase, vars) => translateAdmin(locale, phrase, vars), [locale]);
}

/** ID / EN toggle for the admin panel. */
export function AdminLanguageSwitch({ compact = false, className = "" }: { compact?: boolean; className?: string }) {
  const { locale, setLocale } = useAdminLocale();
  const t = useT();
  return (
    <div className={`flex items-center gap-2 ${className}`} role="group" aria-label={t("Bahasa admin")} title={t("Hanya mengubah bahasa panel admin. Bahasa website diatur terpisah.")}>
      {!compact && <Languages className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />}
      {!compact && <span className="text-xs font-semibold text-muted-foreground">{t("Bahasa admin")}</span>}
      <div className="ml-auto inline-flex rounded-md border border-[var(--line-strong)] p-0.5">
        {(["id", "en"] as const).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setLocale(option)}
            aria-pressed={locale === option}
            lang={option}
            className={`rounded px-2 py-0.5 font-mono text-[11px] font-bold uppercase ${locale === option ? "bg-[var(--ink)] text-[var(--lightest)]" : "text-muted-foreground hover:text-[var(--ink)]"}`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}
