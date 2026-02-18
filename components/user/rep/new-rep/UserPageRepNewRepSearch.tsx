"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { commonApiFetch, commonApiPost } from "@/services/api/common-api";
import { useContext, useEffect, useRef, useState } from "react";
import { useClickAway, useDebounce, useKeyPressEvent } from "react-use";
import { AnimatePresence, motion } from "framer-motion";
import type {
  ApiProfileRepRatesState,
  RatingStats,
} from "@/entities/IProfile";
import UserPageRepNewRepSearchDropdown from "./UserPageRepNewRepSearchDropdown";
import CircleLoader from "@/components/distribution-plan-tool/common/CircleLoader";
import UserPageRepNewRepError from "./UserPageRepNewRepError";
import {
  QueryKey,
  ReactQueryWrapperContext,
} from "@/components/react-query-wrapper/ReactQueryWrapper";
import { AuthContext } from "@/components/auth/Auth";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { ApiProfileProxyActionType } from "@/generated/models/ApiProfileProxyActionType";
import { formatNumberWithCommas, getStringAsNumberOrZero } from "@/helpers/Helpers";
import UserRateAdjustmentHelper from "@/components/user/utils/rate/UserRateAdjustmentHelper";
import UserPageRateInput from "@/components/user/utils/rate/UserPageRateInput";

const SEARCH_LENGTH = {
  MIN: 3,
  MAX: 100,
};

export enum RepSearchState {
  MIN_LENGTH_ERROR = "MIN_LENGTH_ERROR",
  MAX_LENGTH_ERROR = "MAX_LENGTH_ERROR",
  LOADING = "LOADING",
  HAVE_RESULTS = "HAVE_RESULTS",
}

