import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { Check, FileText, ImageIcon, Loader2, RotateCcw, Save, Search, Trash2, UploadCloud } from "lucide-react";
import AdminGuard from "@/pages/AdminGuard";
import { useAuth } from "@/_core/hooks/useAuth";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BrandMark } from "@/components/SiteShell";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

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

const tabTriggerClass = "rounded-none border-b-2 border-transparent px-2 pb-3 pt-2 text-xs font-extrabold uppercase tracking-[.14em] text-slate-400 transition-colors hover:text-[#102239] data-[state=active]:border-[#f05a43] data-[state=active]:bg-transparent data-[state=active]:text-[#102239] data-[state=active]:shadow-none";

const tabMeta: Record<string, { title: string; desc: string }> = {
  company: {
    title: "Profil & Identitas Perusahaan",
    desc: "Nama perusahaan, logo teks (wordmark), logo gambar (opsional), moto footer, alamat kantor Bandung, email resmi, dan media sosial.",
  },
  home: {
    title: "Home Page Copy",
    desc: "Teks headline, deskripsi hero, dan judul section produk unggulan di halaman utama.",
  },
  about: {
    title: "About Page Copy",
    desc: "Pernyataan visi, filosofi, dan narasi studio di halaman About.",
  },
  contact: {
    title: "Contact Page Copy",
    desc: "Teks pengantar dan arahan formulir kontak di halaman Contact.",
  },
  all: {
    title: "Semua Konten & Copy Situs",
    desc: "Seluruh variabel teks website yang tersimpan di dalam database Product Registry.",
  },
};

const keyOrder: Record<string, number> = {
  // Profil Perusahaan (Paling Atas: Nama Perusahaan, Tagline, Logo, Kontak, Lokasi, Sosial)
  "company.name": 1,
  "company.tagline": 2,
  "company.wordmarkPart1": 3,
  "company.wordmarkPart2": 4,
  "company.email": 5,
  "company.phone": 6,
  "company.address": 7,
  "company.footerMotto": 8,
  "company.linkedinUrl": 9,
  "company.githubUrl": 10,
  "company.instagramUrl": 11,

  // Home Page
  "home.heroEyebrow": 1,
  "home.heroTitle": 2,
  "home.heroDescription": 3,
  "home.featuredHeading": 4,
  "home.featuredDescription": 5,
  "home.principleHeadline": 6,
  "home.principleBody": 7,
  "home.methodHeading": 8,
  "home.ctaHeadline": 9,

  // About Page
  "about.heroTitle": 1,
  "about.heroDescription": 2,
  "about.statement": 3,
  "about.gridHeading": 4,

  // Contact Page
  "contact.heroTitle": 1,
  "contact.intro": 2,
  "contact.city": 3,
  "contact.email": 4,
};

function formatCleanLabel(label: string): string {
  return label.replace(/^(Company|Home|About|Contact)\s*—\s*/i, "").trim();
}

