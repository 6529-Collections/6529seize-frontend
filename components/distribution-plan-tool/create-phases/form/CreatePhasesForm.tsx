"use client";

import { useContext, useState } from "react";
import { DistributionPlanToolContext } from "@/components/distribution-plan-tool/DistributionPlanToolContext";
import { getRandomObjectId } from "@/helpers/AllowlistToolHelpers";
import {
  AllowlistOperationCode,
} from "@/components/allowlist-tool/allowlist-tool.types";
import DistributionPlanAddOperationBtn from "@/components/distribution-plan-tool/common/DistributionPlanAddOperationBtn";
import { distributionPlanApiPost } from "@/services/distribution-plan-api";

export default function CreatePhasesForm() {
  const { setToasts, distributionPlan, fetchOperations } = useContext(
    DistributionPlanToolContext
  );

  const [formValues, setFormValues] = useState<{
    name: string;
  }>({
    name: "",
  });
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormValues({
      ...formValues,
      [event.target.name]: event.target.value,
    });
  };
  const [isLoading, setIsLoading] = useState(false);

  const addPhase = async (): Promise<string | null> => {
    if (!distributionPlan) return null;
    setIsLoading(true);
    const endpoint = `/allowlists/${distributionPlan.id}/operations`;
    const phaseId = getRandomObjectId();
    const { success, data } = await distributionPlanApiPost({
      endpoint,
      body: {
        code: AllowlistOperationCode.ADD_PHASE,
        params: {
          id: phaseId,
          name: formValues.name,
          description: formValues.name,
        },
      },
    });

    if (!success) {
      setIsLoading(false);
      return null;
    }

    await fetchOperations(distributionPlan.id);
    setFormValues({
      name: "",
    });
    setIsLoading(false);
    return phaseId;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await addPhase();
  };
  return (
    <form onSubmit={handleSubmit}>
      <div className="tw-flex tw-gap-x-4 tw-items-end">
        <div className="tw-w-80">
          <label className="tw-block tw-text-sm tw-font-normal tw-leading-5 tw-text-neutral-100">
            Name
          </label>
          <div className="tw-mt-2">
            <input
              type="text"
              name="name"
              value={formValues.name}
              onChange={handleChange}
              required
              autoComplete="off"
              placeholder="Name of Phase"
              className="tw-form-input tw-block tw-w-full tw-rounded-lg tw-border-0 tw-py-3 tw-px-3 tw-bg-neutral-700/40 tw-text-white tw-font-light tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-neutral-700/40 placeholder:tw-text-neutral-500 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 hover:tw-ring-neutral-700 tw-text-base sm:tw-leading-6 tw-transition tw-duration-300 tw-ease-out"
            />
          </div>
        </div>

        <div>
          <DistributionPlanAddOperationBtn loading={isLoading}>
            Add phase
          </DistributionPlanAddOperationBtn>
        </div>
      </div>
    </form>
  );
}
