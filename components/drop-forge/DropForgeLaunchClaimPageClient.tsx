"use client";

import { MEMES_MANIFOLD_PROXY_ABI } from "@/abis/abis";
import { useAuth } from "@/components/auth/Auth";
import DropForgeLaunchIcon from "@/components/common/icons/DropForgeLaunchIcon";
import CircleLoader, {
  CircleLoaderSize,
} from "@/components/distribution-plan-tool/common/CircleLoader";
import { useDropForgeMintingConfig } from "@/components/drop-forge/drop-forge-config";
import {
  getClaimPrimaryStatus,
  getPrimaryStatusPillClassName,
} from "@/components/drop-forge/drop-forge-status.helpers";
import DropForgeExplorerLink from "@/components/drop-forge/DropForgeExplorerLink";
import DropForgeFieldBox from "@/components/drop-forge/DropForgeFieldBox";
import DropForgeMediaTypePill from "@/components/drop-forge/DropForgeMediaTypePill";
import { DropForgePermissionFallback } from "@/components/drop-forge/DropForgePermissionFallback";
import DropForgeStatusPill from "@/components/drop-forge/DropForgeStatusPill";
import DropForgeTestnetIndicator from "@/components/drop-forge/DropForgeTestnetIndicator";
import { isMissingRequiredLaunchInfo } from "@/components/drop-forge/launchClaimHelpers";
import MediaDisplay from "@/components/drops/view/item/content/media/MediaDisplay";
import { getMintTimelineDetails } from "@/components/meme-calendar/meme-calendar.helpers";
import {
  MANIFOLD_LAZY_CLAIM_CONTRACT,
  MEMES_CONTRACT,
  MEMES_DEPLOYER,
  NULL_ADDRESS,
  NULL_MERKLE,
} from "@/constants/constants";
import type { MemeClaim } from "@/generated/models/MemeClaim";
import type { MemesMintingRootItem } from "@/generated/models/MemesMintingRootItem";
import type { PhaseAirdrop } from "@/generated/models/PhaseAirdrop";
import {
  capitalizeEveryWord,
  fromGWEI,
  getTransactionLink,
} from "@/helpers/Helpers";
import { Time } from "@/helpers/time";
import { useDropForgeManifoldClaim } from "@/hooks/useDropForgeManifoldClaim";
import { useDropForgePermissions } from "@/hooks/useDropForgePermissions";
import { buildMemesPhases } from "@/hooks/useManifoldClaim";
import {
  getClaim,
  getDistributionAirdropsArtist,
  getDistributionAirdropsTeam,
  getFinalSubscriptionsByPhase,
  getMemesMintingRoots,
} from "@/services/api/memes-minting-claims-api";
import { ChevronDownIcon, ChevronRightIcon } from "@heroicons/react/20/solid";
import { ArrowLeftIcon, XMarkIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Chain, isAddress, parseEther } from "viem";
import { useWaitForTransactionReceipt, useWriteContract } from "wagmi";

interface DropForgeLaunchClaimPageClientProps {
  memeId: number;
}
type LaunchPhaseKey =
  | "phase0"
  | "phase1"
  | "phase2"
  | "publicphase"
  | "research";
type ClaimTxModalStatus = "confirm_wallet" | "submitted" | "success" | "error";

interface ClaimTxModalState {
  status: ClaimTxModalStatus;
  message?: string | undefined;
  txHash?: `0x${string}` | undefined;
  actionLabel?: string | undefined;
}

const SECTION_CARD_CLASS =
  "tw-rounded-xl tw-bg-iron-950 tw-p-4 tw-ring-1 tw-ring-inset tw-ring-iron-800 sm:tw-p-5";
const BTN_SUBSCRIPTIONS_AIRDROP =
  "tw-h-12 tw-w-full sm:tw-w-64 tw-rounded-lg tw-border-0 tw-ring-1 tw-ring-inset tw-ring-primary-400/60 tw-bg-primary-500 tw-px-5 tw-text-base tw-font-semibold tw-text-white tw-transition-colors tw-duration-150 enabled:hover:tw-bg-primary-600 enabled:hover:tw-ring-primary-300 enabled:active:tw-bg-primary-700 enabled:active:tw-ring-primary-300 disabled:tw-cursor-not-allowed disabled:tw-opacity-50";
const BTN_METADATA_UPDATE_ACTION =
  "tw-h-12 tw-w-full sm:tw-w-64 tw-rounded-lg tw-border-0 tw-bg-orange-600 tw-px-5 tw-text-base tw-font-semibold tw-text-orange-50 tw-ring-1 tw-ring-inset tw-ring-orange-300/60 tw-shadow-[0_8px_18px_rgba(234,88,12,0.25)] tw-transition-colors tw-duration-150 enabled:hover:tw-bg-orange-500 enabled:active:tw-bg-orange-700 disabled:tw-cursor-not-allowed disabled:tw-opacity-50";
const DEFAULT_PHASE_PRICE_ETH = "0.06529";
const RESEARCH_AIRDROP_ADDRESS = "0xc2ce4ccef11a8171f443745cea3bceeaadd750c7";

type SectionTone = "neutral" | "success" | "warning" | "danger";
type LaunchMediaTab = "image" | "animation";
type LaunchMediaKind = "image" | "video" | "glb" | "html" | "unknown";

interface LaunchAccordionSectionProps {
  title: string;
  subtitle: string;
  tone: SectionTone;
  defaultOpen?: boolean;
  disabled?: boolean;
  onOpen?: () => void;
  headerRight?: React.ReactNode;
  showHeaderRightWhenOpen?: boolean;
  children: React.ReactNode;
}

function parseLocalDateTimeToUnixSeconds(value: string): number | null {
  if (!value) return null;
  const millis = new Date(value).getTime();
  if (Number.isNaN(millis)) return null;
  return Math.floor(millis / 1000);
}

function toneClass(tone: SectionTone): string {
  if (tone === "success") {
    return "tw-bg-emerald-500/15 tw-text-emerald-300 tw-ring-emerald-400/40";
  }
  if (tone === "warning") {
    return "tw-bg-amber-500/15 tw-text-amber-300 tw-ring-amber-400/40";
  }
  if (tone === "danger") {
    return "tw-bg-rose-500/15 tw-text-rose-300 tw-ring-rose-400/40";
  }
  return "tw-bg-iron-700/30 tw-text-iron-400 tw-ring-iron-500/40";
}