export default function AdminContent() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const contentQuery = trpc.registry.admin.siteContent.useQuery(undefined, { enabled: isAdmin });
  const utils = trpc.useUtils();
  const [values, setValues] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState("company");
  const [search, setSearch] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  const originalItems = contentQuery.data ?? [];
  const originalValues = useMemo(
    () => Object.fromEntries(originalItems.map((item) => [item.key, item.value])),
    [originalItems]
  );

  useEffect(() => {
    if (contentQuery.data) {
      setValues(Object.fromEntries(contentQuery.data.map((item) => [item.key, item.value])));
    }
  }, [contentQuery.data]);

  const updateMutation = trpc.registry.admin.updateSiteContent.useMutation();
  const uploadLogoMutation = trpc.registry.media.uploadCompanyLogo.useMutation();
  const removeLogoMutation = trpc.registry.media.removeCompanyLogo.useMutation();

  const logoUrl = values["company.logoUrl"] || originalValues["company.logoUrl"] || "";

  const handleLogoUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setIsUploadingLogo(true);
      const processed = await processLogoImage(file);
      const res = await uploadLogoMutation.mutateAsync({
        fileName: processed.fileName,
        contentType: processed.contentType,
        dataUrl: processed.dataUrl,
      });
      setValues((prev) => ({ ...prev, "company.logoUrl": res.url }));
      await utils.registry.admin.siteContent.invalidate();
      await utils.registry.public.siteContent.invalidate();
      toast.success("Logo perusahaan berhasil diunggah dan disesuaikan!");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gagal mengunggah logo.");
    } finally {
      setIsUploadingLogo(false);
      event.target.value = "";
    }
  };

  const handleLogoRemove = async () => {
    try {
      setIsUploadingLogo(true);
      await removeLogoMutation.mutateAsync();
      setValues((prev) => ({ ...prev, "company.logoUrl": "" }));
      await utils.registry.admin.siteContent.invalidate();
      await utils.registry.public.siteContent.invalidate();
      toast.success("Logo gambar berhasil dihapus, kembali ke logo default.");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gagal menghapus logo.");
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const tabCounts = useMemo(() => {
    const company = originalItems.filter((i) => i.key.startsWith("company.") && i.key !== "company.logoUrl").length;
    const home = originalItems.filter((i) => i.key.startsWith("home.")).length;
    const about = originalItems.filter((i) => i.key.startsWith("about."))?.length ?? 0;
    const contact = originalItems.filter((i) => i.key.startsWith("contact.")).length;
    return { all: originalItems.length, company, home, about, contact };
  }, [originalItems]);

  const filteredItems = useMemo(() => {
    const term = search.trim().toLowerCase();
    const items = originalItems.filter((item) => {
      if (item.key === "company.logoUrl") return false; // Managed separately via logo uploader
      if (activeTab === "company" && !item.key.startsWith("company.")) return false;
      if (activeTab === "home" && !item.key.startsWith("home.")) return false;
      if (activeTab === "about" && !item.key.startsWith("about.")) return false;
      if (activeTab === "contact" && !item.key.startsWith("contact.")) return false;
      if (term && !`${item.label} ${item.key} ${item.value}`.toLowerCase().includes(term)) return false;
      return true;
    });

    return items.sort((a, b) => {
      const orderA = keyOrder[a.key] ?? 999;
      const orderB = keyOrder[b.key] ?? 999;
      return orderA - orderB;
    });
  }, [originalItems, activeTab, search]);

  const modifiedKeys = useMemo(() => {
    return filteredItems
      .map((item) => item.key)
      .filter((key) => values[key] !== undefined && values[key] !== originalValues[key]);
  }, [filteredItems, values, originalValues]);

  const handleResetCurrentTab = () => {
    const resetPatch: Record<string, string> = {};
    for (const item of filteredItems) {
      resetPatch[item.key] = originalValues[item.key] ?? "";
    }
    setValues((prev) => ({ ...prev, ...resetPatch }));
    toast.info("Perubahan pada tab ini telah dikembalikan.");
  };

  const handleSaveCurrentTab = async () => {
    if (modifiedKeys.length === 0) {
      toast.info("Tidak ada perubahan baru untuk disimpan pada tab ini.");
      return;
    }
    try {
      setIsSaving(true);
      await Promise.all(
        modifiedKeys.map((key) =>
          updateMutation.mutateAsync({
            key,
            value: values[key] ?? "",
          })
        )
      );
      await Promise.all([
        utils.registry.admin.siteContent.invalidate(),
        utils.registry.public.siteContent.invalidate(),
      ]);
      toast.success(`${modifiedKeys.length} teks berhasil diperbarui!`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan perubahan konten.");
    } finally {
      setIsSaving(false);
    }
  };

  const currentMeta = tabMeta[activeTab] ?? tabMeta.all;

  return (
    <AdminGuard>
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-900/15 pb-6">
          <div>
            <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#f05a43]">
              Pengaturan &amp; Konten
            </span>
            <h1 className="mt-1 font-[DM_Serif_Display] text-4xl text-[#102239]">Profil &amp; Konten Situs</h1>
            <p className="mt-1 text-xs text-slate-500">
              Kelola profil perusahaan, logo teks, alamat, kontak, dan seluruh copy publik dalam satu formulir terpadu.
            </p>
          </div>
          <div className="relative">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari teks atau key…"
              className="h-9 w-60 border border-slate-900/20 bg-[#fffdf8] pl-9 pr-3 text-xs text-[#102239] outline-none transition-colors focus:border-[#f05a43]"
            />
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6 w-full">
          <TabsList className="mb-6 h-auto w-full justify-start gap-8 rounded-none border-b-2 border-[#102239] bg-transparent p-0">
            <TabsTrigger value="company" className={tabTriggerClass}>
              Profil Perusahaan <span className="ml-1.5 rounded-full bg-slate-200 px-1.5 py-0.5 text-[10px] text-slate-700">{tabCounts.company}</span>
            </TabsTrigger>
            <TabsTrigger value="home" className={tabTriggerClass}>
              Home Page <span className="ml-1.5 rounded-full bg-slate-200 px-1.5 py-0.5 text-[10px] text-slate-700">{tabCounts.home}</span>
            </TabsTrigger>
            <TabsTrigger value="about" className={tabTriggerClass}>
              About Page <span className="ml-1.5 rounded-full bg-slate-200 px-1.5 py-0.5 text-[10px] text-slate-700">{tabCounts.about}</span>
            </TabsTrigger>
            <TabsTrigger value="contact" className={tabTriggerClass}>
              Contact Page <span className="ml-1.5 rounded-full bg-slate-200 px-1.5 py-0.5 text-[10px] text-slate-700">{tabCounts.contact}</span>
            </TabsTrigger>
            <TabsTrigger value="all" className={tabTriggerClass}>
              Semua Konten <span className="ml-1.5 rounded-full bg-slate-200 px-1.5 py-0.5 text-[10px] text-slate-700">{tabCounts.all}</span>
            </TabsTrigger>
          </TabsList>

          {contentQuery.isLoading ? (
            <div className="flex items-center gap-2 py-16 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Memuat daftar konten yang dapat diedit…
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="w-full border border-slate-900/15 bg-white p-12 text-center text-slate-500">
              <FileText className="mx-auto mb-3 h-8 w-8 text-slate-400" />
              <p className="text-sm font-semibold text-[#102239]">Tidak ada konten yang sesuai dengan filter.</p>
              {search && <p className="mt-1 text-xs">Coba kata kunci pencarian yang lain.</p>}
            </div>
          ) : (
            <div className="w-full">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void handleSaveCurrentTab();
                }}
                className="w-full overflow-hidden border border-slate-900/15 bg-white shadow-sm"
              >
                {/* Form Header */}
                <div className="border-b border-slate-900/10 px-6 py-5">
                  <h2 className="font-[DM_Serif_Display] text-3xl text-[#102239]">{currentMeta.title}</h2>
                  <p className="mt-1 text-xs text-slate-500">{currentMeta.desc}</p>
                </div>

                {/* Logo Uploader Card (Visible on Company Tab) */}
                {activeTab === "company" && (
                  <div className="border-b border-slate-900/10 bg-[#faf8f5]/60 p-6">
                    <div className="flex flex-wrap items-center justify-between gap-6">
                      <div className="flex items-center gap-5">
                        <div className="grid h-16 w-24 place-items-center rounded border border-slate-900/15 bg-white p-2 shadow-inner">
                          {logoUrl ? (
                            <img src={logoUrl} alt="Logo Preview" className="max-h-12 max-w-full object-contain" />
                          ) : (
                            <div className="flex flex-col items-center gap-1 text-slate-400">
                              <BrandMark className="h-7 w-7" />
                              <span className="text-[9px] font-bold">Logo Vektor</span>
                            </div>
                          )}
                        </div>
                        <div>
                          <h3 className="text-sm font-extrabold text-[#102239]">Logo Gambar Perusahaan (Opsional)</h3>
                          <p className="mt-0.5 text-xs text-slate-500">
                            Unggah file logo gambar (PNG, SVG, JPG, WebP). Jika kosong, situs akan menggunakan logo ikon bawaan.
                          </p>
                          {logoUrl && (
                            <p className="mt-1 max-w-sm truncate font-mono text-[10px] text-slate-400">
                              {logoUrl}
                            </p>
                          )}
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
                            <Trash2 size={13} /> Hapus Logo
                          </button>
                        )}
                        <label className="inline-flex cursor-pointer items-center gap-2 bg-[#102239] px-4 py-2 text-xs font-extrabold text-[#fffdf8] transition-transform duration-150 hover:-translate-y-0.5 disabled:opacity-50">
                          {isUploadingLogo ? <Loader2 size={14} className="animate-spin" /> : <UploadCloud size={14} />}
                          {logoUrl ? "Ganti Logo" : "Unggah Logo"}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            disabled={isUploadingLogo}
                            onChange={(e) => void handleLogoUpload(e)}
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {/* Form Body - Responsive 2-Column Side-by-Side Grid */}
                <div className="grid grid-cols-1 gap-x-6 gap-y-5 p-6 md:grid-cols-2">
                  {filteredItems.map((item) => {
                    const isModified = values[item.key] !== undefined && values[item.key] !== originalValues[item.key];
                    const isLong =
                      item.key.toLowerCase().includes("description") ||
                      item.key.toLowerCase().includes("statement") ||
                      item.key.toLowerCase().includes("body") ||
                      item.key.toLowerCase().includes("intro") ||
                      item.key.toLowerCase().includes("herotitle") ||
                      (item.value && item.value.length > 75);

                    return (
                      <div
                        className={`flex flex-col justify-between rounded border p-4 transition-colors ${
                          isLong ? "md:col-span-2" : "md:col-span-1"
                        } ${
                          isModified
                            ? "border-[#f05a43]/50 bg-[#fffdfa]"
                            : "border-slate-900/10 bg-[#faf8f5]/40 hover:border-slate-900/20"
                        }`}
                        key={item.key}
                      >
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <label htmlFor={`field-${item.key}`} className="text-xs font-extrabold text-[#102239]">
                            {formatCleanLabel(item.label)}
                          </label>
                          <div className="flex items-center gap-1.5">
                            {isModified && (
                              <span className="rounded bg-[#fff0e9] px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-[#c44735]">
                                Diedit
                              </span>
                            )}
                            <code className="hidden text-[10px] text-slate-400 sm:inline">{item.key}</code>
                          </div>
                        </div>

                        {isLong ? (
                          <textarea
                            id={`field-${item.key}`}
                            rows={3}
                            value={values[item.key] ?? ""}
                            onChange={(event) =>
                              setValues((current) => ({
                                ...current,
                                [item.key]: event.target.value,
                              }))
                            }
                            className={`w-full resize-y border bg-[#fffdf8] p-2.5 text-sm leading-6 text-[#102239] outline-none transition-colors focus:border-[#f05a43] ${
                              isModified ? "border-[#f05a43]/60" : "border-slate-900/20"
                            }`}
                          />
                        ) : (
                          <input
                            type="text"
                            id={`field-${item.key}`}
                            value={values[item.key] ?? ""}
                            onChange={(event) =>
                              setValues((current) => ({
                                ...current,
                                [item.key]: event.target.value,
                              }))
                            }
                            className={`h-10 w-full border bg-[#fffdf8] px-3 text-sm text-[#102239] outline-none transition-colors focus:border-[#f05a43] ${
                              isModified ? "border-[#f05a43]/60" : "border-slate-900/20"
                            }`}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Form Sticky Footer Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-900/15 bg-[#f6f0e6] px-6 py-4">
                  <div className="text-xs font-semibold text-slate-600">
                    {modifiedKeys.length > 0 ? (
                      <span className="text-[#c44735]">
                        <b className="font-extrabold">{modifiedKeys.length}</b> kolom teks telah diubah
                      </span>
                    ) : (
                      <span className="text-slate-500">Semua data pada tab ini tersimpan</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {modifiedKeys.length > 0 && (
                      <button
                        type="button"
                        disabled={isSaving}
                        onClick={handleResetCurrentTab}
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-600 transition-colors hover:text-[#102239] disabled:opacity-50"
                      >
                        <RotateCcw size={13} /> Batalkan
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={isSaving || modifiedKeys.length === 0}
                      className={`inline-flex items-center gap-2 px-5 py-2.5 text-xs font-extrabold transition-all disabled:cursor-not-allowed disabled:opacity-40 ${
                        modifiedKeys.length > 0
                          ? "bg-[#f05a43] text-white shadow hover:bg-[#d94833]"
                          : "bg-[#102239] text-[#fffdf8]"
                      }`}
                    >
                      {isSaving ? (
                        <>
                          <Loader2 size={14} className="animate-spin" /> Menyimpan…
                        </>
                      ) : (
                        <>
                          <Save size={14} /> Simpan Perubahan
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}
        </Tabs>
      </div>
    </AdminGuard>
  );
}
