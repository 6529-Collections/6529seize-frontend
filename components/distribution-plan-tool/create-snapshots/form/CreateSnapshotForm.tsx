"use client";

import { useContext, useEffect, useState } from "react";
import { DistributionPlanToolContext } from "../../DistributionPlanToolContext";
import {
  getRandomObjectId,
  isEthereumAddress,
} from "../../../../helpers/AllowlistToolHelpers";
import {
  AllowlistOperationCode,
  DistributionPlanSearchContractMetadataResult,
} from "../../../allowlist-tool/allowlist-tool.types";
import styles from "../../DistributionPlan.module.scss";
import DistributionPlanAddOperationBtn from "../../common/DistributionPlanAddOperationBtn";
import Tippy from "@tippyjs/react";
import CreateSnapshotFormSearchCollection from "./CreateSnapshotFormSearchCollection";
import {
  distributionPlanApiFetch,
  distributionPlanApiPost,
} from "../../../../services/distribution-plan-api";
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
      return null;
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
      tokenIds?: string;
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
      const { success, data } = await distributionPlanApiFetch<number>(
        endpoint
      );
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
    window.open("https://etherscan.io/", "_blank");
  };

  return (
    <>
      <CreateSnapshotFormSearchCollection setCollection={setCollection} />
      <form
        className="tw-flex tw-flex-wrap tw-gap-y-5 tw-mt-8"
        onSubmit={handleSubmit}>
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
              <div onClick={goToEtherScan}>
                <Tippy
                  content="Use etherscan.io to find previous block numbers"
                  placement="top"
                  theme="dark">
                  <svg
                    className="tw-h-5 tw-w-5 tw-text-neutral-500 tw-cursor-pointer"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M12 16V12M12 8H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </Tippy>
              </div>
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
          <div className="tw-flex-1 tw-mt-4">
            <label className="tw-block tw-text-sm tw-font-normal tw-leading-5 tw-text-neutral-100">
              <label className="tw-flex tw-items-center tw-gap-x-2 tw-text-sm tw-font-normal tw-leading-5 tw-text-neutral-100">
                <span>Token ID(s)</span>
                <Tippy
                  content="Example: 1,3,54-78"
                  placement="top"
                  theme="dark">
                  <svg
                    className="tw-h-5 tw-w-5 tw-text-neutral-500 tw-cursor-pointer"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg">
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
                <div className="tw-block tw-text-sm tw-font-normal tw-leading-5 tw-text-neutral-100">
                  <span className="tw-font-medium tw-text-neutral-100">
                    Consolidation block number
                  </span>
                  <div className="tw-mt-0.5 tw-text-xs tw-text-neutral-400">
                    Leave empty if you don&apos;t want to consolidate.
                  </div>
                </div>
                <div className="tw-mt-2">
                  <input
                    type="text"
                    autoComplete="off"
                    placeholder="Consolidate block number"
                    className="tw-form-input tw-block tw-w-full tw-rounded-lg tw-border-0 tw-py-3 tw-px-3 tw-bg-neutral-700/40 tw-text-white tw-font-light tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-neutral-700/40 placeholder:tw-text-neutral-500 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 hover:tw-ring-neutral-700 tw-text-base sm:tw-leading-6 tw-transition tw-duration-300 tw-ease-out"
                    value={consolidateBlockNo}
                    onChange={handleConsolidationBlockNoChange}
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
