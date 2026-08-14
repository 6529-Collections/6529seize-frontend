"use client";

import { useState } from "react";
import AllowlistToolCommonModalWrapper, {
  AllowlistToolModalSize,
} from "@/components/allowlist-tool/common/modals/AllowlistToolCommonModalWrapper";
import Button from "@/components/utils/button/Button";
import CreateDistributionPlan from "./CreateDistributionPlan";
import { useRouter } from "next/navigation";

export default function DistributionPlanToolCreatePlan() {
  const [isNewPlanModalOpen, setIsNewPlanModalOpen] = useState(false);
  const router = useRouter();
  const onSuccess = (distributionPlanId: string) => {
    router.push(`/emma/plans/${distributionPlanId}`);
  };
  return (
    <>
      <Button
        onClick={() => setIsNewPlanModalOpen(true)}
        type="button"
        variant="action"
        size="md"
      >
        <svg
          className="tw-size-5 tw-flex-shrink-0"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
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
      </Button>
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
