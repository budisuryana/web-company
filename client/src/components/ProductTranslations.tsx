/**
 * Product copy per language for the CMS editor: each field shows English and
 * Indonesian side by side. A value equal to its default is not stored, so the
 * product keeps following its columns and the code presentation until edited.
 */
import { RotateCcw } from "lucide-react";
import {
  PRODUCT_COPY_FIELDS,
  defaultProductCopy,
  looksLikeDevelopmentUrl,
  productCtaMode,
  type ProductCopy,
  type ProductCopyField,
  type ProductTranslations,
} from "@shared/i18n/products";

type Locale = "en" | "id";
export type ProductCta = "try" | "demo" | null;

const LOCALES: Array<{ id: Locale; label: string }> = [
  { id: "en", label: "English" },
  { id: "id", label: "Indonesia" },
];

const FIELD_META: Record<ProductCopyField, { label: string; rows: number; max: number; hint?: string }> = {
  name: { label: "Nama produk", rows: 1, max: 160 },
  category: { label: "Kategori", rows: 1, max: 160 },
  shortDescription: { label: "Deskripsi singkat", rows: 2, max: 600 },
  heroHeadline: { label: "Headline halaman produk", rows: 2, max: 600 },
  fullDescription: { label: "Deskripsi lengkap", rows: 3, max: 2000 },
  problem: { label: "Tantangan", rows: 3, max: 2000 },
  solution: { label: "Solusi", rows: 3, max: 2000 },
  outcome: { label: "Hasil", rows: 3, max: 2000 },
  targetUsers: { label: "Target pengguna", rows: 2, max: 1000 },
  capabilities: { label: "Kapabilitas", rows: 6, max: 200, hint: "Satu kapabilitas per baris (maks. 12)." },
  workflowSteps: { label: "Alur kerja", rows: 6, max: 600, hint: "Satu langkah per baris: Judul | Penjelasan (maks. 8)." },
};

type CopySource = { slug: string } & ProductCopy;


function asText(field: ProductCopyField, value: ProductCopy[ProductCopyField] | undefined): string {
  if (value === undefined) return "";
  if (field === "capabilities") return (value as string[]).join("\n");
  if (field === "workflowSteps") return (value as ProductCopy["workflowSteps"]).map((step) => `${step.title} | ${step.copy}`).join("\n");
  return value as string;
}

function fromText(field: ProductCopyField, text: string): ProductCopy[ProductCopyField] {
  if (field === "capabilities") return text.split("\n").map((line) => line.trim()).filter(Boolean);
  if (field === "workflowSteps") {
    return text
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [title, ...copy] = line.split("|");
        return { title: title.trim(), copy: copy.join("|").trim() };
      });
  }
  return text;
}

/** Problems that would make the server reject the copy, keyed "locale:field". */
export function translationProblems(translations: ProductTranslations): Record<string, string> {
  const problems: Record<string, string> = {};
  for (const { id: locale } of LOCALES) {
    const copy = translations[locale] ?? {};
    for (const field of PRODUCT_COPY_FIELDS) {
      const value = copy[field];
      if (value === undefined) continue;
      const meta = FIELD_META[field];
      if (field === "capabilities") {
        const items = value as string[];
        if (items.length > 12) problems[`${locale}:${field}`] = "Maksimal 12 kapabilitas.";
        else if (items.some((item) => item.length > meta.max)) problems[`${locale}:${field}`] = `Setiap baris maksimal ${meta.max} karakter.`;
      } else if (field === "workflowSteps") {
        const steps = value as ProductCopy["workflowSteps"];
        if (steps.length > 8) problems[`${locale}:${field}`] = "Maksimal 8 langkah.";
        else if (steps.some((step) => !step.title || !step.copy)) problems[`${locale}:${field}`] = "Tulis setiap langkah sebagai: Judul | Penjelasan.";
        else if (steps.some((step) => step.title.length > 120 || step.copy.length > meta.max)) problems[`${locale}:${field}`] = "Judul maks. 120 dan penjelasan maks. 600 karakter.";
      } else if ((value as string).trim().length > meta.max) {
        problems[`${locale}:${field}`] = `Maksimal ${meta.max} karakter.`;
      }
    }
  }
  return problems;
}

