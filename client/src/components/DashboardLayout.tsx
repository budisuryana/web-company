/** CMS shell in the NUSAKARYA HQ layout: coloured sidebar with grouped navigation, top bar with breadcrumb, and a bottom tab bar on phones. */
import { useAuth } from "@/_core/hooks/useAuth";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { BrandSymbol } from "@/components/BrandLockup";
import { CMS_BASE_PATH, CMS_ROUTES } from "@/const";
import { trpc } from "@/lib/trpc";
import { AdminLanguageSwitch, useAdminDocumentLang, useT } from "@/admin/i18n";
import type { AdminPhrase } from "@/admin/phrases";
import { useStudioAppearance } from "@/studio/theme";
import { SIDEBAR_PRESETS, isHex, normalizeHex } from "@/studio/sidebarPalette";
import { Button, Segmented } from "@/studio/ui";
import { SITE } from "@shared/site";
import { Boxes, ChevronRight, Ellipsis, ExternalLink, FileText, Inbox, LayoutDashboard, LogOut, Menu, Moon, Sun, UsersRound, X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { Link, useLocation } from "wouter";

type NavItem = { icon: typeof Boxes; label: AdminPhrase; short: AdminPhrase; path: string };

const NAV_GROUPS: Array<{ label: AdminPhrase; items: NavItem[] }> = [
  { label: "Ikhtisar", items: [{ icon: LayoutDashboard, label: "Ringkasan", short: "Ringkasan", path: CMS_ROUTES.dashboard }] },
  {
    label: "Konten",
    items: [
      { icon: Boxes, label: "Katalog Produk", short: "Products", path: CMS_ROUTES.products },
      { icon: FileText, label: "Profil & Konten", short: "Konten", path: CMS_ROUTES.content },
    ],
  },
  { label: "Komunikasi", items: [{ icon: Inbox, label: "Kotak Masuk", short: "Kotak Masuk", path: CMS_ROUTES.inbox }] },
  { label: "Organisasi", items: [{ icon: UsersRound, label: "Manajemen Pengguna", short: "Manajemen Pengguna", path: CMS_ROUTES.users }] },
];
const NAV_ITEMS = NAV_GROUPS.flatMap((group) => group.items);
/** Bottom tab bar on phones; everything else stays one tap away under "More". */
const MOBILE_TABS = [CMS_ROUTES.dashboard, CMS_ROUTES.products, CMS_ROUTES.inbox, CMS_ROUTES.content];

const isActive = (item: NavItem, location: string) =>
  item.path === location || (item.path === CMS_ROUTES.products && location.startsWith(`${CMS_ROUTES.products}/`));

const initialOf = (name?: string | null) => name?.trim().charAt(0).toUpperCase() || "A";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const t = useT();
  useAdminDocumentLang();
  const [location] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const { theme, setTheme } = useStudioAppearance();
  // The same query (and cache entry) the dashboard and inbox read, so the badge follows every triage action.
  const inboxCounts = trpc.registry.admin.submissions.counts.useQuery(undefined, { enabled: user?.role === "admin" });
  const unread = inboxCounts.data?.unread ?? 0;
  const active = NAV_ITEMS.find((item) => isActive(item, location));

  // Close the phone slide-over after navigating, and on Escape.
  useEffect(() => setMenuOpen(false), [location]);
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setMenuOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      window.location.href = CMS_BASE_PATH;
    }
  };

  const editorCrumb = location.startsWith(`${CMS_ROUTES.products}/`) ? (location === CMS_ROUTES.productNew ? t("New product") : t("Edit")) : null;

  return (
    <div className="hq-app">
      <aside className={`hq-sidebar ${menuOpen ? "open" : ""}`} aria-label={t("Navigasi utama")}>
        <div className="flex items-center">
          <Link href={CMS_ROUTES.dashboard} className="hq-brand min-w-0 flex-1">
            <span className="hq-brand-mark">
              <BrandSymbol />
            </span>
            <span className="min-w-0">
              <span className="hq-brand-name block">Workshop CMS</span>
              <span className="hq-brand-sub block truncate">
                {SITE.name} · {t("Product publishing")}
              </span>
            </span>
          </Link>
          <Button variant="ghost" size="sm" iconOnly icon={X} className="hq-mob-only mr-2" aria-label={t("Tutup menu")} onClick={() => setMenuOpen(false)} />
        </div>

        <nav className="hq-nav">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <div className="hq-nav-label">{t(group.label)}</div>
              {group.items.map((item) => (
                <Link key={item.path} href={item.path} className="hq-nav-item" aria-current={isActive(item, location) ? "page" : undefined}>
                  <item.icon aria-hidden="true" />
                  <span className="truncate">{t(item.label)}</span>
                  {item.path === CMS_ROUTES.inbox && unread > 0 && (
                    <span className="hq-count warn" aria-label={t("{count} belum dibaca", { count: unread })}>
                      {unread}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          ))}
        </nav>

        <div className="hq-side-foot">
          <span className="hq-avatar" aria-hidden="true">
            {initialOf(user?.name)}
          </span>
          <div className="hq-who">
            <b>{user?.name || "Admin"}</b>
            <span>{user?.email || t("Project owner")}</span>
          </div>
          <AccountMenu onLogout={handleLogout} />
        </div>
      </aside>
      {menuOpen && <div className="hq-scrim hq-mob-only" aria-hidden="true" onClick={() => setMenuOpen(false)} />}

      <div className="hq-main">
        <header className="hq-topbar">
          <Button variant="ghost" iconOnly icon={Menu} className="hq-mob-only" aria-label={t("Buka menu")} aria-expanded={menuOpen} data-testid="studio-menu-button" onClick={() => setMenuOpen(true)} />
          <nav className="hq-crumbs" aria-label={t("Navigasi jejak")}>
            <span className="hq-crumb-trail flex items-center gap-1.5">
              <Link href={CMS_ROUTES.dashboard}>Workshop CMS</Link>
              <ChevronRight aria-hidden="true" />
            </span>
            {editorCrumb ? (
              <>
                <Link href={CMS_ROUTES.products} className="hq-crumb-trail">
                  {t("Katalog Produk")}
                </Link>
                <ChevronRight aria-hidden="true" className="hq-crumb-trail" />
                <span aria-current="page">{editorCrumb}</span>
              </>
            ) : (
              <span aria-current="page">{active ? t(active.label) : "CMS"}</span>
            )}
          </nav>
          <div className="hq-spacer" />
          <Link href="/" className="hq-btn ghost sm hq-desk-only">
            <ExternalLink aria-hidden="true" />
            {t("Lihat Situs Publik")}
          </Link>
          <AdminLanguageSwitch compact />
          <Button
            variant="ghost"
            iconOnly
            icon={theme === "dark" ? Sun : Moon}
            aria-label={theme === "dark" ? t("Mode terang") : t("Mode gelap")}
            title={theme === "dark" ? t("Mode terang") : t("Mode gelap")}
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          />
        </header>
        <main className="hq-content">
          <div className="hq-page">{children}</div>
        </main>
      </div>

      <nav className="hq-mob-tabs" aria-label={t("Navigasi seluler")}>
        {MOBILE_TABS.map((path) => {
          const item = NAV_ITEMS.find((entry) => entry.path === path)!;
          return (
            <Link key={path} href={path} aria-current={isActive(item, location) ? "page" : undefined}>
              <item.icon aria-hidden="true" />
              <span className="max-w-full truncate px-1">{t(item.short)}</span>
              {path === CMS_ROUTES.inbox && unread > 0 && <span className="hq-bdg">{unread}</span>}
            </Link>
          );
        })}
        <button type="button" onClick={() => setMenuOpen(true)} aria-expanded={menuOpen}>
          <Menu aria-hidden="true" />
          {t("Lainnya")}
        </button>
      </nav>
    </div>
  );
}

/** Account menu: appearance (mode and sidebar colour), admin language, sign out. */
function AccountMenu({ onLogout }: { onLogout: () => void }) {
  const t = useT();
  const { theme, setTheme, sidebar, setSidebar } = useStudioAppearance();
  const [custom, setCustom] = useState(sidebar.custom);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" iconOnly icon={Ellipsis} aria-label={t("Menu akun")} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side="top" sideOffset={8} className="hq-menu">
        <div className="hq-menu-label">{t("Tampilan")}</div>
        <div className="hq-menu-row">
          <Segmented
            label={t("Tampilan")}
            value={theme}
            onChange={setTheme}
            options={[
              { value: "light", label: t("Terang"), icon: Sun },
              { value: "dark", label: t("Gelap"), icon: Moon },
            ]}
          />
        </div>
        <div className="hq-menu-label">{t("Warna sidebar")}</div>
        <div className="hq-swatches" role="group" aria-label={t("Warna sidebar")}>
          {SIDEBAR_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className="hq-swatch"
              style={{ background: preset.bg }}
              title={preset.name}
              aria-label={preset.name}
              aria-pressed={sidebar.preset === preset.id}
              onClick={() => setSidebar({ ...sidebar, preset: preset.id })}
            />
          ))}
          <label className="hq-swatch custom" title={t("Warna kustom")} aria-pressed={sidebar.preset === "custom"}>
            <span className="sr-only">{t("Warna kustom")}</span>
            <input
              type="color"
              value={custom}
              onChange={(event) => {
                setCustom(event.target.value);
                if (isHex(event.target.value)) setSidebar({ preset: "custom", custom: normalizeHex(event.target.value) });
              }}
            />
          </label>
        </div>
        <div className="hq-menu-sep" />
        <div className="hq-menu-row">
          <AdminLanguageSwitch className="w-full" />
        </div>
        <div className="hq-menu-sep" />
        <DropdownMenuItem asChild className="hq-menu-item">
          <Link href="/">
            <ExternalLink aria-hidden="true" />
            {t("Lihat Situs Publik")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onLogout} className="hq-menu-item danger">
          <LogOut aria-hidden="true" />
          {t("Sign out")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
