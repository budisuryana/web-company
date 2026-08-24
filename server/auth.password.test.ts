import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./_core/password";

describe("Password hashing & verification", () => {
  it("generates different hashes with random salts for the same password", () => {
    const hash1 = hashPassword("secret123");
    const hash2 = hashPassword("secret123");
    expect(hash1).not.toEqual(hash2);
    expect(hash1).toContain(":");
    expect(hash2).toContain(":");
  });

  it("successfully verifies valid passwords", () => {
    const hash = hashPassword("admin123");
    expect(verifyPassword("admin123", hash)).toBe(true);
  });

  it("rejects invalid passwords and malformed hashes", () => {
    const hash = hashPassword("admin123");
    expect(verifyPassword("wrongPassword", hash)).toBe(false);
    expect(verifyPassword("admin123", null)).toBe(false);
    expect(verifyPassword("admin123", "")).toBe(false);
    expect(verifyPassword("admin123", "malformedhashwithoutcolon")).toBe(false);
  });
});
