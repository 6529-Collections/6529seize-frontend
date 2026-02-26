"use client";

import { useAuth } from "@/components/auth/Auth";
import DropForgeCraftIcon from "@/components/common/icons/DropForgeCraftIcon";
import DropForgeLaunchIcon from "@/components/common/icons/DropForgeLaunchIcon";
import { getClaimSeason } from "@/components/drop-forge/claimTraitsData";
import {
  getClaimPrimaryStatus,
  getPrimaryStatusPillClassName,
} from "@/components/drop-forge/drop-forge-status.helpers";
import {
  CRAFT_CLAIMS_PAGE_SIZE,
  DROP_FORGE_SECTIONS,
} from "@/components/drop-forge/drop-forge.constants";
import DropForgeMediaTypePill from "@/components/drop-forge/DropForgeMediaTypePill";
import { DropForgePermissionFallback } from "@/components/drop-forge/DropForgePermissionFallback";
import DropForgeStatusPill from "@/components/drop-forge/DropForgeStatusPill";
import DropForgeTestnetIndicator from "@/components/drop-forge/DropForgeTestnetIndicator";
import Pagination from "@/components/pagination/Pagination";
import type { MintingClaim } from "@/generated/models/MintingClaim";
import { isVideoUrl } from "@/helpers/video.helpers";
import { useDropForgeManifoldClaim } from "@/hooks/useDropForgeManifoldClaim";
import { useDropForgePermissions } from "@/hooks/useDropForgePermissions";
import { getClaimsPage } from "@/services/api/memes-minting-claims-api";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

const CARD_CLASS =
  "tw-flex tw-flex-col tw-min-h-[7rem] tw-overflow-hidden tw-rounded-xl tw-ring-1 tw-ring-inset tw-bg-iron-950 tw-ring-iron-800 hover:tw-ring-iron-600 tw-p-4 sm:tw-p-5 tw-no-underline tw-transition-all tw-duration-300";
const CARD_STATUS_CONTAINER_CLASS =
  "tw-static tw-mb-3 tw-flex tw-w-full tw-justify-end tw-gap-2 min-[480px]:tw-absolute min-[480px]:tw-right-4 min-[480px]:tw-top-4 min-[480px]:tw-mb-0 min-[480px]:tw-w-auto min-[480px]:tw-justify-start min-[480px]:tw-flex-col min-[480px]:tw-items-end";

type MediaKind = "image" | "video" | "glb" | "html" | "unknown";

function normalizeFormat(format: string | null | undefined): string | null {
  return format ? format.toUpperCase() : null;
}

function getUrlExtension(url: string | null | undefined): string | null {
  if (!url) return null;
  const clean = url.split("?")[0]?.split("#")[0] ?? "";
  const parts = clean.split(".");
  if (parts.length < 2) return null;
  return parts.at(-1)?.toLowerCase() ?? null;
}

