"use client";

import type { DistributionPlanSearchContractMetadataResult } from "@/components/allowlist-tool/allowlist-tool.types";
import { AllowlistOperationCode } from "@/components/allowlist-tool/allowlist-tool.types";
import { DistributionPlanToolContext } from "@/components/distribution-plan-tool/DistributionPlanToolContext";
import DistributionPlanAddOperationBtn from "@/components/distribution-plan-tool/common/DistributionPlanAddOperationBtn";
import {
  getRandomObjectId,
  isEthereumAddress,
} from "@/helpers/AllowlistToolHelpers";
import { TOOLTIP_STYLES } from "@/helpers/tooltip.helpers";
import {
  distributionPlanApiFetch,
  distributionPlanApiPost,
} from "@/services/distribution-plan-api";
import { useContext, useEffect, useState } from "react";
import { Tooltip } from "react-tooltip";
import CreateSnapshotFormSearchCollection from "./CreateSnapshotFormSearchCollection";
interface CreateSnapshotFormValues {
  name: string;
  contract: string;
  blockNo: string;
  tokenIds: string;
}

export default function CreateSnapshotForm() {
  const { distributionPlan, fetchOperations } = useContext(
    DistributionPlanToolContext
  );

  const [formValues, setFormValues] = useState<CreateSnapshotFormValues>({
    name: "",
    contract: "",
    blockNo: "",
    tokenIds: "",
  });

  const [consolidateBlockNo, setConsolidateBlockNo] = useState<string>("");

  const getContractMetadata = async (contract: string) => {
    const endpoint = `/other/contract-metadata/${contract}`;
    const { success, data } =
      await distributionPlanApiFetch<DistributionPlanSearchContractMetadataResult | null>(
        endpoint
      );
    if (!success) {
      return;
    }
    if (data?.name && !formValues.name) {
      setFormValues((prev) => ({ ...prev, name: data.name }));
    }
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
    if (name === "contract" && isEthereumAddress(value) && !formValues.name) {
      getContractMetadata(value);
    }
  };

  const handleConsolidationBlockNoChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { value } = event.target;
    setConsolidateBlockNo(value);
  };

  const [isLoading, setIsLoading] = useState<boolean>(false);

  const addTokenPool = async (): Promise<{
    success: boolean;
  }> => {
    if (!distributionPlan) return { success: false };
    if (isLoading) return { success: false };
    setIsLoading(true);
    const endpoint = `/allowlists/${distributionPlan.id}/operations`;
    const tokenPoolId = getRandomObjectId();
    const consolidateBlockNoInt = parseInt(consolidateBlockNo);

    const params: {
      id: string;
      name: string;
      description: string;
      contract: string;
      blockNo: number;
      tokenIds?: string | undefined;
      consolidateBlockNo: number | null;
    } = {
      id: tokenPoolId,
      name: formValues.name,
      description: formValues.name,
      contract: formValues.contract,
      blockNo: parseInt(formValues.blockNo),
      consolidateBlockNo: !isNaN(consolidateBlockNoInt)
        ? consolidateBlockNoInt
        : null,
    };

    if (!!formValues.tokenIds.length) {
      params.tokenIds = formValues.tokenIds;
    }

    const { success } = await distributionPlanApiPost({
      endpoint,
      body: {
        code: AllowlistOperationCode.CREATE_TOKEN_POOL,
        params,
      },
    });
    setIsLoading(false);

    if (!success) {
      return { success: false };
    }

    fetchOperations(distributionPlan.id);
    return { success: true };
  };

  const addSnapshot = async () => {
    const { success } = await addTokenPool();
    if (!success) return;
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
      const endpoint = `/other/latest-block-number`;
      const { success, data } =
        await distributionPlanApiFetch<number>(endpoint);
      if (!success || typeof data !== "number") return;
      const blockNo = data.toString();
      setFormValues((prev) => ({ ...prev, blockNo }));
      setConsolidateBlockNo(blockNo);
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

  const goToEtherScan = () => {
    window.open("https://etherscan.io/", "_blank", "noopener,noreferrer");
  };

  return (
    <>
      <CreateSnapshotFormSearchCollection setCollection={setCollection} />
      <form
        className="tw-mt-8 tw-grid tw-gap-5"
        onSubmit={handleSubmit}
      >
        <div className="tw-grid tw-w-full tw-grid-cols-1 tw-gap-4 md:tw-grid-cols-3">
          <div className="tw-min-w-0">
            <label
              htmlFor="snapshot-name"
              className="tw-flex tw-min-h-8 tw-items-center tw-text-sm tw-font-normal tw-leading-5 tw-text-iron-100"
            >
              Name
            </label>
            <div className="tw-mt-2">
              <input
                id="snapshot-name"
                type="text"
                name="name"
                value={formValues.name}
                onChange={handleChange}
                required
                autoComplete="off"
                placeholder="Snapshot name"
                className="tw-form-input tw-block tw-w-full tw-rounded-lg tw-border-0 tw-bg-iron-700/40 tw-px-3 tw-py-3 tw-text-base tw-font-light tw-text-white tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-700/40 tw-transition tw-duration-300 tw-ease-out placeholder:tw-text-iron-500 hover:tw-ring-iron-700 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 sm:tw-leading-6"
              />
            </div>
          </div>
          <div className="tw-min-w-0">
            <label
              htmlFor="snapshot-contract"
              className="tw-flex tw-min-h-8 tw-items-center tw-text-sm tw-font-normal tw-leading-5 tw-text-iron-100"
            >
              Contract number
            </label>
            <div className="tw-mt-2">
              <input
                id="snapshot-contract"
                type="text"
                name="contract"
                value={formValues.contract}
                onChange={handleChange}
                required
                autoComplete="off"
                placeholder="Contract number"
                className="tw-form-input tw-block tw-w-full tw-rounded-lg tw-border-0 tw-bg-iron-700/40 tw-px-3 tw-py-3 tw-text-base tw-font-light tw-text-white tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-700/40 tw-transition tw-duration-300 tw-ease-out placeholder:tw-text-iron-500 hover:tw-ring-iron-700 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 sm:tw-leading-6"
              />
            </div>
          </div>
          <div className="tw-min-w-0">
            <div className="tw-flex tw-items-center tw-gap-1 tw-text-sm tw-font-normal tw-leading-5 tw-text-iron-100">
              <label htmlFor="snapshot-block-number">Block number</label>
              <button
                type="button"
                aria-label="Open Etherscan block explorer in a new tab"
                onClick={goToEtherScan}
                data-tooltip-id="block-number-tooltip"
                className="tw-flex tw-h-8 tw-w-8 tw-items-center tw-justify-center tw-rounded-full tw-border-0 tw-bg-transparent tw-p-0 tw-text-iron-500 hover:tw-text-iron-300 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
              >
                <svg
                  aria-hidden="true"
                  className="tw-h-5 tw-w-5"
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
              </button>
              <Tooltip
                id="block-number-tooltip"
                place="top"
                style={TOOLTIP_STYLES}
              >
                Use etherscan.io to find previous block numbers
              </Tooltip>
            </div>
            <div className="tw-mt-2">
              <input
                id="snapshot-block-number"
                type="number"
                name="blockNo"
                value={formValues.blockNo}
                onChange={handleChange}
                required
                autoComplete="off"
                placeholder="Block number"
                className="tw-form-input tw-block tw-w-full tw-rounded-lg tw-border-0 tw-bg-iron-700/40 tw-px-3 tw-py-3 tw-text-base tw-font-light tw-text-white tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-700/40 tw-transition tw-duration-300 tw-ease-out [appearance:textfield] placeholder:tw-text-iron-500 hover:tw-ring-iron-700 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 sm:tw-leading-6 [&::-webkit-inner-spin-button]:tw-m-0 [&::-webkit-inner-spin-button]:tw-appearance-none [&::-webkit-outer-spin-button]:tw-m-0 [&::-webkit-outer-spin-button]:tw-appearance-none"
              />
            </div>
          </div>
        </div>
        <div className="tw-grid tw-w-full tw-grid-cols-1 tw-gap-4 md:tw-grid-cols-2 md:tw-items-end lg:tw-grid-cols-3">
          <div className="tw-min-w-0">
            <div className="tw-flex tw-items-center tw-gap-1 tw-text-sm tw-font-normal tw-leading-5 tw-text-iron-100">
              <label htmlFor="snapshot-token-ids">Token ID(s)</label>
              <button
                type="button"
                aria-label="Show token ID format example"
                data-tooltip-id="token-ids-tooltip"
                className="tw-flex tw-h-8 tw-w-8 tw-items-center tw-justify-center tw-rounded-full tw-border-0 tw-bg-transparent tw-p-0 tw-text-iron-500 hover:tw-text-iron-300 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
              >
                <svg
                  aria-hidden="true"
                  className="tw-h-5 tw-w-5"
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
              </button>
              <Tooltip
                id="token-ids-tooltip"
                place="top"
                style={TOOLTIP_STYLES}
              >
                Example: 1,3,54-78
              </Tooltip>
            </div>
            <div className="tw-mt-2">
              <input
                id="snapshot-token-ids"
                type="text"
                name="tokenIds"
                value={formValues.tokenIds}
                onChange={handleChange}
                autoComplete="off"
                placeholder="Empty for All tokens"
                className="tw-form-input tw-block tw-w-full tw-rounded-lg tw-border-0 tw-bg-iron-700/40 tw-px-3 tw-py-3 tw-text-base tw-font-light tw-text-white tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-700/40 tw-transition tw-duration-300 tw-ease-out placeholder:tw-text-iron-500 hover:tw-ring-iron-700 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 sm:tw-leading-6"
              />
            </div>
          </div>
          <div className="tw-min-w-0">
            <div className="tw-w-full">
              <label
                htmlFor="snapshot-consolidation-block-number"
                className="tw-block tw-text-sm tw-font-normal tw-leading-5 tw-text-iron-100"
              >
                <span className="tw-font-medium tw-text-iron-100">
                  Consolidation block number
                </span>
                <span
                  id="snapshot-consolidation-block-help"
                  className="tw-mt-0.5 tw-block tw-text-xs tw-text-iron-400"
                >
                  Leave empty if you don&apos;t want to consolidate.
                </span>
              </label>
              <div className="tw-mt-2">
                <input
                  id="snapshot-consolidation-block-number"
                  aria-describedby="snapshot-consolidation-block-help"
                  type="text"
                  autoComplete="off"
                  placeholder="Consolidate block number"
                  className="tw-form-input tw-block tw-w-full tw-rounded-lg tw-border-0 tw-bg-iron-700/40 tw-px-3 tw-py-3 tw-text-base tw-font-light tw-text-white tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-700/40 tw-transition tw-duration-300 tw-ease-out placeholder:tw-text-iron-500 hover:tw-ring-iron-700 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 sm:tw-leading-6"
                  value={consolidateBlockNo}
                  onChange={handleConsolidationBlockNoChange}
                />
              </div>
            </div>
          </div>
          <div className="tw-flex tw-min-w-0 tw-items-end">
            <div className="tw-w-full sm:tw-max-w-[8.375rem]">
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
