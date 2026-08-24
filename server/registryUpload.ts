/** Product Registry upload guard: accepts only bounded image data URLs before server-side storage. */
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export function decodeImageDataUrl(dataUrl: string, contentType: string): Buffer {
  if (!contentType.startsWith("image/")) throw new Error("Only image files can be uploaded.");
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match || match[1] !== contentType) throw new Error("The image payload is invalid.");
  const bytes = Buffer.from(match[2], "base64");
  if (!bytes.length || bytes.length > MAX_IMAGE_BYTES) throw new Error("Images must be smaller than 5 MB.");
  return bytes;
}

export function safeUploadName(fileName: string): string {
  const clean = fileName.toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "");
  return clean || "image.png";
}
