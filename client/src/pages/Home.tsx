/** Design system: Software Almanac — the public homepage now reads all product and primary-copy content from the Product Registry. */
import { ArrowDownRight, ArrowUpRight, Check, ChevronRight, Loader2 } from "lucide-react";
import { Link } from "wouter";
import RegistryProductVisual from "@/components/RegistryProductVisual";
import SiteShell from "@/components/SiteShell";
import { trpc } from "@/lib/trpc";

function contentMap(items: Array<{ key: string; value: string }> | undefined) {
  return Object.fromEntries((items ?? []).map((item) => [item.key, item.value]));
}

export default function Home() {
  const productsQuery = trpc.registry.public.list.useQuery();
  const contentQuery = trpc.registry.public.siteContent.useQuery();
  const products = productsQuery.data ?? [];
  const featuredProducts = products.filter((product) => product.featured).slice(0, 3);
  const heroProduct = products.find((product) => product.slug === "kontenjadi") ?? products[0];
  const content = contentMap(contentQuery.data);

  return <SiteShell><main>
    <section className="hero-home section-rule">
      <div className="home-hero-copy"><span className="section-label"><i /> {content["home.heroEyebrow"] ?? "Loading site content"}</span><h1>{content["home.heroTitle"] ?? "A calmer place for useful software."}</h1><p>{content["home.heroDescription"] ?? "The product catalog is loading."}</p><div className="hero-actions"><Link href="/products" className="button button-ink">Explore our products <ArrowUpRight size={17} /></Link><a className="text-link" href="#story">Why we build <ArrowDownRight size={16} /></a></div></div>
      <div className="home-hero-visual" aria-label="A featured product interface from Workshop Collective"><span className="visual-index">[ product registry ]</span>{heroProduct ? <><div className="hero-folio hero-folio-back"><RegistryProductVisual product={products[2] ?? heroProduct} compact /></div><div className="hero-folio hero-folio-mid"><RegistryProductVisual product={products[1] ?? heroProduct} compact /></div><div className="hero-folio hero-folio-front"><RegistryProductVisual product={heroProduct} alt={`${heroProduct.name} interface`} /></div></> : <div className="flex h-full items-center justify-center text-sm text-slate-500"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading product registry</div>}<span className="folio-note note-left">From complexity<br />to a clear next step.</span><span className="folio-note note-bottom">A product portfolio<br />for work in motion.</span></div>
      <div className="hero-footnote"><span>Scroll to explore</span><i /></div>
    </section>

    <section className="featured-section" id="story">
      <div className="section-intro split-intro"><div><span className="section-label"><i /> 01 / selected products</span><h2>{content["home.featuredHeading"] ?? "Built around real work."}</h2></div><p>Most work does not fail because teams lack tools. It becomes harder when the context gets lost between them. Our products are designed to keep the thread visible.</p></div>
      <div className="feature-list">{productsQuery.isLoading ? <div className="py-14 text-sm text-slate-500">Loading the Product Registry…</div> : featuredProducts.map((product, index) => <article className="feature-row" key={product.id}><div className="feature-index">{String(index + 1).padStart(2, "0")}</div><div className="feature-copy"><span>{product.category}</span><h3>{product.name}</h3><p>{product.shortDescription}</p><Link href={`/products/${product.slug}`} className="text-link">Explore product <ArrowUpRight size={15} /></Link></div><div className="feature-visual"><RegistryProductVisual product={product} compact /></div></article>)}</div>
      <div className="centered-action"><Link href="/products" className="button button-outline">See all products <ChevronRight size={16} /></Link></div>
    </section>

    <section className="principle-band"><div className="principle-eyebrow">Our point of view</div><div className="principle-message"><p>Build useful software.<br /><em>Solve real problems.</em><br />Keep things simple.</p><span>We are an independent product company. That means we can stay close to the details that make work feel needlessly difficult—and keep refining until the path is clearer.</span></div><div className="principle-stamp"><b>W</b><small>made with<br />intention</small></div></section>

    <section className="showcase-section">{heroProduct && <><div className="showcase-copy"><span className="section-label"><i /> A closer look</span><h2>{heroProduct.heroHeadline}</h2><p>{heroProduct.fullDescription}</p><div className="workflow-pills">{heroProduct.workflowSteps.map((step, index) => <span key={step.title}><b>{String(index + 1).padStart(2, "0")}</b>{step.title}</span>)}</div><Link href={`/products/${heroProduct.slug}`} className="button button-coral">Explore {heroProduct.name} <ArrowUpRight size={17} /></Link></div><div className="showcase-visual"><span className="visual-index">[ featured / {heroProduct.name} ]</span><RegistryProductVisual product={heroProduct} alt={`${heroProduct.name} preview`} /><div className="visual-caption"><span>Product workflow, connected</span><span>Registry-driven content</span></div></div></>}</section>

    <section className="working-method"><div className="method-heading"><span className="section-label"><i /> 03 / how we build</span><h2>Useful is a<br /><em>high bar.</em></h2></div><div className="method-items">{[{ no: "01", title: "Stay with the problem", body: "We begin by understanding the work around the work—the hand-offs, small doubts, and repeated checking that sap energy." }, { no: "02", title: "Give context a home", body: "A great product remembers what a task means, not only where it sits on a list." }, { no: "03", title: "Remove without losing", body: "We simplify interfaces with care: no important nuance disappears just because a screen looks cleaner." }].map((item) => <article className="method-item" key={item.no}><span>{item.no}</span><div><h3>{item.title}</h3><p>{item.body}</p></div><Check size={18} /></article>)}</div></section>
    <section className="closing-cta"><span className="plate-index">[ 04 / a clear next step ]</span><span className="section-label"><i /> An independent product company</span><h2>There is a simpler<br />way to <em>move work</em><br />forward.</h2><Link href="/contact" className="button button-light">Start a conversation <ArrowUpRight size={17} /></Link><span className="cta-corner">Workshop<br />Collective</span><span className="plate-rule" /></section>
  </main></SiteShell>;
}
