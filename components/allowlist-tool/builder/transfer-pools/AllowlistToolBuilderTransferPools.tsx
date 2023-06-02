import { useContext, useEffect, useState } from "react";
import { useAnimate } from "framer-motion";
import { useRouter } from "next/router";
import {
  AllowlistToolResponse,
  AllowlistTransferPool,
} from "../../allowlist-tool.types";
import AllowlistToolBuilderTransferPoolsPool from "./AllowlistToolBuilderTransferPoolsPool";
import AllowlistToolExpandableTableWrapper from "../../common/AllowlistToolExpandableTableWrapper";
import AllowlistToolBuilderTransferPoolsAdd from "./AllowlistToolBuilderTransferPoolsAdd";
import { AllowlistToolBuilderContext } from "../../../../pages/allowlist-tool/[id]";

export default function AllowlistToolBuilderTransferPools() {
  const router = useRouter();
  const { transferPools, setTransferPools } = useContext(
    AllowlistToolBuilderContext
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    async function fetchTransferPools() {
      setIsLoading(true);
      setErrors([]);
      setTransferPools([]);
      try {
        const response = await fetch(
          `${process.env.ALLOWLIST_API_ENDPOINT}/allowlists/${router.query.id}/transfer-pools`
        );
        const data: AllowlistToolResponse<AllowlistTransferPool[]> =
          await response.json();
        if ("error" in data) {
          typeof data.message === "string"
            ? setErrors([data.message])
            : setErrors(data.message);
        } else {
          setTransferPools(data);
        }
      } catch (error: any) {
        setErrors([error.message]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchTransferPools();
  }, [router.query.id]);

  return (
    <AllowlistToolExpandableTableWrapper title="Transfer Pools">
      <div className="tw-w-full tw-overflow-hidden tw-h-0">
        <div className="tw-border  tw-border-neutral-700/60 tw-border-solid tw-border-l-0 tw-border-r-0 tw-border-b-0 tw-mt-5 tw-w-full"></div>
        <AllowlistToolBuilderTransferPoolsAdd />
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
                          className="tw-py-3.5 tw-pl-4 tw-pr-3 tw-text-left tw-text-[0.6875rem] tw-leading-[1.125rem] tw-font-medium tw-text-neutral-500 tw-uppercase tw-tracking-[0.25px] sm:tw-pl-6"
                        >
                          Pool name
                        </th>
                        <th
                          scope="col"
                          className="tw-px-3 tw-py-3.5 tw-text-left tw-text-[0.6875rem] tw-leading-[1.125rem] tw-font-medium tw-text-neutral-500 tw-uppercase tw-tracking-[0.25px]"
                        >
                          Description
                        </th>
                        <th
                          scope="col"
                          className="tw-px-3 tw-py-3.5 tw-text-left tw-text-[0.6875rem] tw-leading-[1.125rem] tw-font-medium tw-text-neutral-500 tw-uppercase tw-tracking-[0.25px]"
                        >
                          Contract number
                        </th>
                        <th
                          scope="col"
                          className="tw-px-3 tw-py-3.5 tw-text-left tw-text-[0.6875rem] tw-leading-[1.125rem] tw-font-medium tw-text-neutral-500 tw-uppercase tw-tracking-[0.25px]"
                        >
                          Block number
                        </th>
                        <th
                          scope="col"
                          className="tw-relative tw-py-3.5 tw-pl-3 tw-pr-4 sm:tw-pr-6"
                        ></th>
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
  );
}
