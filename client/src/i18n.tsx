/**
 * Locale plumbing for the public site. English is served at "/", Indonesian is
 * the same route tree nested under "/id" (see App.tsx), so wouter's relative
 * <Link href="/about"> already resolves to "/id/about" inside the Indonesian tree.
 *
 * Copy is the code dictionary with CMS overrides applied (shared/i18n/editable.ts).
 * The server embeds the overrides into every page, so the first render already
 * shows the CMS text; the query below only refreshes them later.
 */
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Messages } from "@shared/i18n/messages";
import {
  CONTENT_ELEMENT_ID,
  resolveCompany,
  resolveMessages,
  type CompanyProfile,
  type ContentOverrides,
} from "@shared/i18n/editable";
import { DEFAULT_LOCALE, HTML_LANG, localizePath, splitLocale, type Locale } from "@shared/site";
import { trpc } from "@/lib/trpc";

const LocaleContext = createContext<Locale>(DEFAULT_LOCALE);

export function LocaleProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  useEffect(() => {
    document.documentElement.lang = HTML_LANG[locale];
  }, [locale]);
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>;
}

export function useLocale(): Locale {
  return useContext(LocaleContext);
}

const ContentContext = createContext<ContentOverrides>({});

function readEmbeddedContent(): ContentOverrides {
  try {
    const element = document.getElementById(CONTENT_ELEMENT_ID);
    return element?.textContent ? (JSON.parse(element.textContent) as ContentOverrides) : {};
  } catch {
    return {};
  }
}

export function ContentProvider({ children }: { children: ReactNode }) {
  const [embedded] = useState(readEmbeddedContent);
  const query = trpc.content.public.all.useQuery(undefined, {
    initialData: embedded,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
  return <ContentContext.Provider value={query.data ?? embedded}>{children}</ContentContext.Provider>;
}

export function useMessages(): Messages {
  const locale = useLocale();
  const overrides = useContext(ContentContext);
  return useMemo(() => resolveMessages(locale, overrides), [locale, overrides]);
}

/** Company name, email, tagline and location in the current language. */
export function useCompany(): CompanyProfile {
  const locale = useLocale();
  const overrides = useContext(ContentContext);
  return useMemo(() => resolveCompany(locale, overrides), [locale, overrides]);
}

/**
 * Absolute href for the current page in the other language. The "~" prefix
 * tells wouter to ignore the nested "/id" base.
 */
export function alternateHref(locale: Locale): string {
  const { path } = splitLocale(window.location.pathname);
  return `~${localizePath(path, locale)}${window.location.search}`;
}

/** Keeps the tab title in step with client-side navigation; the server sets it on first load. */
export function useDocumentTitle(title: string | undefined) {
  const { name } = useCompany();
  useEffect(() => {
    if (!title) return;
    document.title = title.includes(name) ? title : `${title} — ${name}`;
  }, [title, name]);
}
