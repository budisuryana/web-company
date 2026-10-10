/**
 * Product presentation that the CMS schema cannot express yet:
 * English copy (the products table is single-language) and how each
 * product's primary call to action behaves.
 *
 * Indonesian copy is the CMS record itself, except where `id` rewords a CMS
 * field in plainer language for business readers (the production record is
 * left untouched). English entries are faithful translations of that record —
 * when the CMS text changes, update these too. A product without an entry
 * here falls back to its CMS text in every locale.
 */
import type { Locale } from "../site";

/**
 * "app"  — the CMS demoUrl is a live, public app: show "Try <name>".
 * "demo" — no confirmed public production URL: show "Request a Demo" (→ contact form),
 *          even if the CMS holds a development URL.
 */
export type ProductCtaMode = "app" | "demo";

type ProductCopy = {
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

export function productCtaMode(slug: string): ProductCtaMode {
  return PRODUCT_PRESENTATION[slug]?.cta ?? "app";
}

/** Returns the product with its copy in `locale`; unknown products use the CMS record as-is. */
export function localizeProduct<T extends { slug: string } & ProductCopy>(product: T, locale: Locale): T {
  const copy = PRODUCT_PRESENTATION[product.slug]?.[locale];
  return copy ? { ...product, ...copy } : product;
}
