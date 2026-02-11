"use client";

import { useAuth } from "@/components/auth/Auth";
import { getMintTimelineDetails } from "@/components/meme-calendar/meme-calendar.helpers";
import { DROP_CONTROL_SECTIONS } from "@/components/drop-control/drop-control.constants";
import { isMissingRequiredLaunchInfo } from "@/components/drop-control/launchClaimHelpers";
import { DropControlPermissionFallback } from "@/components/drop-control/DropControlPermissionFallback";
import { MEMES_CONTRACT } from "@/constants/constants";
import type { MemeClaim } from "@/generated/models/MemeClaim";
import type { MemesMintingRootItem } from "@/generated/models/MemesMintingRootItem";
import { useDropControlPermissions } from "@/hooks/useDropControlPermissions";
import { buildMemesPhases, useMemesManifoldClaim } from "@/hooks/useManifoldClaim";
import { Time } from "@/helpers/time";
import { getClaim, getMemesMintingRoots } from "@/services/api/memes-minting-claims-api";
import {
  ChevronDownIcon,
  ChevronRightIcon,
} from "@heroicons/react/20/solid";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

interface DropControlLaunchClaimPageClientProps {
  memeId: number;
}

const SECTION_CARD_CLASS =
  "tw-rounded-xl tw-bg-iron-950 tw-p-4 tw-ring-1 tw-ring-inset tw-ring-iron-800 sm:tw-p-5";
const BTN_INITIALIZE =
  "tw-rounded-lg tw-border-0 tw-ring-1 tw-ring-inset tw-ring-primary-400/60 tw-bg-primary-500 tw-px-5 tw-py-2.5 tw-text-base tw-font-semibold tw-text-white tw-transition-colors tw-duration-150 enabled:hover:tw-bg-primary-600 enabled:hover:tw-ring-primary-300 enabled:active:tw-bg-primary-700 enabled:active:tw-ring-primary-300 disabled:tw-cursor-not-allowed disabled:tw-opacity-50";

type SectionTone = "neutral" | "success" | "warning" | "danger";

interface LaunchAccordionSectionProps {
  title: string;
  subtitle: string;
  tone: SectionTone;
  defaultOpen?: boolean;
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
  const datePart = isUs
    ? `${month}/${day}/${year}`
    : `${day}/${month}/${year}`;
  return `${datePart} ${hours}:${minutes}`;
}

function formatScheduledLabel(date: Date): string {
  const weekday = date.toLocaleDateString(undefined, { weekday: "long" });
  const day = String(date.getDate()).padStart(2, "0");
  const month = date.toLocaleDateString(undefined, { month: "short" });
  const year = date.getFullYear();
  return `${weekday} ${day} ${month}, ${year}`;
}

