"use client";

import { Combobox } from "@headlessui/react";
import { useContext, useEffect, useState } from "react";
import type { CommunityMemberMinimal } from "@/entities/IProfile";
import { useDebounce } from "react-use";
import { useQuery } from "@tanstack/react-query";
import { commonApiFetch } from "@/services/api/common-api";
import type { ApiProfileProxy } from "@/generated/models/ApiProfileProxy";
import { AuthContext } from "@/components/auth/Auth";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";

const MIN_SEARCH_LENGTH = 3;
function classNames(...classes: any) {
  return classes.filter(Boolean).join(" ");
}

export default function ProxyCreateTargetSearch({
  profileProxy,
  loading,
  onTargetSelect,
}: {
  readonly profileProxy: ApiProfileProxy | null;
  readonly loading: boolean;
  readonly onTargetSelect: (target: CommunityMemberMinimal | null) => void;
}) {
  const { connectedProfile } = useContext(AuthContext);
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

  const getFilteredProfiles = () => {
    if (!profiles?.length) {
      return [];
    }
    if (!connectedProfile) {
      return [];
    }
    return profiles.filter(
      (profile) => profile.handle !== connectedProfile.handle
    );
  };

  const [filteredProfiles, setFilteredProfiles] = useState<
    CommunityMemberMinimal[]
  >(getFilteredProfiles());

  useEffect(
    () => setFilteredProfiles(getFilteredProfiles()),
    [profiles, connectedProfile]
  );

  return (
    <Combobox as="div" value={null} onChange={onTargetSelect}>
      <Combobox.Label className="mb-0 tw-text-lg tw-font-semibold tw-text-iron-50">
        Assigned to
      </Combobox.Label>
      {profileProxy ? (
        <div className="tw-mt-3">
          <div className="tw-flex tw-items-center tw-gap-x-3">
            {profileProxy.granted_to.pfp ? (
              <img
                src={profileProxy.granted_to.pfp}
                alt="Profile picture"
                className="tw-flex-shrink-0 tw-h-6 tw-w-6 tw-flex-none tw-rounded-lg tw-bg-iron-800 tw-ring-1 tw-ring-white/30"
              />
            ) : (
              <div className="tw-flex-shrink-0 tw-h-6 tw-w-6 tw-flex-none tw-rounded-lg tw-bg-iron-800 tw-ring-1 tw-ring-white/30"></div>
            )}
            <span className="tw-font-semibold tw-text-iron-50 tw-text-base">
              {profileProxy.granted_to.handle}
            </span>
            <button
              type="button"
              aria-label="Remove selected profile"
              onClick={() => onTargetSelect(null)}
              className="tw-bg-transparent tw-h-8 tw-w-8 tw-flex tw-items-center tw-justify-center tw-rounded-full tw-border-0 focus:tw-outline-none hover:tw-bg-iron-800 tw-transition tw-duration-300 tw-ease-out">
              <svg
                className="tw-flex-shrink-0 tw-h-5 tw-w-5 tw-text-red"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M18 6L6 18M6 6L18 18"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>
      ) : (
        <div className="tw-relative tw-mt-4 tw-max-w-xs">
          <Combobox.Input
            className="tw-form-input tw-block tw-w-80 tw-rounded-lg tw-border-0 tw-py-3 tw-pl-11 tw-pr-4 tw-bg-iron-900 tw-text-iron-50 tw-font-normal tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-700 hover:tw-ring-iron-600 placeholder:tw-text-iron-500 focus:tw-outline-none focus:tw-bg-iron-900 active:tw-fill-none focus:tw-ring-1 focus:tw-ring-inset  focus:tw-ring-primary-400 tw-text-base sm:text-sm tw-transition tw-duration-300 tw-ease-out"
            placeholder="Search profile"
            autoComplete="off"
            onChange={(event) => setQuery(event.target.value)}
            displayValue={(person: any) => person?.handle}
          />
          <svg
            className="tw-pointer-events-none tw-absolute tw-left-4 tw-top-3.5 tw-h-5 tw-w-5 tw-text-iron-300"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true">
            <path
              fillRule="evenodd"
              d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
              clipRule="evenodd"></path>
          </svg>
          {!!filteredProfiles.length && (
            <Combobox.Options className="tw-list-none tw-px-2 tw-absolute tw-z-10 tw-mt-1 tw-max-h-56 tw-w-full tw-overflow-auto tw-rounded-md tw-bg-iron-800 tw-py-1 tw-text-base tw-shadow-lg tw-ring-1 tw-ring-white/10 tw-ring-opacity-5 focus:tw-outline-none sm:tw-text-sm">
              {filteredProfiles.map((profile) => (
                <Combobox.Option
                  key={profile.handle}
                  value={profile}
                  disabled={loading}
                  className={({ active }) =>
                    classNames(
                      "tw-relative tw-cursor-pointer tw-select-none tw-rounded-lg tw-py-2 tw-px-2 tw-transition tw-duration-300 tw-ease-out",
                      active
                        ? "tw-bg-iron-700 tw-text-iron-50 tw-font-medium"
                        : ""
                    )
                  }>
                  {({ selected }) => (
                    <div className="tw-flex tw-items-center">
                      {profile.pfp ? (
                        <img
                          src={profile.pfp}
                          alt="Profile picture"
                          className="tw-h-6 tw-w-6 tw-flex-shrink-0 tw-rounded-full"
                        />
                      ) : (
                        <div className="tw-flex-shrink-0 tw-h-6 tw-w-6 tw-flex-none tw-rounded-lg tw-bg-iron-800 tw-ring-1 tw-ring-white/30"></div>
                      )}
                      <span
                        className={classNames(
                          "tw-ml-3 tw-truncate",
                          selected && "tw-font-semibold"
                        )}>
                        {profile.handle}
                      </span>
                    </div>
                  )}
                </Combobox.Option>
              ))}
            </Combobox.Options>
          )}
        </div>
      )}
    </Combobox>
  );
}
