"use client";

import { useEffect, useMemo, useRef, useState, type RefObject } from "react";

import { useMyStreamOptional } from "@/contexts/wave/MyStreamContext";
import type { CommunityMemberMinimal } from "@/entities/IProfile";
import type { ApiWave } from "@/generated/models/ApiWave";
import { getProfileTargetRoute } from "@/helpers/Helpers";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import { USER_PAGE_TAB_IDS } from "@/components/user/layout/userTabs.config";
import { usePathname, useRouter } from "next/navigation";
import { useKeyPressEvent } from "react-use";

import HeaderSearchModalItem, {
  getHeaderSearchWavePath,
  getNftCollectionMap,
  isHeaderSearchWaveDirectMessage,
} from "../HeaderSearchModalItem";
import { HeaderSearchTabToggle } from "../HeaderSearchTabToggle";
import type {
  HeaderSearchModalItemType,
  NFTSearchResult,
  PageSearchResult,
} from "../HeaderSearchModalItem";
import {
  CATEGORY,
  CATEGORY_LABELS,
  CATEGORY_PREVIEW_LIMIT,
  HEADER_SEARCH_RESULTS_PANEL_ID,
  isFilterableCategory,
  STATE,
  type FilterableCategory,
} from "./constants";

interface PreviewGroupItem {
  readonly item: HeaderSearchModalItemType;
  readonly index: number;
}

interface PreviewGroup {
  readonly category: FilterableCategory;
  readonly items: PreviewGroupItem[];
  readonly total: number;
}

const isPageResult = (
  item: HeaderSearchModalItemType
): item is PageSearchResult =>
  (item as { readonly type?: unknown }).type === "PAGE";

const isNftResult = (
  item: HeaderSearchModalItemType
): item is NFTSearchResult => Object.hasOwn(item, "contract");

const isProfileResult = (
  item: HeaderSearchModalItemType
): item is CommunityMemberMinimal => Object.hasOwn(item, "wallet");

const isWaveResult = (item: HeaderSearchModalItemType): item is ApiWave =>
  Object.hasOwn(item, "serial_no");

const getHeaderSearchItemKey = (item: HeaderSearchModalItemType): string => {
  if (isPageResult(item)) {
    return `page:${item.href}`;
  }
  if (isNftResult(item)) {
    return `nft:${item.contract}:${item.id}`;
  }
  if (isProfileResult(item)) {
    const base = (item.profile_id ?? item.wallet).toLowerCase();
    return `profile:${base}`;
  }
  if (isWaveResult(item)) {
    return `wave:${item.id}`;
  }
  return JSON.stringify(item);
};

interface HeaderSearchSiteResultsProps {
  readonly selectedCategory: CATEGORY;
  readonly setSelectedCategory: (category: CATEGORY) => void;
  readonly resultsByCategory: Record<
    FilterableCategory,
    HeaderSearchModalItemType[]
  >;
  readonly categoriesWithResults: readonly FilterableCategory[];
  readonly derivedState: STATE;
  readonly debouncedValue: string;
  readonly onClose: () => void;
  readonly onRetry: () => void;
  readonly isFetchingProfiles: boolean;
  readonly isFetchingNfts: boolean;
  readonly isFetchingWaves: boolean;
  readonly shouldShowCountdown: boolean;
  readonly charactersRemaining: number;
  readonly resultsPanelRef: RefObject<HTMLDivElement | null>;
}

