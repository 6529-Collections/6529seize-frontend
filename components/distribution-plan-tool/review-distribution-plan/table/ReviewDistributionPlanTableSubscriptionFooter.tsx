"use client";

import { AuthContext } from "@/components/auth/Auth";
import CircleLoader from "@/components/distribution-plan-tool/common/CircleLoader";
import { DistributionPlanToolContext } from "@/components/distribution-plan-tool/DistributionPlanToolContext";
import { MEMES_CONTRACT } from "@/constants";
import { formatAddress } from "@/helpers/Helpers";
import {
  commonApiFetch,
  commonApiPost,
  commonApiPostForm,
} from "@/services/api/common-api";
import { useCallback, useContext, useEffect, useState } from "react";
import {
  SubscriptionConfirm,
  isSubscriptionsAdmin,
} from "./ReviewDistributionPlanTableSubscription";
import { AutomaticAirdropsModal } from "./ReviewDistributionPlanTableSubscriptionFooterAutomaticAirdrops";
import { ConfirmTokenIdModal } from "./ReviewDistributionPlanTableSubscriptionFooterConfirmTokenId";
import { UploadDistributionPhotosModal } from "./ReviewDistributionPlanTableSubscriptionFooterUploadPhotos";

interface DistributionOverview {
  photos_count: number;
  is_normalized: boolean;
  automatic_airdrops: number;
}