export default function ProductTranslationsPanel({
  source,
  demoUrl,
  translations,
  primaryCta,
  onChange,
  onCtaChange,
}: {
  /** The product's own columns as currently in the form (Indonesian). */
  source: CopySource;
  demoUrl: string;
  translations: ProductTranslations;
  primaryCta: ProductCta;
  onChange: (next: ProductTranslations) => void;
  onCtaChange: (next: ProductCta) => void;
}) {
  const defaults = { en: defaultProductCopy(source, "en"), id: defaultProductCopy(source, "id") };
  const codeCta = productCtaMode(source.slug) === "app" ? "try" : "demo";
  const effectiveCta = primaryCta ?? codeCta;
  const problems = translationProblems(translations);

  const setValue = (locale: Locale, field: ProductCopyField, text: string) => {
    const next: ProductTranslations = { ...translations, [locale]: { ...(translations[locale] ?? {}) } };
    const copy = next[locale]!;
    const value = fromText(field, text);
    // Matching the default (or emptying the field) means "use the default".
    if (!text.trim() || asText(field, value) === asText(field, defaults[locale][field])) delete copy[field];
    else (copy as Record<string, unknown>)[field] = value;
    if (!Object.keys(copy).length) delete next[locale];
    onChange(next);
  };

  return (
    <section className="admin-card border border-[var(--line)] bg-white p-6 shadow-sm">
      <h2 className="admin-display text-3xl text-[var(--ink)]">Konten EN / ID</h2>
      <p className="mt-1 text-xs text-[var(--ink-soft)]">
        Teks produk per bahasa. Kolom yang belum diubah memakai teks bawaan (kolom produk dan terjemahan yang sudah ada). Disimpan bersama tombol Save product, dan langsung tampil di website.
      </p>

      <fieldset className="mt-6 rounded border border-[var(--line)] bg-[var(--warm-2)] p-4">
        <legend className="px-1 text-xs font-extrabold text-[var(--ink)]">Tombol utama</legend>
        <div className="mt-1 flex flex-wrap gap-4 text-sm text-[var(--ink)]">
          {([
            [null, `Bawaan (${codeCta === "try" ? "Try" : "Request a Demo"})`],
            ["try", "Try — buka aplikasi (demo URL)"],
            ["demo", "Request a Demo — ke formulir kontak"],
          ] as Array<[ProductCta, string]>).map(([value, label]) => (
            <label key={String(value)} className="inline-flex items-center gap-2">
              <input type="radio" name="primary-cta" checked={primaryCta === value} onChange={() => onCtaChange(value)} />
              {label}
            </label>
          ))}
        </div>
        {effectiveCta === "try" && !demoUrl.trim() && (
          <p className="mt-2 text-[11px] font-semibold text-[var(--orange-60)]">
            Demo URL masih kosong, jadi website tetap menampilkan Request a Demo sampai URL diisi.
          </p>
        )}
        {effectiveCta === "try" && looksLikeDevelopmentUrl(demoUrl) && (
          <p className="mt-2 text-[11px] font-semibold text-red-700" role="alert">
            Demo URL ({demoUrl}) terlihat seperti URL development. Dengan pilihan Try, URL ini akan tampil di website publik.
          </p>
        )}
      </fieldset>

      <div className="mt-6 space-y-4">
        {PRODUCT_COPY_FIELDS.map((field) => {
          const meta = FIELD_META[field];
          return (
            <div key={field} className="rounded border border-[var(--line)] bg-[var(--warm-2)] p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-extrabold text-[var(--ink)]">{meta.label}</span>
                {meta.hint && <span className="text-[11px] text-[var(--ink-soft)]">{meta.hint}</span>}
              </div>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {LOCALES.map(({ id: locale, label }) => {
                  const override = translations[locale]?.[field];
                  const value = asText(field, override ?? defaults[locale][field]);
                  const problem = problems[`${locale}:${field}`];
                  const fieldId = `product-${locale}-${field}`;
                  const className = `w-full border bg-[var(--card)] px-3 py-2 text-sm leading-6 text-[var(--ink)] outline-none focus:border-[var(--accent)] ${
                    problem ? "border-red-500" : override !== undefined ? "border-[var(--purple-30)]" : "border-[var(--line-strong)]"
                  }`;
                  return (
                    <div key={locale} className="flex flex-col gap-1.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <label htmlFor={fieldId} className="text-[11px] font-bold uppercase tracking-wide text-[var(--ink-soft)]">{label}</label>
                        <span className="flex items-center gap-1.5">
                          <span className={`rounded px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wide ${override !== undefined ? "bg-[var(--blue-5)] text-[var(--blue-60)]" : "bg-[var(--cool-10)] text-[var(--ink-soft)]"}`}>
                            {override !== undefined ? "Diubah" : "Bawaan"}
                          </span>
                          {override !== undefined && (
                            <button type="button" onClick={() => setValue(locale, field, "")} className="inline-flex items-center gap-1 text-[11px] font-bold text-[var(--ink-soft)] hover:text-[var(--ink)] hover:underline">
                              <RotateCcw size={11} /> Reset to Default
                            </button>
                          )}
                        </span>
                      </div>
                      {meta.rows === 1 ? (
                        <input id={fieldId} value={value} onChange={(event) => setValue(locale, field, event.target.value)} aria-invalid={Boolean(problem)} className={className} />
                      ) : (
                        <textarea id={fieldId} rows={meta.rows} value={value} onChange={(event) => setValue(locale, field, event.target.value)} aria-invalid={Boolean(problem)} className={`${className} resize-y`} />
                      )}
                      {problem && <span className="text-[11px] text-red-700">{problem}</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
