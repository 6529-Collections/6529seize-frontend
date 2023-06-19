import { useContext, useEffect, useState } from "react";
import { useRouter } from "next/router";
import {
  AllowlistOperationCode,
  AllowlistRunStatus,
  AllowlistToolResponse,
  AllowlistTransferPool,
} from "../../allowlist-tool.types";
import AllowlistToolBuilderTransferPoolsPool from "./AllowlistToolBuilderTransferPoolsPool";
import AllowlistToolExpandableTableWrapper from "../../common/AllowlistToolExpandableTableWrapper";
import AllowlistToolBuilderTransferPoolsAdd from "./AllowlistToolBuilderTransferPoolsAdd";
import AllowlistToolHistoryIcon from "../../icons/AllowlistToolHistoryIcon";
import AllowlistToolJsonIcon from "../../icons/AllowlistToolJsonIcon";
import AllowlistToolBuilderAddOperation from "../operations/AllowlistToolBuilderAddOperation";
import AllowlistToolPoolsWrapper from "../../common/pools/AllowlistToolPoolsWrapper";
import { AllowlistToolBuilderContext } from "../AllowlistToolBuilderContextWrapper";

export default function AllowlistToolBuilderTransferPools() {
  const router = useRouter();
  const { allowlist, transferPools, setTransferPools, setToasts } = useContext(
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
    async function fetchTransferPools() {
      setIsLoading(true);
      setTransferPools([]);
      try {
        const response = await fetch(
          `${process.env.ALLOWLIST_API_ENDPOINT}/allowlists/${router.query.id}/transfer-pools`
        );
        const data: AllowlistToolResponse<AllowlistTransferPool[]> =
          await response.json();
        if ("error" in data) {
          setToasts({
            messages:
              typeof data.message === "string" ? [data.message] : data.message,
            type: "error",
          });
        } else {
          setTransferPools(data);
        }
      } catch (error: any) {
        setToasts({ messages: [error.message], type: "error" });
      } finally {
        setIsLoading(false);
      }
    }

    fetchTransferPools();
  }, [router.query.id, setTransferPools, setToasts]);

  const validOperations = [AllowlistOperationCode.GET_COLLECTION_TRANSFERS];
  const defaultOperation = AllowlistOperationCode.GET_COLLECTION_TRANSFERS;

  return (
    <AllowlistToolPoolsWrapper isLoading={showLoading}>
      <AllowlistToolExpandableTableWrapper title="Transfer Pools">
        <div className="tw-w-full tw-overflow-hidden tw-h-0">
          <div className="tw-border tw-border-neutral-700/60 tw-border-solid tw-border-l-0 tw-border-r-0 tw-border-b-0 tw-w-full"></div>
          <AllowlistToolBuilderTransferPoolsAdd />
          <div className="tw-bg-neutral-900">
            <div className="tw-px-4 sm:tw-px-6 lg:tw-px-8">
              <div className="tw-mt-8 tw-flow-root">
                <div className="-tw-mx-4 tw-overflow-x-auto sm:-tw-mx-6 lg:-tw-mx-8">
                  <div className="tw-inline-block tw-min-w-full tw-py-2 tw-align-middle">
                    <table className="tw-min-w-full tw-border tw-border-solid tw-border-l-0 tw-border-r-0 tw-border-b-0 tw-border-neutral-800 tw-divide-solid tw-divide-y tw-divide-neutral-800">
                      <thead className="tw-bg-neutral-800/50">
                        <tr>
                          <th
                            scope="col"
                            className="tw-py-1.5 tw-pl-4 tw-pr-3 tw-whitespace-nowrap tw-text-left tw-text-[0.6875rem] tw-leading-[1.125rem] tw-font-medium tw-text-neutral-400 tw-uppercase tw-tracking-[0.25px] sm:tw-pl-6"
                          >
                            Pool name
                          </th>
                          <th
                            scope="col"
                            className="tw-px-3 tw-py-1.5 tw-whitespace-nowrap tw-text-left tw-text-[0.6875rem] tw-leading-[1.125rem] tw-font-medium tw-text-neutral-400 tw-uppercase tw-tracking-[0.25px]"
                          >
                            Description
                          </th>
                          <th
                            scope="col"
                            className="tw-px-3 tw-py-1.5 tw-whitespace-nowrap tw-text-left tw-text-[0.6875rem] tw-leading-[1.125rem] tw-font-medium tw-text-neutral-400 tw-uppercase tw-tracking-[0.25px]"
                          >
                            Contract number
                          </th>
                          <th
                            scope="col"
                            className="tw-px-3 tw-py-1.5 tw-whitespace-nowrap tw-text-left tw-text-[0.6875rem] tw-leading-[1.125rem] tw-font-medium tw-text-neutral-400 tw-uppercase tw-tracking-[0.25px]"
                          >
                            Block number
                          </th>
                          <th
                            scope="col"
                            className="tw-px-3 tw-py-1.5 tw-whitespace-nowrap tw-text-left tw-text-[0.6875rem] tw-leading-[1.125rem] tw-font-medium tw-text-neutral-400 tw-uppercase tw-tracking-[0.25px]"
                          >
                            Transfers count
                          </th>
                          <th
                            scope="col"
                            className="tw-w-40 tw-py-1.5 tw-pl-6 tw-pr-4 sm:tw-pr-6"
                          >
                            <div className="tw-flex tw-items-center tw-justify-end tw-gap-x-2.5">
                              <button
                                type="button"
                                className="tw-group tw-flex tw-justify-center tw-items-center tw-rounded-full tw-bg-transparent tw-h-8 tw-w-8 tw-text-white tw-border-none hover:tw-bg-neutral-700 tw-transition-all tw-duration-300 tw-ease-out"
                              >
                                <div className="tw-h-4 tw-w-4 tw-flex tw-items-center tw-justify-center">
                                  <AllowlistToolJsonIcon />
                                </div>
                              </button>
                              <AllowlistToolBuilderAddOperation
                                validOperations={validOperations}
                                title={`Transfer pools`}
                                targetItemId={null}
                                defaultOperation={defaultOperation}
                              />
                              <button
                                type="button"
                                className="tw-group tw-flex tw-justify-center tw-items-center tw-rounded-full tw-bg-transparent tw-h-8 tw-w-8 tw-text-white tw-border-none hover:tw-bg-neutral-700 tw-transition-all tw-duration-300 tw-ease-out"
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
                        {transferPools.map((transferPool) => (
                          <AllowlistToolBuilderTransferPoolsPool
                            transferPool={transferPool}
                            key={transferPool.id}
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
