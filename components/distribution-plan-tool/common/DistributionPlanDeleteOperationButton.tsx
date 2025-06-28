"use client";

import { useContext, useState } from "react";
import AllowlistToolLoader from "../../allowlist-tool/common/AllowlistToolLoader";
import { DistributionPlanToolContext } from "../DistributionPlanToolContext";
import { distributionPlanApiDelete } from "../../../services/distribution-plan-api";

export default function DistributionPlanDeleteOperationButton({
  allowlistId,
  order,
}: {
  allowlistId: string;
  order: number;
}) {
  const { runOperations } = useContext(DistributionPlanToolContext);
  const [loading, setLoading] = useState<boolean>(false);
  const onDelete = async () => {
    setLoading(true);
    const endpoint = `/allowlists/${allowlistId}/operations/${order}`;
    const { success } = await distributionPlanApiDelete({ endpoint });
    if (success) {
      await runOperations();
    }
    setLoading(false);
  };
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onDelete();
      }}
      disabled={loading}
      type="button"
      title="Delete"
      className="tw-rounded-full tw-group tw-p-2 tw-text-xs tw-font-medium tw-border-none tw-ring-1 tw-ring-inset tw-text-neutral-400 tw-bg-neutral-400/10 tw-ring-neutral-400/20">
      {loading ? (
        <AllowlistToolLoader />
      ) : (
        <svg
          className="tw-h-4 tw-w-4 group-hover:tw-text-error tw-transition tw-duration-300 tw-ease-out"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg">
          <path
            d="M9 3H15M3 6H21M19 6L18.2987 16.5193C18.1935 18.0975 18.1409 18.8867 17.8 19.485C17.4999 20.0118 17.0472 20.4353 16.5017 20.6997C15.882 21 15.0911 21 13.5093 21H10.4907C8.90891 21 8.11803 21 7.49834 20.6997C6.95276 20.4353 6.50009 20.0118 6.19998 19.485C5.85911 18.8867 5.8065 18.0975 5.70129 16.5193L5 6M10 10.5V15.5M14 10.5V15.5"
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
