"use client";

import type { FormEvent } from "react";
import { useContext, useEffect, useState } from "react";
import type { ApiProfileRaterCicState } from "@/entities/IProfile";
import { getStringAsNumberOrZero } from "@/helpers/Helpers";
import { AuthContext } from "@/components/auth/Auth";
import {
  commonApiFetch,
  commonApiPost,
} from "@/services/api/common-api";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  QueryKey,
  ReactQueryWrapperContext,
} from "@/components/react-query-wrapper/ReactQueryWrapper";

import UserRateAdjustmentHelper from "@/components/user/utils/rate/UserRateAdjustmentHelper";
import UserPageRateInput from "@/components/user/utils/rate/UserPageRateInput";
import CircleLoader from "@/components/distribution-plan-tool/common/CircleLoader";
import { ApiProfileProxyActionType } from "@/generated/models/ApiProfileProxyActionType";
import UserPageIdentityHeaderCICRateStats from "./UserPageIdentityHeaderCICRateStats";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";

const CIC_SPAN_CLASS_NAME =
  "tw-flex tw-flex-col tw-items-center tw-justify-center tw-bg-black/40 tw-rounded-l-lg tw-border tw-border-solid tw-border-white/[0.15] tw-px-3";

const CIC_FOCUS_RING_CLASS_NAME =
  "focus:tw-border-emerald-500 focus:tw-ring-1 focus:tw-ring-emerald-500/30";

const CIC_INPUT_TOOLTIP_CLASS_NAME =
  "tw-max-w-[12rem] -tw-ml-0.5 tw-appearance-none tw-block tw-rounded-l-none tw-rounded-r-lg tw-border tw-border-solid tw-border-white/[0.15] tw-py-3 tw-px-3 tw-bg-black/40 focus:tw-bg-black/60 tw-text-white tw-font-semibold tw-caret-emerald-400 tw-shadow-inner hover:tw-border-white/30 placeholder:tw-text-iron-500 focus:tw-outline-none tw-text-base sm:tw-text-sm tw-transition tw-duration-300 tw-ease-out";

const CIC_INPUT_FULL_CLASS_NAME =
  "tw-w-full -tw-ml-0.5 tw-appearance-none tw-block tw-rounded-l-none tw-rounded-r-lg tw-border tw-border-solid tw-border-white/[0.15] tw-py-3.5 tw-px-4 tw-bg-black/40 focus:tw-bg-black/60 tw-text-white tw-font-semibold tw-caret-emerald-400 tw-shadow-inner hover:tw-border-white/30 placeholder:tw-text-iron-500 focus:tw-outline-none tw-text-base sm:tw-text-sm tw-transition tw-duration-300 tw-ease-out";

