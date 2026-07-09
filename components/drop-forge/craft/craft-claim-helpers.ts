import { isDropForgeVideoUrl } from "@/components/drop-forge/drop-forge-media-type.helpers";
import { resolveIpfsUrlSync } from "@/components/ipfs/IPFSContext";
import { canonicalizeInteractiveMediaUrl } from "@/components/waves/memes/submission/constants/security";
import type { MintingClaim } from "@/generated/models/MintingClaim";

export const BTN_PRIMARY =
  "tw-rounded-lg tw-border-0 tw-ring-1 tw-ring-inset tw-ring-primary-400/60 tw-bg-primary-500 tw-px-4 tw-py-2 tw-text-sm tw-font-medium tw-text-white tw-transition-colors tw-duration-150 enabled:hover:tw-bg-primary-600 enabled:hover:tw-ring-primary-300 enabled:active:tw-bg-primary-700 enabled:active:tw-ring-primary-300 disabled:tw-opacity-50";
export const BTN_SAVE =
  "tw-rounded-lg tw-border-0 tw-ring-1 tw-ring-inset tw-ring-emerald-400/70 tw-bg-emerald-500/45 tw-px-4 tw-py-2 tw-text-sm tw-font-medium tw-text-emerald-50 tw-transition-colors tw-duration-150 enabled:hover:tw-bg-emerald-500/55 enabled:hover:tw-ring-emerald-300 enabled:active:tw-bg-emerald-500/65 enabled:active:tw-ring-emerald-200 disabled:tw-opacity-50";
export const BTN_TERTIARY =
  "tw-rounded-lg tw-border-0 tw-ring-1 tw-ring-inset tw-ring-iron-600 tw-bg-iron-700 tw-px-4 tw-py-2 tw-text-sm tw-font-medium tw-text-iron-200 tw-transition-colors tw-duration-150 enabled:hover:tw-bg-iron-700/80 enabled:hover:tw-ring-iron-500 enabled:active:tw-ring-iron-500";
export const BTN_SUCCESS =
  "tw-rounded-lg tw-border-0 tw-ring-1 tw-ring-inset tw-ring-sky-500/50 tw-bg-sky-500/20 tw-px-4 tw-py-2 tw-text-sm tw-font-medium tw-text-sky-200 tw-transition-colors tw-duration-150 enabled:hover:tw-bg-sky-500/30 enabled:hover:tw-ring-sky-400 enabled:active:tw-ring-sky-400";
export const BTN_DANGER =
  "tw-rounded-lg tw-border-0 tw-ring-1 tw-ring-inset tw-ring-rose-500/50 tw-bg-rose-600/20 tw-px-4 tw-py-2 tw-text-sm tw-font-medium tw-text-rose-200 tw-transition-colors tw-duration-150 enabled:hover:tw-bg-rose-500/30 enabled:hover:tw-ring-rose-400 enabled:active:tw-ring-rose-400";
export const CRAFT_CLAIMS_LIST_PATH = "/drop-forge/craft";
export const PAGE_CONTAINER_CLASS =
  "tw-px-2 tw-pb-16 tw-pt-2 lg:tw-px-6 lg:tw-pt-8 xl:tw-px-8";
export const BACK_LINK_CLASS =
  "tw-inline-flex tw-w-full tw-justify-center sm:tw-w-auto sm:tw-justify-start tw-items-center tw-gap-2 tw-text-iron-400 tw-no-underline hover:tw-text-iron-50";
export const HEADER_ACTION_LINK_CLASS =
  "tw-inline-flex tw-w-full tw-items-center tw-justify-center tw-gap-2 tw-text-iron-400 tw-no-underline hover:tw-text-iron-50 sm:tw-ml-auto sm:tw-w-auto sm:tw-justify-start";
export const MEDIA_SOURCE_CARD_CLASS =
  "tw-flex tw-flex-col tw-items-stretch tw-gap-2 tw-rounded-lg tw-bg-iron-900/60 tw-px-4 tw-py-3 tw-ring-1 tw-ring-inset tw-ring-iron-800";

type ClaimMediaType = "image" | "video" | "glb" | "html" | "unknown";
export type DistributionSectionKey =
  | "automatic"
  | "phase0"
  | "phase1"
  | "phase2"
  | "public";

export function getClaimMediaType(claim: MintingClaim): ClaimMediaType {
  const hasImageData = Boolean(claim.image_url || claim.image_details);
  const hasAnimationData = Boolean(
    claim.animation_url || claim.animation_details
  );
  if (!hasImageData && !hasAnimationData) return "unknown";
  if (hasAnimationData) {
    const format = claim.animation_details?.format;
    if (format === "HTML") return "html";
    if (format === "GLB") return "glb";
    return "video";
  }
  return "image";
}

export function formatNullableEditionSize(
  value: number | null | undefined
): string {
  return value == null ? "" : String(value);
}

function isVideoUrl(url: string | null | undefined): boolean {
  return isDropForgeVideoUrl(url);
}

export function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string" && error.trim() !== "") return error;
  if (error && typeof error === "object") {
    const maybeError = error as {
      error?: unknown;
      message?: unknown;
      details?: Array<{ message?: unknown }>;
    };
    if (
      typeof maybeError.error === "string" &&
      maybeError.error.trim() !== ""
    ) {
      return maybeError.error;
    }
    if (
      typeof maybeError.message === "string" &&
      maybeError.message.trim() !== ""
    ) {
      return maybeError.message;
    }
    const detailMessage = maybeError.details?.[0]?.message;
    if (typeof detailMessage === "string" && detailMessage.trim() !== "") {
      return detailMessage;
    }
  }
  return fallback;
}

