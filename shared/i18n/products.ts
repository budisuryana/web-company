/**
 * Product copy per language and the primary call to action.
 *
 * Resolution, most specific first:
 *   1. the product's CMS translations (products.translations[locale]),
 *   2. the code presentation below (English copy, Indonesian rewording),
 *   3. the product's own columns (written in Indonesian).
 * Blank CMS values never win, so a missing translation shows the next layer.
 * The CTA follows products.primaryCta when set, else the code default here.
 *
 * The code presentation is the starting point the CMS editor shows as
 * "default"; it is no longer the only place English copy can live.
 */
import type { Locale } from "../site";

/**
 * "app"  — the CMS demoUrl is a live, public app: show "Try <name>".
 * "demo" — no confirmed public production URL: show "Request a Demo" (→ contact form),
 *          even if the CMS holds a development URL.
 */
export type ProductCtaMode = "app" | "demo";

export type ProductCopy = {
  name?: string;
  category: string;
  shortDescription: string;
  fullDescription: string;
  heroHeadline: string;
  problem: string;
  solution: string;
  outcome: string;
  targetUsers: string;
  capabilities: string[];
  workflowSteps: Array<{ title: string; copy: string }>;
};

type ProductPresentation = { cta: ProductCtaMode; id?: Partial<ProductCopy>; en?: ProductCopy };

export const PRODUCT_PRESENTATION: Record<string, ProductPresentation> = {
  reconly: {
    cta: "app",
    id: {
      category: "Keuangan",
      capabilities: [
        "Perbandingan dua file data",
        "Pemetaan kolom yang fleksibel",
        "Pencocokan yang mengabaikan huruf kapital dan spasi tepi",
        "Toleransi angka dan tanggal",
        "Deteksi data hilang dan duplikat",
        "Ekspor hasil rekonsiliasi",
      ],
    },
    en: {
      category: "Finance",
      shortDescription: "Reconcile two data sources quickly, accurately, and in a reviewable way.",
      fullDescription:
        "Reconly helps teams compare data from two files, find differences, detect missing or duplicate records, and export the reconciliation results for follow-up.",
      heroHeadline: "Find data mismatches without exhausting manual checks.",
      problem:
        "Manual reconciliation is slow, error-prone, and painful when a team has to check thousands of rows from different data sources.",
      solution:
        "Reconly matches data automatically based on the columns and rules you choose, then groups the results so every difference is easy to understand.",
      outcome:
        "Reconciliation becomes faster, consistent, reviewable, and ready to export for operational and audit needs.",
      targetUsers:
        "Finance, accounting, payroll, operations, and audit teams that routinely compare data from two different systems or documents.",
      capabilities: [
        "Two-file data comparison",
        "Flexible column mapping",
        "Matching that ignores capitalisation and stray spaces",
        "Numeric and date tolerances",
        "Missing and duplicate record detection",
        "Reconciliation result export",
      ],
      workflowSteps: [
        { title: "Upload", copy: "Add the two files you want to compare." },
        { title: "Map", copy: "Choose the key columns and the columns to check." },
        { title: "Configure", copy: "Set matching rules that fit your data." },
        { title: "Process", copy: "Run the reconciliation automatically." },
        { title: "Review", copy: "Inspect matched, different, missing, or duplicate records." },
        { title: "Export", copy: "Download the results for follow-up." },
      ],
    },
  },
  "karya-people": {
    // Owner decision: KaryaPeople is live, but no public production URL is confirmed yet.
    cta: "demo",
    id: { category: "SDM · HRIS" },
    en: {
      category: "Human Resources · HRIS",
      shortDescription: "One system for employees, attendance, leave, recruitment, and payroll.",
      fullDescription:
        "KaryaPeople helps companies manage the entire employee lifecycle on one platform — from workforce records and attendance to approvals, recruitment, and payroll.",
      heroHeadline: "Manage the whole employee journey in one system.",
      problem:
        "Employee records, attendance, leave, recruitment, and payroll are often scattered across many files and apps, which makes administration slow and hard to oversee.",
      solution:
        "KaryaPeople brings HR processes onto one platform with structured workflows, role-based access, and information that employees, managers, and HR can all follow.",
      outcome:
        "HR administration becomes faster, data more consistent, approvals clearer, and the company gets a more complete view of its workforce.",
      targetUsers:
        "Growing companies, HR teams, managers, payroll administrators, and employees who need integrated people management.",
      capabilities: [
        "Employee directory and records",
        "Attendance and shift scheduling",
        "Leave requests and approval flows",
        "Attendance corrections",
        "Recruitment and candidate management",
        "Payroll and payslips",
        "Employee documents",
        "Workforce reports and insights",
        "Role-based access",
      ],
      workflowSteps: [
        { title: "Set up", copy: "Configure the company, organisation structure, roles, and policies." },
        { title: "Manage", copy: "Keep employee records and documents in one directory." },
        { title: "Run", copy: "Process attendance, leave, approvals, recruitment, and payroll." },
        { title: "Monitor", copy: "Review requests, exceptions, and workforce activity." },
        { title: "Report", copy: "Use reports and insights to support decisions." },
      ],
    },
  },
};

