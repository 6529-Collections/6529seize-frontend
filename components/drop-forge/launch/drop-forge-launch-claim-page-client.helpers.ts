import type { ClaimPrimaryStatus } from "@/components/drop-forge/drop-forge-status.helpers";
import {
  getDropForgeAnimationMediaTypeLabel,
  getDropForgeImageMediaTypeLabel,
  getDropForgeUrlExtension,
  isDropForgeVideoUrl,
} from "@/components/drop-forge/drop-forge-media-type.helpers";
import type { MintingClaim } from "@/generated/models/MintingClaim";
import type { MintingClaimsRootItem } from "@/generated/models/MintingClaimsRootItem";
import type { PhaseAirdrop } from "@/generated/models/PhaseAirdrop";
import {
  type ManifoldClaim,
  ManifoldPhase,
  ManifoldClaimStatus,
} from "@/hooks/useManifoldClaim";

export type LaunchPhaseKey =
  | "phase0"
  | "phase1"
  | "phase2"
  | "publicphase"
  | "research"
  | "payartist";

type LaunchAirdropActionKey = "artist" | "team";

type LaunchActionLookupKind = LaunchPhaseKey | LaunchAirdropActionKey;

type ClaimTxModalStatus = "confirm_wallet" | "submitted" | "success" | "error";
type LaunchMediaTab = "image" | "animation";

export function parseLocalDateTimeToUnixSeconds(value: string): number | null {
  if (!value) return null;
  const isAsciiDigits = (part: string, length: number): boolean =>
    part.length === length &&
    Array.from(part).every((char) => char >= "0" && char <= "9");

  const partsByT = value.split("T");
  if (partsByT.length !== 2) return null;
  const datePart = partsByT[0];
  const timePart = partsByT[1];
  if (!datePart || !timePart) return null;

  const dateParts = datePart.split("-");
  if (dateParts.length !== 3) return null;
  const year = dateParts[0];
  const month = dateParts[1];
  const day = dateParts[2];
  if (!year || !month || !day) return null;

  const timeParts = timePart.split(":");
  if (timeParts.length !== 2 && timeParts.length !== 3) return null;
  const hour = timeParts[0];
  const minute = timeParts[1];
  const second = (timeParts[2] ?? "00").padStart(2, "0");
  if (!hour || !minute) return null;

  if (
    !isAsciiDigits(year, 4) ||
    !isAsciiDigits(month, 2) ||
    !isAsciiDigits(day, 2) ||
    !isAsciiDigits(hour, 2) ||
    !isAsciiDigits(minute, 2) ||
    !isAsciiDigits(second, 2)
  ) {
    return null;
  }

  const y = Number(year);
  const mo = Number(month);
  const d = Number(day);
  const h = Number(hour);
  const mi = Number(minute);
  const s = Number(second);

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

function normalizeMintingClaimActionName(actionName: string): string {
  return actionName
    .trim()
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, "");
}

function normalizePhaseName(value: string): string {
  return value.replaceAll(/\s+/g, "").toLowerCase();
}

function getLaunchActionLookupTerms(kind: LaunchActionLookupKind): {
  required: readonly string[];
  preferred: readonly string[];
  excluded: readonly string[];
} {
  const termsByKind: Record<
    LaunchActionLookupKind,
    {
      required: readonly string[];
      preferred: readonly string[];
      excluded: readonly string[];
    }
  > = {
    artist: {
      required: ["artist"],
      preferred: ["airdrop"],
      excluded: [
        "team",
        "research",
        "phase0",
        "phase1",
        "phase2",
        "public",
        "pay",
        "payment",
        "payartist",
        "payout",
      ],
    },
    team: {
      required: ["team"],
      preferred: ["airdrop"],
      excluded: ["artist", "research", "phase0", "phase1", "phase2", "public"],
    },
    research: {
      required: ["research"],
      preferred: ["airdrop"],
      excluded: ["artist", "team", "phase0", "phase1", "phase2", "public"],
    },
    payartist: {
      required: ["pay", "artist"],
      preferred: ["payment"],
      excluded: [
        "team",
        "research",
        "phase0",
        "phase1",
        "phase2",
        "public",
        "airdrop",
      ],
    },
    phase0: {
      required: ["phase0"],
      preferred: ["airdrop"],
      excluded: ["artist", "team", "research", "public"],
    },
    phase1: {
      required: ["phase1"],
      preferred: ["airdrop"],
      excluded: ["artist", "team", "research", "public"],
    },
    phase2: {
      required: ["phase2"],
      preferred: ["airdrop"],
      excluded: ["artist", "team", "research", "public"],
    },
    publicphase: {
      required: ["public"],
      preferred: ["phase", "airdrop"],
      excluded: ["artist", "team", "research", "phase0", "phase1", "phase2"],
    },
  };

  return termsByKind[kind];
}

