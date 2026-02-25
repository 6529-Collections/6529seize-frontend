import type { MintingClaim } from "@/generated/models/MintingClaim";
import type { MintingClaimsRootItem } from "@/generated/models/MintingClaimsRootItem";
import type { PhaseAirdrop } from "@/generated/models/PhaseAirdrop";

type LaunchPhaseKey =
  | "phase0"
  | "phase1"
  | "phase2"
  | "publicphase"
  | "research";

type ClaimTxModalStatus = "confirm_wallet" | "submitted" | "success" | "error";
type LaunchMediaTab = "image" | "animation";
type LaunchMediaKind = "image" | "video" | "glb" | "html" | "unknown";

export function parseLocalDateTimeToUnixSeconds(value: string): number | null {
  if (!value) return null;
  const match =
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(value);
  if (!match) return null;

  const [, year, month, day, hour, minute, second] = match;
  const y = Number(year);
  const mo = Number(month);
  const d = Number(day);
  const h = Number(hour);
  const mi = Number(minute);
  const s = Number(second ?? "0");

  if ([y, mo, d, h, mi, s].some(Number.isNaN)) return null;

  const parsed = new Date(y, mo - 1, d, h, mi, s);
  if (
    parsed.getFullYear() !== y ||
    parsed.getMonth() !== mo - 1 ||
    parsed.getDate() !== d ||
    parsed.getHours() !== h ||
    parsed.getMinutes() !== mi ||
    parsed.getSeconds() !== s
  ) {
    return null;
  }

  return Math.floor(parsed.getTime() / 1000);
}


export function getErrorMessage(error: unknown, fallback: string): string {
  const normalize = (message: string): string => {
    const withoutRequestArgs = message.split("Request Arguments")[0] ?? message;
    const compact = withoutRequestArgs.replaceAll(/\s+/g, " ").trim();
    return compact.length > 0 ? compact : fallback;
  };

  if (typeof error === "string") {
    const trimmed = error.trim();
    return trimmed.length > 0 ? normalize(trimmed) : fallback;
  }
  if (error instanceof Error) {
    const trimmed = error.message.trim();
    return trimmed.length > 0 ? normalize(trimmed) : fallback;
  }
  return fallback;
}

export function isNotFoundError(message: string): boolean {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("not found") ||
    normalized.includes("status code 404") ||
    message === "Claim not found"
  );
}

export function normalizePhaseName(value: string): string {
  return value.replaceAll(/\s+/g, "").toLowerCase();
}

