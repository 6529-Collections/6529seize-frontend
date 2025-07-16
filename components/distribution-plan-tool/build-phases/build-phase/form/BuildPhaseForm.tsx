"use client";

import { useContext, useState } from "react";
import { DistributionPlanToolContext } from "../../../DistributionPlanToolContext";
import { BuildPhasesPhase } from "../../BuildPhases";
import DistributionPlanAddOperationBtn from "../../../common/DistributionPlanAddOperationBtn";
import AllowlistToolCommonModalWrapper, {
  AllowlistToolModalSize,
} from "../../../../allowlist-tool/common/modals/AllowlistToolCommonModalWrapper";
import BuildPhaseFormConfigModal from "./BuildPhaseFormConfigModal";
import { Tooltip } from "react-tooltip";

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
      <form onSubmit={handleSubmit} className="tw-flex tw-items-end tw-gap-x-4">
        <div className="tw-w-80">
          <label className="tw-text-sm tw-font-normal tw-leading-5 tw-text-neutral-100 tw-inline-flex">
            Group Name
            <div className="tw-pl-2">
              <svg
                className="tw-h-5 tw-w-5 tw-text-neutral-500 tw-cursor-pointer"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                data-tooltip-id="build-phase-form-group-name-tooltip">
                <path
                  d="M12 16V12M12 8H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </label>
          <div className="tw-mt-2">
            <input
              type="text"
              name="name"
              value={formValues.name}
              onChange={handleFormChange}
              required
              autoComplete="off"
              className="tw-form-input tw-block tw-w-full tw-rounded-lg tw-border-0 tw-py-3 tw-px-3 tw-bg-neutral-700/40 tw-text-white tw-font-light tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-neutral-700/40 placeholder:tw-text-neutral-500  focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 hover:tw-ring-neutral-700 tw-text-base sm:tw-leading-6 tw-transition tw-duration-300 tw-ease-out"
            />
          </div>
        </div>
        <div className="tw-w-80">
          <label className="tw-inline-flex tw-text-sm tw-font-normal tw-leading-5 tw-text-neutral-100">
            Description
            <div className="tw-pl-2">
              <svg
                className="tw-h-5 tw-w-5 tw-text-neutral-500 tw-cursor-pointer"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                data-tooltip-id="build-phase-form-description-tooltip">
                <path
                  d="M12 16V12M12 8H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </label>
          <div className="tw-mt-2">
            <input
              type="text"
              name="description"
              required
              value={formValues.description}
              onChange={handleFormChange}
              autoComplete="off"
              className="tw-form-input tw-block tw-w-full tw-rounded-lg tw-border-0 tw-py-3 tw-px-3 tw-bg-neutral-700/40 tw-text-white tw-font-light tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-neutral-700/40 placeholder:tw-text-neutral-500 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 hover:tw-ring-neutral-700 tw-text-base sm:tw-leading-6 tw-transition tw-duration-300 tw-ease-out"
            />
          </div>
        </div>
        <div>
          <DistributionPlanAddOperationBtn loading={false}>
            Configure group
          </DistributionPlanAddOperationBtn>
        </div>
      </form>
      <Tooltip
        id="build-phase-form-group-name-tooltip"
        content="Example: Memes"
        place="top"
        style={{
          backgroundColor: "#1F2937",
          color: "white",
          padding: "4px 8px",
        }}
      />
      <Tooltip
        id="build-phase-form-description-tooltip"
        content="Example: Top 250 Memes collectors (ranked by Set Size)"
        place="top"
        style={{
          backgroundColor: "#1F2937",
          color: "white",
          padding: "4px 8px",
        }}
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