export function findBestMatchingLaunchActionName(
  actionNames: readonly string[],
  kind: LaunchActionLookupKind
): string | null {
  const { required, preferred, excluded } = getLaunchActionLookupTerms(kind);
  let bestMatch: string | null = null;
  let bestScore = -1;

  for (const actionName of actionNames) {
    const normalized = normalizeMintingClaimActionName(actionName);
    if (excluded.some((term) => normalized.includes(term))) {
      continue;
    }
    if (!required.every((term) => normalized.includes(term))) {
      continue;
    }

    const score =
      required.length * 10 +
      preferred.filter((term) => normalized.includes(term)).length * 2 +
      (normalized.endsWith("airdrop") ? 1 : 0);

    if (score > bestScore) {
      bestScore = score;
      bestMatch = actionName;
    }
  }

  return bestMatch;
}

function collapseWhitespace(value: string): string {
  let result = "";
  let previousWasWhitespace = false;

  for (const char of value) {
    if (char.trim() === "") {
      if (!previousWasWhitespace && result.length > 0) {
        result += " ";
      }
      previousWasWhitespace = true;
      continue;
    }

    result += char;
    previousWasWhitespace = false;
  }

  return result.trim();
}

function removeCaseInsensitiveSegment(value: string, segment: string): string {
  const lowerValue = value.toLowerCase();
  const lowerSegment = segment.toLowerCase();
  let nextSearchIndex = 0;
  let result = "";

  while (nextSearchIndex < value.length) {
    const foundIndex = lowerValue.indexOf(lowerSegment, nextSearchIndex);
    if (foundIndex === -1) {
      result += value.slice(nextSearchIndex);
      break;
    }

    result += value.slice(nextSearchIndex, foundIndex);
    result += " ";
    nextSearchIndex = foundIndex + segment.length;
  }

  return collapseWhitespace(result);
}

function trimCaseInsensitiveSuffix(value: string, suffix: string): string {
  const trimmed = value.trimEnd();
  if (!trimmed.toLowerCase().endsWith(suffix.toLowerCase())) {
    return trimmed;
  }

  return trimmed.slice(0, trimmed.length - suffix.length).trimEnd();
}

function getLaunchPhaseLabel(
  phase: Pick<NonNullable<ManifoldClaim["memePhase"]>, "id" | "name"> | null
): string {
  if (phase?.id === "0") return "Phase 0";
  if (phase?.id === "1") return "Phase 1";
  if (phase?.id === "2") return "Phase 2";
  if (phase?.id === "public") return "Public";

  const phaseName = phase?.name?.trim();
  if (!phaseName) {
    return "Current Phase";
  }

  const withoutAllowlist = removeCaseInsensitiveSegment(
    phaseName,
    "(Allowlist)"
  );
  return collapseWhitespace(
    trimCaseInsensitiveSuffix(withoutAllowlist, "Phase")
  );
}

export function getLaunchListStatus({
  primaryStatus,
  manifoldClaim,
  researchAirdropCompleted,
  payArtistCompleted,
  actionsLoaded = true,
  useCoarseOnchainStatus = false,
}: Readonly<{
  primaryStatus: ClaimPrimaryStatus;
  manifoldClaim: ManifoldClaim | null | undefined;
  researchAirdropCompleted: boolean;
  payArtistCompleted: boolean;
  actionsLoaded?: boolean;
  useCoarseOnchainStatus?: boolean;
}>): ClaimPrimaryStatus {
  if (primaryStatus.key !== "live" || !manifoldClaim) {
    return primaryStatus;
  }

  if (researchAirdropCompleted && payArtistCompleted) {
    return {
      key: "live",
      label: "Finalized",
      tone: "finalized",
      reason: "All launch phases and post-launch actions are complete",
    };
  }

  if (researchAirdropCompleted) {
    return {
      key: "live",
      label: "Pay Artist",
      tone: "post_mint",
      reason: "Research airdrop is complete. Artist payment remains",
    };
  }

  if (
    useCoarseOnchainStatus &&
    (manifoldClaim.status !== ManifoldClaimStatus.ENDED ||
      manifoldClaim.phase === ManifoldPhase.ALLOWLIST)
  ) {
    return primaryStatus;
  }

  if (manifoldClaim.status === ManifoldClaimStatus.ACTIVE) {
    const phaseLabel = getLaunchPhaseLabel(manifoldClaim.memePhase ?? null);
    return {
      key: "live",
      label: `Live - ${phaseLabel}`,
      tone: "success",
      reason: `${phaseLabel} is currently active`,
    };
  }

  if (
    manifoldClaim.status === ManifoldClaimStatus.UPCOMING ||
    manifoldClaim.nextMemePhase
  ) {
    return primaryStatus;
  }

  if (!actionsLoaded) {
    return {
      key: "checking_onchain",
      label: "Checking Onchain",
      tone: "pending",
      reason: "Loading post-launch action state",
    };
  }

  return {
    key: "live",
    label: "Airdrop Research",
    tone: "post_mint",
    reason: "Mint phases are complete. Research airdrop is next",
  };
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
    (sum, item) => sum + normalizeAirdropAmount(item.amount),
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
  if (phaseKey === "payartist") return "Pay Artist";
  return "Public Phase";
}

const DEFAULT_RESEARCH_TARGET_EDITION_SIZE = 310;

