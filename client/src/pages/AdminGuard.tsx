/** CMS access gate: manual credentials authentication (username/email & password) with secure session handling. */
import { useState, type FormEvent, type ReactNode } from "react";
import { Boxes, ChevronRight, Eye, EyeOff, FileText, Inbox, KeyRound, Loader2, LockKeyhole, LogOut, Moon, OctagonAlert, ShieldAlert, ShieldCheck, Sun, UsersRound } from "lucide-react";
import { Link } from "wouter";
import { BrandSymbol } from "@/components/BrandLockup";
import { useAuth } from "@/_core/hooks/useAuth";
import { CMS_BASE_PATH } from "@/const";
import { trpc } from "@/lib/trpc";
import { SITE } from "@shared/site";
import { toast } from "sonner";
import { AdminLanguageSwitch, useAdminDocumentLang, useT } from "@/admin/i18n";
import { useStudioAppearance } from "@/studio/theme";
import { Badge, Button, Tile, btn, type Hue } from "@/studio/ui";

/** Sign-in and access screens in the NUSAKARYA HQ login layout: form card on the left, product panel on the right. */
function AccessFrame({ eyebrow, title, body, children, denied = false }: { eyebrow: string; title: ReactNode; body: string; children: ReactNode; denied?: boolean }) {
  const companyName = SITE.name;
  const t = useT();
  const { theme, setTheme } = useStudioAppearance();
  useAdminDocumentLang();

  return (
    <main className="hq-login">
      <section className="hq-login-l">
        <div className="hq-login-tools">
          <AdminLanguageSwitch compact />
          <Button variant="ghost" size="sm" icon={theme === "dark" ? Sun : Moon} onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
            {theme === "dark" ? t("Terang") : t("Gelap")}
          </Button>
        </div>
        <div className="hq-login-card">
          <Link href="/" className="hq-login-brand">
            <span className="hq-brand-mark">
              <BrandSymbol />
            </span>
            <span>
              <span className="block text-[14px] font-semibold leading-4">Workshop CMS</span>
              <span className="hq-faint block text-[11px] leading-[14px]">{t("Panel Admin {company}", { company: companyName })}</span>
            </span>
          </Link>
          <span className={`hq-login-eyebrow ${denied ? "denied" : ""}`}>
            {denied ? <ShieldAlert aria-hidden="true" /> : <LockKeyhole aria-hidden="true" />}
            {eyebrow}
          </span>
          <h1>{title}</h1>
          <p className="hq-login-body">{body}</p>
          {children}
          <div className="hq-login-notes">
            <span>
              <ShieldCheck aria-hidden="true" />
              {t("Pemeriksaan peran dijalankan di server untuk setiap tindakan CMS.")}
            </span>
            <span>
              <LockKeyhole aria-hidden="true" />
              {t("Sesi Anda diverifikasi sebelum data produk atau pengguna dibuka.")}
            </span>
          </div>
        </div>
      </section>

      <section className="hq-login-r" aria-hidden="true">
        <div className="hq-login-grid" />
        <div className="hq-login-preview">
          {([
            [Boxes, "blue", t("Katalog Produk"), <Badge tone="success" dot>{t("Published")}</Badge>],
            [FileText, "teal", t("Profil & Konten"), <Badge tone="accent">EN / ID</Badge>],
            [Inbox, "amber", t("Kotak Masuk"), <Badge tone="warning" dot>{t("Baru")}</Badge>],
            [UsersRound, "violet", t("Kontrol Akses"), <Badge tone="review">{t("Administrator")}</Badge>],
          ] as Array<[typeof Boxes, Hue, string, ReactNode]>).map(([icon, hue, label, badge], index) => (
            <div key={label} className="hq-card hq-login-preview-row" style={{ width: 420 - index * 14, marginLeft: index * 28, opacity: 1 - index * 0.12 }}>
              <Tile icon={icon} hue={hue} />
              <span className="flex-1 font-medium">{label}</span>
              {badge}
            </div>
          ))}
        </div>
        <div className="hq-login-foot">
          <div className="hq-overline mb-2.5">{t("Ruang kerja privat")}</div>
          <h2>
            {t("Kelola katalog produk dan seluruh konten situs")} {t("dari satu tempat.")}
          </h2>
        </div>
      </section>
    </main>
  );
}

