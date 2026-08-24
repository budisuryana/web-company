/** Design system: Software Almanac — calm navigation and a modular mark frame every product story. */
import { useEffect, useState, type ReactNode } from "react";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";

type SiteShellProps = { children: ReactNode };

const navItems = [
  { label: "Products", href: "/products" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export function BrandMark({ className = "" }: { className?: string }) {
  return <svg className={`brand-mark ${className}`} viewBox="0 0 48 48" aria-hidden="true"><path d="M7 9h10l7 17L31 9h10L29 39h-9L7 9Z" fill="currentColor" /><path d="m24 26 5.4 13h-9L24 26Z" fill="#F05A43" /></svg>;
}

function Brand() {
  return <Link href="/" className="brand-lockup" aria-label="Workshop Collective home"><BrandMark /><span className="brand-wordmark"><b>Workshop</b><b>Collective</b></span><i className="brand-index-slash" /></Link>;
}

export default function SiteShell({ children }: SiteShellProps) {
  const [location] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const trackView = trpc.registry.public.trackView.useMutation();

  useEffect(() => {
    const updateHeader = () => setScrolled(window.scrollY > 14);
    updateHeader();
    window.addEventListener("scroll", updateHeader, { passive: true });
    return () => window.removeEventListener("scroll", updateHeader);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    if (!location.startsWith("/admin")) {
      trackView.mutate({
        path: location,
        referrer: typeof document !== "undefined" ? document.referrer : undefined,
      });
    }
  }, [location]);

  return <div className="site-shell">
    <header className={`site-header ${scrolled ? "is-scrolled" : ""}`}>
      <div className="header-inner">
        <Brand />
        <nav className="main-nav" aria-label="Primary navigation">{navItems.map((item) => <Link key={item.href} href={item.href} className={location.startsWith(item.href) ? "is-active" : ""}>{item.label}</Link>)}</nav>
        <Link href="/contact" className="header-cta">Start a conversation <ArrowUpRight size={15} /></Link>
        <button className="menu-button" type="button" aria-label={menuOpen ? "Close menu" : "Open menu"} aria-expanded={menuOpen} onClick={() => setMenuOpen((value) => !value)}>{menuOpen ? <X size={22} /> : <Menu size={22} />}</button>
      </div>
      <div className={`mobile-menu ${menuOpen ? "is-open" : ""}`}>{navItems.map((item, index) => <Link key={item.href} href={item.href}><span>0{index + 1}</span>{item.label}<ArrowUpRight size={16} /></Link>)}<Link href="/contact" className="mobile-contact">Tell us what you are building</Link></div>
    </header>
    {children}
    <footer className="site-footer"><div className="footer-top"><Brand /><p>Useful software for the work that keeps moving.</p><Link href="/contact" className="text-link">Start a conversation <ArrowUpRight size={15} /></Link></div><div className="footer-bottom"><span>© 2026 Workshop Collective</span><span>Independent by design.</span><span>Jakarta · Indonesia</span></div></footer>
  </div>;
}