export type ProductTranslations = Partial<Record<Locale, Partial<ProductCopy>>>;

/** Copy fields an editor can translate, in display order. */
export const PRODUCT_COPY_FIELDS = [
  "name",
  "category",
  "shortDescription",
  "heroHeadline",
  "fullDescription",
  "problem",
  "solution",
  "outcome",
  "targetUsers",
  "capabilities",
  "workflowSteps",
] as const satisfies ReadonlyArray<keyof ProductCopy>;
export type ProductCopyField = (typeof PRODUCT_COPY_FIELDS)[number];

type CtaInput = string | { slug: string; primaryCta?: "try" | "demo" | null };

export function productCtaMode(product: CtaInput): ProductCtaMode {
  if (typeof product !== "string" && product.primaryCta) return product.primaryCta === "try" ? "app" : "demo";
  const slug = typeof product === "string" ? product : product.slug;
  return PRODUCT_PRESENTATION[slug]?.cta ?? "app";
}

/** A demo URL that points at a development or staging host should not be offered to the public. */
export function looksLikeDevelopmentUrl(url: string): boolean {
  try {
    const host = new URL(url.trim()).hostname;
    return /^(dev|staging|stage|test|preview)[-.]/i.test(host) || host === "localhost" || /^\d+\.\d+\.\d+\.\d+$/.test(host);
  } catch {
    return false;
  }
}

/** Drops blank strings, empty lists and incomplete workflow steps, so they fall through to the next layer. */
export function meaningfulCopy(copy: Partial<ProductCopy> | null | undefined): Partial<ProductCopy> {
  if (!copy) return {};
  const result: Record<string, unknown> = {};
  for (const field of PRODUCT_COPY_FIELDS) {
    const value = copy[field];
    if (typeof value === "string") {
      if (value.trim()) result[field] = value.trim();
    } else if (field === "capabilities" && Array.isArray(value)) {
      const items = (value as string[]).map((item) => item.trim()).filter(Boolean);
      if (items.length) result[field] = items;
    } else if (field === "workflowSteps" && Array.isArray(value)) {
      const steps = (value as Array<{ title: string; copy: string }>).filter((step) => step?.title?.trim() && step?.copy?.trim());
      if (steps.length) result[field] = steps.map((step) => ({ title: step.title.trim(), copy: step.copy.trim() }));
    }
  }
  return result as Partial<ProductCopy>;
}

type LocalizableProduct = { slug: string; translations?: ProductTranslations | null } & ProductCopy;

/** The copy a language shows when the CMS has no translation for it: the columns plus the code presentation. */
export function defaultProductCopy<T extends LocalizableProduct>(product: T, locale: Locale): T {
  const code = PRODUCT_PRESENTATION[product.slug]?.[locale];
  return code ? { ...product, ...code } : product;
}

/** Returns the product with its copy in `locale` (CMS translation → code presentation → columns). */
export function localizeProduct<T extends LocalizableProduct>(product: T, locale: Locale): T {
  const base = defaultProductCopy(product, locale);
  const cms = meaningfulCopy(product.translations?.[locale]);
  return Object.keys(cms).length ? { ...base, ...cms } : base;
}