function capitalizeWords(value: string | null | undefined): string {
  if (!value) return "—";
  return value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
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
  children,
}: LaunchAccordionSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  useEffect(() => {
    setIsOpen(defaultOpen);
  }, [defaultOpen]);

  return (
    <div className={SECTION_CARD_CLASS}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="tw-flex tw-w-full tw-items-center tw-justify-between tw-gap-2 tw-bg-transparent tw-p-0 tw-text-left tw-border-0"
      >
        <span className="tw-inline-flex tw-items-center tw-gap-2">
          <span className="tw-relative tw-h-5 tw-w-5 tw-flex-shrink-0">
            <ChevronRightIcon
              className={`tw-absolute tw-inset-0 tw-h-5 tw-w-5 tw-text-white tw-transition-all tw-duration-200 ${
                isOpen
                  ? "tw-rotate-90 tw-opacity-0"
                  : "tw-rotate-0 tw-opacity-100"
              }`}
            />
            <ChevronDownIcon
              className={`tw-absolute tw-inset-0 tw-h-5 tw-w-5 tw-text-white tw-transition-all tw-duration-200 ${
                isOpen
                  ? "tw-rotate-0 tw-opacity-100"
                  : "-tw-rotate-90 tw-opacity-0"
              }`}
            />
          </span>
          <span className="tw-text-base tw-font-semibold tw-text-iron-50">
            {title}
          </span>
        </span>
        {subtitle ? (
          <span
            className={`tw-inline-flex tw-items-center tw-rounded-full tw-px-3 tw-py-1 tw-text-xs tw-font-medium tw-ring-1 tw-ring-inset ${toneClass(tone)}`}
          >
            {subtitle}
          </span>
        ) : null}
      </button>
      <div
        className={`tw-grid tw-transition-all tw-duration-200 tw-ease-out ${
          isOpen
            ? "tw-mt-5 tw-grid-rows-[1fr] tw-opacity-100"
            : "tw-mt-0 tw-grid-rows-[0fr] tw-opacity-0"
        }`}
      >
        <div className="tw-space-y-3 tw-overflow-hidden">{children}</div>
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
          setToast({ message: msg, type: "error" });
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
          setToast({ message: msg, type: "error" });
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
  }, [hasWallet, canAccessLaunchPage, memeId, setToast]);

  const isInitialized = Boolean(manifoldClaim?.instanceId);
  const missingRequiredInfo = Boolean(claim && isMissingRequiredLaunchInfo(claim));
  const metadataInSync = Boolean(
    isInitialized &&
      claim?.metadata_location &&
      manifoldClaim?.location &&
      manifoldClaim.location === claim.metadata_location
  );

  const mintTimeline = useMemo(
    () => (memeId > 0 ? getMintTimelineDetails(memeId) : null),
    [memeId]
  );

  const phaseData = useMemo(
    () => {
      const scheduleByPhaseId = new Map(
        (mintTimeline
          ? buildMemesPhases(Time.millis(mintTimeline.instantUtc.getTime()))
          : []
        ).map((phase) => [phase.id, phase])
      );

      return [
      {
        key: "phase0" as const,
        title: "Phase 0",
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
    },
    [mintTimeline, roots]
  );

  if (permissionFallback) {
    return permissionFallback;
  }

  return (
    <div className="tw-px-2 tw-pb-16 tw-pt-2 lg:tw-px-6 lg:tw-pt-8 xl:tw-px-8">
      <h1 className="tw-mb-2 tw-text-3xl tw-font-semibold tw-text-iron-50">
        Launch Claim #{memeId}
      </h1>
      <p className="tw-mb-6 tw-text-iron-400">
        Configure initialization, metadata sync, and per-phase merkle data.
      </p>
      {loading && <p className="tw-text-iron-400">Loading…</p>}
      {error && (
        <p className="tw-mb-4 tw-text-red-400" role="alert">
          {error}
        </p>
      )}
      {rootsError && (
        <p className="tw-mb-4 tw-text-red-400" role="alert">
          {rootsError}
        </p>
      )}
      {claim && (
        <div className="tw-flex tw-flex-col tw-gap-5 sm:tw-gap-6">
          {mintTimeline && (
            <p className="tw-mb-0 tw-text-xl tw-font-semibold tw-text-iron-100">
              Scheduled for {formatScheduledLabel(mintTimeline.instantUtc)}
            </p>
          )}
          <LaunchAccordionSection
            title="Initialize Claim"
            subtitle={
              isInitialized
                ? "Initialized"
                : missingRequiredInfo
                  ? "Not Initialized - Missing Info"
                  : "Not Initialized"
            }
            tone={isInitialized ? "success" : "warning"}
            defaultOpen={!isInitialized}
          >
            {isInitialized ? (
              <>
                <div className="tw-grid tw-grid-cols-1 tw-gap-2 sm:tw-grid-cols-2">
                  <div className="tw-rounded-md tw-bg-iron-900/50 tw-p-3 tw-ring-1 tw-ring-inset tw-ring-iron-800">
                    <div className="tw-text-sm tw-text-iron-400">Instance ID</div>
                    <div className="tw-mt-1 tw-text-white">
                      {manifoldClaim?.instanceId ?? "—"}
                    </div>
                  </div>
                  <div className="tw-rounded-md tw-bg-iron-900/50 tw-p-3 tw-ring-1 tw-ring-inset tw-ring-iron-800">
                    <div className="tw-text-sm tw-text-iron-400">
                      On-Chain Location
                    </div>
                    <div className="tw-mt-1 tw-break-all tw-text-white">
                      {toArweaveUrl(manifoldClaim?.location) ? (
                        <a
                          href={toArweaveUrl(manifoldClaim?.location)!}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="tw-text-primary-300 tw-no-underline hover:tw-text-primary-200"
                        >
                          {manifoldClaim?.location}
                        </a>
                      ) : (
                        "—"
                      )}
                    </div>
                  </div>
                  <div className="tw-rounded-md tw-bg-iron-900/50 tw-p-3 tw-ring-1 tw-ring-inset tw-ring-iron-800">
                    <div className="tw-text-sm tw-text-iron-400">
                      Current Phase / Status
                    </div>
                    <div className="tw-mt-1 tw-text-white">
                      {`${manifoldClaim?.phase ?? "—"} / ${capitalizeWords(manifoldClaim?.status)}`}
                    </div>
                  </div>
                  <div className="tw-rounded-md tw-bg-iron-900/50 tw-p-3 tw-ring-1 tw-ring-inset tw-ring-iron-800">
                    <div className="tw-text-sm tw-text-iron-400">Edition Size</div>
                    <div className="tw-mt-1 tw-text-white">
                      {`${manifoldClaim?.total ?? "—"} / ${manifoldClaim?.totalMax ?? "—"} (${manifoldClaim?.remaining ?? "—"} remaining)`}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="tw-grid tw-grid-cols-1 tw-gap-4 md:tw-grid-cols-[1fr_auto] md:tw-items-start md:tw-gap-6">
                <div className="tw-flex tw-flex-col tw-gap-3">
                  <p className="tw-mb-0 tw-text-sm tw-text-iron-400">
                  {missingRequiredInfo
                    ? "Claim is not initialized on chain yet. Missing required info."
                    : "Claim is not initialized on chain yet."}
                  </p>
                  {missingRequiredInfo && (
                    <>
                      <p className="tw-mb-0 tw-text-sm tw-text-iron-400">
                        Finalize claim in the Prepare section before initializing.
                      </p>
                      <Link
                        href={`/drop-control/prepare/${memeId}`}
                        className="tw-w-fit tw-text-sm tw-text-primary-300 tw-no-underline hover:tw-text-primary-200"
                      >
                        Go to Prepare Claim
                      </Link>
                    </>
                  )}
                </div>
                <div className="md:tw-justify-self-end">
                  <button
                    type="button"
                    disabled={missingRequiredInfo}
                    onClick={() => alert("call init")}
                    className={`${BTN_INITIALIZE} tw-w-fit`}
                  >
                    Initialize Claim
                  </button>
                </div>
              </div>
            )}
          </LaunchAccordionSection>

          <LaunchAccordionSection
            title="Update Claim Metadata"
            subtitle={
              !isInitialized
                ? "Waiting for Initialization"
                : metadataInSync
                  ? "In Sync"
                  : "Update Needed"
            }
            tone={
              !isInitialized
                ? "neutral"
                : metadataInSync
                  ? "success"
                  : "warning"
            }
            defaultOpen={isInitialized && !metadataInSync}
          >
            <DataRow
              label="6529.io Location"
              value={
                toArweaveUrl(claim.metadata_location) ? (
                  <a
                    href={toArweaveUrl(claim.metadata_location)!}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="tw-text-primary-300 tw-no-underline hover:tw-text-primary-200"
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
                    className="tw-text-primary-300 tw-no-underline hover:tw-text-primary-200"
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
            ) : metadataInSync ? (
              <p className="tw-mb-0 tw-text-sm tw-text-emerald-300">
                Metadata is in sync.
              </p>
            ) : (
              <p className="tw-mb-0 tw-text-sm tw-text-amber-300">
                Metadata mismatch detected. Update is needed.
              </p>
            )}
          </LaunchAccordionSection>

          {phaseData.map((phase) => (
            <LaunchAccordionSection
              key={phase.key}
              title={phase.title}
              subtitle={
                rootsLoading
                  ? "Loading…"
                  : phase.root
                    ? "Merkle Data Found"
                    : phase.key === "publicphase"
                      ? ""
                      : "Merkle Data Missing"
              }
              tone={
                rootsLoading
                  ? "neutral"
                  : phase.root || phase.key === "publicphase"
                    ? "success"
                    : "danger"
              }
            >
              {rootsLoading ? (
                <p className="tw-mb-0 tw-text-sm tw-text-iron-400">
                  Loading phase data…
                </p>
              ) : (
                <>
                  {phase.schedule ? (
                    <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-x-3 tw-gap-y-1 tw-rounded-md tw-bg-iron-900/50 tw-p-3 tw-ring-1 tw-ring-inset tw-ring-iron-800">
                      <span className="tw-text-sm tw-text-iron-400">
                        Schedule
                      </span>
                      <span className="tw-text-white">
                        {`${formatLocalDateTime(phase.schedule.start.toDate())} - ${formatLocalDateTime(phase.schedule.end.toDate())}`}
                      </span>
                    </div>
                  ) : (
                    <DataRow label="Schedule" value="Unavailable" />
                  )}
                  {(() => {
                    const missing = (
                      <span className="tw-text-rose-300">missing</span>
                    );
                    if (phase.key === "publicphase") {
                      return null;
                    }
                    return (
                      <div className="tw-grid tw-grid-cols-1 tw-gap-2 sm:tw-grid-cols-2">
                        <div className="tw-rounded-md tw-bg-iron-900/50 tw-p-3 tw-ring-1 tw-ring-inset tw-ring-iron-800">
                          <div className="tw-text-sm tw-text-iron-400">
                            Phase Name
                          </div>
                          <div className="tw-mt-1 tw-text-white">
                            {phase.root?.phase ?? missing}
                          </div>
                        </div>
                        <div className="tw-rounded-md tw-bg-iron-900/50 tw-p-3 tw-ring-1 tw-ring-inset tw-ring-iron-800">
                          <div className="tw-text-sm tw-text-iron-400">
                            Merkle Root
                          </div>
                          <div className="tw-mt-1 tw-break-all tw-text-white">
                            {phase.root?.merkle_root ?? missing}
                          </div>
                        </div>
                        <div className="tw-rounded-md tw-bg-iron-900/50 tw-p-3 tw-ring-1 tw-ring-inset tw-ring-iron-800">
                          <div className="tw-text-sm tw-text-iron-400">
                            Address Count
                          </div>
                          <div className="tw-mt-1 tw-text-white">
                            {phase.root?.addresses_count ?? missing}
                          </div>
                        </div>
                        <div className="tw-rounded-md tw-bg-iron-900/50 tw-p-3 tw-ring-1 tw-ring-inset tw-ring-iron-800">
                          <div className="tw-text-sm tw-text-iron-400">
                            Total Spots
                          </div>
                          <div className="tw-mt-1 tw-text-white">
                            {phase.root?.total_spots ?? missing}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </>
              )}
            </LaunchAccordionSection>
          ))}
        </div>
      )}
    </div>
  );
}
