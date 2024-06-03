import { useQuery } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { useClickAway, useDebounce, useKeyPressEvent } from "react-use";
import { CommunityMemberMinimal } from "../../../entities/IProfile";
import { QueryKey } from "../../react-query-wrapper/ReactQueryWrapper";
import { commonApiFetch } from "../../../services/api/common-api";
import CommonProfileSearchItems from "../input/profile-search/CommonProfileSearchItems";
const MIN_SEARCH_LENGTH = 3;
export default function SelectGroupModalSearchUser({
  value,
  setValue,
}: {
  readonly value: string | null;
  readonly setValue: (value: string | null) => void;
}) {
  const [searchCriteria, setSearchCriteria] = useState<string | null>(value);

  const [debouncedValue, setDebouncedValue] = useState<string | null>(
    searchCriteria
  );
  useDebounce(() => setDebouncedValue(searchCriteria), 200, [searchCriteria]);

  const { data } = useQuery<CommunityMemberMinimal[]>({
    queryKey: [
      QueryKey.PROFILE_SEARCH,
      {
        param: debouncedValue,
        only_profile_owners: "true",
      },
    ],
    queryFn: async () =>
      await commonApiFetch<CommunityMemberMinimal[]>({
        endpoint: "community-members",
        params: {
          param: debouncedValue ?? "",
          only_profile_owners: "true",
        },
      }),
    enabled: !!debouncedValue && debouncedValue.length >= MIN_SEARCH_LENGTH,
  });

  const [isOpen, setIsOpen] = useState(false);

  const onValueChange = (newValue: string | null) => {
    setValue(newValue);
    setSearchCriteria(newValue);
    setIsOpen(false);
  };

  const onFocusChange = (newV: boolean) => {
    if (newV) {
      setIsOpen(true);
    }
  };

  const onSearchCriteriaChange = (newV: string | null) => {
    setSearchCriteria(newV);
    if (!newV) {
      setValue(null);
    }
  };

  const wrapperRef = useRef<HTMLDivElement>(null);
  useClickAway(wrapperRef, () => setIsOpen(false));
  useKeyPressEvent("Escape", () => setIsOpen(false));
  return (
    <div className="tw-relative tw-w-full" ref={wrapperRef}>
      <svg
        className="tw-pointer-events-none tw-absolute tw-left-3 tw-top-3.5 tw-h-5 tw-w-5 tw-text-iron-300"
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
      <input
        value={searchCriteria ?? ""}
        onChange={(e) => onSearchCriteriaChange(e.target.value)}
        onFocus={() => onFocusChange(true)}
        type="text"
        placeholder="Search by user"
        className="tw-pl-11 tw-form-input tw-appearance-none tw-block tw-w-full tw-rounded-lg tw-border-0 tw-py-3 tw-pr-3 tw-bg-[#1C1D20] tw-text-iron-50 tw-font-medium tw-caret-primary-400 tw-shadow-sm tw-ring-2 tw-ring-inset tw-ring-iron-700 placeholder:tw-text-iron-500 focus:tw-outline-none focus:tw-bg-transparent focus:tw-ring-1 focus:tw-ring-inset hover:tw-ring-neutral-600 focus:tw-ring-primary-400 tw-text-base sm:tw-leading-6 tw-transition tw-duration-300 tw-ease-out"
      />
      <CommonProfileSearchItems
        open={isOpen}
        selected={value}
        profiles={data ?? []}
        onProfileSelect={(profile) =>
          onValueChange(profile?.handle ?? profile?.wallet ?? null)
        }
      />
    </div>
  );
}
