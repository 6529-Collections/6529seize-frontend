import { useState } from "react";
import DistributionPlanToolWrapper from "../../../components/distribution-plan-tool/wrapper/DistributionPlanToolWrapper";
import AllowlistToolCommonModalWrapper, {
  AllowlistToolModalSize,
} from "../../../components/allowlist-tool/common/modals/AllowlistToolCommonModalWrapper";
import CreateDistributionPlan from "../../../components/distribution-plan-tool/create-plan/CreateDistributionPlan";
import DistributionPlanToolPlans from "../../../components/distribution-plan-tool/plans/DistributionPlanToolPlans";

export default function DistributionPlanToolPlansPage() {
  const [isNewPlanModalOpen, setIsNewPlanModalOpen] = useState(false);

  return (
    <DistributionPlanToolWrapper>
      <div className="tw-flex tw-w-full tw-h-full tw-min-h-screen">
        <div className="tw-text-center tw-pt-8 tw-space-y-8 tw-pb-12 tw-max-w-[65.625rem] min-[1101px]:tw-max-w-[960px] min-[1200px]:tw-max-w-[1150px] tw-min-[1300px]:max-w-[1250px] tw-min-[1400px]:max-w-[1350px] tw-mx-auto tw-px-14">
          <div className="tw-w-full">
            <div className="tw-w-full tw-flex tw-justify-between tw-items-center">
              <h1 className="tw-uppercase">Title</h1>
              <button
                onClick={() => setIsNewPlanModalOpen(true)}
                type="button"
                className="tw-inline-flex tw-items-center tw-gap-x-2 tw-px-4 tw-py-2.5 tw-bg-primary-500 tw-text-white tw-font-medium tw-text-sm tw-border tw-border-primary-500 tw-rounded-lg hover:tw-bg-primary-600 hover:tw-border-primary-600 tw-transition tw-duration-300 tw-ease-out"
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
            </div>
            <DistributionPlanToolPlans />
          </div>
        </div>
      </div>
      <AllowlistToolCommonModalWrapper
        showModal={isNewPlanModalOpen}
        onClose={() => setIsNewPlanModalOpen(false)}
        title={`Create new Distribution plan`}
        modalSize={AllowlistToolModalSize.X_LARGE}
        showTitle={true}
      >
        <CreateDistributionPlan onClose={() => setIsNewPlanModalOpen(false)} />
      </AllowlistToolCommonModalWrapper>
    </DistributionPlanToolWrapper>
  );
}
