/** Design system: Software Almanac — a simple, calm escape route that keeps the brand voice intact. */
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import SiteShell from "@/components/SiteShell";

export default function NotFound() {
  return <SiteShell><main className="not-found"><span className="section-label"><i /> 404</span><h1>This page<br />lost its <em>thread.</em></h1><p>The path you followed is not here, but the rest of the workshop is.</p><Link href="/" className="button button-ink"><ArrowLeft size={17} /> Back home</Link></main></SiteShell>;
}