function LoginForm() {
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const utils = trpc.useUtils();
  const t = useT();

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: (userData) => {
      setErrorMessage(null);
      // Credentials can be valid while the account still lacks the admin role, so don't
      // claim CMS access here — AdminGuard decides which screen comes next.
      const isAdmin = (userData as { role?: string } | null)?.role === "admin";
      toast.success(isAdmin ? t("Berhasil masuk ke CMS.") : t("Akun terverifikasi. Menunggu izin administrator."));
      utils.auth.me.setData(undefined, userData as any);
      void utils.auth.me.invalidate();
    },
    onError: (error) => {
      setErrorMessage(error.message);
    },
  });

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!usernameOrEmail.trim() || !password) {
      setErrorMessage(t("Silakan isi username/email dan password."));
      return;
    }
    setErrorMessage(null);
    loginMutation.mutate({ usernameOrEmail: usernameOrEmail.trim(), password });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
      <div className="hq-field">
        <label className="hq-label" htmlFor="usernameOrEmail">
          {t("Username atau Email")}
        </label>
        <input
          id="usernameOrEmail"
          type="text"
          required
          autoComplete="username"
          value={usernameOrEmail}
          onChange={(e) => setUsernameOrEmail(e.target.value)}
          placeholder={t("admin atau email anda")}
          className="hq-input"
        />
      </div>

      <div className="hq-field">
        <label className="hq-label" htmlFor="password">
          {t("Password")}
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="hq-input pr-9"
            aria-invalid={errorMessage ? true : undefined}
          />
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            icon={showPassword ? EyeOff : Eye}
            tabIndex={-1}
            aria-label={showPassword ? t("Sembunyikan password") : t("Tampilkan password")}
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-[3px] top-[3px]"
          />
        </div>
        {errorMessage && (
          <span className="hq-error" role="alert">
            <OctagonAlert aria-hidden="true" />
            {errorMessage}
          </span>
        )}
      </div>

      <button type="submit" disabled={loginMutation.isPending} className={btn("primary", "lg", "block mt-1")}>
        {loginMutation.isPending ? (
          <>
            <Loader2 className="hq-spin" aria-hidden="true" />
            {t("Memeriksa akun…")}
          </>
        ) : (
          t("Masuk ke Panel CMS")
        )}
      </button>

      {import.meta.env.DEV && (
        <div className="hq-login-dev">
          <span className="flex items-center gap-1.5 font-medium text-[var(--hq-text-primary)]">
            <KeyRound size={13} aria-hidden="true" /> {t("Kredensial default admin")}
            <Badge tone="warning" className="ml-1">{t("hanya dev")}</Badge>
          </span>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <div>
              <span className="hq-faint">Username:</span> <code>admin</code>
            </div>
            <div>
              <span className="hq-faint">Password:</span> <code>admin123</code>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}

/** The CMS access gate, mounted once by StudioLayout: session check, sign-in, admin-role check, then the CMS. */
export default function AdminGuard({ children }: { children: ReactNode }) {
  const { user, loading, logout } = useAuth();
  const companyName = SITE.name;
  const t = useT();
  useAdminDocumentLang();

  if (loading) {
    return (
      <main className="hq-gate-loading" role="status">
        <Loader2 className="hq-spin" aria-hidden="true" />
        <span>{t("Membuka CMS…")}</span>
      </main>
    );
  }

  if (!user) {
    return (
      <AccessFrame
        eyebrow={t("Panel Admin {company}", { company: companyName })}
        title={
          <>
            {t("Masuk ke")} {t("CMS {company}.", { company: companyName })}
          </>
        }
        body={t("Silakan masukkan username/email dan password administrator untuk mengelola konten dan katalog produk.")}
      >
        <LoginForm />
      </AccessFrame>
    );
  }

  if (user.role !== "admin") {
    return (
      <AccessFrame
        denied
        eyebrow={t("Akses Membutuhkan Persetujuan")}
        title={
          <>
            {t("Akun Terhubung,")} {t("Belum Memiliki Izin.")}
          </>
        }
        body={t("Akun Anda telah terdaftar, namun belum memiliki role administrator. Hubungi administrator yang berwenang untuk menyetujui akses akun ini atau masuk dengan akun admin.")}
      >
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="primary"
            size="lg"
            icon={LogOut}
            onClick={async () => {
              await logout();
              window.location.href = CMS_BASE_PATH;
            }}
          >
            {t("Keluar & Ganti Akun")}
          </Button>
          <Link href="/" className={btn("default", "lg")}>
            {t("Kembali ke website")} <ChevronRight aria-hidden="true" />
          </Link>
        </div>
      </AccessFrame>
    );
  }

  return <>{children}</>;
}
