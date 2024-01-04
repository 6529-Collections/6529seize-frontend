import { useContext, useEffect, useRef, useState } from "react";
import { useClickAway, useKeyPressEvent } from "react-use";
import {
  IProfileAndConsolidations,
  RatingStats,
} from "../../../../entities/IProfile";
import { useMutation } from "@tanstack/react-query";
import { AuthContext } from "../../../auth/Auth";
import { commonApiPost } from "../../../../services/api/common-api";
import { getStringAsNumberOrZero } from "../../../../helpers/Helpers";
import UserPageRepModifyModalHeader from "./UserPageRepModifyModalHeader";
import UserPageRepModifyModalRaterStats from "./UserPageRepModifyModalRaterStats";
import UserRateAdjustmentHelper from "../../utils/rate/UserRateAdjustmentHelper";
import { ReactQueryWrapperContext } from "../../../react-query-wrapper/ReactQueryWrapper";
import CircleLoader from "../../../distribution-plan-tool/common/CircleLoader";

interface ApiAddRepRatingToProfileRequest {
  readonly amount: number;
  readonly category: string;
}

export default function UserPageRepModifyModal({
  onClose,
  profile,
  repState,
  giverAvailableRep,
}: {
  readonly onClose: () => void;
  readonly profile: IProfileAndConsolidations;
  readonly repState: RatingStats;
  readonly giverAvailableRep: number;
}) {
  const { onProfileRepModify } = useContext(ReactQueryWrapperContext);
  const { requestAuth, setToast, connectedProfile } = useContext(AuthContext);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [inputRef]);

  const modalRef = useRef<HTMLDivElement>(null);
  useClickAway(modalRef, onClose);
  useKeyPressEvent("Escape", onClose);

  const originalRating = repState.rater_contribution;

  const [adjustedRatingStr, setAdjustedRatingStr] = useState<string>(
    `${originalRating}`
  );

  const maxPositiveValue = giverAvailableRep + Math.abs(originalRating);

  const getValueStrOrMax = (value: string): string => {
    const valueAsNumber = getStringAsNumberOrZero(value);
    if (valueAsNumber > maxPositiveValue) {
      return `${maxPositiveValue}`;
    }

    if (valueAsNumber < -maxPositiveValue) {
      return `-${maxPositiveValue}`;
    }

    if (value.length > 1 && value.startsWith("0")) {
      return value.slice(1);
    }

    return value;
  };

  const onValueChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = event.currentTarget.value;
    const strCIC = ["-0", "0-"].includes(inputValue) ? "-" : inputValue;
    if (/^-?\d*$/.test(strCIC)) {
      const newCicValue = getValueStrOrMax(strCIC);
      setAdjustedRatingStr(newCicValue);
    }
  };

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
        endpoint: `profiles/${profile.profile?.handle}/rep/rating`,
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
      onProfileRepModify({ targetProfile: profile, connectedProfile });
      onClose();
    },
    onError: (error) => {
      setToast({
        message: error as unknown as string,
        type: "error",
      });
      setMutating(false);
    },
  });

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
      category: repState.category,
    });
  };

  return (
    <div className="tw-relative tw-z-10">
      <div className="tw-fixed tw-inset-0 tw-bg-gray-500 tw-bg-opacity-75"></div>
      <div className="tw-fixed tw-inset-0 tw-z-10 tw-overflow-y-auto">
        <div className="tw-flex tw-min-h-full tw-items-end tw-justify-center tw-text-center sm:tw-items-center tw-p-2 lg:tw-p-0">
          <div
            ref={modalRef}
            className="sm:tw-max-w-md tw-relative tw-w-full tw-transform tw-rounded-xl tw-bg-iron-950 tw-text-left tw-shadow-xl tw-transition-all tw-duration-500 sm:tw-w-full tw-p-6"
          >
            <UserPageRepModifyModalHeader profile={profile} onClose={onClose} />
            <UserPageRepModifyModalRaterStats
              repState={repState}
              giverAvailableRep={giverAvailableRep}
            />
            <form onSubmit={onSubmit} className="tw-mt-4">
              <div>
                <label className="tw-block tw-text-sm tw-font-normal tw-leading-5 tw-text-iron-400">
                  Your total CIC Rating of {repState.category}:
                </label>
                <div className="tw-relative tw-flex tw-mt-1.5">
                  <span className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-bg-iron-900 tw-rounded-l-lg tw-border tw-border-solid tw-border-iron-700 tw-px-3">
                    <svg
                      className="tw-w-3.5 tw-h-3.5 tw-flex-shrink-0 tw-text-iron-500"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
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
                      xmlns="http://www.w3.org/2000/svg"
                    >
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
                    className="tw-appearance-none -tw-ml-0.5 tw-block tw-w-full tw-rounded-l-none tw-rounded-r-lg tw-border-0 tw-py-3 tw-px-3 tw-bg-iron-900 tw-text-iron-300 tw-font-medium tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-700 placeholder:tw-text-iron-500 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 tw-text-base tw-transition tw-duration-300 tw-ease-out"
                  />
                </div>
                <UserRateAdjustmentHelper
                  inLineValues={true}
                  originalValue={originalRating}
                  adjustedValue={getStringAsNumberOrZero(adjustedRatingStr)}
                  adjustmentType="Rep"
                />
              </div>

              <div className="tw-mt-8">
                <div className="sm:tw-flex sm:tw-flex-row-reverse tw-gap-x-3">
                  <button
                    type="submit"
                    disabled={!haveChanged}
                    className={`${
                      haveChanged
                        ? "tw-cursor-pointer hover:tw-bg-primary-600 hover:tw-border-primary-600"
                        : "tw-cursor-not-allowed tw-opacity-50"
                    } tw-w-full sm:tw-w-auto tw-bg-primary-500 tw-border-primary-500 tw-px-4 tw-py-3 tw-text-sm tw-font-semibold tw-text-white tw-border tw-border-solid  tw-rounded-lg  tw-transition tw-duration-300 tw-ease-out`}
                  >
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
                    className="tw-mt-3 sm:tw-mt-0 tw-w-full sm:tw-w-auto tw-cursor-pointer tw-bg-iron-900 tw-px-4 tw-py-3 tw-text-sm tw-font-semibold tw-text-white tw-border tw-border-solid tw-border-iron-700 tw-rounded-lg hover:tw-bg-iron-800 tw-transition tw-duration-300 tw-ease-out"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
