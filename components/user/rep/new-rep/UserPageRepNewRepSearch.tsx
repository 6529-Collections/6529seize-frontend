"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { commonApiFetch, commonApiPost } from "@/services/api/common-api";
import { useContext, useEffect, useId, useMemo, useRef, useState } from "react";
import { useClickAway, useDebounce, useKeyPressEvent } from "react-use";
import { AnimatePresence, motion } from "framer-motion";
import type { ApiRepOverview } from "@/generated/models/ApiRepOverview";
import UserPageRepNewRepSearchDropdown from "./UserPageRepNewRepSearchDropdown";
import { RepSearchState } from "./rep-search-types";
import CircleLoader from "@/components/distribution-plan-tool/common/CircleLoader";
import UserPageRepNewRepError from "./UserPageRepNewRepError";
import {
  QueryKey,
  ReactQueryWrapperContext,
} from "@/components/react-query-wrapper/ReactQueryWrapper";
import { AuthContext } from "@/components/auth/Auth";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import {
  formatNumberWithCommas,
  getStringAsNumberOrZero,
} from "@/helpers/Helpers";
import { getToastErrorDetails } from "@/helpers/toast.helpers";
import UserRateAdjustmentHelper from "@/components/user/utils/rate/UserRateAdjustmentHelper";
import UserPageRateInput from "@/components/user/utils/rate/UserPageRateInput";
import { useRepAllocation } from "@/hooks/useRepAllocation";
import {
  HELP_BOT_CREDIT_REP_CATEGORY,
  isHelpBotCreditRepCategory,
} from "@/components/utils/input/rep-category/repCategoryConstants";
import { getRepCategoryViolation } from "@/components/utils/input/rep-category/repCategoryValidation";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import {
  cleanRepCategoryName,
  getRepCategoryMatchKey,
  type GrantRepCategoryOption,
  searchGrantRepCategoryOptions,
} from "./grantRepCategorySearch";

const SEARCH_LENGTH = {
  MIN: 3,
  MAX: 100,
};

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  if (typeof error === "string" && error.trim()) {
    return error;
  }
  if (typeof error === "object" && error !== null && "message" in error) {
    const message = (error as { readonly message?: unknown }).message;
    if (typeof message === "string" && message.trim()) {
      return message;
    }
  }
  return "Couldn't complete this request. Please try again.";
};