export function ReviewDistributionPlanTableSubscriptionFooter() {
  const { distributionPlan, confirmedTokenId, setConfirmedTokenId } =
    useContext(DistributionPlanToolContext);
  const { connectedProfile, setToast } = useContext(AuthContext);

  const [showSubscriptionsReset, setShowSubscriptionsReset] = useState(false);
  const [showUploadPhotos, setShowUploadPhotos] = useState(false);
  const [showAutomaticAirdrops, setShowAutomaticAirdrops] = useState(false);
  const [showFinalizeDistribution, setShowFinalizeDistribution] =
    useState(false);
  const [showConfirmTokenId, setShowConfirmTokenId] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingAirdrops, setIsUploadingAirdrops] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [overview, setOverview] = useState<DistributionOverview | null>(null);
  const [isLoadingOverview, setIsLoadingOverview] = useState(false);

  const refreshOverview = useCallback(
    async (contract: string, tokenId?: string) => {
      if (!tokenId) {
        return;
      }

      setIsLoadingOverview(true);
      try {
        const data = await commonApiFetch<DistributionOverview>({
          endpoint: `distributions/${contract}/${tokenId}/overview`,
        });
        setOverview(data);
      } catch (error) {
        console.error("Failed to fetch distribution overview:", error);
      } finally {
        setIsLoadingOverview(false);
      }
    },
    []
  );

  useEffect(() => {
    if (!distributionPlan || !isSubscriptionsAdmin(connectedProfile)) {
      return;
    }

    if (!confirmedTokenId) {
      setShowConfirmTokenId(true);
      return;
    }

    const contract = MEMES_CONTRACT;
    refreshOverview(contract, confirmedTokenId);
  }, [distributionPlan, connectedProfile, confirmedTokenId, refreshOverview]);

  const handleConfirmTokenId = (contract: string, tokenId: string) => {
    setConfirmedTokenId(tokenId);
    setShowConfirmTokenId(false);
  };

  const handleChangeTokenId = () => {
    setShowConfirmTokenId(true);
  };

  const resetSubscriptions = async (
    contract: string,
    tokenId: string,
    planId: string
  ) => {
    setShowSubscriptionsReset(false);
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
    } catch (error: any) {
      setToast({
        type: "error",
        message: `Reset failed: ${error}`,
      });
    } finally {
      setIsResetting(false);
    }
  };

  if (!isSubscriptionsAdmin(connectedProfile)) {
    return <></>;
  }

  if (!confirmedTokenId) {
    return (
      <>
        {distributionPlan && (
          <ConfirmTokenIdModal
            plan={distributionPlan}
            show={showConfirmTokenId}
            onConfirm={handleConfirmTokenId}
          />
        )}
      </>
    );
  }

  const contract = MEMES_CONTRACT;

  return (
    <div className="pt-3 pb-3 d-flex flex-column align-items-end gap-2">
      <div className="w-100 d-flex align-items-center justify-content-between gap-2 flex-wrap">
        <span className="tw-text-sm tw-text-iron-400">
          Contract: The Memes - {formatAddress(contract)} | Token ID:{" "}
          {confirmedTokenId}
        </span>
        <div className="d-flex align-items-center gap-2">
          <button
            onClick={handleChangeTokenId}
            type="button"
            className="tw-px-3 tw-group tw-rounded-full tw-group tw-flex tw-items-center tw-justify-center tw-h-8 tw-text-sm tw-font-medium tw-border-none tw-ring-1 tw-ring-inset tw-text-iron-900 tw-bg-white tw-ring-iron-400/20 hover:tw-bg-iron-400/20 hover:tw-text-iron-100 tw-ease-out tw-transition tw-duration-300">
            Change Token ID
          </button>
          <button
            onClick={() => setShowSubscriptionsReset(true)}
            disabled={isResetting}
            type="button"
            className="tw-px-3 tw-group tw-rounded-full tw-group tw-flex tw-items-center tw-justify-center tw-h-8 tw-text-sm tw-font-medium tw-border-none tw-ring-1 tw-ring-inset tw-text-iron-900 tw-bg-[#f87171] tw-ring-[#f87171]/20 hover:tw-bg-[#7f1d1d] hover:tw-text-iron-100 tw-ease-out tw-transition tw-duration-300">
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
      <div className="mt-5 d-flex align-items-center justify-content-end gap-2">
        <button
          onClick={() => setShowAutomaticAirdrops(true)}
          disabled={isUploadingAirdrops}
          type="button"
          className="tw-px-3 tw-group tw-rounded-full tw-group tw-flex tw-items-center tw-justify-center tw-h-8 tw-text-sm tw-font-medium tw-border-none tw-ring-1 tw-ring-inset tw-text-iron-900 tw-bg-white tw-ring-iron-400/20 hover:tw-bg-iron-400/20 hover:tw-text-iron-100 tw-ease-out tw-transition tw-duration-300">
          {isUploadingAirdrops ? (
            <span className="d-flex gap-2 align-items-center">
              <CircleLoader />
              <span>Uploading</span>
            </span>
          ) : (
            <>
              Upload Automatic Airdrops
              {isLoadingOverview ? (
                <span className="tw-ml-2">
                  <CircleLoader />
                </span>
              ) : (
                <span className="tw-ml-2">
                  ({overview?.automatic_airdrops ?? 0})
                </span>
              )}
            </>
          )}
        </button>
        <button
          onClick={() => setShowUploadPhotos(true)}
          disabled={isUploading}
          type="button"
          className="tw-px-3 tw-group tw-rounded-full tw-group tw-flex tw-items-center tw-justify-center tw-h-8 tw-text-sm tw-font-medium tw-border-none tw-ring-1 tw-ring-inset tw-text-iron-900 tw-bg-white tw-ring-iron-400/20 hover:tw-bg-iron-400/20 hover:tw-text-iron-100 tw-ease-out tw-transition tw-duration-300">
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
      <div className="mt-2 d-flex align-items-center justify-content-end gap-2">
        <button
          onClick={() => setShowFinalizeDistribution(true)}
          disabled={isFinalizing}
          type="button"
          className="tw-px-3 tw-group tw-rounded-full tw-group tw-flex tw-items-center tw-justify-center tw-h-8 tw-text-sm tw-font-medium tw-border-none tw-ring-1 tw-ring-inset tw-text-iron-900 tw-bg-[#86efac] tw-ring-[#86efac]/20 hover:tw-bg-[#14532d] hover:tw-text-iron-100 tw-ease-out tw-transition tw-duration-300">
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
      </div>
      {distributionPlan && (
        <>
          <ConfirmTokenIdModal
            plan={distributionPlan}
            show={showConfirmTokenId}
            onConfirm={handleConfirmTokenId}
          />
          <UploadDistributionPhotosModal
            plan={distributionPlan}
            show={showUploadPhotos}
            handleClose={() => setShowUploadPhotos(false)}
            existingPhotosCount={overview?.photos_count ?? 0}
            confirmedTokenId={confirmedTokenId}
            onUpload={async (
              contract: string,
              tokenId: string,
              files: File[]
            ) => {
              setShowUploadPhotos(false);
              setIsUploading(true);
              try {
                const formData = new FormData();
                files.forEach((file) => {
                  formData.append("photos", file);
                });

                const response = await commonApiPostForm<{
                  success: boolean;
                  photos?: string[];
                  error?: string;
                }>({
                  endpoint: `distribution_photos/${contract}/${tokenId}`,
                  body: formData,
                });

                if (response.success && response.photos) {
                  setToast({
                    type: "success",
                    message: `Successfully uploaded ${response.photos.length} photo(s)`,
                  });
                  await refreshOverview(contract, tokenId);
                } else {
                  setToast({
                    type: "error",
                    message: response.error || "Upload failed",
                  });
                }
              } catch (error: any) {
                const errorMessage =
                  typeof error === "string"
                    ? error
                    : error?.message || "Something went wrong.";
                setToast({
                  type: "error",
                  message: errorMessage,
                });
              } finally {
                setIsUploading(false);
              }
            }}
          />
          <AutomaticAirdropsModal
            plan={distributionPlan}
            show={showAutomaticAirdrops}
            handleClose={() => setShowAutomaticAirdrops(false)}
            confirmedTokenId={confirmedTokenId}
            onUpload={async (
              contract: string,
              tokenId: string,
              csvContent: string
            ) => {
              setShowAutomaticAirdrops(false);
              setIsUploadingAirdrops(true);
              try {
                const response = await commonApiPost<
                  { csv: string },
                  {
                    success: boolean;
                    message?: string;
                    error?: string;
                  }
                >({
                  endpoint: `distributions/${contract}/${tokenId}/automatic_airdrops`,
                  body: { csv: csvContent },
                });

                if (response.success) {
                  setToast({
                    type: "success",
                    message:
                      response.message ||
                      "Successfully uploaded automatic airdrops",
                  });
                  await refreshOverview(contract, tokenId);
                } else {
                  setToast({
                    type: "error",
                    message: response.error || "Upload failed",
                  });
                }
              } catch (error: any) {
                const errorMessage =
                  typeof error === "string"
                    ? error
                    : error?.message || "Something went wrong.";
                setToast({
                  type: "error",
                  message: errorMessage,
                });
              } finally {
                setIsUploadingAirdrops(false);
              }
            }}
          />
          <SubscriptionConfirm
            title="Reset Subscriptions"
            plan={distributionPlan}
            show={showSubscriptionsReset}
            handleClose={() => setShowSubscriptionsReset(false)}
            confirmedTokenId={confirmedTokenId}
            onConfirm={(contract: string, tokenId: string) =>
              resetSubscriptions(contract, tokenId, distributionPlan.id)
            }
          />
          <SubscriptionConfirm
            title="Finalize Distribution"
            plan={distributionPlan}
            show={showFinalizeDistribution}
            handleClose={() => setShowFinalizeDistribution(false)}
            isNormalized={overview?.is_normalized ?? false}
            confirmedTokenId={confirmedTokenId}
            onConfirm={async (contract: string, tokenId: string) => {
              setShowFinalizeDistribution(false);
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
                    message:
                      response.message ||
                      "Distribution normalized successfully",
                  });
                  await refreshOverview(contract, tokenId);
                } else {
                  setToast({
                    type: "error",
                    message: response.error || "Normalization failed",
                  });
                }
              } catch (error: any) {
                const errorMessage =
                  typeof error === "string"
                    ? error
                    : error?.message || "Something went wrong.";
                setToast({
                  type: "error",
                  message: errorMessage,
                });
              } finally {
                setIsFinalizing(false);
              }
            }}
          />
        </>
      )}
    </div>
  );
}
