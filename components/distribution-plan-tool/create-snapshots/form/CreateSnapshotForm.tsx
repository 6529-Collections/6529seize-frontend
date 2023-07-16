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
    <form className="tw-flex tw-flex-wrap tw-gap-y-5" onSubmit={handleSubmit}>
      <div className="tw-relative tw-w-full">
        <div className="tw-max-w-md">
          <div className="tw-pointer-events-none tw-absolute tw-inset-y-0 tw-flex tw-items-center tw-pl-3">
            <svg
              className="tw-h-5 tw-w-5 tw-text-neutral-300"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M21 21L16.65 16.65M19 11C19 15.4183 15.4183 19 11 19C6.58172 19 3 15.4183 3 11C3 6.58172 6.58172 3 11 3C15.4183 3 19 6.58172 19 11Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <input
            type="text"
            name="name"
            placeholder="Search NFT collection"
            className="tw-block tw-w-full tw-rounded-lg tw-pl-10 tw-border-0 tw-py-3 tw-px-3 tw-bg-neutral-700/40 focus:tw-bg-transparent tw-text-white tw-font-light tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-neutral-700/40 placeholder:tw-text-neutral-500 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 tw-text-base sm:tw-leading-6 tw-transition tw-duration-300 tw-ease-out"
          />
        </div>
        <div className="tw-absolute tw-z-10 tw-mt-1 tw-overflow-hidden tw-max-w-md tw-w-full tw-rounded-md tw-bg-neutral-900 tw-shadow-lg tw-ring-1 tw-ring-white/10">
          <div className="tw-py-1 tw-flow-root tw-max-h-[calc(240px+_-5vh)] tw-overflow-x-hidden tw-overflow-y-auto">
            <div>
              <table className="tw-min-w-full">
                <thead className="tw-border-b tw-border-solid tw-border-x-0 tw-border-t-0 tw-border-neutral-700/60">
                  <tr>
                    <th
                      scope="col"
                      className="tw-whitespace-nowrap tw-py-2.5 tw-pl-4 tw-pr-3 tw-text-left tw-text-xs tw-font-medium tw-text-neutral-400"
                    >
                      Collection
                    </th>
                    <th
                      scope="col"
                      className="tw-whitespace-nowrap tw-px-3 tw-py-2.5 tw-text-right tw-text-xs tw-font-medium tw-text-neutral-400"
                    >
                      All time volume
                    </th>
                    <th
                      scope="col"
                      className="tw-whitespace-nowrap tw-pl-3 tw-pr-4 tw-py-2.5 tw-text-right tw-text-xs tw-font-medium tw-text-neutral-400"
                    >
                      Floor
                    </th>
                  </tr>
                </thead>
                <tbody className="tw-divide-y tw-divide-neutral-700/60">
                  <tr className="tw-cursor-pointer hover:tw-bg-neutral-800 tw-duration-300 tw-ease-out">
                    <td className="tw-whitespace-nowrap tw-py-2.5 tw-pl-4 tw-pr-3">
                      <div className="tw-flex tw-items-center tw-gap-x-2">
                        <img
                          src="#"
                          alt=""
                          className="tw-bg-neutral-700 tw-rounded tw-h-6 tw-w-6"
                        />
                        <span className="tw-text-sm tw-font-medium tw-text-neutral-200">
                          Collection name
                        </span>
                        <svg
                          className="tw-h-4 tw-w-4"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 512 512"
                        >
                          {/* <! Font Awesome Pro 6.4.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. */}
                          <path
                            fill="#ffffff"
                            d="M369 175c9.4 9.4 9.4 24.6 0 33.9L241 337c-9.4 9.4-24.6 9.4-33.9 0l-64-64c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0l47 47L335 175c9.4-9.4 24.6-9.4 33.9 0z"
                          />
                          <path
                            fill="#2081e2"
                            d="M256 0c36.8 0 68.8 20.7 84.9 51.1C373.8 41 411 49 437 75s34 63.3 23.9 96.1C491.3 187.2 512 219.2 512 256s-20.7 68.8-51.1 84.9C471 373.8 463 411 437 437s-63.3 34-96.1 23.9C324.8 491.3 292.8 512 256 512s-68.8-20.7-84.9-51.1C138.2 471 101 463 75 437s-34-63.3-23.9-96.1C20.7 324.8 0 292.8 0 256s20.7-68.8 51.1-84.9C41 138.2 49 101 75 75s63.3-34 96.1-23.9C187.2 20.7 219.2 0 256 0zM369 209c9.4-9.4 9.4-24.6 0-33.9s-24.6-9.4-33.9 0l-111 111-47-47c-9.4-9.4-24.6-9.4-33.9 0s-9.4 24.6 0 33.9l64 64c9.4 9.4 24.6 9.4 33.9 0L369 209z"
                          />
                        </svg>
                        <span className="tw-uppercase tw-text-xs tw-text-neutral-500 tw-mt-0.5">
                          Erc 721
                        </span>
                      </div>
                    </td>
                    <td className="tw-whitespace-nowrap tw-px-3 tw-py-2.5 tw-text-right tw-text-sm tw-font-medium tw-text-neutral-200">
                      <div className="tw-flex tw-items-center tw-justify-end tw-gap-x-1.5">
                        <span>1245</span>
                        <svg
                          className="tw-h-4 tw-w-auto"
                          viewBox="0 0 1080 1760"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            opacity="0.6"
                            d="M539.8 650.9L0 896.3L539.8 1215.4L1079.7 896.3L539.8 650.9Z"
                            fill="#B6B6B6"
                          />
                          <path
                            opacity="0.45"
                            d="M0.199951 896.3L540 1215.4V650.9V0.600098L0.199951 896.3Z"
                            fill="#B6B6B6"
                          />
                          <path
                            opacity="0.8"
                            d="M540 0.600098V650.9V1215.4L1079.8 896.3L540 0.600098Z"
                            fill="#B6B6B6"
                          />
                          <path
                            opacity="0.45"
                            d="M0 998.7L539.8 1759.4V1317.6L0 998.7Z"
                            fill="#B6B6B6"
                          />
                          <path
                            opacity="0.8"
                            d="M539.8 1317.6V1759.4L1080 998.7L539.8 1317.6Z"
                            fill="#B6B6B6"
                          />
                        </svg>
                      </div>
                    </td>
                    <td className="tw-whitespace-nowrap tw-pl-2 tw-pr-4 tw-py-2.5 tw-text-right tw-text-sm tw-font-medium  tw-text-neutral-200">
                      <div className="tw-flex tw-items-center tw-justify-end tw-gap-x-1.5">
                        <span>0.16</span>
                        <svg
                          className="tw-h-4 tw-w-auto"
                          viewBox="0 0 1080 1760"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            opacity="0.6"
                            d="M539.8 650.9L0 896.3L539.8 1215.4L1079.7 896.3L539.8 650.9Z"
                            fill="#B6B6B6"
                          />
                          <path
                            opacity="0.45"
                            d="M0.199951 896.3L540 1215.4V650.9V0.600098L0.199951 896.3Z"
                            fill="#B6B6B6"
                          />
                          <path
                            opacity="0.8"
                            d="M540 0.600098V650.9V1215.4L1079.8 896.3L540 0.600098Z"
                            fill="#B6B6B6"
                          />
                          <path
                            opacity="0.45"
                            d="M0 998.7L539.8 1759.4V1317.6L0 998.7Z"
                            fill="#B6B6B6"
                          />
                          <path
                            opacity="0.8"
                            d="M539.8 1317.6V1759.4L1080 998.7L539.8 1317.6Z"
                            fill="#B6B6B6"
                          />
                        </svg>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="tw-pt-1">
              <table className="tw-min-w-full">
                <thead className="tw-border-y tw-border-solid tw-border-x-0 tw-border-neutral-700/60">
                  <tr>
                    <th
                      scope="col"
                      className="tw-whitespace-nowrap tw-py-2.5 tw-pl-4 tw-pr-3 tw-text-left tw-text-xs tw-font-medium tw-text-neutral-400"
                    >
                      Memes collections
                    </th>
                    <th
                      scope="col"
                      className="tw-whitespace-nowrap tw-px-3 tw-py-2.5 tw-text-right tw-text-xs tw-font-medium tw-text-neutral-400"
                    >
                      All time volume
                    </th>
                    <th
                      scope="col"
                      className="tw-whitespace-nowrap tw-pl-3 tw-pr-4 tw-py-2.5 tw-text-right tw-text-xs tw-font-medium tw-text-neutral-400"
                    >
                      Floor
                    </th>
                  </tr>
                </thead>
                <tbody className="tw-divide-y tw-divide-neutral-700/60">
                  <tr className="tw-cursor-pointer tw-rounded hover:tw-bg-neutral-800 tw-duration-300 tw-ease-out">
                    <td className="tw-whitespace-nowrap tw-py-2.5 tw-pl-4 tw-pr-3">
                      <div className="tw-flex tw-items-center tw-gap-x-2">
                        <img
                          src="#"
                          alt=""
                          className="tw-bg-neutral-700 tw-rounded tw-h-6 tw-w-6"
                        />
                        <span className="tw-text-sm tw-font-medium tw-text-neutral-200">
                          Collection name
                        </span>
                        <svg
                          className="tw-h-4 tw-w-4"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 512 512"
                        >
                          {/* <! Font Awesome Pro 6.4.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. */}
                          <path
                            fill="#ffffff"
                            d="M369 175c9.4 9.4 9.4 24.6 0 33.9L241 337c-9.4 9.4-24.6 9.4-33.9 0l-64-64c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0l47 47L335 175c9.4-9.4 24.6-9.4 33.9 0z"
                          />
                          <path
                            fill="#2081e2"
                            d="M256 0c36.8 0 68.8 20.7 84.9 51.1C373.8 41 411 49 437 75s34 63.3 23.9 96.1C491.3 187.2 512 219.2 512 256s-20.7 68.8-51.1 84.9C471 373.8 463 411 437 437s-63.3 34-96.1 23.9C324.8 491.3 292.8 512 256 512s-68.8-20.7-84.9-51.1C138.2 471 101 463 75 437s-34-63.3-23.9-96.1C20.7 324.8 0 292.8 0 256s20.7-68.8 51.1-84.9C41 138.2 49 101 75 75s63.3-34 96.1-23.9C187.2 20.7 219.2 0 256 0zM369 209c9.4-9.4 9.4-24.6 0-33.9s-24.6-9.4-33.9 0l-111 111-47-47c-9.4-9.4-24.6-9.4-33.9 0s-9.4 24.6 0 33.9l64 64c9.4 9.4 24.6 9.4 33.9 0L369 209z"
                          />
                        </svg>
                        <span className="tw-uppercase tw-text-xs tw-text-neutral-500 tw-mt-0.5">
                          Erc 721
                        </span>
                      </div>
                    </td>
                    <td className="tw-whitespace-nowrap tw-px-3 tw-py-2.5 tw-text-right tw-text-sm tw-font-medium tw-text-neutral-200">
                      <div className="tw-flex tw-items-center tw-justify-end tw-gap-x-1.5">
                        <span>1245</span>
                        <svg
                          className="tw-h-4 tw-w-auto"
                          viewBox="0 0 1080 1760"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            opacity="0.6"
                            d="M539.8 650.9L0 896.3L539.8 1215.4L1079.7 896.3L539.8 650.9Z"
                            fill="#B6B6B6"
                          />
                          <path
                            opacity="0.45"
                            d="M0.199951 896.3L540 1215.4V650.9V0.600098L0.199951 896.3Z"
                            fill="#B6B6B6"
                          />
                          <path
                            opacity="0.8"
                            d="M540 0.600098V650.9V1215.4L1079.8 896.3L540 0.600098Z"
                            fill="#B6B6B6"
                          />
                          <path
                            opacity="0.45"
                            d="M0 998.7L539.8 1759.4V1317.6L0 998.7Z"
                            fill="#B6B6B6"
                          />
                          <path
                            opacity="0.8"
                            d="M539.8 1317.6V1759.4L1080 998.7L539.8 1317.6Z"
                            fill="#B6B6B6"
                          />
                        </svg>
                      </div>
                    </td>
                    <td className="tw-whitespace-nowrap tw-pl-2 tw-pr-4 tw-py-2.5 tw-text-right tw-text-sm tw-font-medium  tw-text-neutral-200">
                      <div className="tw-flex tw-items-center tw-justify-end tw-gap-x-1.5">
                        <span>0.16</span>
                        <svg
                          className="tw-h-4 tw-w-auto"
                          viewBox="0 0 1080 1760"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            opacity="0.6"
                            d="M539.8 650.9L0 896.3L539.8 1215.4L1079.7 896.3L539.8 650.9Z"
                            fill="#B6B6B6"
                          />
                          <path
                            opacity="0.45"
                            d="M0.199951 896.3L540 1215.4V650.9V0.600098L0.199951 896.3Z"
                            fill="#B6B6B6"
                          />
                          <path
                            opacity="0.8"
                            d="M540 0.600098V650.9V1215.4L1079.8 896.3L540 0.600098Z"
                            fill="#B6B6B6"
                          />
                          <path
                            opacity="0.45"
                            d="M0 998.7L539.8 1759.4V1317.6L0 998.7Z"
                            fill="#B6B6B6"
                          />
                          <path
                            opacity="0.8"
                            d="M539.8 1317.6V1759.4L1080 998.7L539.8 1317.6Z"
                            fill="#B6B6B6"
                          />
                        </svg>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
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
              className="tw-block tw-w-full tw-rounded-lg tw-border-0 tw-py-3 tw-px-3 tw-bg-neutral-700/40 tw-text-white tw-font-light tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-neutral-700/40 placeholder:tw-text-neutral-500 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 tw-text-base sm:tw-leading-6 tw-transition tw-duration-300 tw-ease-out"
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
              className="tw-block tw-w-full tw-rounded-lg tw-border-0 tw-py-3 tw-px-3 tw-bg-neutral-700/40 tw-text-white tw-font-light tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-neutral-700/40 placeholder:tw-text-neutral-500 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 tw-text-base sm:tw-leading-6 tw-transition tw-duration-300 tw-ease-out"
            />
          </div>
        </div>
        {/* <div className="tw-flex-1">
        <CreateSnapshotFormSearchCollection setCollection={setCollection} />
      </div> */}
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
              className={`tw-block tw-w-full tw-rounded-lg tw-border-0 tw-py-3 tw-px-3 tw-bg-neutral-700/40 tw-text-white tw-font-light tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-neutral-700/40 placeholder:tw-text-neutral-500 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 tw-text-base sm:tw-leading-6 tw-transition tw-duration-300 tw-ease-out ${styles.numberInput}`}
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
              className="tw-block tw-w-full tw-rounded-lg tw-border-0 tw-py-3 tw-px-3 tw-bg-neutral-700/40 tw-text-white tw-font-light tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-neutral-700/40 placeholder:tw-text-neutral-500 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 tw-text-base sm:tw-leading-6 tw-transition tw-duration-300 tw-ease-out"
            />
          </div>
        </div>
        <div className="tw-self-end">
          <DistributionPlanAddOperationBtn loading={isLoading}>
            Add snapshot
          </DistributionPlanAddOperationBtn>
        </div>
      </div>
    </form>
  );
}
