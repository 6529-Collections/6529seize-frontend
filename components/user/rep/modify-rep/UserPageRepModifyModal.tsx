"use client";

import { AuthContext } from "@/components/auth/Auth";
import CircleLoader from "@/components/distribution-plan-tool/common/CircleLoader";
import {
    QueryKey,
    ReactQueryWrapperContext,
} from "@/components/react-query-wrapper/ReactQueryWrapper";
import UserRateAdjustmentHelper from "@/components/user/utils/rate/UserRateAdjustmentHelper";
import {
    ApiProfileRepRatesState,
    RatingStats,
} from "@/entities/IProfile";
import { ApiIdentity } from "@/generated/models/ApiIdentity";
import { ApiProfileProxyActionType } from "@/generated/models/ApiProfileProxyActionType";
import { getStringAsNumberOrZero } from "@/helpers/Helpers";
import {
    commonApiFetch,
    commonApiPost,
} from "@/services/api/common-api";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { useClickAway, useKeyPressEvent } from "react-use";
import UserPageRepModifyModalHeader from "./UserPageRepModifyModalHeader";
import UserPageRepModifyModalRaterStats from "./UserPageRepModifyModalRaterStats";
interface ApiAddRepRatingToProfileRequest {
  readonly amount: number;
  readonly category: string;
}

