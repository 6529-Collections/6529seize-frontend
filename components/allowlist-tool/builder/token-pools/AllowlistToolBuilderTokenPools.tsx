import { useRouter } from "next/router";
import { useContext, useEffect, useState } from "react";
import {
  AllowlistTokenPool,
  AllowlistToolResponse,
} from "../../allowlist-tool.types";
import AllowlistToolExpandableTableWrapper from "../../common/AllowlistToolExpandableTableWrapper";
import AllowlistToolBuilderTokenPoolsPool from "./AllowlistToolBuilderTokenPoolsPool";
import { AllowlistToolBuilderContext } from "../../../../pages/allowlist-tool/[id]";
import AllowlistToolHistoryIcon from "../../icons/AllowlistToolHistoryIcon";
import AllowlistToolJsonIcon from "../../icons/AllowlistToolJsonIcon";
import AllowlistToolPlusIcon from "../../icons/AllowlistToolPlusIcon";

export default function AllowlistToolBuilderTokenPools() {
  const router = useRouter();
  const { tokenPools, setTokenPools } = useContext(AllowlistToolBuilderContext);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    async function fetchTokenPools() {
      setIsLoading(true);
      setErrors([]);
      setTokenPools([]);
      try {
        const response = await fetch(
          `${process.env.ALLOWLIST_API_ENDPOINT}/allowlists/${router.query.id}/token-pools`
        );
        const data: AllowlistToolResponse<AllowlistTokenPool[]> =
          await response.json();
        if ("error" in data) {
          typeof data.message === "string"
            ? setErrors([data.message])
            : setErrors(data.message);
        } else {
          setTokenPools(data);
        }
      } catch (error: any) {
        setErrors([error.message]);
      } finally {
        setIsLoading(false);
      }
    }
    fetchTokenPools();
  }, [router.query.id]);
  return (
    <AllowlistToolExpandableTableWrapper title="Token Pools">
      <div className="tw-w-full tw-overflow-hidden tw-h-0">
        <div className="tw-border  tw-border-neutral-700/60 tw-border-solid tw-border-l-0 tw-border-r-0 tw-border-b-0 tw-mt-5 tw-w-full"></div>
        <div className="tw-px-6 tw-flex tw-gap-x-4 tw-pt-5 tw-items-end">
          <div className="tw-flex-1">
            <label className="tw-block tw-text-sm tw-font-normal tw-leading-5 tw-text-neutral-100">
              Pool name
            </label>
            <div className="tw-mt-2">
              <input
                required
                className="tw-block tw-w-full tw-rounded-lg tw-border-0 tw-py-3 tw-px-3 tw-bg-[#2D2E32] tw-text-white tw-font-light tw-caret-primary tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-neutral-700 placeholder:tw-text-neutral-500 focus:tw-outline-none focus:tw-bg-transparent focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-focus tw-text-base sm:tw-leading-6 tw-transition tw-duration-300 tw-ease-out"
              />
            </div>
          </div>
          <div className="tw-flex-1">
            <label className="tw-block tw-text-sm tw-font-normal tw-leading-5 tw-text-neutral-100">
              Description
            </label>
            <div className="tw-mt-2">
              <input
                required
                className="tw-block tw-w-full tw-rounded-lg tw-border-0 tw-py-3 tw-px-3 tw-bg-[#2D2E32] tw-text-white tw-font-light tw-caret-primary tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-neutral-700 placeholder:tw-text-neutral-500 focus:tw-outline-none focus:tw-bg-transparent focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-focus tw-text-base sm:tw-leading-6 tw-transition tw-duration-300 tw-ease-out"
              />
            </div>
          </div>
          <div className="tw-flex-1">
            <label className="tw-block tw-text-sm tw-font-normal tw-leading-5 tw-text-neutral-100">
              Transfer pool
            </label>
            <div className="tw-mt-2">
              <input
                required
                className="tw-block tw-w-full tw-rounded-lg tw-border-0 tw-py-3 tw-px-3 tw-bg-[#2D2E32] tw-text-white tw-font-light tw-caret-primary tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-neutral-700  placeholder:tw-text-neutral-500 focus:tw-outline-none focus:tw-bg-transparent focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-focus tw-text-base sm:tw-leading-6 tw-transition tw-duration-300 tw-ease-out"
              />
            </div>
          </div>
          <div className="tw-flex-1">
            <label className="tw-block tw-text-sm tw-font-normal tw-leading-5 tw-text-neutral-100">
              Token ID(s)
            </label>
            <div className="tw-mt-2">
              <input
                required
                className="tw-block tw-w-full tw-rounded-lg tw-border-0 tw-py-3 tw-px-3 tw-bg-[#2D2E32] tw-text-white tw-font-light tw-caret-primary tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-neutral-700  placeholder:tw-text-neutral-500 focus:tw-outline-none focus:tw-bg-transparent focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-focus tw-text-base sm:tw-leading-6 tw-transition tw-duration-300 tw-ease-out"
              />
            </div>
          </div>
          <div>
            <button
              type="submit"
              className="tw-bg-primary tw-px-4 tw-py-3 tw-text-sm tw-font-medium tw-text-white tw-w-full tw-border tw-border-solid tw-border-primary tw-rounded-lg hover:tw-bg-primary-hover hover:tw-border-primary-hover tw-transition tw-duration-300 tw-ease-out"
            >
              Add token pool
            </button>
          </div>
        </div>
        <div className="tw-bg-[#1E1E23]">
          <div className="tw-px-4 sm:tw-px-6 lg:tw-px-8">
            <div className="tw-mt-8 tw-flow-root">
              <div className="-tw-mx-4 -tw-my-2 tw-overflow-x-auto sm:-tw-mx-6 lg:-tw-mx-8">
                <div className="tw-inline-block tw-min-w-full tw-py-2 tw-align-middle">
                  <table className="tw-min-w-full tw-border tw-border-solid tw-border-l-0 tw-border-r-0 tw-border-b-0 tw-border-neutral-700/60 tw-divide-solid tw-divide-y tw-divide-neutral-700/60">
                    <thead className="tw-bg-[#222327]">
                      <tr>
                        <th
                          scope="col"
                          className="tw-py-2 tw-pl-4 tw-pr-3 tw-text-left tw-text-[0.6875rem] tw-leading-[1.125rem] tw-font-medium tw-text-neutral-500 tw-uppercase tw-tracking-[0.25px] sm:tw-pl-6"
                        >
                          Pool name
                        </th>
                        <th
                          scope="col"
                          className="tw-px-3 tw-py-2 tw-text-left tw-text-[0.6875rem] tw-leading-[1.125rem] tw-font-medium tw-text-neutral-500 tw-uppercase tw-tracking-[0.25px]"
                        >
                          Description
                        </th>
                        <th
                          scope="col"
                          className="tw-px-3 tw-py-2 tw-text-left tw-text-[0.6875rem] tw-leading-[1.125rem] tw-font-medium tw-text-neutral-500 tw-uppercase tw-tracking-[0.25px]"
                        >
                          Transfer pool
                        </th>
                        <th
                          scope="col"
                          className="tw-px-3 tw-py-2 tw-text-left tw-text-[0.6875rem] tw-leading-[1.125rem] tw-font-medium tw-text-neutral-500 tw-uppercase tw-tracking-[0.25px]"
                        >
                          Token ID(s)
                        </th>
                        <th
                          scope="col"
                          className="tw-w-40 tw-py-2 tw-pl-6 tw-pr-4 sm:tw-pr-6"
                        >
                          <div className="tw-flex tw-items-center tw-justify-end tw-gap-x-3">
                            <button
                              type="button"
                              className="tw-group tw-rounded-full tw-bg-transparent tw-p-2 tw-text-white tw-border-none hover:tw-bg-neutral-700 tw-transition-all tw-duration-300 tw-ease-out"
                            >
                              <div className="tw-h-[1.125rem] tw-w-[1.125rem] tw-flex tw-items-center tw-justify-center">
                                <AllowlistToolJsonIcon />
                              </div>
                            </button>
                            <button
                              type="button"
                              className="tw-group tw-rounded-full tw-bg-transparent tw-p-2 tw-text-white tw-border-none hover:tw-bg-neutral-700 tw-transition-all tw-duration-300 tw-ease-out"
                            >
                              <div className="tw-h-5 tw-w-5 tw-flex tw-items-center tw-justify-center">
                                <AllowlistToolPlusIcon />
                              </div>
                            </button>
                            <button
                              type="button"
                              className="tw-group tw-rounded-full tw-bg-transparent tw-p-2 tw-text-white tw-border-none hover:tw-bg-neutral-700 tw-transition-all tw-duration-300 tw-ease-out"
                            >
                              <div className="tw-h-5 tw-w-5 tw-flex tw-items-center tw-justify-center">
                                <AllowlistToolHistoryIcon />
                              </div>
                            </button>
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="tw-divide-y tw-divide-neutral-700/40">
                      {tokenPools.map((tokenPool) => (
                        <AllowlistToolBuilderTokenPoolsPool
                          tokenPool={tokenPool}
                          key={tokenPool.id}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AllowlistToolExpandableTableWrapper>
  );
}
