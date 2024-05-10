import { FormEvent, useContext, useEffect, useState } from "react";
import {
  ApiProfileRaterCicState,
  IProfileAndConsolidations,
} from "../../../../../entities/IProfile";
import {
  formatNumberWithCommas,
  getStringAsNumberOrZero,
} from "../../../../../helpers/Helpers";
import { AuthContext } from "../../../../auth/Auth";
import {
  commonApiFetch,
  commonApiPost,
} from "../../../../../services/api/common-api";
import { useAccount } from "wagmi";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  QueryKey,
  ReactQueryWrapperContext,
} from "../../../../react-query-wrapper/ReactQueryWrapper";
import { createBreakpoint } from "react-use";
import UserRateAdjustmentHelper from "../../../utils/rate/UserRateAdjustmentHelper";
import CircleLoader from "../../../../distribution-plan-tool/common/CircleLoader";
import { ProfileProxyActionType } from "../../../../../generated/models/ProfileProxyActionType";

const useBreakpoint = createBreakpoint({ MD: 768, S: 0 });

export default function UserPageIdentityHeaderCICRate({
  profile,
  isTooltip,
}: {
  readonly profile: IProfileAndConsolidations;
  readonly isTooltip: boolean;
}) {
  const { address } = useAccount();
  const { requestAuth, setToast, connectedProfile, activeProfileProxy } =
    useContext(AuthContext);

  const { onProfileCICModify } = useContext(ReactQueryWrapperContext);

  const { data: myCICState } = useQuery<ApiProfileRaterCicState>({
    queryKey: [
      QueryKey.PROFILE_RATER_CIC_STATE,
      {
        handle: profile.profile?.handle.toLowerCase(),
        rater: activeProfileProxy?.created_by.handle ?? address?.toLowerCase(),
      },
    ],
    queryFn: async () =>
      await commonApiFetch<ApiProfileRaterCicState>({
        endpoint: `profiles/${profile.profile?.handle}/cic/rating/${
          activeProfileProxy?.created_by.handle ?? address?.toLowerCase()
        }`,
      }),
    enabled: !!profile.profile?.handle && !!address,
    staleTime: 0,
  });

  const [mutating, setMutating] = useState<boolean>(false);

  const updateCICMutation = useMutation({
    mutationFn: async (amount: number) => {
      setMutating(true);
      return await commonApiPost({
        endpoint: `profiles/${profile.profile?.handle}/cic/rating`,
        body: {
          amount,
        },
      });
    },
    onSuccess: () => {
      setToast({
        message: "CIC rating updated.",
        type: "success",
      });
      onProfileCICModify({
        targetProfile: profile,
        connectedProfile: connectedProfile ?? null,
        rater: address?.toLowerCase() ?? null,
      });
    },
    onSettled: () => {
      setMutating(false);
    },
  });

  const getCicLeftToGive = (): number => {
    const cicProxyAction = activeProfileProxy?.actions.find(
      (a) => a.action_type === ProfileProxyActionType.AllocateCic
    );
    if (!cicProxyAction) {
      return myCICState?.cic_ratings_left_to_give_by_rater ?? 0;
    }
    const proxyAvailableCredit = Math.max(
      0,
      (cicProxyAction?.credit_amount ?? 0) - (cicProxyAction?.credit_spent ?? 0)
    );
    console.log(proxyAvailableCredit);
    return Math.min(
      proxyAvailableCredit,
      myCICState?.cic_ratings_left_to_give_by_rater ?? 0
    );
  };

  const [cicLeftToGive, setCicLeftToGive] = useState<number>(
    getCicLeftToGive()
  );
  useEffect(
    () => setCicLeftToGive(getCicLeftToGive()),
    [myCICState, activeProfileProxy]
  );

  const [originalRating, setOriginalRating] = useState<number>(
    myCICState?.cic_rating_by_rater ?? 0
  );

  const [adjustedRatingStr, setAdjustedRatingStr] = useState<string>(
    `${originalRating}`
  );

  const [myMaxCICRatings, setMyMaxCICRatings] = useState<number>(
    cicLeftToGive + Math.abs(originalRating)
  );

  const [myAvailableCIC, setMyAvailableCIC] = useState<number>(cicLeftToGive);

  const getCICStrOrMaxStr = (strCIC: string): string => {
    const cicAsNumber = getStringAsNumberOrZero(strCIC);
    if (cicAsNumber > myMaxCICRatings) {
      return `${myMaxCICRatings}`;
    }

    if (cicAsNumber < -myMaxCICRatings) {
      return `-${myMaxCICRatings}`;
    }

    if (strCIC.length > 1 && strCIC.startsWith("0")) {
      return strCIC.slice(1);
    }
    return strCIC;
  };

  useEffect(() => {
    setOriginalRating(myCICState?.cic_rating_by_rater ?? 0);
    setAdjustedRatingStr(`${myCICState?.cic_rating_by_rater ?? 0}`);
    setMyMaxCICRatings(
      cicLeftToGive + Math.abs(myCICState?.cic_rating_by_rater ?? 0)
    );
    setMyAvailableCIC(cicLeftToGive);
  }, [myCICState, cicLeftToGive]);

  const handleChange = (e: FormEvent<HTMLInputElement>) => {
    const inputValue = e.currentTarget.value;
    const strCIC = ["-0", "0-"].includes(inputValue) ? "-" : inputValue;
    if (/^-?\d*$/.test(strCIC)) {
      const newCicValue = getCICStrOrMaxStr(strCIC);
      setAdjustedRatingStr(newCicValue);
    }
  };

  const onSave = async () => {
    const { success } = await requestAuth();
    if (!success) {
      setToast({
        message: "You must be logged in.",
        type: "error",
      });
      return;
    }

    const newRating = getStringAsNumberOrZero(adjustedRatingStr);
    if (newRating === originalRating) {
      return;
    }

    await updateCICMutation.mutateAsync(newRating);
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await onSave();
  };

  const breakpoint = useBreakpoint();

  return (
    <div
      className={`${
        isTooltip
          ? ""
          : "tw-bg-iron-900 tw-px-4 tw-py-6 lg:tw-p-8 tw-rounded-xl tw-border tw-border-solid tw-border-iron-800"
      } `}
    >
      <div
        className={`${
          isTooltip ? "tw-text-sm" : "tw-text-base"
        } tw-flex tw-flex-col tw-space-y-1`}
      >
        <span className="tw-block tw-text-iron-300 tw-font-normal">
          <span>Your available CIC:</span>
          <span className="tw-ml-1 tw-font-semibold tw-text-iron-50">
            {formatNumberWithCommas(myAvailableCIC)}
          </span>
        </span>
        <span className="tw-block tw-text-iron-300 tw-font-normal">
          <span>Your max/min CIC Rating to {profile.profile?.handle}:</span>
          <span className="tw-ml-1 tw-font-semibold tw-text-iron-50">
            +/- {formatNumberWithCommas(myMaxCICRatings)}
          </span>
        </span>
      </div>
      <form
        onSubmit={onSubmit}
        className={`${isTooltip ? "tw-mt-4" : "tw-mt-6"}`}
      >
        <div
          className={`${
            isTooltip ? "" : "tw-flex-wrap"
          } tw-flex tw-items-end tw-gap-3`}
        >
          <div className="tw-w-full sm:tw-w-auto">
            <label className="tw-block tw-text-sm tw-font-normal tw-text-iron-400">
              Your total CIC Rating of {profile.profile?.handle}:
            </label>
            <div className="tw-w-full tw-relative tw-flex tw-mt-1.5">
              <span className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-bg-iron-950 tw-rounded-l-lg tw-border tw-border-solid tw-border-iron-700 tw-px-3">
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
                type="text"
                value={adjustedRatingStr}
                onChange={handleChange}
                required
                autoComplete="off"
                className={`${
                  isTooltip ? "tw-max-w-[12rem]" : "tw-w-full sm:tw-w-auto"
                } -tw-ml-0.5 tw-appearance-none tw-block tw-rounded-l-none tw-rounded-r-lg tw-border-0 tw-py-3 tw-px-3 tw-bg-iron-950 tw-text-iron-300 tw-font-medium tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-700 hover:tw-ring-iron-600 placeholder:tw-text-iron-500 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 tw-text-base tw-transition tw-duration-300 tw-ease-out`}
              />
            </div>
          </div>

          <div className="tw-w-full sm:tw-w-auto">
            <div className="tw-w-full sm:tw-w-auto tw-inline-flex tw-items-end tw-space-x-6">
              <button
                type="submit"
                className="tw-w-full sm:tw-w-auto tw-cursor-pointer tw-bg-primary-500 tw-px-4 tw-py-3 tw-text-sm tw-font-semibold tw-text-white 
              tw-border tw-border-solid tw-border-primary-500 tw-rounded-lg hover:tw-bg-primary-600 hover:tw-border-primary-600 tw-transition tw-duration-300 tw-ease-out"
              >
                {mutating ? (
                  <div className="tw-w-8">
                    <CircleLoader />
                  </div>
                ) : (
                  <>Rate</>
                )}
              </button>
              {!isTooltip && breakpoint === "MD" && (
                <UserRateAdjustmentHelper
                  inLineValues={isTooltip}
                  originalValue={originalRating}
                  adjustedValue={getStringAsNumberOrZero(adjustedRatingStr)}
                  adjustmentType="CIC"
                />
              )}
            </div>
          </div>
        </div>
        {!!(isTooltip || breakpoint !== "MD") && (
          <UserRateAdjustmentHelper
            inLineValues={isTooltip}
            originalValue={originalRating}
            adjustedValue={getStringAsNumberOrZero(adjustedRatingStr)}
            adjustmentType="CIC"
          />
        )}
      </form>
    </div>
  );
}
