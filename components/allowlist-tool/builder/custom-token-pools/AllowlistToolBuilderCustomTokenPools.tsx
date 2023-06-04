import { useRouter } from "next/router";
import {
  AllowlistCustomTokenPool,
  AllowlistToolResponse,
} from "../../allowlist-tool.types";
import { useContext, useEffect, useState } from "react";
import AllowlistToolExpandableTableWrapper from "../../common/AllowlistToolExpandableTableWrapper";
import AllowlistToolBuilderCustomTokenPoolsPool from "./AllowlistToolBuilderCustomTokenPoolsPool";
import { AllowlistToolBuilderContext } from "../../../../pages/allowlist-tool/[id]";
import csvParser from "csv-parser";
import AllowlistToolHistoryIcon from "../../icons/AllowlistToolHistoryIcon";
import AllowlistToolJsonIcon from "../../icons/AllowlistToolJsonIcon";
import AllowlistToolPlusIcon from "../../icons/AllowlistToolPlusIcon";

export default function AllowlistToolBuilderCustomTokenPools() {
  const router = useRouter();
  const { customTokenPools, setCustomTokenPools } = useContext(
    AllowlistToolBuilderContext
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    async function fetchCustomTokenPools() {
      setIsLoading(true);
      setErrors([]);
      setCustomTokenPools([]);
      try {
        const response = await fetch(
          `${process.env.ALLOWLIST_API_ENDPOINT}/allowlists/${router.query.id}/custom-token-pools`
        );
        const data: AllowlistToolResponse<AllowlistCustomTokenPool[]> =
          await response.json();
        if ("error" in data) {
          typeof data.message === "string"
            ? setErrors([data.message])
            : setErrors(data.message);
        } else {
          setCustomTokenPools(data);
        }
      } catch (error: any) {
        setErrors([error.message]);
      } finally {
        setIsLoading(false);
      }
    }
    fetchCustomTokenPools();
  }, [router.query.id]);

  const onFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async () => {
        const data = reader.result;
        const results: any[] = [];

        const parser = csvParser({ headers: true })
          .on("data", (row: any) => {
            results.push(row["_1"]);
          })
          .on("end", () => {
            console.log(results);
          })
          .on("error", (err: any) => {
            console.error(err);
          });

        parser.write(data);
        parser.end();
      };
      reader.readAsText(file);
    }
  };

  return (
    <AllowlistToolExpandableTableWrapper title="Custom Token Pools">
      <div className="tw-w-full tw-overflow-hidden tw-h-0">
        <div className="tw-border tw-border-neutral-700/60 tw-border-solid tw-border-l-0 tw-border-r-0 tw-border-b-0 tw-mt-5 tw-w-full"></div>
        <div className="tw-px-6 tw-flex tw-gap-x-4 tw-pt-5 tw-items-end">
          <div className="tw-flex-1 tw-max-w-[15.25rem]">
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
          <div className="tw-flex-1 tw-max-w-[15.25rem]">
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
          <div>
            <label
              htmlFor="fileInput"
              className="tw-cursor-pointer tw-bg-transparent hover:tw-bg-neutral-800/80 tw-px-4 tw-py-3 tw-text-sm tw-font-medium tw-text-white tw-w-full tw-border tw-border-solid tw-border-neutral-700 tw-rounded-lg tw-transition tw-duration-300 tw-ease-out"
            >
              Upload a file
            </label>
            <input
              id="fileInput"
              type="file"
              accept="text/csv"
              className="tw-hidden"
              onChange={onFileUpload}
            />
          </div>

          <div>
            <button
              type="submit"
              className="tw-bg-primary tw-px-4 tw-py-3 tw-text-sm tw-font-medium tw-text-white tw-w-full tw-border tw-border-solid tw-border-primary tw-rounded-lg hover:tw-bg-primary-hover hover:tw-border-primary-hover tw-transition tw-duration-300 tw-ease-out"
            >
              Add custom token pool
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
                      {customTokenPools.map((customTokenPool) => (
                        <AllowlistToolBuilderCustomTokenPoolsPool
                          customTokenPool={customTokenPool}
                          key={customTokenPool.id}
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
