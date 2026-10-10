/** CMS: bilingual (EN/ID) site copy with code defaults, live on save, plus the company logo, phone and social links. */
import { ChangeEvent, useMemo, useState, type ReactNode } from "react";
import type { inferRouterOutputs } from "@trpc/server";
import { FileText, Globe, Loader2, RotateCcw, Save, Search, Trash2, Undo2, UploadCloud } from "lucide-react";
import AdminGuard from "@/pages/AdminGuard";
import { useAuth } from "@/_core/hooks/useAuth";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BrandMark } from "@/components/SiteShell";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { CONTENT_SECTIONS, fieldLabel, validateContent, type ContentSection } from "@shared/i18n/editable";
import { useAdminLocale, useT, type Translate } from "@/admin/i18n";
import type { AdminPhrase } from "@/admin/phrases";
import type { AppRouter } from "../../../server/routers";

type RouterOutputs = inferRouterOutputs<AppRouter>;

async function processLogoImage(file: File): Promise<{ dataUrl: string; fileName: string; contentType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve({ dataUrl: reader.result as string, fileName: file.name, contentType: file.type || "image/png" });
          return;
        }
        ctx.drawImage(img, 0, 0);
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;

        // Sample top-left corner as background color
        const bgR = data[0];
        const bgG = data[1];
        const bgB = data[2];
        const bgA = data[3];

        let minX = canvas.width;
        let maxX = 0;
        let minY = canvas.height;
        let maxY = 0;

        for (let y = 0; y < canvas.height; y++) {
          for (let x = 0; x < canvas.width; x++) {
            const idx = (y * canvas.width + x) * 4;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];
            const a = data[idx + 3];

            const isBg =
              a < 20 ||
              (Math.abs(r - bgR) < 22 && Math.abs(g - bgG) < 22 && Math.abs(b - bgB) < 22 && Math.abs(a - bgA) < 22) ||
              (r > 245 && g > 245 && b > 245 && bgR > 240 && bgG > 240 && bgB > 240);

            if (!isBg) {
              if (x < minX) minX = x;
              if (x > maxX) maxX = x;
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;
            }
          }
        }

        // If bounding box found with whitespace
        if (maxX > minX && maxY > minY && (minX > 10 || minY > 10 || maxX < canvas.width - 10 || maxY < canvas.height - 10)) {
          const pad = 12;
          minX = Math.max(0, minX - pad);
          minY = Math.max(0, minY - pad);
          maxX = Math.min(canvas.width, maxX + pad);
          maxY = Math.min(canvas.height, maxY + pad);
          const cropW = maxX - minX;
          const cropH = maxY - minY;

          const cropCanvas = document.createElement("canvas");
          cropCanvas.width = cropW;
          cropCanvas.height = cropH;
          const cropCtx = cropCanvas.getContext("2d");
          if (cropCtx) {
            cropCtx.drawImage(img, minX, minY, cropW, cropH, 0, 0, cropW, cropH);
            resolve({
              dataUrl: cropCanvas.toDataURL("image/png"),
              fileName: file.name.replace(/\.[^/.]+$/, ".png"),
              contentType: "image/png",
            });
            return;
          }
        }

        resolve({ dataUrl: reader.result as string, fileName: file.name, contentType: file.type || "image/png" });
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

const tabTriggerClass = "admin-tab flex-none px-2 pb-3 pt-2 text-xs font-extrabold uppercase tracking-[.14em] text-[var(--cool-40)] transition-colors hover:text-[var(--ink)] data-[state=active]:text-[var(--ink)]";

type Locale = "en" | "id";
type Entry = RouterOutputs["content"]["admin"]["list"][number];
type TabId = ContentSection | "all";

const LOCALES: Array<{ id: Locale; label: AdminPhrase }> = [
  { id: "en", label: "English" },
  { id: "id", label: "Indonesia" },
];

const TABS: Array<{ id: TabId; title: AdminPhrase; desc: AdminPhrase }> = [
  { id: "company", title: "Profil Perusahaan", desc: "Nama, tagline, email, lokasi, logo, telepon, dan media sosial." },
  { id: "home", title: "Home Page", desc: "Hero, bagian produk, cara kami membangun, bagian AI, penutup, dan SEO halaman utama." },
  { id: "about", title: "About Page", desc: "Hero, cerita perusahaan, prinsip, bagian AI, penutup, dan SEO halaman About." },
  { id: "contact", title: "Contact Page", desc: "Pengantar, keterangan formulir, pesan setelah terkirim, dan SEO halaman Contact." },
  { id: "upcoming", title: "In Development", desc: "Judul, pengantar, label status, dan empat produk yang sedang dikembangkan." },
  { id: "all", title: "Semua Konten", desc: "Seluruh teks yang dapat diedit, termasuk halaman Produk, dikelompokkan per halaman." },
];

