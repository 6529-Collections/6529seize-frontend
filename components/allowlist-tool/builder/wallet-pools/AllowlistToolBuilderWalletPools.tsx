import { useRouter } from "next/router";
import {
  AllowlistOperationCode,
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
import AllowlistToolBuilderWalletPoolsAdd from "./AllowlistToolBuilderWalletPoolsAdd";
import AllowlistToolBuilderAddOperation from "../operations/AllowlistToolBuilderAddOperation";

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


  const validOperations = [AllowlistOperationCode.CREATE_WALLET_POOL];
  const defaultOperation = AllowlistOperationCode.CREATE_WALLET_POOL;

  return (
    <AllowlistToolExpandableTableWrapper title="Wallet Pools">
      <div className="tw-w-full tw-overflow-hidden tw-h-0">
        <div className="tw-border tw-border-neutral-800 tw-border-solid tw-border-l-0 tw-border-r-0 tw-border-b-0  tw-w-full"></div>

        <AllowlistToolBuilderWalletPoolsAdd />
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
                            <AllowlistToolBuilderAddOperation
                              validOperations={validOperations}
                              title={`Add operation for wallet pools`}
                              targetItemId={null}
                              defaultOperation={defaultOperation}
                            />
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
                    <tbody className="tw-divide-y tw-divide-neutral-800">
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
