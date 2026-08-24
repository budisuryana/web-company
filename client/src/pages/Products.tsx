/** Design system: Software Almanac — the public catalog is a registry-driven archive whose visual rhythm remains editorial. */
import { ArrowUpRight, Loader2 } from "lucide-react";
import { Link } from "wouter";
import RegistryProductVisual from "@/components/RegistryProductVisual";
import SiteShell from "@/components/SiteShell";
import { trpc } from "@/lib/trpc";

export default function Products() {
  const productsQuery = trpc.registry.public.list.useQuery();
  const products = productsQuery.data ?? [];
  return <SiteShell><main className="products-page"><section className="page-hero products-hero"><div><span className="section-label"><i /> The product collection</span><h1>Software that helps<br />work find its <em>shape.</em></h1></div><p>Focused products, each designed around a place where process usually loses clarity: people, decisions, delivery, documents, and content.</p></section><section className="product-archive">{productsQuery.isLoading && <div className="flex items-center gap-2 py-16 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Loading the Product Registry…</div>}{products.map((product, index) => <article className={`archive-product archive-${index}`} key={product.id}><div className="archive-meta"><span>{String(index + 1).padStart(2, "0")}</span><span>{product.category}</span></div><div className="archive-copy"><h2>{product.name}</h2><p>{product.shortDescription}</p><div className="archive-problem"><span>Designed for</span><p>{product.targetUsers}</p></div><Link href={`/products/${product.slug}`} className="text-link">Explore product <ArrowUpRight size={16} /></Link></div><div className="archive-visual"><RegistryProductVisual product={product} alt={`${product.name} cover`} /></div></article>)}</section><section className="mini-cta"><p>Looking for a clearer way through a complex workflow?</p><Link href="/contact" className="button button-ink">Let’s talk <ArrowUpRight size={17} /></Link></section></main></SiteShell>;
}
