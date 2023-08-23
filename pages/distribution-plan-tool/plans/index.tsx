import { useEffect, useState } from "react";
import { AllowlistDescription } from "../../../components/allowlist-tool/allowlist-tool.types";
import { distributionPlanApiFetch } from "../../../services/distribution-plan-api";
import DistributionPlanToolWrapper from "../../../components/distribution-plan-tool/wrapper/DistributionPlanToolWrapper";
import AllowlistToolCommonModalWrapper, {
  AllowlistToolModalSize,
} from "../../../components/allowlist-tool/common/modals/AllowlistToolCommonModalWrapper";
import CreateDistributionPlan from "../../../components/distribution-plan-tool/create-plan/CreateDistributionPlan";

export default function DistributionPlanToolPlans() {
  useEffect(() => {
    const test = async () => {
      const data = await distributionPlanApiFetch<AllowlistDescription[]>(
        "/allowlists"
      );
      console.log(data);
    };
    test();
  }, []);

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
            <div className="tw-flex tw-justify-center tw-mt-20">
              <div className="tw-text-center">
                <svg
                  className="tw-h-12 tw-w-12 tw-text-neutral-500"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M13 7L11.8845 4.76892C11.5634 4.1268 11.4029 3.80573 11.1634 3.57116C10.9516 3.36373 10.6963 3.20597 10.4161 3.10931C10.0992 3 9.74021 3 9.02229 3H5.2C4.0799 3 3.51984 3 3.09202 3.21799C2.71569 3.40973 2.40973 3.71569 2.21799 4.09202C2 4.51984 2 5.0799 2 6.2V7M2 7H17.2C18.8802 7 19.7202 7 20.362 7.32698C20.9265 7.6146 21.3854 8.07354 21.673 8.63803C22 9.27976 22 10.1198 22 11.8V16.2C22 17.8802 22 18.7202 21.673 19.362C21.3854 19.9265 20.9265 20.3854 20.362 20.673C19.7202 21 18.8802 21 17.2 21H6.8C5.11984 21 4.27976 21 3.63803 20.673C3.07354 20.3854 2.6146 19.9265 2.32698 19.362C2 18.7202 2 17.8802 2 16.2V7ZM12 17V11M9 14H15"
                    stroke="currentColor"
                    strokeWidth="1"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <p className="tw-mt-2 tw-text-lg tw-text-neutral-50 tw-font-medium tw-mb-0">
                  No plan
                </p>
                <p className="tw-mt-2 tw-text-sm tw-font-light tw-text-neutral-400 tw-mb-0">
                  Get started by creating a new distribution plan.
                </p>
              </div>
            </div>
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
