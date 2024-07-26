import { useState } from "react";
import AllowlistToolCommonModalWrapper, {
  AllowlistToolModalSize,
} from "../../allowlist-tool/common/modals/AllowlistToolCommonModalWrapper";
import CreateDistributionPlan from "./CreateDistributionPlan";
import { useRouter } from "next/router";

export default function DistributionPlanToolCreatePlan() {
  const [isNewPlanModalOpen, setIsNewPlanModalOpen] = useState(false);
  const router = useRouter();
  const onSuccess = (distributionPlanId: string) => {
    router.push(`/emma/plans/${distributionPlanId}`);
  };
  return (
    <>
      <button
        onClick={() => setIsNewPlanModalOpen(true)}
        type="button"
        className="tw-inline-flex tw-items-center tw-gap-x-2 tw-px-4 tw-py-3 tw-bg-primary-500 tw-text-white tw-font-medium tw-text-sm tw-border tw-border-primary-500 tw-rounded-lg hover:tw-bg-primary-600 hover:tw-border-primary-600 tw-transition tw-duration-300 tw-ease-out"
      >
        <svg
          className="tw-h-5 tw-w-5 -tw-ml-1"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 5V19M5 12H19"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Create new
      </button>
      <AllowlistToolCommonModalWrapper
        showModal={isNewPlanModalOpen}
        onClose={() => setIsNewPlanModalOpen(false)}
        title={`Create new Distribution plan`}
        modalSize={AllowlistToolModalSize.X_LARGE}
        showTitle={false}
      >
        <CreateDistributionPlan onSuccess={onSuccess} />
      </AllowlistToolCommonModalWrapper>
    </>
  );
}
