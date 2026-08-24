/** CMS site copy editor: unified single-form per tab (Home, About, Contact, All) with batch save. */
import { useEffect, useMemo, useState } from "react";
import { Check, FileText, Loader2, RotateCcw, Save, Search } from "lucide-react";
import AdminGuard from "@/pages/AdminGuard";
import { useAuth } from "@/_core/hooks/useAuth";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const tabTriggerClass = "rounded-none border-b-2 border-transparent px-2 pb-3 pt-2 text-xs font-extrabold uppercase tracking-[.14em] text-slate-400 transition-colors hover:text-[#102239] data-[state=active]:border-[#f05a43] data-[state=active]:bg-transparent data-[state=active]:text-[#102239] data-[state=active]:shadow-none";

const tabMeta: Record<string, { title: string; desc: string }> = {
  company: {
    title: "Profil & Identitas Perusahaan",
    desc: "Nama perusahaan, logo teks (wordmark), moto footer, alamat kantor Bandung, email resmi, dan media sosial.",
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

export default function AdminContent() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const contentQuery = trpc.registry.admin.siteContent.useQuery(undefined, { enabled: isAdmin });
  const utils = trpc.useUtils();
  const [values, setValues] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState("company");
  const [search, setSearch] = useState("");
  const [isSaving, setIsSaving] = useState(false);

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

  const tabCounts = useMemo(() => {
    const company = originalItems.filter((i) => i.key.startsWith("company.")).length;
    const home = originalItems.filter((i) => i.key.startsWith("home.")).length;
    const about = originalItems.filter((i) => i.key.startsWith("about.")).length;
    const contact = originalItems.filter((i) => i.key.startsWith("contact.")).length;
    return { all: originalItems.length, company, home, about, contact };
  }, [originalItems]);

  const filteredItems = useMemo(() => {
    const term = search.trim().toLowerCase();
    return originalItems.filter((item) => {
      if (activeTab === "company" && !item.key.startsWith("company.")) return false;
      if (activeTab === "home" && !item.key.startsWith("home.")) return false;
      if (activeTab === "about" && !item.key.startsWith("about.")) return false;
      if (activeTab === "contact" && !item.key.startsWith("contact.")) return false;
      if (term && !`${item.label} ${item.key} ${item.value}`.toLowerCase().includes(term)) return false;
      return true;
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
            <div className="max-w-3xl border border-slate-900/15 bg-white p-12 text-center text-slate-500">
              <FileText className="mx-auto mb-3 h-8 w-8 text-slate-400" />
              <p className="text-sm font-semibold text-[#102239]">Tidak ada konten yang sesuai dengan filter.</p>
              {search && <p className="mt-1 text-xs">Coba kata kunci pencarian yang lain.</p>}
            </div>
          ) : (
            <div className="max-w-3xl">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void handleSaveCurrentTab();
                }}
                className="overflow-hidden border border-slate-900/15 bg-white shadow-sm"
              >
                {/* Form Header */}
                <div className="border-b border-slate-900/10 px-6 py-5">
                  <h2 className="font-[DM_Serif_Display] text-3xl text-[#102239]">{currentMeta.title}</h2>
                  <p className="mt-1 text-xs text-slate-500">{currentMeta.desc}</p>
                </div>

                {/* Form Body - All Fields in One Form Container */}
                <div className="divide-y divide-slate-900/10 px-6 py-2">
                  {filteredItems.map((item) => {
                    const isModified = values[item.key] !== undefined && values[item.key] !== originalValues[item.key];
                    return (
                      <div className="py-5" key={item.key}>
                        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                          <label htmlFor={`field-${item.key}`} className="text-xs font-extrabold text-[#102239]">
                            {item.label}
                          </label>
                          <div className="flex items-center gap-2">
                            {isModified && (
                              <span className="rounded bg-[#fff0e9] px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-[#c44735]">
                                Diedit
                              </span>
                            )}
                            <code className="text-[10px] text-slate-400">{item.key}</code>
                          </div>
                        </div>
                        <textarea
                          id={`field-${item.key}`}
                          rows={item.value.length > 120 ? 4 : 2}
                          value={values[item.key] ?? ""}
                          onChange={(event) =>
                            setValues((current) => ({
                              ...current,
                              [item.key]: event.target.value,
                            }))
                          }
                          className={`w-full resize-y border bg-[#fffdf8] p-3 text-sm leading-6 text-[#102239] outline-none transition-colors focus:border-[#f05a43] ${
                            isModified ? "border-[#f05a43]/60 bg-[#fffdfa]" : "border-slate-900/20"
                          }`}
                        />
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
