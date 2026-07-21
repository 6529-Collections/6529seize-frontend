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
import { getToastErrorDetails } from "@/helpers/toast.helpers";
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
import useDownloader from "@/hooks/useDownloader";
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
import { isSubscriptionsAdmin } from "./ReviewDistributionPlanTableSubscription.utils";

function getErrorMessage(error: unknown): string {
  if (typeof error === "string") {
    return error;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Couldn't complete this request. Please try again.";
}

import {
  canPublishToGithub,
  getGithubUploadTooltip,
  SubscriptionFooterMain,
} from "./ReviewDistributionPlanTableSubscriptionFooterMain";
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
      title: "Couldn't download the airdrops CSV.",
      description: "Please try again.",
      details: airdropsDownloadError.errorMessage,
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
        message: "Subscriptions reset.",
      });
      await refreshOverview(contract, tokenId);
    } catch (error: unknown) {
      setToast({
        type: "error",
        title: "Couldn't reset subscriptions.",
        description: "Please try again.",
        details: getToastErrorDetails(error),
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
          title: "Distribution normalized.",
          description: response.message,
        });
        await refreshOverview(contract, tokenId);
      } else {
        setToast({
          type: "error",
          title: "Couldn't normalize this distribution.",
          description: "Please try again.",
          details: response.error,
        });
      }
    } catch (error: unknown) {
      setToast({
        type: "error",
        title: "Couldn't normalize this distribution.",
        description: "Please try again.",
        details: getToastErrorDetails(error),
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
          title: "Photos uploaded.",
          description: `${uploadedUrls.length} photo${
            uploadedUrls.length === 1 ? "" : "s"
          } uploaded.`,
        });
        await refreshOverview(contract, tokenId);
      } catch (error: unknown) {
        setToast({
          type: "error",
          title: "Couldn't upload these photos.",
          description: "Please try again.",
          details: getToastErrorDetails(error),
        });
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
            title: `${phase} airdrops uploaded.`,
            description: response.message,
          });
          await refreshOverview(contract, tokenId);
          return true;
        }

        setToast({
          type: "error",
          title: `Couldn't upload ${phase} airdrops.`,
          description: "Please check the CSV and try again.",
          details: response.error,
        });
      } catch (error: unknown) {
        setToast({
          type: "error",
          title: `Couldn't upload ${phase} airdrops.`,
          description: "Please check the CSV and try again.",
          details: getToastErrorDetails(error),
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
