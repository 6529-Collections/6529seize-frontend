import { useContext, useState } from "react";
import { DistributionPlanToolContext } from "../../DistributionPlanToolContext";
import { getRandomObjectId } from "../../../../helpers/AllowlistToolHelpers";
import {
  AllowlistOperation,
  AllowlistOperationCode,
  AllowlistToolResponse,
} from "../../../allowlist-tool/allowlist-tool.types";
import styles from "../../DistributionPlan.module.scss";
import DistributionPlanAddOperationBtn from "../../common/DistributionPlanAddOperationBtn";
interface CreateSnapshotFormValues {
  name: string;
  contract: string;
  blockNo: string;
  tokenIds: string;
}

export default function CreateSnapshotForm() {
  const { setToasts, distributionPlan, addOperations } = useContext(
    DistributionPlanToolContext
  );

  const [formValues, setFormValues] = useState<CreateSnapshotFormValues>({
    name: "",
    contract: "",
    blockNo: "",
    tokenIds: "",
  });

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
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
        description: formValues.name,
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
            description: formValues.name,
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

  const addSnapshot = async () => {
    const transferPoolId = await addTransferPool();
    if (!transferPoolId) return;
    const tokenPoolId = await addTokenPool(transferPoolId);
    if (!tokenPoolId) return;
    setFormValues({
      name: "",
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
    <form className="tw-flex tw-items-end tw-gap-x-4" onSubmit={handleSubmit}>
      <div className="tw-flex-1">
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
            placeholder="Snapshot name"
            className="tw-block tw-w-full tw-rounded-lg tw-border-0 tw-py-3 tw-px-3 tw-bg-neutral-900 tw-text-white tw-font-light tw-caret-primary-400-focus tw-shadow-sm tw-ring-2 tw-ring-inset tw-ring-neutral-700 placeholder:tw-text-neutral-400 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 tw-text-base sm:tw-leading-6 tw-transition tw-duration-300 tw-ease-out"
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
            className="tw-block tw-w-full tw-rounded-lg tw-border-0 tw-py-3 tw-px-3 tw-bg-neutral-900 tw-text-white tw-font-light tw-caret-primary-400-focus tw-shadow-sm tw-ring-2 tw-ring-inset tw-ring-neutral-700 placeholder:tw-text-neutral-400 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 tw-text-base sm:tw-leading-6 tw-transition tw-duration-300 tw-ease-out"
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
            className={`tw-block tw-w-full tw-rounded-lg tw-border-0 tw-py-3 tw-px-3 tw-bg-neutral-900 tw-text-white tw-font-light tw-caret-primary-400-focus tw-shadow-sm tw-ring-2 tw-ring-inset tw-ring-neutral-700 placeholder:tw-text-neutral-400 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 tw-text-base sm:tw-leading-6 tw-transition tw-duration-300 tw-ease-out ${styles.numberInput}`}
          />
        </div>
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
            className="tw-block tw-w-full tw-rounded-lg tw-border-0 tw-py-3 tw-px-3 tw-bg-neutral-900 tw-text-white tw-font-light tw-caret-primary-400-focus tw-shadow-sm tw-ring-2 tw-ring-inset tw-ring-neutral-700 placeholder:tw-text-neutral-400 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 tw-text-base sm:tw-leading-6 tw-transition tw-duration-300 tw-ease-out"
          />
        </div>
      </div>
      <div>
        <DistributionPlanAddOperationBtn loading={isLoading}>
          Add snapshot
        </DistributionPlanAddOperationBtn>
      </div>
    </form>
  );
}
