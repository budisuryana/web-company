/** Public site frame: header with language switcher, and a footer carrying products, company, legal and contact links. */
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ArrowUpRight, Globe, Mail, MapPin, Menu, X } from "lucide-react";
import { Link, useLocation } from "wouter";
import { BrandLockup, BrandSymbol } from "@/components/BrandLockup";
import { trpc } from "@/lib/trpc";
import { CMS_BASE_PATH } from "@/const";
import { alternateHref, useLocale, useMessages } from "@/i18n";
import { SITE } from "@shared/site";

type SiteShellProps = { children: ReactNode };

export function BrandMark({ className = "" }: { className?: string }) {
  return (
    <BrandSymbol className={`brand-mark ${className}`.trim()} />
  );
}

export function Brand({
  logoUrl,
  companyName = SITE.name,
  tagline,
  showTagline = true,
  size = "default",
  homeLabel = "Beranda",
}: {
  logoUrl?: string;
  companyName?: string;
  tagline?: string;
  showTagline?: boolean;
  size?: "default" | "large";
  homeLabel?: string;
}) {
  return (
    <Link href="/" className="brand-link" aria-label={`${companyName} — ${homeLabel}`}>
      {logoUrl ? (
        <img
          src={logoUrl}
          alt={companyName}
          className={size === "large" ? "brand-logo is-large" : "brand-logo"}
        />
      ) : (
        <BrandLockup name={companyName} variant="duo" size={size} />
      )}
      {showTagline && tagline && <span className="brand-tagline">{tagline}</span>}
    </Link>
  );
}

function LanguageSwitch({ className = "" }: { className?: string }) {
  const locale = useLocale();
  const t = useMessages();
  // Re-render on navigation so the alternate href follows the current page.
  useLocation();
  return (
    <div className={`lang-switch ${className}`} role="group" aria-label={t.nav.language}>
      <Globe size={14} aria-hidden="true" />
      <Link href={alternateHref("id")} aria-current={locale === "id" ? "true" : undefined} hrefLang="id" lang="id">
        ID
      </Link>
      <Link href={alternateHref("en")} aria-current={locale === "en" ? "true" : undefined} hrefLang="en" lang="en">
        EN
      </Link>
    </div>
  );
}

export default function SiteShell({ children }: SiteShellProps) {
  const [location] = useLocation();
  const t = useMessages();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const trackView = trpc.registry.public.trackView.useMutation();
  const contentQuery = trpc.registry.public.siteContent.useQuery();
  const productsQuery = trpc.registry.public.list.useQuery();

  const content = useMemo(() => {
    return Object.fromEntries((contentQuery.data ?? []).map((item) => [item.key, item.value]));
  }, [contentQuery.data]);

  const logoUrl = content["company.logoUrl"] || undefined;
  // The brand name is fixed in code: the CMS still holds the previous name, and the
  // public site must say NUSAKARYA without a production database change.
  const companyName = SITE.name;
  const products = productsQuery.data ?? [];

  const navItems = [
    { label: t.nav.products, href: "/products" },
    { label: t.nav.about, href: "/about" },
    { label: t.nav.contact, href: "/contact" },
  ];

  useEffect(() => {
    const updateHeader = () => setScrolled(window.scrollY > 14);
    updateHeader();
    window.addEventListener("scroll", updateHeader, { passive: true });
    return () => window.removeEventListener("scroll", updateHeader);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    // Inside the /en tree `location` is relative; analytics wants the real path.
    const fullPath = window.location.pathname;
    if (!fullPath.startsWith(CMS_BASE_PATH) && !fullPath.startsWith("/admin")) {
      trackView.mutate({
        path: fullPath,
        referrer: typeof document !== "undefined" ? document.referrer : undefined,
      });
    }
  }, [location]);

  return (
    <div className="site-shell">
      <header className={`site-header ${scrolled ? "is-scrolled" : ""}`}>
        <div className="header-inner">
          <Brand logoUrl={logoUrl} companyName={companyName} tagline={t.common.tagline} homeLabel={t.nav.home} />
          <nav className="main-nav" aria-label={t.nav.primaryLabel}>
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={location.startsWith(item.href) ? "is-active" : ""}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="header-actions">
            <LanguageSwitch />
            <Link href="/contact" className="header-cta">
              {t.common.contactUs} <ArrowUpRight size={15} />
            </Link>
          </div>
          <button
            className="menu-button"
            type="button"
            aria-label={menuOpen ? t.nav.closeMenu : t.nav.openMenu}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((value) => !value)}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
        <div className={`mobile-menu ${menuOpen ? "is-open" : ""}`}>
          {navItems.map((item, index) => (
            <Link key={item.href} href={item.href}>
              <span>0{index + 1}</span>
              {item.label}
              <ArrowUpRight size={16} />
            </Link>
          ))}
          <div className="mobile-menu-foot">
            <Link href="/contact" className="mobile-contact">
              {t.common.contactUs}
            </Link>
            <LanguageSwitch />
          </div>
        </div>
      </header>
      {children}
      <footer className="site-footer">
        <div className="footer-top">
          <div className="footer-brand">
            <Brand
              logoUrl={logoUrl}
              companyName={companyName}
              size="large"
              showTagline={false}
              homeLabel={t.nav.home}
            />
            <p>{t.common.tagline}</p>
          </div>
          <nav className="footer-col" aria-label={t.footer.products}>
            <h2>{t.footer.products}</h2>
            {products.map((product) => (
              <Link key={product.id} href={`/products/${product.slug}`}>
                {product.name}
              </Link>
            ))}
          </nav>
          <nav className="footer-col" aria-label={t.footer.company}>
            <h2>{t.footer.company}</h2>
            <Link href="/about">{t.nav.about}</Link>
            <Link href="/contact">{t.nav.contact}</Link>
          </nav>
          <nav className="footer-col" aria-label={t.footer.legal}>
            <h2>{t.footer.legal}</h2>
            <Link href="/privacy">{t.footer.privacy}</Link>
            <Link href="/terms">{t.footer.terms}</Link>
          </nav>
          <div className="footer-col">
            <h2>{t.footer.contact}</h2>
            <a href={`mailto:${SITE.email}`}>
              <Mail size={14} aria-hidden="true" /> {SITE.email}
            </a>
            <span>
              <MapPin size={14} aria-hidden="true" /> {t.common.location}
            </span>
          </div>
        </div>
        <div className="footer-bottom">
          <span>
            © {new Date().getFullYear()} {companyName}. {t.footer.rights}
          </span>
          <span>{SITE.domain}</span>
          <LanguageSwitch className="is-dark" />
        </div>
      </footer>
    </div>
  );
}
