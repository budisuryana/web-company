import { describe, expect, it } from "vitest";
import { validateProductForm } from "../client/src/lib/productValidation";

const completeProduct = { name: "Operations Hub", slug: "operations-hub", shortDescription: "Coordinate daily operational work.", fullDescription: "A complete product description.", heroHeadline: "Keep work in motion.", problem: "Updates are fragmented.", solution: "One shared operational view.", outcome: "Clearer next steps.", category: "Operations", capabilitiesText: "Structured records", targetUsers: "Operations teams", demoUrl: "https://example.com", workflowText: "Plan | Set priorities" };

describe("product form validation", () => {
  it("reports the exact required fields that caused the reported new-product failure", () => {
    const errors = validateProductForm({ ...completeProduct, shortDescription: "", targetUsers: "  " });
    expect(errors.shortDescription).toBe("Short description is required.");
    expect(errors.targetUsers).toBe("Target users is required.");
  });

  it("accepts a complete product draft before tRPC submission", () => {
    expect(validateProductForm(completeProduct)).toEqual({});
  });
});
