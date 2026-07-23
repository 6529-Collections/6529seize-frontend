"use client";

import type { AllowlistDescription } from "@/components/allowlist-tool/allowlist-tool.types";
import CircleLoader from "@/components/distribution-plan-tool/common/CircleLoader";
import type { DistributionOverview } from "@/generated/models/DistributionOverview";
import type { DistributionPhoto } from "@/generated/models/DistributionPhoto";
import type { PhaseAirdrop } from "@/generated/models/PhaseAirdrop";
import { formatAddress } from "@/helpers/Helpers";
import { faDownload, faUpload } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Image from "next/image";
import type { ReactNode } from "react";
import {
  DistributionAirdropsPhase,
  DistributionPhaseAirdropsModal,
} from "./ReviewDistributionPlanTableSubscriptionFooterPhaseAirdrops";
import { ConfirmTokenIdModal } from "./ReviewDistributionPlanTableSubscriptionFooterConfirmTokenId";
import { DistributionPhaseAirdropsViewerModal } from "./ReviewDistributionPlanTableSubscriptionFooterPhaseAirdropsViewer";
import {
  GithubUploadModal,
  type GithubUploadResult,
} from "./ReviewDistributionPlanTableSubscriptionFooterGithubUploadModal";
import { DistributionPhotosViewerModal } from "./ReviewDistributionPlanTableSubscriptionFooterPhotosViewer";
import { UploadDistributionPhotosModal } from "./ReviewDistributionPlanTableSubscriptionFooterUploadPhotos";

function getAirdropsAddresses(
  overview: DistributionOverview | null,
  phase: DistributionAirdropsPhase
): number {
  if (phase === "artist") {
    return overview?.artist_airdrops_addresses ?? 0;
  }

  return overview?.team_airdrops_addresses ?? 0;
}

function getAirdropsCount(
  overview: DistributionOverview | null,
  phase: DistributionAirdropsPhase
): number {
  if (phase === "artist") {
    return overview?.artist_airdrops_count ?? 0;
  }

  return overview?.team_airdrops_count ?? 0;
}

function getTotalAirdropsCount(overview: DistributionOverview | null): number {
  return (
    getAirdropsCount(overview, "artist") + getAirdropsCount(overview, "team")
  );
}

function getAirdropsPhaseLabel(phase: DistributionAirdropsPhase): string {
  return phase === "artist" ? "Artist" : "Team";
}

export function getGithubUploadTooltip(
  overview: DistributionOverview | null
): string | null {
  if (overview?.is_normalized === true) {
    if ((overview?.photos_count ?? 0) === 0) {
      return "Upload distribution photos first";
    }
    if (getTotalAirdropsCount(overview) === 0) {
      return "Upload artist or team airdrops first";
    }
    return null;
  }
  return "Finalize and normalize the distribution first";
}

export function canPublishToGithub(
  overview: DistributionOverview | null
): boolean {
  return (
    overview?.is_normalized === true &&
    (overview?.photos_count ?? 0) > 0 &&
    getTotalAirdropsCount(overview) > 0
  );
}

