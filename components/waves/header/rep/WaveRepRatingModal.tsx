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
import { getToastErrorDetails } from "@/helpers/toast.helpers";
import { useWaveRepAllocation } from "@/hooks/useWaveRepAllocation";
import { commonApiPost } from "@/services/api/common-api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useContext, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

const WAVE_REP_CATEGORY_PATTERN = /^[\p{L}\p{N}?!,."() ]{1,100}$/u;

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
  const { requestAuth, setToast } = useContext(AuthContext);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogTitleId = useId();
  const categoryInputId = useId();
  const categoryErrorId = useId();
  const amountInputId = useId();
  const [isMounted, setIsMounted] = useState(false);
  const [category, setCategory] = useState(getInitialCategory(wave));
  const trimmedCategory = category.trim();
  const [amountStr, setAmountStr] = useState("0");
  const [amountDirty, setAmountDirty] = useState(false);
  const [mutating, setMutating] = useState(false);
  const lastCategoryRef = useRef(trimmedCategory);
  const { currentRating, availableWaveRep, minMaxValues, isLoading } =
    useWaveRepAllocation({
      waveId: wave.id,
      category: trimmedCategory || null,
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
    if (lastCategoryRef.current !== trimmedCategory) {
      lastCategoryRef.current = trimmedCategory;
      setAmountDirty(false);
      setAmountStr(`${currentRating}`);
      return;
    }
    if (!amountDirty) {
      setAmountStr(`${currentRating}`);
    }
  }, [amountDirty, currentRating, trimmedCategory]);

  const amount = getStringAsNumberOrZero(amountStr);
  const categoryValid = WAVE_REP_CATEGORY_PATTERN.test(trimmedCategory);
  const amountValid = amount >= minMaxValues.min && amount <= minMaxValues.max;
  const haveChanged = amount !== currentRating;
  const isSaveDisabled =
    mutating || isLoading || !categoryValid || !amountValid || !haveChanged;

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
        queryKey: [QueryKey.WAVE],
      });
      queryClient.invalidateQueries({
        queryKey: [QueryKey.WAVES_V2],
      });
      queryClient.invalidateQueries({
        queryKey: [QueryKey.WAVE_SUBWAVES],
      });
      onClose();
    },
    onError: (error) => {
      setToast({
        type: "error",
        title: "Couldn't update Wave REP.",
        description: "Please try again.",
        details: getToastErrorDetails(error),
      });
    },
    onSettled: () => {
      setMutating(false);
    },
  });

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSaveDisabled) {
      return;
    }
    setMutating(true);
    let mutationStarted = false;
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
        amount,
        category: trimmedCategory,
      });
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
    }
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
              aria-describedby={categoryValid ? undefined : categoryErrorId}
              aria-invalid={!categoryValid}
              value={category}
              onChange={(event) => setCategory(event.currentTarget.value)}
              className="tw-mt-1.5 tw-block tw-w-full tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-px-3 tw-py-3 tw-text-sm tw-font-medium tw-text-white tw-caret-primary-400 tw-transition focus:tw-border-primary-400 focus:tw-outline-none"
            />
            {!categoryValid && (
              <p
                id={categoryErrorId}
                role="alert"
                className="tw-mb-0 tw-mt-2 tw-text-xs tw-font-medium tw-text-red"
              >
                Use 1-100 letters, numbers, spaces, or basic punctuation.
              </p>
            )}
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