/** Legacy site_content rows that the public site still reads (social links feed JSON-LD) or that stay internal (phone). */
const PROFILE_KEYS: Array<{ key: string; label: AdminPhrase; hint: AdminPhrase; placeholder: string }> = [
  { key: "company.phone", label: "Nomor kontak / WhatsApp", hint: "Disimpan untuk internal, belum ditampilkan di website.", placeholder: "+62…" },
  { key: "company.linkedinUrl", label: "URL LinkedIn", hint: "Dipakai di data perusahaan untuk mesin pencari (JSON-LD).", placeholder: "https://www.linkedin.com/company/…" },
  { key: "company.githubUrl", label: "URL GitHub", hint: "Dipakai di data perusahaan untuk mesin pencari (JSON-LD).", placeholder: "https://github.com/…" },
  { key: "company.instagramUrl", label: "URL Instagram", hint: "Dipakai di data perusahaan untuk mesin pencari (JSON-LD).", placeholder: "https://www.instagram.com/…" },
];

const draftKey = (key: string, locale: Locale) => `${locale}:${key}`;

function storedValue(entry: Entry, locale: Locale): string {
  const slot = entry.values[entry.shared ? "en" : locale];
  return slot.override ?? slot.default;
}

export default function AdminContent() {
  const { user } = useAuth();
  const t = useT();
  const { locale: adminLocale } = useAdminLocale();
  const isAdmin = user?.role === "admin";
  const utils = trpc.useUtils();
  const entriesQuery = trpc.content.admin.list.useQuery(undefined, { enabled: isAdmin });
  const legacyQuery = trpc.registry.admin.siteContent.useQuery(undefined, { enabled: isAdmin });
  const updateMutation = trpc.content.admin.update.useMutation();
  const resetMutation = trpc.content.admin.reset.useMutation();
  const legacyUpdateMutation = trpc.registry.admin.updateSiteContent.useMutation();
  const uploadLogoMutation = trpc.registry.media.uploadCompanyLogo.useMutation();
  const removeLogoMutation = trpc.registry.media.removeCompanyLogo.useMutation();

  const [activeTab, setActiveTab] = useState<TabId>("company");
  const [search, setSearch] = useState("");
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [profileDrafts, setProfileDrafts] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [resetting, setResetting] = useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  const entries = entriesQuery.data ?? [];
  const legacyValues = useMemo(
    () => Object.fromEntries((legacyQuery.data ?? []).map((item) => [item.key, item.value])),
    [legacyQuery.data],
  );
  const logoUrl = legacyValues["company.logoUrl"] || "";

  const refresh = () =>
    Promise.all([
      utils.content.admin.list.invalidate(),
      utils.content.public.all.invalidate(),
      utils.registry.admin.siteContent.invalidate(),
      utils.registry.public.siteContent.invalidate(),
    ]);

  const visibleEntries = useMemo(() => {
    const term = search.trim().toLowerCase();
    return entries.filter((entry) => {
      if (activeTab !== "all" && entry.section !== activeTab) return false;
      if (!term) return true;
      const haystack = [entry.label, entry.key, storedValue(entry, "en"), storedValue(entry, "id")].join(" ").toLowerCase();
      return haystack.includes(term);
    });
  }, [entries, activeTab, search]);

  /** Unsaved edits: every draft that differs from what is stored. */
  const pending = useMemo(() => {
    const byKey = new Map(entries.map((entry) => [entry.key, entry]));
    return Object.entries(drafts)
      .map(([slot, value]) => {
        const [locale, ...rest] = slot.split(":");
        const key = rest.join(":");
        const entry = byKey.get(key);
        return entry ? { entry, locale: locale as Locale, value } : null;
      })
      .filter((item): item is { entry: Entry; locale: Locale; value: string } => Boolean(item))
      .filter(({ entry, locale, value }) => value !== storedValue(entry, locale));
  }, [drafts, entries]);

  const pendingProfile = useMemo(
    () => Object.entries(profileDrafts).filter(([key, value]) => value.trim() !== (legacyValues[key] ?? "")),
    [profileDrafts, legacyValues],
  );

  const problems = useMemo(() => {
    const result: Record<string, string> = {};
    for (const { entry, locale, value } of pending) {
      // An emptied field means "use the default" and is saved as a reset.
      if (!value.trim()) continue;
      const problem = validateContent(entry.key, value, adminLocale);
      if (problem) result[draftKey(entry.key, locale)] = problem;
    }
    for (const [key, value] of pendingProfile) {
      if (key !== "company.phone" && value.trim() && !/^https:\/\/\S+$/.test(value.trim())) result[key] = t("Gunakan URL lengkap yang diawali https://");
    }
    return result;
  }, [pending, pendingProfile, adminLocale, t]);

  const pendingCount = pending.length + pendingProfile.length;
  const hasProblems = Object.keys(problems).length > 0;

  const handleSave = async () => {
    if (!pendingCount) return;
    if (hasProblems) {
      toast.error(t("Perbaiki kolom yang ditandai merah sebelum menyimpan."));
      return;
    }
    setIsSaving(true);
    try {
      for (const { entry, locale, value } of pending) {
        const text = value.trim();
        const slot = entry.values[entry.shared ? "en" : locale];
        // Saving the default text (or an empty field) removes the override instead of copying the default.
        if (!text || text === slot.default) {
          if (slot.override !== null) await resetMutation.mutateAsync({ key: entry.key, locale });
        } else {
          await updateMutation.mutateAsync({ key: entry.key, locale, value: text });
        }
      }
      for (const [key, value] of pendingProfile) await legacyUpdateMutation.mutateAsync({ key, value: value.trim() });
      await refresh();
      setDrafts({});
      setProfileDrafts({});
      toast.success(t("{count} perubahan disimpan dan langsung tampil di website.", { count: pendingCount }));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("Gagal menyimpan perubahan."));
      await refresh();
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async (entry: Entry, locale: Locale) => {
    const slot = draftKey(entry.key, locale);
    setResetting(slot);
    try {
      await resetMutation.mutateAsync({ key: entry.key, locale });
      setDrafts(({ [slot]: _removed, ...rest }) => rest);
      await refresh();
      toast.success(t("{label} kembali ke teks bawaan.", { label: fieldLabel(entry.label, adminLocale) }));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("Gagal mengembalikan ke teks bawaan."));
    } finally {
      setResetting(null);
    }
  };

  const handleLogoUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setIsUploadingLogo(true);
      const processed = await processLogoImage(file);
      await uploadLogoMutation.mutateAsync({ fileName: processed.fileName, contentType: processed.contentType, dataUrl: processed.dataUrl });
      await refresh();
      toast.success(t("Logo perusahaan berhasil diunggah."));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("Gagal mengunggah logo."));
    } finally {
      setIsUploadingLogo(false);
      event.target.value = "";
    }
  };

  const handleLogoRemove = async () => {
    try {
      setIsUploadingLogo(true);
      await removeLogoMutation.mutateAsync();
      await refresh();
      toast.success(t("Logo gambar dihapus, kembali ke logo NUSAKARYA bawaan."));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("Gagal menghapus logo."));
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = { all: entries.length };
    for (const entry of entries) counts[entry.section] = (counts[entry.section] ?? 0) + 1;
    return counts;
  }, [entries]);

  const currentTab = TABS.find((tab) => tab.id === activeTab) ?? TABS[0];
  const groups = activeTab === "all" ? CONTENT_SECTIONS.map((section) => ({ ...section, title: adminLocale === "en" ? section.titleEn : section.title, items: visibleEntries.filter((entry) => entry.section === section.id) })).filter((group) => group.items.length) : [{ id: activeTab, title: "", items: visibleEntries }];

  return (
    <AdminGuard>
      <div className="min-w-0 max-w-full space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[var(--line)] pb-6">
          <div>
            <span className="font-mono text-xs font-bold uppercase tracking-widest text-[var(--accent)]">{t("Konten Situs · EN / ID")}</span>
            <h1 className="mt-1 admin-display text-4xl text-[var(--ink)]">{t("Profil & Konten Situs")}</h1>
            <p className="mt-1 text-xs text-[var(--ink-soft)]">
              {t("Edit teks website dalam bahasa Inggris dan Indonesia. Kolom yang belum diubah memakai teks bawaan.")}
            </p>
            <p className="mt-2 inline-flex max-w-2xl items-center gap-2 rounded-md bg-[var(--blue-5)] px-3 py-2 text-xs font-semibold text-[var(--blue-60)]" role="note">
              <Globe size={14} aria-hidden="true" /> {t("Perubahan yang disimpan langsung tampil di website publik.")}
            </p>
          </div>
          <div className="relative">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--cool-40)]" />
            <label htmlFor="content-search" className="sr-only">{t("Cari konten")}</label>
            <input
              id="content-search"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t("Cari teks atau key…")}
              className="h-9 w-60 border border-[var(--line-strong)] bg-[var(--card)] pl-9 pr-3 text-xs text-[var(--ink)] outline-none transition-colors focus:border-[var(--accent)]"
            />
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabId)} className="mt-6 w-full min-w-0">
          <TabsList className="mb-6 h-auto w-full max-w-full justify-start gap-8 overflow-x-auto rounded-none border-b-2 border-[var(--ink)] bg-transparent p-0">
            {TABS.map((tab) => (
              <TabsTrigger key={tab.id} value={tab.id} className={tabTriggerClass}>
                {t(tab.title)}
                <span className="ml-1.5 rounded-full bg-[var(--cool-10)] px-1.5 py-0.5 text-[10px] text-[var(--ink)]">{tabCounts[tab.id] ?? 0}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {entriesQuery.isLoading ? (
            <div className="flex items-center gap-2 py-16 text-sm text-[var(--ink-soft)]">
              <Loader2 className="h-4 w-4 animate-spin" /> {t("Memuat konten…")}
            </div>
          ) : entriesQuery.isError ? (
            <div className="admin-card border border-red-200 bg-red-50 p-6 text-sm text-red-800" role="alert">
              {t("Konten tidak dapat dimuat: {error}", { error: entriesQuery.error.message })}
            </div>
          ) : (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void handleSave();
              }}
              className="w-full overflow-hidden admin-card border border-[var(--line)] bg-white shadow-sm"
            >
              <div className="border-b border-[var(--line)] px-6 py-5">
                <h2 className="admin-display text-3xl text-[var(--ink)]">{t(currentTab.title)}</h2>
                <p className="mt-1 text-xs text-[var(--ink-soft)]">{t(currentTab.desc)}</p>
              </div>

              {activeTab === "company" && (
                <div className="border-b border-[var(--line)] bg-[var(--warm-2)] p-6">
                  <div className="flex flex-wrap items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                      <div className="grid h-16 w-24 place-items-center rounded admin-card border border-[var(--line)] bg-white p-2 shadow-inner">
                        {logoUrl ? (
                          <img src={logoUrl} alt={t("Pratinjau logo")} className="max-h-12 max-w-full object-contain" />
                        ) : (
                          <div className="flex flex-col items-center gap-1 text-[var(--ink)]">
                            <BrandMark className="h-7 w-7" />
                            <span className="text-[9px] font-bold text-[var(--cool-40)]">{t("Logo bawaan")}</span>
                          </div>
                        )}
                      </div>
                      <div>
                        <h3 className="text-sm font-extrabold text-[var(--ink)]">{t("Logo gambar (opsional)")}</h3>
                        <p className="mt-0.5 text-xs text-[var(--ink-soft)]">
                          {t("Jika kosong, website memakai logo NUSAKARYA bawaan. Unggahan menggantikan logo di header dan data mesin pencari.")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {logoUrl && (
                        <button
                          type="button"
                          disabled={isUploadingLogo}
                          onClick={() => void handleLogoRemove()}
                          className="inline-flex items-center gap-1.5 border border-red-200 bg-white px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-50 disabled:opacity-50"
                        >
                          <Trash2 size={13} /> {t("Hapus logo")}
                        </button>
                      )}
                      <label className="inline-flex cursor-pointer items-center gap-2 bg-[var(--ink)] px-4 py-2 text-xs font-extrabold text-[var(--lightest)]">
                        {isUploadingLogo ? <Loader2 size={14} className="animate-spin" /> : <UploadCloud size={14} />}
                        {logoUrl ? t("Ganti logo") : t("Unggah logo")}
                        <input type="file" accept="image/*" className="hidden" disabled={isUploadingLogo} onChange={(event) => void handleLogoUpload(event)} />
                      </label>
                    </div>
                  </div>
                </div>
              )}

              <div className="divide-y divide-[var(--line)]">
                {groups.map((group) => (
                  <section key={group.id} aria-label={group.title || t(currentTab.title)} className="space-y-4 p-6">
                    {group.title && <h3 className="text-xs font-extrabold uppercase tracking-[.14em] text-[var(--accent)]">{group.title}</h3>}
                    {group.items.length === 0 && (
                      <p className="py-8 text-center text-sm text-[var(--ink-soft)]">
                        <FileText className="mx-auto mb-2 h-6 w-6 text-[var(--cool-40)]" /> {t("Tidak ada konten yang cocok dengan pencarian.")}
                      </p>
                    )}
                    {group.items.map((entry) => (
                      <FieldRow
                        key={entry.key}
                        entry={entry}
                        drafts={drafts}
                        problems={problems}
                        resetting={resetting}
                        t={t}
                        adminLocale={adminLocale}
                        onChange={(locale, value) => setDrafts((current) => ({ ...current, [draftKey(entry.key, locale)]: value }))}
                        onReset={(locale) => void handleReset(entry, locale)}
                      />
                    ))}
                  </section>
                ))}

                {activeTab === "company" && (
                  <section aria-label={t("Kontak & media sosial")} className="space-y-4 p-6">
                    <h3 className="text-xs font-extrabold uppercase tracking-[.14em] text-[var(--accent)]">{t("Kontak & media sosial")}</h3>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      {PROFILE_KEYS.map((item) => {
                        const value = profileDrafts[item.key] ?? legacyValues[item.key] ?? "";
                        const problem = problems[item.key];
                        return (
                          <div key={item.key} className="rounded border border-[var(--line)] bg-[var(--warm-2)] p-4">
                            <label htmlFor={`profile-${item.key}`} className="text-xs font-extrabold text-[var(--ink)]">{t(item.label)}</label>
                            <input
                              id={`profile-${item.key}`}
                              type={item.key === "company.phone" ? "tel" : "url"}
                              value={value}
                              placeholder={item.placeholder}
                              onChange={(event) => setProfileDrafts((current) => ({ ...current, [item.key]: event.target.value }))}
                              aria-invalid={Boolean(problem)}
                              className={`mt-2 h-10 w-full border bg-[var(--card)] px-3 text-sm text-[var(--ink)] outline-none focus:border-[var(--accent)] ${problem ? "border-red-500" : "border-[var(--line-strong)]"}`}
                            />
                            <p className={`mt-1.5 text-[11px] ${problem ? "text-red-700" : "text-[var(--ink-soft)]"}`}>{problem ?? t(item.hint)}</p>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                )}
              </div>

              <div className="sticky bottom-0 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--line)] bg-[var(--paper)] px-6 py-4">
                <div className="text-xs font-semibold text-[var(--ink-soft)]" aria-live="polite">
                  {pendingCount > 0 ? (
                    <span className={hasProblems ? "text-red-700" : "text-[var(--purple-60)]"}>
                      {t("{count} perubahan belum disimpan", { count: pendingCount })}
                      {hasProblems && t(" · ada kolom yang perlu diperbaiki")}
                    </span>
                  ) : (
                    <span>{t("Semua perubahan sudah tersimpan.")}</span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {pendingCount > 0 && (
                    <button
                      type="button"
                      disabled={isSaving}
                      onClick={() => {
                        setDrafts({});
                        setProfileDrafts({});
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-[var(--ink-soft)] hover:text-[var(--ink)] disabled:opacity-50"
                    >
                      <Undo2 size={13} /> {t("Batalkan")}
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={isSaving || pendingCount === 0 || hasProblems}
                    className="inline-flex items-center gap-2 bg-[var(--ink)] px-5 py-2.5 text-xs font-extrabold text-[var(--lightest)] transition-all disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                    {isSaving ? t("Menyimpan…") : t("Simpan & tayangkan")}
                  </button>
                </div>
              </div>
            </form>
          )}
        </Tabs>
      </div>
    </AdminGuard>
  );
}

function FieldRow({
  entry,
  drafts,
  problems,
  resetting,
  t,
  adminLocale,
  onChange,
  onReset,
}: {
  t: Translate;
  adminLocale: Locale;
  entry: Entry;
  drafts: Record<string, string>;
  problems: Record<string, string>;
  resetting: string | null;
  onChange: (locale: Locale, value: string) => void;
  onReset: (locale: Locale) => void;
}) {
  const locales = entry.shared ? LOCALES.slice(0, 1) : LOCALES;
  return (
    <div className="rounded border border-[var(--line)] bg-[var(--warm-2)] p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-extrabold text-[var(--ink)]">{fieldLabel(entry.label, adminLocale)}</span>
        <code className="text-[10px] text-[var(--cool-40)]">{entry.key}</code>
      </div>
      <div className={`grid grid-cols-1 gap-4 ${entry.shared ? "" : "lg:grid-cols-2"}`}>
        {locales.map(({ id: locale, label }) => {
          const slotKey = draftKey(entry.key, locale);
          const slot = entry.values[entry.shared ? "en" : locale];
          const stored = slot.override ?? slot.default;
          const value = drafts[slotKey] ?? stored;
          const dirty = value !== stored;
          const problem = problems[slotKey];
          const fieldId = `field-${locale}-${entry.key}`;
          const inputClass = `w-full border bg-[var(--card)] text-sm text-[var(--ink)] outline-none transition-colors focus:border-[var(--accent)] ${
            problem ? "border-red-500" : dirty ? "border-[var(--purple-30)]" : "border-[var(--line-strong)]"
          }`;
          return (
            <div key={locale} className="flex flex-col gap-1.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label htmlFor={fieldId} className="text-[11px] font-bold uppercase tracking-wide text-[var(--ink-soft)]">
                  {entry.shared ? t("EN & ID (sama untuk kedua bahasa)") : t(label)}
                </label>
                <span className="flex items-center gap-1.5">
                  {dirty ? (
                    <Badge tone="purple">{t("Belum disimpan")}</Badge>
                  ) : slot.override !== null ? (
                    <Badge tone="blue">{t("Diubah")}</Badge>
                  ) : (
                    <Badge tone="neutral">{t("Bawaan")}</Badge>
                  )}
                  {slot.override !== null && (
                    <button
                      type="button"
                      onClick={() => onReset(locale)}
                      disabled={resetting === slotKey}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-[var(--ink-soft)] underline-offset-2 hover:text-[var(--ink)] hover:underline disabled:opacity-50"
                    >
                      {resetting === slotKey ? <Loader2 size={11} className="animate-spin" /> : <RotateCcw size={11} />} {t("Reset to Default")}
                    </button>
                  )}
                </span>
              </div>
              {entry.multiline ? (
                <textarea id={fieldId} rows={3} value={value} onChange={(event) => onChange(locale, event.target.value)} aria-invalid={Boolean(problem)} aria-describedby={`${fieldId}-help`} className={`${inputClass} resize-y p-2.5 leading-6`} />
              ) : (
                <input id={fieldId} type={entry.format === "email" ? "email" : "text"} value={value} onChange={(event) => onChange(locale, event.target.value)} aria-invalid={Boolean(problem)} aria-describedby={`${fieldId}-help`} className={`${inputClass} h-10 px-3`} />
              )}
              <div id={`${fieldId}-help`} className="flex flex-wrap items-start justify-between gap-2 text-[11px]">
                {problem ? (
                  <span className="text-red-700">{problem}</span>
                ) : slot.override !== null || dirty ? (
                  <span className="text-[var(--ink-soft)]">{t("Bawaan: {text}", { text: slot.default })}</span>
                ) : (
                  <span className="text-[var(--ink-soft)]">{t("Kosongkan kolom untuk kembali ke teks bawaan.")}</span>
                )}
                <span className={value.trim().length > entry.max ? "font-bold text-red-700" : "text-[var(--cool-40)]"}>
                  {value.trim().length}/{entry.max}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Badge({ tone, children }: { tone: "purple" | "blue" | "neutral"; children: ReactNode }) {
  const tones = {
    purple: "bg-[var(--purple-5)] text-[var(--purple-60)]",
    blue: "bg-[var(--blue-5)] text-[var(--blue-60)]",
    neutral: "bg-[var(--cool-10)] text-[var(--ink-soft)]",
  };
  return <span className={`rounded px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wide ${tones[tone]}`}>{children}</span>;
}
