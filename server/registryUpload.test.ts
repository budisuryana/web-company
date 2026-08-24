/** Product Registry test: upload validation stays deterministic without touching storage or the database. */
import { describe, expect, it } from "vitest";
import { decodeImageDataUrl, safeUploadName } from "./registryUpload";

describe("Product Registry upload validation", () => {
  it("decodes a matching image data URL", () => {
    const bytes = decodeImageDataUrl("data:image/png;base64,aGVsbG8=", "image/png");
    expect(bytes.toString()).toBe("hello");
  });

  it("rejects payloads whose declared media type does not match", () => {
    expect(() => decodeImageDataUrl("data:image/jpeg;base64,aGVsbG8=", "image/png")).toThrow("invalid");
  });

  it("normalizes uploaded file names for storage keys", () => {
    expect(safeUploadName("Cover Image (Q4).PNG")).toBe("cover-image-q4-.png");
  });
});
