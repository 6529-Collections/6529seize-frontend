import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { useClickAway, useDebounce, useKeyPressEvent } from "react-use";
import { CommunityMemberMinimal } from "../../../entities/IProfile";
import { commonApiFetch } from "../../../services/api/common-api";
import HeaderSearchModalItem, {
  NFTSearchResult,
  HeaderSearchModalItemType,
} from "./HeaderSearchModalItem";
import { useRouter } from "next/router";
import { getRandomObjectId } from "../../../helpers/AllowlistToolHelpers";
import { getProfileTargetRoute } from "../../../helpers/Helpers";
import { UserPageTabType } from "../../user/layout/UserPageTabs";
import { createPortal } from "react-dom";
import { QueryKey } from "../../react-query-wrapper/ReactQueryWrapper";
import type { ApiWave } from "../../../generated/models/ApiWave";
import { useWaves } from "../../../hooks/useWaves";
import useLocalPreference from "../../../hooks/useLocalPreference";
import { TabToggle } from "../../common/TabToggle";
import { ChevronLeftIcon } from "@heroicons/react/24/outline";

enum STATE {
  INITIAL = "INITIAL",
  LOADING = "LOADING",
  NO_RESULTS = "NO_RESULTS",
  SUCCESS = "SUCCESS",
}

enum CATEGORY {
  PROFILES = "PROFILES",
  NFTS = "NFTS",
  WAVES = "WAVES",
}

const MIN_SEARCH_LENGTH = 3;

