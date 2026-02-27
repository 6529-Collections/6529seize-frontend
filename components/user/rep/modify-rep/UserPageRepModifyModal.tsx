"use client";

import { AuthContext } from "@/components/auth/Auth";
import CircleLoader from "@/components/distribution-plan-tool/common/CircleLoader";
import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";
import UserRateAdjustmentHelper from "@/components/user/utils/rate/UserRateAdjustmentHelper";
import UserPageRateInput from "@/components/user/utils/rate/UserPageRateInput";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { getStringAsNumberOrZero } from "@/helpers/Helpers";
import { commonApiPost } from "@/services/api/common-api";
import { useMutation } from "@tanstack/react-query";
import { useContext, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { useClickAway, useKeyPressEvent } from "react-use";
import UserPageRepModifyModalHeader from "./UserPageRepModifyModalHeader";
import UserPageRepModifyModalRaterStats from "./UserPageRepModifyModalRaterStats";
import { useRepAllocation } from "@/hooks/useRepAllocation";
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

  const { repState, heroAvailableRep, minMaxValues } = useRepAllocation({
    profile,
    category,
  });

  const [adjustedRatingStr, setAdjustedRatingStr] = useState<string>(
    `${repState?.rater_contribution ?? 0}`
  );

  useEffect(() => {
    setAdjustedRatingStr(`${repState?.rater_contribution ?? 0}`);
  }, [repState]);

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

  const adjustedValueNum = getStringAsNumberOrZero(adjustedRatingStr);
  const isValidValue =
    !!activeProfileProxy ||
    (adjustedValueNum >= minMaxValues.min && adjustedValueNum <= minMaxValues.max);

  const [newRating, setNewRating] = useState<number>(
    getStringAsNumberOrZero(adjustedRatingStr)
  );

  useEffect(() => {
    setNewRating(getStringAsNumberOrZero(adjustedRatingStr));
  }, [adjustedRatingStr]);

  const [haveChanged, setHaveChanged] = useState<boolean>(
    newRating !== repState?.rater_contribution
  );

  useEffect(() => {
    setHaveChanged(newRating !== repState?.rater_contribution);
  }, [newRating, repState]);

  const getIsSaveDisabled = (): boolean => {
    if (!repState) {
      return true;
    }
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
  }, [haveChanged, isValidValue, repState]);

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
              <label className="tw-block tw-text-sm tw-font-normal tw-leading-5 tw-text-iron-500">
                Your total Rep for <span className="tw-text-iron-300 tw-font-semibold">{category}</span>:
              </label>
              <div className="tw-relative tw-flex tw-mt-1.5">
                <UserPageRateInput
                  value={adjustedRatingStr}
                  onChange={setAdjustedRatingStr}
                  minMax={minMaxValues}
                  isProxy={!!activeProfileProxy}
                  inputRef={inputRef}
                  required
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
