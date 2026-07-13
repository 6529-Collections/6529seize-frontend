"use client";

import {
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import { usePathname, useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type RefObject,
} from "react";

import { USER_PAGE_TAB_IDS } from "@/components/user/layout/userTabs.config";
import { useMyStreamOptional } from "@/contexts/wave/MyStreamContext";
import type { CommunityMemberMinimal } from "@/entities/IProfile";
import type { ApiWave } from "@/generated/models/ApiWave";
import { getProfileTargetRoute } from "@/helpers/Helpers";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatInteger } from "@/i18n/format";
import { t } from "@/i18n/messages";

import HeaderSearchModalItem, {
  getHeaderSearchWavePath,
  getNftCollectionMap,
  isHeaderSearchWaveDirectMessage,
  type HeaderSearchModalItemType,
  type NFTSearchResult,
  type PageSearchResult,
} from "../HeaderSearchModalItem";
import { HeaderSearchTabToggle } from "../HeaderSearchTabToggle";
import {
  CATEGORY,
  CATEGORY_PREVIEW_LIMIT,
  FILTERABLE_CATEGORIES,
  HEADER_SEARCH_RESULTS_LISTBOX_ID,
  HEADER_SEARCH_RESULTS_PANEL_ID,
  STATE,
  isFilterableCategory,
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

type InputKeyHandler = (event: ReactKeyboardEvent<HTMLInputElement>) => void;

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
  if (isPageResult(item)) return `page:${item.href}`;
  if (isNftResult(item)) return `nft:${item.contract}:${item.id}`;
  if (isProfileResult(item)) {
    return `profile:${(item.profile_id ?? item.wallet).toLowerCase()}`;
  }
  if (isWaveResult(item)) return `wave:${item.id}`;
  return JSON.stringify(item);
};

const getResultOptionId = (index: number) => `header-search-result-${index}`;
interface HeaderSearchSiteResultsProps {
  readonly selectedCategory: CATEGORY;
  readonly setSelectedCategory: (category: CATEGORY) => void;
  readonly resultsByCategory: Record<
    FilterableCategory,
    HeaderSearchModalItemType[]
  >;
  readonly categoryErrors: Record<FilterableCategory, boolean>;
  readonly categoryFetching: Record<FilterableCategory, boolean>;
  readonly derivedState: STATE;
  readonly searchValue: string;
  readonly liveSearchValue: string;
  readonly onClose: () => void;
  readonly onRetry: (categories: readonly FilterableCategory[]) => void;
  readonly onRememberSearch: (query: string) => void;
  readonly recentSearches: readonly string[];
  readonly onRecentSearchSelect: (query: string) => void;
  readonly inputKeyHandlerRef: RefObject<InputKeyHandler | null>;
  readonly shouldShowCountdown: boolean;
  readonly charactersRemaining: number;
  readonly resultsPanelRef: RefObject<HTMLDivElement | null>;
}

