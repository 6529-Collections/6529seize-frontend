"use client";

import AllowlistToolLoader from "@/components/allowlist-tool/common/AllowlistToolLoader";
import { distributionPlanApiPost } from "@/services/distribution-plan-api";
import { useContext, useState } from "react";
import { DistributionPlanToolContext } from "../../DistributionPlanToolContext";

type CreateSnapshotTableRowRetryProps = Readonly<{
  allowlistId: string;
  tokenPoolId: string;
  refreshDownloads: () => Promise<void>;
}>;

export default function CreateSnapshotTableRowRetry({
  allowlistId,
  tokenPoolId,
  refreshDownloads,
}: CreateSnapshotTableRowRetryProps) {
  const { setToasts } = useContext(DistributionPlanToolContext);
  const [loading, setLoading] = useState(false);

  const onRetry = async () => {
    setLoading(true);
    const endpoint = `/allowlists/${allowlistId}/token-pool-downloads/token-pool/${tokenPoolId}/retry`;
    const { success } = await distributionPlanApiPost({
      endpoint,
      body: {},
    });
    if (success) {
      setToasts({
        messages: ["Snapshot retry started"],
        type: "success",
      });
      await refreshDownloads();
    }
    setLoading(false);
  };

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        void onRetry();
      }}
      disabled={loading}
      type="button"
      title="Retry"
      className="tw-group tw-rounded-full tw-border-none tw-bg-primary-400/10 tw-p-2 tw-text-xs tw-font-medium tw-text-primary-300 tw-ring-1 tw-ring-inset tw-ring-primary-400/20"
    >
      {loading ? (
        <AllowlistToolLoader />
      ) : (
        <svg
          className="tw-h-4 tw-w-4 tw-transition tw-duration-300 tw-ease-out group-hover:tw-text-white"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M3 12A9 9 0 1 0 6.64 4.86M3 4V10H9"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>
  );
}