export default function HeaderSearchModal({
  onClose,
}: {
  readonly onClose: () => void;
}) {
  const router = useRouter();
  const modalRef = useRef<HTMLDivElement>(null);
  useClickAway(modalRef, onClose);
  useKeyPressEvent("Escape", onClose);

  const [searchValue, setSearchValue] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useLocalPreference<CATEGORY>(
    "headerSearchCategory",
    CATEGORY.PROFILES,
    (value) => Object.values(CATEGORY).includes(value)
  );

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

  const { isFetching: isFetchingProfiles, data: profiles } = useQuery<
    CommunityMemberMinimal[]
  >({
    queryKey: [QueryKey.PROFILE_SEARCH, debouncedValue],
    queryFn: async () =>
      await commonApiFetch<CommunityMemberMinimal[]>({
        endpoint: "community-members",
        params: {
          param: debouncedValue,
        },
      }),
    enabled:
      selectedCategory === CATEGORY.PROFILES &&
      debouncedValue.length >= MIN_SEARCH_LENGTH,
  });

  const { isFetching: isFetchingNfts, data: nfts } = useQuery({
    queryKey: [QueryKey.NFTS_SEARCH, debouncedValue],
    queryFn: async () => {
      return await commonApiFetch<NFTSearchResult[]>({
        endpoint: "nfts_search",
        params: {
          search: debouncedValue,
        },
      });
    },
    enabled:
      selectedCategory === CATEGORY.NFTS &&
      (debouncedValue.length >= MIN_SEARCH_LENGTH ||
        (debouncedValue.length > 0 && !isNaN(Number(debouncedValue)))),
  });

  const { waves, isFetching: isFetchingWaves } = useWaves({
    identity: null,
    waveName:
      debouncedValue.length >= MIN_SEARCH_LENGTH ? debouncedValue : null,
    limit: 20,
  });

  const onHover = (index: number, state: boolean) => {
    if (!state) return;
    setSelectedItemIndex(index);
  };

  const goToProfile = async (profile: CommunityMemberMinimal) => {
    const handleOrWallet = profile.handle ?? profile.wallet.toLowerCase();
    const path = getProfileTargetRoute({
      handleOrWallet,
      router,
      defaultPath: UserPageTabType.IDENTITY,
    });
    await router.push(path);
    onClose();
  };

  const [selectedItemIndex, setSelectedItemIndex] = useState<number>(0);

  const getCurrentItems = (): HeaderSearchModalItemType[] => {
    if (selectedCategory === CATEGORY.NFTS) {
      return nfts ?? [];
    }
    if (selectedCategory === CATEGORY.PROFILES) {
      return profiles ?? [];
    }
    return waves ?? [];
  };

  useKeyPressEvent("ArrowDown", () =>
    setSelectedItemIndex((i) => {
      const count = getCurrentItems().length;
      return count >= i + 2 ? i + 1 : i;
    })
  );

  useKeyPressEvent("ArrowUp", () =>
    setSelectedItemIndex((i) => (i > 0 ? i - 1 : i))
  );

  useKeyPressEvent("Enter", () => {
    const items = getCurrentItems();
    if (!items || items.length === 0) return;
    const item = items[selectedItemIndex];
    if (selectedCategory === CATEGORY.NFTS) {
      const nft = item as NFTSearchResult;
      router.push(`/the-memes/${nft.id}`);
      onClose();
      return;
    }
    if (selectedCategory === CATEGORY.PROFILES) {
      const profile = item as CommunityMemberMinimal;
      goToProfile(profile);
      return;
    }
    if (selectedCategory === CATEGORY.WAVES) {
      const wave = item as ApiWave;
      const currentWaveId = router.query.wave as string | undefined;
      const target = currentWaveId === wave.id ? "/my-stream" : `/my-stream?wave=${wave.id}`;
      router.push(target, undefined, { shallow: true });
      onClose();
    }
  });

  const [state, setState] = useState<STATE>(STATE.INITIAL);

  useEffect(() => {
    setSelectedItemIndex(0);
    let fetching = false;
    let items: HeaderSearchModalItemType[] = [];
    if (selectedCategory === CATEGORY.NFTS) {
      fetching = isFetchingNfts;
      items = nfts ?? [];
    } else if (selectedCategory === CATEGORY.PROFILES) {
      fetching = isFetchingProfiles;
      items = profiles ?? [];
    } else {
      fetching = isFetchingWaves;
      items = waves ?? [];
    }

    if (fetching) {
      setState(STATE.LOADING);
      return;
    }

    if (debouncedValue.length === 0) {
      setState(STATE.INITIAL);
      return;
    }

    if (items.length === 0) {
      setState(STATE.NO_RESULTS);
      return;
    }

    setState(STATE.SUCCESS);
  }, [
    selectedCategory,
    isFetchingProfiles,
    isFetchingNfts,
    isFetchingWaves,
    profiles,
    nfts,
    waves,
    debouncedValue,
  ]);

  const activeElementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeElementRef.current) {
      activeElementRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "start",
      });
    }
  }, [selectedItemIndex]);

  const renderItems = (items: HeaderSearchModalItemType[]) =>
    items.map((item, index) => {
      const currentIndex = index;
      return (
        <div
          ref={currentIndex === selectedItemIndex ? activeElementRef : null}
          key={getRandomObjectId()}
        >
          <HeaderSearchModalItem
            content={item}
            searchValue={debouncedValue}
            isSelected={currentIndex === selectedItemIndex}
            onHover={(state) => onHover(currentIndex, state)}
            onClose={onClose}
          />
        </div>
      );
    });

  return createPortal(
    <div className="tailwind-scope tw-cursor-default tw-relative tw-z-1000">
      <div className="tw-fixed tw-inset-0 tw-bg-gray-500 tw-bg-opacity-75"></div>
      <div className="tw-fixed tw-inset-0 tw-z-1000 tw-overflow-y-auto">
        <div className="tw-flex tw-min-h-full tw-items-start tw-justify-center tw-p-2 tw-text-center sm:tw-items-center sm:tw-p-0">
          <div
            ref={modalRef}
            className="sm:tw-max-w-xl tw-relative tw-w-full tw-transform tw-rounded-xl tw-bg-iron-950 tw-text-left tw-shadow-xl tw-transition-all tw-duration-500 sm:tw-w-full tw-overflow-hidden inset-safe-area"
          >
            <div className="tw-border-b tw-border-x-0 tw-border-t-0 tw-border-solid tw-border-white/10 tw-pb-4 tw-px-4 tw-mt-4 tw-flex tw-items-center tw-gap-2">
              {/* Back arrow mobile */}
              <button
                onClick={onClose}
                aria-label="Close"
                className="tw-flex sm:tw-hidden tw-size-6 tw-bg-transparent -tw-ml-1 tw-mr-1 tw-border-none tw-rounded-full tw-items-center tw-justify-center tw-text-iron-300 hover:tw-text-iron-50 tw-transition tw-duration-200"
              >
                <ChevronLeftIcon className="tw-size-6 tw-flex-shrink-0" />
              </button>

              <div className="tw-relative tw-flex-1">
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
                  className="tw-form-input tw-block tw-w-full tw-rounded-lg tw-border-0 tw-py-3 tw-pl-11 tw-pr-4 tw-bg-iron-900 tw-text-iron-50 tw-font-normal tw-caret-primary-300 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-700 hover:tw-ring-iron-600 placeholder:tw-text-iron-500 focus:tw-outline-none focus:tw-bg-transparent focus:tw-ring-1 focus:tw-ring-inset  focus:tw-ring-primary-300 tw-text-base sm:text-sm tw-transition tw-duration-300 tw-ease-out"
                  placeholder="Search"
                />
              </div>
            </div>
            <div className="tw-pt-3 tw-px-4">
              <TabToggle
                options={Object.values(CATEGORY).map((c) => ({
                  key: c,
                  label: c.charAt(0) + c.slice(1).toLowerCase(),
                }))}
                activeKey={selectedCategory}
                onSelect={(k) => setSelectedCategory(k as CATEGORY)}
              />
            </div>

            {state === STATE.SUCCESS && (
              <div className="tw-h-72 tw-scroll-py-2 tw-px-4 tw-py-2 tw-overflow-y-auto tw-scrollbar-thin tw-scrollbar-thumb-iron-500 tw-scrollbar-track-iron-800 desktop-hover:hover:tw-scrollbar-thumb-iron-300 tw-text-sm tw-text-iron-200">
                {renderItems(getCurrentItems())}
              </div>
            )}
            {state === STATE.LOADING && (
              <div className="tw-h-72 tw-flex tw-items-center tw-justify-center">
                <p className="tw-text-iron-300 tw-font-normal tw-text-sm">
                  Loading...
                </p>
              </div>
            )}
            {state === STATE.NO_RESULTS && (
              <div className="tw-h-72 tw-flex tw-items-center tw-justify-center">
                <p className="tw-text-iron-300 tw-text-sm">No results found</p>
              </div>
            )}
            {state === STATE.INITIAL && (
              <div className="tw-h-72 tw-flex tw-items-center tw-justify-center">
                <p className="tw-text-iron-300 tw-font-normal tw-text-sm tw-text-center">
                  Search for NFTs (by ID or name), Profiles and Waves
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