export default function UserPageRepNewRepSearch({
  repRates,
  profile,
}: {
  readonly repRates: ApiProfileRepRatesState | null;
  readonly profile: ApiIdentity;
}) {
  const { onProfileRepModify } = useContext(ReactQueryWrapperContext);
  const { requestAuth, setToast, connectedProfile, activeProfileProxy } =
    useContext(AuthContext);

  const [repSearch, setRepSearch] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [amountStr, setAmountStr] = useState<string>("0");
  const [mutating, setMutating] = useState<boolean>(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [debouncedValue, setDebouncedValue] = useState<string>("");
  useDebounce(
    () => {
      setDebouncedValue(repSearch);
      setErrorMsg(null);
    },
    500,
    [repSearch]
  );

  const [matchingSearchLength, setMatchingSearchLength] = useState<boolean>(
    debouncedValue.length >= SEARCH_LENGTH.MIN &&
      debouncedValue.length <= SEARCH_LENGTH.MAX
  );

  useEffect(() => {
    setMatchingSearchLength(
      debouncedValue.length >= SEARCH_LENGTH.MIN &&
        debouncedValue.length <= SEARCH_LENGTH.MAX
    );
  }, [debouncedValue]);

  const { isFetching, data: categories } = useQuery<string[]>({
    queryKey: [QueryKey.REP_CATEGORIES_SEARCH, debouncedValue],
    queryFn: async () =>
      await commonApiFetch<string[]>({
        endpoint: "/rep/categories",
        params: {
          param: debouncedValue,
        },
      }),
    enabled: matchingSearchLength,
  });

  // Proxy grantor rep rates (same query as SearchHeader — React Query deduplicates)
  const { data: proxyGrantorRepRates } = useQuery<ApiProfileRepRatesState>({
    queryKey: [
      QueryKey.PROFILE_REP_RATINGS,
      {
        rater: activeProfileProxy?.created_by.handle,
        handleOrWallet: profile?.handle,
      },
    ],
    queryFn: async () =>
      await commonApiFetch<ApiProfileRepRatesState>({
        endpoint: `profiles/${profile?.query}/rep/ratings/received`,
        params: activeProfileProxy?.created_by.handle
          ? { rater: activeProfileProxy.created_by.handle }
          : {},
      }),
    enabled: !!activeProfileProxy?.created_by.handle,
  });

  // Connected profile rep rates (same query as modal)
  const { data: connectedProfileRepRates } =
    useQuery<ApiProfileRepRatesState>({
      queryKey: [
        QueryKey.PROFILE_REP_RATINGS,
        {
          rater: connectedProfile?.handle,
          handleOrWallet: profile?.handle,
        },
      ],
      queryFn: async () =>
        await commonApiFetch<ApiProfileRepRatesState>({
          endpoint: `profiles/${profile?.query}/rep/ratings/received`,
          params: connectedProfile?.handle
            ? { rater: connectedProfile.handle }
            : {},
        }),
      enabled: !!connectedProfile?.handle,
    });

  // --- Derived rep state for selected category (mirrors modal logic) ---

  const getRepState = (): RatingStats | null => {
    if (!selectedCategory) return null;

    if (activeProfileProxy && proxyGrantorRepRates) {
      const target = proxyGrantorRepRates.rating_stats.find(
        (s) => s.category === selectedCategory
      );
      return (
        target ?? {
          category: selectedCategory,
          rating: 0,
          contributor_count: 0,
          rater_contribution: 0,
        }
      );
    }

    if (activeProfileProxy) return null;

    if (connectedProfileRepRates) {
      const target = connectedProfileRepRates.rating_stats.find(
        (s) => s.category === selectedCategory
      );
      return (
        target ?? {
          category: selectedCategory,
          rating: 0,
          contributor_count: 0,
          rater_contribution: 0,
        }
      );
    }

    return null;
  };

  const getProxyAvailableCredit = (): number | null => {
    const repProxy = activeProfileProxy?.actions.find(
      (a) => a.action_type === ApiProfileProxyActionType.AllocateRep
    );
    if (!repProxy) return null;
    return Math.max(
      (repProxy.credit_amount ?? 0) - (repProxy.credit_spent ?? 0),
      0
    );
  };

  const getHeroAvailableRep = (): number => {
    if (activeProfileProxy) {
      return proxyGrantorRepRates?.rep_rates_left_for_rater ?? 0;
    }
    return connectedProfileRepRates?.rep_rates_left_for_rater ?? 0;
  };

  const [repState, setRepState] = useState<RatingStats | null>(getRepState());
  const [proxyAvailableCredit, setProxyAvailableCredit] = useState<
    number | null
  >(getProxyAvailableCredit());
  const [heroAvailableRep, setHeroAvailableRep] = useState<number>(
    getHeroAvailableRep()
  );

  useEffect(() => {
    setRepState(getRepState());
  }, [
    selectedCategory,
    proxyGrantorRepRates,
    activeProfileProxy,
    connectedProfileRepRates,
  ]);

  useEffect(
    () => setProxyAvailableCredit(getProxyAvailableCredit()),
    [activeProfileProxy]
  );

  useEffect(
    () => setHeroAvailableRep(getHeroAvailableRep()),
    [activeProfileProxy, proxyGrantorRepRates, connectedProfileRepRates]
  );

  const getMinValue = (): number => {
    const currentRep = repState?.rater_contribution ?? 0;
    const minHeroRep = 0 - (Math.abs(currentRep) + heroAvailableRep);
    if (typeof proxyAvailableCredit !== "number") return minHeroRep;
    const minProxyRep = currentRep - proxyAvailableCredit;
    return Math.abs(minHeroRep) < Math.abs(minProxyRep)
      ? minHeroRep
      : minProxyRep;
  };

  const getMaxValue = (): number => {
    const currentRep = repState?.rater_contribution ?? 0;
    const maxHeroRep = Math.abs(currentRep) + heroAvailableRep;
    if (typeof proxyAvailableCredit !== "number") return maxHeroRep;
    const maxProxyRep = currentRep + proxyAvailableCredit;
    return Math.min(maxHeroRep, maxProxyRep);
  };

  const [minMaxValues, setMinMaxValues] = useState<{
    readonly min: number;
    readonly max: number;
  }>({ min: getMinValue(), max: getMaxValue() });

  useEffect(
    () => setMinMaxValues({ min: getMinValue(), max: getMaxValue() }),
    [repState, proxyGrantorRepRates, proxyAvailableCredit, heroAvailableRep]
  );

  // Pre-fill amountStr when category is selected
  useEffect(() => {
    if (repState) {
      setAmountStr(`${repState.rater_contribution}`);
    }
  }, [repState]);

  const amountNum = getStringAsNumberOrZero(amountStr);
  const isValidValue =
    !!activeProfileProxy ||
    (amountNum >= minMaxValues.min && amountNum <= minMaxValues.max);

  const newRating = getStringAsNumberOrZero(amountStr);
  const haveChanged = newRating !== (repState?.rater_contribution ?? 0);

  // --- End derived rep state ---

  const [isOpen, setIsOpen] = useState(false);

  const listRef = useRef<HTMLDivElement>(null);
  useClickAway(listRef, () => setIsOpen(false));
  useKeyPressEvent("Escape", () => setIsOpen(false));

  const [checkingAvailability, setCheckingAvailability] = useState(false);

  const onRepSelect = async (rep: string) => {
    if (!matchingSearchLength) return;
    if (checkingAvailability) return;
    setCheckingAvailability(true);
    try {
      await commonApiFetch<boolean>({
        endpoint: "/rep/categories/availability",
        params: {
          param: rep,
        },
      });
      setSelectedCategory(rep);
      setRepSearch(rep);
      setErrorMsg(null);
      setIsOpen(false);
    } catch (error: any) {
      setErrorMsg(error);
    } finally {
      setCheckingAvailability(false);
    }
  };

  const addRepMutation = useMutation({
    mutationFn: async ({
      amount,
      category,
    }: {
      amount: number;
      category: string;
    }) =>
      await commonApiPost<{ amount: number; category: string }, void>({
        endpoint: `profiles/${profile?.query}/rep/rating`,
        body: { amount, category },
      }),
    onSuccess: () => {
      setToast({ message: "Rep updated.", type: "success" });
      onProfileRepModify({
        targetProfile: profile,
        connectedProfile,
        profileProxy: activeProfileProxy ?? null,
      });
      setSelectedCategory(null);
      setRepSearch("");
      setAmountStr("");
    },
    onError: (error) => {
      setToast({ message: error as unknown as string, type: "error" });
    },
    onSettled: () => {
      setMutating(false);
    },
  });

  const onGrantRep = async () => {
    if (mutating || !selectedCategory || !amountStr) return;
    const amount = parseInt(amountStr, 10);
    if (isNaN(amount)) return;
    if (!haveChanged) return;
    setMutating(true);
    const { success } = await requestAuth();
    if (!success) {
      setToast({ message: "You must be logged in.", type: "error" });
      setMutating(false);
      return;
    }
    await addRepMutation.mutateAsync({ amount, category: selectedCategory });
  };

  const onSearchSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!debouncedValue) return;
    onRepSelect(debouncedValue);
  };

  const [categoriesToDisplay, setCategoriesToDisplay] = useState<string[]>([]);
  useEffect(() => {
    const items: string[] = [];
    if (matchingSearchLength) {
      items.push(debouncedValue);
    }

    if (categories?.length) {
      items.push(
        ...categories.filter((category) => category !== debouncedValue)
      );
    }

    setCategoriesToDisplay(items);
    if (debouncedValue.length && !selectedCategory) {
      setIsOpen(true);
    }
  }, [debouncedValue, categories, matchingSearchLength, selectedCategory]);

  const [repSearchState, setRepSearchState] = useState<RepSearchState>(
    RepSearchState.MIN_LENGTH_ERROR
  );

  useEffect(() => {
    if (debouncedValue.length < SEARCH_LENGTH.MIN) {
      setRepSearchState(RepSearchState.MIN_LENGTH_ERROR);
    } else if (debouncedValue.length > SEARCH_LENGTH.MAX) {
      setRepSearchState(RepSearchState.MAX_LENGTH_ERROR);
    } else if (isFetching) {
      setRepSearchState(RepSearchState.LOADING);
    } else {
      setRepSearchState(RepSearchState.HAVE_RESULTS);
    }
  }, [debouncedValue, isFetching, categories]);

  const handleRepSearchChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const newValue = event.target.value;
    setRepSearch(newValue);
    if (selectedCategory && newValue !== selectedCategory) {
      setSelectedCategory(null);
      setAmountStr("");
    }
  };

  const isGrantDisabled =
    !selectedCategory || !amountStr || !haveChanged || !isValidValue || mutating;

  return (
    <div className="tw-max-w-full tw-relative">
      <div className="tw-w-full">
        <div className="tw-w-full">
          <div ref={listRef} className="tw-w-full">
            <div className="tw-w-full tw-relative tw-rounded-xl tw-bg-iron-900/50 tw-border tw-border-solid tw-border-white/[0.06] tw-p-4">
              <div className="tw-flex tw-items-center tw-justify-between">
                <label
                  htmlFor="search-rep"
                  className="tw-block tw-text-xs tw-font-medium tw-text-iron-400">
                  Grant Rep
                </label>
                <div className="tw-flex tw-items-center tw-gap-3 tw-text-xs tw-text-iron-400 tw-font-medium">
                  <span>
                    <span>Your available Rep:</span>
                    <span className="tw-ml-1 tw-font-bold tw-text-iron-300">
                      {formatNumberWithCommas(heroAvailableRep)}
                    </span>
                  </span>
                  <span className="tw-w-px tw-h-3 tw-bg-white/20" />
                  <span>
                    <span>
                      Your Rep assigned to{" "}
                      {profile.query ?? profile.handle ?? profile.display}:
                    </span>
                    <span className="tw-ml-1 tw-font-bold tw-text-iron-300">
                      {formatNumberWithCommas(
                        repRates?.total_rep_rating_by_rater ?? 0
                      )}
                    </span>
                  </span>
                </div>
              </div>
              <div className="tw-flex tw-flex-col sm:tw-flex-row tw-items-stretch sm:tw-items-end tw-gap-3 tw-mt-3">
                <form
                  onSubmit={onSearchSubmit}
                  className="tw-w-full sm:tw-flex-1 tw-relative">
                  <div className="tw-w-full tw-relative">
                    <svg
                      className="tw-pointer-events-none tw-absolute tw-left-3 tw-top-3 tw-h-4 tw-w-4 tw-text-iron-500"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true">
                      <path
                        fillRule="evenodd"
                        d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <input
                      id="search-rep"
                      name="search-rep"
                      type="text"
                      required
                      autoComplete="off"
                      value={repSearch}
                      onChange={handleRepSearchChange}
                      onFocus={() => setIsOpen(true)}
                      className="tw-form-input tw-appearance-none tw-block tw-w-full tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-py-3 tw-pl-9 tw-pr-3 tw-bg-[#0A0A0A]/80 tw-text-white tw-text-sm tw-font-medium tw-caret-primary-400 placeholder:tw-text-iron-500 focus:tw-outline-none focus:tw-border-blue-500/50 tw-transition tw-duration-300 tw-ease-out"
                      placeholder="Category to grant rep for"
                    />
                    {checkingAvailability && (
                      <div className="tw-pointer-events-none tw-absolute tw-inset-y-0 tw-flex tw-items-center tw-right-0 tw-pr-3">
                        <CircleLoader />
                      </div>
                    )}
                  </div>
                </form>
                <div className="tw-relative tw-flex tw-w-full sm:tw-w-36">
                  <UserPageRateInput
                    value={amountStr}
                    onChange={setAmountStr}
                    minMax={minMaxValues}
                    isProxy={!!activeProfileProxy}
                    inputClassName="tw-form-input tw-appearance-none -tw-ml-0.5 tw-block tw-w-full tw-rounded-l-none tw-rounded-r-lg tw-border-0 tw-py-3 tw-px-3 tw-bg-iron-900 focus:tw-bg-iron-950 tw-text-white tw-text-sm tw-font-medium tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-700 hover:tw-ring-iron-600 placeholder:tw-text-iron-500 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset tw-transition tw-duration-300 tw-ease-out"
                  />
                </div>
                <button
                  type="button"
                  disabled={isGrantDisabled}
                  onClick={onGrantRep}
                  className={`${
                    !isGrantDisabled
                      ? "tw-cursor-pointer hover:tw-bg-primary-600 hover:tw-border-primary-600"
                      : "tw-cursor-not-allowed tw-opacity-50"
                  } tw-flex-shrink-0 tw-bg-primary-500 tw-border-primary-500 tw-px-5 tw-py-3 tw-text-xs tw-font-semibold tw-text-white tw-border tw-border-solid tw-rounded-lg tw-transition tw-duration-300 tw-ease-out`}>
                  {mutating ? (
                    <div className="tw-w-12">
                      <CircleLoader />
                    </div>
                  ) : (
                    "Grant Rep"
                  )}
                </button>
              </div>
              {selectedCategory && (
                <UserRateAdjustmentHelper
                  inLineValues={true}
                  originalValue={repState?.rater_contribution ?? 0}
                  adjustedValue={newRating}
                  adjustmentType="Rep"
                />
              )}
            </div>
            <AnimatePresence mode="wait" initial={false}>
              {isOpen && (
                <motion.div
                  className="tw-origin-top-right tw-absolute tw-z-10 tw-mt-1 tw-w-full tw-max-w-xs tw-rounded-lg tw-shadow-xl tw-bg-iron-950 tw-ring-1 tw-ring-black tw-ring-opacity-5"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                  onClick={(e) => e.stopPropagation()}>
                  <UserPageRepNewRepSearchDropdown
                    categories={categoriesToDisplay}
                    state={repSearchState}
                    minSearchLength={SEARCH_LENGTH.MIN}
                    maxSearchLength={SEARCH_LENGTH.MAX}
                    onRepSelect={onRepSelect}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        <AnimatePresence mode="wait" initial={false}>
          {!!errorMsg && (
            <UserPageRepNewRepError
              msg={errorMsg}
              closeError={() => setErrorMsg(null)}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