export function HeaderSearchSiteResults({
  selectedCategory,
  setSelectedCategory,
  resultsByCategory,
  categoryErrors,
  categoryFetching,
  derivedState,
  searchValue,
  liveSearchValue,
  onClose,
  onRetry,
  onRememberSearch,
  recentSearches,
  onRecentSearchSelect,
  inputKeyHandlerRef,
  shouldShowCountdown,
  charactersRemaining,
  resultsPanelRef,
}: HeaderSearchSiteResultsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useBrowserLocale();
  const myStream = useMyStreamOptional();
  const { isApp } = useDeviceInfo();
  const [selectedItemIndex, setSelectedItemIndex] = useState(0);
  const activeElementRef = useRef<HTMLDivElement>(null);
  const shouldScrollActiveItemRef = useRef(false);

  const getCategoryLabel = useCallback(
    (category: CATEGORY): string => {
      switch (category) {
        case CATEGORY.ALL:
          return t(locale, "headerSearch.category.all");
        case CATEGORY.PAGES:
          return t(locale, "headerSearch.category.pages");
        case CATEGORY.NFTS:
          return t(locale, "headerSearch.category.nfts");
        case CATEGORY.PROFILES:
          return t(locale, "headerSearch.category.profiles");
        case CATEGORY.WAVES:
          return t(locale, "headerSearch.category.waves");
      }
    },
    [locale]
  );

  const categoriesWithResults = useMemo(
    () =>
      FILTERABLE_CATEGORIES.filter(
        (category) => resultsByCategory[category].length > 0
      ),
    [resultsByCategory]
  );
  const totalResultCount = FILTERABLE_CATEGORIES.reduce(
    (count, category) => count + resultsByCategory[category].length,
    0
  );
  const selectedResultCount = isFilterableCategory(selectedCategory)
    ? resultsByCategory[selectedCategory].length
    : totalResultCount;

  const tabOptions = useMemo(
    () =>
      [CATEGORY.ALL, ...FILTERABLE_CATEGORIES].map((category) => {
        const scopedCategories = isFilterableCategory(category)
          ? [category]
          : FILTERABLE_CATEGORIES;
        const count = isFilterableCategory(category)
          ? resultsByCategory[category].length
          : totalResultCount;
        return {
          key: category,
          label: getCategoryLabel(category),
          panelId: HEADER_SEARCH_RESULTS_PANEL_ID,
          count,
          isLoading: scopedCategories.some(
            (scopedCategory) => categoryFetching[scopedCategory]
          ),
          hasError: scopedCategories.some(
            (scopedCategory) => categoryErrors[scopedCategory]
          ),
        };
      }),
    [
      categoryErrors,
      categoryFetching,
      getCategoryLabel,
      resultsByCategory,
      totalResultCount,
    ]
  );

  const previewGroups = useMemo<PreviewGroup[]>(() => {
    if (selectedCategory !== CATEGORY.ALL) return [];

    let runningIndex = 0;
    return categoriesWithResults.map((category) => {
      const items = resultsByCategory[category];
      const previewItems = items
        .slice(0, CATEGORY_PREVIEW_LIMIT)
        .map((item) => ({ item, index: runningIndex++ }));
      return { category, items: previewItems, total: items.length };
    });
  }, [categoriesWithResults, resultsByCategory, selectedCategory]);

  const flattenedItems = useMemo(() => {
    if (selectedCategory === CATEGORY.ALL) {
      return previewGroups.flatMap((group) =>
        group.items.map((entry) => entry.item)
      );
    }
    return isFilterableCategory(selectedCategory)
      ? resultsByCategory[selectedCategory]
      : [];
  }, [previewGroups, resultsByCategory, selectedCategory]);
  const activeItemIndex = Math.min(
    selectedItemIndex,
    Math.max(flattenedItems.length - 1, 0)
  );

  const handleCategorySelect = (category: CATEGORY) => {
    setSelectedCategory(category);
    setSelectedItemIndex(0);
  };

  const rememberCurrentSearch = useCallback(() => {
    if (searchValue.trim()) onRememberSearch(searchValue.trim());
  }, [onRememberSearch, searchValue]);

  const goToProfile = useCallback(
    (profile: CommunityMemberMinimal) => {
      rememberCurrentSearch();
      router.push(
        getProfileTargetRoute({
          handleOrWallet: profile.handle ?? profile.wallet.toLowerCase(),
          pathname,
          defaultPath: USER_PAGE_TAB_IDS.REP,
        })
      );
      onClose();
    },
    [onClose, pathname, rememberCurrentSearch, router]
  );

  const goToWave = useCallback(
    (wave: ApiWave) => {
      rememberCurrentSearch();
      const isDirectMessage = isHeaderSearchWaveDirectMessage(wave);
      if (myStream) {
        myStream.activeWave.set(wave.id, { isDirectMessage });
      } else {
        router.push(getHeaderSearchWavePath({ wave, isApp }));
      }
      onClose();
    },
    [isApp, myStream, onClose, rememberCurrentSearch, router]
  );

  const openItem = useCallback(
    (item: HeaderSearchModalItemType) => {
      if (isPageResult(item)) {
        rememberCurrentSearch();
        router.push(item.href);
        onClose();
      } else if (isNftResult(item)) {
        const collection = getNftCollectionMap()[item.contract.toLowerCase()];
        if (!collection) return;
        rememberCurrentSearch();
        router.push(`${collection.path}/${item.id}`);
        onClose();
      } else if (isProfileResult(item)) {
        goToProfile(item);
      } else if (isWaveResult(item)) {
        goToWave(item);
      }
    },
    [goToProfile, goToWave, onClose, rememberCurrentSearch, router]
  );

  const handleInputKeyDown = useCallback<InputKeyHandler>(
    (event) => {
      if (
        event.nativeEvent.isComposing ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey
      ) {
        return;
      }

      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        if (derivedState !== STATE.SUCCESS || flattenedItems.length === 0)
          return;
        event.preventDefault();
        shouldScrollActiveItemRef.current = true;
        setSelectedItemIndex((index) => {
          if (event.key === "ArrowDown") {
            return index >= flattenedItems.length - 1 ? 0 : index + 1;
          }
          return index <= 0 ? flattenedItems.length - 1 : index - 1;
        });
        return;
      }

      if (event.key === "Home" || event.key === "End") {
        if (derivedState !== STATE.SUCCESS || flattenedItems.length === 0)
          return;
        event.preventDefault();
        shouldScrollActiveItemRef.current = true;
        setSelectedItemIndex(
          event.key === "Home" ? 0 : flattenedItems.length - 1
        );
        return;
      }

      if (event.key !== "Enter" || derivedState !== STATE.SUCCESS) return;
      const item = flattenedItems[activeItemIndex];
      if (!item) return;
      event.preventDefault();
      openItem(item);
    },
    [activeItemIndex, derivedState, flattenedItems, openItem]
  );

  useEffect(() => {
    inputKeyHandlerRef.current = handleInputKeyDown;
    return () => {
      inputKeyHandlerRef.current = null;
    };
  }, [handleInputKeyDown, inputKeyHandlerRef]);

  useEffect(() => {
    const id =
      derivedState === STATE.SUCCESS && flattenedItems[activeItemIndex]
        ? getResultOptionId(activeItemIndex)
        : undefined;
    const input = document.getElementById("header-search-input");
    if (id) input?.setAttribute("aria-activedescendant", id);
    else input?.removeAttribute("aria-activedescendant");
    return () => input?.removeAttribute("aria-activedescendant");
  }, [activeItemIndex, derivedState, flattenedItems]);

  useEffect(() => {
    if (!shouldScrollActiveItemRef.current) return;
    shouldScrollActiveItemRef.current = false;
    activeElementRef.current?.scrollIntoView({
      behavior: "auto",
      block: "nearest",
      inline: "start",
    });
  }, [activeItemIndex]);

  const renderItem = (item: HeaderSearchModalItemType, index: number) => (
    <div
      ref={index === activeItemIndex ? activeElementRef : null}
      key={getHeaderSearchItemKey(item)}
    >
      <HeaderSearchModalItem
        content={item}
        searchValue={searchValue}
        optionId={getResultOptionId(index)}
        isSelected={index === activeItemIndex}
        onHover={(state) => {
          if (state) setSelectedItemIndex(index);
        }}
        onClose={() => {
          rememberCurrentSearch();
          onClose();
        }}
        onWaveSelect={goToWave}
      />
    </div>
  );

  const renderSuccessContent = () => {
    if (selectedCategory === CATEGORY.ALL) {
      return previewGroups.map((group) => (
        <section key={group.category} className="tw-mb-5 last:tw-mb-0">
          <div className="tw-mb-2 tw-flex tw-items-center tw-justify-between tw-gap-3">
            <h3 className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wider tw-text-iron-400">
              {getCategoryLabel(group.category)}
            </h3>
            {group.total > group.items.length && (
              <button
                type="button"
                onClick={() => handleCategorySelect(group.category)}
                className="tw-inline-flex tw-min-h-8 tw-items-center tw-rounded-full tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-px-3 tw-py-1 tw-text-xs tw-font-medium tw-text-iron-200 tw-transition hover:tw-border-iron-500 hover:tw-bg-iron-800 hover:tw-text-white focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
              >
                {t(locale, "headerSearch.viewAllCategory", {
                  category: getCategoryLabel(group.category),
                })}
              </button>
            )}
          </div>
          <div className="tw-space-y-1">
            {group.items.map(({ item, index }) => renderItem(item, index))}
          </div>
        </section>
      ));
    }

    if (!isFilterableCategory(selectedCategory)) return null;
    return (
      <div className="tw-space-y-1">
        {resultsByCategory[selectedCategory].map((item, index) =>
          renderItem(item, index)
        )}
      </div>
    );
  };

  const relevantCategories = isFilterableCategory(selectedCategory)
    ? [selectedCategory]
    : FILTERABLE_CATEGORIES;
  const failedCategories = relevantCategories.filter(
    (category) => categoryErrors[category]
  );
  const formattedResultCount = formatInteger(locale, selectedResultCount);
  const formattedCharactersRemaining = formatInteger(
    locale,
    charactersRemaining
  );
  const activeCategoryLabel =
    selectedCategory === CATEGORY.ALL
      ? t(locale, "headerSearch.scope.allResults")
      : getCategoryLabel(selectedCategory);
  let idleMessage = t(locale, "headerSearch.idle");
  if (shouldShowCountdown) {
    const countdownKey =
      charactersRemaining === 1
        ? "headerSearch.idleWithCountdown.one"
        : "headerSearch.idleWithCountdown.other";
    idleMessage = t(locale, countdownKey, {
      count: formattedCharactersRemaining,
    });
  }

  const renderPanelContent = () => {
    if (derivedState === STATE.SUCCESS) {
      return (
        <>
          <div
            role="status"
            aria-live="polite"
            className="tw-mb-3 tw-flex tw-min-h-8 tw-items-center tw-justify-between tw-gap-3 tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-white/5 tw-pb-3"
          >
            <p className="tw-m-0 tw-text-xs tw-font-medium tw-text-iron-300">
              {t(
                locale,
                selectedResultCount === 1
                  ? "headerSearch.results.count.one"
                  : "headerSearch.results.count.other",
                { count: formattedResultCount }
              )}
            </p>
            <p className="tw-m-0 tw-min-w-0 tw-truncate tw-text-xs">
              <span className="tw-text-iron-600">
                {t(locale, "headerSearch.results.queryPrefix")}
              </span>{" "}
              <span className="tw-font-medium tw-text-iron-200">
                &quot;{searchValue}&quot;
              </span>
            </p>
          </div>
          {failedCategories.length > 0 && (
            <div className="tw-mb-3 tw-flex tw-items-center tw-gap-2 tw-rounded-lg tw-border tw-border-solid tw-border-error/30 tw-bg-error/10 tw-px-3 tw-py-2 tw-text-xs tw-text-iron-200">
              <ExclamationTriangleIcon className="tw-size-4 tw-flex-shrink-0 tw-text-error" />
              <p className="tw-m-0 tw-min-w-0 tw-flex-1">
                {t(
                  locale,
                  failedCategories.length === 1
                    ? "headerSearch.error.partial.one"
                    : "headerSearch.error.partial.other",
                  failedCategories.length === 1
                    ? { category: getCategoryLabel(failedCategories[0]!) }
                    : {
                        categories: failedCategories
                          .map(getCategoryLabel)
                          .join(", "),
                      }
                )}
              </p>
              <button
                type="button"
                onClick={() => onRetry(failedCategories)}
                className="tw-text-primary-200 tw-rounded-md tw-border-0 tw-bg-transparent tw-px-2 tw-py-1 tw-font-semibold hover:tw-bg-white/5 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
              >
                {t(locale, "headerSearch.retry")}
              </button>
            </div>
          )}
          <div
            id={HEADER_SEARCH_RESULTS_LISTBOX_ID}
            role="listbox"
            aria-label={activeCategoryLabel}
          >
            {renderSuccessContent()}
          </div>
          <p className="tw-mb-0 tw-mt-4 tw-text-center tw-text-[11px] tw-text-iron-600">
            {t(locale, "headerSearch.status.keyboardHint")}
          </p>
        </>
      );
    }

    if (derivedState === STATE.LOADING) {
      return (
        <div role="status" aria-live="polite" className="tw-pt-1">
          <p className="tw-mb-3 tw-mt-0 tw-text-sm tw-font-medium tw-text-iron-300">
            {t(locale, "headerSearch.loadingFor", {
              query: liveSearchValue.trim(),
            })}
          </p>
          <div className="tw-space-y-2" aria-hidden="true">
            {[0, 1, 2, 3].map((index) => (
              <div
                key={index}
                className="tw-flex tw-h-14 tw-animate-pulse tw-items-center tw-gap-3 tw-rounded-lg tw-bg-iron-900/70 tw-px-2.5"
              >
                <span className="tw-size-10 tw-rounded-lg tw-bg-iron-800" />
                <span className="tw-flex tw-flex-1 tw-flex-col tw-gap-2">
                  <span className="tw-h-3 tw-w-2/5 tw-rounded tw-bg-iron-800" />
                  <span className="tw-bg-iron-850 tw-h-2.5 tw-w-3/5 tw-rounded" />
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (derivedState === STATE.NO_RESULTS) {
      return (
        <div className="tw-flex tw-min-h-[250px] tw-flex-col tw-items-center tw-justify-center tw-px-4 tw-text-center">
          <div className="tw-mb-4 tw-flex tw-size-11 tw-items-center tw-justify-center tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-900">
            <MagnifyingGlassIcon className="tw-size-5 tw-text-iron-300" />
          </div>
          <p
            role="status"
            className="tw-m-0 tw-text-sm tw-font-semibold tw-text-iron-100"
          >
            {t(locale, "headerSearch.noResultsFor", {
              category: activeCategoryLabel,
              query: liveSearchValue.trim(),
            })}
          </p>
          <p className="tw-mb-0 tw-mt-2 tw-max-w-sm tw-text-sm tw-leading-6 tw-text-iron-400">
            {t(locale, "headerSearch.noResultsHint")}
          </p>
        </div>
      );
    }

    if (derivedState === STATE.ERROR) {
      return (
        <div className="tw-flex tw-min-h-[250px] tw-flex-col tw-items-center tw-justify-center tw-gap-3 tw-px-4 tw-text-center">
          <ExclamationTriangleIcon className="tw-size-6 tw-text-error" />
          <p role="alert" className="tw-m-0 tw-text-sm tw-text-iron-300">
            {t(locale, "headerSearch.error")}
          </p>
          <button
            type="button"
            onClick={() => onRetry(failedCategories)}
            className="tw-text-primary-100 tw-rounded-lg tw-border tw-border-solid tw-border-primary-400/40 tw-bg-primary-500/15 tw-px-4 tw-py-2 tw-text-sm tw-font-semibold hover:tw-bg-primary-500/25 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
          >
            {t(locale, "headerSearch.retry")}
          </button>
        </div>
      );
    }

    return (
      <div className="tw-flex tw-min-h-[250px] tw-flex-col tw-items-center tw-justify-center tw-px-4 tw-text-center">
        {recentSearches.length > 0 ? (
          <div className="tw-w-full tw-max-w-md">
            <div className="tw-mb-4 tw-flex tw-flex-col tw-items-center">
              <div className="tw-mb-3 tw-flex tw-size-11 tw-items-center tw-justify-center tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-900">
                <MagnifyingGlassIcon className="tw-size-5 tw-text-primary-300" />
              </div>
              <h3 className="tw-m-0 tw-text-sm tw-font-semibold tw-text-iron-100">
                {t(locale, "headerSearch.recent.title")}
              </h3>
              <p className="tw-mb-0 tw-mt-1 tw-text-sm tw-text-iron-400">
                {t(locale, "headerSearch.recent.description")}
              </p>
            </div>
            <div className="tw-flex tw-flex-wrap tw-justify-center tw-gap-2">
              {recentSearches.map((query) => (
                <button
                  key={query}
                  type="button"
                  onClick={() => onRecentSearchSelect(query)}
                  className="tw-min-h-10 tw-rounded-full tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-px-3 tw-py-2 tw-text-sm tw-text-iron-200 hover:tw-border-iron-500 hover:tw-bg-iron-800 hover:tw-text-white focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
                >
                  {query}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            <div className="tw-mb-4 tw-flex tw-size-11 tw-items-center tw-justify-center tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-900">
              <MagnifyingGlassIcon className="tw-size-5 tw-text-primary-300" />
            </div>
            <p
              role="status"
              className="tw-m-0 tw-text-sm tw-font-medium tw-text-iron-300"
            >
              {idleMessage}
            </p>
          </>
        )}
      </div>
    );
  };

  return (
    <>
      <div className="tw-flex-shrink-0 tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-white/5 tw-px-4 tw-py-2.5 md:tw-hidden">
        <HeaderSearchTabToggle
          options={tabOptions}
          activeKey={selectedCategory}
          onSelect={(key) => handleCategorySelect(key as CATEGORY)}
          fullWidth
        />
      </div>

      <div className="tw-grid tw-min-h-0 tw-flex-1 tw-grid-cols-1 md:tw-grid-cols-[12rem_minmax(0,1fr)] md:tw-gap-4 md:tw-px-5 md:tw-pb-5">
        <aside
          aria-label={t(locale, "headerSearch.scopeLabel")}
          className="tw-hidden md:tw-flex md:tw-flex-col md:tw-pt-4"
        >
          <HeaderSearchTabToggle
            options={tabOptions}
            activeKey={selectedCategory}
            onSelect={(key) => handleCategorySelect(key as CATEGORY)}
            fullWidth
            orientation="vertical"
          />
        </aside>
        <div
          ref={resultsPanelRef}
          id={HEADER_SEARCH_RESULTS_PANEL_ID}
          role="tabpanel"
          aria-label={t(locale, "headerSearch.results.panelLabel", {
            category: getCategoryLabel(selectedCategory),
          })}
          aria-busy={derivedState === STATE.LOADING}
          className="tw-min-h-0 tw-overflow-y-auto tw-px-4 tw-pb-5 tw-pt-4 tw-scrollbar-thin tw-scrollbar-track-transparent tw-scrollbar-thumb-white/20 desktop-hover:hover:tw-scrollbar-thumb-white/30 md:tw-px-0"
        >
          {renderPanelContent()}
        </div>
      </div>
    </>
  );
}
