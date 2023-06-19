import { useRouter } from "next/router";
import { useContext, useEffect, useState } from "react";
import {
  AllowlistOperationCode,
  AllowlistRunStatus,
  AllowlistTokenPool,
  AllowlistToolResponse,
} from "../../allowlist-tool.types";
import AllowlistToolExpandableTableWrapper from "../../common/AllowlistToolExpandableTableWrapper";
import AllowlistToolBuilderTokenPoolsPool from "./AllowlistToolBuilderTokenPoolsPool";
import { AllowlistToolBuilderContext } from "../../../../pages/allowlist-tool/[id]";
import AllowlistToolHistoryIcon from "../../icons/AllowlistToolHistoryIcon";
import AllowlistToolJsonIcon from "../../icons/AllowlistToolJsonIcon";
import AllowlistToolBuilderTokenPoolsAdd from "./AllowlistToolBuilderTokenPoolsAdd";
import AllowlistToolBuilderAddOperation from "../operations/AllowlistToolBuilderAddOperation";
import AllowlistToolPoolsWrapper from "../../common/pools/AllowlistToolPoolsWrapper";

export default function AllowlistToolBuilderTokenPools() {
  const router = useRouter();
  const { allowlist, tokenPools, setTokenPools, setToasts } = useContext(
    AllowlistToolBuilderContext
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showLoading, setShowLoading] = useState<boolean>(true);

  useEffect(() => {
    setShowLoading(
      isLoading ||
        (!!allowlist?.activeRun?.status &&
          [AllowlistRunStatus.PENDING, AllowlistRunStatus.CLAIMED].includes(
            allowlist?.activeRun?.status
          ))
    );
  }, [isLoading, allowlist]);

  useEffect(() => {
    async function fetchTokenPools() {
      setIsLoading(true);
      setTokenPools([]);
      try {
        const response = await fetch(
          `${process.env.ALLOWLIST_API_ENDPOINT}/allowlists/${router.query.id}/token-pools`
        );
        const data: AllowlistToolResponse<AllowlistTokenPool[]> =
          await response.json();
        if ("error" in data) {
          setToasts({
            messages:
              typeof data.message === "string" ? [data.message] : data.message,
            type: "error",
          });
        } else {
          setTokenPools(data);
        }
      } catch (error: any) {
        setToasts({ messages: [error.message], type: "error" });
      } finally {
        setIsLoading(false);
      }
    }
    fetchTokenPools();
  }, [router.query.id, setTokenPools, setToasts]);

  const validOperations = [AllowlistOperationCode.CREATE_TOKEN_POOL];
  const defaultOperation = AllowlistOperationCode.CREATE_TOKEN_POOL;

  const [isOpen, setIsOpen] = useState<boolean>(false);

  return (
    <AllowlistToolPoolsWrapper isLoading={showLoading}>
      <AllowlistToolExpandableTableWrapper
        title="Token Pools"
        onStateChange={setIsOpen}
      >
        <div
          className={`tw-w-full tw-h-0 ${isOpen ? "" : "tw-overflow-hidden"}`}
        >
          <div className="tw-border tw-border-neutral-700/60 tw-border-solid tw-border-l-0 tw-border-r-0 tw-border-b-0 tw-w-full"></div>
          <AllowlistToolBuilderTokenPoolsAdd />
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
                            className="tw-px-3 tw-py-1.5 tw-text-left tw-text-[0.6875rem] tw-leading-[1.125rem] tw-font-medium tw-text-neutral-400 tw-uppercase tw-tracking-[0.25px]"
                          >
                            Transfer pool
                          </th>
                          <th
                            scope="col"
                            className="tw-px-3 tw-py-1.5 tw-text-left tw-text-[0.6875rem] tw-leading-[1.125rem] tw-font-medium tw-text-neutral-400 tw-uppercase tw-tracking-[0.25px]"
                          >
                            Token ID(s)
                          </th>
                          <th
                            scope="col"
                            className="tw-px-3 tw-py-1.5 tw-whitespace-nowrap tw-text-left tw-text-[0.6875rem] tw-leading-[1.125rem] tw-font-medium tw-text-neutral-400 tw-uppercase tw-tracking-[0.25px]"
                          >
                            Wallets
                          </th>
                          <th
                            scope="col"
                            className="tw-px-3 tw-py-1.5 tw-whitespace-nowrap tw-text-left tw-text-[0.6875rem] tw-leading-[1.125rem] tw-font-medium tw-text-neutral-400 tw-uppercase tw-tracking-[0.25px]"
                          >
                            Tokens
                          </th>
                          <th
                            scope="col"
                            className="tw-w-40 tw-py-1.5 tw-pl-6 tw-pr-4 sm:tw-pr-6"
                          >
                            <div className="tw-flex tw-items-center tw-justify-end tw-gap-x-2.5">
                              <button
                                type="button"
                                className="tw-group tw-flex tw-items-center tw-justify-center tw-rounded-full tw-bg-transparent tw-h-8 tw-w-8 tw-text-white tw-border-none hover:tw-bg-neutral-700 tw-transition-all tw-duration-300 tw-ease-out"
                              >
                                <div className="tw-h-4 tw-w-4 tw-flex tw-items-center tw-justify-center">
                                  <AllowlistToolJsonIcon />
                                </div>
                              </button>
                              <AllowlistToolBuilderAddOperation
                                validOperations={validOperations}
                                title={`Token pools`}
                                targetItemId={null}
                                defaultOperation={defaultOperation}
                              />
                              <button
                                type="button"
                                className="tw-group tw-flex tw-items-center tw-justify-center tw-rounded-full tw-bg-transparent tw-h-8 tw-w-8 tw-text-white tw-border-none hover:tw-bg-neutral-700 tw-transition-all tw-duration-300 tw-ease-out"
                              >
                                <div className="tw-h-[1.125rem] tw-w-[1.125rem] tw-flex tw-items-center tw-justify-center">
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
    </AllowlistToolPoolsWrapper>
  );
}
