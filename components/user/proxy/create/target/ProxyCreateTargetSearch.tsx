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
  selectedTarget,
  onTargetSelect,
}: {
  readonly selectedTarget: CommunityMemberMinimal | null;
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
    <Combobox as="div" value={selectedTarget} onChange={onTargetSelect}>
      <Combobox.Label className="tw-block tw-text-sm tw-font-medium tw-leading-6 tw-text-gray-900">
        Assigned to
      </Combobox.Label>
      <div className="tw-relative tw-mt-2">
        <Combobox.Input
          className="tw-w-full tw-rounded-md tw-border-0 tw-bg-white tw-py-1.5 tw-pl-3 tw-pr-12 tw-text-gray-900 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-gray-300 focus:tw-ring-2 focus:tw-ring-inset focus:tw-ing-indigo-600 sm:tw-text-sm sm:tw-leading-6"
          onChange={(event) => setQuery(event.target.value)}
          displayValue={(person: any) => person?.handle}
        />
        <Combobox.Button className="tw-absolute tw-inset-y-0 tw-right-0 tw-flex tw-items-center tw-rounded-r-md tw-px-2 focus:tw-outline-none">
          chev up icon
        </Combobox.Button>

        {profiles && profiles.length > 0 && (
          <Combobox.Options className="tw-absolute tw-z-10 tw-mt-1 tw-max-h-56 tw-w-full tw-overflow-auto tw-rounded-md tw-bg-white tw-py-1 tw-text-base tw-shadow-lg tw-ring-1 tw-ring-black tw-ring-opacity-5 focus:tw-outline-none sm:tw-text-sm">
            {profiles.map((profile) => (
              <Combobox.Option
                key={profile.handle}
                value={profile}
                className={({ active }) =>
                  classNames(
                    "tw-relative tw-cursor-default tw-select-none tw-py-2 tw-pl-3 tw-pr-9",
                    active
                      ? "tw-bg-indigo-600 tw-text-white"
                      : "tw-text-gray-900"
                  )
                }
              >
                {({ active, selected }) => (
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

                    {selected && (
                      <span
                        className={classNames(
                          "tw-absolute tw-inset-y-0 tw-right-0 tw-flex tw-items-center tw-pr-4",
                          active ? "tw-text-white" : "tw-text-indigo-600"
                        )}
                      >
                        check icon
                      </span>
                    )}
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
