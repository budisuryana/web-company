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

type PubFilter = "all" | "draft" | "published";
type StatusFilter = "all" | "active" | "planned" | "retired";

const controlClass = "h-8 w-full border border-slate-900/20 bg-[#fffdf8] px-2.5 text-sm text-[#102239] outline-none transition-colors focus:border-[#f05a43]";
const labelClass = "mb-1 block text-[9px] font-extrabold uppercase tracking-[.14em] text-slate-500";
/** One shared track definition so the column header and every row can never drift apart. */
const rowTracks = "gap-x-3 gap-y-3 px-3 md:grid-cols-[52px_minmax(0,1fr)_150px_92px] md:items-center";
const headCellClass = "text-[9px] font-extrabold uppercase tracking-[.14em] text-slate-400";
const badgeClass = "inline-block px-2 py-1 text-center text-[9px] font-extrabold uppercase tracking-[.1em]";

export default function AdminProducts() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const registryQuery = trpc.registry.admin.list.useQuery(undefined, { enabled: isAdmin });
  const utils = trpc.useUtils();
  const reorder = trpc.registry.admin.reorder.useMutation({ onSuccess: () => { void utils.registry.admin.list.invalidate(); toast.success("Product order updated."); }, onError: (error) => toast.error(error.message) });

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
        <span className="text-[10px] font-extrabold uppercase tracking-[.16em] text-[#f05a43]">Product Registry</span>
        <h1 className="mt-1 font-[DM_Serif_Display] text-3xl leading-tight tracking-tight text-[#102239]">Product Registry &amp; Catalog</h1>
        <p className="mt-1 text-xs leading-5 text-slate-600">Kelola daftar produk, status publikasi (Draft / Published), status produk, dan urutan tampilan portofolio.</p>
      </div>
      <Link href={CMS_ROUTES.productNew} className="inline-flex items-center gap-2 bg-[#102239] px-4 py-2 text-xs font-extrabold text-[#fffdf8]"><Plus size={14} /> Add product</Link>
    </div>

    <div className="overflow-hidden border border-slate-900/15 bg-white shadow-sm">
      <div className="border-b border-slate-900/15 bg-white px-3 py-2.5">
        <div className="grid gap-2 md:grid-cols-[minmax(220px,340px)_132px_144px_auto] md:items-end">
          <div><label className={labelClass} htmlFor="registry-search">Search</label><div className="relative"><Search size={13} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" /><input id="registry-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Name, slug, or category…" className={`${controlClass} pl-8`} /></div></div>
          <div><label className={labelClass} htmlFor="registry-pub">Publication</label><select id="registry-pub" value={pubFilter} onChange={(event) => setPubFilter(event.target.value as PubFilter)} className={controlClass}><option value="all">All</option><option value="published">Published</option><option value="draft">Draft</option></select></div>
          <div><label className={labelClass} htmlFor="registry-status">Product status</label><select id="registry-status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StatusFilter)} className={controlClass}><option value="all">All</option><option value="active">Active</option><option value="planned">Planned</option><option value="retired">Retired</option></select></div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setFeaturedOnly((value) => !value)} aria-pressed={featuredOnly} className={`inline-flex h-8 items-center gap-1.5 border px-2.5 text-xs font-extrabold transition-colors ${featuredOnly ? "border-[#f05a43] bg-[#f05a43]/10 text-[#c44735]" : "border-slate-900/20 bg-[#fffdf8] text-slate-500 hover:text-[#102239]"}`}><Star size={12} fill={featuredOnly ? "currentColor" : "none"} /> Featured</button>
            {hasActiveFilter && <button type="button" onClick={clearFilters} title="Clear all filters" className="inline-flex h-8 items-center gap-1 border border-transparent px-1.5 text-xs font-extrabold text-slate-500 hover:text-[#c44735]"><X size={13} /> Clear</button>}
          </div>
        </div>
      </div>

      {registryQuery.isLoading && <div className="flex items-center gap-2 border-b border-slate-900/10 px-3 py-4 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Loading Product Registry…</div>}
      {registryQuery.isError && <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-slate-900/10 px-3 py-4 text-sm text-[#8b2c20]">
        <TriangleAlert size={16} className="shrink-0" />
        <span className="min-w-0 flex-1">The registry could not be loaded. {registryQuery.error.message}</span>
        <button type="button" onClick={() => void registryQuery.refetch()} className="inline-flex h-8 items-center gap-1.5 border border-[#102239] px-2.5 text-xs font-extrabold text-[#102239]"><RotateCw size={13} /> Try again</button>
      </div>}
      {!registryQuery.isLoading && !registryQuery.isError && filtered.length === 0 && <div className="grid place-items-center gap-2 border-b border-slate-900/10 px-3 py-10 text-center">
        <Boxes size={22} className="text-slate-300" />
        <p className="text-sm font-bold text-[#102239]">{hasActiveFilter ? "No products match these filters." : "The registry is empty."}</p>
        {hasActiveFilter ? <button type="button" onClick={clearFilters} className="text-xs font-extrabold text-[#c44735] underline underline-offset-2">Clear filters</button> : <Link href={CMS_ROUTES.productNew} className="inline-flex items-center gap-1 text-xs font-extrabold text-[#c44735] underline underline-offset-2">Add the first product <Plus size={12} /></Link>}
      </div>}

      {filtered.length > 0 && <div aria-hidden="true" className={`hidden border-b border-slate-900/10 py-1.5 md:grid ${rowTracks}`}><span /><span className={headCellClass}>Product</span><span className={headCellClass}>Status</span><span /></div>}

      {filtered.map((product, index) => <div className={`grid border-b border-slate-900/10 py-2 ${rowTracks}`} key={product.id}>
          <div className="flex gap-1">
            <button disabled={index === 0 || reorder.isPending} type="button" onClick={() => move(index, -1)} aria-label={`Move ${product.name} up`} title="Move up" className="grid h-6 w-6 place-items-center border border-slate-900/15 text-[#102239] disabled:opacity-30"><ArrowUp size={12} /></button>
            <button disabled={index === filtered.length - 1 || reorder.isPending} type="button" onClick={() => move(index, 1)} aria-label={`Move ${product.name} down`} title="Move down" className="grid h-6 w-6 place-items-center border border-slate-900/15 text-[#102239] disabled:opacity-30"><ArrowDown size={12} /></button>
          </div>
          <div className="flex min-w-0 items-center gap-3">
            {product.logoUrl ? <img src={product.logoUrl} alt="" className="h-8 w-8 shrink-0 object-contain" /> : <div className="grid h-8 w-8 shrink-0 place-items-center bg-[#e8efe5] text-[#102239]"><Boxes size={14} /></div>}
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="truncate font-[DM_Serif_Display] text-lg leading-none text-[#102239]">{product.name}</h2>
                {product.featured && <span className="inline-flex items-center gap-1 bg-[#fff0e9] px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-[.1em] text-[#c44735]"><Star size={9} fill="currentColor" /> Featured</span>}
              </div>
              <p className="mt-0.5 truncate text-xs text-slate-500">/{product.slug} · {product.category} · updated {formatDistanceToNow(new Date(product.updatedAt), { addSuffix: true })}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`${badgeClass} min-w-[74px] ${product.publicationStatus === "published" ? "bg-[#e8efe5] text-[#356448]" : "bg-slate-100 text-slate-500"}`}>{product.publicationStatus}</span>
            <span className={`${badgeClass} min-w-[62px] border border-slate-900/15 text-slate-600`}>{product.productStatus}</span>
          </div>
          <Link href={CMS_ROUTES.productEdit(product.id)} className="inline-flex w-full items-center justify-center gap-2 border border-[#102239] px-3 py-1.5 text-xs font-extrabold text-[#102239]">Edit <Pencil size={12} /></Link>
        </div>)}

      <div className="flex flex-wrap items-center justify-between gap-2 bg-white px-3 py-2 text-xs text-slate-500">
        <span aria-live="polite">{hasActiveFilter ? `${filtered.length} of ${products.length}` : `${products.length}`} registered product{products.length === 1 ? "" : "s"}{reorder.isPending ? " · saving order…" : ""}</span>
        <Link href="/products" className="inline-flex items-center gap-1 font-extrabold text-[#102239]">View public collection <ArrowUpRight size={13} /></Link>
      </div>
    </div>
  </div></AdminGuard>;
}
