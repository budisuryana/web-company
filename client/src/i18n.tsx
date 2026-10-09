/**
 * Locale plumbing for the public site. Indonesian is served at "/", English is
 * the same route tree nested under "/en" (see App.tsx), so wouter's relative
 * <Link href="/about"> already resolves to "/en/about" inside the English tree.
 */
import { createContext, useContext, useEffect, type ReactNode } from "react";
import { MESSAGES, type Messages } from "@shared/i18n/messages";
import { HTML_LANG, SITE, localizePath, splitLocale, type Locale } from "@shared/site";

const LocaleContext = createContext<Locale>("id");

export function LocaleProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  useEffect(() => {
    document.documentElement.lang = HTML_LANG[locale];
  }, [locale]);
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>;
}

export function useLocale(): Locale {
  return useContext(LocaleContext);
}

export function useMessages(): Messages {
  return MESSAGES[useLocale()];
}

/**
 * Absolute href for the current page in the other language. The "~" prefix
 * tells wouter to ignore the nested "/en" base.
 */
export function alternateHref(locale: Locale): string {
  const { path } = splitLocale(window.location.pathname);
  return `~${localizePath(path, locale)}${window.location.search}`;
}

/** Keeps the tab title in step with client-side navigation; the server sets it on first load. */
export function useDocumentTitle(title: string | undefined) {
  useEffect(() => {
    if (!title) return;
    document.title = title.includes(SITE.name) ? title : `${title} — ${SITE.name}`;
  }, [title]);
}
