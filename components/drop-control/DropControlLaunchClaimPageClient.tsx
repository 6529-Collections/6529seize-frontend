"use client";

import { useAuth } from "@/components/auth/Auth";
import {
  getClaimPrimaryStatus,
  getPrimaryStatusPillClassName,
} from "@/components/drop-control/drop-control-status.helpers";
import { DROP_CONTROL_SECTIONS } from "@/components/drop-control/drop-control.constants";
import DropControlMediaTypePill from "@/components/drop-control/DropControlMediaTypePill";
import { DropControlPermissionFallback } from "@/components/drop-control/DropControlPermissionFallback";
import DropControlStatusPill from "@/components/drop-control/DropControlStatusPill";
import { isMissingRequiredLaunchInfo } from "@/components/drop-control/launchClaimHelpers";
import MediaDisplay from "@/components/drops/view/item/content/media/MediaDisplay";
import { getMintTimelineDetails } from "@/components/meme-calendar/meme-calendar.helpers";
import { MEMES_CONTRACT } from "@/constants/constants";
import type { MemeClaim } from "@/generated/models/MemeClaim";
import type { MemesMintingRootItem } from "@/generated/models/MemesMintingRootItem";
import { Time } from "@/helpers/time";
import { useDropControlPermissions } from "@/hooks/useDropControlPermissions";
import {
  buildMemesPhases,
  useMemesManifoldClaim,
} from "@/hooks/useManifoldClaim";
import {
  getClaim,
  getMemesMintingRoots,
} from "@/services/api/memes-minting-claims-api";
import { ChevronDownIcon, ChevronRightIcon } from "@heroicons/react/20/solid";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface DropControlLaunchClaimPageClientProps {
  memeId: number;
}

const SECTION_CARD_CLASS =
  "tw-rounded-xl tw-bg-iron-950 tw-p-4 tw-ring-1 tw-ring-inset tw-ring-iron-800 sm:tw-p-5";
const BTN_AIRDROP =
  "tw-rounded-lg tw-border-0 tw-ring-1 tw-ring-inset tw-ring-primary-400/60 tw-bg-primary-500 tw-px-4 tw-py-2 tw-font-medium tw-text-white tw-transition-colors tw-duration-150 enabled:hover:tw-bg-primary-600 enabled:hover:tw-ring-primary-300 enabled:active:tw-bg-primary-700 enabled:active:tw-ring-primary-300 disabled:tw-cursor-not-allowed disabled:tw-opacity-50";
const BTN_SUBSCRIPTIONS_AIRDROP =
  "tw-h-12 tw-w-full sm:tw-w-64 tw-rounded-lg tw-border-0 tw-ring-1 tw-ring-inset tw-ring-primary-400/60 tw-bg-primary-500 tw-px-5 tw-text-base tw-font-semibold tw-text-white tw-transition-colors tw-duration-150 enabled:hover:tw-bg-primary-600 enabled:hover:tw-ring-primary-300 enabled:active:tw-bg-primary-700 enabled:active:tw-ring-primary-300 disabled:tw-cursor-not-allowed disabled:tw-opacity-50";
const BTN_HEADER_UPDATE_ACTION =
  "tw-h-10 tw-w-auto tw-rounded-full tw-border-0 tw-bg-orange-500 tw-px-5 tw-text-sm tw-font-semibold tw-text-orange-50 tw-ring-1 tw-ring-inset tw-ring-orange-300/70 tw-shadow-[0_10px_24px_rgba(249,115,22,0.35)] tw-transition-colors tw-duration-150 enabled:hover:tw-bg-orange-400 enabled:active:tw-bg-orange-600 disabled:tw-cursor-not-allowed disabled:tw-opacity-50";

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

function normalizePhaseName(value: string): string {
  return value.replace(/\s+/g, "").toLowerCase();
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

function DataRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="tw-grid tw-grid-cols-[10rem_1fr] tw-gap-5 tw-text-sm sm:tw-grid-cols-[12rem_1fr]">
      <span className="tw-text-sm tw-text-iron-400">{label}</span>
      <span className="tw-break-all tw-text-white">{value}</span>
    </div>
  );
}