export default function UserPageRepNewRepSearch({
  overview,
  profile,
  onSuccess,
  onCancel,
}: {
  readonly overview: ApiRepOverview | null;
  readonly profile: ApiIdentity;
  readonly onSuccess?: (() => void) | undefined;
  readonly onCancel?: (() => void) | undefined;
}) {
  const locale = useBrowserLocale();
  const { onProfileRepModify } = useContext(ReactQueryWrapperContext);
  const { requestAuth, setToast, connectedProfile, activeProfileProxy } =
    useContext(AuthContext);
  const helpBotCreditRepCategoryError = t(
    locale,
    "rep.categories.helpBotReserved.error",
    { category: HELP_BOT_CREDIT_REP_CATEGORY }
  );

  const [repSearch, setRepSearch] = useState<string>("");
  const [selectedOption, setSelectedOption] =
    useState<GrantRepCategoryOption | null>(null);
  const selectedCategory = selectedOption?.category ?? null;
  const [amountStr, setAmountStr] = useState<string>("0");
  const [mutating, setMutating] = useState<boolean>(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showErrorDetails, setShowErrorDetails] = useState<boolean>(true);

  const [debouncedValue, setDebouncedValue] = useState<string>("");
  useDebounce(
    () => {
      setDebouncedValue(repSearch);
      setErrorMsg(null);
      setShowErrorDetails(true);
    },
    500,
    [repSearch]
  );

  const debouncedSearchLength = Array.from(
    cleanRepCategoryName(debouncedValue)
  ).length;
  const matchingSearchLength =
    debouncedSearchLength >= SEARCH_LENGTH.MIN &&
    debouncedSearchLength <= SEARCH_LENGTH.MAX;

  const {
    isError: isCategorySearchError,
    isFetching,
    data: categoryOptions,
  } = useQuery<GrantRepCategoryOption[]>({
    queryKey: [QueryKey.GRANT_REP_CATEGORY_SEARCH, debouncedValue],
    queryFn: async ({ signal }) =>
      await searchGrantRepCategoryOptions({
        search: debouncedValue,
        signal,
      }),
    enabled: matchingSearchLength,
  });

  const { repState, heroAvailableRep, minMaxValues } = useRepAllocation({
    profile,
    category: selectedCategory,
  });

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
  const listId = useId();

  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  useClickAway(listRef, () => setIsOpen(false));
  useKeyPressEvent("Escape", () => {
    setIsOpen(false);
    inputRef.current?.focus();
  });

  const [checkingAvailability, setCheckingAvailability] = useState(false);

  const showHelpBotCreditRepCategoryError = () => {
    setErrorMsg(helpBotCreditRepCategoryError);
    setShowErrorDetails(false);
  };

  const onRepSelect = async (option: GrantRepCategoryOption) => {
    const rep = option.category;
    if (isHelpBotCreditRepCategory(rep)) {
      showHelpBotCreditRepCategoryError();
      return;
    }
    // Mirror the server's category rules locally so the user sees the exact
    // broken rule, localized and instantly, instead of a server error blob.
    // Runs before the search-length guard below so the over-length and
    // leading-dash messages actually reach the user.
    const violation = getRepCategoryViolation(rep);
    if (violation) {
      setErrorMsg(t(locale, violation.key, { ...violation.params }));
      setShowErrorDetails(false);
      return;
    }
    // Search-specific minimum (below the server's 1-char floor): surface it
    // instead of silently dropping the input. Count code points to stay
    // consistent with the validator's length semantics.
    if (Array.from(rep).length < SEARCH_LENGTH.MIN) {
      setErrorMsg(
        t(locale, "rep.categories.validation.tooShort", {
          min: SEARCH_LENGTH.MIN,
        })
      );
      setShowErrorDetails(false);
      return;
    }
    if (checkingAvailability) return;
    setCheckingAvailability(true);
    try {
      await commonApiFetch<boolean>({
        endpoint: "/rep/categories/availability",
        params: {
          param: rep,
        },
      });
      setSelectedOption(option);
      setRepSearch(rep);
      setErrorMsg(null);
      setShowErrorDetails(true);
      inputRef.current?.focus();
      setIsOpen(false);
    } catch (error: unknown) {
      setErrorMsg(getErrorMessage(error));
      setShowErrorDetails(true);
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
        endpoint: `profiles/${profile.query ?? ""}/rep/rating`,
        body: { amount, category },
      }),
    onSuccess: () => {
      setToast({ message: "Rep updated.", type: "success" });
      onProfileRepModify({
        targetProfile: profile,
        connectedProfile,
        profileProxy: activeProfileProxy ?? null,
      });
      setSelectedOption(null);
      setRepSearch("");
      setAmountStr("0");
      setIsOpen(false);
      onSuccess?.();
    },
    onError: (error) => {
      setToast({
        type: "error",
        title: "Couldn't update this Rep rating.",
        description: "Please try again.",
        details: getToastErrorDetails(error, getErrorMessage(error)),
      });
    },
  });

  const onGrantRep = async () => {
    if (mutating || !selectedCategory || !amountStr || !profile.query) return;
    if (isHelpBotCreditRepCategory(selectedCategory)) {
      showHelpBotCreditRepCategoryError();
      return;
    }
    const amount = Number.parseInt(amountStr, 10);
    if (Number.isNaN(amount)) return;
    if (!haveChanged) return;
    setMutating(true);
    try {
      const { success } = await requestAuth();
      if (!success) {
        setToast({ message: "Log in to continue.", type: "error" });
        return;
      }
      await addRepMutation.mutateAsync({ amount, category: selectedCategory });
    } finally {
      setMutating(false);
    }
  };

  const onSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!repSearch) return;
    const searchKey = getRepCategoryMatchKey(repSearch);
    const equivalentExistingOption = categoryOptions?.find(
      (option) =>
        option.kind === "existing" &&
        getRepCategoryMatchKey(option.category) === searchKey
    );
    if (equivalentExistingOption) {
      void onRepSelect(equivalentExistingOption);
      return;
    }
    setIsOpen(true);
  };

  const repSearchState = useMemo(() => {
    const searchLength = Array.from(cleanRepCategoryName(repSearch)).length;
    if (searchLength < SEARCH_LENGTH.MIN)
      return RepSearchState.MIN_LENGTH_ERROR;
    if (searchLength > SEARCH_LENGTH.MAX)
      return RepSearchState.MAX_LENGTH_ERROR;
    if (repSearch !== debouncedValue || isFetching)
      return RepSearchState.LOADING;
    if (isCategorySearchError) return RepSearchState.ERROR;
    return RepSearchState.HAVE_RESULTS;
  }, [debouncedValue, isCategorySearchError, isFetching, repSearch]);

  const handleRepSearchChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const newValue = event.target.value;
    setRepSearch(newValue);
    if (selectedCategory && newValue !== selectedCategory) {
      setSelectedOption(null);
      setAmountStr("");
    }
  };

  const handleSearchKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (event.key !== "ArrowDown" || !isOpen) return;
    const firstOption = document.getElementById(`${listId}-option-0`);
    if (!(firstOption instanceof HTMLButtonElement)) return;
    event.preventDefault();
    firstOption.focus();
  };

  const isGrantDisabled =
    !selectedCategory ||
    !amountStr ||
    !haveChanged ||
    !isValidValue ||
    mutating;

  return (
    <div className="tw-relative tw-max-w-full">
      <div className="tw-w-full">
        <div className="tw-w-full">
          <div ref={listRef} className="tw-w-full">
            <div className="tw-relative tw-w-full tw-bg-iron-950">
              <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-x-4 tw-gap-y-1.5 tw-px-4 sm:tw-px-6">
                <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-x-3 tw-gap-y-2 tw-text-xs tw-font-medium tw-text-iron-500">
                  <span>
                    <span>Your available Rep:</span>
                    <span className="tw-ml-1 tw-font-semibold tw-text-iron-300">
                      {formatNumberWithCommas(heroAvailableRep)}
                    </span>
                  </span>
                  <span className="tw-h-3 tw-w-px tw-bg-white/20" />
                  <span>
                    <span>
                      Your Rep assigned to{" "}
                      {profile.query ?? profile.handle ?? profile.display}:
                    </span>
                    <span className="tw-ml-1 tw-font-semibold tw-text-iron-300">
                      {formatNumberWithCommas(
                        overview?.authenticated_user_contribution ?? 0
                      )}
                    </span>
                  </span>
                </div>
              </div>
              <div className="tw-mt-3 tw-flex tw-flex-col tw-items-stretch tw-gap-3 tw-px-4 sm:tw-px-6">
                <form
                  onSubmit={onSearchSubmit}
                  className="tw-relative tw-w-full"
                >
                  <label htmlFor="search-rep" className="tw-sr-only">
                    {t(locale, "rep.categories.grant.searchPlaceholder")}
                  </label>
                  <div className="tw-relative tw-w-full">
                    <svg
                      className="tw-pointer-events-none tw-absolute tw-left-3 tw-top-3.5 tw-h-4 tw-w-4 tw-text-iron-500"
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
                      id="search-rep"
                      name="search-rep"
                      type="text"
                      required
                      autoComplete="off"
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck={false}
                      value={repSearch}
                      onChange={handleRepSearchChange}
                      onFocus={() => setIsOpen(true)}
                      onKeyDown={handleSearchKeyDown}
                      role="combobox"
                      aria-autocomplete="list"
                      aria-haspopup="listbox"
                      aria-expanded={isOpen && !selectedCategory}
                      aria-controls={
                        isOpen &&
                        !selectedCategory &&
                        repSearchState === RepSearchState.HAVE_RESULTS &&
                        (categoryOptions?.length ?? 0) > 0
                          ? listId
                          : undefined
                      }
                      aria-describedby={
                        selectedOption ? `${listId}-selection` : undefined
                      }
                      className="tw-form-input tw-block tw-w-full tw-appearance-none tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-[#0A0A0A]/80 tw-py-3 tw-pl-9 tw-pr-3 tw-text-sm tw-font-medium tw-text-white tw-caret-primary-400 tw-transition tw-duration-300 tw-ease-out placeholder:tw-font-normal placeholder:tw-text-iron-500 focus:tw-border-blue-500/50 focus:tw-outline-none lg:tw-font-semibold lg:placeholder:tw-text-iron-400"
                      placeholder={t(
                        locale,
                        "rep.categories.grant.searchPlaceholder"
                      )}
                    />
                    {checkingAvailability && (
                      <div className="tw-pointer-events-none tw-absolute tw-inset-y-0 tw-right-0 tw-flex tw-items-center tw-pr-3">
                        <CircleLoader />
                      </div>
                    )}
                  </div>
                  {selectedOption && (
                    <p
                      id={`${listId}-selection`}
                      role="status"
                      className="tw-mb-0 tw-mt-2 tw-flex tw-flex-wrap tw-items-center tw-gap-x-1.5 tw-gap-y-1 tw-text-xs tw-font-medium tw-leading-relaxed tw-text-iron-300"
                    >
                      <span>
                        {t(
                          locale,
                          selectedOption.kind === "existing"
                            ? "rep.categories.grant.selectedExisting"
                            : "rep.categories.grant.selectedNew",
                          { category: selectedOption.category }
                        )}
                      </span>
                      {selectedOption.kind === "existing" &&
                        selectedOption.selectionReason === "submission" && (
                          <span className="tw-text-success">
                            {t(
                              locale,
                              "rep.categories.grant.submissionCategory"
                            )}
                          </span>
                        )}
                    </p>
                  )}
                  <AnimatePresence initial={false}>
                    {isOpen && !selectedCategory && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="tw-will-change-transform md:tw-absolute md:tw-left-0 md:tw-right-0 md:tw-top-full md:tw-z-10 md:tw-mt-1"
                      >
                        <div className="tw-rounded-lg tw-bg-iron-900 tw-p-2 tw-shadow-xl tw-ring-1 tw-ring-white/10">
                          <UserPageRepNewRepSearchDropdown
                            options={categoryOptions ?? []}
                            state={repSearchState}
                            minSearchLength={SEARCH_LENGTH.MIN}
                            maxSearchLength={SEARCH_LENGTH.MAX}
                            listId={listId}
                            onRepSelect={onRepSelect}
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </form>
                <div>
                  <div className="tw-relative tw-flex tw-w-full">
                    <UserPageRateInput
                      value={amountStr}
                      onChange={setAmountStr}
                      minMax={minMaxValues}
                      isProxy={!!activeProfileProxy}
                      spanClassName="tw-flex tw-flex-col tw-items-center tw-justify-center tw-rounded-l-lg tw-border tw-border-solid tw-border-white/10 tw-bg-[#0A0A0A]/80 tw-px-3"
                      inputClassName="tw-form-input tw-appearance-none -tw-ml-px tw-block tw-w-full tw-rounded-l-none tw-rounded-r-lg tw-border tw-border-solid tw-border-white/10 tw-py-3 tw-px-3 tw-bg-[#0A0A0A]/80 tw-text-white tw-text-sm tw-font-medium lg:tw-font-semibold tw-caret-primary-400 placeholder:tw-text-iron-500 lg:placeholder:tw-text-iron-400 focus:tw-outline-none focus:tw-border-blue-500/50 tw-transition tw-duration-300 tw-ease-out"
                    />
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
              </div>
              <div className="tw-mt-4 tw-flex tw-flex-col tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800/60 tw-px-4 tw-pt-4 sm:tw-flex-row-reverse sm:tw-gap-3 sm:tw-px-6">
                <button
                  type="button"
                  disabled={isGrantDisabled}
                  onClick={onGrantRep}
                  className={`${
                    isGrantDisabled
                      ? "tw-cursor-not-allowed tw-opacity-50"
                      : "tw-cursor-pointer hover:tw-border-primary-600 hover:tw-bg-primary-600"
                  } tw-w-full tw-rounded-lg tw-border tw-border-solid tw-border-primary-500 tw-bg-primary-500 tw-px-4 tw-py-3 tw-text-sm tw-font-semibold tw-text-white tw-transition tw-duration-300 tw-ease-out sm:tw-flex-1`}
                >
                  {mutating ? (
                    <div className="tw-w-12">
                      <CircleLoader />
                    </div>
                  ) : (
                    "Grant Rep"
                  )}
                </button>
                {onCancel && (
                  <button
                    type="button"
                    onClick={onCancel}
                    className="tw-mt-3 tw-w-full tw-cursor-pointer tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-px-4 tw-py-3 tw-text-sm tw-font-semibold tw-text-iron-300 tw-transition tw-duration-300 tw-ease-out hover:tw-bg-iron-800 sm:tw-mt-0 sm:tw-flex-1"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
        <AnimatePresence mode="wait" initial={false}>
          {!!errorMsg && (
            <UserPageRepNewRepError
              msg={errorMsg}
              showDetails={showErrorDetails}
              closeError={() => {
                setErrorMsg(null);
                setShowErrorDetails(true);
              }}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