function getImageFormat(claim: MintingClaim): string | null {
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
  claim: MintingClaim
): { kind: MediaKind; subtype?: string | null } | null {
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

function getMediaTypeLabel(claim: MintingClaim): string {
  const animationInfo = getAnimationInfo(claim);
  if (animationInfo) {
    if (animationInfo.kind === "html" || animationInfo.kind === "glb") {
      return animationInfo.kind.toUpperCase();
    }
    if (animationInfo.kind === "video") {
      return animationInfo.subtype ? `VIDEO/${animationInfo.subtype}` : "VIDEO";
    }
  }
  const imageFormat = getImageFormat(claim);
  if (imageFormat) return `IMAGE/${imageFormat}`;
  if (claim.image_url || claim.image_details) return "IMAGE";
  return "—";
}

function ClaimCardThumbnail({ claim }: Readonly<{ claim: MintingClaim }>) {
  const animationInfo = getAnimationInfo(claim);
  const containerClass =
    "tw-relative tw-w-16 sm:tw-w-24 tw-flex-shrink-0 tw-self-stretch tw-overflow-hidden tw-rounded-lg tw-bg-iron-900 tw-ring-1 tw-ring-iron-800";

  if (claim.image_url) {
    return (
      <div className={containerClass}>
        <img
          src={claim.image_url}
          alt={claim.name?.trim() ? `${claim.name} thumbnail` : `Claim #${claim.claim_id} thumbnail`}
          className="tw-h-full tw-w-full tw-object-cover"
        />
      </div>
    );
  }

  if (animationInfo) {
    const animationBlock =
      animationInfo.kind === "video" ? (
        <video
          src={claim.animation_url ?? ""}
          preload="metadata"
          muted
          playsInline
          className="tw-h-full tw-w-full tw-object-cover"
        >
          <track
            kind="captions"
            src="data:text/vtt,WEBVTT"
            srcLang="en"
            label="English"
          />
        </video>
      ) : (
        <div className="tw-flex tw-h-full tw-w-full tw-items-center tw-justify-center">
          <span className="tw-text-[10px] tw-font-medium tw-uppercase tw-tracking-wider tw-text-iron-400">
            {animationInfo.kind.toUpperCase()}
          </span>
        </div>
      );
    return (
      <div className={`${containerClass} tw-min-h-0`}>{animationBlock}</div>
    );
  }

  return (
    <div className="tw-flex tw-w-16 sm:tw-w-24 tw-flex-shrink-0 tw-items-center tw-justify-center tw-self-stretch tw-rounded-lg tw-bg-iron-900 tw-text-iron-500 tw-ring-1 tw-ring-iron-800">
      —
    </div>
  );
}

interface DropForgeClaimsPageClientProps {
  mode?: "craft" | "launch";
}

export default function DropForgeClaimsListPageClient({
  mode = "craft",
}: Readonly<DropForgeClaimsPageClientProps>) {
  const { setToast } = useAuth();
  const { hasWallet, permissionsLoading, canAccessCraft, canAccessLaunchPage } =
    useDropForgePermissions();
  const section =
    mode === "launch" ? DROP_FORGE_SECTIONS.LAUNCH : DROP_FORGE_SECTIONS.CRAFT;
  const { title, description } = section;
  const HeaderIcon =
    mode === "launch" ? DropForgeLaunchIcon : DropForgeCraftIcon;
  const hasAccess = mode === "launch" ? canAccessLaunchPage : canAccessCraft;

  const [page, setPage] = useState(1);
  const [data, setData] = useState<{
    claims: MintingClaim[];
    count: number;
    page: number;
    page_size: number;
    next: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const latestRequestId = useRef(0);

  const fetchPage = useCallback(
    async (p: number) => {
      const requestId = ++latestRequestId.current;
      setLoading(true);
      setError(null);
      try {
        const res = await getClaimsPage(p, CRAFT_CLAIMS_PAGE_SIZE);
        if (requestId !== latestRequestId.current) return;
        setData(res);
      } catch (e) {
        if (requestId !== latestRequestId.current) return;
        const msg = e instanceof Error ? e.message : "Failed to load claims";
        setError(msg);
        if (msg.toLowerCase() !== "not authorized") {
          setToast({ message: msg, type: "error" });
        }
      } finally {
        if (requestId === latestRequestId.current) {
          setLoading(false);
        }
      }
    },
    [setToast]
  );

  useEffect(() => {
    if (!hasWallet || !hasAccess) return;
    fetchPage(page);
  }, [hasWallet, hasAccess, page, fetchPage]);

  const hasUploadingClaims =
    data?.claims?.some((claim) => claim.media_uploading === true) ?? false;

  useEffect(() => {
    if (!hasWallet || !hasAccess || !hasUploadingClaims) return;
    const id = setInterval(() => {
      fetchPage(page).catch(() => undefined);
    }, 10000);
    return () => clearInterval(id);
  }, [hasWallet, hasAccess, hasUploadingClaims, fetchPage, page]);

  if (permissionsLoading || !hasWallet || !hasAccess) {
    return (
      <DropForgePermissionFallback
        title={title}
        permissionsLoading={permissionsLoading}
        hasWallet={hasWallet}
        hasAccess={hasAccess}
        titleIcon={HeaderIcon}
        titleRight={<DropForgeTestnetIndicator className="tw-flex-shrink-0" />}
      />
    );
  }

  return (
    <div className="tw-px-2 tw-pb-16 tw-pt-2 lg:tw-px-6 lg:tw-pt-8 xl:tw-px-8">
      <div className="tw-mb-6">
        <Link
          href="/drop-forge"
          className="tw-inline-flex tw-w-full tw-justify-center sm:tw-w-auto sm:tw-justify-start tw-items-center tw-gap-2 tw-text-iron-400 tw-no-underline hover:tw-text-iron-50"
        >
          <ArrowLeftIcon className="tw-h-5 tw-w-5 tw-flex-shrink-0" />
          Back to Drop Forge
        </Link>
        <div className="tw-mt-2 tw-flex tw-flex-col tw-items-center tw-gap-3 sm:tw-flex-row sm:tw-items-start sm:tw-justify-between">
          <h1 className="tw-mb-0 tw-inline-flex tw-w-full tw-flex-wrap tw-items-center tw-justify-center tw-gap-2 tw-text-center sm:tw-w-auto sm:tw-justify-start sm:tw-gap-3 sm:tw-text-left tw-text-2xl sm:tw-text-3xl tw-font-semibold tw-text-iron-50">
            <HeaderIcon className="tw-h-7 tw-w-7 sm:tw-h-8 sm:tw-w-8 tw-flex-shrink-0" />
            <span className="tw-break-words">{title}</span>
          </h1>
          <div className="tw-flex tw-w-full tw-justify-center sm:tw-w-auto sm:tw-justify-end">
            <DropForgeTestnetIndicator className="tw-flex-shrink-0" />
          </div>
        </div>
      </div>
      <p className="tw-mb-6 tw-text-center sm:tw-text-left tw-text-iron-400">
        {description}
      </p>

      {error && (
        <p className="tw-text-red-400 tw-mb-4" role="alert">
          {error}
        </p>
      )}

      {loading && !data && <p className="tw-text-iron-400">Loading…</p>}

      {data && (
        <>
          {data.claims.length === 0 && !loading ? (
            <p className="tw-text-iron-400">No claims found</p>
          ) : (
            <div className="tw-flex tw-flex-col tw-gap-4">
              {data.claims.map((claim) => (
                <ClaimCard key={claim.claim_id} claim={claim} mode={mode} />
              ))}
            </div>
          )}
          {data.count > CRAFT_CLAIMS_PAGE_SIZE && data.claims.length > 0 && (
            <div className="tw-mt-10 tw-flex tw-items-center tw-justify-center tw-gap-2">
              <Pagination
                page={page}
                pageSize={CRAFT_CLAIMS_PAGE_SIZE}
                totalResults={data.count}
                setPage={setPage}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ClaimCard({
  claim,
  mode,
}: Readonly<{
  claim: MintingClaim;
  mode: "craft" | "launch";
}>) {
  if (mode === "launch") {
    return <LaunchClaimCard claim={claim} />;
  }
  return <CraftClaimCard claim={claim} />;
}

function getCardDetailsBasePath(mode: "craft" | "launch"): string {
  return mode === "launch" ? "/drop-forge/launch" : "/drop-forge/craft";
}

function ClaimCardContent({
  claim,
  showLaunchFields,
}: Readonly<{
  claim: MintingClaim;
  showLaunchFields?: boolean;
}>) {
  const mediaTypeLabel = getMediaTypeLabel(claim);
  const imageMissing = !claim.image_url && !!claim.animation_url;
  const metadataLabel = showLaunchFields
    ? `#${claim.claim_id} | SZN ${getClaimSeason(claim) || "—"} | EDITION SIZE ${claim.edition_size ?? "—"}`
    : `#${claim.claim_id}`;
  return (
    <div className="tw-flex tw-min-h-full tw-flex-1 tw-items-stretch tw-gap-3 sm:tw-gap-5">
      <ClaimCardThumbnail claim={claim} />
      <div className="tw-flex tw-min-w-0 tw-flex-1 tw-flex-col tw-justify-center tw-gap-2 tw-self-stretch sm:tw-gap-3 min-[480px]:tw-pr-36 lg:tw-pr-40">
        <div className="tw-min-w-0 tw-font-mono tw-text-[11px] sm:tw-text-xs tw-tracking-wide tw-text-iron-400 min-[480px]:tw-truncate">
          {metadataLabel}
        </div>
        <div className="tw-min-w-0 tw-break-words tw-text-sm sm:tw-text-base tw-font-semibold tw-leading-tight tw-text-iron-50 min-[480px]:tw-truncate">
          {claim.name || "—"}
        </div>
        <DropForgeMediaTypePill
          label={mediaTypeLabel}
          className="tw-max-w-full tw-text-xs sm:tw-text-sm"
        />
        {imageMissing && (
          <span className="tw-text-xs tw-leading-tight tw-text-amber-500/90">
            *image missing
          </span>
        )}
      </div>
    </div>
  );
}

function CraftClaimCard({ claim }: Readonly<{ claim: MintingClaim }>) {
  const primaryStatus = getClaimPrimaryStatus({ claim });

  return (
    <Link
      href={`${getCardDetailsBasePath("craft")}/${claim.claim_id}`}
      className={`${CARD_CLASS} tw-relative`}
    >
      <div className={CARD_STATUS_CONTAINER_CLASS}>
        <DropForgeStatusPill
          className={getPrimaryStatusPillClassName(primaryStatus.tone)}
          label={primaryStatus.label}
          showLoader={primaryStatus.key === "publishing"}
          tooltipText={primaryStatus.reason ?? ""}
        />
      </div>
      <ClaimCardContent claim={claim} />
    </Link>
  );
}

function LaunchClaimCard({ claim }: Readonly<{ claim: MintingClaim }>) {
  const { claim: manifoldClaim } = useDropForgeManifoldClaim(claim.claim_id);
  const primaryStatus = getClaimPrimaryStatus({
    claim,
    manifoldClaim: manifoldClaim ?? null,
  });

  return (
    <Link
      href={`${getCardDetailsBasePath("launch")}/${claim.claim_id}`}
      className={`${CARD_CLASS} tw-relative`}
    >
      <div className={CARD_STATUS_CONTAINER_CLASS}>
        <DropForgeStatusPill
          className={getPrimaryStatusPillClassName(primaryStatus.tone)}
          label={primaryStatus.label}
          showLoader={primaryStatus.key === "publishing"}
          tooltipText={primaryStatus.reason ?? ""}
        />
      </div>
      <ClaimCardContent claim={claim} showLaunchFields />
    </Link>
  );
}