function LaunchFieldBox({
  label,
  className = "",
  contentClassName = "",
  fixedHeight = true,
  children,
}: {
  label: string;
  className?: string;
  contentClassName?: string;
  fixedHeight?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`tw-relative tw-rounded-md tw-bg-iron-950 tw-px-3 tw-ring-1 tw-ring-inset tw-ring-iron-800 ${fixedHeight ? "tw-h-12" : "tw-min-h-12 tw-py-3"} ${className}`}
    >
      <span className="tw-pointer-events-none tw-absolute tw-left-3 tw-top-[-0.6rem] tw-bg-iron-950 tw-px-1.5 tw-text-sm tw-text-iron-400">
        {label}
      </span>
      <div
        className={`tw-flex ${fixedHeight ? "tw-h-full tw-items-center" : "tw-items-start"} tw-text-white ${contentClassName}`}
      >
        {children}
      </div>
    </div>
  );
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
        onClick={toggleOpen}
        onKeyDown={(event) => {
          if (disabled) return;
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            toggleOpen();
          }
        }}
        className={`tw-flex tw-w-full tw-items-center tw-justify-between tw-gap-2 tw-bg-transparent tw-p-0 tw-text-left ${
          disabled ? "" : "tw-cursor-pointer"
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
          className={`tw-space-y-3 ${
            isOpen ? "tw-overflow-visible" : "tw-overflow-hidden"
          }`}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

export default function DropControlLaunchClaimPageClient({
  memeId,
}: DropControlLaunchClaimPageClientProps) {
  const { setToast } = useAuth();
  const { hasWallet, permissionsLoading, canAccessLaunchPage } =
    useDropControlPermissions();
  const manifoldClaim = useMemesManifoldClaim(memeId);
  const [claim, setClaim] = useState<MemeClaim | null>(null);
  const [roots, setRoots] = useState<MemesMintingRootItem[] | null>(null);
  const [rootsLoading, setRootsLoading] = useState(false);
  const [rootsError, setRootsError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeMediaTab, setActiveMediaTab] = useState<LaunchMediaTab>("image");
  const [selectedPhase, setSelectedPhase] = useState<
    "" | "phase0" | "phase1" | "phase2" | "publicphase"
  >("");
  const [researchGuaranteeTarget, setResearchGuaranteeTarget] = useState(310);
  const [phaseAllowlistWindows, setPhaseAllowlistWindows] = useState<
    Record<string, { start: string; end: string }>
  >({});
  const minimumEditionSizeInputRef = useRef<HTMLInputElement | null>(null);
  const lastErrorToastRef = useRef<{ message: string; ts: number } | null>(
    null
  );

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

  const permissionFallback = DropControlPermissionFallback({
    title: DROP_CONTROL_SECTIONS.LAUNCH.title,
    permissionsLoading,
    hasWallet,
    hasAccess: canAccessLaunchPage,
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
        const msg = e instanceof Error ? e.message : "Failed to load claim";
        if (!cancelled) {
          setError(msg);
          showErrorToast(msg);
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
        const msg = e instanceof Error ? e.message : "Failed to load roots";
        if (!cancelled) {
          setRootsError(msg);
          showErrorToast(msg);
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
          const msg =
            e instanceof Error ? e.message : "Failed to refresh claim status";
          if (!cancelled) {
            setError(msg);
            showErrorToast(msg);
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
  const metadataAligned = Boolean(
    isInitialized &&
    claim?.metadata_location &&
    manifoldClaim?.location &&
    manifoldClaim.location === claim.metadata_location
  );
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
  }, [hasPublishedMetadata, isInitialized]);
  const mintedCount = Number(manifoldClaim?.total ?? 0);
  const researchShortfall = Math.max(researchGuaranteeTarget - mintedCount, 0);

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
  const publicPhaseSchedule = phaseData.find(
    (phase) => phase.key === "publicphase"
  )?.schedule;
  const publicPhaseEnded = Boolean(
    publicPhaseSchedule &&
    publicPhaseSchedule.end.toDate().getTime() <= Date.now()
  );
  const canOpenResearchAirdrop = isInitialized && publicPhaseEnded;
  const showHeaderUpdateAction = primaryStatus?.key === "live_needs_update";
  const primaryLaunchAction = useMemo(() => {
    if (!primaryStatus) return null;
    if (
      primaryStatus.key === "published" ||
      primaryStatus.key === "pending_initialization"
    ) {
      return "Initialize Onchain" as const;
    }
    if (primaryStatus.key === "live_needs_update") {
      return "Update Onchain" as const;
    }
    if (primaryStatus.key === "diverged") {
      return "Resolve" as const;
    }
    return null;
  }, [primaryStatus]);

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

  if (permissionFallback) {
    return permissionFallback;
  }

  return (
    <div className="tw-px-2 tw-pb-16 tw-pt-2 lg:tw-px-6 lg:tw-pt-8 xl:tw-px-8">
      <h1 className="tw-mb-2 tw-text-3xl tw-font-semibold tw-text-iron-50">
        Launch Claim #{memeId}
      </h1>
      <p className="tw-mb-6 tw-text-iron-400">
        Configure initialization, metadata publishing, and per-phase merkle
        data.
      </p>
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
                  <DropControlStatusPill
                    className={getPrimaryStatusPillClassName(
                      primaryStatus.tone
                    )}
                    label={primaryStatus.label}
                    showLoader={primaryStatus.key === "publishing"}
                    tooltipText={primaryStatus.reason ?? ""}
                  />
                )}
                {showHeaderUpdateAction && (
                  <button
                    type="button"
                    onClick={() => alert("call update claim")}
                    className={BTN_HEADER_UPDATE_ACTION}
                  >
                    Update Onchain
                  </button>
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
                <DropControlMediaTypePill label={activeMediaTypeLabel} />
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
              <LaunchFieldBox
                label="Artwork Title"
                fixedHeight={false}
                className="sm:tw-col-span-2"
              >
                <span className="tw-break-words">{claim.name || "—"}</span>
              </LaunchFieldBox>
              <LaunchFieldBox
                label="Description"
                fixedHeight={false}
                className="sm:tw-col-span-2"
              >
                <span className="tw-whitespace-pre-wrap tw-break-words">
                  {claim.description || "—"}
                </span>
              </LaunchFieldBox>
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
                  <LaunchFieldBox
                    key={`${attribute.trait_type ?? "trait"}-${index}`}
                    label={attribute.trait_type || "Trait"}
                  >
                    {attribute.value !== null &&
                    attribute.value !== undefined &&
                    String(attribute.value).trim()
                      ? String(attribute.value)
                      : "—"}
                  </LaunchFieldBox>
                ))}
              </div>
            ) : (
              <p className="tw-mb-0 tw-text-sm tw-text-iron-400">
                No traits found.
              </p>
            )}
          </LaunchAccordionSection>
          <div className="tw-flex tw-flex-col tw-gap-3">
            {hasPublishedMetadata ? (
              <div className="tw-relative">
                <select
                  value={selectedPhase}
                  onChange={(e) =>
                    setSelectedPhase(
                      e.target.value as
                        | ""
                        | "phase0"
                        | "phase1"
                        | "phase2"
                        | "publicphase"
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
                </select>
                <ChevronDownIcon className="tw-pointer-events-none tw-absolute tw-right-4 tw-top-1/2 tw-h-5 tw-w-5 -tw-translate-y-1/2 tw-text-iron-300" />
              </div>
            ) : (
              <p className="tw-mb-0 tw-text-white">
                Finish claim preparation before launching:{" "}
                <Link
                  href={`/drop-control/prepare/${memeId}`}
                  className="tw-text-primary-300 tw-no-underline hover:tw-text-primary-200"
                >
                  Prepare Claim #{memeId}
                </Link>
              </p>
            )}
          </div>
          {phaseData.map((phase) => (
            <LaunchAccordionSection
              key={phase.key}
              title={phase.title}
              subtitle={
                rootsLoading
                  ? "Loading…"
                  : phase.key === "publicphase"
                    ? isInitialized
                      ? ""
                      : "Claim not Initialized"
                    : !phase.root
                      ? "Merkle Data Missing"
                      : !isInitialized
                        ? "Claim not Initialized"
                        : "Merkle Data Found"
              }
              tone={
                rootsLoading
                  ? "neutral"
                  : phase.key === "publicphase"
                    ? isInitialized
                      ? "success"
                      : "neutral"
                    : !phase.root
                      ? "danger"
                      : !isInitialized
                        ? "warning"
                        : "success"
              }
              {...(phase.key === "phase0"
                ? { defaultOpen: !isInitialized }
                : {})}
            >
              {rootsLoading ? (
                <p className="tw-mb-0 tw-text-sm tw-text-iron-400">
                  Loading phase data…
                </p>
              ) : (
                <>
                  {phase.schedule ? (
                    <div className="tw-grid tw-grid-cols-1 tw-gap-2 sm:tw-grid-cols-2">
                      <LaunchFieldBox
                        label="Schedule"
                        contentClassName="tw-break-words"
                      >
                        <span>
                          {`${formatLocalDateTime(phase.schedule.start.toDate())} - ${formatLocalDateTime(phase.schedule.end.toDate())}`}
                        </span>
                      </LaunchFieldBox>
                      <LaunchFieldBox label="Remaining Editions">
                        {manifoldClaim?.remaining ?? "—"}
                      </LaunchFieldBox>
                    </div>
                  ) : (
                    <DataRow label="Schedule" value="Unavailable" />
                  )}
                  {(() => {
                    const missing = (
                      <span className="tw-text-rose-300">missing</span>
                    );
                    return (
                      <div className="tw-space-y-4 tw-pt-2">
                        <div className="tw-text-base tw-font-medium tw-text-white">
                          Phase Configuration
                        </div>
                        {phase.key === "publicphase" ? null : (
                          <div className="tw-grid tw-grid-cols-1 tw-gap-3 sm:tw-grid-cols-2">
                            <LaunchFieldBox
                              label="Merkle Root"
                              contentClassName="tw-break-all"
                            >
                              <span>{phase.root?.merkle_root ?? missing}</span>
                            </LaunchFieldBox>
                            <LaunchFieldBox label="Address Count / Total Spots">
                              <span className="tw-inline-flex tw-items-center">
                                <span>
                                  {phase.root?.addresses_count ?? missing}
                                </span>
                                <span className="tw-px-1">/</span>
                                <span>
                                  {phase.root?.total_spots ?? missing}
                                </span>
                              </span>
                            </LaunchFieldBox>
                          </div>
                        )}
                        <div className="tw-grid tw-grid-cols-1 tw-gap-3 sm:tw-grid-cols-[minmax(0,1fr)_auto] sm:tw-items-start">
                          <div className="tw-grid tw-grid-cols-1 tw-gap-3 lg:tw-grid-cols-2">
                            <LaunchFieldBox label="Phase Start">
                              <input
                                type="datetime-local"
                                value={
                                  phaseAllowlistWindows[phase.key]?.start ?? ""
                                }
                                onChange={(e) =>
                                  setPhaseAllowlistWindows((prev) => ({
                                    ...prev,
                                    [phase.key]: {
                                      start: e.target.value,
                                      end: prev[phase.key]?.end ?? "",
                                    },
                                  }))
                                }
                                className="tw-w-full tw-border-0 tw-bg-transparent tw-p-0 tw-text-white [color-scheme:dark] focus:tw-outline-none focus:tw-ring-0"
                              />
                            </LaunchFieldBox>
                            <LaunchFieldBox label="Phase End">
                              <input
                                type="datetime-local"
                                value={
                                  phaseAllowlistWindows[phase.key]?.end ?? ""
                                }
                                onChange={(e) =>
                                  setPhaseAllowlistWindows((prev) => ({
                                    ...prev,
                                    [phase.key]: {
                                      start: prev[phase.key]?.start ?? "",
                                      end: e.target.value,
                                    },
                                  }))
                                }
                                className="tw-w-full tw-border-0 tw-bg-transparent tw-p-0 tw-text-white [color-scheme:dark] focus:tw-outline-none focus:tw-ring-0"
                              />
                            </LaunchFieldBox>
                          </div>
                          {phase.key !== "phase0" || primaryLaunchAction ? (
                            <button
                              type="button"
                              disabled={
                                phase.key === "phase0"
                                  ? primaryLaunchAction === "Initialize Onchain"
                                    ? !phase.root || missingRequiredInfo
                                    : primaryLaunchAction === "Update Onchain"
                                      ? !isInitialized || !phase.root
                                      : false
                                  : phase.key === "publicphase"
                                    ? !isInitialized
                                    : !isInitialized || !phase.root
                              }
                              onClick={() => {
                                if (phase.key === "phase0") {
                                  if (
                                    primaryLaunchAction === "Initialize Onchain"
                                  ) {
                                    alert("call init");
                                    return;
                                  }
                                  if (
                                    primaryLaunchAction === "Update Onchain"
                                  ) {
                                    alert("call update claim");
                                    return;
                                  }
                                  if (primaryLaunchAction === "Resolve") {
                                    alert("manual resolution required");
                                    return;
                                  }
                                  return;
                                }
                                alert("call update claim");
                              }}
                              className={`${BTN_SUBSCRIPTIONS_AIRDROP} sm:tw-self-start sm:tw-justify-self-end`}
                            >
                              {phase.key === "phase0"
                                ? primaryLaunchAction
                                : "Update Onchain"}
                            </button>
                          ) : null}
                        </div>
                      </div>
                    );
                  })()}
                  <div className="tw-space-y-4 tw-pt-1">
                    <div className="tw-text-base tw-font-medium tw-text-white">
                      Subscription Airdrops
                    </div>
                    <div className="tw-grid tw-grid-cols-1 tw-gap-3 sm:tw-grid-cols-[1fr_auto] sm:tw-items-start">
                      <LaunchFieldBox label="Subscriptions Count">
                        —
                      </LaunchFieldBox>
                      <button
                        type="button"
                        disabled={
                          phase.key === "publicphase"
                            ? !isInitialized
                            : !isInitialized || !phase.root
                        }
                        onClick={() => alert("call subscriptions airdrop")}
                        className={`${BTN_SUBSCRIPTIONS_AIRDROP} sm:tw-self-start sm:tw-justify-self-end`}
                      >
                        Airdrop Subscriptions
                      </button>
                    </div>
                  </div>
                  {phase.key === "phase0" &&
                  !isInitialized &&
                  missingRequiredInfo ? (
                    <p className="tw-mb-0 tw-text-sm tw-text-iron-400">
                      Finalize claim in the{" "}
                      <Link
                        href={`/drop-control/prepare/${memeId}`}
                        className="hover:tw-text-primary-200 tw-text-primary-300 tw-no-underline"
                      >
                        Prepare
                      </Link>{" "}
                      section before initializing.
                    </p>
                  ) : null}
                </>
              )}
            </LaunchAccordionSection>
          ))}

          <LaunchAccordionSection
            title="Airdrop to Research"
            subtitle={
              !isInitialized
                ? "Claim not Initialized"
                : !publicPhaseEnded
                  ? "Available After Public Phase"
                  : researchShortfall > 0
                    ? `x${researchShortfall} Needed`
                    : "No Airdrop Needed"
            }
            tone={
              !isInitialized
                ? "neutral"
                : !publicPhaseEnded
                  ? "neutral"
                  : researchShortfall > 0
                    ? "warning"
                    : "success"
            }
            disabled={!canOpenResearchAirdrop}
            onOpen={() => {
              setTimeout(() => {
                minimumEditionSizeInputRef.current?.focus();
                minimumEditionSizeInputRef.current?.select();
              }, 0);
            }}
          >
            <div className="tw-space-y-5">
              {!isInitialized ? (
                <p className="tw-mb-0 tw-text-sm tw-text-iron-400">
                  Waiting for initialization.
                </p>
              ) : !publicPhaseEnded ? (
                <p className="tw-mb-0 tw-text-sm tw-text-iron-400">
                  Waiting for Public Phase to end.
                </p>
              ) : null}
              <div className="tw-grid tw-grid-cols-1 tw-gap-2 sm:tw-grid-cols-2">
                <div className="tw-rounded-md tw-bg-iron-900/50 tw-p-3 tw-ring-1 tw-ring-inset tw-ring-iron-800">
                  <div className="tw-text-sm tw-text-iron-400">Minted</div>
                  <div className="tw-mt-1 tw-text-white">{mintedCount}</div>
                </div>
                <div className="tw-rounded-md tw-bg-iron-900/50 tw-p-3 tw-ring-1 tw-ring-inset tw-ring-iron-800">
                  <div className="tw-text-sm tw-text-iron-400">
                    Minimum Edition Size
                  </div>
                  <input
                    ref={minimumEditionSizeInputRef}
                    type="number"
                    min={0}
                    step={1}
                    value={researchGuaranteeTarget}
                    onChange={(e) => {
                      const parsed = Number(e.target.value);
                      setResearchGuaranteeTarget(
                        Number.isFinite(parsed) && parsed >= 0 ? parsed : 0
                      );
                    }}
                    className="tw-mt-1 tw-w-full tw-border-0 tw-bg-transparent tw-p-0 tw-text-white focus:tw-outline-none focus:tw-ring-0"
                  />
                </div>
              </div>
              <div className="tw-flex tw-justify-center">
                <button
                  type="button"
                  disabled={!canOpenResearchAirdrop || researchShortfall <= 0}
                  onClick={() => alert("call airdrop")}
                  className={`${BTN_AIRDROP} tw-w-fit`}
                >
                  {researchShortfall > 0
                    ? `Airdrop x${researchShortfall} to Research`
                    : "Airdrop to Research"}
                </button>
              </div>
            </div>
          </LaunchAccordionSection>

          <LaunchAccordionSection
            title="Update Claim Metadata"
            subtitle={
              !isInitialized
                ? "Claim not Initialized"
                : metadataAligned
                  ? "Aligned"
                  : "Update Required"
            }
            tone={
              !isInitialized
                ? "neutral"
                : metadataAligned
                  ? "success"
                  : "warning"
            }
            defaultOpen={isInitialized && !metadataAligned}
          >
            <DataRow
              label="6529.io Location"
              value={
                toArweaveUrl(claim.metadata_location) ? (
                  <a
                    href={toArweaveUrl(claim.metadata_location)!}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="hover:tw-text-primary-200 tw-text-primary-300 tw-no-underline"
                  >
                    {claim.metadata_location}
                  </a>
                ) : (
                  claim.metadata_location || "—"
                )
              }
            />
            <DataRow
              label="On-Chain Location"
              value={
                toArweaveUrl(manifoldClaim?.location) ? (
                  <a
                    href={toArweaveUrl(manifoldClaim?.location)!}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="hover:tw-text-primary-200 tw-text-primary-300 tw-no-underline"
                  >
                    {manifoldClaim?.location}
                  </a>
                ) : (
                  manifoldClaim?.location || "—"
                )
              }
            />
            {!isInitialized ? (
              <p className="tw-mb-0 tw-text-sm tw-text-iron-400">
                Claim is not initialized on chain yet.
              </p>
            ) : metadataAligned ? (
              <p className="tw-mb-0 tw-text-sm tw-text-emerald-300">
                Metadata is aligned.
              </p>
            ) : (
              <p className="tw-mb-0 tw-text-sm tw-text-amber-300">
                Metadata differs from the onchain location. Update required.
              </p>
            )}
          </LaunchAccordionSection>
        </div>
      )}
    </div>
  );
}