function normalizePositiveIntegerLimit(
  value: number | null | undefined
): number | null {
  const normalized = Number(value);
  if (!Number.isFinite(normalized) || normalized <= 0) {
    return null;
  }
  return Math.trunc(normalized);
}

export function getResearchTargetEditionSizeLimit(
  editionSize: number | null | undefined,
  onChainTotalMax?: number | null | undefined
): number | null {
  const dbLimit = normalizePositiveIntegerLimit(editionSize);
  const onChainLimit = normalizePositiveIntegerLimit(onChainTotalMax);

  return onChainLimit ?? dbLimit;
}

export function getDefaultResearchTargetEditionSize(
  editionSize: number | null | undefined,
  onChainTotalMax?: number | null | undefined
): number {
  const limit = getResearchTargetEditionSizeLimit(editionSize, onChainTotalMax);
  return limit == null
    ? DEFAULT_RESEARCH_TARGET_EDITION_SIZE
    : Math.min(limit, DEFAULT_RESEARCH_TARGET_EDITION_SIZE);
}

export function clampResearchTargetEditionSize(
  targetEditionSize: number,
  editionSize: number | null | undefined,
  onChainTotalMax?: number | null | undefined
): number {
  const normalizedTarget = Number(targetEditionSize);
  const safeTarget =
    Number.isFinite(normalizedTarget) && normalizedTarget >= 0
      ? Math.trunc(normalizedTarget)
      : 0;
  const limit = getResearchTargetEditionSizeLimit(editionSize, onChainTotalMax);
  return limit == null ? safeTarget : Math.min(safeTarget, limit);
}

export function getAutoSelectedLaunchPhase({
  hasPublishedMetadata,
  isInitialized,
  nowMs,
  researchAirdropCompleted,
  payArtistCompleted,
  phases,
}: Readonly<{
  hasPublishedMetadata: boolean;
  isInitialized: boolean;
  nowMs: number;
  researchAirdropCompleted: boolean;
  payArtistCompleted: boolean;
  phases: ReadonlyArray<{
    key: Exclude<LaunchPhaseKey, "research" | "payartist">;
    schedule:
      | {
          startMs: number;
          endMs: number;
        }
      | null
      | undefined;
  }>;
}>): "" | LaunchPhaseKey {
  if (!hasPublishedMetadata) {
    return "";
  }

  if (!isInitialized) {
    return "phase0";
  }

  if (researchAirdropCompleted && payArtistCompleted) {
    return "payartist";
  }

  if (researchAirdropCompleted && !payArtistCompleted) {
    return "payartist";
  }

  if (phases.every((phase) => !phase.schedule)) {
    return "phase0";
  }

  for (const phase of phases) {
    if (!phase.schedule) {
      continue;
    }
    if (nowMs <= phase.schedule.endMs) {
      return phase.key;
    }
  }

  return "research";
}

function normalizeAirdropAmount(value: number | undefined): number {
  const normalized = Number(value ?? 0);
  if (!Number.isFinite(normalized)) return 0;
  return Math.max(0, Math.trunc(normalized));
}

export function mergeAirdropsByWallet(
  entries: PhaseAirdrop[] | null
): PhaseAirdrop[] {
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

const FORMAT_TO_MIME: Record<string, string> = {
  HTML: "text/html",
  GLB: "model/gltf-binary",
  WEBM: "video/webm",
  MP4: "video/mp4",
  MOV: "video/quicktime",
  M4V: "video/x-m4v",
};

const VIDEO_EXTENSION_TO_MIME: Record<string, string> = {
  mp4: "video/mp4",
  webm: "video/webm",
  mov: "video/quicktime",
  qt: "video/quicktime",
  m4v: "video/x-m4v",
  ogv: "video/ogg",
  ogg: "video/ogg",
};

const NON_VIDEO_EXTENSION_TO_MIME: Record<string, string> = {
  glb: "model/gltf-binary",
  gltf: "model/gltf+json",
  html: "text/html",
  htm: "text/html",
};

export function getMediaTypeLabel(
  claim: MintingClaim,
  tab: LaunchMediaTab
): string {
  if (tab === "animation") {
    return getDropForgeAnimationMediaTypeLabel(claim) ?? "—";
  }
  return getDropForgeImageMediaTypeLabel(claim) ?? "—";
}

export function getAnimationMimeType(claim: MintingClaim): string | null {
  const animationUrl = claim.animation_url ?? null;
  if (!animationUrl) return null;
  const extension = getDropForgeUrlExtension(animationUrl);
  const normalizedFormat = (
    claim.animation_details as { format?: string } | null | undefined
  )?.format?.toUpperCase();

  if (normalizedFormat) {
    return FORMAT_TO_MIME[normalizedFormat] ?? "video/mp4";
  }

  if (isDropForgeVideoUrl(animationUrl)) {
    return extension
      ? (VIDEO_EXTENSION_TO_MIME[extension] ?? "video/*")
      : "video/*";
  }

  return extension
    ? (NON_VIDEO_EXTENSION_TO_MIME[extension] ?? "application/octet-stream")
    : "application/octet-stream";
}

export function getSafeExternalUrl(
  value: string | null | undefined
): string | null {
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
