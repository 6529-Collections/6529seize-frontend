"use client";

import { useState } from "react";
import DistributionPlanSecondaryText from "@/components/distribution-plan-tool/common/DistributionPlanSecondaryText";
import { PhaseConfigStep } from "../BuildPhaseFormConfigModal";
import BuildPhaseFormConfigModalTitle from "./BuildPhaseFormConfigModalTitle";
import ComponentConfigMeta from "./ComponentConfigMeta";
import ComponentConfigNextBtn from "./ComponentConfigNextBtn";
import { Tooltip } from "react-tooltip";

export default function SnapshotSelectTokenIds({
  title,
  onNextStep,
  onSelectTokenIds,
  onClose,
}: {
  title: string;
  onNextStep: (step: PhaseConfigStep) => void;
  onSelectTokenIds: (tokenIds: string) => void;
  onClose: () => void;
}) {
  const [formValues, setFormValues] = useState<{ tokenIds: string }>({
    tokenIds: "",
  });

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };
  const onNext = () => {
    onSelectTokenIds(formValues.tokenIds);
  };
  return (
    <div className="tw-relative tw-p-6">
      <BuildPhaseFormConfigModalTitle title={title} onClose={onClose} />
      <DistributionPlanSecondaryText>
        Include only wallets that hold <strong>ALL</strong> specific token IDs.
      </DistributionPlanSecondaryText>

      <div className="tw-mt-6">
        <div className="tw-flex-1 tw-mt-4">
          <label className="tw-block tw-text-sm tw-font-normal tw-leading-5 tw-text-neutral-100">
            <label className="tw-flex tw-items-center tw-gap-x-2 tw-text-sm tw-font-normal tw-leading-5 tw-text-neutral-100">
              <span>Token ID(s)</span>
              <svg
                className="tw-h-5 tw-w-5 tw-text-neutral-500 tw-cursor-pointer"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                data-tooltip-id="token-ids-tooltip">
                <path
                  d="M12 16V12M12 8H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <Tooltip 
                id="token-ids-tooltip" 
                place="top"
                style={{
                  backgroundColor: "#1F2937",
                  color: "white", 
                  padding: "4px 8px",
                }}>
                Example: 1,3,54-78
              </Tooltip>
            </label>
          </label>
          <div className="tw-mt-2">
            <input
              type="text"
              name="tokenIds"
              value={formValues.tokenIds}
              onChange={handleChange}
              autoComplete="off"
              placeholder="Example: 1,3,54-78"
              className="tw-form-input tw-block tw-w-full tw-rounded-lg tw-border-0 tw-py-3 tw-px-3 tw-bg-neutral-700/40 tw-text-white tw-font-light tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-neutral-700/40 placeholder:tw-text-neutral-500 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 hover:tw-ring-neutral-700 tw-text-base sm:tw-leading-6 tw-transition tw-duration-300 tw-ease-out"
            />
          </div>
        </div>
      </div>
      <ComponentConfigNextBtn
        showSkipBtn={true}
        showNextBtn={!!formValues.tokenIds.length}
        isDisabled={!formValues.tokenIds.length}
        onSkip={() => onNextStep(PhaseConfigStep.SNAPSHOT_SELECT_TOP_HOLDERS)}
        onNext={onNext}>
        <ComponentConfigMeta tags={[]} walletsCount={null} isLoading={false} />
      </ComponentConfigNextBtn>
    </div>
  );
}