export function normalizeHexValue(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

export function getRootForPhase(
  roots: MintingClaimsRootItem[] | null,
  phase: "phase0" | "phase1" | "phase2" | "publicphase"
): MintingClaimsRootItem | null {
  if (!roots) return null;
  const targets: Record<typeof phase, string[]> = {
    phase0: ["phase0"],
    phase1: ["phase1"],
    phase2: ["phase2"],
    publicphase: ["publicphase", "public"],
  };
  return (
    roots.find((root) =>
      targets[phase].includes(normalizePhaseName(root.phase ?? ""))
    ) ?? null
  );
}

export function getRootAddressesCount(
  root: MintingClaimsRootItem | null | undefined
): number | null {
  if (!root) return null;
  const value = root.addresses_count;
  return typeof value === "number" ? value : null;
}

export function getRootTotalSpots(
  root: MintingClaimsRootItem | null | undefined
): number | null {
  if (!root) return null;
  const value = root.total_spots;
  return typeof value === "number" ? value : null;
}

export function summarizeAirdrops(entries: PhaseAirdrop[] | null): {
  addresses: number;
  totalAirdrops: number;
} {
  if (!entries || entries.length === 0) {
    return { addresses: 0, totalAirdrops: 0 };
  }

  const uniqueWallets = new Set(
    entries
      .map((item) => item.wallet?.trim())
      .filter((wallet): wallet is string => Boolean(wallet))
      .map((wallet) => wallet.toLowerCase())
  );
  const totalAirdrops = entries.reduce(
    (sum, item) => sum + Number(item.amount ?? 0),
    0
  );

  return {
    addresses: uniqueWallets.size,
    totalAirdrops,
  };
}

export function getSubscriptionPhaseName(phaseKey: LaunchPhaseKey): string {
  if (phaseKey === "phase0") return "Phase 0";
  if (phaseKey === "phase1") return "Phase 1";
  if (phaseKey === "phase2") return "Phase 2";
  if (phaseKey === "research") return "Airdrop to Research";
  return "Public Phase";
}

export function normalizeAirdropAmount(value: number | undefined): number {
  const normalized = Number(value ?? 0);
  if (!Number.isFinite(normalized)) return 0;
  return Math.max(0, Math.trunc(normalized));
}

export function mergeAirdropsByWallet(entries: PhaseAirdrop[] | null): PhaseAirdrop[] {
  if (!entries || entries.length === 0) return [];

  const merged = new Map<string, PhaseAirdrop>();
  const orderedKeys: string[] = [];

  for (const entry of entries) {
    const wallet = (entry.wallet ?? "").trim();
    if (!wallet) continue;
    const key = wallet.toLowerCase();
    const amount = normalizeAirdropAmount(entry.amount);
    if (amount <= 0) continue;

    const existing = merged.get(key);
    if (existing) {
      existing.amount = normalizeAirdropAmount(existing.amount) + amount;
      merged.set(key, existing);
      continue;
    }

    merged.set(key, { wallet, amount });
    orderedKeys.push(key);
  }

  return orderedKeys
    .map((key) => merged.get(key))
    .filter((item): item is PhaseAirdrop => Boolean(item));
}

export function buildSubscriptionAirdropSelection(
  mergedEntries: PhaseAirdrop[],
  remainingEditions: number
): { selected: PhaseAirdrop[]; selectedTotal: number } {
  const remaining = Math.max(0, Math.trunc(remainingEditions));
  if (remaining <= 0 || mergedEntries.length === 0) {
    return { selected: [], selectedTotal: 0 };
  }

  let remainingToAllocate = remaining;
  const selected: PhaseAirdrop[] = [];

  for (const entry of mergedEntries) {
    if (remainingToAllocate <= 0) break;
    const amount = normalizeAirdropAmount(entry.amount);
    if (amount <= 0) continue;

    const allocated = Math.min(amount, remainingToAllocate);
    selected.push({
      wallet: entry.wallet,
      amount: allocated,
    });
    remainingToAllocate -= allocated;
  }

  return { selected, selectedTotal: remaining - remainingToAllocate };
}

export function formatLocalDateTime(date: Date): string {
  const locale =
    typeof navigator !== "undefined" && navigator.language
      ? navigator.language
      : "en-GB";
  const isUs = locale.toLowerCase().startsWith("en-us");
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const datePart = isUs ? `${month}/${day}/${year}` : `${day}/${month}/${year}`;
  return `${datePart} ${hours}:${minutes}`;
}

export function formatScheduledLabel(date: Date): string {
  const weekday = date.toLocaleDateString(undefined, { weekday: "long" });
  const day = String(date.getDate()).padStart(2, "0");
  const month = date.toLocaleDateString(undefined, { month: "short" });
  const year = date.getFullYear();
  return `${weekday} ${day} ${month}, ${year}`;
}

export function formatDateTimeLocalInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function getClaimTxModalEmoji(status: ClaimTxModalStatus): string {
  if (status === "success") return "/emojis/sgt_saluting_face.webp";
  if (status === "error") return "/emojis/sgt_sob.webp";
  return "/emojis/sgt_flushed.webp";
}


export function isVideoUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  const lower = url.toLowerCase();
  return (
    lower.includes(".mp4") ||
    lower.includes(".webm") ||
    lower.includes(".mov") ||
    lower.includes(".m4v")
  );
}

