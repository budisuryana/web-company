/** Design system: Software Almanac — brand lockup, header, and footer dynamically read company profile from PostgreSQL. */
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { Link, useLocation } from "wouter";
import { BrandLockup, CHEVRON_BODY, CHEVRON_NOTCH } from "@/components/BrandLockup";
import { trpc } from "@/lib/trpc";
import { CMS_BASE_PATH } from "@/const";

type SiteShellProps = { children: ReactNode };

const navItems = [
  { label: "Produk", href: "/products" },
  { label: "Tentang Kami", href: "/about" },
  { label: "Kontak", href: "/contact" },
];

export function BrandMark({ className = "" }: { className?: string }) {
  return (
    <svg className={`brand-mark ${className}`} viewBox="0 0 48 48" aria-hidden="true">
      <path d={CHEVRON_BODY} fill="currentColor" />
      <path d={CHEVRON_NOTCH} fill="var(--accent)" />
    </svg>
  );
}

export function Brand({
  logoUrl,
  companyName = "Workshop Collective",
  tagline,
  showTagline = true,
  size = "default",
}: {
  logoUrl?: string;
  companyName?: string;
  tagline?: string;
  showTagline?: boolean;
  size?: "default" | "large";
}) {
  return (
    <Link href="/" className="brand-link" aria-label="Beranda">
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

export default function SiteShell({ children }: SiteShellProps) {
  const [location] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const trackView = trpc.registry.public.trackView.useMutation();
  const contentQuery = trpc.registry.public.siteContent.useQuery();

  const content = useMemo(() => {
    return Object.fromEntries((contentQuery.data ?? []).map((item) => [item.key, item.value]));
  }, [contentQuery.data]);

  const logoUrl = content["company.logoUrl"] || undefined;
  const companyName = content["company.name"] ?? "Workshop Collective";
  const tagline = content["company.tagline"] ?? "Perangkat lunak terpadu untuk alur kerja yang terus bergerak.";
  const copyrightText = `© ${new Date().getFullYear()} ${companyName}`;
  const footerMotto = content["company.footerMotto"] ?? "Independent by design.";
  const address = content["company.address"] ?? "Bandung · Indonesia";

  useEffect(() => {
    const updateHeader = () => setScrolled(window.scrollY > 14);
    updateHeader();
    window.addEventListener("scroll", updateHeader, { passive: true });
    return () => window.removeEventListener("scroll", updateHeader);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    if (!location.startsWith(CMS_BASE_PATH) && !location.startsWith("/admin")) {
      trackView.mutate({
        path: location,
        referrer: typeof document !== "undefined" ? document.referrer : undefined,
      });
    }
  }, [location]);

  return (
    <div className="site-shell">
      <header className={`site-header ${scrolled ? "is-scrolled" : ""}`}>
        <div className="header-inner">
          <Brand logoUrl={logoUrl} companyName={companyName} tagline={tagline} />
          <nav className="main-nav" aria-label="Navigasi Utama">
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
          <Link href="/contact" className="header-cta">
            Hubungi Kami <ArrowUpRight size={15} />
          </Link>
          <button
            className="menu-button"
            type="button"
            aria-label={menuOpen ? "Tutup menu" : "Buka menu"}
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
          <Link href="/contact" className="mobile-contact">
            Konsultasikan kebutuhan produk Anda
          </Link>
        </div>
      </header>
      {children}
      <footer className="site-footer">
        <div className="footer-top">
          <Brand
            logoUrl={logoUrl}
            companyName={companyName}
            size="large"
            showTagline={false}
          />
          <p>{tagline}</p>
          <Link href="/contact" className="text-link">
            Mulai Konsultasi <ArrowUpRight size={15} />
          </Link>
        </div>
        <div className="footer-bottom">
          <span>{copyrightText}</span>
          <span>{footerMotto}</span>
          <span>{address}</span>
        </div>
      </footer>
    </div>
  );
}
