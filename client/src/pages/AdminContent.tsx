/** CMS: bilingual (EN/ID) site copy with code defaults, live on save, plus the company logo, phone and social links. */
import { ChangeEvent, useMemo, useState } from "react";
import type { inferRouterOutputs } from "@trpc/server";
import { Building2, Check, FileText, Globe, Loader2, OctagonAlert, RotateCcw, Save, Search, Trash2, Undo2, UploadCloud } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BrandMark } from "@/components/SiteShell";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { CONTENT_SECTIONS, fieldLabel, validateContent, type ContentSection } from "@shared/i18n/editable";
import { useAdminLocale, useT, type Translate } from "@/admin/i18n";
import type { AdminPhrase } from "@/admin/phrases";
import { Badge, Button, Card, CardHead, EmptyState, ErrorState, LoadingState, PageHead, btn } from "@/studio/ui";
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
    <>
      <PageHead
        title={t("Profil & Konten")}
        description={t("Edit teks website dalam bahasa Inggris dan Indonesia. Kolom yang belum diubah memakai teks bawaan.")}
        actions={
          <span className="hq-input-icon w-full sm:w-64">
            <Search aria-hidden="true" />
            <label htmlFor="content-search" className="sr-only">{t("Cari konten")}</label>
            <input id="content-search" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t("Cari teks atau key…")} className="hq-input" />
          </span>
        }
      />
      <div className="hq-banner info mb-4" role="note">
        <Globe aria-hidden="true" /> {t("Perubahan yang disimpan langsung tampil di website publik.")}
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabId)} className="w-full min-w-0 gap-0">
        <TabsList className="hq-tabs">
          {TABS.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id} className="hq-tab">
              {t(tab.title)}
              <span className="hq-n">{tabCounts[tab.id] ?? 0}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {entriesQuery.isLoading ? (
          <Card>
            <LoadingState>{t("Memuat konten…")}</LoadingState>
          </Card>
        ) : entriesQuery.isError ? (
          <Card>
            <ErrorState onRetry={() => void entriesQuery.refetch()}>{t("Konten tidak dapat dimuat: {error}", { error: entriesQuery.error.message })}</ErrorState>
          </Card>
        ) : (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void handleSave();
            }}
            className="min-w-0"
          >
            <Card>
              <CardHead icon={currentTab.id === "company" ? Building2 : FileText} hue={currentTab.id === "company" ? "violet" : "blue"} title={t(currentTab.title)} sub={t(currentTab.desc)} />

              {activeTab === "company" && (
                <div className="hq-logo-block">
                  <div className="hq-logo-preview">
                    {logoUrl ? (
                      <img src={logoUrl} alt={t("Pratinjau logo")} />
                    ) : (
                      <span className="flex flex-col items-center gap-1">
                        <BrandMark className="h-7 w-7" />
                        <span className="hq-faint text-[10.5px]">{t("Logo bawaan")}</span>
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-[var(--hq-text-primary)]">{t("Logo gambar (opsional)")}</div>
                    <div className="hq-hint mt-0.5">{t("Jika kosong, website memakai logo NUSAKARYA bawaan. Unggahan menggantikan logo di header dan data mesin pencari.")}</div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {logoUrl && (
                      <Button variant="danger" size="sm" icon={Trash2} disabled={isUploadingLogo} onClick={() => void handleLogoRemove()}>
                        {t("Hapus logo")}
                      </Button>
                    )}
                    <label className={btn("primary", "sm")}>
                      {isUploadingLogo ? <Loader2 className="hq-spin" aria-hidden="true" /> : <UploadCloud aria-hidden="true" />}
                      {logoUrl ? t("Ganti logo") : t("Unggah logo")}
                      <input type="file" accept="image/*" disabled={isUploadingLogo} onChange={(event) => void handleLogoUpload(event)} />
                    </label>
                  </div>
                </div>
              )}

              {groups.map((group) => (
                <section key={group.id} aria-label={group.title || t(currentTab.title)} className="hq-content-group">
                  {group.title && <h3 className="hq-overline">{group.title}</h3>}
                  {group.items.length === 0 && <EmptyState icon={FileText} title={t("Tidak ada konten yang cocok dengan pencarian.")} />}
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
                <section aria-label={t("Kontak & media sosial")} className="hq-content-group">
                  <h3 className="hq-overline">{t("Kontak & media sosial")}</h3>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {PROFILE_KEYS.map((item) => {
                      const value = profileDrafts[item.key] ?? legacyValues[item.key] ?? "";
                      const problem = problems[item.key];
                      return (
                        <div key={item.key} className="hq-copy-row hq-field">
                          <label htmlFor={`profile-${item.key}`} className="hq-copy-title">{t(item.label)}</label>
                          <input
                            id={`profile-${item.key}`}
                            type={item.key === "company.phone" ? "tel" : "url"}
                            value={value}
                            placeholder={item.placeholder}
                            onChange={(event) => setProfileDrafts((current) => ({ ...current, [item.key]: event.target.value }))}
                            aria-invalid={Boolean(problem)}
                            className="hq-input"
                          />
                          {problem ? (
                            <span className="hq-error">
                              <OctagonAlert aria-hidden="true" />
                              {problem}
                            </span>
                          ) : (
                            <span className="hq-hint">{t(item.hint)}</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}
            </Card>

            <div className="hq-savebar">
              <div className="hq-status-wrap" aria-live="polite">
                {pendingCount > 0 ? (
                  <span className={`hq-status ${hasProblems ? "warn" : "dirty"}`}>
                    <span className="hq-dot" aria-hidden="true" />
                    {t("{count} perubahan belum disimpan", { count: pendingCount })}
                    {hasProblems && t(" · ada kolom yang perlu diperbaiki")}
                  </span>
                ) : (
                  <span className="hq-status">
                    <Check size={14} aria-hidden="true" /> {t("Semua perubahan sudah tersimpan.")}
                  </span>
                )}
              </div>
              <div className="ml-auto flex items-center gap-2">
                {pendingCount > 0 && (
                  <Button
                    variant="ghost"
                    icon={Undo2}
                    disabled={isSaving}
                    onClick={() => {
                      setDrafts({});
                      setProfileDrafts({});
                    }}
                  >
                    {t("Batalkan")}
                  </Button>
                )}
                <button type="submit" disabled={isSaving || pendingCount === 0 || hasProblems} className={btn("primary")}>
                  {isSaving ? <Loader2 className="hq-spin" aria-hidden="true" /> : <Save aria-hidden="true" />}
                  {isSaving ? t("Menyimpan…") : t("Simpan & tayangkan")}
                </button>
              </div>
            </div>
          </form>
        )}
      </Tabs>
    </>
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
    <div className="hq-copy-row">
      <div className="hq-copy-head">
        <span className="hq-copy-title">{fieldLabel(entry.label, adminLocale)}</span>
        <code className="hq-copy-key">{entry.key}</code>
      </div>
      <div className={`grid grid-cols-1 gap-3 ${entry.shared ? "" : "lg:grid-cols-2"}`}>
        {locales.map(({ id: locale, label }) => {
          const slotKey = draftKey(entry.key, locale);
          const slot = entry.values[entry.shared ? "en" : locale];
          const stored = slot.override ?? slot.default;
          const value = drafts[slotKey] ?? stored;
          const dirty = value !== stored;
          const problem = problems[slotKey];
          const fieldId = `field-${locale}-${entry.key}`;
          const inputClass = `hq-input ${dirty || slot.override !== null ? "changed" : ""}`;
          return (
            <div key={locale} className="hq-field">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label htmlFor={fieldId} className="hq-label inline-flex items-center gap-1.5">
                  <span className="hq-lang-tag">{entry.shared ? "EN · ID" : locale.toUpperCase()}</span>
                  {entry.shared ? t("EN & ID (sama untuk kedua bahasa)") : t(label)}
                </label>
                <span className="flex items-center gap-1.5">
                  {dirty ? (
                    <Badge tone="warning" dot>{t("Belum disimpan")}</Badge>
                  ) : slot.override !== null ? (
                    <Badge tone="accent">{t("Diubah")}</Badge>
                  ) : (
                    <Badge>{t("Bawaan")}</Badge>
                  )}
                  {slot.override !== null && (
                    <Button variant="ghost" size="sm" icon={resetting === slotKey ? Loader2 : RotateCcw} disabled={resetting === slotKey} onClick={() => onReset(locale)}>
                      {t("Reset to Default")}
                    </Button>
                  )}
                </span>
              </div>
              {entry.multiline ? (
                <textarea id={fieldId} rows={3} value={value} onChange={(event) => onChange(locale, event.target.value)} aria-invalid={Boolean(problem)} aria-describedby={`${fieldId}-help`} className={inputClass} />
              ) : (
                <input id={fieldId} type={entry.format === "email" ? "email" : "text"} value={value} onChange={(event) => onChange(locale, event.target.value)} aria-invalid={Boolean(problem)} aria-describedby={`${fieldId}-help`} className={inputClass} />
              )}
              <div id={`${fieldId}-help`} className="flex flex-wrap items-start justify-between gap-2 text-[12px] leading-4">
                {problem ? (
                  <span className="hq-error">
                    <OctagonAlert aria-hidden="true" />
                    {problem}
                  </span>
                ) : slot.override !== null || dirty ? (
                  <span className="hq-hint min-w-0 flex-1">{t("Bawaan: {text}", { text: slot.default })}</span>
                ) : (
                  <span className="hq-hint">{t("Kosongkan kolom untuk kembali ke teks bawaan.")}</span>
                )}
                <span className={`hq-tnum ${value.trim().length > entry.max ? "font-semibold text-[var(--hq-danger)]" : "hq-faint"}`}>
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
