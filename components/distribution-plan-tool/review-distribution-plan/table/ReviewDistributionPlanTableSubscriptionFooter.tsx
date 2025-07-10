"use client";

import { useContext, useState } from "react";
import { commonApiPost } from "../../../../services/api/common-api";
import CircleLoader from "../../common/CircleLoader";
import { DistributionPlanToolContext } from "../../DistributionPlanToolContext";
import {
  SubscriptionConfirm,
  download,
  isSubscriptionsAdmin,
} from "./ReviewDistributionPlanTableSubscription";
import { AuthContext } from "../../../auth/Auth";

export function ReviewDistributionPlanTableSubscriptionFooter() {
  const { distributionPlan } = useContext(DistributionPlanToolContext);
  const { connectedProfile, setToast } = useContext(AuthContext);

  const [showSubscriptionsReset, setShowSubscriptionsReset] = useState(false);
  const [showPublicDownload, setShowPublicDownload] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

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

  return (
    <div className="pt-3 pb-3 d-flex align-items-center justify-content-end gap-2">
      <button
        onClick={() => setShowPublicDownload(true)}
        disabled={isDownloading}
        type="button"
        className="tw-group tw-rounded-full tw-group tw-flex tw-items-center tw-justify-center tw-h-8 tw-text-xs tw-font-medium tw-border-none tw-ring-1 tw-ring-inset tw-text-neutral-400 tw-bg-neutral-400/10 tw-ring-neutral-400/20 hover:tw-bg-neutral-400/20 tw-ease-out tw-transition tw-duration-300">
        {isDownloading ? (
          <span className="d-flex gap-2 align-items-center">
            <CircleLoader />
            <span>Downloading</span>
          </span>
        ) : (
          <>Public Subscriptions</>
        )}
      </button>
      <button
        onClick={() => setShowSubscriptionsReset(true)}
        disabled={isResetting}
        type="button"
        className="tw-group tw-rounded-full tw-group tw-flex tw-items-center tw-justify-center tw-h-8 tw-text-xs tw-font-medium tw-border-none tw-ring-1 tw-ring-inset tw-text-neutral-400 tw-bg-neutral-400/10 tw-ring-neutral-400/20 hover:tw-bg-neutral-400/20 tw-ease-out tw-transition tw-duration-300">
        {isResetting ? (
          <span className="d-flex gap-2 align-items-center">
            <CircleLoader />
            <span>Resetting</span>
          </span>
        ) : (
          <>Reset Subscriptions</>
        )}
      </button>
      {distributionPlan && (
        <>
          <SubscriptionConfirm
            title="Reset Subscriptions"
            plan={distributionPlan}
            show={showSubscriptionsReset}
            handleClose={() => setShowSubscriptionsReset(false)}
            onConfirm={(contract: string, tokenId: string) =>
              resetSubscriptions(contract, tokenId, distributionPlan.id)
            }
          />
          <SubscriptionConfirm
            title="Download Public Subscriptions"
            plan={distributionPlan}
            show={showPublicDownload}
            handleClose={() => setShowPublicDownload(false)}
            onConfirm={async (contract: string, tokenId: string) => {
              setShowPublicDownload(false);
              setIsDownloading(true);
              try {
                const downloadResponse = await download(
                  contract,
                  tokenId,
                  distributionPlan.id,
                  "public",
                  "public"
                );
                setToast({
                  type: downloadResponse.success ? "success" : "error",
                  message: downloadResponse.message,
                });
              } catch (error: any) {
                setToast({
                  type: "error",
                  message: "Something went wrong.",
                });
              } finally {
                setIsDownloading(false);
              }
            }}
          />
        </>
      )}
    </div>
  );
}
