/** CMS product index: a compact registry table for searching, filtering, publishing, featuring, ordering, and entry into the editor. */
import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpRight, Boxes, Loader2, Pencil, Plus, RotateCw, Search, Star, TriangleAlert, X } from "lucide-react";
import { Link } from "wouter";
import AdminGuard from "@/pages/AdminGuard";
import { useAuth } from "@/_core/hooks/useAuth";
import { CMS_ROUTES } from "@/const";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { useAdminLocale, useT } from "@/admin/i18n";
import type { AdminPhrase } from "@/admin/phrases";

type PubFilter = "all" | "draft" | "published";
type StatusFilter = "all" | "active" | "planned" | "retired";

const controlClass = "h-8 w-full border border-[var(--line-strong)] bg-[var(--card)] px-2.5 text-sm text-[var(--ink)] outline-none transition-colors focus:border-[var(--accent)]";
const labelClass = "mb-1 block text-[9px] font-extrabold uppercase tracking-[.14em] text-[var(--ink-soft)]";
/** One shared track definition so the column header and every row can never drift apart. */
const rowTracks = "gap-x-3 gap-y-3 px-3 md:grid-cols-[52px_minmax(0,1fr)_150px_92px] md:items-center";
const headCellClass = "text-[9px] font-extrabold uppercase tracking-[.14em] text-[var(--cool-40)]";
const badgeClass = "inline-block px-2 py-1 text-center text-[9px] font-extrabold uppercase tracking-[.1em]";
/** Display labels for the status values stored on each product; the values themselves are never translated. */
const STATUS_LABEL: Record<string, AdminPhrase> = { draft: "Draft", published: "Published", active: "Active", planned: "Planned", retired: "Retired" };