export function SubscriptionFooterMain({
  contract,
  confirmedTokenId,
  distributionPlan,
  overview,
  isLoadingOverview,
  isResetting,
  isUploading,
  uploadingAirdropsPhase,
  downloadingAirdropsPhases,
  isFinalizing,
  isUploadingToGithub,
  showGithubModal,
  githubUploadResult,
  githubUploadError,
  showConfirmTokenId,
  showUploadPhotos,
  showViewPhotos,
  showUploadAirdropsPhase,
  showViewAirdropsPhase,
  viewedPhotos,
  viewedPhotosError,
  viewedAirdrops,
  viewedAirdropsError,
  viewingPhotos,
  viewingAirdropsPhase,
  canPublish,
  githubUploadTooltip,
  onConfirmTokenId,
  onChangeTokenId,
  onResetSubscriptions,
  onShowUploadAirdrops,
  onShowViewAirdrops,
  onShowUploadPhotos,
  onShowViewPhotos,
  onDownloadAirdrops,
  onFinalize,
  onUploadToGithub,
  onCloseGithubModal,
  onUploadPhotos,
  onUploadAirdrops,
  onCloseUploadPhotos,
  onCloseViewPhotos,
  onCloseUploadAirdrops,
  onCloseViewAirdrops,
}: Readonly<{
  contract: string;
  confirmedTokenId: string;
  distributionPlan: AllowlistDescription | null;
  overview: DistributionOverview | null;
  isLoadingOverview: boolean;
  isResetting: boolean;
  isUploading: boolean;
  uploadingAirdropsPhase: DistributionAirdropsPhase | null;
  downloadingAirdropsPhases: Record<DistributionAirdropsPhase, boolean>;
  isFinalizing: boolean;
  isUploadingToGithub: boolean;
  showGithubModal: boolean;
  githubUploadResult: GithubUploadResult | null;
  githubUploadError: string | null;
  showConfirmTokenId: boolean;
  showUploadPhotos: boolean;
  showViewPhotos: boolean;
  showUploadAirdropsPhase: DistributionAirdropsPhase | null;
  showViewAirdropsPhase: DistributionAirdropsPhase | null;
  viewedPhotos: DistributionPhoto[];
  viewedPhotosError: string | null;
  viewedAirdrops: PhaseAirdrop[];
  viewedAirdropsError: string | null;
  viewingPhotos: boolean;
  viewingAirdropsPhase: DistributionAirdropsPhase | null;
  canPublish: boolean;
  githubUploadTooltip: string | null;
  onConfirmTokenId: (tokenId: string) => void;
  onChangeTokenId: () => void;
  onResetSubscriptions: () => void;
  onShowUploadAirdrops: (phase: DistributionAirdropsPhase) => void;
  onShowViewAirdrops: (phase: DistributionAirdropsPhase) => void;
  onShowUploadPhotos: () => void;
  onShowViewPhotos: () => void;
  onDownloadAirdrops: (phase: DistributionAirdropsPhase) => void;
  onFinalize: () => void;
  onUploadToGithub: () => void;
  onCloseGithubModal: () => void;
  onUploadPhotos: (
    contract: string,
    tokenId: string,
    files: File[]
  ) => Promise<void>;
  onUploadAirdrops: (
    contract: string,
    tokenId: string,
    phase: DistributionAirdropsPhase,
    csvContent: string
  ) => Promise<boolean>;
  onCloseUploadPhotos: () => void;
  onCloseViewPhotos: () => void;
  onCloseUploadAirdrops: () => void;
  onCloseViewAirdrops: () => void;
}>) {
  const softControlHoverClasses =
    "tw-transition tw-duration-150 tw-ease-out enabled:hover:tw-bg-[#eceae4] enabled:hover:tw-text-iron-900 enabled:active:tw-bg-[#e5e2db] enabled:focus-visible:tw-bg-[#eceae4] disabled:tw-cursor-not-allowed disabled:tw-bg-iron-300 disabled:tw-text-iron-700 disabled:tw-opacity-100";
  const renderStableButtonContent = ({
    isLoading,
    idleContent,
    loadingContent,
  }: {
    isLoading: boolean;
    idleContent: ReactNode;
    loadingContent: ReactNode;
  }) => (
    <span className="tw-relative tw-inline-flex tw-items-center tw-justify-center">
      <span className={isLoading ? "tw-invisible" : ""}>{idleContent}</span>
      {isLoading && (
        <span className="tw-absolute tw-inset-0 tw-flex tw-items-center tw-justify-center">
          {loadingContent}
        </span>
      )}
    </span>
  );

  const renderAirdropsButtonGroup = (phase: DistributionAirdropsPhase) => {
    const phaseLabel = getAirdropsPhaseLabel(phase);
    const isUploadingThisPhase = uploadingAirdropsPhase === phase;
    const isViewingThisPhase = viewingAirdropsPhase === phase;
    const isDownloadingThisPhase = downloadingAirdropsPhases[phase];
    const isDownloadDisabled =
      isLoadingOverview ||
      isDownloadingThisPhase ||
      getAirdropsCount(overview, phase) === 0;

    return (
      <div
        key={phase}
        className="tw-flex tw-h-9 tw-overflow-hidden tw-rounded-full tw-ring-1 tw-ring-inset tw-ring-iron-400/20"
      >
        <button
          onClick={() => onShowUploadAirdrops(phase)}
          disabled={uploadingAirdropsPhase !== null}
          aria-label={`Upload ${phaseLabel} Airdrops`}
          title={`Upload ${phaseLabel} Airdrops`}
          type="button"
          className={`tw-group tw-flex tw-h-9 tw-w-9 tw-items-center tw-justify-center tw-border-none tw-bg-white tw-text-sm tw-font-medium tw-text-iron-900 ${softControlHoverClasses}`}
        >
          {isUploadingThisPhase ? (
            <span className="tw-flex tw-items-center tw-justify-center">
              <CircleLoader />
            </span>
          ) : (
            <FontAwesomeIcon icon={faUpload} className="tw-h-3.5 tw-w-3.5" />
          )}
        </button>
        <button
          onClick={() => onShowViewAirdrops(phase)}
          disabled={isViewingThisPhase}
          aria-label={`${phaseLabel} Airdrops`}
          aria-haspopup="dialog"
          title={`${phaseLabel} Airdrops (${getAirdropsAddresses(
            overview,
            phase
          )} addresses, ${getAirdropsCount(overview, phase)} total)`}
          type="button"
          className={`tw-group tw-flex tw-h-9 tw-items-center tw-justify-center tw-border-0 tw-border-x tw-border-solid tw-border-x-iron-500/20 tw-bg-white tw-px-4 tw-text-sm tw-font-medium tw-text-iron-900 ${softControlHoverClasses}`}
        >
          {renderStableButtonContent({
            isLoading: isViewingThisPhase,
            loadingContent: (
              <span className="tw-flex tw-items-center tw-gap-2">
                <CircleLoader />
                <span>Loading</span>
              </span>
            ),
            idleContent: (
              <span>
                {phaseLabel} Airdrops{" "}
                <span className="tw-ml-2 tw-text-iron-500">
                  {getAirdropsAddresses(overview, phase)}/
                  {getAirdropsCount(overview, phase)}
                </span>
              </span>
            ),
          })}
        </button>
        <button
          onClick={() => onDownloadAirdrops(phase)}
          disabled={isDownloadDisabled}
          aria-label={`Download ${phaseLabel} Airdrops CSV`}
          title={`Download ${phaseLabel} Airdrops CSV`}
          type="button"
          className={`tw-group tw-flex tw-h-9 tw-w-9 tw-items-center tw-justify-center tw-border-0 tw-bg-white tw-text-sm tw-font-medium tw-text-iron-900 ${softControlHoverClasses}`}
        >
          {isDownloadingThisPhase ? (
            <span className="tw-flex tw-items-center tw-justify-center">
              <CircleLoader />
            </span>
          ) : (
            <FontAwesomeIcon icon={faDownload} className="tw-h-3.5 tw-w-3.5" />
          )}
        </button>
      </div>
    );
  };

  return (
    <div className="tw-flex tw-flex-col tw-items-end tw-gap-2 tw-py-3">
      <div className="tw-flex tw-w-full tw-flex-wrap tw-items-center tw-justify-between tw-gap-2">
        <span className="tw-text-sm tw-text-iron-400">
          Contract: The Memes - {formatAddress(contract)} | Token ID:{" "}
          {confirmedTokenId}
        </span>
        <div className="tw-flex tw-items-center tw-gap-2">
          <button
            onClick={onChangeTokenId}
            type="button"
            className="tw-group tw-flex tw-h-8 tw-items-center tw-justify-center tw-rounded-full tw-border-none tw-bg-white tw-px-3 tw-text-sm tw-font-medium tw-text-iron-900 tw-ring-1 tw-ring-inset tw-ring-iron-400/20 tw-transition tw-duration-300 tw-ease-out hover:tw-bg-iron-400/20 hover:tw-text-iron-100"
          >
            Change Token ID
          </button>
          <button
            onClick={onResetSubscriptions}
            disabled={isResetting}
            type="button"
            className="tw-group tw-flex tw-h-8 tw-items-center tw-justify-center tw-rounded-full tw-border-none tw-bg-[#f87171] tw-px-3 tw-text-sm tw-font-medium tw-text-iron-900 tw-ring-1 tw-ring-inset tw-ring-[#f87171]/20 tw-transition tw-duration-300 tw-ease-out hover:tw-bg-[#7f1d1d] hover:tw-text-iron-100"
          >
            {isResetting ? (
              <span className="tw-flex tw-items-center tw-gap-2">
                <CircleLoader />
                <span>Resetting</span>
              </span>
            ) : (
              <>Reset Subscriptions</>
            )}
          </button>
        </div>
      </div>
      <div className="tw-mt-5 tw-flex tw-flex-wrap tw-items-center tw-justify-end tw-gap-2">
        {renderAirdropsButtonGroup("artist")}
        {renderAirdropsButtonGroup("team")}
      </div>
      <div className="tw-mt-2 tw-flex tw-flex-wrap tw-items-center tw-justify-end tw-gap-2">
        <div className="tw-flex tw-h-9 tw-overflow-hidden tw-rounded-full tw-ring-1 tw-ring-inset tw-ring-iron-400/20">
          <button
            onClick={onShowUploadPhotos}
            disabled={isUploading}
            aria-label="Upload Distribution Photos"
            title="Upload Distribution Photos"
            type="button"
            className={`tw-group tw-flex tw-h-9 tw-w-9 tw-items-center tw-justify-center tw-border-none tw-bg-white tw-text-sm tw-font-medium tw-text-iron-900 ${softControlHoverClasses}`}
          >
            {isUploading ? (
              <span className="tw-flex tw-items-center tw-justify-center">
                <CircleLoader />
              </span>
            ) : (
              <FontAwesomeIcon icon={faUpload} className="tw-h-3.5 tw-w-3.5" />
            )}
          </button>
          <button
            onClick={onShowViewPhotos}
            disabled={viewingPhotos}
            aria-label={`Distribution Photos (${overview?.photos_count ?? 0})`}
            aria-haspopup="dialog"
            title={`Distribution Photos (${overview?.photos_count ?? 0})`}
            type="button"
            className={`tw-group tw-flex tw-h-9 tw-items-center tw-justify-center tw-border-0 tw-border-l tw-border-solid tw-border-l-iron-500/20 tw-bg-white tw-px-4 tw-text-sm tw-font-medium tw-text-iron-900 ${softControlHoverClasses}`}
          >
            {renderStableButtonContent({
              isLoading: viewingPhotos,
              loadingContent: (
                <span className="tw-flex tw-items-center tw-gap-2">
                  <CircleLoader />
                  <span>Loading</span>
                </span>
              ),
              idleContent: (
                <>
                  Distribution Photos
                  {isLoadingOverview ? (
                    <span className="tw-ml-2">
                      <CircleLoader />
                    </span>
                  ) : (
                    <span className="tw-ml-2 tw-text-iron-500">
                      {overview?.photos_count ?? 0}
                    </span>
                  )}
                </>
              ),
            })}
          </button>
        </div>
      </div>
      <div className="tw-mt-2 tw-flex tw-flex-wrap tw-items-center tw-justify-end tw-gap-2">
        <button
          onClick={onFinalize}
          disabled={isFinalizing}
          type="button"
          className="tw-group tw-flex tw-h-9 tw-items-center tw-justify-center tw-rounded-full tw-border-none tw-bg-[#86efac] tw-px-3 tw-text-sm tw-font-medium tw-text-iron-900 tw-ring-1 tw-ring-inset tw-ring-[#86efac]/20 tw-transition tw-duration-300 tw-ease-out hover:tw-bg-[#14532d] hover:tw-text-iron-100"
        >
          {renderStableButtonContent({
            isLoading: isFinalizing,
            loadingContent: (
              <span className="tw-flex tw-items-center tw-gap-2">
                <CircleLoader />
                <span>Finalizing</span>
              </span>
            ),
            idleContent: (
              <>
                Finalize Distribution
                {isLoadingOverview ? (
                  <span className="tw-ml-2">
                    <CircleLoader />
                  </span>
                ) : (
                  <span className="tw-ml-2">
                    {overview?.is_normalized ? "✅" : "❌"}
                  </span>
                )}
              </>
            ),
          })}
        </button>
        <span
          className="tw-inline-flex"
          title={githubUploadTooltip ?? undefined}
          {...(isUploadingToGithub || !canPublish
            ? { tabIndex: 0, "aria-disabled": true as const }
            : {})}
        >
          <button
            onClick={onUploadToGithub}
            disabled={isUploadingToGithub || !canPublish}
            type="button"
            className="tw-group tw-flex tw-h-9 tw-items-center tw-justify-center tw-gap-2 tw-rounded-full tw-border-none tw-bg-white tw-px-3 tw-text-sm tw-font-medium tw-text-iron-900 tw-ring-1 tw-ring-inset tw-ring-iron-400/20 tw-transition tw-duration-300 tw-ease-out hover:tw-bg-iron-200 hover:tw-text-iron-900 disabled:tw-cursor-not-allowed disabled:tw-opacity-60"
          >
            {renderStableButtonContent({
              isLoading: isUploadingToGithub,
              loadingContent: (
                <span className="tw-flex tw-items-center tw-gap-2">
                  <CircleLoader />
                  <span>Publishing…</span>
                </span>
              ),
              idleContent: (
                <>
                  <Image
                    src="/github.png"
                    alt=""
                    width={18}
                    height={18}
                    unoptimized
                    className="tw-shrink-0"
                  />
                  <span>Publish to GitHub</span>
                </>
              ),
            })}
          </button>
        </span>
      </div>
      <GithubUploadModal
        show={showGithubModal}
        onClose={onCloseGithubModal}
        onRetry={onUploadToGithub}
        isLoading={isUploadingToGithub}
        result={githubUploadResult}
        apiError={githubUploadError}
      />
      {distributionPlan && (
        <>
          {showConfirmTokenId && (
            <ConfirmTokenIdModal
              plan={distributionPlan}
              onConfirm={onConfirmTokenId}
            />
          )}
          {showUploadPhotos && (
            <UploadDistributionPhotosModal
              plan={distributionPlan}
              handleClose={onCloseUploadPhotos}
              existingPhotosCount={overview?.photos_count ?? 0}
              confirmedTokenId={confirmedTokenId}
              onUpload={onUploadPhotos}
            />
          )}
          {showViewPhotos && (
            <DistributionPhotosViewerModal
              confirmedTokenId={confirmedTokenId}
              photos={viewedPhotos}
              isLoading={viewingPhotos}
              error={viewedPhotosError}
              handleClose={onCloseViewPhotos}
            />
          )}
          {showUploadAirdropsPhase !== null && (
            <DistributionPhaseAirdropsModal
              plan={distributionPlan}
              phase={showUploadAirdropsPhase}
              isUploading={uploadingAirdropsPhase === showUploadAirdropsPhase}
              handleClose={onCloseUploadAirdrops}
              confirmedTokenId={confirmedTokenId}
              onUpload={onUploadAirdrops}
            />
          )}
          {showViewAirdropsPhase !== null && (
            <DistributionPhaseAirdropsViewerModal
              phase={showViewAirdropsPhase}
              confirmedTokenId={confirmedTokenId}
              rows={viewedAirdrops}
              isLoading={viewingAirdropsPhase === showViewAirdropsPhase}
              error={viewedAirdropsError}
              handleClose={onCloseViewAirdrops}
            />
          )}
        </>
      )}
    </div>
  );
}
