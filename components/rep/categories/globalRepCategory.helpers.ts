import type { ApiProfileMin } from "@/generated/models/ApiProfileMin";
import { formatAddress } from "@/helpers/Helpers";

export const GLOBAL_REP_CATEGORY_PAGE_SIZE = 25;

export type GlobalRepCategoryTab =
  | "overview"
  | "recipients"
  | "givers"
  | "pairings"
  | "recent";

export type GlobalRepCategorySort = "rep_desc" | "rep_asc" | "recent";

export function encodeRepCategoryPath(category: string): string {
  return encodeURIComponent(category);
}

export function getRepCategoryPath(category: string): string {
  return `/rep/categories/${encodeRepCategoryPath(category)}`;
}

export function decodeRepCategoryParam(category: string): string {
  try {
    return decodeURIComponent(category);
  } catch {
    return category;
  }
}

export function getProfileDisplay(profile: ApiProfileMin): string {
  const handle = profile.handle?.trim();

  if (handle) {
    return handle;
  }

  const primaryAddress = profile.primary_address?.trim();
  return primaryAddress ? formatAddress(primaryAddress) : "Unknown profile";
}

export function getProfileHref(profile: ApiProfileMin): string {
  const handle = profile.handle?.trim();

  if (handle) {
    return `/${encodeURIComponent(handle)}`;
  }

  const primaryAddress = profile.primary_address?.trim();
  return primaryAddress ? `/${encodeURIComponent(primaryAddress)}` : "#";
}

export function getProfileTooltipUser(profile: ApiProfileMin): string {
  const handle = profile.handle?.trim();

  if (handle) {
    return handle;
  }

  const id = profile.id?.trim();

  if (id) {
    return id;
  }

  const primaryAddress = profile.primary_address?.trim();
  return primaryAddress || getProfileDisplay(profile);
}

export function getProfileAvatarFallback(profile: ApiProfileMin): string {
  const display = getProfileDisplay(profile).trim();
  return display.charAt(0).toUpperCase() || "?";
}

export function formatRepCategoryDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}
