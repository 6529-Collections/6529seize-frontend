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
import { formatAddress } from "@/helpers/Helpers";
import { commonApiFetch, commonApiPost } from "@/services/api/common-api";
import { getAuthJwt, getStagingAuth } from "@/services/auth/auth.utils";
import { uploadDistributionPhotos } from "@/services/distribution/distributionPhotoUpload";
import { faDownload } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Image from "next/image";
import {
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
import {
  GithubUploadModal,
  type GithubUploadResult,
} from "./ReviewDistributionPlanTableSubscriptionFooterGithubUploadModal";
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
  downloadingAirdropsPhase,
  isFinalizing,
  isUploadingToGithub,
  showGithubModal,
  githubUploadResult,
  githubUploadError,
  showConfirmTokenId,
  showUploadPhotos,
  showAirdropsPhase,
  canPublish,
  githubUploadTooltip,
  onConfirmTokenId,
  onChangeTokenId,
  onResetSubscriptions,
  onShowAirdrops,
  onDownloadAirdrops,
  onShowUploadPhotos,
  onFinalize,
  onUploadToGithub,
  onCloseGithubModal,
  onUploadPhotos,
  onUploadAirdrops,
  onCloseUploadPhotos,
  onCloseAirdrops,
}: Readonly<{
  contract: string;
  confirmedTokenId: string;
  distributionPlan: AllowlistDescription | null;
  overview: DistributionOverview | null;
  isLoadingOverview: boolean;
  isResetting: boolean;
  isUploading: boolean;
  uploadingAirdropsPhase: DistributionAirdropsPhase | null;
  downloadingAirdropsPhase: DistributionAirdropsPhase | null;
  isFinalizing: boolean;
  isUploadingToGithub: boolean;
  showGithubModal: boolean;
  githubUploadResult: GithubUploadResult | null;
  githubUploadError: string | null;
  showConfirmTokenId: boolean;
  showUploadPhotos: boolean;
  showAirdropsPhase: DistributionAirdropsPhase | null;
  canPublish: boolean;
  githubUploadTooltip: string | null;
  onConfirmTokenId: (tokenId: string) => void;
  onChangeTokenId: () => void;
  onResetSubscriptions: () => void;
  onShowAirdrops: (phase: DistributionAirdropsPhase) => void;
  onDownloadAirdrops: (phase: DistributionAirdropsPhase) => void;
  onShowUploadPhotos: () => void;
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
  onCloseAirdrops: () => void;
}>) {
  const renderAirdropsButtonGroup = (phase: DistributionAirdropsPhase) => {
    const phaseLabel = phase === "artist" ? "Artist" : "Team";
    const isUploadingThisPhase = uploadingAirdropsPhase === phase;
    const isDownloadingThisPhase = downloadingAirdropsPhase === phase;
    const isDownloadDisabled =
      isLoadingOverview ||
      downloadingAirdropsPhase !== null ||
      getAirdropsCount(overview, phase) === 0;

    return (
      <div
        key={phase}
        className="tw-flex tw-h-8 tw-overflow-hidden tw-rounded-full tw-ring-1 tw-ring-inset tw-ring-iron-400/20"
      >
        <button
          onClick={() => onShowAirdrops(phase)}
          disabled={uploadingAirdropsPhase !== null}
          type="button"
          className="tw-group tw-flex tw-h-8 tw-items-center tw-justify-center tw-border-none tw-bg-white tw-px-3 tw-text-sm tw-font-medium tw-text-iron-900 tw-transition tw-duration-300 tw-ease-out enabled:hover:tw-bg-iron-400/20 enabled:hover:tw-text-iron-100 disabled:tw-cursor-not-allowed disabled:tw-opacity-60"
        >
          {isUploadingThisPhase ? (
            <span className="d-flex gap-2 align-items-center">
              <CircleLoader />
              <span>Uploading</span>
            </span>
          ) : (
            <>
              Upload {phaseLabel} Airdrops
              {isLoadingOverview ? (
                <span className="tw-ml-2">
                  <CircleLoader />
                </span>
              ) : (
                <span className="tw-ml-2">
                  (Addresses: {getAirdropsAddresses(overview, phase)} | Count:{" "}
                  {getAirdropsCount(overview, phase)})
                </span>
              )}
            </>
          )}
        </button>
        <button
          onClick={() => onDownloadAirdrops(phase)}
          disabled={isDownloadDisabled}
          aria-label={`Download ${phaseLabel} Airdrops CSV`}
          title={`Download ${phaseLabel} Airdrops CSV`}
          type="button"
          className="tw-group tw-flex tw-h-8 tw-w-8 tw-items-center tw-justify-center tw-border-0 tw-border-l tw-border-solid tw-border-l-iron-500/40 tw-bg-white tw-text-sm tw-font-medium tw-text-iron-900 tw-transition tw-duration-300 tw-ease-out enabled:hover:tw-bg-iron-400/20 enabled:hover:tw-text-iron-100 disabled:tw-cursor-not-allowed disabled:tw-opacity-60"
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
        <button
          onClick={onShowUploadPhotos}
          disabled={isUploading}
          type="button"
          className="tw-group tw-flex tw-h-8 tw-items-center tw-justify-center tw-rounded-full tw-border-none tw-bg-white tw-px-3 tw-text-sm tw-font-medium tw-text-iron-900 tw-ring-1 tw-ring-inset tw-ring-iron-400/20 tw-transition tw-duration-300 tw-ease-out hover:tw-bg-iron-400/20 hover:tw-text-iron-100"
        >
          {isUploading ? (
            <span className="d-flex gap-2 align-items-center">
              <CircleLoader />
              <span>Uploading</span>
            </span>
          ) : (
            <>
              Upload Distribution Photos
              {isLoadingOverview ? (
                <span className="tw-ml-2">
                  <CircleLoader />
                </span>
              ) : (
                <span className="tw-ml-2">({overview?.photos_count ?? 0})</span>
              )}
            </>
          )}
        </button>
      </div>
      <div className="mt-2 d-flex align-items-center justify-content-end gap-2 flex-wrap">
        <button
          onClick={onFinalize}
          disabled={isFinalizing}
          type="button"
          className="tw-group tw-flex tw-h-8 tw-items-center tw-justify-center tw-rounded-full tw-border-none tw-bg-[#86efac] tw-px-3 tw-text-sm tw-font-medium tw-text-iron-900 tw-ring-1 tw-ring-inset tw-ring-[#86efac]/20 tw-transition tw-duration-300 tw-ease-out hover:tw-bg-[#14532d] hover:tw-text-iron-100"
        >
          {isFinalizing ? (
            <span className="d-flex gap-2 align-items-center">
              <CircleLoader />
              <span>Finalizing</span>
            </span>
          ) : (
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
          )}
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
            className="tw-group tw-flex tw-h-8 tw-items-center tw-justify-center tw-gap-2 tw-rounded-full tw-border-none tw-bg-white tw-px-3 tw-text-sm tw-font-medium tw-text-iron-900 tw-ring-1 tw-ring-inset tw-ring-iron-400/20 tw-transition tw-duration-300 tw-ease-out hover:tw-bg-iron-200 hover:tw-text-iron-900 disabled:tw-cursor-not-allowed disabled:tw-opacity-60"
          >
            {isUploadingToGithub ? (
              <span className="d-flex gap-2 align-items-center">
                <CircleLoader />
                <span>Publishing…</span>
              </span>
            ) : (
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
            )}
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
          {showAirdropsPhase !== null && (
            <DistributionPhaseAirdropsModal
              plan={distributionPlan}
              phase={showAirdropsPhase}
              isUploading={uploadingAirdropsPhase === showAirdropsPhase}
              handleClose={onCloseAirdrops}
              confirmedTokenId={confirmedTokenId}
              onUpload={onUploadAirdrops}
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
  const [showAirdropsPhase, setShowAirdropsPhase] =
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
  const [downloadingAirdropsPhase, setDownloadingAirdropsPhase] =
    useState<DistributionAirdropsPhase | null>(null);

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
  const isDownloadingAirdropsRef = useRef(false);
  const overviewRequestIdRef = useRef(0);
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
      if (isDownloadingAirdropsRef.current) {
        return;
      }

      isDownloadingAirdropsRef.current = true;
      setDownloadingAirdropsPhase(phase);
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
        isDownloadingAirdropsRef.current = false;
        setDownloadingAirdropsPhase(null);
      }
    },
    [buildAirdropsDownloadHeaders, downloadAirdropsCsv]
  );

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
      downloadingAirdropsPhase={downloadingAirdropsPhase}
      isFinalizing={isFinalizing}
      isUploadingToGithub={isUploadingToGithub}
      showGithubModal={showGithubModal}
      githubUploadResult={githubUploadResult}
      githubUploadError={githubUploadError}
      showConfirmTokenId={showConfirmTokenId}
      showUploadPhotos={showUploadPhotos}
      showAirdropsPhase={showAirdropsPhase}
      canPublish={canPublishToGithub(overview)}
      githubUploadTooltip={githubUploadTooltip}
      onConfirmTokenId={handleConfirmTokenId}
      onChangeTokenId={handleChangeTokenId}
      onResetSubscriptions={handleResetSubscriptions}
      onShowAirdrops={setShowAirdropsPhase}
      onDownloadAirdrops={(phase) =>
        handleDownloadAirdrops(contract, confirmedTokenId, phase)
      }
      onShowUploadPhotos={() => setShowUploadPhotos(true)}
      onFinalize={() => finalizeDistribution(contract, confirmedTokenId)}
      onUploadToGithub={() => uploadToGithub(contract, confirmedTokenId)}
      onCloseGithubModal={() => setShowGithubModal(false)}
      onUploadPhotos={handleUploadPhotos}
      onUploadAirdrops={handleUploadAirdrops}
      onCloseUploadPhotos={() => setShowUploadPhotos(false)}
      onCloseAirdrops={() => setShowAirdropsPhase(null)}
    />
  );
}
