/** Design system: Software Almanac — registry-owned covers take priority, with a graceful interface folio fallback. */
import ProductMockup from "@/components/ProductMockup";

type RegistryProductVisualProps = {
  product: { name: string; slug: string; coverUrl?: string | null };
  compact?: boolean;
  alt?: string;
};

export default function RegistryProductVisual({ product, compact = false, alt }: RegistryProductVisualProps) {
  if (product.coverUrl) return <img src={product.coverUrl} alt={alt ?? `${product.name} product cover`} className="h-full w-full object-cover" />;
  return <ProductMockup product={product} compact={compact} />;
}
