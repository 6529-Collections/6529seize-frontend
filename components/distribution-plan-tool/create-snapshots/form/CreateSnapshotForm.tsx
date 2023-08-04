import { useContext, useEffect, useState } from "react";
import { DistributionPlanToolContext } from "../../DistributionPlanToolContext";
import {
  getRandomObjectId,
  isEthereumAddress,
} from "../../../../helpers/AllowlistToolHelpers";
import {
  AllowlistOperation,
  AllowlistOperationCode,
  AllowlistToolResponse,
  DistributionPlanSearchContractMetadataResult,
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

  const getContractMetadata = async (contract: string) => {
    const url = `${process.env.ALLOWLIST_API_ENDPOINT}/other/contract-metadata/${contract}`;
    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data: AllowlistToolResponse<DistributionPlanSearchContractMetadataResult | null> =
        await response.json();

      if (data && "error" in data) {
        setToasts({
          messages:
            typeof data.message === "string" ? [data.message] : data.message,
          type: "error",
        });
        return null;
      }
      if (data?.name && !formValues.name) {
        setFormValues((prev) => ({ ...prev, name: data.name }));
      }
    } catch (error) {
      setToasts({
        messages: ["Something went wrong"],
        type: "error",
      });
      return null;
    }
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
    if (name === "contract" && isEthereumAddress(value) && !formValues.name) {
      getContractMetadata(value);
    }
  };

  const [isLoading, setIsLoading] = useState<boolean>(false);

  const addTokenPool = async (): Promise<{
    tokenPoolId: string;
    consolidationBlockNumber: number;
  } | null> => {
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
        consolidateWallets: boolean;
      } = {
        id: tokenPoolId,
        name: formValues.name,
        description: formValues.name,
        contract: formValues.contract,
        blockNo: parseInt(formValues.blockNo),
        consolidateWallets: true,
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
      return { tokenPoolId, consolidationBlockNumber: params.blockNo };
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
    const tokenPoolResponse = await addTokenPool();
    if (!tokenPoolResponse) return;
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

  const setCollection = (param: {
    name: string;
    address: string;
    tokenIds: string | null;
  }) => {
    setFormValues((prev) => ({
      ...prev,
      contract: param.address.toLowerCase(),
      name: param.name,
      tokenIds: param.tokenIds ?? "",
    }));
  };

  return (
    <>
      <CreateSnapshotFormSearchCollection setCollection={setCollection} />
      <form
        className="tw-flex tw-flex-wrap tw-gap-y-5 tw-mt-8"
        onSubmit={handleSubmit}
      >
        <div className="tw-flex tw-w-full tw-gap-x-4">
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
                className="tw-form-input tw-block tw-w-full tw-rounded-lg tw-border-0 tw-py-3 tw-px-3 tw-bg-neutral-700/40 tw-text-white tw-font-light tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-neutral-700/40 placeholder:tw-text-neutral-500 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 hover:tw-ring-neutral-700 tw-text-base sm:tw-leading-6 tw-transition tw-duration-300 tw-ease-out"
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
                className="tw-form-input tw-block tw-w-full tw-rounded-lg tw-border-0 tw-py-3 tw-px-3 tw-bg-neutral-700/40 tw-text-white tw-font-light tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-neutral-700/40 placeholder:tw-text-neutral-500 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 hover:tw-ring-neutral-700 tw-text-base sm:tw-leading-6 tw-transition tw-duration-300 tw-ease-out"
              />
            </div>
          </div>
          <div className="tw-flex-1">
            <label className="tw-flex tw-items-center tw-gap-x-2 tw-text-sm tw-font-normal tw-leading-5 tw-text-neutral-100">
              <span>Block number</span>
              <Tippy
                content="Use etherscan.io to find previous block numbers"
                placement="top"
                theme="dark"
              >
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
            <div className="tw-mt-2">
              <input
                type="number"
                name="blockNo"
                value={formValues.blockNo}
                onChange={handleChange}
                required
                autoComplete="off"
                placeholder="Block number"
                className={`tw-form-input tw-block tw-w-full tw-rounded-lg tw-border-0 tw-py-3 tw-px-3 tw-bg-neutral-700/40 tw-text-white tw-font-light tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-neutral-700/40 placeholder:tw-text-neutral-500 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 hover:tw-ring-neutral-700 tw-text-base sm:tw-leading-6 tw-transition tw-duration-300 tw-ease-out ${styles.numberInput}`}
              />
            </div>
          </div>
        </div>
        <div className="tw-flex tw-items-center tw-w-full tw-gap-x-4">
          <div className="tw-flex-1">
            <label className="tw-block tw-text-sm tw-font-normal tw-leading-5 tw-text-neutral-100">
              <label className="tw-flex tw-items-center tw-gap-x-2 tw-text-sm tw-font-normal tw-leading-5 tw-text-neutral-100">
                <span>Token ID(s)</span>
                <Tippy
                  content="Example: 1,3,54-78"
                  placement="top"
                  theme="dark"
                >
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
                className="tw-form-input tw-block tw-w-full tw-rounded-lg tw-border-0 tw-py-3 tw-px-3 tw-bg-neutral-700/40 tw-text-white tw-font-light tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-neutral-700/40 placeholder:tw-text-neutral-500 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 hover:tw-ring-neutral-700 tw-text-base sm:tw-leading-6 tw-transition tw-duration-300 tw-ease-out"
              />
            </div>
          </div>
          <div className="tw-flex-1">
            <div className="tw-flex tw-gap-x-4">
              <div className="tw-w-full">
                <label className="tw-block tw-text-sm tw-font-normal tw-leading-5 tw-text-neutral-100">
                  <label className="tw-flex tw-items-center tw-gap-x-2 tw-text-sm tw-font-normal tw-leading-5 tw-text-neutral-100">
                    <div className="tw-flex tw-items-center">
                      {/* Enabled: "tw-bg-primary-500", Not Enabled: "tw-bg-neutral-700"  */}
                      <button
                        type="button"
                        className="tw-p-0 tw-bg-neutral-700 tw-relative tw-inline-flex tw-h-6 tw-w-11 tw-flex-shrink-0 tw-cursor-pointer tw-rounded-full tw-border-2 tw-border-transparent tw-transition-colors tw-duration-200 tw-ease-in-out focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-primary-500"
                        role="switch"
                        aria-checked="false"
                        aria-labelledby="annual-billing-label"
                      >
                        {/*  Enabled: "tw-translate-x-5", Not Enabled: "tw-translate-x-0"  */}
                        <span
                          aria-hidden="true"
                          className="tw-translate-x-0 tw-pointer-events-none tw-inline-block tw-h-5 tw-w-5 tw-transform tw-rounded-full tw-bg-white tw-shadow tw-ring-0 tw-transition tw-duration-200 tw-ease-in-out"
                        ></span>
                      </button>
                      <span className="tw-ml-3 tw-text-sm">
                        <span className="tw-font-medium tw-text-gray-100">
                          Consolidated
                        </span>
                      </span>
                    </div>
                  </label>
                </label>
                <div className="tw-mt-2">
                  <input
                    type="text"
                    autoComplete="off"
                    placeholder="Consolidate block number"
                    className="tw-form-input tw-block tw-w-full tw-rounded-lg tw-border-0 tw-py-3 tw-px-3 tw-bg-neutral-700/40 tw-text-white tw-font-light tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-neutral-700/40 placeholder:tw-text-neutral-500 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 hover:tw-ring-neutral-700 tw-text-base sm:tw-leading-6 tw-transition tw-duration-300 tw-ease-out"
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="tw-flex-1 tw-self-end">
            <div className="tw-max-w-[8.375rem]">
              <DistributionPlanAddOperationBtn loading={isLoading}>
                Add snapshot
              </DistributionPlanAddOperationBtn>
            </div>
          </div>
        </div>
      </form>
    </>
  );
}
