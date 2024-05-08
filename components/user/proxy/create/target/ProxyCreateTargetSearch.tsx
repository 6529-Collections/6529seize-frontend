import { Combobox } from "@headlessui/react";
import { useState } from "react";
import { CommunityMemberMinimal } from "../../../../../entities/IProfile";
import { useDebounce } from "react-use";
import { useQuery } from "@tanstack/react-query";
import { QueryKey } from "../../../../react-query-wrapper/ReactQueryWrapper";
import { commonApiFetch } from "../../../../../services/api/common-api";

const MIN_SEARCH_LENGTH = 3;
function classNames(...classes: any) {
  return classes.filter(Boolean).join(" ");
}

export default function ProxyCreateTargetSearch({
  onTargetSelect,
}: {
  readonly onTargetSelect: (target: CommunityMemberMinimal | null) => void;
}) {
  // TODO make sure that user can't select themselves (disable the option)
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState<string | null>(query);
  useDebounce(
    () => {
      setDebouncedQuery(query);
    },
    200,
    [query]
  );

  const { data: profiles } = useQuery<CommunityMemberMinimal[]>({
    queryKey: [
      QueryKey.PROFILE_SEARCH,
      {
        param: debouncedQuery,
        only_profile_owners: "true",
      },
    ],
    queryFn: async () =>
      await commonApiFetch<CommunityMemberMinimal[]>({
        endpoint: "community-members",
        params: {
          param: debouncedQuery ?? "",
          only_profile_owners: "true",
        },
      }),
    enabled: !!debouncedQuery && debouncedQuery.length >= MIN_SEARCH_LENGTH,
  });

  return (
    <Combobox as="div" value={null} onChange={onTargetSelect}>
      <Combobox.Label className="mb-0 tw-text-lg tw-font-semibold tw-text-iron-50">
        Assigned to
      </Combobox.Label>
      <div className="tw-relative tw-max-w-md tw-mt-2 lg:tw-mt-4">
        <Combobox.Input
          className="tw-form-input tw-block tw-w-full tw-rounded-lg tw-border-0 tw-py-3 tw-pl-11 tw-pr-4 tw-bg-iron-900 tw-text-iron-50 tw-font-normal tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-700 hover:tw-ring-iron-600 placeholder:tw-text-iron-500 focus:tw-outline-none focus:tw-bg-iron-900 focus:tw-ring-1 focus:tw-ring-inset  focus:tw-ring-primary-400 tw-text-base sm:text-sm tw-transition tw-duration-300 tw-ease-out"
          placeholder="Search profile"
          onChange={(event) => setQuery(event.target.value)}
          displayValue={(person: any) => person?.handle}
        />
        <svg
          className="tw-pointer-events-none tw-absolute tw-left-4 tw-top-3.5 tw-h-5 tw-w-5 tw-text-iron-300"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fill-rule="evenodd"
            d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
            clip-rule="evenodd"
          ></path>
        </svg>
        {profiles && profiles.length > 0 && (
          <Combobox.Options className="tw-list-none tw-px-2 tw-absolute tw-z-10 tw-mt-1 tw-max-h-56 tw-w-full tw-overflow-auto tw-rounded-md tw-bg-iron-800 tw-py-1 tw-text-base tw-shadow-lg tw-ring-1 tw-ring-white/10 tw-ring-opacity-5 focus:tw-outline-none sm:tw-text-sm">
            {profiles.map((profile) => (
              <Combobox.Option
                key={profile.handle}
                value={profile}
                className={({ active }) =>
                  classNames(
                    "tw-relative tw-cursor-pointer tw-select-none tw-rounded-lg tw-py-2 tw-px-2 tw-transition tw-duration-300 tw-ease-out",
                    active
                      ? "tw-bg-iron-700 tw-text-iron-50 tw-font-medium"
                      : ""
                  )
                }
              >
                {({ selected }) => (
                  <>
                    <div className="tw-flex tw-items-center">
                      <img
                        src={profile.pfp ?? ""}
                        alt=""
                        className="tw-h-6 tw-w-6 tw-flex-shrink-0 tw-rounded-full"
                      />
                      <span
                        className={classNames(
                          "tw-ml-3 tw-truncate",
                          selected && "tw-font-semibold"
                        )}
                      >
                        {profile.handle}
                      </span>
                    </div>
                  </>
                )}
              </Combobox.Option>
            ))}
          </Combobox.Options>
        )}
      </div>
    </Combobox>
  );
}
