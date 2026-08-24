/** CMS product index: a compact registry table for searching, filtering, publishing, featuring, ordering, and entry into the editor. */
import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpRight, Boxes, Loader2, Pencil, Plus, Search, Star, X } from "lucide-react";
import { Link } from "wouter";
import AdminGuard from "@/pages/AdminGuard";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

type PubFilter = "all" | "draft" | "published";
type StatusFilter = "all" | "active" | "planned" | "retired";

const controlClass = "h-9 w-full border border-slate-900/20 bg-[#fffdf8] px-3 text-sm text-[#102239] outline-none transition-colors focus:border-[#f05a43]";
const labelClass = "mb-1.5 block text-[9px] font-extrabold uppercase tracking-[.14em] text-slate-500";

export default function AdminProducts() {
  const registryQuery = trpc.registry.admin.list.useQuery();
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

  return <AdminGuard><div className="mx-auto max-w-6xl">
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <span className="text-[10px] font-extrabold uppercase tracking-[.16em] text-[#f05a43]">Product Registry</span>
        <h1 className="mt-1 font-[DM_Serif_Display] text-3xl leading-tight tracking-tight text-[#102239]">Products, one source of truth.</h1>
        <p className="mt-1 text-xs leading-5 text-slate-600">Drafts stay private; publishing makes a record public across Home, Products, and its detail page.</p>
      </div>
      <Link href="/admin/products/new" className="inline-flex items-center gap-2 bg-[#102239] px-4 py-2.5 text-xs font-extrabold text-[#fffdf8]"><Plus size={15} /> Add product</Link>
    </div>

    <div className="mb-3 border border-slate-900/15 bg-white p-3 shadow-sm">
      <div className="grid gap-2 md:grid-cols-[1fr_150px_150px_auto] md:items-end">
        <div><label className={labelClass} htmlFor="registry-search">Search</label><div className="relative"><Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" /><input id="registry-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Name, slug, or category…" className={`${controlClass} pl-8`} /></div></div>
        <div><label className={labelClass} htmlFor="registry-pub">Publication</label><select id="registry-pub" value={pubFilter} onChange={(event) => setPubFilter(event.target.value as PubFilter)} className={controlClass}><option value="all">All</option><option value="published">Published</option><option value="draft">Draft</option></select></div>
        <div><label className={labelClass} htmlFor="registry-status">Product status</label><select id="registry-status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StatusFilter)} className={controlClass}><option value="all">All</option><option value="active">Active</option><option value="planned">Planned</option><option value="retired">Retired</option></select></div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setFeaturedOnly((value) => !value)} aria-pressed={featuredOnly} className={`inline-flex h-9 items-center gap-1.5 border px-3 text-xs font-extrabold transition-colors ${featuredOnly ? "border-[#f05a43] bg-[#f05a43]/10 text-[#c44735]" : "border-slate-900/20 bg-[#fffdf8] text-slate-500 hover:text-[#102239]"}`}><Star size={13} fill={featuredOnly ? "currentColor" : "none"} /> Featured</button>
          {hasActiveFilter && <button type="button" onClick={clearFilters} title="Clear all filters" className="inline-flex h-9 items-center gap-1 border border-transparent px-2 text-xs font-extrabold text-slate-500 hover:text-[#c44735]"><X size={14} /> Clear</button>}
        </div>
      </div>
    </div>

    <div className="overflow-hidden border border-slate-900/15 bg-white shadow-sm">
      {registryQuery.isLoading && <div className="flex items-center gap-2 p-6 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Loading Product Registry…</div>}
      {!registryQuery.isLoading && filtered.length === 0 && <div className="grid place-items-center gap-2 px-6 py-12 text-center">
        <Boxes size={22} className="text-slate-300" />
        <p className="text-sm font-bold text-[#102239]">{hasActiveFilter ? "No products match these filters." : "The registry is empty."}</p>
        {hasActiveFilter ? <button type="button" onClick={clearFilters} className="text-xs font-extrabold text-[#c44735] underline underline-offset-2">Clear filters</button> : <Link href="/admin/products/new" className="inline-flex items-center gap-1 text-xs font-extrabold text-[#c44735] underline underline-offset-2">Add the first product <Plus size={12} /></Link>}
      </div>}
      {filtered.map((product, index) => <div className="grid gap-3 border-b border-slate-900/10 p-3 last:border-b-0 md:grid-cols-[52px_1fr_auto_auto] md:items-center" key={product.id}>
          <div className="flex gap-1">
            <button disabled={index === 0 || reorder.isPending} type="button" onClick={() => move(index, -1)} title="Move up" className="grid h-7 w-7 place-items-center border border-slate-900/15 text-[#102239] disabled:opacity-30"><ArrowUp size={13} /></button>
            <button disabled={index === filtered.length - 1 || reorder.isPending} type="button" onClick={() => move(index, 1)} title="Move down" className="grid h-7 w-7 place-items-center border border-slate-900/15 text-[#102239] disabled:opacity-30"><ArrowDown size={13} /></button>
          </div>
          <div className="flex min-w-0 items-center gap-3">
            {product.logoUrl ? <img src={product.logoUrl} alt="" className="h-9 w-9 shrink-0 object-contain" /> : <div className="grid h-9 w-9 shrink-0 place-items-center bg-[#e8efe5] text-[#102239]"><Boxes size={16} /></div>}
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="truncate font-[DM_Serif_Display] text-lg leading-none text-[#102239]">{product.name}</h2>
                {product.featured && <span className="inline-flex items-center gap-1 bg-[#fff0e9] px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-[.1em] text-[#c44735]"><Star size={9} fill="currentColor" /> Featured</span>}
              </div>
              <p className="mt-0.5 truncate text-xs text-slate-500">/{product.slug} · {product.category} · updated {formatDistanceToNow(new Date(product.updatedAt), { addSuffix: true })}</p>
            </div>
          </div>
          <div className="flex gap-1.5">
            <span className={`px-2 py-1 text-[9px] font-extrabold uppercase tracking-[.1em] ${product.publicationStatus === "published" ? "bg-[#e8efe5] text-[#356448]" : "bg-slate-100 text-slate-500"}`}>{product.publicationStatus}</span>
            <span className="px-2 py-1 text-[9px] font-extrabold uppercase tracking-[.1em] text-slate-500">{product.productStatus}</span>
          </div>
          <Link href={`/admin/products/${product.id}`} className="inline-flex items-center justify-center gap-2 border border-[#102239] px-3 py-1.5 text-xs font-extrabold text-[#102239]">Edit <Pencil size={12} /></Link>
         </div>)}
    </div>
    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
      <span>{hasActiveFilter ? `${filtered.length} of ${products.length}` : `${products.length}`} registered product{products.length === 1 ? "" : "s"}{reorder.isPending ? " · saving order…" : ""}</span>
      <Link href="/products" className="inline-flex items-center gap-1 font-extrabold text-[#102239]">View public collection <ArrowUpRight size={13} /></Link>
    </div>
  </div></AdminGuard>;
}
