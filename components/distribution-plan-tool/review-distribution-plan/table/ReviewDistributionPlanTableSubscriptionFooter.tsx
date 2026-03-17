"use client";

import type { AllowlistDescription } from "@/components/allowlist-tool/allowlist-tool.types";
import { AuthContext } from "@/components/auth/Auth";
import CircleLoader from "@/components/distribution-plan-tool/common/CircleLoader";
import { DistributionPlanToolContext } from "@/components/distribution-plan-tool/DistributionPlanToolContext";
import { publicEnv } from "@/config/env";
import { MEMES_CONTRACT } from "@/constants/constants";
import { useSeizeSettings } from "@/contexts/SeizeSettingsContext";
import { ApiDistributionAirdropsCsvUploadRequest } from "@/generated/models/ApiDistributionAirdropsCsvUploadRequest";
import { ApiDistributionAirdropsUploadResponse } from "@/generated/models/ApiDistributionAirdropsUploadResponse";
import { DistributionOverview } from "@/generated/models/DistributionOverview";
import { DistributionPhoto } from "@/generated/models/DistributionPhoto";
import { PhaseAirdrop } from "@/generated/models/PhaseAirdrop";
import { formatAddress } from "@/helpers/Helpers";
import { fetchAllPages } from "@/services/6529api";
import { commonApiFetch, commonApiPost } from "@/services/api/common-api";
import { getAuthJwt, getStagingAuth } from "@/services/auth/auth.utils";
import { uploadDistributionPhotos } from "@/services/distribution/distributionPhotoUpload";
import { faDownload, faUpload } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Image from "next/image";
import {
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import useDownloader from "react-use-downloader";
import { isSubscriptionsAdmin } from "./ReviewDistributionPlanTableSubscription";
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

function getErrorMessage(error: unknown): string {
  if (typeof error === "string") {
    return error;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Something went wrong.";
}

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

function getGithubUploadTooltip(
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

function canPublishToGithub(overview: DistributionOverview | null): boolean {
  return (
    overview?.is_normalized === true &&
    (overview?.photos_count ?? 0) > 0 &&
    getTotalAirdropsCount(overview) > 0
  );
}

function SubscriptionFooterMain({
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
            <span className="d-flex align-items-center justify-content-center">
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
              <span className="d-flex gap-2 align-items-center">
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
            <span className="d-flex align-items-center justify-content-center">
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
    <div className="pt-3 pb-3 d-flex flex-column align-items-end gap-2">
      <div className="w-100 d-flex align-items-center justify-content-between gap-2 flex-wrap">
        <span className="tw-text-sm tw-text-iron-400">
          Contract: The Memes - {formatAddress(contract)} | Token ID:{" "}
          {confirmedTokenId}
        </span>
        <div className="d-flex align-items-center gap-2">
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
              <span className="d-flex gap-2 align-items-center">
                <CircleLoader />
                <span>Resetting</span>
              </span>
            ) : (
              <>Reset Subscriptions</>
            )}
          </button>
        </div>
      </div>
      <div className="mt-5 d-flex align-items-center justify-content-end gap-2 flex-wrap">
        {renderAirdropsButtonGroup("artist")}
        {renderAirdropsButtonGroup("team")}
      </div>
      <div className="mt-2 d-flex align-items-center justify-content-end gap-2 flex-wrap">
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
              <span className="d-flex align-items-center justify-content-center">
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
                <span className="d-flex gap-2 align-items-center">
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
      <div className="mt-2 d-flex align-items-center justify-content-end gap-2 flex-wrap">
        <button
          onClick={onFinalize}
          disabled={isFinalizing}
          type="button"
          className="tw-group tw-flex tw-h-9 tw-items-center tw-justify-center tw-rounded-full tw-border-none tw-bg-[#86efac] tw-px-3 tw-text-sm tw-font-medium tw-text-iron-900 tw-ring-1 tw-ring-inset tw-ring-[#86efac]/20 tw-transition tw-duration-300 tw-ease-out hover:tw-bg-[#14532d] hover:tw-text-iron-100"
        >
          {renderStableButtonContent({
            isLoading: isFinalizing,
            loadingContent: (
              <span className="d-flex gap-2 align-items-center">
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
                <span className="d-flex gap-2 align-items-center">
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

export function ReviewDistributionPlanTableSubscriptionFooter() {
  const { distributionPlan, confirmedTokenId, setConfirmedTokenId } =
    useContext(DistributionPlanToolContext);
  const { connectedProfile, setToast } = useContext(AuthContext);
  const { seizeSettings } = useSeizeSettings();
  const distributionAdminWallets = useMemo(
    () =>
      Array.isArray(seizeSettings.distribution_admin_wallets)
        ? seizeSettings.distribution_admin_wallets
        : [],
    [seizeSettings.distribution_admin_wallets]
  );

  const [showUploadPhotos, setShowUploadPhotos] = useState(false);
  const [showViewPhotos, setShowViewPhotos] = useState(false);
  const [showUploadAirdropsPhase, setShowUploadAirdropsPhase] =
    useState<DistributionAirdropsPhase | null>(null);
  const [showViewAirdropsPhase, setShowViewAirdropsPhase] =
    useState<DistributionAirdropsPhase | null>(null);
  const [showConfirmTokenId, setShowConfirmTokenId] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadingAirdropsPhase, setUploadingAirdropsPhase] =
    useState<DistributionAirdropsPhase | null>(null);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [isUploadingToGithub, setIsUploadingToGithub] = useState(false);
  const [showGithubModal, setShowGithubModal] = useState(false);
  const [githubUploadResult, setGithubUploadResult] =
    useState<GithubUploadResult | null>(null);
  const [githubUploadError, setGithubUploadError] = useState<string | null>(
    null
  );
  const [overview, setOverview] = useState<DistributionOverview | null>(null);
  const [isLoadingOverview, setIsLoadingOverview] = useState(false);
  const [viewingPhotos, setViewingPhotos] = useState(false);
  const [viewedPhotos, setViewedPhotos] = useState<DistributionPhoto[]>([]);
  const [viewedPhotosError, setViewedPhotosError] = useState<string | null>(
    null
  );
  const [downloadingAirdropsPhases, setDownloadingAirdropsPhases] = useState<
    Record<DistributionAirdropsPhase, boolean>
  >({
    artist: false,
    team: false,
  });
  const [viewingAirdropsPhase, setViewingAirdropsPhase] =
    useState<DistributionAirdropsPhase | null>(null);
  const [viewedAirdrops, setViewedAirdrops] = useState<PhaseAirdrop[]>([]);
  const [viewedAirdropsError, setViewedAirdropsError] = useState<string | null>(
    null
  );

  const buildAirdropsDownloadHeaders = useCallback(() => {
    const headers: Record<string, string> = {
      Accept: "text/csv",
    };
    const apiAuth = getStagingAuth();
    const walletAuth = getAuthJwt();

    if (apiAuth) {
      headers["x-6529-auth"] = apiAuth;
    }
    if (walletAuth) {
      headers["Authorization"] = `Bearer ${walletAuth}`;
    }

    return headers;
  }, []);

  const { download: downloadAirdropsCsv, error: airdropsDownloadError } =
    useDownloader();
  const overviewRequestIdRef = useRef(0);
  const photosViewerRequestIdRef = useRef(0);
  const airdropsViewerRequestIdRef = useRef(0);
  const githubUploadTooltip = getGithubUploadTooltip(overview);

  const clearOverviewState = useCallback(() => {
    overviewRequestIdRef.current += 1;
    setOverview(null);
    setIsLoadingOverview(false);
  }, []);

  const refreshOverview = useCallback(
    async (contract: string, tokenId?: string) => {
      if (!tokenId) {
        clearOverviewState();
        return;
      }

      const requestId = overviewRequestIdRef.current + 1;
      overviewRequestIdRef.current = requestId;
      setOverview(null);
      setIsLoadingOverview(true);
      try {
        const data = await commonApiFetch<DistributionOverview>({
          endpoint: `distributions/${contract}/${tokenId}/overview`,
        });
        if (overviewRequestIdRef.current !== requestId) {
          return;
        }
        setOverview(data);
      } catch (error) {
        console.error("Failed to fetch distribution overview:", error);
      } finally {
        if (overviewRequestIdRef.current === requestId) {
          setIsLoadingOverview(false);
        }
      }
    },
    [clearOverviewState]
  );

  useEffect(() => {
    if (
      !distributionPlan ||
      !isSubscriptionsAdmin(connectedProfile, distributionAdminWallets)
    ) {
      return;
    }

    if (!confirmedTokenId) {
      setShowConfirmTokenId(true);
      return;
    }

    refreshOverview(MEMES_CONTRACT, confirmedTokenId);
  }, [
    confirmedTokenId,
    connectedProfile,
    distributionAdminWallets,
    distributionPlan,
    refreshOverview,
  ]);

  useEffect(() => {
    if (!airdropsDownloadError?.errorMessage) {
      return;
    }

    setToast({
      type: "error",
      message: airdropsDownloadError.errorMessage,
    });
  }, [airdropsDownloadError, setToast]);

  const handleConfirmTokenId = (tokenId: string) => {
    clearOverviewState();
    setConfirmedTokenId(tokenId);
    setShowConfirmTokenId(false);
  };

  const handleChangeTokenId = () => {
    clearOverviewState();
    setConfirmedTokenId(null);
    setShowConfirmTokenId(true);
  };

  const resetSubscriptions = async (
    contract: string,
    tokenId: string,
    planId: string
  ) => {
    setIsResetting(true);
    try {
      await commonApiPost({
        endpoint: `subscriptions/allowlists/${contract}/${tokenId}/${planId}/reset`,
        body: {},
      });
      setToast({
        type: "success",
        message: "Subscriptions reset successfully.",
      });
      await refreshOverview(contract, tokenId);
    } catch (error: unknown) {
      setToast({
        type: "error",
        message: `Reset failed: ${getErrorMessage(error)}`,
      });
    } finally {
      setIsResetting(false);
    }
  };

  const finalizeDistribution = async (contract: string, tokenId: string) => {
    setIsFinalizing(true);
    try {
      const response = await commonApiPost<
        Record<string, never>,
        {
          success: boolean;
          message?: string;
          error?: string;
        }
      >({
        endpoint: `distributions/${contract}/${tokenId}/normalize`,
        body: {},
      });

      if (response.success) {
        setToast({
          type: "success",
          message: response.message || "Distribution normalized successfully",
        });
        await refreshOverview(contract, tokenId);
      } else {
        setToast({
          type: "error",
          message: response.error || "Normalization failed",
        });
      }
    } catch (error: unknown) {
      setToast({
        type: "error",
        message: getErrorMessage(error),
      });
    } finally {
      setIsFinalizing(false);
    }
  };

  const uploadToGithub = async (contract: string, tokenId: string) => {
    setShowGithubModal(true);
    setGithubUploadResult(null);
    setGithubUploadError(null);
    setIsUploadingToGithub(true);
    try {
      const response = await commonApiPost<
        Record<string, never>,
        GithubUploadResult
      >({
        endpoint: `distributions/${contract}/${tokenId}/github-upload`,
        body: {},
      });
      setGithubUploadResult(response);
    } catch (error: unknown) {
      setGithubUploadError(getErrorMessage(error));
    } finally {
      setIsUploadingToGithub(false);
    }
  };

  const handleUploadPhotos = useCallback(
    async (contract: string, tokenId: string, files: File[]) => {
      setShowUploadPhotos(false);
      setIsUploading(true);
      try {
        const uploadedUrls = await uploadDistributionPhotos({
          contract,
          tokenId,
          files,
        });
        setToast({
          type: "success",
          message: `Successfully uploaded ${uploadedUrls.length} photo(s)`,
        });
        await refreshOverview(contract, tokenId);
      } catch (error: unknown) {
        setToast({ type: "error", message: getErrorMessage(error) });
      } finally {
        setIsUploading(false);
      }
    },
    [refreshOverview, setToast]
  );

  const handleShowViewPhotos = useCallback(
    async (contract: string, tokenId: string) => {
      const requestId = photosViewerRequestIdRef.current + 1;
      photosViewerRequestIdRef.current = requestId;
      setShowViewPhotos(true);
      setViewingPhotos(true);
      setViewedPhotos([]);
      setViewedPhotosError(null);

      try {
        const data = await fetchAllPages<DistributionPhoto>(
          `${publicEnv.API_ENDPOINT}/api/distribution_photos/${contract}/${tokenId}`
        );
        if (photosViewerRequestIdRef.current !== requestId) {
          return;
        }
        setViewedPhotos(data);
      } catch (error: unknown) {
        if (photosViewerRequestIdRef.current !== requestId) {
          return;
        }
        setViewedPhotosError(getErrorMessage(error));
      } finally {
        if (photosViewerRequestIdRef.current === requestId) {
          setViewingPhotos(false);
        }
      }
    },
    []
  );

  const handleCloseViewPhotos = useCallback(() => {
    photosViewerRequestIdRef.current += 1;
    setShowViewPhotos(false);
    setViewingPhotos(false);
    setViewedPhotos([]);
    setViewedPhotosError(null);
  }, []);

  const handleUploadAirdrops = useCallback(
    async (
      contract: string,
      tokenId: string,
      phase: DistributionAirdropsPhase,
      csvContent: string
    ): Promise<boolean> => {
      setUploadingAirdropsPhase(phase);
      try {
        const response = await commonApiPost<
          ApiDistributionAirdropsCsvUploadRequest,
          ApiDistributionAirdropsUploadResponse & {
            error?: string | undefined;
          }
        >({
          endpoint: `distributions/${contract}/${tokenId}/${phase}-airdrops`,
          body: { csv: csvContent },
        });

        if (response.success) {
          setToast({
            type: "success",
            message:
              response.message || `Successfully uploaded ${phase} airdrops`,
          });
          await refreshOverview(contract, tokenId);
          return true;
        }

        setToast({
          type: "error",
          message: response.error || "Upload failed",
        });
      } catch (error: unknown) {
        setToast({
          type: "error",
          message: getErrorMessage(error),
        });
      } finally {
        setUploadingAirdropsPhase(null);
      }

      return false;
    },
    [refreshOverview, setToast]
  );

  const handleDownloadAirdrops = useCallback(
    async (
      contract: string,
      tokenId: string,
      phase: DistributionAirdropsPhase
    ) => {
      setDownloadingAirdropsPhases((current) => ({
        ...current,
        [phase]: true,
      }));
      try {
        await downloadAirdropsCsv(
          `${publicEnv.API_ENDPOINT}/api/distributions/${contract}/${tokenId}/${phase}-airdrops`,
          `${phase}_airdrops_${tokenId}.csv`,
          undefined,
          {
            headers: buildAirdropsDownloadHeaders(),
          }
        );
      } finally {
        setDownloadingAirdropsPhases((current) => ({
          ...current,
          [phase]: false,
        }));
      }
    },
    [buildAirdropsDownloadHeaders, downloadAirdropsCsv]
  );

  const handleShowViewAirdrops = useCallback(
    async (
      contract: string,
      tokenId: string,
      phase: DistributionAirdropsPhase
    ) => {
      const requestId = airdropsViewerRequestIdRef.current + 1;
      airdropsViewerRequestIdRef.current = requestId;
      setShowViewAirdropsPhase(phase);
      setViewingAirdropsPhase(phase);
      setViewedAirdrops([]);
      setViewedAirdropsError(null);

      try {
        const data = await commonApiFetch<PhaseAirdrop[]>({
          endpoint: `distributions/${contract}/${tokenId}/${phase}-airdrops`,
        });
        if (airdropsViewerRequestIdRef.current !== requestId) {
          return;
        }
        setViewedAirdrops(data);
      } catch (error: unknown) {
        if (airdropsViewerRequestIdRef.current !== requestId) {
          return;
        }
        setViewedAirdropsError(getErrorMessage(error));
      } finally {
        if (airdropsViewerRequestIdRef.current === requestId) {
          setViewingAirdropsPhase(null);
        }
      }
    },
    []
  );

  const handleCloseViewAirdrops = useCallback(() => {
    airdropsViewerRequestIdRef.current += 1;
    setShowViewAirdropsPhase(null);
    setViewingAirdropsPhase(null);
    setViewedAirdrops([]);
    setViewedAirdropsError(null);
  }, []);

  if (!isSubscriptionsAdmin(connectedProfile, distributionAdminWallets)) {
    return <></>;
  }

  if (!confirmedTokenId) {
    return (
      <>
        {distributionPlan && (
          <ConfirmTokenIdModal
            plan={distributionPlan}
            onConfirm={handleConfirmTokenId}
          />
        )}
      </>
    );
  }

  const contract = MEMES_CONTRACT;
  const handleResetSubscriptions = () => {
    if (distributionPlan) {
      resetSubscriptions(contract, confirmedTokenId, distributionPlan.id);
    }
  };

  return (
    <SubscriptionFooterMain
      contract={contract}
      confirmedTokenId={confirmedTokenId}
      distributionPlan={distributionPlan}
      overview={overview}
      isLoadingOverview={isLoadingOverview}
      isResetting={isResetting}
      isUploading={isUploading}
      uploadingAirdropsPhase={uploadingAirdropsPhase}
      downloadingAirdropsPhases={downloadingAirdropsPhases}
      isFinalizing={isFinalizing}
      isUploadingToGithub={isUploadingToGithub}
      showGithubModal={showGithubModal}
      githubUploadResult={githubUploadResult}
      githubUploadError={githubUploadError}
      showConfirmTokenId={showConfirmTokenId}
      showUploadPhotos={showUploadPhotos}
      showViewPhotos={showViewPhotos}
      showUploadAirdropsPhase={showUploadAirdropsPhase}
      showViewAirdropsPhase={showViewAirdropsPhase}
      viewedPhotos={viewedPhotos}
      viewedPhotosError={viewedPhotosError}
      viewedAirdrops={viewedAirdrops}
      viewedAirdropsError={viewedAirdropsError}
      viewingPhotos={viewingPhotos}
      viewingAirdropsPhase={viewingAirdropsPhase}
      canPublish={canPublishToGithub(overview)}
      githubUploadTooltip={githubUploadTooltip}
      onConfirmTokenId={handleConfirmTokenId}
      onChangeTokenId={handleChangeTokenId}
      onResetSubscriptions={handleResetSubscriptions}
      onShowUploadAirdrops={setShowUploadAirdropsPhase}
      onShowViewAirdrops={(phase) =>
        handleShowViewAirdrops(contract, confirmedTokenId, phase)
      }
      onShowUploadPhotos={() => setShowUploadPhotos(true)}
      onShowViewPhotos={() => handleShowViewPhotos(contract, confirmedTokenId)}
      onDownloadAirdrops={(phase) =>
        handleDownloadAirdrops(contract, confirmedTokenId, phase)
      }
      onFinalize={() => finalizeDistribution(contract, confirmedTokenId)}
      onUploadToGithub={() => uploadToGithub(contract, confirmedTokenId)}
      onCloseGithubModal={() => setShowGithubModal(false)}
      onUploadPhotos={handleUploadPhotos}
      onUploadAirdrops={handleUploadAirdrops}
      onCloseUploadPhotos={() => setShowUploadPhotos(false)}
      onCloseViewPhotos={handleCloseViewPhotos}
      onCloseUploadAirdrops={() => setShowUploadAirdropsPhase(null)}
      onCloseViewAirdrops={handleCloseViewAirdrops}
    />
  );
}
