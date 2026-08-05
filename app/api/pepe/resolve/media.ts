import { publicEnv } from "@/config/env";
import { normalizeDecentralizedMediaUrl } from "@/lib/media/decentralized-media";

export function decentralizedMediaToHttp(url: string): string {
  return (
    normalizeDecentralizedMediaUrl(url, publicEnv.MEDIA_RESOLVER_ENDPOINT) ??
    url
  );
}

export function absolutizeRelativeUrl(candidate: string, base: string): string {
  try {
    return new URL(candidate, base).toString();
  } catch {
    return candidate;
  }
}

export function normalizeImageUrl(
  candidate: unknown,
  base: string
): string | null {
  if (typeof candidate !== "string") {
    return null;
  }

  const trimmed = candidate.trim();
  if (!trimmed) {
    return null;
  }

  if (/^data:/i.test(trimmed)) {
    return trimmed;
  }

  if (trimmed.startsWith("ipfs://")) {
    return decentralizedMediaToHttp(trimmed);
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  if (trimmed.startsWith("//")) {
    return `https:${trimmed}`;
  }

  if (/^[./]/.test(trimmed)) {
    return absolutizeRelativeUrl(trimmed, base);
  }

  return null;
}

export function slugifyName(name: string): string {
  return name
    .toLowerCase()
    .replaceAll("&", "and")
    .replaceAll(/[^a-z0-9\s-]/g, "")
    .trim()
    .replaceAll(/\s+/g, "-")
    .replaceAll(/-+/g, "-");
}

export function deepFindAll(
  value: unknown,
  keys: string[],
  results: unknown[] = []
): unknown[] {
  if (Array.isArray(value)) {
    for (const item of value) {
      deepFindAll(item, keys, results);
    }
    return results;
  }

  if (!value || typeof value !== "object") {
    return results;
  }

  for (const [key, val] of Object.entries(value)) {
    if (keys.includes(key)) {
      results.push(val);
    }
    if (val && typeof val === "object") {
      deepFindAll(val, keys, results);
    }
  }

  return results;
}
