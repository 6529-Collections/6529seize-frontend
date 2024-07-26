import { useRouter } from "next/router";
import { AllowlistDescription } from "../../allowlist-tool/allowlist-tool.types";
import { get } from "http";
import { useState } from "react";
import AllowlistToolLoader from "../../allowlist-tool/common/AllowlistToolLoader";
import { distributionPlanApiDelete } from "../../../services/distribution-plan-api";

export default function DistributionPlanToolPlansTableItem({
  plan,
  onDeleted,
}: {
  plan: AllowlistDescription;
  onDeleted: (id: string) => void;
}) {
  const router = useRouter();
  const goToDistributionPlan = (id: string) => {
    router.push(`/emma/plans/${id}`);
  };

  const getDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear().toString().slice(-2);
    return `${day}/${month}/${year}`;
  };
  const date = getDate(plan.createdAt);

  const [loadingDelete, setLoadingDelete] = useState<boolean>(false);
  const onDelete = async () => {
    setLoadingDelete(true);
    const endpoint = `/allowlists/${plan.id}`;
    const { success } = await distributionPlanApiDelete({ endpoint });
    if (success) {
      onDeleted(plan.id);
      return;
    }
    setLoadingDelete(false);
  };

  return (
    <tr
      onClick={() => goToDistributionPlan(plan.id)}
      className="tw-cursor-pointer hover:tw-bg-neutral-800/60 tw-transition tw-duration-300 tw-ease-out"
    >
      <td className="tw-whitespace-nowrap tw-px-3 tw-py-4 tw-text-xs tw-font-normal tw-text-neutral-300 sm:tw-pl-6">
        {plan.name}
      </td>
      <td className="tw-whitespace-nowrap tw-px-3 tw-py-4 tw-text-xs tw-font-normal tw-text-neutral-300">
        {plan.description}
      </td>
      <td className="tw-whitespace-nowrap tw-px-3 tw-py-4 tw-text-xs tw-font-normal tw-text-neutral-300">
        {date}
      </td>
      <td className="tw-whitespace-nowrap tw-px-3 tw-py-4 tw-text-xs tw-text-right tw-font-normal tw-text-neutral-300 sm:tw-pr-6">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          disabled={loadingDelete}
          type="button"
          title="Delete"
          className="tw-rounded-full tw-group tw-p-2 tw-text-xs tw-font-medium tw-border-none tw-ring-1 tw-ring-inset tw-text-neutral-400 tw-bg-neutral-400/10 tw-ring-neutral-400/20"
        >
          {loadingDelete ? (
            <AllowlistToolLoader />
          ) : (
            <svg
              className="tw-h-4 tw-w-4 group-hover:tw-text-error tw-transition tw-duration-300 tw-ease-out"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
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
      </td>
    </tr>
  );
}
