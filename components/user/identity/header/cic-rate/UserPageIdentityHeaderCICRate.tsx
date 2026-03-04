"use client";

import type { FormEvent } from "react";
import { useContext, useEffect, useState } from "react";
import type { ApiProfileRaterCicState } from "@/entities/IProfile";
import { getStringAsNumberOrZero } from "@/helpers/Helpers";
import { AuthContext } from "@/components/auth/Auth";
import { commonApiFetch, commonApiPost } from "@/services/api/common-api";
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
  onSuccess,
}: {
  readonly profile: ApiIdentity;
  readonly isTooltip: boolean;
  readonly onSuccess?: () => void;
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
      onSuccess?.();
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
    isProxy || (newRating >= minMaxValues.min && newRating <= minMaxValues.max);
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
      className={`tw-relative tw-flex tw-w-full ${
        isTooltip ? "tw-mt-1.5" : "tw-mb-2"
      }`}
    >
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
    <div>
      <UserPageIdentityHeaderCICRateStats
        isTooltip={isTooltip}
        profile={profile}
        minMaxValues={minMaxValues}
        heroAvailableCredit={
          currentCICState?.cic_ratings_left_to_give_by_rater ?? 0
        }
      />
      <form onSubmit={onSubmit} className="tw-mt-6">
        {isTooltip ? (
          <>
            <div className="tw-flex tw-items-end tw-gap-3">
              <div className="tw-w-full sm:tw-w-auto">
                <label
                  htmlFor="nic-rating-input"
                  className="tw-block tw-max-w-[12rem] tw-text-sm tw-font-normal tw-text-iron-200"
                >
                  Your total NIC Rating of{" "}
                  <span className="tw-whitespace-nowrap">{profile.query}:</span>
                </label>
                {rateInput}
              </div>
              <div className="tw-w-full sm:tw-w-auto">
                <div className="tw-inline-flex tw-w-full tw-items-end tw-space-x-6 sm:tw-w-auto">
                  <button
                    type="submit"
                    disabled={isSaveDisabled}
                    className={`${
                      !isSaveDisabled
                        ? "hover:tw-border-emerald-400 hover:tw-bg-emerald-400"
                        : "tw-cursor-not-allowed tw-opacity-50"
                    } tw-w-full tw-rounded-lg tw-border tw-border-solid tw-border-emerald-500 tw-bg-emerald-500 tw-px-4 tw-py-3 tw-text-sm tw-font-semibold tw-text-white tw-shadow-lg tw-shadow-emerald-500/20 tw-transition tw-duration-300 tw-ease-out sm:tw-w-auto`}
                  >
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
              className="tw-mb-2 tw-block tw-text-sm tw-font-medium tw-text-iron-400"
            >
              Your total NIC Rating of{" "}
              <span className="tw-whitespace-nowrap">{profile.query}</span>
            </label>
            {rateInput}

            {adjustmentHelper}

            <button
              type="submit"
              disabled={isSaveDisabled}
              className={`${
                isSaveDisabled
                  ? "tw-cursor-not-allowed tw-opacity-50"
                  : "hover:tw-border-emerald-400 hover:tw-bg-emerald-400 active:tw-scale-[0.98]"
              } tw-mt-4 tw-w-full tw-rounded-lg tw-border tw-border-solid tw-border-emerald-500 tw-bg-emerald-500 tw-py-3.5 tw-text-sm tw-font-semibold tw-text-white tw-shadow-lg tw-shadow-emerald-500/20 tw-transition tw-duration-300 tw-ease-out`}
            >
              {fullButtonContent}
            </button>
          </>
        )}
      </form>
    </div>
  );
}