export default function UserPageIdentityHeaderCICRate({
  profile,
  isTooltip,
}: {
  readonly profile: ApiIdentity;
  readonly isTooltip: boolean;
}) {
  const { address } = useSeizeConnectContext();
  const { requestAuth, setToast, connectedProfile, activeProfileProxy } =
    useContext(AuthContext);

  const { onProfileCICModify } = useContext(ReactQueryWrapperContext);

  const { data: currentCICState } = useQuery<ApiProfileRaterCicState>({
    queryKey: [
      QueryKey.PROFILE_RATER_CIC_STATE,
      {
        handle: profile?.handle?.toLowerCase(),
        rater: activeProfileProxy?.created_by.handle ?? address?.toLowerCase(),
      },
    ],
    queryFn: async () =>
      await commonApiFetch<ApiProfileRaterCicState>({
        endpoint: `profiles/${profile.query}/cic/rating/${
          activeProfileProxy?.created_by.handle ?? address?.toLowerCase()
        }`,
      }),
    enabled: !!address,
    staleTime: 0,
  });

  const [mutating, setMutating] = useState<boolean>(false);

  const updateCICMutation = useMutation({
    mutationFn: async (amount: number) => {
      setMutating(true);
      return await commonApiPost({
        endpoint: `profiles/${profile.query}/cic/rating`,
        body: {
          amount,
        },
      });
    },
    onSuccess: () => {
      setToast({
        message: "NIC rating updated.",
        type: "success",
      });
      onProfileCICModify({
        targetProfile: profile,
        connectedProfile: connectedProfile ?? null,
        rater:
          activeProfileProxy?.created_by.handle ??
          address?.toLowerCase() ??
          null,
        profileProxy: activeProfileProxy ?? null,
      });
    },
    onError: (error) => {
      setToast({
        message: error as unknown as string,
        type: "error",
      });
    },
    onSettled: () => {
      setMutating(false);
    },
  });

  const getProxyAvailableCredit = (): number | null => {
    const repProxy = activeProfileProxy?.actions.find(
      (a) => a.action_type === ApiProfileProxyActionType.AllocateCic
    );
    if (!repProxy) {
      return null;
    }
    return Math.max(
      (repProxy.credit_amount ?? 0) - (repProxy.credit_spent ?? 0),
      0
    );
  };

  const [proxyAvailableCredit, setProxyAvailableCredit] = useState<
    number | null
  >(getProxyAvailableCredit());

  useEffect(
    () => setProxyAvailableCredit(getProxyAvailableCredit()),
    [activeProfileProxy]
  );

  const getMinValue = (): number => {
    const currentCic = currentCICState?.cic_rating_by_rater ?? 0;
    const heroAvailableCic =
      currentCICState?.cic_ratings_left_to_give_by_rater ?? 0;
    const minHeroCic = 0 - (Math.abs(currentCic) + heroAvailableCic);
    if (typeof proxyAvailableCredit !== "number") {
      return minHeroCic;
    }
    const minProxyRep = currentCic - proxyAvailableCredit;

    return Math.abs(minHeroCic) < Math.abs(minProxyRep)
      ? minHeroCic
      : minProxyRep;
  };

  const getMaxValue = (): number => {
    const currentCic = currentCICState?.cic_rating_by_rater ?? 0;
    const heroAvailableCic =
      currentCICState?.cic_ratings_left_to_give_by_rater ?? 0;
    const maxHeroCic = Math.abs(currentCic) + heroAvailableCic;
    if (typeof proxyAvailableCredit !== "number") {
      return maxHeroCic;
    }
    const maxProxyRep = currentCic + proxyAvailableCredit;

    return Math.min(maxHeroCic, maxProxyRep);
  };

  const getMinMaxValues = (): {
    readonly min: number;
    readonly max: number;
  } => ({
    min: getMinValue(),
    max: getMaxValue(),
  });

  const [minMaxValues, setMinMaxValues] = useState<{
    readonly min: number;
    readonly max: number;
  }>(getMinMaxValues());

  useEffect(
    () => setMinMaxValues(getMinMaxValues()),
    [currentCICState, proxyAvailableCredit]
  );

  const [originalRating, setOriginalRating] = useState<number>(
    currentCICState?.cic_rating_by_rater ?? 0
  );

  const [adjustedRatingStr, setAdjustedRatingStr] = useState<string>(
    `${originalRating}`
  );

  useEffect(() => {
    setOriginalRating(currentCICState?.cic_rating_by_rater ?? 0);
    setAdjustedRatingStr(`${currentCICState?.cic_rating_by_rater ?? 0}`);
  }, [currentCICState]);

  const newRating = getStringAsNumberOrZero(adjustedRatingStr);
  const haveChanged = newRating !== originalRating;
  const isProxy = !!activeProfileProxy;
  const isValidValue =
    isProxy ||
    (newRating >= minMaxValues.min && newRating <= minMaxValues.max);
  const isSaveDisabled = !haveChanged || !isValidValue;

  const onSave = async () => {
    const { success } = await requestAuth();
    if (!success) {
      setToast({
        message: "You must be logged in.",
        type: "error",
      });
      return;
    }
    if (!haveChanged || !isValidValue) {
      return;
    }

    await updateCICMutation.mutateAsync(newRating);
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await onSave();
  };

  const rateInput = (
    <div
      className={`tw-w-full tw-relative tw-flex ${
        isTooltip ? "tw-mt-1.5" : "tw-mb-4"
      }`}>
      <UserPageRateInput
        value={adjustedRatingStr}
        onChange={setAdjustedRatingStr}
        minMax={minMaxValues}
        isProxy={isProxy}
        spanClassName={CIC_SPAN_CLASS_NAME}
        inputClassName={
          isTooltip ? CIC_INPUT_TOOLTIP_CLASS_NAME : CIC_INPUT_FULL_CLASS_NAME
        }
        inputId="nic-rating-input"
        focusRingClassName={CIC_FOCUS_RING_CLASS_NAME}
        required
      />
    </div>
  );

  const tooltipButtonContent = mutating ? (
    <div className="tw-w-8">
      <CircleLoader />
    </div>
  ) : (
    <>Rate</>
  );

  const fullButtonContent = mutating ? (
    <div className="tw-flex tw-items-center tw-justify-center">
      <div className="tw-w-8">
        <CircleLoader />
      </div>
    </div>
  ) : (
    <>Rate</>
  );

  const adjustmentHelper = (
    <UserRateAdjustmentHelper
      inLineValues={isTooltip}
      originalValue={originalRating}
      adjustedValue={newRating}
      adjustmentType="NIC"
    />
  );

  return (
    <div
      className={`${
        isTooltip
          ? ""
          : "tw-pt-6 tw-border-t tw-border-x-0 tw-border-b-0 tw-border-solid tw-border-white/10"
      } `}>
      {!isTooltip && (
        <div className="tw-hidden lg:tw-flex tw-items-center tw-gap-2 tw-mb-4">
          <svg
            className="tw-w-4 tw-h-4 tw-flex-shrink-0 tw-text-emerald-400"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg">
            <path d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4" />
            <path d="M14 13.12c0 2.38 0 6.38-1 8.88" />
            <path d="M17.29 21.02c.12-.6.43-2.3.5-3.02" />
            <path d="M2 12a10 10 0 0 1 18-6" />
            <path d="M2 16h.01" />
            <path d="M21.8 16c.2-2 .131-5.354 0-6" />
            <path d="M5 19.5C5.5 18 6 15 6 12a6 6 0 0 1 .34-2" />
            <path d="M8.65 22c.21-.66.45-1.32.57-2" />
            <path d="M9 6.8a6 6 0 0 1 9 5.2v2" />
          </svg>
          <span className="tw-text-base tw-font-semibold tw-text-emerald-400">
            Rate NIC
          </span>
        </div>
      )}
      <UserPageIdentityHeaderCICRateStats
        isTooltip={isTooltip}
        profile={profile}
        minMaxValues={minMaxValues}
        heroAvailableCredit={
          currentCICState?.cic_ratings_left_to_give_by_rater ?? 0
        }
      />
      <form
        onSubmit={onSubmit}
        className="tw-mt-4">
        {isTooltip ? (
          <>
            <div className="tw-flex tw-items-end tw-gap-3">
              <div className="tw-w-full sm:tw-w-auto">
                <label
                  htmlFor="nic-rating-input"
                  className="tw-max-w-[12rem] tw-block tw-text-sm tw-font-normal tw-text-iron-200">
                  Your total NIC Rating of{" "}
                  <span className="tw-whitespace-nowrap">
                    {profile.query}:
                  </span>
                </label>
                {rateInput}
              </div>
              <div className="tw-w-full sm:tw-w-auto">
                <div className="tw-w-full sm:tw-w-auto tw-inline-flex tw-items-end tw-space-x-6">
                  <button
                    type="submit"
                    disabled={isSaveDisabled}
                    className={`${
                      !isSaveDisabled
                        ? "hover:tw-bg-emerald-400 hover:tw-border-emerald-400"
                        : "tw-cursor-not-allowed tw-opacity-50"
                    } tw-w-full sm:tw-w-auto tw-bg-emerald-500 tw-px-4 tw-py-3 tw-text-sm tw-font-semibold tw-text-white tw-border tw-border-solid tw-border-emerald-500 tw-rounded-lg tw-shadow-lg tw-shadow-emerald-500/20 tw-transition tw-duration-300 tw-ease-out`}>
                    {tooltipButtonContent}
                  </button>
                </div>
              </div>
            </div>
            {adjustmentHelper}
          </>
        ) : (
          <>
            <label
              htmlFor="nic-rating-input"
              className="tw-block tw-text-xs tw-font-medium tw-text-iron-400 tw-mb-2">
              Your total NIC Rating of{" "}
              <span className="tw-whitespace-nowrap">{profile.query}</span>
            </label>
            {rateInput}

            {adjustmentHelper}

            <button
              type="submit"
              disabled={isSaveDisabled}
              className={`${
                !isSaveDisabled
                  ? "hover:tw-bg-emerald-400 hover:tw-border-emerald-400 active:tw-scale-[0.98]"
                  : "tw-cursor-not-allowed tw-opacity-50"
              } tw-mt-4 tw-w-full tw-bg-emerald-500 tw-py-3.5 tw-text-sm tw-font-semibold tw-text-white tw-border tw-border-solid tw-border-emerald-500 tw-rounded-lg tw-shadow-lg tw-shadow-emerald-500/20 tw-transition tw-duration-300 tw-ease-out`}>
              {fullButtonContent}
            </button>
          </>
        )}
      </form>
    </div>
  );
}
