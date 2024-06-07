import { QueryKey } from "../../../../../react-query-wrapper/ReactQueryWrapper";
import { useContext, useEffect } from "react";
import { AuthContext } from "../../../../../auth/Auth";
import { useQuery } from "@tanstack/react-query";
import { AllowlistDescription } from "../../../../../allowlist-tool/allowlist-tool.types";
import { commonApiFetch } from "../../../../../../services/api/common-api";
import { distributionPlanApiFetch } from "../../../../../../services/distribution-plan-api";

export default function CreateGroupWalletsEmma() {
  const { connectedProfile, requestAuth } = useContext(AuthContext);
  const { data } = useQuery<AllowlistDescription[]>({
    queryKey: [
      QueryKey.EMMA_IDENTITY_ALLOWLISTS,
      { identity: connectedProfile?.profile?.handle },
    ],
    queryFn: async () => {
      await requestAuth();
      const response = await distributionPlanApiFetch<AllowlistDescription[]>(
        "/allowlists"
      );
      return response.data ?? [];
    },
  });
  useEffect(() => console.log(data), [data]);
  return (
    <div className="tw-p-5 tw-bg-iron-900 tw-rounded-xl tw-shadow tw-border tw-border-solid tw-border-iron-800">
      <p className="tw-mb-0 tw-text-lg tw-font-semibold tw-text-iron-50">
        EMMA
      </p>
      <div className="tw-mt-4">
        <div className="tw-group tw-w-full tw-relative">
          <input
            type="text"
            id="floating_allowlist"
            className="tw-form-input tw-block tw-pb-3 tw-pt-4 tw-w-full tw-text-base tw-rounded-lg tw-border-0 tw-appearance-none tw-text-white tw-border-iron-650 focus:tw-border-blue-500 tw-peer
     tw-py-3 tw-pl-11 tw-pr-4 tw-bg-iron-900 hover:tw-bg-iron-800 focus:tw-bg-iron-900 tw-font-medium tw-caret-primary-300 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-650 placeholder:tw-text-iron-500 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 tw-transition tw-duration-300 tw-ease-out"
            placeholder=" "
          />
          <svg
            className="tw-pointer-events-none tw-absolute tw-left-4 tw-top-4 tw-h-5 tw-w-5 tw-text-iron-300"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
              clipRule="evenodd"
            ></path>
          </svg>
          <label
            htmlFor="floating_allowlist"
            className="tw-absolute tw-cursor-text tw-text-base tw-font-medium tw-text-iron-500 tw-duration-300 tw-transform -tw-translate-y-4 tw-scale-75 tw-top-2 tw-z-10 tw-origin-[0] tw-bg-iron-900 group-hover:tw-bg-iron-800 peer-focus:tw-bg-iron-900 tw-ml-8 tw-px-2 peer-focus:tw-px-2 peer-focus:tw-text-primary-400 peer-placeholder-shown:tw-scale-100 
                        peer-placeholder-shown:-tw-translate-y-1/2 peer-placeholder-shown:tw-top-1/2 peer-focus:tw-top-2 peer-focus:tw-scale-75 peer-focus:-tw-translate-y-4 rtl:peer-focus:tw-translate-x-1/4 rtl:peer-focus:tw-left-auto tw-start-1"
          >
            Search allowlist
          </label>
        </div>
      </div>
    </div>
  );
}
