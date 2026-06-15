import { publicEnv } from "@/config/env";
import type { JsonLdObject, JsonLdValue } from "./types";

export const SITE_NAME = "6529.io";
export const ORGANIZATION_NAME = "6529";
export const CC0_LICENSE_URL =
  "https://creativecommons.org/publicdomain/zero/1.0/";

export function getSiteUrl(): string {
  const configured = publicEnv.BASE_ENDPOINT?.trim() || "https://6529.io";
  return configured.endsWith("/") ? configured.slice(0, -1) : configured;
}

export function canonicalUrl(path: string): string {
  return new URL(path, `${getSiteUrl()}/`).toString();
}

export function nodeId(path: string, fragment: string): string {
  return `${canonicalUrl(path)}#${fragment}`;
}

export function toAbsoluteHttpUrl(
  value: string | null | undefined
): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) {
    return undefined;
  }

  try {
    const url = new URL(trimmed, `${getSiteUrl()}/`);
    if (url.protocol === "http:" || url.protocol === "https:") {
      return url.toString();
    }
  } catch {
    return undefined;
  }

  return undefined;
}

export function cleanText(
  value: string | null | undefined
): string | undefined {
  const trimmed = value?.replace(/\s+/g, " ").trim();
  return trimmed && trimmed.length > 0 ? trimmed : undefined;
}

export function compactJsonLdObject(input: JsonLdObject): JsonLdObject {
  const output: Record<string, JsonLdValue> = {};

  for (const [key, value] of Object.entries(input)) {
    if (isPresentJsonLdValue(value)) {
      output[key] = value;
    }
  }

  return output;
}

export function graphJsonLd(nodes: readonly JsonLdObject[]): JsonLdObject {
  return compactJsonLdObject({
    "@context": "https://schema.org",
    "@graph": nodes.filter((node) => Object.keys(node).length > 0),
  });
}

export function propertyValue(
  name: string,
  value: string | number | boolean | null | undefined
): JsonLdObject | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }

  if (typeof value === "string" && value.trim().length === 0) {
    return undefined;
  }

  return compactJsonLdObject({
    "@type": "PropertyValue",
    name,
    value,
  });
}

export function interactionCounter(
  name: string,
  count: number | null | undefined
): JsonLdObject | undefined {
  if (count === null || count === undefined || !Number.isFinite(count)) {
    return undefined;
  }

  return compactJsonLdObject({
    "@type": "InteractionCounter",
    interactionType: { "@type": name },
    userInteractionCount: count,
  });
}

export function buildBreadcrumbList(
  items: readonly { readonly name: string; readonly path: string }[]
): JsonLdObject {
  return compactJsonLdObject({
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) =>
      compactJsonLdObject({
        "@type": "ListItem",
        position: index + 1,
        name: item.name,
        item: canonicalUrl(item.path),
      })
    ),
  });
}

function isPresentJsonLdValue(
  value: JsonLdValue | undefined
): value is JsonLdValue {
  if (value === null || value === undefined) {
    return false;
  }

  if (typeof value === "string") {
    return value.trim().length > 0;
  }

  if (Array.isArray(value)) {
    return value.length > 0;
  }

  return true;
}