export default function AdminProducts() {
  const { user } = useAuth();
  const t = useT();
  const { locale } = useAdminLocale();
  const isAdmin = user?.role === "admin";
  const registryQuery = trpc.registry.admin.list.useQuery(undefined, { enabled: isAdmin });
  const utils = trpc.useUtils();
  const reorder = trpc.registry.admin.reorder.useMutation({ onSuccess: () => { void utils.registry.admin.list.invalidate(); toast.success(t("Product order updated.")); }, onError: (error) => toast.error(error.message) });

  const [search, setSearch] = useState("");
  const [pubFilter, setPubFilter] = useState<PubFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [featuredOnly, setFeaturedOnly] = useState(false);

  const products = registryQuery.data ?? [];
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return products.filter((product) => {
      if (pubFilter !== "all" && product.publicationStatus !== pubFilter) return false;
      if (statusFilter !== "all" && product.productStatus !== statusFilter) return false;
      if (featuredOnly && !product.featured) return false;
      if (term && !`${product.name} ${product.slug} ${product.category}`.toLowerCase().includes(term)) return false;
      return true;
    });
  }, [products, search, pubFilter, statusFilter, featuredOnly]);

  const hasActiveFilter = search.trim() !== "" || pubFilter !== "all" || statusFilter !== "all" || featuredOnly;
  const clearFilters = () => { setSearch(""); setPubFilter("all"); setStatusFilter("all"); setFeaturedOnly(false); };

  const move = (filteredIndex: number, direction: -1 | 1) => {
    const current = filtered[filteredIndex];
    const neighbor = filtered[filteredIndex + direction];
    if (!current || !neighbor || reorder.isPending) return;
    const ids = products.map((product) => product.id);
    const from = ids.indexOf(current.id);
    const to = ids.indexOf(neighbor.id);
    [ids[from], ids[to]] = [ids[to], ids[from]];
    reorder.mutate({ ids });
  };

  return <AdminGuard><div className="w-full">
    <div className="mb-4 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
      <div>
        <span className="text-[10px] font-extrabold uppercase tracking-[.16em] text-[var(--accent)]">{t("Product Registry")}</span>
        <h1 className="mt-1 admin-display text-3xl leading-tight tracking-tight text-[var(--ink)]">{t("Product Registry & Catalog")}</h1>
        <p className="mt-1 text-xs leading-5 text-[var(--ink-soft)]">{t("Kelola daftar produk, status publikasi (Draft / Published), status produk, dan urutan tampilan portofolio.")}</p>
      </div>
      <Link href={CMS_ROUTES.productNew} className="inline-flex items-center gap-2 bg-[var(--ink)] px-4 py-2 text-xs font-extrabold text-[var(--lightest)]"><Plus size={14} /> {t("Add product")}</Link>
    </div>

    <div className="overflow-hidden admin-card border border-[var(--line)] bg-white shadow-sm">
      <div className="border-b border-[var(--line)] bg-white px-3 py-2.5">
        <div className="grid gap-2 md:grid-cols-[minmax(220px,340px)_132px_144px_auto] md:items-end">
          <div><label className={labelClass} htmlFor="registry-search">{t("Search")}</label><div className="relative"><Search size={13} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--cool-40)]" /><input id="registry-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t("Name, slug, or category…")} className={`${controlClass} pl-8`} /></div></div>
          <div><label className={labelClass} htmlFor="registry-pub">{t("Publication")}</label><select id="registry-pub" value={pubFilter} onChange={(event) => setPubFilter(event.target.value as PubFilter)} className={controlClass}><option value="all">{t("All")}</option><option value="published">{t("Published")}</option><option value="draft">{t("Draft")}</option></select></div>
          <div><label className={labelClass} htmlFor="registry-status">{t("Product status")}</label><select id="registry-status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StatusFilter)} className={controlClass}><option value="all">{t("All")}</option><option value="active">{t("Active")}</option><option value="planned">{t("Planned")}</option><option value="retired">{t("Retired")}</option></select></div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setFeaturedOnly((value) => !value)} aria-pressed={featuredOnly} className={`inline-flex h-8 items-center gap-1.5 border px-2.5 text-xs font-extrabold transition-colors ${featuredOnly ? "border-[var(--accent)] bg-[var(--purple-5)] text-[var(--purple-60)]" : "border-[var(--line-strong)] bg-[var(--card)] text-[var(--ink-soft)] hover:text-[var(--ink)]"}`}><Star size={12} fill={featuredOnly ? "currentColor" : "none"} /> {t("Featured")}</button>
            {hasActiveFilter && <button type="button" onClick={clearFilters} title={t("Clear all filters")} className="inline-flex h-8 items-center gap-1 border border-transparent px-1.5 text-xs font-extrabold text-[var(--ink-soft)] hover:text-[var(--purple-60)]"><X size={13} /> {t("Clear")}</button>}
          </div>
        </div>
      </div>

      {registryQuery.isLoading && <div className="flex items-center gap-2 border-b border-[var(--line)] px-3 py-4 text-sm text-[var(--ink-soft)]"><Loader2 className="h-4 w-4 animate-spin" /> {t("Loading Product Registry…")}</div>}
      {registryQuery.isError && <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-[var(--line)] px-3 py-4 text-sm text-[var(--purple-70)]">
        <TriangleAlert size={16} className="shrink-0" />
        <span className="min-w-0 flex-1">{t("The registry could not be loaded. {message}", { message: registryQuery.error.message })}</span>
        <button type="button" onClick={() => void registryQuery.refetch()} className="inline-flex h-8 items-center gap-1.5 border border-[var(--ink)] px-2.5 text-xs font-extrabold text-[var(--ink)]"><RotateCw size={13} /> {t("Try again")}</button>
      </div>}
      {!registryQuery.isLoading && !registryQuery.isError && filtered.length === 0 && <div className="grid place-items-center gap-2 border-b border-[var(--line)] px-3 py-10 text-center">
        <Boxes size={22} className="text-[var(--cool-20)]" />
        <p className="text-sm font-bold text-[var(--ink)]">{hasActiveFilter ? t("No products match these filters.") : t("The registry is empty.")}</p>
        {hasActiveFilter ? <button type="button" onClick={clearFilters} className="text-xs font-extrabold text-[var(--purple-60)] underline underline-offset-2">{t("Clear filters")}</button> : <Link href={CMS_ROUTES.productNew} className="inline-flex items-center gap-1 text-xs font-extrabold text-[var(--purple-60)] underline underline-offset-2">{t("Add the first product")} <Plus size={12} /></Link>}
      </div>}

      {filtered.length > 0 && <div aria-hidden="true" className={`hidden border-b border-[var(--line)] py-1.5 md:grid ${rowTracks}`}><span /><span className={headCellClass}>{t("Product")}</span><span className={headCellClass}>{t("Status")}</span><span /></div>}

      {filtered.map((product, index) => <div className={`grid border-b border-[var(--line)] py-2 ${rowTracks}`} key={product.id}>
          <div className="flex gap-1">
            <button disabled={index === 0 || reorder.isPending} type="button" onClick={() => move(index, -1)} aria-label={t("Move {name} up", { name: product.name })} title={t("Move up")} className="grid h-6 w-6 place-items-center admin-card border border-[var(--line)] text-[var(--ink)] disabled:opacity-30"><ArrowUp size={12} /></button>
            <button disabled={index === filtered.length - 1 || reorder.isPending} type="button" onClick={() => move(index, 1)} aria-label={t("Move {name} down", { name: product.name })} title={t("Move down")} className="grid h-6 w-6 place-items-center admin-card border border-[var(--line)] text-[var(--ink)] disabled:opacity-30"><ArrowDown size={12} /></button>
          </div>
          <div className="flex min-w-0 items-center gap-3">
            {product.logoUrl ? <img src={product.logoUrl} alt="" className="h-8 w-8 shrink-0 object-contain" /> : <div className="grid h-8 w-8 shrink-0 place-items-center bg-[var(--green-5)] text-[var(--ink)]"><Boxes size={14} /></div>}
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="truncate admin-display text-lg leading-none text-[var(--ink)]">{product.name}</h2>
                {product.featured && <span className="inline-flex items-center gap-1 bg-[var(--purple-5)] px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-[.1em] text-[var(--purple-60)]"><Star size={9} fill="currentColor" /> {t("Featured")}</span>}
              </div>
              <p className="mt-0.5 truncate text-xs text-[var(--ink-soft)]">/{product.slug} · {product.category} · {t("updated {time}", { time: formatDistanceToNow(new Date(product.updatedAt), { addSuffix: true, locale: locale === "id" ? idLocale : undefined }) })}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`${badgeClass} min-w-[74px] ${product.publicationStatus === "published" ? "bg-[var(--green-5)] text-[var(--green-60)]" : "bg-[var(--cool-5)] text-[var(--ink-soft)]"}`}>{STATUS_LABEL[product.publicationStatus] ? t(STATUS_LABEL[product.publicationStatus]) : product.publicationStatus}</span>
            <span className={`${badgeClass} min-w-[62px] admin-card border border-[var(--line)] text-[var(--ink-soft)]`}>{STATUS_LABEL[product.productStatus] ? t(STATUS_LABEL[product.productStatus]) : product.productStatus}</span>
          </div>
          <Link href={CMS_ROUTES.productEdit(product.id)} className="inline-flex w-full items-center justify-center gap-2 border border-[var(--ink)] px-3 py-1.5 text-xs font-extrabold text-[var(--ink)]">{t("Edit")} <Pencil size={12} /></Link>
        </div>)}

      <div className="flex flex-wrap items-center justify-between gap-2 bg-white px-3 py-2 text-xs text-[var(--ink-soft)]">
        <span aria-live="polite">{hasActiveFilter ? t(products.length === 1 ? "{shown} of {total} registered product" : "{shown} of {total} registered products", { shown: filtered.length, total: products.length }) : t(products.length === 1 ? "{total} registered product" : "{total} registered products", { total: products.length })}{reorder.isPending ? ` · ${t("saving order…")}` : ""}</span>
        <Link href="/products" className="inline-flex items-center gap-1 font-extrabold text-[var(--ink)]">{t("View public collection")} <ArrowUpRight size={13} /></Link>
      </div>
    </div>
  </div></AdminGuard>;
}
