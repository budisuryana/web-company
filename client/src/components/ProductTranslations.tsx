/**
 * Product copy per language for the CMS editor: each field shows English and
 * Indonesian side by side. A value equal to its default is not stored, so the
 * product keeps following its columns and the code presentation until edited.
 */
import { Languages, OctagonAlert, RotateCcw, TriangleAlert } from "lucide-react";
import { translateAdmin, useT, type Translate } from "@/admin/i18n";
import type { AdminPhrase } from "@/admin/phrases";
import { Badge, Button, Card, CardHead } from "@/studio/ui";
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

const LOCALES: Array<{ id: Locale; label: AdminPhrase }> = [
  { id: "en", label: "English" },
  { id: "id", label: "Indonesia" },
];

const FIELD_META: Record<ProductCopyField, { label: AdminPhrase; rows: number; max: number; hint?: AdminPhrase }> = {
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

/** Problems that would make the server reject the copy, keyed "locale:field", in the admin language. */
export function translationProblems(translations: ProductTranslations, t: Translate = (phrase, vars) => translateAdmin("id", phrase, vars)): Record<string, string> {
  const problems: Record<string, string> = {};
  for (const { id: locale } of LOCALES) {
    const copy = translations[locale] ?? {};
    for (const field of PRODUCT_COPY_FIELDS) {
      const value = copy[field];
      if (value === undefined) continue;
      const meta = FIELD_META[field];
      if (field === "capabilities") {
        const items = value as string[];
        if (items.length > 12) problems[`${locale}:${field}`] = t("Maksimal 12 kapabilitas.");
        else if (items.some((item) => item.length > meta.max)) problems[`${locale}:${field}`] = t("Setiap baris maksimal {max} karakter.", { max: meta.max });
      } else if (field === "workflowSteps") {
        const steps = value as ProductCopy["workflowSteps"];
        if (steps.length > 8) problems[`${locale}:${field}`] = t("Maksimal 8 langkah.");
        else if (steps.some((step) => !step.title || !step.copy)) problems[`${locale}:${field}`] = t("Tulis setiap langkah sebagai: Judul | Penjelasan.");
        else if (steps.some((step) => step.title.length > 120 || step.copy.length > meta.max)) problems[`${locale}:${field}`] = t("Judul maks. 120 dan penjelasan maks. 600 karakter.");
      } else if ((value as string).trim().length > meta.max) {
        problems[`${locale}:${field}`] = t("Maksimal {max} karakter.", { max: meta.max });
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
  const t = useT();
  const problems = translationProblems(translations, t);

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
    <Card>
      <CardHead
        icon={Languages}
        hue="teal"
        title={t("Konten EN / ID")}
        sub={t("Teks produk per bahasa. Kolom yang belum diubah memakai teks bawaan (kolom produk dan terjemahan yang sudah ada). Disimpan bersama tombol Save product, dan langsung tampil di website.")}
      />
      <div className="hq-card-body flex flex-col gap-3">
        <fieldset className="hq-fieldset">
          <legend>{t("Tombol utama")}</legend>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {([
              [null, t("Bawaan ({cta})", { cta: codeCta === "try" ? "Try" : "Request a Demo" })],
              ["try", t("Try — buka aplikasi (demo URL)")],
              ["demo", t("Request a Demo — ke formulir kontak")],
            ] as Array<[ProductCta, string]>).map(([value, label]) => (
              <label key={String(value)} className="hq-check">
                <input type="radio" name="primary-cta" checked={primaryCta === value} onChange={() => onCtaChange(value)} />
                {label}
              </label>
            ))}
          </div>
          {effectiveCta === "try" && !demoUrl.trim() && (
            <div className="hq-banner warn mt-2.5">
              <TriangleAlert aria-hidden="true" />
              {t("Demo URL masih kosong, jadi website tetap menampilkan Request a Demo sampai URL diisi.")}
            </div>
          )}
          {effectiveCta === "try" && looksLikeDevelopmentUrl(demoUrl) && (
            <div className="hq-banner err mt-2.5" role="alert">
              <OctagonAlert aria-hidden="true" />
              {t("Demo URL ({url}) terlihat seperti URL development. Dengan pilihan Try, URL ini akan tampil di website publik.", { url: demoUrl })}
            </div>
          )}
        </fieldset>

        {PRODUCT_COPY_FIELDS.map((field) => {
          const meta = FIELD_META[field];
          return (
            <div key={field} className="hq-copy-row">
              <div className="hq-copy-head">
                <span className="hq-copy-title">{t(meta.label)}</span>
                {meta.hint && <span className="hq-hint">{t(meta.hint)}</span>}
              </div>
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                {LOCALES.map(({ id: locale, label }) => {
                  const override = translations[locale]?.[field];
                  const value = asText(field, override ?? defaults[locale][field]);
                  const problem = problems[`${locale}:${field}`];
                  const fieldId = `product-${locale}-${field}`;
                  const className = `hq-input ${override !== undefined ? "changed" : ""}`;
                  return (
                    <div key={locale} className="hq-field">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <label htmlFor={fieldId} className="hq-label inline-flex items-center gap-1.5">
                          <span className="hq-lang-tag">{locale.toUpperCase()}</span>
                          {t(label)}
                        </label>
                        <span className="flex items-center gap-1.5">
                          <Badge tone={override !== undefined ? "accent" : "neutral"}>{override !== undefined ? t("Diubah") : t("Bawaan")}</Badge>
                          {override !== undefined && (
                            <Button variant="ghost" size="sm" icon={RotateCcw} onClick={() => setValue(locale, field, "")}>
                              {t("Reset to Default")}
                            </Button>
                          )}
                        </span>
                      </div>
                      {meta.rows === 1 ? (
                        <input id={fieldId} value={value} onChange={(event) => setValue(locale, field, event.target.value)} aria-invalid={Boolean(problem)} className={className} />
                      ) : (
                        <textarea id={fieldId} rows={meta.rows} value={value} onChange={(event) => setValue(locale, field, event.target.value)} aria-invalid={Boolean(problem)} className={className} />
                      )}
                      {problem && (
                        <span className="hq-error">
                          <OctagonAlert aria-hidden="true" />
                          {problem}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
