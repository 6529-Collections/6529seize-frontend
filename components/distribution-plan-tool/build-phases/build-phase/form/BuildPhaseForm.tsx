"use client";

import AllowlistToolCommonModalWrapper, {
    AllowlistToolModalSize,
} from "@/components/allowlist-tool/common/modals/AllowlistToolCommonModalWrapper";
import { DistributionPlanToolContext } from "@/components/distribution-plan-tool/DistributionPlanToolContext";
import type { BuildPhasesPhase } from "@/components/distribution-plan-tool/build-phases/BuildPhases";
import DistributionPlanAddOperationBtn from "@/components/distribution-plan-tool/common/DistributionPlanAddOperationBtn";
import { TOOLTIP_STYLES } from "@/helpers/tooltip.helpers";
import { useContext, useState } from "react";
import { Tooltip } from "react-tooltip";
import BuildPhaseFormConfigModal from "./BuildPhaseFormConfigModal";

export default function BuildPhaseForm({
  selectedPhase,
  phases,
}: {
  selectedPhase: BuildPhasesPhase;
  phases: BuildPhasesPhase[];
}) {
  const { distributionPlan } = useContext(DistributionPlanToolContext);

  const [formValues, setFormValues] = useState<{
    name: string;
    description: string;
  }>({
    name: "",
    description: "",
  });
  const handleFormChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormValues({
      ...formValues,
      [event.target.name]: event.target.value,
    });
  };

  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!distributionPlan) return;
    setIsConfigModalOpen(true);
  };

  const handleConfigModalClose = () => {
    setFormValues({
      name: "",
      description: "",
    });
    setIsConfigModalOpen(false);
  };
  return (
    <>
      <form
        onSubmit={handleSubmit}
        className="tw-grid tw-w-full tw-grid-cols-1 tw-gap-4 md:tw-grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] md:tw-items-end"
      >
        <div className="tw-min-w-0">
          <div className="tw-flex tw-min-h-8 tw-items-center tw-gap-1 tw-text-sm tw-font-normal tw-leading-5 tw-text-iron-100">
            <label htmlFor="build-phase-group-name">Group Name</label>
            <button
              type="button"
              aria-label="Show a group name example"
              data-tooltip-id="build-phase-form-group-name-tooltip"
              className="tw-flex tw-h-8 tw-w-8 tw-items-center tw-justify-center tw-rounded-full tw-border-0 tw-bg-transparent tw-p-0 tw-text-iron-500 hover:tw-text-iron-300 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
            >
              <svg
                aria-hidden="true"
                className="tw-h-5 tw-w-5"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M12 16V12M12 8H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
          <div className="tw-mt-2">
            <input
              id="build-phase-group-name"
              type="text"
              name="name"
              value={formValues.name}
              onChange={handleFormChange}
              required
              autoComplete="off"
              className="tw-form-input tw-block tw-w-full tw-rounded-lg tw-border-0 tw-py-3 tw-px-3 tw-bg-iron-700/40 tw-text-white tw-font-light tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-700/40 placeholder:tw-text-iron-500  focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 hover:tw-ring-iron-700 tw-text-base sm:tw-leading-6 tw-transition tw-duration-300 tw-ease-out"
            />
          </div>
        </div>
        <div className="tw-min-w-0">
          <div className="tw-flex tw-min-h-8 tw-items-center tw-gap-1 tw-text-sm tw-font-normal tw-leading-5 tw-text-iron-100">
            <label htmlFor="build-phase-description">Description</label>
            <button
              type="button"
              aria-label="Show a group description example"
              data-tooltip-id="build-phase-form-description-tooltip"
              className="tw-flex tw-h-8 tw-w-8 tw-items-center tw-justify-center tw-rounded-full tw-border-0 tw-bg-transparent tw-p-0 tw-text-iron-500 hover:tw-text-iron-300 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
            >
              <svg
                aria-hidden="true"
                className="tw-h-5 tw-w-5"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M12 16V12M12 8H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
          <div className="tw-mt-2">
            <input
              id="build-phase-description"
              type="text"
              name="description"
              required
              value={formValues.description}
              onChange={handleFormChange}
              autoComplete="off"
              className="tw-form-input tw-block tw-w-full tw-rounded-lg tw-border-0 tw-py-3 tw-px-3 tw-bg-iron-700/40 tw-text-white tw-font-light tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-700/40 placeholder:tw-text-iron-500 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 hover:tw-ring-iron-700 tw-text-base sm:tw-leading-6 tw-transition tw-duration-300 tw-ease-out"
            />
          </div>
        </div>
        <div className="tw-w-full md:tw-w-auto">
          <DistributionPlanAddOperationBtn loading={false}>
            Configure group
          </DistributionPlanAddOperationBtn>
        </div>
      </form>
      <Tooltip
        id="build-phase-form-group-name-tooltip"
        content="Example: Memes"
        place="top"
        style={TOOLTIP_STYLES}
      />
      <Tooltip
        id="build-phase-form-description-tooltip"
        content="Example: Top 250 Memes collectors (ranked by Set Size)"
        place="top"
        style={TOOLTIP_STYLES}
      />
      <AllowlistToolCommonModalWrapper
        showModal={isConfigModalOpen}
        onClose={handleConfigModalClose}
        title={`Configure group "${formValues.name}"`}
        modalSize={AllowlistToolModalSize.X_LARGE}
        showTitle={false}>
        <BuildPhaseFormConfigModal
          onClose={handleConfigModalClose}
          name={formValues.name}
          description={formValues.description}
          selectedPhase={selectedPhase}
          phases={phases}
        />
      </AllowlistToolCommonModalWrapper>
    </>
  );
}
