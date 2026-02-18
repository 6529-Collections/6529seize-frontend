"use client";

import type { FormEvent} from "react";
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
import CircleLoader from "@/components/distribution-plan-tool/common/CircleLoader";
import { ApiProfileProxyActionType } from "@/generated/models/ApiProfileProxyActionType";
import UserPageIdentityHeaderCICRateStats from "./UserPageIdentityHeaderCICRateStats";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";

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

  const getValueStr = (strCIC: string): string => {
    if (strCIC.length > 1 && strCIC.startsWith("0")) {
      return strCIC.slice(1);
    }
    return strCIC;
  };

  useEffect(() => {
    setOriginalRating(currentCICState?.cic_rating_by_rater ?? 0);
    setAdjustedRatingStr(`${currentCICState?.cic_rating_by_rater ?? 0}`);
  }, [currentCICState]);

  const onValueChange = (e: FormEvent<HTMLInputElement>) => {
    const inputValue = e.currentTarget.value;
    const strCIC = ["-0", "0-"].includes(inputValue) ? "-" : inputValue;
    if (/^-?\d*$/.test(strCIC)) {
      const newCicValue = getValueStr(strCIC);
      setAdjustedRatingStr(newCicValue);
    }
  };

  const adjustStrValueToMinMax = (): void => {
    if (activeProfileProxy) {
      return;
    }
    const { min, max } = getMinMaxValues();
    const valueAsNumber = getStringAsNumberOrZero(adjustedRatingStr);
    if (valueAsNumber > max) {
      setAdjustedRatingStr(`${max}`);
      return;
    }

    if (valueAsNumber < min) {
      setAdjustedRatingStr(`${min}`);
    }
  };

  const getIsValidValue = (): boolean => {
    if (activeProfileProxy) {
      return true;
    }
    const { min, max } = minMaxValues;
    const valueAsNumber = getStringAsNumberOrZero(adjustedRatingStr);
    if (valueAsNumber > max) {
      return false;
    }

    if (valueAsNumber < min) {
      return false;
    }
    return true;
  };

  const [isValidValue, setIsValidValue] = useState<boolean>(getIsValidValue());

  useEffect(() => setIsValidValue(getIsValidValue()), [adjustedRatingStr]);

  const [newRating, setNewRating] = useState<number>(
    getStringAsNumberOrZero(adjustedRatingStr)
  );

  useEffect(() => {
    setNewRating(getStringAsNumberOrZero(adjustedRatingStr));
  }, [adjustedRatingStr]);

  const [haveChanged, setHaveChanged] = useState<boolean>(
    newRating !== originalRating
  );

  useEffect(() => {
    setHaveChanged(newRating !== originalRating);
  }, [newRating, originalRating]);

  const getIsSaveDisabled = (): boolean => {
    if (!haveChanged) {
      return true;
    }

    if (!isValidValue) {
      return true;
    }

    return false;
  };

  const [isSaveDisabled, setIsSaveDisabled] = useState<boolean>(
    getIsSaveDisabled()
  );

  useEffect(() => {
    setIsSaveDisabled(getIsSaveDisabled());
  }, [haveChanged, isValidValue]);

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

  return (
    <div
      className={`${
        isTooltip
          ? ""
          : "tw-pt-6 tw-border-t tw-border-x-0 tw-border-b-0 tw-border-solid tw-border-white/10"
      } `}>
      {!isTooltip && (
        <div className="tw-flex tw-items-center tw-gap-2 tw-mb-4">
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
          <span className="tw-text-sm tw-font-bold tw-text-emerald-400">
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
        className={`${isTooltip ? "tw-mt-4" : "tw-mt-4"}`}>
        {isTooltip ? (
          <>
            <div className="tw-flex tw-items-end tw-gap-3">
              <div className="tw-w-full sm:tw-w-auto">
                <label
                  htmlFor="nic-rating-input"
                  className="tw-max-w-[12rem] tw-block tw-text-sm tw-font-normal tw-text-iron-200">
                  Your total NIC Rating of{" "}
                  <span className="tw-whitespace-nowrap">{profile.query}:</span>
                </label>
                <div className="tw-w-full tw-relative tw-flex tw-mt-1.5">
                  <span className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-bg-black/40 tw-rounded-l-lg tw-border tw-border-solid tw-border-white/10 tw-px-3">
                    <svg
                      className="tw-w-3.5 tw-h-3.5 tw-flex-shrink-0 tw-text-iron-500"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M12 5V19M5 12H19"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <svg
                      className="tw-w-3.5 tw-h-3.5 tw-flex-shrink-0 tw-text-iron-500"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M5 12H19"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  <input
                    type="text"
                    id="nic-rating-input"
                    value={adjustedRatingStr}
                    onChange={onValueChange}
                    onBlur={adjustStrValueToMinMax}
                    required
                    autoComplete="off"
                    className="tw-max-w-[12rem] -tw-ml-0.5 tw-appearance-none tw-block tw-rounded-l-none tw-rounded-r-lg tw-border-0 tw-ring-1 tw-ring-inset tw-ring-white/10 tw-py-3 tw-px-3 tw-bg-black/40 focus:tw-bg-black/60 tw-text-white tw-font-medium tw-caret-emerald-400 tw-shadow-inner hover:tw-ring-white/20 placeholder:tw-text-iron-500 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-emerald-500/30 tw-text-sm tw-transition tw-duration-300 tw-ease-out"
                  />
                </div>
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
                    {mutating ? (
                      <div className="tw-w-8">
                        <CircleLoader />
                      </div>
                    ) : (
                      <>Rate</>
                    )}
                  </button>
                </div>
              </div>
            </div>
            <UserRateAdjustmentHelper
              inLineValues={true}
              originalValue={originalRating}
              adjustedValue={getStringAsNumberOrZero(adjustedRatingStr)}
              adjustmentType="NIC"
            />
          </>
        ) : (
          <>
            <label
              htmlFor="nic-rating-input"
              className="tw-block tw-text-[11px] tw-font-bold tw-text-iron-500 tw-uppercase tw-tracking-widest tw-mb-2">
              Your total NIC Rating of{" "}
              <span className="tw-whitespace-nowrap">{profile.query}</span>
            </label>
            <div className="tw-w-full tw-relative tw-flex tw-mb-4">
              <span className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-bg-black/40 tw-rounded-l-lg tw-border tw-border-solid tw-border-white/10 tw-px-3">
                <svg
                  className="tw-w-3.5 tw-h-3.5 tw-flex-shrink-0 tw-text-iron-500"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M12 5V19M5 12H19"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <svg
                  className="tw-w-3.5 tw-h-3.5 tw-flex-shrink-0 tw-text-iron-500"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M5 12H19"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <input
                type="text"
                id="nic-rating-input"
                value={adjustedRatingStr}
                onChange={onValueChange}
                onBlur={adjustStrValueToMinMax}
                required
                autoComplete="off"
                className="tw-w-full -tw-ml-0.5 tw-appearance-none tw-block tw-rounded-l-none tw-rounded-r-lg tw-border-0 tw-ring-1 tw-ring-inset tw-ring-white/10 tw-py-3.5 tw-px-4 tw-bg-black/40 focus:tw-bg-black/60 tw-text-white tw-text-sm tw-font-medium tw-caret-emerald-400 tw-shadow-inner hover:tw-ring-white/20 placeholder:tw-text-iron-500 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-emerald-500/30 tw-transition tw-duration-300 tw-ease-out"
              />
            </div>

            <UserRateAdjustmentHelper
              inLineValues={false}
              originalValue={originalRating}
              adjustedValue={getStringAsNumberOrZero(adjustedRatingStr)}
              adjustmentType="NIC"
            />

            <button
              type="submit"
              disabled={isSaveDisabled}
              className={`${
                !isSaveDisabled
                  ? "hover:tw-bg-emerald-400 hover:tw-border-emerald-400 active:tw-scale-[0.98]"
                  : "tw-cursor-not-allowed tw-opacity-50"
              } tw-mt-4 tw-w-full tw-bg-emerald-500 tw-py-3.5 tw-text-sm tw-font-semibold tw-text-white tw-border tw-border-solid tw-border-emerald-500 tw-rounded-lg tw-shadow-lg tw-shadow-emerald-500/20 tw-transition tw-duration-300 tw-ease-out`}>
              {mutating ? (
                <div className="tw-flex tw-items-center tw-justify-center">
                  <div className="tw-w-8">
                    <CircleLoader />
                  </div>
                </div>
              ) : (
                <>Rate</>
              )}
            </button>
          </>
        )}
      </form>
    </div>
  );
}
