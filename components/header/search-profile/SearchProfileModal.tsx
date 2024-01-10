import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { useClickAway, useDebounce, useKeyPressEvent } from "react-use";
import { CommunityMemberMinimal } from "../../../entities/IProfile";
import { QueryKey } from "../../react-query-wrapper/ReactQueryWrapper";
import { commonApiFetch } from "../../../services/api/common-api";
import SearchProfileModalItem from "./SearchProfileModalItem";
import { useRouter } from "next/router";
import { getRandomObjectId } from "../../../helpers/AllowlistToolHelpers";

enum STATE {
  INITIAL = "INITIAL",
  LOADING = "LOADING",
  NO_RESULTS = "NO_RESULTS",
  SUCCESS = "SUCCESS",
}

const MIN_SEARCH_LENGTH = 3;

export default function SearchProfileModal({
  onClose,
}: {
  readonly onClose: () => void;
}) {
  const router = useRouter();
  const modalRef = useRef<HTMLDivElement>(null);
  useClickAway(modalRef, onClose);
  useKeyPressEvent("Escape", onClose);

  const [searchValue, setSearchValue] = useState<string>("");

  const [debouncedValue, setDebouncedValue] = useState<string>("");
  useDebounce(
    () => {
      setDebouncedValue(searchValue);
    },
    500,
    [searchValue]
  );

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    setSearchValue(newValue);
  };

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const { isFetching, data: profiles } = useQuery<CommunityMemberMinimal[]>({
    queryKey: [QueryKey.PROFILE_SEARCH, debouncedValue],
    queryFn: async () =>
      await commonApiFetch<CommunityMemberMinimal[]>({
        endpoint: "community-members",
        params: {
          param: debouncedValue,
        },
      }),
    enabled: debouncedValue.length >= MIN_SEARCH_LENGTH,
  });

  const onHover = (index: number, state: boolean) => {
    if (!state) return;
    setSelectedProfileIndex(index);
  };

  const goToProfile = async (profile: CommunityMemberMinimal) => {
    const target = profile.handle ?? profile.wallet.toLowerCase();
    if (router.route.includes("[user]")) {
      const newPath = router.pathname.replace("[user]", target);
      await router.replace(newPath);
    } else {
      await router.push(`/${target}/identity`);
    }
    onClose();
  };

  const [selectedProfileIndex, setSelectedProfileIndex] = useState<number>(0);
  useKeyPressEvent("ArrowDown", () =>
    setSelectedProfileIndex((i) =>
      profiles && profiles.length >= i + 2 ? i + 1 : i
    )
  );
  useKeyPressEvent("ArrowUp", () =>
    setSelectedProfileIndex((i) => (i > 0 ? i - 1 : i))
  );
  useKeyPressEvent("Enter", () => {
    if (profiles && profiles.length > 0) {
      const profile = profiles[selectedProfileIndex];
      if (!profile) {
        return;
      }
      goToProfile(profile);
    }
  });

  const [state, setState] = useState<STATE>(STATE.INITIAL);

  useEffect(() => {
    setSelectedProfileIndex(0);
    if (isFetching) {
      setState(STATE.LOADING);
    } else if (profiles?.length === 0) {
      setState(STATE.NO_RESULTS);
    } else if (profiles && profiles?.length > 0) {
      setState(STATE.SUCCESS);
    } else {
      setState(STATE.INITIAL);
    }
  }, [isFetching, profiles]);

  const activeElementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeElementRef.current) {
      activeElementRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "start",
      });
    }
  }, [selectedProfileIndex]);

  return (
    <div className="tw-cursor-default tw-relative tw-z-10">
      <div className="tw-fixed tw-inset-0 tw-bg-gray-500 tw-bg-opacity-75"></div>
      <div className="tw-fixed tw-inset-0 tw-z-10 tw-overflow-y-auto">
        <div className="tw-flex tw-min-h-full tw-items-start tw-justify-center tw-p-4 tw-text-center sm:tw-items-center sm:tw-p-0">
          <div
            ref={modalRef}
            className="sm:tw-max-w-xl tw-relative tw-w-full tw-transform tw-rounded-xl tw-bg-iron-900 tw-text-left tw-shadow-xl tw-transition-all tw-duration-500 sm:tw-w-full tw-overflow-hidden"
          >
            <div className="tw-border-b tw-border-x-0 tw-border-t-0 tw-border-solid tw-border-white/10 tw-pb-4 tw-px-4 tw-mt-4">
              <div className="tw-relative">
                <svg
                  className="tw-pointer-events-none tw-absolute tw-left-4 tw-top-3.5 tw-h-5 tw-w-5 tw-text-iron-300"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
                    clipRule="evenodd"
                  />
                </svg>
                <input
                  ref={inputRef}
                  type="text"
                  required
                  autoComplete="off"
                  value={searchValue}
                  onChange={handleInputChange}
                  className="tw-form-input tw-block tw-w-full tw-rounded-lg tw-border-0 tw-py-3 tw-pl-11 tw-pr-4 tw-bg-white/5 tw-text-white tw-font-medium tw-caret-primary-300 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-white/10 placeholder:tw-text-iron-500 focus:tw-outline-none focus:tw-bg-transparent focus:tw-ring-1 focus:tw-ring-inset hover:tw-ring-iron-700 focus:tw-ring-primary-300 tw-text-base sm:text-sm tw-transition tw-duration-300 tw-ease-out"
                  placeholder="Search"
                />
              </div>
            </div>

            {state === STATE.SUCCESS && (
              <div className="tw-h-72 tw-scroll-py-2 tw-px-4 tw-py-2 tw-overflow-y-auto tw-text-sm tw-text-iron-200">
                {profiles?.map((profile, i) => (
                  <div
                    ref={i === selectedProfileIndex ? activeElementRef : null}
                    key={getRandomObjectId()}
                  >
                    <SearchProfileModalItem
                      profile={profile}
                      goToProfile={goToProfile}
                      searchValue={debouncedValue}
                      isSelected={i === selectedProfileIndex}
                      onHover={(state) => onHover(i, state)}
                    />
                  </div>
                ))}
              </div>
            )}
            {state === STATE.LOADING && (
              <div className="tw-h-72 tw-flex tw-items-center tw-justify-center">
                <p className="tw-text-iron-200 tw-font-normal tw-text-sm">
                  Loading...
                </p>
              </div>
            )}
            {state === STATE.NO_RESULTS && (
              <div className="tw-h-72 tw-flex tw-items-center tw-justify-center">
                <p className="tw-text-iron-200 tw-text-sm">No results found</p>
              </div>
            )}
            {state === STATE.INITIAL && (
              <div className="tw-h-72 tw-flex tw-items-center tw-justify-center">
                <p className="tw-text-iron-200 tw-font-normal tw-text-sm">
                  {searchValue.length >= MIN_SEARCH_LENGTH
                    ? "No results found"
                    : "Type at least 3 characters"}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