function getErrorMessage(error: unknown, fallback: string): string {
  const normalize = (message: string): string => {
    const withoutRequestArgs = message.split("Request Arguments")[0] ?? message;
    const compact = withoutRequestArgs.replace(/\s+/g, " ").trim();
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

function isNotFoundError(message: string): boolean {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("not found") ||
    normalized.includes("status code 404") ||
    message === "Claim not found"
  );
}

function normalizePhaseName(value: string): string {
  return value.replace(/\s+/g, "").toLowerCase();
}

function normalizeHexValue(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

function getRootForPhase(
  roots: MemesMintingRootItem[] | null,
  phase: "phase0" | "phase1" | "phase2" | "publicphase"
): MemesMintingRootItem | null {
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

function getRootAddressesCount(
  root: MemesMintingRootItem | null | undefined
): number | null {
  if (!root) return null;
  const value =
    (root as unknown as { addresses_count?: number; addresses?: number })
      .addresses_count ??
    (root as unknown as { addresses_count?: number; addresses?: number })
      .addresses;
  return typeof value === "number" ? value : null;
}

function getRootTotalSpots(
  root: MemesMintingRootItem | null | undefined
): number | null {
  if (!root) return null;
  const value =
    (root as unknown as { total_spots?: number; total?: number }).total_spots ??
    (root as unknown as { total_spots?: number; total?: number }).total;
  return typeof value === "number" ? value : null;
}

function summarizeAirdrops(entries: PhaseAirdrop[] | null): {
  addresses: number;
  totalAirdrops: number;
} {
  if (!entries || entries.length === 0) {
    return { addresses: 0, totalAirdrops: 0 };
  }

  const uniqueWallets = new Set(
    entries.map((item) => item.wallet.toLowerCase())
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

function getSubscriptionPhaseName(phaseKey: LaunchPhaseKey): string {
  if (phaseKey === "phase0") return "Phase 0";
  if (phaseKey === "phase1") return "Phase 1";
  if (phaseKey === "phase2") return "Phase 2";
  if (phaseKey === "research") return "Public Phase";
  return "Public Phase";
}

function normalizeAirdropAmount(value: number | undefined): number {
  const normalized = Number(value ?? 0);
  if (!Number.isFinite(normalized)) return 0;
  return Math.max(0, Math.trunc(normalized));
}

function mergeAirdropsByWallet(entries: PhaseAirdrop[] | null): PhaseAirdrop[] {
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
    if (!existing) {
      merged.set(key, { wallet, amount });
      orderedKeys.push(key);
    } else {
      existing.amount = normalizeAirdropAmount(existing.amount) + amount;
      merged.set(key, existing);
    }
  }

  return orderedKeys
    .map((key) => merged.get(key))
    .filter((item): item is PhaseAirdrop => Boolean(item));
}

function buildSubscriptionAirdropSelection(
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

function formatLocalDateTime(date: Date): string {
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

function formatScheduledLabel(date: Date): string {
  const weekday = date.toLocaleDateString(undefined, { weekday: "long" });
  const day = String(date.getDate()).padStart(2, "0");
  const month = date.toLocaleDateString(undefined, { month: "short" });
  const year = date.getFullYear();
  return `${weekday} ${day} ${month}, ${year}`;
}

function formatDateTimeLocalInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function getClaimTxModalEmoji(status: ClaimTxModalStatus): string {
  if (status === "success") return "/emojis/sgt_saluting_face.webp";
  if (status === "error") return "/emojis/sgt_sob.webp";
  return "/emojis/sgt_grimacing.webp";
}

function ClaimTransactionModal({
  state,
  chain,
  onClose,
}: {
  state: ClaimTxModalState | null;
  chain: Chain;
  onClose: () => void;
}) {
  if (!state) return null;

  const closable = state.status === "success" || state.status === "error";
  const txUrl = state.txHash
    ? getTransactionLink(chain.id, state.txHash)
    : null;
  const modalTitle = state.actionLabel ?? "Onchain Action";

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="tw-fixed tw-inset-0 tw-z-[1100] tw-flex tw-items-center tw-justify-center tw-bg-gray-600 tw-bg-opacity-50 tw-px-4 tw-backdrop-blur-[1px]"
      onClick={() => {
        if (closable) onClose();
      }}
      role="presentation"
    >
      <div
        className="tw-relative tw-w-full tw-max-w-md tw-rounded-xl tw-bg-iron-950 tw-p-6 tw-shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="tw-flex tw-items-center tw-justify-between tw-border-b tw-border-iron-800 tw-pb-3">
          <h2 className="tw-mb-0 tw-text-xl tw-font-semibold tw-text-white">
            {modalTitle}
          </h2>
          {closable ? (
            <button
              type="button"
              aria-label="Close modal"
              onClick={onClose}
              className="tw--mt-0.5 tw-inline-flex tw-size-9 tw-items-center tw-justify-center tw-rounded-full tw-border-0 tw-bg-transparent tw-text-iron-300 tw-transition tw-duration-300 tw-ease-out desktop-hover:hover:tw-text-iron-400"
            >
              <XMarkIcon className="tw-h-5 tw-w-5" />
            </button>
          ) : null}
        </div>

        <div className="tw-mt-4 tw-flex tw-min-h-[120px] tw-items-center tw-justify-center tw-rounded-xl tw-bg-iron-800 tw-p-3">
          {state.status === "error" ? (
            <div className="tw-w-full tw-min-w-0 tw-max-w-full tw-text-center">
              <p className="tw-mb-4 tw-flex tw-items-center tw-justify-center tw-gap-2 tw-text-lg tw-font-medium tw-text-red">
                Error
                <img
                  src={getClaimTxModalEmoji("error")}
                  alt="error"
                  className="tw-h-6 tw-w-6"
                />
              </p>
              <div className="tw-mx-auto tw-max-h-40 tw-w-full tw-max-w-full tw-overflow-auto tw-pr-1">
                <p className="tw-mb-0 tw-whitespace-pre-wrap tw-break-words tw-text-iron-100">
                  {state.message || "Transaction failed"}
                </p>
              </div>
              {txUrl ? (
                <a
                  className="btn btn-white btn-sm tw-mt-3 tw-font-medium"
                  href={txUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View Tx
                </a>
              ) : null}
            </div>
          ) : null}

          {state.status === "confirm_wallet" ? (
            <div className="tw-flex tw-items-center tw-justify-center tw-gap-2">
              <img
                src={getClaimTxModalEmoji("confirm_wallet")}
                alt="confirm_wallet"
                className="tw-h-6 tw-w-6"
              />
              <p className="tw-mb-0 tw-text-lg tw-font-medium tw-text-iron-100">
                Confirm in your wallet
              </p>
              <CircleLoader size={CircleLoaderSize.LARGE} />
            </div>
          ) : null}

          {state.status === "submitted" ? (
            <div className="tw-text-center">
              <p className="tw-mb-4 tw-flex tw-items-center tw-justify-center tw-gap-2 tw-text-lg tw-font-medium tw-text-iron-100">
                <img
                  src={getClaimTxModalEmoji("submitted")}
                  alt="submitted"
                  className="tw-h-6 tw-w-6"
                />
                Transaction Submitted
                {txUrl ? (
                  <a
                    className="btn btn-white btn-sm tw-font-medium"
                    href={txUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View Tx
                  </a>
                ) : null}
              </p>
              <p className="tw-mb-2 tw-flex tw-items-center tw-justify-center tw-gap-2 tw-text-md tw-font-medium tw-text-iron-100">
                Waiting for confirmation{" "}
                <CircleLoader size={CircleLoaderSize.MEDIUM} />
              </p>
            </div>
          ) : null}

          {state.status === "success" ? (
            <div className="tw-text-center">
              <p className="tw-mb-0 tw-flex tw-items-center tw-justify-center tw-gap-2 tw-text-lg tw-font-medium tw-text-green">
                <img
                  src={getClaimTxModalEmoji("success")}
                  alt="success"
                  className="tw-h-6 tw-w-6"
                />
                Transaction Successful!
                {txUrl ? (
                  <a
                    className="btn btn-white btn-sm tw-font-medium"
                    href={txUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View Tx
                  </a>
                ) : null}
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>,
    document.body
  );
}

function isVideoUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  const lower = url.toLowerCase();
  return (
    lower.includes(".mp4") ||
    lower.includes(".webm") ||
    lower.includes(".mov") ||
    lower.includes(".m4v")
  );
}

function normalizeFormat(format: string | null | undefined): string | null {
  return format ? format.toUpperCase() : null;
}

function getUrlExtension(url: string | null | undefined): string | null {
  if (!url) return null;
  const clean = url.split("?")[0]?.split("#")[0] ?? "";
  const parts = clean.split(".");
  if (parts.length < 2) return null;
  return parts[parts.length - 1]?.toLowerCase() ?? null;
}

function getImageFormat(claim: MemeClaim): string | null {
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

function getAnimationInfo(
  claim: MemeClaim
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
  if (isVideoUrl(claim.animation_url)) return { kind: "video" };
  return { kind: "video" };
}

function getMediaTypeLabel(claim: MemeClaim, tab: LaunchMediaTab): string {
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

function getAnimationMimeType(claim: MemeClaim): string | null {
  const animationUrl = claim.animation_url ?? null;
  if (!animationUrl) return null;
  const format = (
    claim.animation_details as { format?: string } | null | undefined
  )?.format;
  if (format === "HTML") return "text/html";
  if (format === "GLB") return "model/gltf-binary";
  if (format) return "video/mp4";
  if (isVideoUrl(animationUrl)) return "video/mp4";
  if (animationUrl.toLowerCase().endsWith(".glb")) return "model/gltf-binary";
  if (animationUrl.toLowerCase().endsWith(".gltf")) return "model/gltf+json";
  if (animationUrl.toLowerCase().endsWith(".html")) return "text/html";
  return "video/mp4";
}

function toArweaveUrl(location: string | null | undefined): string | null {
  if (!location) return null;
  const trimmed = location.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  return `https://arweave.net/${trimmed}`;
}

function LaunchAccordionSection({
  title,
  subtitle,
  tone,
  defaultOpen = false,
  disabled = false,
  onOpen,
  headerRight,
  showHeaderRightWhenOpen = false,
  children,
}: LaunchAccordionSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const toggleOpen = () => {
    if (disabled) return;
    setIsOpen((prev) => {
      const next = !prev;
      if (next) {
        onOpen?.();
      }
      return next;
    });
  };

  useEffect(() => {
    setIsOpen(defaultOpen);
  }, [defaultOpen]);

  useEffect(() => {
    if (disabled) {
      setIsOpen(false);
    }
  }, [disabled]);

  return (
    <div className={SECTION_CARD_CLASS}>
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-expanded={isOpen}
        aria-disabled={disabled}
        onClick={toggleOpen}
        onKeyDown={(event) => {
          if (disabled) return;
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            toggleOpen();
          }
        }}
        style={disabled ? { cursor: "default" } : undefined}
        className={`tw-flex tw-w-full tw-items-center tw-justify-between tw-gap-2 tw-bg-transparent tw-p-0 tw-text-left ${
          disabled ? "tw-!cursor-default" : "tw-cursor-pointer"
        }`}
      >
        <span className="tw-inline-flex tw-items-center tw-gap-2">
          <span className="tw-relative tw-h-5 tw-w-5 tw-flex-shrink-0">
            <ChevronRightIcon
              className={`tw-absolute tw-inset-0 tw-h-5 tw-w-5 tw-transition-all tw-duration-200 ${
                isOpen
                  ? "tw-rotate-90 tw-opacity-0"
                  : "tw-rotate-0 tw-opacity-100"
              } ${disabled ? "tw-text-iron-400" : "tw-text-white"}`}
            />
            <ChevronDownIcon
              className={`tw-absolute tw-inset-0 tw-h-5 tw-w-5 tw-transition-all tw-duration-200 ${
                isOpen
                  ? "tw-rotate-0 tw-opacity-100"
                  : "-tw-rotate-90 tw-opacity-0"
              } ${disabled ? "tw-text-iron-400" : "tw-text-white"}`}
            />
          </span>
          <span
            className={`tw-text-base tw-font-semibold ${
              disabled ? "tw-text-iron-400" : "tw-text-iron-50"
            }`}
          >
            {title}
          </span>
        </span>
        <span className="tw-inline-flex tw-items-center tw-gap-2">
          {headerRight && (!showHeaderRightWhenOpen || isOpen) ? (
            <span
              onClick={(event) => event.stopPropagation()}
              onMouseDown={(event) => event.stopPropagation()}
            >
              {headerRight}
            </span>
          ) : null}
          {subtitle ? (
            <span
              className={`tw-inline-flex tw-items-center tw-rounded-full tw-px-3 tw-py-1 tw-text-sm tw-font-medium tw-ring-1 tw-ring-inset ${toneClass(tone)}`}
            >
              {subtitle}
            </span>
          ) : null}
        </span>
      </div>
      <div
        className={`tw-grid tw-transition-all tw-duration-200 tw-ease-out ${
          isOpen
            ? "tw-mt-5 tw-grid-rows-[1fr] tw-opacity-100"
            : "tw-mt-0 tw-grid-rows-[0fr] tw-opacity-0"
        }`}
      >
        <div
          className={`tw-space-y-5 ${
            isOpen ? "tw-overflow-visible" : "tw-overflow-hidden"
          }`}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

export default function DropForgeLaunchClaimPageClient({
  memeId,
}: DropForgeLaunchClaimPageClientProps) {
  const pageTitle = `Launch Claim #${memeId}`;
  const { setToast } = useAuth();
  const {
    contract: dropControlMintingContract,
    chain: dropControlMintingChain,
  } = useDropForgeMintingConfig();
  const { hasWallet, permissionsLoading, canAccessLaunchPage } =
    useDropForgePermissions();
  const claimWrite = useWriteContract();
  const waitClaimWrite = useWaitForTransactionReceipt({
    chainId: dropControlMintingChain.id,
    confirmations: 1,
    hash: claimWrite.data,
  });
  const [onChainClaimSpinnerVisible, setOnChainClaimSpinnerVisible] =
    useState(false);
  const {
    claim: manifoldClaim,
    isFetching: onChainClaimFetching,
    refetch: refetchOnChainClaim,
  } = useDropForgeManifoldClaim(memeId);
  const [claim, setClaim] = useState<MemeClaim | null>(null);
  const [roots, setRoots] = useState<MemesMintingRootItem[] | null>(null);
  const [, setRootsLoading] = useState(false);
  const [rootsError, setRootsError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeMediaTab, setActiveMediaTab] = useState<LaunchMediaTab>("image");
  const [selectedPhase, setSelectedPhase] = useState<"" | LaunchPhaseKey>("");
  const [researchTargetEditionSize, setResearchTargetEditionSize] =
    useState(310);
  const [phaseAllowlistWindows, setPhaseAllowlistWindows] = useState<
    Record<string, { start: string; end: string }>
  >({});
  const [phasePricesEth, setPhasePricesEth] = useState<Record<string, string>>(
    {}
  );
  const [artistAirdrops, setArtistAirdrops] = useState<PhaseAirdrop[] | null>(
    null
  );
  const [teamAirdrops, setTeamAirdrops] = useState<PhaseAirdrop[] | null>(null);
  const [subscriptionAirdropsByPhase, setSubscriptionAirdropsByPhase] =
    useState<Partial<Record<LaunchPhaseKey, PhaseAirdrop[]>>>({});
  const [
    subscriptionAirdropsLoadingByPhase,
    setSubscriptionAirdropsLoadingByPhase,
  ] = useState<Partial<Record<LaunchPhaseKey, boolean>>>({});
  const [
    subscriptionAirdropsErrorByPhase,
    setSubscriptionAirdropsErrorByPhase,
  ] = useState<Partial<Record<LaunchPhaseKey, string | null>>>({});
  const [phase0AirdropsLoading, setPhase0AirdropsLoading] = useState(false);
  const [phase0AirdropsError, setPhase0AirdropsError] = useState<string | null>(
    null
  );
  const [claimTxModal, setClaimTxModal] = useState<ClaimTxModalState | null>(
    null
  );
  const lastErrorToastRef = useRef<{ message: string; ts: number } | null>(
    null
  );
  const onChainClaimFetchStartedAtRef = useRef<number | null>(null);
  const onChainClaimSpinnerHideTimeoutRef = useRef<ReturnType<
    typeof setTimeout
  > | null>(null);

  const showErrorToast = useCallback(
    (message: string) => {
      const now = Date.now();
      const last = lastErrorToastRef.current;
      if (last && last.message === message && now - last.ts < 2000) {
        return;
      }
      lastErrorToastRef.current = { message, ts: now };
      setToast({ message, type: "error" });
    },
    [setToast]
  );

  const permissionFallback = DropForgePermissionFallback({
    title: pageTitle,
    permissionsLoading,
    hasWallet,
    hasAccess: canAccessLaunchPage,
    titleIcon: DropForgeLaunchIcon,
    titleRight: (
      <div className="tw-flex tw-flex-shrink-0 tw-items-center tw-gap-2">
        <DropForgeExplorerLink />
        <DropForgeTestnetIndicator />
      </div>
    ),
  });

  useEffect(() => {
    if (!hasWallet || !canAccessLaunchPage) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setRootsLoading(true);
    setRootsError(null);
    getClaim(memeId)
      .then((res) => {
        if (!cancelled) {
          setClaim(res);
        }
      })
      .catch((e) => {
        const msg = getErrorMessage(e, "Failed to load claim");
        if (!cancelled) {
          if (isNotFoundError(msg)) {
            setError("Claim not found");
          } else {
            setError(msg);
            showErrorToast(msg);
          }
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    getMemesMintingRoots(MEMES_CONTRACT, memeId)
      .then((res) => {
        if (!cancelled) {
          setRoots(res);
        }
      })
      .catch((e) => {
        const msg = getErrorMessage(e, "Failed to load roots");
        if (!cancelled) {
          if (isNotFoundError(msg)) {
            setRootsError(null);
          } else {
            setRootsError(msg);
            showErrorToast(msg);
          }
        }
      })
      .finally(() => {
        if (!cancelled) {
          setRootsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [hasWallet, canAccessLaunchPage, memeId, showErrorToast]);

  useEffect(() => {
    if (!hasWallet || !canAccessLaunchPage || claim?.media_uploading !== true)
      return;
    let cancelled = false;
    const id = setInterval(() => {
      getClaim(memeId)
        .then((res) => {
          if (!cancelled) {
            setClaim(res);
          }
        })
        .catch((e) => {
          const msg = getErrorMessage(e, "Failed to refresh claim status");
          if (!cancelled) {
            if (isNotFoundError(msg)) {
              setError("Claim not found");
            } else {
              setError(msg);
              showErrorToast(msg);
            }
          }
        });
    }, 10000);

    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [
    hasWallet,
    canAccessLaunchPage,
    claim?.media_uploading,
    memeId,
    showErrorToast,
  ]);

  const isInitialized = Boolean(manifoldClaim?.instanceId);
  const hasPublishedMetadata = Boolean(claim?.metadata_location != null);
  const missingRequiredInfo = Boolean(
    claim && isMissingRequiredLaunchInfo(claim)
  );
  const primaryStatus = claim
    ? getClaimPrimaryStatus({ claim, manifoldClaim: manifoldClaim ?? null })
    : null;
  const hasImage = Boolean(claim?.image_url);
  const hasAnimation = Boolean(claim?.animation_url);
  const animationMimeType = claim ? getAnimationMimeType(claim) : null;
  const activeMediaTypeLabel = claim
    ? getMediaTypeLabel(claim, activeMediaTab)
    : "—";

  useEffect(() => {
    setActiveMediaTab("image");
  }, [memeId]);

  useEffect(() => {
    if (!hasPublishedMetadata) {
      setSelectedPhase("");
      return;
    }
    if (!isInitialized) {
      setSelectedPhase("phase0");
      return;
    }
    setSelectedPhase((prev) => prev || "phase0");
  }, [hasPublishedMetadata, isInitialized]);

  useEffect(() => {
    setArtistAirdrops(null);
    setTeamAirdrops(null);
    setPhase0AirdropsError(null);
    setPhase0AirdropsLoading(false);
    setSubscriptionAirdropsByPhase({});
    setSubscriptionAirdropsLoadingByPhase({});
    setSubscriptionAirdropsErrorByPhase({});
  }, [memeId]);

  useEffect(() => {
    if (!hasWallet || !canAccessLaunchPage) return;
    if (selectedPhase !== "phase0") return;
    if (artistAirdrops !== null && teamAirdrops !== null) return;

    let cancelled = false;
    setPhase0AirdropsLoading(true);
    setPhase0AirdropsError(null);

    Promise.all([
      getDistributionAirdropsArtist(MEMES_CONTRACT, memeId),
      getDistributionAirdropsTeam(MEMES_CONTRACT, memeId),
    ])
      .then(([artist, team]) => {
        if (cancelled) return;
        setArtistAirdrops(artist);
        setTeamAirdrops(team);
      })
      .catch((e) => {
        const msg = getErrorMessage(
          e,
          "Failed to load artist/team airdrop data"
        );
        if (cancelled) return;
        setPhase0AirdropsError(msg);
      })
      .finally(() => {
        if (!cancelled) {
          setPhase0AirdropsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [
    hasWallet,
    canAccessLaunchPage,
    selectedPhase,
    artistAirdrops,
    teamAirdrops,
    memeId,
  ]);

  const fetchSubscriptionAirdropsForPhase = useCallback(
    async (phaseKey: LaunchPhaseKey) => {
      setSubscriptionAirdropsLoadingByPhase((prev) => ({
        ...prev,
        [phaseKey]: true,
      }));
      setSubscriptionAirdropsErrorByPhase((prev) => ({
        ...prev,
        [phaseKey]: null,
      }));

      try {
        const entries = await getFinalSubscriptionsByPhase(
          MEMES_CONTRACT,
          memeId,
          getSubscriptionPhaseName(phaseKey)
        );
        setSubscriptionAirdropsByPhase((prev) => ({
          ...prev,
          [phaseKey]: entries,
        }));
      } catch (e) {
        const msg = getErrorMessage(
          e,
          `Failed to load ${getSubscriptionPhaseName(phaseKey)} subscriptions`
        );
        setSubscriptionAirdropsByPhase((prev) => ({
          ...prev,
          [phaseKey]: [],
        }));
        setSubscriptionAirdropsErrorByPhase((prev) => ({
          ...prev,
          [phaseKey]: msg,
        }));
      } finally {
        setSubscriptionAirdropsLoadingByPhase((prev) => ({
          ...prev,
          [phaseKey]: false,
        }));
      }
    },
    [memeId]
  );

  useEffect(() => {
    if (!hasWallet || !canAccessLaunchPage || !selectedPhase) return;

    const phasesToLoad: LaunchPhaseKey[] =
      selectedPhase === "phase0"
        ? ["phase0"]
        : selectedPhase === "phase1"
          ? ["phase1"]
          : selectedPhase === "phase2"
            ? ["phase2", "publicphase"]
            : [];

    for (const phaseKey of phasesToLoad) {
      const hasValue = subscriptionAirdropsByPhase[phaseKey] !== undefined;
      const isLoading = Boolean(subscriptionAirdropsLoadingByPhase[phaseKey]);
      if (!hasValue && !isLoading) {
        void fetchSubscriptionAirdropsForPhase(phaseKey);
      }
    }
  }, [
    hasWallet,
    canAccessLaunchPage,
    selectedPhase,
    subscriptionAirdropsByPhase,
    subscriptionAirdropsLoadingByPhase,
    fetchSubscriptionAirdropsForPhase,
  ]);

  const artistAirdropSummary = useMemo(
    () => summarizeAirdrops(artistAirdrops),
    [artistAirdrops]
  );
  const teamAirdropSummary = useMemo(
    () => summarizeAirdrops(teamAirdrops),
    [teamAirdrops]
  );
  const remainingEditionsForSubscriptions = Math.max(
    0,
    Number(manifoldClaim?.remaining ?? 0)
  );
  const subscriptionAirdropSectionConfigs = useMemo(() => {
    if (selectedPhase === "phase0") {
      return [
        {
          phaseKey: "phase0" as LaunchPhaseKey,
          title: "Phase 0 Subscription Airdrops",
        },
      ];
    }
    if (selectedPhase === "phase1") {
      return [
        {
          phaseKey: "phase1" as LaunchPhaseKey,
          title: "Phase 1 Subscription Airdrops",
        },
      ];
    }
    if (selectedPhase === "phase2") {
      return [
        {
          phaseKey: "phase2" as LaunchPhaseKey,
          title: "Phase 2 Subscription Airdrops",
        },
        {
          phaseKey: "publicphase" as LaunchPhaseKey,
          title: "Public Phase Subscription Airdrops",
        },
      ];
    }
    return [];
  }, [selectedPhase]);
  const subscriptionAirdropSections = useMemo(
    () =>
      subscriptionAirdropSectionConfigs.map((section) => {
        const rawEntries =
          subscriptionAirdropsByPhase[section.phaseKey] ?? null;
        const mergedEntries = mergeAirdropsByWallet(rawEntries);
        const summary = summarizeAirdrops(mergedEntries);
        const capped = buildSubscriptionAirdropSelection(
          mergedEntries,
          remainingEditionsForSubscriptions
        );

        return {
          ...section,
          loading: Boolean(
            subscriptionAirdropsLoadingByPhase[section.phaseKey]
          ),
          error: subscriptionAirdropsErrorByPhase[section.phaseKey] ?? null,
          addresses: summary.addresses,
          totalAirdrops: summary.totalAirdrops,
          airdropEntries: capped.selected,
          airdropCount: capped.selectedTotal,
        };
      }),
    [
      subscriptionAirdropSectionConfigs,
      subscriptionAirdropsByPhase,
      subscriptionAirdropsLoadingByPhase,
      subscriptionAirdropsErrorByPhase,
      remainingEditionsForSubscriptions,
    ]
  );
  const mintTimeline = useMemo(
    () => (memeId > 0 ? getMintTimelineDetails(memeId) : null),
    [memeId]
  );

  const phaseData = useMemo(() => {
    const scheduleByPhaseId = new Map(
      (mintTimeline
        ? buildMemesPhases(Time.millis(mintTimeline.instantUtc.getTime()))
        : []
      ).map((phase) => [phase.id, phase])
    );

    return [
      {
        key: "phase0" as const,
        title: "Phase 0 - Initialize Claim",
        root: getRootForPhase(roots, "phase0"),
        schedule: scheduleByPhaseId.get("0"),
      },
      {
        key: "phase1" as const,
        title: "Phase 1",
        root: getRootForPhase(roots, "phase1"),
        schedule: scheduleByPhaseId.get("1"),
      },
      {
        key: "phase2" as const,
        title: "Phase 2",
        root: getRootForPhase(roots, "phase2"),
        schedule: scheduleByPhaseId.get("2"),
      },
      {
        key: "publicphase" as const,
        title: "Public Phase",
        root: getRootForPhase(roots, "publicphase"),
        schedule: scheduleByPhaseId.get("public"),
      },
    ];
  }, [mintTimeline, roots]);
  const selectedPhaseConfig = useMemo(
    () => phaseData.find((phase) => phase.key === selectedPhase) ?? null,
    [phaseData, selectedPhase]
  );
  const isMetadataOnlyUpdateMode = primaryStatus?.key === "live_needs_update";

  useEffect(() => {
    setPhaseAllowlistWindows((prev) => {
      const next = { ...prev };
      for (const phase of phaseData) {
        if (!next[phase.key]) {
          next[phase.key] = {
            start: phase.schedule
              ? formatDateTimeLocalInput(phase.schedule.start.toDate())
              : "",
            end: phase.schedule
              ? formatDateTimeLocalInput(phase.schedule.end.toDate())
              : "",
          };
        }
      }
      return next;
    });
  }, [phaseData]);
  useEffect(() => {
    setPhasePricesEth((prev) => {
      const next = { ...prev };
      for (const phase of phaseData) {
        if (!next[phase.key]) {
          next[phase.key] = DEFAULT_PHASE_PRICE_ETH;
        }
      }
      return next;
    });
  }, [phaseData]);
  const selectedPhaseActionLabel =
    selectedPhase === "phase0" && !isInitialized
      ? "Initialize On-Chain"
      : "Update On-Chain";
  const claimWritePending = claimWrite.isPending || waitClaimWrite.isLoading;
  const selectedPhaseIsUpdateAction = Boolean(
    selectedPhaseConfig &&
    !(selectedPhaseConfig.key === "phase0" && !isInitialized)
  );
  const selectedPhaseComparableConfig = useMemo(() => {
    if (!selectedPhaseConfig) return null;
    const phaseKey = selectedPhaseConfig.key;
    const startInput = phaseAllowlistWindows[phaseKey]?.start ?? "";
    const endInput = phaseAllowlistWindows[phaseKey]?.end ?? "";
    const startDate = parseLocalDateTimeToUnixSeconds(startInput);
    const endDate = parseLocalDateTimeToUnixSeconds(endInput);
    const merkleRoot =
      phaseKey === "publicphase"
        ? NULL_MERKLE
        : (selectedPhaseConfig.root?.merkle_root ?? null);
    const costEth = (
      phasePricesEth[phaseKey] ?? DEFAULT_PHASE_PRICE_ETH
    ).trim();

    let costWei: bigint | null = null;
    try {
      costWei = parseEther(costEth);
    } catch {
      costWei = null;
    }

    return {
      startDate,
      endDate,
      merkleRoot,
      costWei,
    };
  }, [selectedPhaseConfig, phaseAllowlistWindows, phasePricesEth]);
  const selectedPhaseMatchesOnChainConfig = useMemo(() => {
    if (
      !selectedPhaseIsUpdateAction ||
      !selectedPhaseComparableConfig ||
      !claim ||
      !manifoldClaim ||
      !isInitialized
    ) {
      return false;
    }

    if (
      claim.edition_size == null ||
      selectedPhaseComparableConfig.startDate == null ||
      selectedPhaseComparableConfig.endDate == null ||
      selectedPhaseComparableConfig.merkleRoot == null ||
      selectedPhaseComparableConfig.costWei == null ||
      manifoldClaim.costWei == null ||
      manifoldClaim.merkleRoot == null
    ) {
      return false;
    }

    return (
      claim.edition_size === manifoldClaim.totalMax &&
      selectedPhaseComparableConfig.startDate === manifoldClaim.startDate &&
      selectedPhaseComparableConfig.endDate === manifoldClaim.endDate &&
      selectedPhaseComparableConfig.costWei === manifoldClaim.costWei &&
      normalizeHexValue(selectedPhaseComparableConfig.merkleRoot) ===
        normalizeHexValue(manifoldClaim.merkleRoot)
    );
  }, [
    selectedPhaseIsUpdateAction,
    selectedPhaseComparableConfig,
    claim,
    manifoldClaim,
    isInitialized,
  ]);
  const selectedPhaseActionDisabled =
    (claimWritePending || !selectedPhaseConfig
      ? true
      : selectedPhaseConfig.key === "phase0"
        ? !isInitialized
          ? !selectedPhaseConfig.root || missingRequiredInfo
          : !selectedPhaseConfig.root
        : selectedPhaseConfig.key === "publicphase"
          ? !isInitialized
          : !isInitialized || !selectedPhaseConfig.root) ||
    (selectedPhaseIsUpdateAction && selectedPhaseMatchesOnChainConfig);
  const showPhase0AirdropSections = selectedPhaseConfig?.key === "phase0";
  const claimTxModalClosable =
    claimTxModal?.status === "success" || claimTxModal?.status === "error";
  const totalMinted = Number(manifoldClaim?.total ?? 0);
  const researchAirdropCount = Math.max(
    0,
    Math.trunc(researchTargetEditionSize) - totalMinted
  );

  const runMetadataLocationOnlyUpdate = useCallback(() => {
    if (!claim) {
      setToast({ message: "Claim not loaded", type: "error" });
      return;
    }
    if (!claim.metadata_location) {
      setToast({
        message: "Updated metadata location is missing",
        type: "error",
      });
      return;
    }
    if (!isInitialized || !manifoldClaim) {
      setToast({ message: "On-chain claim is not initialized", type: "error" });
      return;
    }
    if (
      manifoldClaim.walletMax == null ||
      manifoldClaim.storageProtocol == null ||
      manifoldClaim.merkleRoot == null ||
      manifoldClaim.costWei == null ||
      manifoldClaim.paymentReceiver == null ||
      manifoldClaim.erc20 == null ||
      manifoldClaim.signingAddress == null
    ) {
      setToast({
        message: "On-chain claim parameters are not available yet",
        type: "error",
      });
      return;
    }

    const claimParameters = [
      manifoldClaim.totalMax,
      manifoldClaim.walletMax,
      manifoldClaim.startDate,
      manifoldClaim.endDate,
      manifoldClaim.storageProtocol,
      manifoldClaim.merkleRoot,
      claim.metadata_location,
      manifoldClaim.costWei,
      manifoldClaim.paymentReceiver,
      manifoldClaim.erc20,
      manifoldClaim.signingAddress,
    ] as const;

    setClaimTxModal({
      status: "confirm_wallet",
      actionLabel: "Update Claim",
    });
    try {
      claimWrite.writeContract({
        address: MANIFOLD_LAZY_CLAIM_CONTRACT as `0x${string}`,
        abi: MEMES_MANIFOLD_PROXY_ABI,
        chainId: dropControlMintingChain.id,
        functionName: "updateClaim",
        args: [dropControlMintingContract, BigInt(memeId), claimParameters],
      });
    } catch (error) {
      setClaimTxModal({
        status: "error",
        message: getErrorMessage(error, "Failed to submit transaction"),
        actionLabel: "Update Claim",
      });
    }
  }, [
    claim,
    isInitialized,
    manifoldClaim,
    claimWrite,
    dropControlMintingChain.id,
    dropControlMintingContract,
    memeId,
    setToast,
  ]);

  const refreshLaunchClaimData = useCallback(async () => {
    if (!hasWallet || !canAccessLaunchPage) return;

    try {
      const refreshedClaim = await getClaim(memeId);
      setClaim(refreshedClaim);
      setError(null);
    } catch (e) {
      const msg = getErrorMessage(e, "Failed to refresh claim");
      if (isNotFoundError(msg)) {
        setError("Claim not found");
      } else {
        setError(msg);
        showErrorToast(msg);
      }
    }
  }, [hasWallet, canAccessLaunchPage, memeId, showErrorToast]);

  const closeClaimTxModal = useCallback(() => {
    if (!claimTxModalClosable) return;
    setClaimTxModal(null);
    void refreshLaunchClaimData();
  }, [claimTxModalClosable, refreshLaunchClaimData]);

  useEffect(() => {
    if (!claimTxModal) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [claimTxModal]);

  useEffect(() => {
    if (!claimTxModalClosable) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeClaimTxModal();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [claimTxModalClosable, closeClaimTxModal]);

  useEffect(() => {
    if (onChainClaimFetching) {
      onChainClaimFetchStartedAtRef.current = Date.now();
      setOnChainClaimSpinnerVisible(true);
      if (onChainClaimSpinnerHideTimeoutRef.current) {
        clearTimeout(onChainClaimSpinnerHideTimeoutRef.current);
        onChainClaimSpinnerHideTimeoutRef.current = null;
      }
      return;
    }

    if (!onChainClaimSpinnerVisible) return;

    const startedAt = onChainClaimFetchStartedAtRef.current ?? Date.now();
    const elapsed = Date.now() - startedAt;
    const remaining = Math.max(1500 - elapsed, 0);

    if (remaining === 0) {
      setOnChainClaimSpinnerVisible(false);
      return;
    }

    onChainClaimSpinnerHideTimeoutRef.current = setTimeout(() => {
      setOnChainClaimSpinnerVisible(false);
      onChainClaimSpinnerHideTimeoutRef.current = null;
    }, remaining);

    return () => {
      if (onChainClaimSpinnerHideTimeoutRef.current) {
        clearTimeout(onChainClaimSpinnerHideTimeoutRef.current);
        onChainClaimSpinnerHideTimeoutRef.current = null;
      }
    };
  }, [onChainClaimFetching, onChainClaimSpinnerVisible]);

  const runClaimWriteForPhase = useCallback(
    ({
      phaseKey,
      forceAction,
    }: {
      phaseKey: LaunchPhaseKey;
      forceAction?: "initialize" | "update";
    }) => {
      if (!claim) {
        setToast({ message: "Claim not loaded", type: "error" });
        return;
      }
      if (claim.edition_size == null || claim.edition_size <= 0) {
        setToast({
          message: "Edition size is missing or invalid",
          type: "error",
        });
        return;
      }
      if (!claim.metadata_location) {
        setToast({ message: "Metadata location is missing", type: "error" });
        return;
      }

      const phase = phaseData.find((item) => item.key === phaseKey);
      if (!phase) {
        setToast({ message: "Phase configuration not found", type: "error" });
        return;
      }

      const startInput = phaseAllowlistWindows[phaseKey]?.start ?? "";
      const endInput = phaseAllowlistWindows[phaseKey]?.end ?? "";
      const startDate = parseLocalDateTimeToUnixSeconds(startInput);
      const endDate = parseLocalDateTimeToUnixSeconds(endInput);
      if (startDate == null || endDate == null) {
        setToast({
          message: "Phase start/end must be valid local date-time values",
          type: "error",
        });
        return;
      }
      if (endDate <= startDate) {
        setToast({
          message: "Phase end must be after phase start",
          type: "error",
        });
        return;
      }

      const merkleRoot =
        phaseKey === "publicphase"
          ? NULL_MERKLE
          : (phase.root?.merkle_root ?? null);
      if (!merkleRoot) {
        setToast({
          message: "Merkle root is missing for this phase",
          type: "error",
        });
        return;
      }

      const priceEth = (
        phasePricesEth[phaseKey] ?? DEFAULT_PHASE_PRICE_ETH
      ).trim();
      let cost: bigint;
      try {
        cost = parseEther(priceEth);
      } catch {
        setToast({ message: "Cost (ETH) is invalid", type: "error" });
        return;
      }

      const claimParameters = [
        claim.edition_size,
        0,
        startDate,
        endDate,
        2,
        merkleRoot,
        claim.metadata_location,
        cost,
        MEMES_DEPLOYER,
        NULL_ADDRESS,
        NULL_ADDRESS,
      ] as const;

      const action =
        forceAction ??
        (phaseKey === "phase0" && !isInitialized ? "initialize" : "update");
      const actionLabel =
        action === "initialize" ? "Initialize Claim" : "Update Claim";
      const functionName =
        action === "initialize" ? "initializeClaim" : "updateClaim";

      setClaimTxModal({
        status: "confirm_wallet",
        actionLabel,
      });
      try {
        claimWrite.writeContract({
          address: MANIFOLD_LAZY_CLAIM_CONTRACT as `0x${string}`,
          abi: MEMES_MANIFOLD_PROXY_ABI,
          chainId: dropControlMintingChain.id,
          functionName,
          args: [dropControlMintingContract, BigInt(memeId), claimParameters],
        });
      } catch (error) {
        setClaimTxModal({
          status: "error",
          message: getErrorMessage(error, "Failed to submit transaction"),
          actionLabel,
        });
      }
    },
    [
      claim,
      phaseData,
      phaseAllowlistWindows,
      phasePricesEth,
      isInitialized,
      claimWrite,
      dropControlMintingChain.id,
      dropControlMintingContract,
      memeId,
      setToast,
    ]
  );

  const runAirdropWrite = useCallback(
    ({
      entries,
      actionLabel,
    }: {
      entries: PhaseAirdrop[] | null;
      actionLabel:
        | "Airdrop Artist"
        | "Airdrop Team"
        | "Airdrop Subscriptions"
        | "Airdrop to Research";
    }) => {
      if (!isInitialized) {
        setToast({
          message: "Claim must be initialized before airdropping",
          type: "error",
        });
        return;
      }

      if (!entries || entries.length === 0) {
        setToast({
          message: `${actionLabel} has no recipients`,
          type: "error",
        });
        return;
      }

      const parsedEntries = entries
        .map((entry) => ({
          wallet: (entry.wallet ?? "").trim(),
          amount: Number(entry.amount ?? 0),
        }))
        .filter(
          (entry) =>
            isAddress(entry.wallet as `0x${string}`) &&
            Number.isFinite(entry.amount) &&
            entry.amount > 0
        );

      if (parsedEntries.length === 0) {
        setToast({
          message: `${actionLabel} has no valid recipients/amounts`,
          type: "error",
        });
        return;
      }

      const recipients = parsedEntries.map(
        (entry) => entry.wallet as `0x${string}`
      );
      const amounts = parsedEntries.map((entry) =>
        BigInt(Math.trunc(entry.amount))
      );

      setClaimTxModal({
        status: "confirm_wallet",
        actionLabel,
      });

      try {
        claimWrite.writeContract({
          address: MANIFOLD_LAZY_CLAIM_CONTRACT as `0x${string}`,
          abi: MEMES_MANIFOLD_PROXY_ABI,
          chainId: dropControlMintingChain.id,
          functionName: "airdrop",
          args: [
            dropControlMintingContract,
            BigInt(memeId),
            recipients,
            amounts,
          ],
        });
      } catch (error) {
        setClaimTxModal({
          status: "error",
          message: getErrorMessage(error, "Failed to submit transaction"),
          actionLabel,
        });
      }
    },
    [
      isInitialized,
      setToast,
      claimWrite,
      dropControlMintingChain.id,
      dropControlMintingContract,
      memeId,
    ]
  );
  const runResearchAirdropWrite = useCallback(() => {
    if (!isInitialized) {
      setToast({
        message: "Claim must be initialized before airdropping",
        type: "error",
      });
      return;
    }
    if (researchAirdropCount <= 0) {
      setToast({
        message: "No research airdrop needed",
        type: "error",
      });
      return;
    }

    runAirdropWrite({
      entries: [
        { wallet: RESEARCH_AIRDROP_ADDRESS, amount: researchAirdropCount },
      ],
      actionLabel: "Airdrop to Research",
    });
  }, [isInitialized, researchAirdropCount, runAirdropWrite, setToast]);

  useEffect(() => {
    if (claimWrite.error) {
      setClaimTxModal((prev) => ({
        status: "error",
        message: getErrorMessage(
          claimWrite.error,
          "Failed to submit transaction"
        ),
        txHash: prev?.txHash,
        actionLabel: prev?.actionLabel,
      }));
    }
  }, [claimWrite.error]);

  useEffect(() => {
    const txHash = claimWrite.data;
    if (!txHash) return;
    setClaimTxModal((prev) => ({
      status: "submitted",
      message: prev?.message,
      txHash,
      actionLabel: prev?.actionLabel,
    }));
  }, [claimWrite.data]);

  useEffect(() => {
    const txHash = claimWrite.data;
    if (!txHash || !waitClaimWrite.isSuccess) return;
    void refetchOnChainClaim();
    setClaimTxModal((prev) => ({
      status: "success",
      txHash,
      actionLabel: prev?.actionLabel,
    }));
  }, [claimWrite.data, waitClaimWrite.isSuccess, refetchOnChainClaim]);

  useEffect(() => {
    const txHash = claimWrite.data;
    if (!txHash || !waitClaimWrite.error) return;
    setClaimTxModal((prev) => ({
      status: "error",
      txHash,
      message: getErrorMessage(waitClaimWrite.error, "Transaction failed"),
      actionLabel: prev?.actionLabel,
    }));
  }, [claimWrite.data, waitClaimWrite.error]);

  if (permissionFallback) {
    return permissionFallback;
  }

  return (
    <div className="tw-px-2 tw-pb-16 tw-pt-2 lg:tw-px-6 lg:tw-pt-8 xl:tw-px-8">
      <div className="tw-mb-6">
        <Link
          href="/drop-forge/launch"
          className="tw-inline-flex tw-items-center tw-gap-2 tw-text-iron-400 tw-no-underline hover:tw-text-iron-50"
        >
          <ArrowLeftIcon className="tw-h-5 tw-w-5 tw-flex-shrink-0" />
          Back to Claims list
        </Link>
        <div className="tw-mt-2 tw-flex tw-items-start tw-justify-between tw-gap-3">
          <h1 className="tw-mb-0 tw-inline-flex tw-items-center tw-gap-3 tw-text-3xl tw-font-semibold tw-text-iron-50">
            <DropForgeLaunchIcon className="tw-h-8 tw-w-8 tw-flex-shrink-0" />
            {pageTitle}
          </h1>
          <div className="tw-flex tw-flex-shrink-0 tw-items-center tw-gap-2">
            <DropForgeExplorerLink />
            <DropForgeTestnetIndicator />
          </div>
        </div>
      </div>
      {loading && <p className="tw-text-iron-400">Loading…</p>}
      {error && (
        <p className="tw-text-red-400 tw-mb-4" role="alert">
          {error}
        </p>
      )}
      {rootsError && (
        <p className="tw-text-red-400 tw-mb-4" role="alert">
          {rootsError}
        </p>
      )}
      {claim && (
        <div className="tw-flex tw-flex-col tw-gap-5 sm:tw-gap-6">
          {mintTimeline && (
            <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-2">
              <p className="tw-mb-0 tw-text-xl tw-font-semibold tw-text-iron-100">
                Scheduled for {formatScheduledLabel(mintTimeline.instantUtc)}
              </p>
              <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-2">
                {primaryStatus && (
                  <DropForgeStatusPill
                    className={getPrimaryStatusPillClassName(
                      primaryStatus.tone
                    )}
                    label={primaryStatus.label}
                    showLoader={primaryStatus.key === "publishing"}
                    tooltipText={primaryStatus.reason ?? ""}
                  />
                )}
              </div>
            </div>
          )}
          {(hasImage || hasAnimation) && (
            <LaunchAccordionSection
              title="Media Preview"
              subtitle=""
              tone="neutral"
              defaultOpen={false}
              headerRight={
                hasAnimation ? (
                  <div className="tw-inline-flex tw-overflow-hidden tw-rounded-lg tw-bg-iron-900 tw-ring-1 tw-ring-inset tw-ring-iron-700">
                    <button
                      type="button"
                      onClick={() => setActiveMediaTab("image")}
                      className={`tw-border-0 tw-px-3 tw-py-1.5 tw-text-sm tw-transition-colors ${
                        activeMediaTab === "image"
                          ? "tw-bg-primary-500 tw-text-white"
                          : "tw-bg-transparent tw-text-iron-400 hover:tw-text-iron-200"
                      }`}
                    >
                      Image
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveMediaTab("animation")}
                      className={`tw-border-0 tw-px-3 tw-py-1.5 tw-text-sm tw-transition-colors ${
                        activeMediaTab === "animation"
                          ? "tw-bg-primary-500 tw-text-white"
                          : "tw-bg-transparent tw-text-iron-400 hover:tw-text-iron-200"
                      }`}
                    >
                      Animation
                    </button>
                  </div>
                ) : null
              }
              showHeaderRightWhenOpen
            >
              <div className="tw-relative tw-h-64 tw-w-full tw-overflow-hidden tw-rounded-lg tw-bg-iron-900 tw-ring-1 tw-ring-iron-800 sm:tw-h-80 lg:tw-h-[23.5rem]">
                {activeMediaTab === "animation" &&
                hasAnimation &&
                animationMimeType ? (
                  <MediaDisplay
                    media_mime_type={animationMimeType}
                    media_url={claim.animation_url!}
                  />
                ) : activeMediaTab === "image" && hasImage ? (
                  <MediaDisplay
                    media_mime_type={
                      claim.image_details?.format
                        ? `image/${String(claim.image_details.format).toLowerCase()}`
                        : "image/jpeg"
                    }
                    media_url={claim.image_url!}
                  />
                ) : activeMediaTab === "image" ? (
                  <div className="tw-flex tw-h-full tw-items-center tw-justify-center tw-text-sm tw-text-iron-400">
                    Image missing
                  </div>
                ) : (
                  <div className="tw-flex tw-h-full tw-items-center tw-justify-center tw-text-sm tw-text-iron-400">
                    Animation missing
                  </div>
                )}
              </div>
              <div className="tw-flex tw-justify-center">
                <DropForgeMediaTypePill label={activeMediaTypeLabel} />
              </div>
            </LaunchAccordionSection>
          )}
          <LaunchAccordionSection
            title="Details"
            subtitle=""
            tone="neutral"
            defaultOpen={false}
            headerRight={
              <div className="tw-inline-flex tw-flex-wrap tw-items-center tw-gap-2">
                <span className="tw-inline-flex tw-items-center tw-rounded-full tw-bg-iron-700/30 tw-px-3 tw-py-1 tw-text-sm tw-font-medium tw-text-iron-300 tw-ring-1 tw-ring-inset tw-ring-iron-500/40">
                  SZN {claim.season ?? "—"}
                </span>
                <span className="tw-inline-flex tw-items-center tw-rounded-full tw-bg-iron-700/30 tw-px-3 tw-py-1 tw-text-sm tw-font-medium tw-text-iron-300 tw-ring-1 tw-ring-inset tw-ring-iron-500/40">
                  Edition Size {claim.edition_size ?? "—"}
                </span>
              </div>
            }
          >
            <div className="tw-grid tw-grid-cols-1 tw-gap-x-4 tw-gap-y-6 sm:tw-grid-cols-2">
              <DropForgeFieldBox
                label="Artwork Title"
                className="sm:tw-col-span-2"
              >
                <span className="tw-break-words">{claim.name || "—"}</span>
              </DropForgeFieldBox>
              <DropForgeFieldBox
                label="Description"
                className="sm:tw-col-span-2"
              >
                <span className="tw-whitespace-pre-wrap tw-break-words">
                  {claim.description || "—"}
                </span>
              </DropForgeFieldBox>
            </div>
          </LaunchAccordionSection>
          <LaunchAccordionSection
            title="Traits"
            subtitle=""
            tone="neutral"
            defaultOpen={false}
          >
            {claim.attributes?.length ? (
              <div className="tw-grid tw-grid-cols-1 tw-gap-x-4 tw-gap-y-6 sm:tw-grid-cols-2 lg:tw-grid-cols-3 xl:tw-grid-cols-4">
                {claim.attributes.map((attribute, index) => (
                  <DropForgeFieldBox
                    key={`${attribute.trait_type ?? "trait"}-${index}`}
                    label={attribute.trait_type || "Trait"}
                  >
                    {attribute.value !== null &&
                    attribute.value !== undefined &&
                    String(attribute.value).trim()
                      ? String(attribute.value)
                      : "—"}
                  </DropForgeFieldBox>
                ))}
              </div>
            ) : (
              <p className="tw-mb-0 tw-text-sm tw-text-iron-400">
                No traits found.
              </p>
            )}
          </LaunchAccordionSection>
          <LaunchAccordionSection
            title={
              isInitialized
                ? "On-Chain Claim"
                : "On-Chain Claim - Not Initialized"
            }
            subtitle=""
            tone={isInitialized ? "neutral" : "warning"}
            defaultOpen={false}
            disabled={!isInitialized}
            headerRight={
              onChainClaimSpinnerVisible ? (
                <span aria-label="Refreshing on-chain claim">
                  <CircleLoader size={CircleLoaderSize.MEDIUM} />
                </span>
              ) : null
            }
          >
            {manifoldClaim ? (
              <div className="tw-grid tw-grid-cols-1 tw-gap-x-4 tw-gap-y-6 sm:tw-grid-cols-2">
                <DropForgeFieldBox label="Instance ID">
                  {manifoldClaim.instanceId.toLocaleString()}
                </DropForgeFieldBox>
                <DropForgeFieldBox label="Cost (ETH)">
                  {fromGWEI(manifoldClaim.cost).toFixed(5)}
                </DropForgeFieldBox>
                <DropForgeFieldBox label="Meme Phase">
                  {manifoldClaim.memePhase?.name ?? "—"}
                </DropForgeFieldBox>
                <DropForgeFieldBox label="Status">
                  {capitalizeEveryWord(manifoldClaim.status)}
                </DropForgeFieldBox>
                <DropForgeFieldBox label="Total Minted">
                  {manifoldClaim.total.toLocaleString()}
                </DropForgeFieldBox>
                <DropForgeFieldBox label="Total Max">
                  {manifoldClaim.totalMax.toLocaleString()}
                </DropForgeFieldBox>
                <DropForgeFieldBox label="Remaining Editions">
                  {manifoldClaim.remaining.toLocaleString()}
                </DropForgeFieldBox>
                <DropForgeFieldBox
                  label="Metadata Location"
                  contentClassName="tw-text-sm"
                >
                  <span className="tw-break-all">
                    {toArweaveUrl(manifoldClaim.location) ? (
                      <a
                        href={toArweaveUrl(manifoldClaim.location)!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:tw-text-primary-200 tw-text-primary-300 tw-no-underline"
                      >
                        {manifoldClaim.location}
                      </a>
                    ) : (
                      manifoldClaim.location || "—"
                    )}
                  </span>
                </DropForgeFieldBox>
                <DropForgeFieldBox label="Start Date">
                  {formatLocalDateTime(
                    Time.seconds(manifoldClaim.startDate).toDate()
                  )}
                </DropForgeFieldBox>
                <DropForgeFieldBox label="End Date">
                  {formatLocalDateTime(
                    Time.seconds(manifoldClaim.endDate).toDate()
                  )}
                </DropForgeFieldBox>
              </div>
            ) : (
              <p className="tw-mb-0 tw-text-sm tw-text-iron-400">
                On-chain claim data is not available.
              </p>
            )}
          </LaunchAccordionSection>
          <div className="tw-flex tw-flex-col tw-gap-3">
            {hasPublishedMetadata ? (
              isMetadataOnlyUpdateMode ? (
                <div className="tw-space-y-4">
                  <div className="tw-text-base tw-font-semibold tw-text-white">
                    Metadata Changed
                  </div>
                  <div className="tw-grid tw-grid-cols-1 tw-gap-3 lg:tw-grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] lg:tw-items-start lg:tw-gap-x-5">
                    <DropForgeFieldBox
                      label="On-Chain Metadata"
                      contentClassName="tw-text-sm"
                    >
                      <span className="tw-block tw-max-w-full tw-truncate">
                        {toArweaveUrl(manifoldClaim?.location) ? (
                          <a
                            href={toArweaveUrl(manifoldClaim?.location)!}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:tw-text-primary-200 tw-block tw-max-w-full tw-truncate tw-text-primary-300 tw-no-underline"
                            title={manifoldClaim?.location ?? undefined}
                          >
                            {manifoldClaim?.location}
                          </a>
                        ) : (
                          manifoldClaim?.location || "—"
                        )}
                      </span>
                    </DropForgeFieldBox>
                    <DropForgeFieldBox
                      label="Updated Metadata"
                      contentClassName="tw-text-sm"
                    >
                      <span className="tw-block tw-max-w-full tw-truncate">
                        {toArweaveUrl(claim.metadata_location) ? (
                          <a
                            href={toArweaveUrl(claim.metadata_location)!}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:tw-text-primary-200 tw-block tw-max-w-full tw-truncate tw-text-primary-300 tw-no-underline"
                            title={claim.metadata_location ?? undefined}
                          >
                            {claim.metadata_location}
                          </a>
                        ) : (
                          claim.metadata_location || "—"
                        )}
                      </span>
                    </DropForgeFieldBox>
                    <button
                      type="button"
                      disabled={
                        claimWritePending ||
                        !isInitialized ||
                        !manifoldClaim ||
                        !claim.metadata_location
                      }
                      onClick={runMetadataLocationOnlyUpdate}
                      className={`${BTN_METADATA_UPDATE_ACTION} lg:tw-self-end`}
                    >
                      {claimWritePending ? "Processing..." : "Update On-Chain"}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <label
                    htmlFor="phase-selection"
                    className="tw-text-base tw-font-semibold tw-text-iron-50"
                  >
                    Phase Selection
                  </label>
                  <div className="tw-relative">
                    <select
                      id="phase-selection"
                      value={selectedPhase}
                      onChange={(e) =>
                        setSelectedPhase(
                          e.target.value as
                            | ""
                            | "phase0"
                            | "phase1"
                            | "phase2"
                            | "publicphase"
                            | "research"
                        )
                      }
                      className="tw-h-16 tw-w-full tw-appearance-none tw-rounded-xl tw-border-0 tw-bg-iron-950 tw-pl-4 tw-pr-12 tw-text-white tw-ring-1 tw-ring-inset tw-ring-iron-800 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-iron-600"
                    >
                      <option value="" disabled>
                        Phase Selection
                      </option>
                      <option value="phase0">Phase 0 - Initialize Claim</option>
                      <option value="phase1" disabled={!isInitialized}>
                        Phase 1
                      </option>
                      <option value="phase2" disabled={!isInitialized}>
                        Phase 2
                      </option>
                      <option value="publicphase" disabled={!isInitialized}>
                        Public Phase
                      </option>
                      <option value="research" disabled={!isInitialized}>
                        Airdrop to Research
                      </option>
                    </select>
                    <ChevronDownIcon className="tw-pointer-events-none tw-absolute tw-right-4 tw-top-1/2 tw-h-5 tw-w-5 -tw-translate-y-1/2 tw-text-iron-300" />
                  </div>
                  {selectedPhase === "research" ? (
                    <div className="tw-grid tw-grid-cols-1 tw-gap-3 tw-pt-4 lg:tw-grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] lg:tw-items-start lg:tw-gap-x-5">
                      <DropForgeFieldBox label="Total Minted">
                        {totalMinted.toLocaleString()}
                      </DropForgeFieldBox>
                      <DropForgeFieldBox label="Target Edition Size">
                        <input
                          type="number"
                          inputMode="numeric"
                          min="0"
                          step="1"
                          value={researchTargetEditionSize}
                          onChange={(e) => {
                            const parsed = Number(e.target.value);
                            setResearchTargetEditionSize(
                              Number.isFinite(parsed) && parsed >= 0
                                ? Math.trunc(parsed)
                                : 0
                            );
                          }}
                          className="tw-w-full tw-border-0 tw-bg-transparent tw-p-0 tw-text-white [color-scheme:dark] focus:tw-outline-none focus:tw-ring-0"
                        />
                      </DropForgeFieldBox>
                      <button
                        type="button"
                        disabled={
                          claimWritePending ||
                          !isInitialized ||
                          researchAirdropCount <= 0
                        }
                        onClick={runResearchAirdropWrite}
                        className={`${BTN_SUBSCRIPTIONS_AIRDROP} lg:tw-self-end`}
                      >
                        {claimWritePending
                          ? "Processing..."
                          : `Airdrop to Research x${researchAirdropCount.toLocaleString()}`}
                      </button>
                    </div>
                  ) : (
                    <div className="tw-space-y-5 tw-pt-2">
                      <div className="tw-text-base tw-font-medium tw-text-white">
                        Phase Configuration
                      </div>
                      <div className="tw-grid tw-grid-cols-1 tw-gap-3 lg:tw-grid-cols-2 lg:tw-gap-x-5">
                        <DropForgeFieldBox label="Remaining Editions">
                          {manifoldClaim?.remaining ?? "—"}
                        </DropForgeFieldBox>
                        <DropForgeFieldBox label="Cost (ETH)">
                          <input
                            type="number"
                            inputMode="decimal"
                            min="0"
                            step="0.00001"
                            value={
                              selectedPhase
                                ? (phasePricesEth[selectedPhase] ?? "")
                                : ""
                            }
                            onChange={(e) => {
                              if (!selectedPhase) return;
                              setPhasePricesEth((prev) => ({
                                ...prev,
                                [selectedPhase]: e.target.value,
                              }));
                            }}
                            disabled={!selectedPhase}
                            className="tw-w-full tw-border-0 tw-bg-transparent tw-p-0 tw-text-white [color-scheme:dark] focus:tw-outline-none focus:tw-ring-0 disabled:tw-cursor-not-allowed disabled:tw-text-iron-500"
                          />
                        </DropForgeFieldBox>
                      </div>
                      {selectedPhaseConfig?.key !== "publicphase" ? (
                        <div className="tw-grid tw-grid-cols-1 tw-gap-3 tw-pt-3 lg:tw-grid-cols-2 lg:tw-gap-x-5">
                          <DropForgeFieldBox
                            label="Merkle Root"
                            contentClassName="tw-break-all tw-text-sm"
                          >
                            <span>
                              {selectedPhaseConfig?.root?.merkle_root ?? (
                                <span className="tw-text-rose-300">
                                  missing
                                </span>
                              )}
                            </span>
                          </DropForgeFieldBox>
                          <DropForgeFieldBox label="Address Count / Total Spots">
                            <span className="tw-inline-flex tw-items-center">
                              <span>
                                {getRootAddressesCount(
                                  selectedPhaseConfig?.root
                                ) ?? (
                                  <span className="tw-text-rose-300">
                                    missing
                                  </span>
                                )}
                              </span>
                              <span className="tw-px-1">/</span>
                              <span>
                                {getRootTotalSpots(
                                  selectedPhaseConfig?.root
                                ) ?? (
                                  <span className="tw-text-rose-300">
                                    missing
                                  </span>
                                )}
                              </span>
                            </span>
                          </DropForgeFieldBox>
                        </div>
                      ) : null}
                      <div className="tw-grid tw-grid-cols-1 tw-gap-3 tw-pt-3 lg:tw-grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] lg:tw-items-start lg:tw-gap-x-5">
                        <DropForgeFieldBox label="Phase Start">
                          <input
                            type="datetime-local"
                            value={
                              selectedPhase
                                ? (phaseAllowlistWindows[selectedPhase]
                                    ?.start ?? "")
                                : ""
                            }
                            onChange={(e) => {
                              if (!selectedPhase) return;
                              setPhaseAllowlistWindows((prev) => ({
                                ...prev,
                                [selectedPhase]: {
                                  start: e.target.value,
                                  end: prev[selectedPhase]?.end ?? "",
                                },
                              }));
                            }}
                            disabled={!selectedPhase}
                            className="tw-w-full tw-border-0 tw-bg-transparent tw-p-0 tw-text-white [color-scheme:dark] focus:tw-outline-none focus:tw-ring-0 disabled:tw-cursor-not-allowed disabled:tw-text-iron-500"
                          />
                        </DropForgeFieldBox>
                        <DropForgeFieldBox label="Phase End">
                          <input
                            type="datetime-local"
                            value={
                              selectedPhase
                                ? (phaseAllowlistWindows[selectedPhase]?.end ??
                                  "")
                                : ""
                            }
                            onChange={(e) => {
                              if (!selectedPhase) return;
                              setPhaseAllowlistWindows((prev) => ({
                                ...prev,
                                [selectedPhase]: {
                                  start: prev[selectedPhase]?.start ?? "",
                                  end: e.target.value,
                                },
                              }));
                            }}
                            disabled={!selectedPhase}
                            className="tw-w-full tw-border-0 tw-bg-transparent tw-p-0 tw-text-white [color-scheme:dark] focus:tw-outline-none focus:tw-ring-0 disabled:tw-cursor-not-allowed disabled:tw-text-iron-500"
                          />
                        </DropForgeFieldBox>
                        <button
                          type="button"
                          disabled={selectedPhaseActionDisabled}
                          onClick={() => {
                            if (!selectedPhaseConfig) return;
                            runClaimWriteForPhase({
                              phaseKey: selectedPhaseConfig.key,
                              forceAction:
                                selectedPhaseConfig.key === "phase0" &&
                                !isInitialized
                                  ? "initialize"
                                  : "update",
                            });
                          }}
                          className={`${BTN_SUBSCRIPTIONS_AIRDROP} lg:tw-self-end`}
                        >
                          {claimWritePending
                            ? "Processing..."
                            : selectedPhaseActionLabel}
                        </button>
                      </div>
                      {showPhase0AirdropSections && (
                        <div className="tw-space-y-5 tw-pt-3">
                          {phase0AirdropsError && (
                            <p className="tw-mb-0 tw-text-sm tw-text-rose-300">
                              {phase0AirdropsError}
                            </p>
                          )}

                          <div className="tw-space-y-5">
                            <div className="tw-text-base tw-font-medium tw-text-white">
                              Artist Airdrops
                            </div>
                            <div className="tw-grid tw-grid-cols-1 tw-gap-3 lg:tw-grid-cols-[minmax(0,1fr)_auto] lg:tw-items-start lg:tw-gap-x-5">
                              <DropForgeFieldBox label="Address Count / Total Airdrops">
                                {phase0AirdropsLoading
                                  ? "loading / loading"
                                  : `${artistAirdropSummary.addresses.toLocaleString()} / ${artistAirdropSummary.totalAirdrops.toLocaleString()}`}
                              </DropForgeFieldBox>
                              <button
                                type="button"
                                disabled={
                                  !isInitialized ||
                                  claimWritePending ||
                                  phase0AirdropsLoading ||
                                  artistAirdropSummary.totalAirdrops <= 0
                                }
                                onClick={() =>
                                  runAirdropWrite({
                                    entries: artistAirdrops,
                                    actionLabel: "Airdrop Artist",
                                  })
                                }
                                className={`${BTN_SUBSCRIPTIONS_AIRDROP} lg:tw-self-end`}
                              >
                                {`Airdrop Artist x${artistAirdropSummary.totalAirdrops.toLocaleString()}`}
                              </button>
                            </div>
                          </div>

                          <div className="tw-space-y-5">
                            <div className="tw-text-base tw-font-medium tw-text-white">
                              Team Airdrops
                            </div>
                            <div className="tw-grid tw-grid-cols-1 tw-gap-3 lg:tw-grid-cols-[minmax(0,1fr)_auto] lg:tw-items-start lg:tw-gap-x-5">
                              <DropForgeFieldBox label="Address Count / Total Airdrops">
                                {phase0AirdropsLoading
                                  ? "loading / loading"
                                  : `${teamAirdropSummary.addresses.toLocaleString()} / ${teamAirdropSummary.totalAirdrops.toLocaleString()}`}
                              </DropForgeFieldBox>
                              <button
                                type="button"
                                disabled={
                                  !isInitialized ||
                                  claimWritePending ||
                                  phase0AirdropsLoading ||
                                  teamAirdropSummary.totalAirdrops <= 0
                                }
                                onClick={() =>
                                  runAirdropWrite({
                                    entries: teamAirdrops,
                                    actionLabel: "Airdrop Team",
                                  })
                                }
                                className={`${BTN_SUBSCRIPTIONS_AIRDROP} lg:tw-self-end`}
                              >
                                {`Airdrop Team x${teamAirdropSummary.totalAirdrops.toLocaleString()}`}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                      {subscriptionAirdropSections.length > 0 ? (
                        <div className="tw-space-y-5 tw-pt-3">
                          {subscriptionAirdropSections.map((section) => (
                            <div
                              key={section.phaseKey}
                              className="tw-space-y-5"
                            >
                              {section.error ? (
                                <p className="tw-mb-0 tw-text-sm tw-text-rose-300">
                                  {section.error}
                                </p>
                              ) : null}
                              <div className="tw-text-base tw-font-medium tw-text-white">
                                {section.title}
                              </div>
                              <div className="tw-grid tw-grid-cols-1 tw-gap-3 lg:tw-grid-cols-[minmax(0,1fr)_auto] lg:tw-items-start lg:tw-gap-x-5">
                                <DropForgeFieldBox label="Address Count / Total Airdrops">
                                  {section.loading
                                    ? "loading / loading"
                                    : `${section.addresses.toLocaleString()} / ${section.totalAirdrops.toLocaleString()}`}
                                </DropForgeFieldBox>
                                <button
                                  type="button"
                                  disabled={
                                    !isInitialized ||
                                    claimWritePending ||
                                    section.loading ||
                                    section.airdropCount <= 0
                                  }
                                  onClick={() =>
                                    runAirdropWrite({
                                      entries: section.airdropEntries,
                                      actionLabel: "Airdrop Subscriptions",
                                    })
                                  }
                                  className={`${BTN_SUBSCRIPTIONS_AIRDROP} lg:tw-self-end`}
                                >
                                  {`Airdrop Subscriptions x${section.airdropCount.toLocaleString()}`}
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  )}
                </>
              )
            ) : (
              <p className="tw-mb-0 tw-text-white">
                Finish drop crafting before launching:{" "}
                <Link
                  href={`/drop-forge/craft/${memeId}`}
                  className="hover:tw-text-primary-200 tw-text-primary-300 tw-no-underline"
                >
                  Craft Drop #{memeId}
                </Link>
              </p>
            )}
          </div>
        </div>
      )}
      <ClaimTransactionModal
        state={claimTxModal}
        chain={dropControlMintingChain}
        onClose={closeClaimTxModal}
      />
    </div>
  );
}
