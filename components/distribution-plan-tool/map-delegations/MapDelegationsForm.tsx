import { useContext, useState } from "react";
import DistributionPlanAddOperationBtn from "../common/DistributionPlanAddOperationBtn";
import { DistributionPlanToolContext } from "../DistributionPlanToolContext";
import {
  AllowlistOperation,
  AllowlistOperationCode,
  AllowlistToolResponse,
} from "../../allowlist-tool/allowlist-tool.types";

export default function MapDelegationsForm() {
  const { setToasts, distributionPlan, fetchOperations } = useContext(
    DistributionPlanToolContext
  );

  const [formValues, setFormValues] = useState<{
    delegationContract: string;
  }>({
    delegationContract: "",
  });

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormValues({
      ...formValues,
      [event.target.name]: event.target.value,
    });
  };
  const [isLoading, setIsLoading] = useState(false);

  const addDelegation = async (): Promise<{ success: boolean }> => {
    if (!distributionPlan) return { success: false };
    setIsLoading(true);
    const url = `${process.env.ALLOWLIST_API_ENDPOINT}/allowlists/${distributionPlan.id}/operations`;
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: AllowlistOperationCode.MAP_RESULTS_TO_DELEGATED_WALLETS,
          params: {
            delegationContract: formValues.delegationContract.toLowerCase(),
          },
        }),
      });
      const data: AllowlistToolResponse<AllowlistOperation> =
        await response.json();
      if ("error" in data) {
        setToasts({
          messages:
            typeof data.message === "string" ? [data.message] : data.message,
          type: "error",
        });
        return { success: false };
      }
      fetchOperations(distributionPlan.id);
      setFormValues({
        delegationContract: "",
      });
      return { success: true };
    } catch (error) {
      setToasts({
        messages: ["Something went wrong. Please try again later."],
        type: "error",
      });
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await addDelegation();
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="tw-flex tw-gap-x-4 tw-items-end">
        <div className="tw-w-80">
          <label className="tw-block tw-text-sm tw-font-normal tw-leading-5 tw-text-neutral-100">
            Contract to return registered Delegations
          </label>
          <div className="tw-mt-2">
            <input
              type="text"
              name="delegationContract"
              value={formValues.delegationContract}
              onChange={handleChange}
              required
              autoComplete="off"
              placeholder="Contract to return registered Delegations"
              className="tw-form-input tw-block tw-w-full tw-rounded-lg tw-border-0 tw-py-3 tw-px-3 tw-bg-neutral-700/40 tw-text-white tw-font-light tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-neutral-700/40 placeholder:tw-text-neutral-500 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 hover:tw-ring-neutral-700 tw-text-base sm:tw-leading-6 tw-transition tw-duration-300 tw-ease-out"
            />
          </div>
        </div>

        <div>
          <DistributionPlanAddOperationBtn loading={isLoading}>
            Add contract
          </DistributionPlanAddOperationBtn>
        </div>
      </div>
    </form>
  );
}
