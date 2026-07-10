import {
  ArrowTopRightOnSquareIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import DropForgeFieldBox from "@/components/drop-forge/DropForgeFieldBox";
import {
  getErrorMessage,
  getPhotoFileName,
  matchesTeamArtistAirdropPhase,
  normalizeDistributionPhase,
  normalizeRootPhase,
  type DistributionSectionKey,
} from "@/components/drop-forge/craft/craft-claim-helpers";
import { publicEnv } from "@/config/env";
import { MEMES_CONTRACT } from "@/constants/constants";
import type { DistributionPhoto } from "@/entities/IDistribution";
import { fetchAllPages } from "@/services/6529api";
import {
  type MemesMintingAirdropSummaryItem as ClaimPhaseSummaryItem,
  getMemesMintingAirdrops as getClaimAirdropSummaries,
  getMemesMintingAllowlists as getClaimAllowlistSummaries,
} from "@/services/api/memes-minting-claims-api";

export default function DistributionSection({
  claimId,
  summariesRefreshNonce,
}: Readonly<{
  claimId: number;
  summariesRefreshNonce: number;
}>) {
  const [photos, setPhotos] = useState<DistributionPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [airdropSummaries, setAirdropSummaries] = useState<
    ClaimPhaseSummaryItem[]
  >([]);
  const [airdropSummariesLoading, setAirdropSummariesLoading] = useState(true);
  const [airdropSummariesError, setAirdropSummariesError] = useState<
    string | null
  >(null);
  const [allowlistSummaries, setAllowlistSummaries] = useState<
    ClaimPhaseSummaryItem[] | null
  >(null);
  const [allowlistSummariesLoading, setAllowlistSummariesLoading] =
    useState(true);
  const [allowlistSummariesError, setAllowlistSummariesError] = useState<
    string | null
  >(null);
  const [expandedPhoto, setExpandedPhoto] = useState<DistributionPhoto | null>(
    null
  );
  const closeExpandedPhoto = useCallback(() => {
    setExpandedPhoto(null);
  }, []);

  useEffect(() => {
    let isActive = true;
    setLoading(true);
    setError(null);

    const distributionPhotosUrl = `${publicEnv.API_ENDPOINT}/api/distribution_photos/${MEMES_CONTRACT}/${claimId}`;

    const loadDistributionPhotos = async () => {
      try {
        const distributionPhotos = await fetchAllPages<DistributionPhoto>(
          distributionPhotosUrl
        );
        if (!isActive) return;
        setPhotos(distributionPhotos);
      } catch (e) {
        if (!isActive) return;
        setPhotos([]);
        setError(getErrorMessage(e, "Failed to load distribution photos"));
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    loadDistributionPhotos().catch(() => undefined);

    return () => {
      isActive = false;
    };
  }, [claimId]);

  useEffect(() => {
    let isActive = true;
    setAirdropSummariesLoading(true);
    setAirdropSummariesError(null);
    const loadAirdropSummaries = async () => {
      try {
        const summaries = await getClaimAirdropSummaries(claimId);
        if (!isActive) return;
        setAirdropSummaries(summaries);
      } catch (e) {
        if (!isActive) return;
        setAirdropSummaries([]);
        setAirdropSummariesError(
          getErrorMessage(e, "Failed to load airdrop summaries")
        );
      } finally {
        if (isActive) {
          setAirdropSummariesLoading(false);
        }
      }
    };

    loadAirdropSummaries().catch(() => undefined);

    return () => {
      isActive = false;
    };
  }, [claimId, summariesRefreshNonce]);

  useEffect(() => {
    let isActive = true;
    setAllowlistSummariesLoading(true);
    setAllowlistSummariesError(null);

    const loadAllowlists = async () => {
      try {
        const summaries = await getClaimAllowlistSummaries(claimId);
        if (!isActive) return;
        setAllowlistSummaries(summaries);
      } catch (e) {
        if (!isActive) return;
        setAllowlistSummaries([]);
        setAllowlistSummariesError(
          getErrorMessage(e, "Failed to load allowlist summaries")
        );
      } finally {
        if (isActive) {
          setAllowlistSummariesLoading(false);
        }
      }
    };

    loadAllowlists().catch(() => undefined);

    return () => {
      isActive = false;
    };
  }, [claimId, summariesRefreshNonce]);

  const phaseAliases: Record<DistributionSectionKey, string[]> = {
    automatic: ["automatic", "airdrop", "teamandartistairdrops"],
    phase0: ["phase0", "0"],
    phase1: ["phase1", "1"],
    phase2: ["phase2", "2"],
    public: ["public", "publicphase"],
  };

  function getPhaseSummary(
    section: DistributionSectionKey
  ): ClaimPhaseSummaryItem | undefined {
    const aliases = phaseAliases[section];
    return airdropSummaries.find((item) =>
      aliases.includes(normalizeDistributionPhase(item.phase))
    );
  }

  function getAllowlistSummaryForPhase(
    phase: "phase0" | "phase1" | "phase2" | "publicphase"
  ): ClaimPhaseSummaryItem | null {
    if (!allowlistSummaries) return null;
    const targets: Record<typeof phase, string[]> = {
      phase0: ["phase0"],
      phase1: ["phase1"],
      phase2: ["phase2"],
      publicphase: ["publicphase", "public"],
    };
    return (
      allowlistSummaries.find((item) =>
        targets[phase].includes(normalizeRootPhase(item.phase ?? ""))
      ) ?? null
    );
  }

  function getAllowlistAddresses(
    summary: ClaimPhaseSummaryItem | null | undefined
  ): number | null {
    return normalizeClaimPhaseSummary(summary)?.addresses ?? null;
  }

  function getAllowlistTotal(
    summary: ClaimPhaseSummaryItem | null | undefined
  ): number | null {
    return normalizeClaimPhaseSummary(summary)?.total ?? null;
  }

  function renderPhaseSummaryBox(section: DistributionSectionKey) {
    const summary = getPhaseSummary(section);
    const normalized = normalizeClaimPhaseSummary(summary);
    const addresses = Number(normalized?.addresses ?? 0);
    const total = Number(normalized?.total_airdrops ?? 0);
    return (
      <DropForgeFieldBox
        label="Address Count / Total Airdrops"
        contentClassName={`tw-text-base ${
          airdropSummariesLoading ? "tw-text-iron-400" : "tw-text-white"
        }`}
      >
        {airdropSummariesLoading
          ? "loading / loading"
          : `${addresses.toLocaleString()} / ${total.toLocaleString()}`}
      </DropForgeFieldBox>
    );
  }

  function normalizeClaimPhaseSummary(
    summary: ClaimPhaseSummaryItem | null | undefined
  ): {
    addresses: number | null;
    total: number | null;
    total_airdrops: number | null;
  } | null {
    if (!summary) return null;
    const addressesValue = summary.addresses ?? summary.addresses_count;
    const totalValue = summary.total ?? summary.total_spots;
    const totalAirdropsValue =
      summary.total_airdrops ?? summary.total ?? summary.total_spots;

    return {
      addresses: typeof addressesValue === "number" ? addressesValue : null,
      total: typeof totalValue === "number" ? totalValue : null,
      total_airdrops:
        typeof totalAirdropsValue === "number" ? totalAirdropsValue : null,
    };
  }

  function getAggregatedAirdropSummary(
    keyword: "team" | "artist"
  ): { addresses: number; total: number } | null {
    const matching = airdropSummaries.filter((item) =>
      matchesTeamArtistAirdropPhase(item.phase, keyword)
    );

    if (matching.length === 0) {
      return null;
    }

    return matching.reduce(
      (acc, item) => ({
        addresses:
          acc.addresses + Number(item.addresses ?? item.addresses_count ?? 0),
        total: acc.total + Number(item.total_airdrops ?? item.total ?? 0),
      }),
      { addresses: 0, total: 0 }
    );
  }

  function renderAggregatedAirdropSummaryBox(keyword: "team" | "artist") {
    const summary = getAggregatedAirdropSummary(keyword);
    const addresses = summary?.addresses ?? 0;
    const total = summary?.total ?? 0;

    return (
      <DropForgeFieldBox
        label="Address Count / Total Airdrops"
        contentClassName={`tw-text-base ${
          airdropSummariesLoading ? "tw-text-iron-400" : "tw-text-white"
        }`}
      >
        {airdropSummariesLoading
          ? "loading / loading"
          : `${addresses.toLocaleString()} / ${total.toLocaleString()}`}
      </DropForgeFieldBox>
    );
  }

  function renderAllowlistSummaryBox(phase: "phase0" | "phase1" | "phase2") {
    const allowlist = getAllowlistSummaryForPhase(phase);
    const addresses = getAllowlistAddresses(allowlist) ?? 0;
    const total = getAllowlistTotal(allowlist) ?? 0;

    return (
      <DropForgeFieldBox
        label="Address Count / Total Spots"
        contentClassName={`tw-text-base ${
          allowlistSummariesLoading ? "tw-text-iron-400" : "tw-text-white"
        }`}
      >
        {allowlistSummariesLoading
          ? "loading / loading"
          : `${addresses.toLocaleString()} / ${total.toLocaleString()}`}
      </DropForgeFieldBox>
    );
  }

  function renderTeamArtistTotalSummaryBox() {
    const teamSummary = getAggregatedAirdropSummary("team");
    const artistSummary = getAggregatedAirdropSummary("artist");
    const summary = {
      addresses:
        (teamSummary?.addresses ?? 0) + (artistSummary?.addresses ?? 0),
      total: (teamSummary?.total ?? 0) + (artistSummary?.total ?? 0),
    };

    return (
      <DropForgeFieldBox
        label="Address Count / Total Airdrops"
        contentClassName={`tw-text-base ${
          airdropSummariesLoading ? "tw-text-iron-400" : "tw-text-white"
        }`}
      >
        {airdropSummariesLoading
          ? "loading / loading"
          : `${summary.addresses.toLocaleString()} / ${summary.total.toLocaleString()}`}
      </DropForgeFieldBox>
    );
  }

  function renderPhaseTotalSummaryBox(phase: "phase0" | "phase1" | "phase2") {
    const airdrop = getPhaseSummary(phase);
    const allowlist = getAllowlistSummaryForPhase(phase);
    const summary = {
      addresses:
        Number(airdrop?.addresses ?? airdrop?.addresses_count ?? 0) +
        Number(getAllowlistAddresses(allowlist) ?? 0),
      total:
        Number(airdrop?.total_airdrops ?? airdrop?.total ?? 0) +
        Number(getAllowlistTotal(allowlist) ?? 0),
    };

    return (
      <DropForgeFieldBox
        label="Address Count / Total"
        contentClassName={`tw-text-base ${
          airdropSummariesLoading || allowlistSummariesLoading
            ? "tw-text-iron-400"
            : "tw-text-white"
        }`}
      >
        {airdropSummariesLoading || allowlistSummariesLoading
          ? "loading / loading"
          : `${summary.addresses.toLocaleString()} / ${summary.total.toLocaleString()}`}
      </DropForgeFieldBox>
    );
  }

  return (
    <div>
      <h3 className="tw-mb-3 tw-text-base tw-font-medium tw-text-iron-100">
        Photos
      </h3>

      {loading && (
        <p className="tw-mb-0 tw-text-sm tw-text-iron-400">
          Loading distribution photos…
        </p>
      )}

      {!loading && error && (
        <p className="tw-mb-0 tw-text-sm tw-text-rose-300" role="alert">
          {error}
        </p>
      )}

      {!loading && !error && photos.length === 0 && (
        <p className="tw-mb-0 tw-text-sm tw-text-iron-300">
          No Distribution photos found
        </p>
      )}

      {!loading && !error && photos.length > 0 && (
        <div className="tw-grid tw-grid-cols-2 tw-gap-2 md:tw-grid-cols-3 lg:tw-grid-cols-4">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="tw-relative tw-rounded-md tw-border tw-border-iron-700 tw-bg-iron-900/60 tw-p-1.5"
            >
              <button
                type="button"
                onClick={() => setExpandedPhoto(photo)}
                className="tw-block tw-w-full tw-cursor-zoom-in tw-rounded-md tw-border-0 tw-bg-transparent tw-p-0"
              >
                <div className="tw-aspect-[4/3] tw-overflow-hidden tw-rounded-md tw-bg-iron-950">
                  <img
                    src={photo.link}
                    alt={getPhotoFileName(photo.link)}
                    loading="lazy"
                    className="tw-h-full tw-w-full tw-object-contain"
                  />
                </div>
              </button>
              <a
                href={photo.link}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(event) => event.stopPropagation()}
                aria-label={`Open distribution photo ${getPhotoFileName(photo.link)} in new tab`}
                title={photo.link}
                className="tw-absolute tw-right-2 tw-top-2 tw-inline-flex tw-h-7 tw-w-7 tw-items-center tw-justify-center tw-rounded-md tw-bg-iron-900/90 tw-text-iron-100 tw-no-underline tw-transition-colors hover:tw-bg-iron-800 hover:tw-text-iron-50 focus-visible:tw-outline-none focus-visible:tw-ring-1 focus-visible:tw-ring-iron-500"
              >
                <ArrowTopRightOnSquareIcon className="tw-h-4 tw-w-4" />
              </a>
            </div>
          ))}
        </div>
      )}

      <DistributionPhotoLightbox
        photo={expandedPhoto}
        photoFileName={
          expandedPhoto ? getPhotoFileName(expandedPhoto.link) : ""
        }
        onClose={closeExpandedPhoto}
      />

      <div className="tw-mt-8 tw-space-y-7">
        {airdropSummariesError && (
          <p className="tw-mb-0 tw-text-sm tw-text-rose-300" role="alert">
            {airdropSummariesError}
          </p>
        )}
        {allowlistSummariesError && (
          <p className="tw-mb-0 tw-text-sm tw-text-rose-300" role="alert">
            {allowlistSummariesError}
          </p>
        )}

        <div className="tw-space-y-2">
          <h3 className="tw-mb-0 tw-text-base tw-font-medium tw-text-iron-100">
            Artist and Team
          </h3>
          <div className="tw-grid tw-grid-cols-1 tw-gap-4 md:tw-grid-cols-3 md:tw-gap-3">
            <div className="tw-space-y-3">
              <p className="tw-mb-1 tw-text-sm tw-font-medium tw-text-iron-300">
                Artist
              </p>
              {renderAggregatedAirdropSummaryBox("artist")}
            </div>
            <div className="tw-space-y-3">
              <p className="tw-mb-1 tw-text-sm tw-font-medium tw-text-iron-300">
                Team
              </p>
              {renderAggregatedAirdropSummaryBox("team")}
            </div>
            <div className="tw-space-y-3">
              <p className="tw-mb-1 tw-text-sm tw-font-medium tw-text-iron-300">
                Total
              </p>
              {renderTeamArtistTotalSummaryBox()}
            </div>
          </div>
        </div>

        <div className="tw-space-y-2">
          <h3 className="tw-mb-0 tw-text-base tw-font-medium tw-text-iron-100">
            Phase 0
          </h3>
          <div className="tw-grid tw-grid-cols-1 tw-gap-4 md:tw-grid-cols-3 md:tw-gap-3">
            <div className="tw-space-y-3">
              <p className="tw-mb-1 tw-text-sm tw-font-medium tw-text-iron-300">
                Airdrop
              </p>
              {renderPhaseSummaryBox("phase0")}
            </div>
            <div className="tw-space-y-3">
              <p className="tw-mb-1 tw-text-sm tw-font-medium tw-text-iron-300">
                Allowlist
              </p>
              {renderAllowlistSummaryBox("phase0")}
            </div>
            <div className="tw-space-y-3">
              <p className="tw-mb-1 tw-text-sm tw-font-medium tw-text-iron-300">
                Total
              </p>
              {renderPhaseTotalSummaryBox("phase0")}
            </div>
          </div>
        </div>

        <div className="tw-space-y-2">
          <h3 className="tw-mb-0 tw-text-base tw-font-medium tw-text-iron-100">
            Phase 1
          </h3>
          <div className="tw-grid tw-grid-cols-1 tw-gap-4 md:tw-grid-cols-3 md:tw-gap-3">
            <div className="tw-space-y-3">
              <p className="tw-mb-1 tw-text-sm tw-font-medium tw-text-iron-300">
                Airdrop
              </p>
              {renderPhaseSummaryBox("phase1")}
            </div>
            <div className="tw-space-y-3">
              <p className="tw-mb-1 tw-text-sm tw-font-medium tw-text-iron-300">
                Allowlist
              </p>
              {renderAllowlistSummaryBox("phase1")}
            </div>
            <div className="tw-space-y-3">
              <p className="tw-mb-1 tw-text-sm tw-font-medium tw-text-iron-300">
                Total
              </p>
              {renderPhaseTotalSummaryBox("phase1")}
            </div>
          </div>
        </div>

        <div className="tw-space-y-2">
          <h3 className="tw-mb-0 tw-text-base tw-font-medium tw-text-iron-100">
            Phase 2
          </h3>
          <div className="tw-grid tw-grid-cols-1 tw-gap-4 md:tw-grid-cols-3 md:tw-gap-3">
            <div className="tw-space-y-3">
              <p className="tw-mb-1 tw-text-sm tw-font-medium tw-text-iron-300">
                Airdrop
              </p>
              {renderPhaseSummaryBox("phase2")}
            </div>
            <div className="tw-space-y-3">
              <p className="tw-mb-1 tw-text-sm tw-font-medium tw-text-iron-300">
                Allowlist
              </p>
              {renderAllowlistSummaryBox("phase2")}
            </div>
            <div className="tw-space-y-3">
              <p className="tw-mb-1 tw-text-sm tw-font-medium tw-text-iron-300">
                Total
              </p>
              {renderPhaseTotalSummaryBox("phase2")}
            </div>
          </div>
        </div>

        <div className="tw-space-y-2">
          <h3 className="tw-mb-0 tw-text-base tw-font-medium tw-text-iron-100">
            Public Phase
          </h3>
          <div className="tw-grid tw-grid-cols-1 tw-gap-4 md:tw-grid-cols-3 md:tw-gap-3">
            <div className="tw-space-y-3">
              <p className="tw-mb-1 tw-text-sm tw-font-medium tw-text-iron-300">
                Airdrop
              </p>
              {renderPhaseSummaryBox("public")}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DistributionPhotoLightbox({
  photo,
  photoFileName,
  onClose,
}: Readonly<{
  photo: DistributionPhoto | null;
  photoFileName: string;
  onClose: () => void;
}>) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!photo) return;
    const previousOverflow = document.body.style.overflow;
    previouslyFocusedElementRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    const getFocusableElements = () =>
      Array.from(
        dialogRef.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        ) ?? []
      ).filter((element) => element.tabIndex >= 0);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab") return;

      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) {
        event.preventDefault();
        dialogRef.current?.focus();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey) {
        if (
          document.activeElement === firstElement ||
          document.activeElement === dialogRef.current
        ) {
          event.preventDefault();
          lastElement?.focus();
        }
        return;
      }

      if (document.activeElement === lastElement) {
        event.preventDefault();
        firstElement?.focus();
      }
    };
    document.body.style.overflow = "hidden";
    globalThis.addEventListener("keydown", handleKeyDown);
    requestAnimationFrame(() => dialogRef.current?.focus());
    return () => {
      document.body.style.overflow = previousOverflow;
      globalThis.removeEventListener("keydown", handleKeyDown);
      previouslyFocusedElementRef.current?.focus();
      previouslyFocusedElementRef.current = null;
    };
  }, [photo, onClose]);

  if (!photo || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div className="tailwind-scope tw-fixed tw-inset-0 tw-z-[1000] tw-flex tw-items-center tw-justify-center">
      <button
        type="button"
        aria-label="Close photo lightbox"
        tabIndex={-1}
        onClick={onClose}
        className="tw-absolute tw-inset-0 tw-border-0 tw-bg-black/85 tw-p-0"
      />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={`Distribution photo ${photoFileName}`}
        tabIndex={-1}
        className="tw-relative tw-z-[1001] tw-w-[min(90vw,980px)] tw-overflow-hidden tw-rounded-xl tw-border tw-border-iron-700 tw-bg-iron-950 tw-p-2.5 focus:tw-outline-none"
      >
        <img
          src={photo.link}
          alt={photoFileName}
          className="tw-h-[min(76vh,760px)] tw-w-full tw-object-contain"
        />

        <div className="tw-pointer-events-none tw-absolute tw-right-3 tw-top-3 tw-flex tw-gap-2">
          <a
            href={photo.link}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Open distribution photo ${photoFileName} in new tab`}
            className="tw-pointer-events-auto tw-inline-flex tw-h-9 tw-w-9 tw-items-center tw-justify-center tw-rounded-md tw-bg-iron-900/90 tw-text-iron-100 tw-no-underline tw-transition-colors hover:tw-bg-iron-800 hover:tw-text-iron-50 focus-visible:tw-outline-none focus-visible:tw-ring-1 focus-visible:tw-ring-iron-500"
          >
            <ArrowTopRightOnSquareIcon className="tw-h-5 tw-w-5" />
          </a>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close image preview"
            className="tw-pointer-events-auto tw-inline-flex tw-h-9 tw-w-9 tw-items-center tw-justify-center tw-rounded-md tw-border-0 tw-bg-iron-900/90 tw-text-iron-100 tw-transition-colors hover:tw-bg-iron-800 hover:tw-text-iron-50 focus-visible:tw-outline-none focus-visible:tw-ring-1 focus-visible:tw-ring-iron-500"
          >
            <XMarkIcon className="tw-h-5 tw-w-5" />
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