export function getOpenableMediaUrl(
  value: string | null | undefined
): string | null {
  const trimmedValue = value?.trim() ?? "";

  if (!trimmedValue) {
    return null;
  }

  try {
    const resolvedValue = trimmedValue.startsWith("ipfs://")
      ? resolveIpfsUrlSync(trimmedValue)
      : trimmedValue;
    const parsedUrl = new URL(resolvedValue);

    if (
      parsedUrl.protocol === "http:" ||
      parsedUrl.protocol === "https:" ||
      parsedUrl.protocol === "blob:"
    ) {
      return resolvedValue;
    }
  } catch {
    // Ignore invalid URLs and fall back to plain text.
  }

  return null;
}

export function getImageSourceCardProps({
  pendingImageFile,
  claimImageUrl,
  imageUrl,
}: Readonly<{
  pendingImageFile: File | null;
  claimImageUrl: string | null | undefined;
  imageUrl: string | null;
}>): {
  label: string;
  url: string | null;
  emptyText: string;
} {
  const hasPendingImageUpload = pendingImageFile instanceof File;

  if (hasPendingImageUpload) {
    return {
      label: "Current image URL",
      url: claimImageUrl ?? null,
      emptyText: "Pending local upload. URL available after save.",
    };
  }

  return {
    label: "Image URL",
    url: imageUrl,
    emptyText: "No image URL",
  };
}

export function getAnimationDisplayUrl({
  pendingAnimationFile,
  pendingAnimationPreviewUrl,
  pendingAnimation,
  claimAnimationUrl,
}: Readonly<{
  pendingAnimationFile: File | null;
  pendingAnimationPreviewUrl: string | null;
  pendingAnimation: string | null | undefined;
  claimAnimationUrl: string | null | undefined;
}>): string | null | undefined {
  if (pendingAnimationFile && pendingAnimationPreviewUrl) {
    return pendingAnimationPreviewUrl;
  }

  if (pendingAnimation === undefined) {
    return claimAnimationUrl;
  }

  return pendingAnimation;
}

export function getAnimationPreviewMimeType({
  pendingAnimationFile,
  animationDisplayUrl,
  mediaType,
}: Readonly<{
  pendingAnimationFile: File | null;
  animationDisplayUrl: string | null | undefined;
  mediaType: ClaimMediaType;
}>): string | null {
  if (pendingAnimationFile) {
    const mime = pendingAnimationFile.type?.toLowerCase();
    if (mime) return mime;
    const name = pendingAnimationFile.name.toLowerCase();
    if (name.endsWith(".glb")) return "model/gltf-binary";
    if (name.endsWith(".gltf")) return "model/gltf+json";
  }

  if (!animationDisplayUrl) {
    return null;
  }

  const lowered = animationDisplayUrl.toLowerCase();
  if (lowered.endsWith(".glb")) return "model/gltf-binary";
  if (lowered.endsWith(".gltf")) return "model/gltf+json";
  if (mediaType === "glb") return "model/gltf-binary";
  if (mediaType === "video" || isVideoUrl(animationDisplayUrl)) {
    return "video/mp4";
  }
  if (
    mediaType === "html" ||
    canonicalizeInteractiveMediaUrl(animationDisplayUrl) !== null
  ) {
    return "text/html";
  }

  return null;
}

export function getAnimationSourceCardProps({
  pendingAnimationFile,
  pendingAnimation,
  claimAnimationUrl,
}: Readonly<{
  pendingAnimationFile: File | null;
  pendingAnimation: string | null | undefined;
  claimAnimationUrl: string | null | undefined;
}>): {
  label: string;
  url: string | null | undefined;
  emptyText: string;
} {
  const hasPendingAnimationUpload = pendingAnimationFile instanceof File;

  if (hasPendingAnimationUpload) {
    return {
      label: "Current animation URL",
      url: claimAnimationUrl,
      emptyText: "Pending local upload. URL available after save.",
    };
  }

  if (pendingAnimation === null) {
    return {
      label: "Animation URL",
      url: null,
      emptyText: "Animation will be removed after save.",
    };
  }

  return {
    label: "Animation URL",
    url: pendingAnimation ?? claimAnimationUrl,
    emptyText: "No animation URL",
  };
}

export function getPhotoFileName(link: string): string {
  const withoutHash = link.split("#")[0] ?? link;
  const withoutQuery = withoutHash.split("?")[0] ?? withoutHash;
  const lastSegment = withoutQuery.split("/").pop() ?? "";
  if (!lastSegment) return link;

  try {
    return decodeURIComponent(lastSegment);
  } catch {
    return lastSegment;
  }
}

export function normalizeDistributionPhase(value: string): string {
  return value.replaceAll(/[\s_-]+/g, "").toLowerCase();
}

export function matchesTeamArtistAirdropPhase(
  phase: string,
  keyword: "team" | "artist"
): boolean {
  const normalizedPhase = normalizeDistributionPhase(phase);
  const tokens = normalizedPhase
    .split("+")
    .map((token) => token.trim())
    .filter(Boolean);

  if (tokens.length !== 1) return false;

  const [token] = tokens;
  return (
    token === keyword ||
    token === `airdrop${keyword}` ||
    token === `${keyword}airdrop` ||
    token === `airdrops${keyword}` ||
    token === `${keyword}airdrops`
  );
}

export function normalizeRootPhase(value: string): string {
  return value.replaceAll(/\s+/g, "").toLowerCase();
}
