import { useContext, useEffect, useState } from "react";
import {
  DistributionPlanToolContext,
  DistributionPlanToolStep,
} from "../DistributionPlanToolContext";
import {
  AllowlistDescription,
  AllowlistToolResponse,
} from "../../allowlist-tool/allowlist-tool.types";

export default function CreatePlan() {
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

  useEffect(() => {
    const fetchAllowlist = async () => {
      const url = `${process.env.ALLOWLIST_API_ENDPOINT}/allowlists/97d47f82-8a70-473a-824d-54491a204e48`;
      const response = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      const data: AllowlistToolResponse<AllowlistDescription> =
        await response.json();
      if ("error" in data) {
        return;
      }

    setState(data);
     setStep(DistributionPlanToolStep.CREATE_SNAPSHOTS); 
    };
    fetchAllowlist();
  }, []);

  return (
    <div>
      <div className="tw-max-w-2xl tw-mx-auto tw-flex tw-flex-col">
        <h1 className="tw-uppercase tw-text-white">Distribution Plan Tool</h1>
        <p className="tw-mt-1 tw-mb-0 tw-block tw-font-light tw-text-base tw-text-neutral-400">
          The Seize distribution plan tool allows you to build a distribution
          plan for your mint that includes airdrops, allowlists and public
          minting in one more phases.
        </p>
      </div>
      <div className="tw-max-w-2xl tw-mx-auto tw-mt-8 tw-pt-8 tw-border-t tw-border-solid tw-border-l-0 tw-border-r-0 tw-border-b-0 tw-border-t-neutral-700">
        <p className="tw-m-0 tw-block tw-text-primary-400 tw-text-lg tw-font-medium">
          Let’s Get Started
        </p>
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
                className="tw-block tw-w-full tw-rounded-lg tw-border-0 tw-py-3 tw-px-3 tw-bg-neutral-900 tw-text-white tw-font-light tw-caret-primary-400-focus tw-shadow-sm tw-ring-2 tw-ring-inset tw-ring-neutral-700 placeholder:tw-text-neutral-400 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 tw-text-base sm:tw-leading-6 tw-transition tw-duration-300 tw-ease-out"
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
                className="tw-block tw-w-full tw-rounded-lg tw-border-0 tw-py-3 tw-px-3 tw-bg-neutral-900 tw-text-white tw-font-light tw-caret-primary-400-focus tw-shadow-sm tw-ring-2 tw-ring-inset tw-ring-neutral-700 placeholder:tw-text-neutral-400 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 tw-text-base sm:tw-leading-6 tw-transition tw-duration-300 tw-ease-out"
              />
            </div>
          </div>
          <div className="tw-mt-8 tw-flex tw-justify-end">
            <button
              type="submit"
              className="tw-bg-primary-500 tw-px-4 tw-py-3 tw-font-medium tw-text-sm tw-text-white tw-border tw-border-primary-500 tw-rounded-lg hover:tw-bg-primary-600 hover:tw-border-primary-600 tw-transition tw-duration-300 tw-ease-out"
            >
              Create Distribution Plan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
