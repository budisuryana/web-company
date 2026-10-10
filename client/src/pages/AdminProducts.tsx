/** CMS product index: a compact registry table for searching, filtering, publishing, featuring, ordering, and entry into the editor. */
import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpRight, Boxes, Pencil, Plus, Search, Star, X } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { CMS_ROUTES } from "@/const";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { useAdminLocale, useT } from "@/admin/i18n";
import type { AdminPhrase } from "@/admin/phrases";
import { Badge, Button, Card, EmptyState, ErrorState, LoadingState, PageHead, Tile, btn, type Tone } from "@/studio/ui";

type PubFilter = "all" | "draft" | "published";
type StatusFilter = "all" | "active" | "planned" | "retired";

/** One shared track definition so the column header and every row can never drift apart. */
const rowTracks = "gap-x-3 gap-y-3 px-3.5 md:grid-cols-[60px_minmax(0,1fr)_190px_92px] md:items-center";
/** Display labels for the status values stored on each product; the values themselves are never translated. */
const STATUS_LABEL: Record<string, AdminPhrase> = { draft: "Draft", published: "Published", active: "Active", planned: "Planned", retired: "Retired" };
const STATUS_TONE: Record<string, Tone> = { active: "accent", planned: "teal", retired: "outline" };

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

  return <>
    <PageHead
      title={t("Katalog Produk")}
      description={t("Kelola daftar produk, status publikasi (Draft / Published), status produk, dan urutan tampilan portofolio.")}
      actions={<Link href={CMS_ROUTES.productNew} className={btn("primary")}><Plus aria-hidden="true" /> {t("Add product")}</Link>}
    />

    <Card>
      <div className="hq-toolbar">
        <div className="hq-field min-w-[220px] flex-1 md:max-w-[340px]">
          <label className="sr-only" htmlFor="registry-search">{t("Search")}</label>
          <span className="hq-input-icon"><Search aria-hidden="true" /><input id="registry-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t("Name, slug, or category…")} className="hq-input" /></span>
        </div>
        <label className="hq-inline-field" htmlFor="registry-pub"><span>{t("Publication")}</span><select id="registry-pub" value={pubFilter} onChange={(event) => setPubFilter(event.target.value as PubFilter)} className="hq-select"><option value="all">{t("All")}</option><option value="published">{t("Published")}</option><option value="draft">{t("Draft")}</option></select></label>
        <label className="hq-inline-field" htmlFor="registry-status"><span>{t("Product status")}</span><select id="registry-status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StatusFilter)} className="hq-select"><option value="all">{t("All")}</option><option value="active">{t("Active")}</option><option value="planned">{t("Planned")}</option><option value="retired">{t("Retired")}</option></select></label>
        <button type="button" onClick={() => setFeaturedOnly((value) => !value)} aria-pressed={featuredOnly} className="hq-chip"><Star aria-hidden="true" fill={featuredOnly ? "currentColor" : "none"} /> {t("Featured")}</button>
        {hasActiveFilter && <Button variant="ghost" size="sm" icon={X} onClick={clearFilters} title={t("Clear all filters")}>{t("Clear")}</Button>}
      </div>

      {registryQuery.isLoading && <LoadingState>{t("Loading Product Registry…")}</LoadingState>}
      {registryQuery.isError && <ErrorState onRetry={() => void registryQuery.refetch()}>{t("The registry could not be loaded. {message}", { message: registryQuery.error.message })}</ErrorState>}
      {!registryQuery.isLoading && !registryQuery.isError && filtered.length === 0 && <EmptyState
        icon={Boxes}
        title={hasActiveFilter ? t("No products match these filters.") : t("The registry is empty.")}
        action={hasActiveFilter ? <Button size="sm" icon={X} onClick={clearFilters}>{t("Clear filters")}</Button> : <Link href={CMS_ROUTES.productNew} className={btn("primary", "sm")}><Plus aria-hidden="true" /> {t("Add the first product")}</Link>}
      />}

      {filtered.length > 0 && <div aria-hidden="true" className={`hq-grid-head hidden py-2 md:grid ${rowTracks}`}><span /><span>{t("Product")}</span><span>{t("Status")}</span><span /></div>}

      {filtered.map((product, index) => <div className={`hq-product-row grid ${rowTracks}`} key={product.id}>
          <div className="flex gap-1">
            <Button size="sm" iconOnly icon={ArrowUp} disabled={index === 0 || reorder.isPending} onClick={() => move(index, -1)} aria-label={t("Move {name} up", { name: product.name })} title={t("Move up")} />
            <Button size="sm" iconOnly icon={ArrowDown} disabled={index === filtered.length - 1 || reorder.isPending} onClick={() => move(index, 1)} aria-label={t("Move {name} down", { name: product.name })} title={t("Move down")} />
          </div>
          <div className="flex min-w-0 items-center gap-3">
            {product.logoUrl ? <img src={product.logoUrl} alt="" className="hq-product-logo" /> : <Tile icon={Boxes} hue="teal" large />}
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="hq-product-name truncate">{product.name}</h2>
                {product.featured && <Badge tone="warning" icon={Star}>{t("Featured")}</Badge>}
              </div>
              <div className="hq-m truncate">/{product.slug} · {product.category} · {t("updated {time}", { time: formatDistanceToNow(new Date(product.updatedAt), { addSuffix: true, locale: locale === "id" ? idLocale : undefined }) })}</div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge tone={product.publicationStatus === "published" ? "success" : "neutral"} dot>{STATUS_LABEL[product.publicationStatus] ? t(STATUS_LABEL[product.publicationStatus]) : product.publicationStatus}</Badge>
            <Badge tone={STATUS_TONE[product.productStatus] ?? "outline"}>{STATUS_LABEL[product.productStatus] ? t(STATUS_LABEL[product.productStatus]) : product.productStatus}</Badge>
          </div>
          <Link href={CMS_ROUTES.productEdit(product.id)} className={btn("default", "sm", "w-full")}><Pencil aria-hidden="true" /> {t("Edit")}</Link>
        </div>)}

      <div className="hq-card-foot">
        <span aria-live="polite">{hasActiveFilter ? t(products.length === 1 ? "{shown} of {total} registered product" : "{shown} of {total} registered products", { shown: filtered.length, total: products.length }) : t(products.length === 1 ? "{total} registered product" : "{total} registered products", { total: products.length })}{reorder.isPending ? ` · ${t("saving order…")}` : ""}</span>
        <Link href="/products" className="hq-link ml-auto inline-flex items-center gap-1">{t("View public collection")} <ArrowUpRight size={13} aria-hidden="true" /></Link>
      </div>
    </Card>
  </>;
}
