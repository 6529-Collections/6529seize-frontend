"use client";

import { AuthContext } from "@/components/auth/Auth";
import CircleLoader from "@/components/distribution-plan-tool/common/CircleLoader";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import UserRateAdjustmentHelper from "@/components/user/utils/rate/UserRateAdjustmentHelper";
import UserPageRateInput from "@/components/user/utils/rate/UserPageRateInput";
import type { ApiChangeWaveRepRating } from "@/generated/models/ApiChangeWaveRepRating";
import type { ApiWave } from "@/generated/models/ApiWave";
import {
  formatNumberWithCommas,
  getStringAsNumberOrZero,
} from "@/helpers/Helpers";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { getToastErrorDetails } from "@/helpers/toast.helpers";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useWaveRepAllocation } from "@/hooks/useWaveRepAllocation";
import { commonApiPost } from "@/services/api/common-api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useContext, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

const WAVE_REP_CATEGORY_PATTERN = /^[\p{L}\p{N}?!,.'() ]{1,100}$/u;
const CATEGORY_SETTLE_DELAY_MS = 350;
const WAVE_REP_MODAL_LOCALE = DEFAULT_LOCALE;

function getInitialCategory(wave: ApiWave): string {
  return wave.wave_rep?.categories?.[0]?.category ?? "quality";
}

export default function WaveRepRatingModal({
  wave,
  onClose,
}: {
  readonly wave: ApiWave;
  readonly onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const { activeProfileProxy, requestAuth, setToast } = useContext(AuthContext);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogTitleId = useId();
  const categoryInputId = useId();
  const categoryErrorId = useId();
  const amountInputId = useId();
  const [isMounted, setIsMounted] = useState(false);
  const [category, setCategory] = useState(() => getInitialCategory(wave));
  const trimmedCategory = category.trim();
  const debouncedCategory = useDebouncedValue(
    trimmedCategory,
    CATEGORY_SETTLE_DELAY_MS
  );
  const [settledCategory, setSettledCategory] = useState(trimmedCategory);
  const [amountStr, setAmountStr] = useState("0");
  const [amountDirty, setAmountDirty] = useState(false);
  const [mutating, setMutating] = useState(false);
  const lastSettledCategoryRef = useRef(settledCategory);
  const { currentRating, availableWaveRep, minMaxValues, isLoading } =
    useWaveRepAllocation({
      waveId: wave.id,
      category: settledCategory || null,
    });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) {
      return;
    }
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }
    if (!dialog.open) {
      dialog.showModal();
    }
    inputRef.current?.focus();
  }, [isMounted]);

  useEffect(() => {
    if (WAVE_REP_CATEGORY_PATTERN.test(debouncedCategory)) {
      setSettledCategory(debouncedCategory);
    }
  }, [debouncedCategory]);

  const categoryValid = WAVE_REP_CATEGORY_PATTERN.test(trimmedCategory);
  const categorySettled = trimmedCategory === settledCategory;
  const allocationReady = categoryValid && categorySettled && !isLoading;

  useEffect(() => {
    if (!allocationReady) {
      return;
    }

    if (lastSettledCategoryRef.current !== settledCategory) {
      lastSettledCategoryRef.current = settledCategory;
      if (!amountDirty) {
        setAmountStr(`${currentRating}`);
      }
      return;
    }

    if (!amountDirty) {
      setAmountStr(`${currentRating}`);
    }
  }, [allocationReady, amountDirty, currentRating, settledCategory]);

  const amount = getStringAsNumberOrZero(amountStr);
  const amountValid = amount >= minMaxValues.min && amount <= minMaxValues.max;
  const haveChanged = amount !== currentRating;
  const isProxyMode = Boolean(activeProfileProxy);
  const isSaveDisabled =
    isProxyMode || mutating || !allocationReady || !amountValid || !haveChanged;
  const canRemoveRating =
    !isProxyMode && !mutating && allocationReady && currentRating !== 0;
  const hasNoAvailableWaveRep =
    allocationReady && availableWaveRep <= 0 && currentRating === 0;

  const mutation = useMutation({
    mutationFn: async ({
      amount,
      category,
    }: {
      readonly amount: number;
      readonly category: string;
    }) =>
      await commonApiPost<ApiChangeWaveRepRating, void>({
        endpoint: `waves/${wave.id}/rep/rating`,
        body: {
          amount,
          category,
        },
      }),
    onSuccess: () => {
      setToast({
        message: "Wave REP updated.",
        type: "success",
      });
      queryClient.invalidateQueries({
        queryKey: [QueryKey.WAVE_REP_RATING],
      });
      queryClient.invalidateQueries({
        queryKey: [QueryKey.WAVE_REP_CREDIT],
      });
      queryClient.invalidateQueries({
        queryKey: [QueryKey.WAVE_REP_OVERVIEW],
      });
      queryClient.invalidateQueries({
        queryKey: [QueryKey.WAVE_REP_CATEGORIES],
      });
      queryClient.invalidateQueries({
        queryKey: [QueryKey.WAVE_REP_CATEGORY_CONTRIBUTORS],
      });
      queryClient.invalidateQueries({
        queryKey: [QueryKey.WAVE_REP_LOGS],
      });
      queryClient.invalidateQueries({
        queryKey: [QueryKey.WAVE],
      });
      queryClient.invalidateQueries({
        queryKey: [QueryKey.WAVES_V2],
      });
      queryClient.invalidateQueries({
        queryKey: [QueryKey.WAVE_SUBWAVES],
      });
    },
    onError: (error) => {
      setToast({
        type: "error",
        title: "Couldn't update Wave REP.",
        description: "Please try again.",
        details: getToastErrorDetails(error),
      });
    },
  });

  const saveRating = async (nextAmount: number) => {
    if (isProxyMode) {
      setToast({
        message: "Wave REP can't be changed while acting as proxy.",
        type: "error",
      });
      return;
    }
    const nextAmountValid =
      nextAmount >= minMaxValues.min && nextAmount <= minMaxValues.max;
    if (
      mutating ||
      !allocationReady ||
      !nextAmountValid ||
      nextAmount === currentRating
    ) {
      return;
    }
    setMutating(true);
    let mutationStarted = false;
    let shouldClose = false;
    try {
      const { success } = await requestAuth();
      if (!success) {
        setToast({
          message: "Log in to continue.",
          type: "error",
        });
        return;
      }
      mutationStarted = true;
      await mutation.mutateAsync({
        amount: nextAmount,
        category: trimmedCategory,
      });
      shouldClose = true;
    } catch (error) {
      if (!mutationStarted) {
        setToast({
          type: "error",
          title: "Couldn't verify your session.",
          description: "Please try again.",
          details: getToastErrorDetails(error),
        });
      }
    } finally {
      setMutating(false);
      if (shouldClose) onClose();
    }
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await saveRating(getStringAsNumberOrZero(amountStr));
  };

  const onRemove = async () => {
    if (!canRemoveRating) {
      return;
    }
    setAmountDirty(true);
    setAmountStr("0");
    await saveRating(0);
  };

  if (!isMounted || globalThis.document === undefined) {
    return null;
  }

  return createPortal(
    <dialog
      ref={dialogRef}
      aria-labelledby={dialogTitleId}
      onCancel={onClose}
      onClose={onClose}
      className="tailwind-scope tw-w-[min(100%-1rem,28rem)] tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-p-0 tw-text-left tw-text-iron-100 tw-shadow-xl backdrop:tw-bg-gray-600/50 backdrop:tw-backdrop-blur-[1px]"
    >
      <div className="tw-p-6">
        <div className="tw-flex tw-items-start tw-justify-between tw-gap-4">
          <div className="tw-min-w-0">
            <h2
              id={dialogTitleId}
              className="tw-mb-0 tw-text-lg tw-font-semibold tw-text-white"
            >
              Rate Wave REP
            </h2>
            <p className="tw-mb-0 tw-mt-1 tw-text-sm tw-text-iron-500">
              {wave.name}
            </p>
          </div>
          <button
            type="button"
            aria-label="Close Wave REP dialog"
            onClick={onClose}
            className="tw-flex tw-size-8 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-lg tw-border-0 tw-bg-transparent tw-text-iron-500 tw-transition hover:tw-bg-iron-800 hover:tw-text-white"
          >
            <XMarkIcon className="tw-size-5" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="tw-mt-5">
          <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-x-4 tw-gap-y-1.5 tw-text-xs tw-font-medium tw-text-iron-500">
            <span>
              Available Wave REP:
              <span className="tw-ml-1 tw-font-semibold tw-text-iron-300">
                {formatNumberWithCommas(availableWaveRep)}
              </span>
            </span>
            <span className="tw-h-3 tw-w-px tw-bg-white/20" />
            <span>
              Current category REP:
              <span className="tw-ml-1 tw-font-semibold tw-text-iron-300">
                {formatNumberWithCommas(currentRating)}
              </span>
            </span>
          </div>

          <div className="tw-mt-5">
            <label
              htmlFor={categoryInputId}
              className="tw-block tw-text-sm tw-font-medium tw-text-iron-400"
            >
              Category
            </label>
            <input
              ref={inputRef}
              id={categoryInputId}
              name="wave-rep-category"
              type="text"
              required
              autoComplete="off"
              aria-describedby={categoryErrorId}
              aria-invalid={!categoryValid}
              value={category}
              onChange={(event) => setCategory(event.currentTarget.value)}
              className="tw-mt-1.5 tw-block tw-w-full tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-px-3 tw-py-3 tw-text-sm tw-font-medium tw-text-white tw-caret-primary-400 tw-transition focus:tw-border-primary-400 focus:tw-outline-none"
            />
            <p
              id={categoryErrorId}
              role="alert"
              className={`tw-mb-0 tw-mt-2 tw-text-xs tw-font-medium tw-text-red ${
                categoryValid ? "tw-sr-only" : ""
              }`}
            >
              {categoryValid
                ? ""
                : "Use 1-100 letters, numbers, spaces, apostrophes, or basic punctuation."}
            </p>
          </div>

          <div className="tw-mt-5">
            <label
              htmlFor={amountInputId}
              className="tw-block tw-text-sm tw-font-medium tw-text-iron-400"
            >
              Your total Wave REP for this category
            </label>
            <div className="tw-relative tw-mt-1.5 tw-flex">
              <UserPageRateInput
                value={amountStr}
                onChange={(nextValue) => {
                  setAmountDirty(true);
                  setAmountStr(nextValue);
                }}
                minMax={minMaxValues}
                isProxy={false}
                inputId={amountInputId}
                required
              />
            </div>
            <UserRateAdjustmentHelper
              inLineValues={true}
              originalValue={currentRating}
              adjustedValue={amount}
              adjustmentType="Wave REP"
            />
            {hasNoAvailableWaveRep && (
              <p
                role="status"
                className="tw-mb-0 tw-mt-3 tw-rounded-lg tw-border tw-border-solid tw-border-amber-500/30 tw-bg-amber-500/10 tw-px-3 tw-py-2 tw-text-sm tw-font-medium tw-text-amber-200"
              >
                {t(WAVE_REP_MODAL_LOCALE, "waves.rep.modal.noAvailableCredit")}
              </p>
            )}
          </div>

          <div className="tw-mt-8 tw-flex tw-flex-col tw-gap-3 sm:tw-flex-row-reverse">
            <button
              type="submit"
              disabled={isSaveDisabled}
              aria-busy={mutating}
              aria-label={mutating ? "Saving Wave REP" : "Save Wave REP"}
              className={`${
                isSaveDisabled
                  ? "tw-cursor-not-allowed tw-opacity-50"
                  : "tw-cursor-pointer hover:tw-border-primary-600 hover:tw-bg-primary-600"
              } tw-flex tw-w-full tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-solid tw-border-primary-500 tw-bg-primary-500 tw-px-4 tw-py-3 tw-text-sm tw-font-semibold tw-text-white tw-transition sm:tw-w-auto`}
            >
              {mutating ? (
                <span className="tw-w-10">
                  <CircleLoader />
                  <span className="tw-sr-only">Saving Wave REP</span>
                </span>
              ) : (
                "Save"
              )}
            </button>
            {canRemoveRating && (
              <button
                type="button"
                onClick={onRemove}
                aria-label={t(
                  WAVE_REP_MODAL_LOCALE,
                  "waves.rep.modal.removeAriaLabel"
                )}
                className="tw-w-full tw-cursor-pointer tw-rounded-lg tw-border tw-border-solid tw-border-red/40 tw-bg-red/10 tw-px-4 tw-py-3 tw-text-sm tw-font-semibold tw-text-red tw-transition hover:tw-border-red/70 hover:tw-bg-red/15 sm:tw-w-auto"
              >
                {t(WAVE_REP_MODAL_LOCALE, "waves.rep.modal.remove")}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="tw-w-full tw-cursor-pointer tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-px-4 tw-py-3 tw-text-sm tw-font-semibold tw-text-iron-300 tw-transition hover:tw-bg-iron-800 sm:tw-w-auto"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </dialog>,
    document.body
  );
}
