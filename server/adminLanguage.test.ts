/** Admin panel language: complete ID/EN dictionaries, no conflicting duplicates, placeholders kept, labels translated. */
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { ADMIN_PHRASES, PHRASE_AREAS } from "../client/src/admin/phrases";
import { translateAdmin } from "../client/src/admin/i18n";
import { EDITABLE_FIELDS, FIELD_LABEL_PARTS_EN, fieldLabel, validateContent } from "@shared/i18n/editable";

const placeholders = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort();

describe("admin phrase dictionaries", () => {
  it("give every phrase a non-empty Indonesian and English text", () => {
    for (const [phrase, entry] of Object.entries(ADMIN_PHRASES)) {
      expect(entry.id.trim(), `${phrase} (id)`).not.toBe("");
      expect(entry.en.trim(), `${phrase} (en)`).not.toBe("");
    }
  });

  it("keep the same placeholders in both languages", () => {
    for (const [phrase, entry] of Object.entries(ADMIN_PHRASES)) {
      expect(placeholders(entry.en), phrase).toEqual(placeholders(entry.id));
      expect(placeholders(entry.id), phrase).toEqual(placeholders(phrase));
    }
  });

  it("never translate the same phrase two different ways in two areas", () => {
    const seen = new Map<string, { area: string; id: string; en: string }>();
    for (const [area, phrases] of Object.entries(PHRASE_AREAS)) {
      for (const [phrase, entry] of Object.entries(phrases as Record<string, { id: string; en: string }>)) {
        const earlier = seen.get(phrase);
        if (earlier) expect({ id: entry.id, en: entry.en }, `"${phrase}" in ${earlier.area} and ${area}`).toEqual({ id: earlier.id, en: earlier.en });
        else seen.set(phrase, { area, id: entry.id, en: entry.en });
      }
    }
  });

  it("fills placeholders and keeps unknown ones visible", () => {
    expect(translateAdmin("en", "Panel Admin {company}", { company: "NUSAKARYA" })).toBe("NUSAKARYA Admin Panel");
    expect(translateAdmin("id", "Panel Admin {company}", { company: "NUSAKARYA" })).toBe("Panel Admin NUSAKARYA");
    expect(translateAdmin("en", "Panel Admin {company}")).toBe("{company} Admin Panel");
    expect(translateAdmin("en", "Slug sudah dipakai produk lain" as never)).toBe("Slug sudah dipakai produk lain");
  });

  it("covers every t() call in the admin source (typecheck enforces this; the scan double-checks literals)", () => {
    const root = path.resolve(import.meta.dirname, "../client/src");
    const files = [
      ...readdirSync(path.join(root, "pages")).filter((name) => name.startsWith("Admin")).map((name) => path.join(root, "pages", name)),
      path.join(root, "components/DashboardLayout.tsx"),
      path.join(root, "components/ProductTranslations.tsx"),
    ];
    const missing: string[] = [];
    for (const file of files) {
      const source = readFileSync(file, "utf8");
      for (const match of source.matchAll(/\bt\("((?:[^"\\]|\\.)*)"/g)) {
        if (!(match[1] in ADMIN_PHRASES)) missing.push(`${path.basename(file)}: ${match[1]}`);
      }
    }
    expect(missing).toEqual([]);
  });
});

describe("content editor labels", () => {
  it("has an English label for every editable field", () => {
    for (const item of EDITABLE_FIELDS) {
      for (const part of item.label.split(" — ")) expect(FIELD_LABEL_PARTS_EN, `${item.key}: "${part}"`).toHaveProperty([part.replace(/ \d+$/, "")]);
    }
    expect(fieldLabel("Cara kami membangun — poin 2 — isi", "en")).toBe("How we build — point 2 — body");
    expect(fieldLabel("Prinsip 3 — judul", "id")).toBe("Prinsip 3 — judul");
  });

  it("reports validation problems in the admin language", () => {
    expect(validateContent("home.title", " ", "en")).toMatch(/cannot be empty/);
    expect(validateContent("home.title", " ")).toMatch(/tidak boleh kosong/);
    expect(validateContent("company.email", "x", "en")).toBe("Invalid email address.");
  });
});
