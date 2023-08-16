import { useContext, useEffect, useState } from "react";
import {
  DistributionPlanToolContext,
  DistributionPlanToolStep,
} from "../DistributionPlanToolContext";
import {
  AllowlistDescription,
  AllowlistToolResponse,
} from "../../allowlist-tool/allowlist-tool.types";
import DistributionPlanPrimaryBtn from "../common/DistributionPlanPrimaryBtn";

export default function CreatePlanForm() {
  const { setToasts, setState, setStep } = useContext(
    DistributionPlanToolContext
  );

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
    setIsLoading(true);
    const url = `${process.env.ALLOWLIST_API_ENDPOINT}/allowlists`;
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formValues.name,
          description: formValues.description,
        }),
      });
      const data: AllowlistToolResponse<AllowlistDescription> =
        await response.json();
      if ("error" in data) {
        setToasts({
          messages:
            typeof data.message === "string" ? [data.message] : data.message,
          type: "error",
        });
        return;
      }
      setState(data);
      setStep(DistributionPlanToolStep.CREATE_SNAPSHOTS);
    } catch (error) {
      setToasts({
        messages: ["Something went wrong. Please try again."],
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    event.preventDefault();
    await createPlan();
  };

  const [showNextBtn, setShowNextBtn] = useState<boolean>(false);

  useEffect(() => {
    if (!formValues.name || !formValues.description) {
      setShowNextBtn(false);
      return;
    }

    setShowNextBtn(true);
  }, [formValues]);
  return (
    <form className="tw-mt-6" onSubmit={handleSubmit}>
      <div>
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
            placeholder="Make a name for your distribution"
            className="tw-form-input tw-block tw-w-full tw-rounded-lg tw-border-0 tw-py-3 tw-px-3 tw-bg-neutral-700/40 tw-text-white tw-font-light tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-neutral-700/40 hover:tw-ring-neutral-700 placeholder:tw-text-neutral-500 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 tw-text-base sm:tw-leading-6 tw-transition tw-duration-300 tw-ease-out"
          />
        </div>
      </div>
      <div className="tw-mt-6">
        <label className="tw-block tw-text-sm tw-font-normal tw-leading-5 tw-text-neutral-100">
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
            className="tw-form-input tw-block tw-w-full tw-rounded-lg tw-border-0 tw-py-3 tw-px-3 tw-bg-neutral-700/40 tw-text-white tw-font-light tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-neutral-700/40 hover:tw-ring-neutral-700  placeholder:tw-text-neutral-500 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 tw-text-base sm:tw-leading-6 tw-transition tw-duration-300 tw-ease-out"
          />
        </div>
      </div>
      <div className="tw-mt-8 tw-flex tw-justify-end">
        {showNextBtn && (
          <DistributionPlanPrimaryBtn
            loading={isLoading}
            type="submit"
            onClick={() => undefined}
            isDisabled={isLoading}
          >
            Next
          </DistributionPlanPrimaryBtn>
        )}
      </div>
    </form>
  );
}
