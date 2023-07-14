import { useContext, useEffect, useState } from "react";
import { DistributionPlanToolContext } from "../../DistributionPlanToolContext";
import { getRandomObjectId } from "../../../../helpers/AllowlistToolHelpers";
import {
  AllowlistOperation,
  AllowlistOperationCode,
  AllowlistToolResponse,
} from "../../../allowlist-tool/allowlist-tool.types";
import styles from "../../DistributionPlan.module.scss";
import DistributionPlanAddOperationBtn from "../../common/DistributionPlanAddOperationBtn";
import Tippy from "@tippyjs/react";
import CreateSnapshotFormSearchCollection from "./CreateSnapshotFormSearchCollection";
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

  const addTokenPool = async (): Promise<string | null> => {
    if (!distributionPlan) return null;
    setIsLoading(true);
    try {
      const url = `${process.env.ALLOWLIST_API_ENDPOINT}/allowlists/${distributionPlan.id}/operations`;
      const tokenPoolId = getRandomObjectId();
      const params: {
        id: string;
        name: string;
        description: string;
        contract: string;
        blockNo: number;
        tokenIds?: string;
      } = {
        id: tokenPoolId,
        name: formValues.name,
        description: formValues.name,
        contract: formValues.contract,
        blockNo: parseInt(formValues.blockNo),
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

  const addSnapshot = async () => {
    const tokenPoolId = await addTokenPool();
    if (!tokenPoolId) return;
    setFormValues((prev) => ({
      ...prev,
      name: "",
      contract: "",
      tokenIds: "",
    }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await addSnapshot();
  };

  useEffect(() => {
    const fetchLatestBlock = async () => {
      try {
        const response = await fetch(
          `${process.env.ALLOWLIST_API_ENDPOINT}/other/latest-block-number`
        );
        const data: AllowlistToolResponse<number> = await response.json();
        if (typeof data === "number") {
          setFormValues((prev) => ({ ...prev, blockNo: data.toString() }));
        }
      } catch (error: any) {
        return;
      }
    };

    fetchLatestBlock();
  }, []);

  const setCollection = (param: { name: string; address: string }) => {
    setFormValues((prev) => ({
      ...prev,
      contract: param.address.toLowerCase(),
      name: param.name,
    }));
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
            className="tw-block tw-w-full tw-rounded-lg tw-border-0 tw-py-3 tw-px-3 tw-bg-neutral-700/40 tw-text-white tw-font-light tw-caret-primary-500 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-neutral-700/40 placeholder:tw-text-neutral-500 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-500 tw-text-base sm:tw-leading-6 tw-transition tw-duration-300 tw-ease-out"
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
            className="tw-block tw-w-full tw-rounded-lg tw-border-0 tw-py-3 tw-px-3 tw-bg-neutral-700/40 tw-text-white tw-font-light tw-caret-primary-500 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-neutral-700/40 placeholder:tw-text-neutral-500 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-500 tw-text-base sm:tw-leading-6 tw-transition tw-duration-300 tw-ease-out"
          />
        </div>
      </div>
      {/* <div className="tw-flex-1">
        <CreateSnapshotFormSearchCollection setCollection={setCollection} />
      </div> */}
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
            className={`tw-block tw-w-full tw-rounded-lg tw-border-0 tw-py-3 tw-px-3 tw-bg-neutral-700/40 tw-text-white tw-font-light tw-caret-primary-500 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-neutral-700/40 placeholder:tw-text-neutral-500 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-500 tw-text-base sm:tw-leading-6 tw-transition tw-duration-300 tw-ease-out ${styles.numberInput}`}
          />
        </div>
      </div>
      <div className="tw-flex-1">
        <label className="tw-block tw-text-sm tw-font-normal tw-leading-5 tw-text-neutral-100">
          <label className="tw-flex tw-items-center tw-gap-x-2 tw-text-sm tw-font-normal tw-leading-5 tw-text-neutral-100">
            <span>Token ID(s)</span>
            <Tippy content="Example: 1,3,54-78" placement="top" theme="dark">
              <svg
                className="tw-h-5 tw-w-5 tw-text-neutral-500 tw-cursor-pointer"
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
            </Tippy>
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
            className="tw-block tw-w-full tw-rounded-lg tw-border-0 tw-py-3 tw-px-3 tw-bg-neutral-700/40 tw-text-white tw-font-light tw-caret-primary-500 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-neutral-700/40 placeholder:tw-text-neutral-500 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-500 tw-text-base sm:tw-leading-6 tw-transition tw-duration-300 tw-ease-out"
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
