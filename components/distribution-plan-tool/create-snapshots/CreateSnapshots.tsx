import { useContext, useEffect, useState } from "react";
import {
  DistributionPlanToolContext,
  DistributionPlanToolStep,
} from "../DistributionPlanToolContext";
import styles from "../DistributionPlan.module.scss";
import {
  AllowlistDescription,
  AllowlistOperation,
  AllowlistOperationCode,
  AllowlistTokenPool,
  AllowlistToolResponse,
} from "../../allowlist-tool/allowlist-tool.types";
import { getRandomObjectId } from "../../../helpers/AllowlistToolHelpers";
import CreateSnapshotRow from "./CreateSnapshotRow";

interface CreateSnapshotFormValues {
  name: string;
  description: string;
  contract: string;
  blockNo: string;
  tokenIds: string;
}

export default function CreateSnapshots() {
  const {
    setStep,
    distributionPlan,
    tokenPools,
    setToasts,
    setState,
    addOperations,
  } = useContext(DistributionPlanToolContext);
  useEffect(() => {
    if (!distributionPlan) setStep(DistributionPlanToolStep.CREATE_PLAN);
  }, [distributionPlan, setStep]);

  const [formValues, setFormValues] = useState<CreateSnapshotFormValues>({
    name: "",
    description: "",
    contract: "",
    blockNo: "",
    tokenIds: "",
  });

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormValues({
      ...formValues,
      [event.target.name]: event.target.value,
    });
  };

  const [isLoading, setIsLoading] = useState<boolean>(false);

  const addTokenPool = async (
    transferPoolId: string
  ): Promise<string | null> => {
    if (!distributionPlan) return null;
    setIsLoading(true);
    try {
      const url = `${process.env.ALLOWLIST_API_ENDPOINT}/allowlists/${distributionPlan.id}/operations`;
      const tokenPoolId = getRandomObjectId();
      const params: {
        id: string;
        name: string;
        description: string;
        transferPoolId: string;
        tokenIds?: string;
      } = {
        id: tokenPoolId,
        name: formValues.name,
        description: formValues.description,
        transferPoolId,
      };

      if (!!formValues.tokenIds.length) {
        params.tokenIds = formValues.tokenIds;
      }

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: AllowlistOperationCode.CREATE_TOKEN_POOL,
          params,
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
        return null;
      }
      addOperations([structuredClone(data)]);
      return tokenPoolId;
    } catch (error) {
      setToasts({
        messages: ["Something went wrong"],
        type: "error",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const addTransferPool = async (): Promise<string | null> => {
    if (!distributionPlan) return null;
    setIsLoading(true);
    const url = `${process.env.ALLOWLIST_API_ENDPOINT}/allowlists/${distributionPlan.id}/operations`;
    const transferPoolId = getRandomObjectId();
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: AllowlistOperationCode.GET_COLLECTION_TRANSFERS,
          params: {
            id: transferPoolId,
            name: formValues.name,
            description: formValues.description,
            contract: formValues.contract,
            blockNo: +formValues.blockNo,
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
        return null;
      }
      addOperations([structuredClone(data)]);
      return transferPoolId;
    } catch (error) {
      setToasts({
        messages: ["Something went wrong. Please try again."],
        type: "error",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const runOperations = async () => {
    if (!distributionPlan) return;
    const url = `${process.env.ALLOWLIST_API_ENDPOINT}/allowlists/${distributionPlan.id}/runs`;
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          allowlistId: distributionPlan.id,
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
      setToasts({
        messages: ["Started running operations"],
        type: "success",
      });
    } catch (error) {
      setToasts({
        messages: ["Something went wrong"],
        type: "error",
      });
    }
  };

  const addSnapshot = async () => {
    const transferPoolId = await addTransferPool();
    if (!transferPoolId) return;
    const tokenPoolId = await addTokenPool(transferPoolId);
    if (!tokenPoolId) return;
    await runOperations();
    setFormValues({
      name: "",
      description: "",
      contract: "",
      blockNo: "",
      tokenIds: "",
    });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await addSnapshot();
  };

  return (
    <div>
      {tokenPools.length > 0 &&
        tokenPools.map((tokenPool: AllowlistTokenPool) => (
          <CreateSnapshotRow key={tokenPool.id} tokenPool={tokenPool} />
        ))}
      <div className="tw-mt-5">
        <form onSubmit={handleSubmit} className="tw-px-4 tw-sm:px-6">
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
                placeholder="Name of Distribution Plan"
                className="tw-block tw-w-full tw-rounded-lg tw-border-0 tw-py-3 tw-px-3 tw-bg-neutral-900 tw-text-white tw-font-light tw-caret-primary-400-focus tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-neutral-700 placeholder:tw-text-neutral-400 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 tw-text-base sm:tw-leading-6 tw-transition tw-duration-300 tw-ease-out"
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
                placeholder="Short description about Distribution Plan"
                className="tw-block tw-w-full tw-rounded-lg tw-border-0 tw-py-3 tw-px-3 tw-bg-neutral-900 tw-text-white tw-font-light tw-caret-primary-400-focus tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-neutral-700 placeholder:tw-text-neutral-500 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 tw-text-base sm:tw-leading-6 tw-transition tw-duration-300 tw-ease-out"
              />
            </div>
          </div>
          <div className="tw-flex-1">
            <label className="tw-block tw-text-sm tw-font-normal tw-leading-5 tw-text-neutral-100">
              Contract number
            </label>
            <div className="tw-mt-2">
              <input
                type="text"
                name="contract"
                value={formValues.contract}
                onChange={handleChange}
                required
                autoComplete="off"
                placeholder="Contract number"
                className="tw-block tw-w-full tw-rounded-lg tw-border-0 tw-py-3 tw-px-3 tw-bg-neutral-700/40 tw-text-white tw-font-light tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-neutral-700/40 placeholder:tw-text-neutral-500 focus:tw-outline-none focus:tw-bg-transparent focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 tw-text-base sm:tw-leading-6 tw-transition tw-duration-300 tw-ease-out"
              />
            </div>
          </div>
          <div className="tw-flex-1">
            <label className="tw-block tw-text-sm tw-font-normal tw-leading-5 tw-text-neutral-100">
              Block number
            </label>
            <div className="tw-mt-2">
              <input
                type="number"
                name="blockNo"
                value={formValues.blockNo}
                onChange={handleChange}
                required
                autoComplete="off"
                placeholder="Block number"
                className={`tw-block tw-w-full tw-rounded-lg tw-border-0 tw-py-3 tw-px-3 tw-bg-neutral-700/40 tw-text-white tw-font-light tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-neutral-700/40 placeholder:tw-text-neutral-500 focus:tw-outline-none focus:tw-bg-transparent focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 tw-text-base sm:tw-leading-6 tw-transition tw-duration-300 tw-ease-out ${styles.numberInput}`}
              />
            </div>
            <div className="tw-flex-1">
              <label className="tw-block tw-text-sm tw-font-normal tw-leading-5 tw-text-neutral-100">
                <label className="tw-flex tw-items-center tw-gap-x-2 tw-text-sm tw-font-normal tw-leading-5 tw-text-neutral-100">
                  <span>Token ID(s)</span>
                  <svg
                    className="tw-h-5 tw-w-5 tw-text-neutral-400"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M12 16V12M12 8H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </label>
              </label>
              <div className="tw-mt-2">
                <input
                  type="text"
                  name="tokenIds"
                  value={formValues.tokenIds}
                  onChange={handleChange}
                  autoComplete="off"
                  placeholder="Empty for All tokens"
                  className="tw-block tw-w-full tw-rounded-lg tw-border-0 tw-py-3 tw-px-3 tw-bg-neutral-700/40 tw-text-white tw-font-light tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-neutral-700/40  placeholder:tw-text-neutral-500 focus:tw-outline-none focus:tw-bg-transparent focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 tw-text-base sm:tw-leading-6 tw-transition tw-duration-300 tw-ease-out"
                />
              </div>
            </div>
          </div>
          <div className="tw-mt-8 tw-w-full">
            <button
              type="submit"
              className="tw-bg-primary-500 tw-px-4 tw-py-3 tw-font-medium tw-text-base tw-text-white tw-w-full tw-border tw-border-primary-500 tw-rounded-lg hover:tw-bg-primary-600 hover:tw-border-primary-600 tw-transition tw-duration-300 tw-ease-out"
            >
              Add Snapshot
            </button>
          </div>
        </form>
        <div className="tw-mt-8 tw-w-full">
          <button
            onClick={() =>
              setStep(DistributionPlanToolStep.CREATE_CUSTOM_SNAPSHOT)
            }
            className="tw-bg-primary-500 tw-px-4 tw-py-3 tw-font-medium tw-text-base tw-text-white tw-w-full tw-border tw-border-primary-500 tw-rounded-lg hover:tw-bg-primary-600 hover:tw-border-primary-600 tw-transition tw-duration-300 tw-ease-out"
          >
            Create Custom Snapshots
          </button>
        </div>
      </div>
    </div>
  );
}
