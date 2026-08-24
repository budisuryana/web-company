// Preconfigured storage helpers for Manus WebDev templates
// Uploads via Forge Server presigned URL to S3 (PUT direct).
// Downloads return /manus-storage/{key} paths served via 307 redirect.
// When Forge is not configured (local development), files are written to a
// local directory and served back through the same /manus-storage paths.

import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { ENV } from "./_core/env";

function getForgeConfig() {
  const forgeUrl = ENV.forgeApiUrl;
  const forgeKey = ENV.forgeApiKey;

  if (!forgeUrl || !forgeKey) {
    throw new Error(
      "Storage config missing: set BUILT_IN_FORGE_API_URL and BUILT_IN_FORGE_API_KEY",
    );
  }

  return { forgeUrl: forgeUrl.replace(/\/+$/, ""), forgeKey };
}

export function isForgeStorageConfigured(): boolean {
  return Boolean(ENV.forgeApiUrl && ENV.forgeApiKey);
}

/** Root directory used by the local-development storage fallback. */
export function getLocalStorageDir(): string {
  return process.env.LOCAL_STORAGE_DIR
    ? path.resolve(process.env.LOCAL_STORAGE_DIR)
    : path.resolve(process.cwd(), ".local-storage");
}

/** Resolve a storage key inside the local storage root, refusing traversal. */
export function resolveLocalStoragePath(key: string): string | null {
  const root = getLocalStorageDir();
  const target = path.resolve(root, normalizeKey(key));
  return target.startsWith(root + path.sep) ? target : null;
}

function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, "");
}

function appendHashSuffix(relKey: string): string {
  const hash = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  const lastDot = relKey.lastIndexOf(".");
  if (lastDot === -1) return `${relKey}_${hash}`;
  return `${relKey.slice(0, lastDot)}_${hash}${relKey.slice(lastDot)}`;
}

async function putLocal(key: string, data: Buffer): Promise<{ key: string; url: string }> {
  const target = resolveLocalStoragePath(key);
  if (!target) throw new Error("Invalid storage key");
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, data);
  return { key, url: `/manus-storage/${key}` };
}

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream",
): Promise<{ key: string; url: string }> {
  const key = appendHashSuffix(normalizeKey(relKey));

  if (!isForgeStorageConfigured()) {
    return putLocal(key, typeof data === "string" ? Buffer.from(data, "utf8") : Buffer.from(data));
  }

  const { forgeUrl, forgeKey } = getForgeConfig();

  // 1. Get presigned PUT URL from Forge
  const presignUrl = new URL("v1/storage/presign/put", forgeUrl + "/");
  presignUrl.searchParams.set("path", key);

  const presignResp = await fetch(presignUrl, {
    headers: { Authorization: `Bearer ${forgeKey}` },
  });

  if (!presignResp.ok) {
    const msg = await presignResp.text().catch(() => presignResp.statusText);
    throw new Error(`Storage presign failed (${presignResp.status}): ${msg}`);
  }

  const { url: s3Url } = (await presignResp.json()) as { url: string };
  if (!s3Url) throw new Error("Forge returned empty presign URL");

  // 2. PUT file directly to S3
  const blob =
    typeof data === "string"
      ? new Blob([data], { type: contentType })
      : new Blob([data as any], { type: contentType });

  const uploadResp = await fetch(s3Url, {
    method: "PUT",
    headers: { "Content-Type": contentType },
    body: blob,
  });

  if (!uploadResp.ok) {
    throw new Error(`Storage upload to S3 failed (${uploadResp.status})`);
  }

  return { key, url: `/manus-storage/${key}` };
}

export async function storageGet(relKey: string): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);
  return { key, url: `/manus-storage/${key}` };
}

/** Best-effort deletion of a stored object. The Forge API exposes presigned
 * put/get only, so remote deletions are reported as skipped instead of failing. */
export async function storageRemove(relKey: string): Promise<{ removed: boolean; skipped?: boolean }> {
  const key = normalizeKey(relKey);
  if (!key) return { removed: false };

  if (!isForgeStorageConfigured()) {
    const target = resolveLocalStoragePath(key);
    if (!target) return { removed: false };
    try {
      await unlink(target);
      return { removed: true };
    } catch (error) {
      if ((error as NodeJS.ErrnoException)?.code === "ENOENT") return { removed: false };
      throw error;
    }
  }

  console.warn(`[Storage] Deletion skipped for ${key}: the Forge storage API has no delete operation.`);
  return { removed: false, skipped: true };
}

export async function storageGetSignedUrl(relKey: string): Promise<string> {
  const { forgeUrl, forgeKey } = getForgeConfig();
  const key = normalizeKey(relKey);

  const getUrl = new URL("v1/storage/presign/get", forgeUrl + "/");
  getUrl.searchParams.set("path", key);

  const resp = await fetch(getUrl, {
    headers: { Authorization: `Bearer ${forgeKey}` },
  });

  if (!resp.ok) {
    const msg = await resp.text().catch(() => resp.statusText);
    throw new Error(`Storage signed URL failed (${resp.status}): ${msg}`);
  }

  const { url } = (await resp.json()) as { url: string };
  return url;
}