export function HeaderSearchSiteResults({
  selectedCategory,
  setSelectedCategory,
  resultsByCategory,
  categoriesWithResults,
  derivedState,
  debouncedValue,
  onClose,
  onRetry,
  isFetchingProfiles,
  isFetchingNfts,
  isFetchingWaves,
  shouldShowCountdown,
  charactersRemaining,
  resultsPanelRef,
}: HeaderSearchSiteResultsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const myStream = useMyStreamOptional();
  const { isApp } = useDeviceInfo();
  const [selectedItemIndex, setSelectedItemIndex] = useState<number>(0);
  const activeElementRef = useRef<HTMLDivElement>(null);

  const tabOptions = useMemo(
    () =>
      [CATEGORY.ALL, ...categoriesWithResults].map((category) => ({
        key: category,
        label:
          category === CATEGORY.ALL
            ? "All"
            : CATEGORY_LABELS[category as FilterableCategory],
        panelId: HEADER_SEARCH_RESULTS_PANEL_ID,
      })),
    [categoriesWithResults]
  );

  const shouldRenderCategoryToggle =
    categoriesWithResults.length > 0 || selectedCategory !== CATEGORY.ALL;

  const previewGroups = useMemo<PreviewGroup[]>(() => {
    if (selectedCategory !== CATEGORY.ALL) {
      return [];
    }

    let runningIndex = 0;
    return categoriesWithResults.map<PreviewGroup>((category) => {
      const items = resultsByCategory[category];
      const previewItems = items
        .slice(0, CATEGORY_PREVIEW_LIMIT)
        .map((item) => ({ item, index: runningIndex++ }));

      return {
        category,
        items: previewItems,
        total: items.length,
      };
    });
  }, [categoriesWithResults, resultsByCategory, selectedCategory]);

  const flattenedItems = useMemo(() => {
    if (selectedCategory === CATEGORY.ALL) {
      return previewGroups.flatMap((group) =>
        group.items.map((entry) => entry.item)
      );
    }

    if (isFilterableCategory(selectedCategory)) {
      return resultsByCategory[selectedCategory];
    }

    return [];
  }, [previewGroups, resultsByCategory, selectedCategory]);

  const handleCategorySelect = (category: CATEGORY) => {
    setSelectedCategory(category);
    setSelectedItemIndex(0);
  };

  const handleTabSelect = (key: string) => {
    handleCategorySelect(key as CATEGORY);
  };

  const handleViewAll = (category: FilterableCategory) => {
    handleCategorySelect(category);
  };

  const onHover = (index: number, state: boolean) => {
    if (!state) return;
    setSelectedItemIndex(index);
  };

  const goToProfile = (profile: CommunityMemberMinimal) => {
    const handleOrWallet = profile.handle ?? profile.wallet.toLowerCase();
    const path = getProfileTargetRoute({
      handleOrWallet,
      pathname: pathname,
      defaultPath: USER_PAGE_TAB_IDS.REP,
    });
    router.push(path);
    onClose();
  };

  const goToWave = (wave: ApiWave) => {
    const isDirectMessage = isHeaderSearchWaveDirectMessage(wave);

    if (myStream) {
      myStream.activeWave.set(wave.id, { isDirectMessage });
    } else {
      router.push(
        getHeaderSearchWavePath({
          wave,
          isApp,
        })
      );
    }

    onClose();
  };

  useKeyPressEvent("ArrowDown", () =>
    setSelectedItemIndex((index) =>
      index + 1 < flattenedItems.length ? index + 1 : index
    )
  );

  useKeyPressEvent("ArrowUp", () =>
    setSelectedItemIndex((index) => (index > 0 ? index - 1 : index))
  );

  useKeyPressEvent("Enter", () => {
    if (derivedState !== STATE.SUCCESS) return;
    const item = flattenedItems[selectedItemIndex];
    if (!item) return;

    if (isPageResult(item)) {
      router.push(item.href);
      onClose();
      return;
    }

    if (isNftResult(item)) {
      const collectionMap = getNftCollectionMap();
      const key = item.contract.toLowerCase();
      const collection = collectionMap[key];
      if (!collection) return;
      router.push(`${collection.path}/${item.id}`);
      onClose();
      return;
    }

    if (isProfileResult(item)) {
      goToProfile(item);
      return;
    }

    if (isWaveResult(item)) {
      goToWave(item);
    }
  });

  useEffect(() => {
    if (activeElementRef.current) {
      activeElementRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "start",
      });
    }
  }, [selectedItemIndex]);

  const renderItem = (item: HeaderSearchModalItemType, index: number) => (
    <div
      ref={index === selectedItemIndex ? activeElementRef : null}
      key={getHeaderSearchItemKey(item)}
    >
      <HeaderSearchModalItem
        content={item}
        searchValue={debouncedValue}
        isSelected={index === selectedItemIndex}
        onHover={(state) => onHover(index, state)}
        onClose={onClose}
        onWaveSelect={goToWave}
      />
    </div>
  );

  const renderItems = (items: HeaderSearchModalItemType[], offset = 0) =>
    items.map((item, index) => renderItem(item, offset + index));

  const renderSuccessContent = () => {
    if (selectedCategory === CATEGORY.ALL) {
      return previewGroups.map((group) => (
        <section key={group.category} className="tw-mb-4 last:tw-mb-0">
          <div className="tw-mb-2 tw-flex tw-items-center tw-justify-between">
            <h3 className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide tw-text-iron-400">
              {CATEGORY_LABELS[group.category]}
            </h3>
            {group.total > group.items.length && (
              <button
                type="button"
                onClick={() => handleViewAll(group.category)}
                className="tw-inline-flex tw-items-center tw-rounded-full tw-border tw-border-iron-700 tw-bg-iron-900 tw-px-2.5 tw-py-1 tw-text-xs tw-font-medium tw-text-iron-200 tw-transition tw-duration-150 hover:tw-border-iron-500 hover:tw-bg-iron-800 hover:tw-text-white"
              >
                View all {CATEGORY_LABELS[group.category]}
              </button>
            )}
          </div>
          <div className="tw-space-y-1.5">
            {group.items.map(({ item, index }) => renderItem(item, index))}
          </div>
        </section>
      ));
    }

    if (isFilterableCategory(selectedCategory)) {
      return renderItems(resultsByCategory[selectedCategory]);
    }

    return null;
  };

  const isRetryPending =
    (selectedCategory === CATEGORY.NFTS && isFetchingNfts) ||
    (selectedCategory === CATEGORY.PROFILES && isFetchingProfiles) ||
    (selectedCategory === CATEGORY.WAVES && isFetchingWaves);

  const renderResultsPanel = () => {
    if (derivedState === STATE.SUCCESS) {
      return (
        <div
          ref={resultsPanelRef}
          id={HEADER_SEARCH_RESULTS_PANEL_ID}
          role="tabpanel"
          className="tw-h-0 tw-min-h-0 tw-flex-1 tw-scroll-py-2 tw-overflow-y-auto tw-px-4 tw-pb-3 tw-pt-5 tw-text-sm tw-text-iron-200 tw-scrollbar-thin tw-scrollbar-track-iron-800 tw-scrollbar-thumb-iron-500 desktop-hover:hover:tw-scrollbar-thumb-iron-300 md:tw-pl-0 md:tw-pr-4"
        >
          {renderSuccessContent()}
        </div>
      );
    }

    if (derivedState === STATE.LOADING) {
      return (
        <div
          ref={resultsPanelRef}
          id={HEADER_SEARCH_RESULTS_PANEL_ID}
          role="tabpanel"
          className="tw-flex tw-h-0 tw-min-h-0 tw-flex-1 tw-items-center tw-justify-center tw-px-4 md:tw-px-0"
        >
          <p className="tw-text-sm tw-font-normal tw-text-iron-300">
            Loading...
          </p>
        </div>
      );
    }

    if (derivedState === STATE.NO_RESULTS) {
      return (
        <div
          ref={resultsPanelRef}
          id={HEADER_SEARCH_RESULTS_PANEL_ID}
          role="tabpanel"
          className="tw-flex tw-h-0 tw-min-h-0 tw-flex-1 tw-items-center tw-justify-center tw-px-4 md:tw-px-0"
        >
          <p className="tw-text-sm tw-text-iron-300">No results found</p>
        </div>
      );
    }

    if (derivedState === STATE.ERROR) {
      return (
        <div
          ref={resultsPanelRef}
          id={HEADER_SEARCH_RESULTS_PANEL_ID}
          role="tabpanel"
          className="tw-flex tw-h-0 tw-min-h-0 tw-flex-1 tw-flex-col tw-items-center tw-justify-center tw-gap-3 tw-px-4 tw-text-center md:tw-px-0"
        >
          <p
            className="tw-text-sm tw-font-normal tw-text-iron-300"
            aria-live="polite"
          >
            Something went wrong while searching. Please try again.
          </p>
          <button
            type="button"
            onClick={onRetry}
            disabled={isRetryPending}
            aria-busy={isRetryPending ? true : undefined}
            className="tw-items-center tw-rounded-full tw-border tw-border-iron-300 tw-bg-iron-100 tw-px-3 tw-py-1.5 tw-font-medium tw-text-iron-800 tw-transition tw-duration-150 hover:tw-border-iron-500 hover:tw-bg-iron-200"
          >
            Try Again
          </button>
        </div>
      );
    }

    return (
      <div
        ref={resultsPanelRef}
        id={HEADER_SEARCH_RESULTS_PANEL_ID}
        role="tabpanel"
        className="tw-flex tw-h-0 tw-min-h-0 tw-flex-1 tw-items-center tw-justify-center tw-px-4 md:tw-px-0"
      >
        <p className="tw-text-center tw-text-sm tw-font-normal tw-text-iron-300">
          Start typing to search 6529.io
          {shouldShowCountdown &&
            ` (${charactersRemaining} more character${
              charactersRemaining === 1 ? "" : "s"
            })`}
        </p>
      </div>
    );
  };

  return (
    <>
      {shouldRenderCategoryToggle && (
        <div className="tw-px-4 tw-py-3 md:tw-hidden">
          <HeaderSearchTabToggle
            options={tabOptions}
            activeKey={selectedCategory}
            onSelect={handleTabSelect}
            fullWidth
          />
        </div>
      )}

      <div
        className={`tw-flex tw-min-h-0 tw-flex-1 tw-flex-col md:tw-gap-4 md:tw-px-5 md:tw-pb-5 ${
          shouldRenderCategoryToggle
            ? "md:tw-grid md:tw-grid-cols-[12rem_minmax(0,1fr)]"
            : "md:tw-flex-row"
        }`}
      >
        {shouldRenderCategoryToggle && (
          <aside className="tw-hidden md:tw-flex md:tw-flex-col md:tw-gap-2 md:tw-pt-5">
            <div className="tw-flex tw-flex-col tw-gap-2 tw-rounded-2xl tw-border tw-border-iron-900/60 tw-bg-iron-950/80">
              <HeaderSearchTabToggle
                options={tabOptions}
                activeKey={selectedCategory}
                onSelect={handleTabSelect}
                fullWidth
                orientation="vertical"
              />
            </div>
          </aside>
        )}
        <div className="tw-flex tw-min-h-0 tw-flex-1 tw-flex-col md:tw-min-w-0">
          {renderResultsPanel()}
        </div>
      </div>
    </>
  );
}
