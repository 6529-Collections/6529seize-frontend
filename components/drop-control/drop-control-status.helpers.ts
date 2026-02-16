import { isMissingRequiredLaunchInfo } from "@/components/drop-control/launchClaimHelpers";
import type { MemeClaim } from "@/generated/models/MemeClaim";
import type { ManifoldClaim } from "@/hooks/useManifoldClaim";

export type ClaimPrimaryStatusKey =
  | "draft"
  | "publishing"
  | "published"
  | "pending_initialization_missing_info"
  | "pending_initialization"
  | "live"
  | "live_needs_update"
  | "diverged";

export type ClaimPrimaryStatusTone =
  | "neutral"
  | "pending"
  | "success"
  | "update"
  | "destructive";

export interface ClaimPrimaryStatus {
  key: ClaimPrimaryStatusKey;
  label: string;
  tone: ClaimPrimaryStatusTone;
  reason?: string;
}

export function getPrimaryStatusPillClassName(
  tone: ClaimPrimaryStatusTone
): string {
  if (tone === "pending") {
    return "tw-bg-amber-500/15 tw-text-amber-300 tw-ring-amber-400/40";
  }
  if (tone === "success") {
    return "tw-bg-emerald-500/15 tw-text-emerald-300 tw-ring-emerald-400/40";
  }
  if (tone === "update") {
    return "tw-bg-orange-500/15 tw-text-orange-300 tw-ring-orange-400/40";
  }
  if (tone === "destructive") {
    return "tw-bg-rose-500/15 tw-text-rose-300 tw-ring-rose-400/40";
  }
  return "tw-bg-iron-700/30 tw-text-iron-300 tw-ring-iron-500/40";
}

export function getClaimPrimaryStatus({
  claim,
  manifoldClaim,
}: {
  claim: MemeClaim;
  manifoldClaim?: Pick<ManifoldClaim, "instanceId" | "location"> | null;
}): ClaimPrimaryStatus {
  const initializedOnchain = !!manifoldClaim?.instanceId;
  const hasLocalMetadata = claim.metadata_location != null;
  const chainMatchesLocal = manifoldClaim?.location === claim.metadata_location;
  const missingLaunchInfo = isMissingRequiredLaunchInfo(claim);

  if (claim.media_uploading === true) {
    return {
      key: "publishing",
      label: "Publishing…",
      tone: "pending",
      reason: "Uploading media and metadata to Arweave now",
    };
  }

  if (!hasLocalMetadata && !initializedOnchain) {
    return {
      key: "draft",
      label: "Draft",
      tone: "neutral",
      reason: "Stored in DB only. Publish to Arweave to continue",
    };
  }

  if (hasLocalMetadata && !initializedOnchain && !missingLaunchInfo) {
    return {
      key: "published",
      label: "Published",
      tone: "success",
      reason: "Published to Arweave and ready for onchain initialization",
    };
  }

  if (!initializedOnchain && missingLaunchInfo === true) {
    return {
      key: "pending_initialization_missing_info",
      label: "Pending Initialization — Missing Info",
      tone: "pending",
      reason: "Not onchain yet. Required launch fields are missing",
    };
  }

  if (!initializedOnchain && hasLocalMetadata && missingLaunchInfo === false) {
    return {
      key: "pending_initialization",
      label: "Pending Initialization",
      tone: "pending",
      reason: "Ready to initialize onchain",
    };
  }

  if (initializedOnchain && hasLocalMetadata && chainMatchesLocal === false) {
    return {
      key: "live_needs_update",
      label: "Live — Needs Update",
      tone: "update",
      reason: "Onchain metadata points to an older CID",
    };
  }

  if (initializedOnchain && hasLocalMetadata && chainMatchesLocal === true) {
    return {
      key: "live",
      label: "Live",
      tone: "success",
      reason: "DB, Arweave, and onchain metadata all match",
    };
  }

  return {
    key: "diverged",
    label: "Diverged",
    tone: "destructive",
    reason: "DB, Arweave, and onchain sources conflict",
  };
}