export function normalizeFormat(format: string | null | undefined): string | null {
  return format ? format.toUpperCase() : null;
}

export function getUrlExtension(url: string | null | undefined): string | null {
  if (!url) return null;
  const clean = url.split("?")[0]?.split("#")[0] ?? "";
  const parts = clean.split(".");
  if (parts.length < 2) return null;
  return parts.at(-1)?.toLowerCase() ?? null;
}

export function getImageFormat(claim: MintingClaim): string | null {
  const fromDetails = normalizeFormat(claim.image_details?.format);
  if (fromDetails) return fromDetails === "JPG" ? "JPEG" : fromDetails;
  const ext = getUrlExtension(claim.image_url);
  if (!ext) return null;
  if (ext === "jpg" || ext === "jpeg") return "JPEG";
  if (ext === "png") return "PNG";
  if (ext === "gif") return "GIF";
  if (ext === "webp") return "WEBP";
  return null;
}

export function getAnimationInfo(
  claim: MintingClaim
): { kind: LaunchMediaKind; subtype?: string | null } | null {
  if (!claim.animation_url) return null;
  const format = normalizeFormat(
    (claim.animation_details as { format?: string } | undefined)?.format
  );
  if (format === "HTML") return { kind: "html" };
  if (format === "GLB") return { kind: "glb" };
  if (format) return { kind: "video", subtype: format };
  const ext = getUrlExtension(claim.animation_url);
  if (ext === "html" || ext === "htm") return { kind: "html" };
  if (ext === "glb") return { kind: "glb" };
  if (ext === "mp4") return { kind: "video", subtype: "MP4" };
  if (ext === "webm") return { kind: "video", subtype: "WEBM" };
  return { kind: "video" };
}

export function getMediaTypeLabel(claim: MintingClaim, tab: LaunchMediaTab): string {
  if (tab === "animation") {
    const animationInfo = getAnimationInfo(claim);
    if (!animationInfo) return "—";
    if (animationInfo.kind === "html" || animationInfo.kind === "glb") {
      return animationInfo.kind.toUpperCase();
    }
    if (animationInfo.kind === "video") {
      return animationInfo.subtype ? `VIDEO/${animationInfo.subtype}` : "VIDEO";
    }
    return "—";
  }
  const imageFormat = getImageFormat(claim);
  if (imageFormat) return `IMAGE/${imageFormat}`;
  if (claim.image_url || claim.image_details) return "IMAGE";
  return "—";
}

export function getAnimationMimeType(claim: MintingClaim): string | null {
  const animationUrl = claim.animation_url ?? null;
  if (!animationUrl) return null;
  const normalizedFormat = (
    claim.animation_details as { format?: string } | null | undefined
  )?.format?.toUpperCase();
  if (normalizedFormat === "HTML") return "text/html";
  if (normalizedFormat === "GLB") return "model/gltf-binary";
  if (normalizedFormat) {
    const formatMimeMap: Record<string, string> = {
      WEBM: "video/webm",
      MP4: "video/mp4",
      MOV: "video/quicktime",
      M4V: "video/x-m4v",
    };
    return formatMimeMap[normalizedFormat] ?? "video/mp4";
  }
  if (isVideoUrl(animationUrl)) return "video/mp4";
  if (animationUrl.toLowerCase().endsWith(".glb")) return "model/gltf-binary";
  if (animationUrl.toLowerCase().endsWith(".gltf")) return "model/gltf+json";
  if (animationUrl.toLowerCase().endsWith(".html")) return "text/html";
  return "video/mp4";
}

export function getSafeExternalUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return null;
    }
    return url.toString();
  } catch {
    return null;
  }
}

export function toArweaveUrl(location: string | null | undefined): string | null {
  if (!location) return null;
  const trimmed = location.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  return `https://arweave.net/${trimmed}`;
}
