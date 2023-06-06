import { useRouter } from "next/router";
import {
  AllowlistToolResponse,
  AllowlistWalletPool,
} from "../../allowlist-tool.types";
import { use, useContext, useEffect, useState } from "react";
import AllowlistToolExpandableTableWrapper from "../../common/AllowlistToolExpandableTableWrapper";
import AllowlistToolBuilderWalletPoolsPool from "./AllowlistToolBuilderWalletPoolsPool";
import { AllowlistToolBuilderContext } from "../../../../pages/allowlist-tool/[id]";
import AllowlistToolHistoryIcon from "../../icons/AllowlistToolHistoryIcon";
import AllowlistToolJsonIcon from "../../icons/AllowlistToolJsonIcon";
import AllowlistToolPlusIcon from "../../icons/AllowlistToolPlusIcon";

export default function AllowlistToolBuilderWalletPools() {
  const router = useRouter();
  const { walletPools, setWalletPools } = useContext(
    AllowlistToolBuilderContext
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    async function fetchWalletPools() {
      setIsLoading(true);
      setErrors([]);
      setWalletPools([]);
      try {
        const response = await fetch(
          `${process.env.ALLOWLIST_API_ENDPOINT}/allowlists/${router.query.id}/wallet-pools`
        );
        const data: AllowlistToolResponse<AllowlistWalletPool[]> =
          await response.json();
        if ("error" in data) {
          typeof data.message === "string"
            ? setErrors([data.message])
            : setErrors(data.message);
        } else {
          setWalletPools(data);
        }
      } catch (error: any) {
        setErrors([error.message]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchWalletPools();
  }, [router.query.id]);

  return (
    <AllowlistToolExpandableTableWrapper title="Wallet Pools">
      <div className="tw-w-full tw-overflow-hidden tw-h-0">
        <div className="tw-border  tw-border-neutral-700/60 tw-border-solid tw-border-l-0 tw-border-r-0 tw-border-b-0 tw-w-full"></div>
        <div className="tw-px-6 tw-flex tw-gap-x-4 tw-pt-5 tw-items-end">
          <div className="tw-flex-1 tw-max-w-[15.25rem]">
            <label className="tw-block tw-text-sm tw-font-normal tw-leading-5 tw-text-neutral-100">
              Pool name
            </label>
            <div className="tw-mt-2">
              <input
                required
                className="tw-block tw-w-full tw-rounded-lg tw-border-0 tw-py-3 tw-px-3 tw-bg-neutral-800 tw-text-white tw-font-light tw-caret-primary tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-neutral-800 placeholder:tw-text-neutral-500 focus:tw-outline-none focus:tw-bg-transparent focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 tw-text-base sm:tw-leading-6 tw-transition tw-duration-300 tw-ease-out"
              />
            </div>
          </div>
          <div className="tw-flex-1 tw-max-w-[15.25rem]">
            <label className="tw-block tw-text-sm tw-font-normal tw-leading-5 tw-text-neutral-100">
              Description
            </label>
            <div className="tw-mt-2">
              <input
                required
                className="tw-block tw-w-full tw-rounded-lg tw-border-0 tw-py-3 tw-px-3 tw-bg-neutral-800 tw-text-white tw-font-light tw-caret-primary tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-neutral-800 placeholder:tw-text-neutral-500 focus:tw-outline-none focus:tw-bg-transparent focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 tw-text-base sm:tw-leading-6 tw-transition tw-duration-300 tw-ease-out"
              />
            </div>
          </div>
          <div>
            <label className="tw-cursor-pointer tw-bg-transparent hover:tw-bg-neutral-800/80 tw-px-4 tw-py-3 tw-text-sm tw-font-medium tw-text-white tw-w-full tw-border tw-border-solid tw-border-neutral-700 tw-rounded-lg tw-transition tw-duration-300 tw-ease-out">
              Upload a CSV
            </label>
          </div>
          <div>
            <button
              type="submit"
              className="tw-bg-primary-500 tw-px-4 tw-py-3 tw-text-sm tw-font-medium tw-text-white tw-w-full tw-border tw-border-solid tw-border-primary-500 tw-rounded-lg hover:tw-bg-primary-600 hover:tw-border-primary-hover tw-transition tw-duration-300 tw-ease-out"
            >
              Add wallet pool
            </button>
          </div>
        </div>
        <div className="tw-bg-neutral-900">
          <div className="tw-px-4 sm:tw-px-6 lg:tw-px-8">
            <div className="tw-mt-8 tw-flow-root">
              <div className="-tw-mx-4 -tw-my-2 tw-overflow-x-auto sm:-tw-mx-6 lg:-tw-mx-8">
                <div className="tw-inline-block tw-min-w-full tw-py-2 tw-align-middle">
                  <table className="tw-min-w-full tw-border tw-border-solid tw-border-l-0 tw-border-r-0 tw-border-b-0 tw-border-neutral-800 tw-divide-solid tw-divide-y tw-divide-neutral-800">
                    <thead className="tw-bg-neutral-800/50">
                      <tr>
                        <th
                          scope="col"
                          className="tw-py-1.5 tw-pl-4 tw-pr-3 tw-text-left tw-text-[0.6875rem] tw-leading-[1.125rem] tw-font-medium tw-text-neutral-400 tw-uppercase tw-tracking-[0.25px] sm:tw-pl-6"
                        >
                          Pool name
                        </th>
                        <th
                          scope="col"
                          className="tw-px-3 tw-py-1.5 tw-text-left tw-text-[0.6875rem] tw-leading-[1.125rem] tw-font-medium tw-text-neutral-400 tw-uppercase tw-tracking-[0.25px]"
                        >
                          Description
                        </th>
                        <th
                          scope="col"
                          className="tw-w-40 tw-py-1.5 tw-pl-6 tw-pr-4 sm:tw-pr-6"
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
                      {walletPools.map((walletPool) => (
                        <AllowlistToolBuilderWalletPoolsPool
                          walletPool={walletPool}
                          key={walletPool.id}
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
