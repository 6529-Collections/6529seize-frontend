"use client";

import type { AllowlistDescription } from "@/components/allowlist-tool/allowlist-tool.types";
import { distributionPlanApiPost } from "@/services/distribution-plan-api";
import { useState } from "react";
import DistributionPlanPrimaryBtn from "../common/DistributionPlanPrimaryBtn";

export default function CreateDistributionPlan({
  onSuccess,
}: {
  onSuccess: (distributionPlanId: string) => void;
}) {
  const [formValues, setFormValues] = useState({
    name: "",
    description: "",
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormValues({
      ...formValues,
      [event.target.name]: event.target.value,
    });
  };

  const createPlan = async () => {
    if (!formValues.name || !formValues.description) return;
    setIsLoading(true);
    const { success, data } =
      await distributionPlanApiPost<AllowlistDescription>({
        endpoint: "/allowlists",
        body: {
          name: formValues.name,
          description: formValues.description,
        },
      });

    if (success && data?.id) {
      onSuccess(data.id);
    } else {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    event.preventDefault();
    await createPlan();
  };
  return (
    <div className="tw-p-6">
      <p className="tw-max-w-sm tw-text-lg tw-text-white tw-font-medium tw-mb-0">
        Create new Distribution plan
      </p>
      <form className="tw-mt-6" onSubmit={handleSubmit}>
        <div>
          <label className="tw-block tw-text-sm tw-font-normal tw-leading-5 tw-text-iron-100">
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
              placeholder="Make a name for your distribution"
              className="tw-form-input tw-block tw-w-full tw-rounded-lg tw-border-0 tw-py-3 tw-px-3 tw-bg-iron-700/40 tw-text-white tw-font-light tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-700/40 hover:tw-ring-iron-700 placeholder:tw-text-iron-500 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 tw-text-base sm:tw-leading-6 tw-transition tw-duration-300 tw-ease-out"
            />
          </div>
        </div>
        <div className="tw-mt-6">
          <label className="tw-block tw-text-sm tw-font-normal tw-leading-5 tw-text-iron-100">
            Description
          </label>
          <div className="tw-mt-2">
            <input
              type="text"
              name="description"
              value={formValues.description}
              onChange={handleChange}
              required
              autoComplete="off"
              placeholder="Description of your drop"
              className="tw-form-input tw-block tw-w-full tw-rounded-lg tw-border-0 tw-py-3 tw-px-3 tw-bg-iron-700/40 tw-text-white tw-font-light tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-700/40 hover:tw-ring-iron-700  placeholder:tw-text-iron-500 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 tw-text-base sm:tw-leading-6 tw-transition tw-duration-300 tw-ease-out"
            />
          </div>
        </div>
        <div className="tw-mt-8 tw-flex tw-justify-end">
          <DistributionPlanPrimaryBtn
            loading={isLoading}
            type="submit"
            onClick={() => undefined}
            isDisabled={isLoading}>
            Create
          </DistributionPlanPrimaryBtn>
        </div>
      </form>
    </div>
  );
}