export default function UserPageRepModifyModal({
  onClose,
  profile,
  category,
}: {
  readonly onClose: () => void;
  readonly profile: ApiIdentity;
  readonly category: string;
}) {
  const { onProfileRepModify } = useContext(ReactQueryWrapperContext);
  const { requestAuth, setToast, connectedProfile, activeProfileProxy } =
    useContext(AuthContext);

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

  const { data: connectedProfileRepRates } = useQuery<ApiProfileRepRatesState>({
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
          ? { rater: connectedProfile?.handle }
          : {},
      }),
    enabled: !!connectedProfile?.handle,
  });

  const proxyAvailableCredit = useMemo((): number | null => {
    const repProxy = activeProfileProxy?.actions.find(
      (a) => a.action_type === ApiProfileProxyActionType.AllocateRep
    );
    if (!repProxy) {
      return null;
    }
    return Math.max(
      (repProxy.credit_amount ?? 0) - (repProxy.credit_spent ?? 0),
      0
    );
  }, [activeProfileProxy]);

  const getRepState = useCallback((): RatingStats | null => {
    if (activeProfileProxy && proxyGrantorRepRates) {
      const target = proxyGrantorRepRates.rating_stats.find(
        (s) => s.category === category
      );
      return (
        target ?? {
          category,
          rating: 0,
          contributor_count: 0,
          rater_contribution: 0,
        }
      );
    }

    if (activeProfileProxy) {
      return null;
    }

    if (connectedProfileRepRates) {
      const target = connectedProfileRepRates.rating_stats.find(
        (s) => s.category === category
      );
      return (
        target ?? {
          category,
          rating: 0,
          contributor_count: 0,
          rater_contribution: 0,
        }
      );
    }

    return null;
  }, [
    activeProfileProxy,
    category,
    connectedProfileRepRates,
    proxyGrantorRepRates,
  ]);

  const [repState, setRepState] = useState<RatingStats | null>(getRepState());
  const [adjustedRatingStr, setAdjustedRatingStr] = useState<string>(
    `${getRepState()?.rater_contribution ?? 0}`
  );

  const heroAvailableRep = useMemo((): number => {
    if (activeProfileProxy) {
      return proxyGrantorRepRates?.rep_rates_left_for_rater ?? 0;
    }
    return connectedProfileRepRates?.rep_rates_left_for_rater ?? 0;
  }, [activeProfileProxy, proxyGrantorRepRates, connectedProfileRepRates]);

  const minMaxValues = useMemo(
    (): { readonly min: number; readonly max: number } => {
      const currentRep = repState?.rater_contribution ?? 0;
      const minHeroRep = 0 - (Math.abs(currentRep) + heroAvailableRep);
      let min = minHeroRep;

      if (typeof proxyAvailableCredit === "number") {
        const minProxyRep = currentRep - proxyAvailableCredit;
        min =
          Math.abs(minHeroRep) < Math.abs(minProxyRep)
            ? minHeroRep
            : minProxyRep;
      }

      const maxHeroRep = Math.abs(currentRep) + heroAvailableRep;
      let max = maxHeroRep;

      if (typeof proxyAvailableCredit === "number") {
        const maxProxyRep = currentRep + proxyAvailableCredit;
        max = Math.min(maxHeroRep, maxProxyRep);
      }

      return { min, max };
    },
    [repState, heroAvailableRep, proxyAvailableCredit]
  );

  useEffect(() => {
    const newState = getRepState();
    setRepState(newState);
    setAdjustedRatingStr(`${newState?.rater_contribution ?? 0}`);
  }, [getRepState]);

  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [inputRef]);

  const modalRef = useRef<HTMLDivElement>(null);
  useClickAway(modalRef, onClose);
  useKeyPressEvent("Escape", onClose);

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (globalThis.document === undefined || globalThis.window === undefined) {
      return;
    }

    const currentWindow = globalThis.window;
    const previousOverflow = document.body.style.overflow;
    const previousPaddingRight = document.body.style.paddingRight;
    const scrollbarGap =
      currentWindow.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = "hidden";
    if (scrollbarGap > 0) {
      document.body.style.paddingRight = `${scrollbarGap}px`;
    }

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPaddingRight;
    };
  }, []);

  const getValueStr = (value: string): string => {
    if (value.length > 1 && value.startsWith("0")) {
      return value.slice(1);
    }

    return value;
  };

  const adjustStrValueToMinMax = (): void => {
    const { min, max } = minMaxValues;
    const valueAsNumber = getStringAsNumberOrZero(adjustedRatingStr);
    if (valueAsNumber > max) {
      setAdjustedRatingStr(`${max}`);
      return;
    }

    if (valueAsNumber < min) {
      setAdjustedRatingStr(`${min}`);
    }
  };

  const onValueChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = event.currentTarget.value;
    const strCIC = ["-0", "0-"].includes(inputValue) ? "-" : inputValue;
    if (/^-?\d*$/.test(strCIC)) {
      const newCicValue = getValueStr(strCIC);
      setAdjustedRatingStr(newCicValue);
    }
  };

  const isValidValue = useMemo(() => {
    const { min, max } = minMaxValues;
    const valueAsNumber = getStringAsNumberOrZero(adjustedRatingStr);
    return valueAsNumber >= min && valueAsNumber <= max;
  }, [adjustedRatingStr, minMaxValues]);

  const newRating = useMemo(
    () => getStringAsNumberOrZero(adjustedRatingStr),
    [adjustedRatingStr]
  );

  const haveChanged = newRating !== repState?.rater_contribution;

  const isSaveDisabled = !repState || !haveChanged || !isValidValue;

  const [mutating, setMutating] = useState<boolean>(false);

  const addRepMutation = useMutation({
    mutationFn: async ({
      amount,
      category,
    }: {
      amount: number;
      category: string;
    }) =>
      await commonApiPost<ApiAddRepRatingToProfileRequest, void>({
        endpoint: `profiles/${profile?.query}/rep/rating`,
        body: {
          amount,
          category,
        },
      }),
    onSuccess: () => {
      setToast({
        message: "Rep updated.",
        type: "success",
      });
      onProfileRepModify({
        targetProfile: profile,
        connectedProfile,
        profileProxy: activeProfileProxy ?? null,
      });
      onClose();
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

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (mutating) {
      return;
    }
    setMutating(true);
    const { success } = await requestAuth();
    if (!success) {
      setToast({
        message: "You must be logged in.",
        type: "error",
      });
      setMutating(false);
      return;
    }
    if (!haveChanged) {
      setMutating(false);
      return;
    }

    await addRepMutation.mutateAsync({
      amount: newRating,
      category,
    });
  };

  if (!isMounted || globalThis.document === undefined) {
    return null;
  }

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="tailwind-scope tw-fixed tw-inset-0 tw-z-[1100] tw-cursor-default">
      <div className="tw-absolute tw-inset-0 tw-bg-gray-600 tw-bg-opacity-50 tw-backdrop-blur-[1px]" />
      <div className="tw-relative tw-flex tw-min-h-full tw-w-full tw-overflow-y-auto tw-items-end tw-justify-center tw-text-center sm:tw-items-center tw-p-2 lg:tw-p-0">
        <div
          ref={modalRef}
          className="sm:tw-max-w-md tw-relative tw-w-full tw-transform tw-rounded-xl tw-bg-iron-950 tw-text-left tw-shadow-xl tw-transition-all tw-duration-500 sm:tw-w-full tw-p-6">
          <UserPageRepModifyModalHeader
            handleOrWallet={
              profile.query ?? profile.handle ?? profile.display
            }
            onClose={onClose}
          />
          {repState && (
            <UserPageRepModifyModalRaterStats
              repState={repState}
              minMaxValues={minMaxValues}
              heroAvailableCredit={heroAvailableRep}
            />
          )}
          <form onSubmit={onSubmit} className="tw-mt-4">
            <div>
              <label className="tw-block tw-text-sm tw-font-normal tw-leading-5 tw-text-iron-400">
                Your total Rep for {category}:
              </label>
              <div className="tw-relative tw-flex tw-mt-1.5">
                <span className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-bg-iron-900 tw-rounded-l-lg tw-border tw-border-solid tw-border-iron-700 tw-px-3">
                  <svg
                    className="tw-w-3.5 tw-h-3.5 tw-flex-shrink-0 tw-text-iron-500"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
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
                    aria-hidden="true"
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
                  ref={inputRef}
                  type="text"
                  required
                  autoComplete="off"
                  value={adjustedRatingStr}
                  onChange={onValueChange}
                  onBlur={adjustStrValueToMinMax}
                  className={`${
                    isValidValue
                      ? "focus:tw-ring-primary-400"
                      : "focus:tw-ring-red"
                  } tw-appearance-none -tw-ml-0.5 tw-block tw-w-full tw-rounded-l-none tw-rounded-r-lg tw-border-0 tw-py-3 tw-px-3 tw-bg-iron-900 focus:tw-bg-iron-950 tw-text-iron-300 tw-font-medium tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-700 hover:tw-ring-iron-600 placeholder:tw-text-iron-500 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset tw-text-base tw-transition tw-duration-300 tw-ease-out`}
                />
              </div>
              <UserRateAdjustmentHelper
                inLineValues={true}
                originalValue={repState?.rater_contribution ?? 0}
                adjustedValue={getStringAsNumberOrZero(adjustedRatingStr)}
                adjustmentType="Rep"
              />
            </div>

            <div className="tw-mt-8">
              <div className="sm:tw-flex sm:tw-flex-row-reverse tw-gap-x-3">
                <button
                  type="submit"
                  disabled={isSaveDisabled}
                  className={`${
                    !isSaveDisabled
                      ? "tw-cursor-pointer hover:tw-bg-primary-600 hover:tw-border-primary-600"
                      : "tw-cursor-not-allowed tw-opacity-50"
                  } tw-w-full sm:tw-w-auto tw-bg-primary-500 tw-border-primary-500 tw-px-4 tw-py-3 tw-text-sm tw-font-semibold tw-text-white tw-border tw-border-solid  tw-rounded-lg  tw-transition tw-duration-300 tw-ease-out`}>
                  {mutating ? (
                    <div className="tw-w-8">
                      <CircleLoader />
                    </div>
                  ) : (
                    <>Save</>
                  )}
                </button>
                <button
                  onClick={onClose}
                  type="button"
                  className="tw-mt-3 sm:tw-mt-0 tw-w-full sm:tw-w-auto tw-cursor-pointer tw-bg-iron-900 tw-px-4 tw-py-3 tw-text-sm tw-font-semibold tw-text-white tw-border tw-border-solid tw-border-iron-700 tw-rounded-lg hover:tw-bg-iron-800 tw-transition tw-duration-300 tw-ease-out">
                  Cancel
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </motion.div>,
    document.body
  );
}
