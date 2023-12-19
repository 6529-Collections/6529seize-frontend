import { FormEvent, useContext, useEffect, useState } from "react";
import {
  ApiProfileRaterCicState,
  IProfileAndConsolidations,
} from "../../../../entities/IProfile";
import { formatNumberWithCommas } from "../../../../helpers/Helpers";
import { AuthContext } from "../../../auth/Auth";
import {
  commonApiFetch,
  commonApiPost,
} from "../../../../services/api/common-api";
import { useAccount } from "wagmi";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  QueryKey,
  ReactQueryWrapperContext,
} from "../../../react-query-wrapper/ReactQueryWrapper";

export default function UserPageIdentityHeaderCICRate({
  profile,
  isTooltip
}: {
  readonly profile: IProfileAndConsolidations;
  readonly isTooltip: boolean;
}) {
  const { address } = useAccount();
  const { requestAuth, setToast } = useContext(AuthContext);
  const {
    invalidateProfile,
    invalidateProfileRaterCICState,
    invalidateProfileCICRatings,
    invalidateProfileLogs,
  } = useContext(ReactQueryWrapperContext);

  const { data: connectedProfile } = useQuery<IProfileAndConsolidations>({
    queryKey: [QueryKey.PROFILE, address?.toLowerCase()],
    queryFn: async () =>
      await commonApiFetch<IProfileAndConsolidations>({
        endpoint: `profiles/${address}`,
      }),
    enabled: !!address,
  });

  const { data: myCICState } = useQuery<ApiProfileRaterCicState>({
    queryKey: [
      QueryKey.PROFILE_RATER_CIC_STATE,
      {
        handle: profile.profile?.handle.toLowerCase(),
        rater: address?.toLowerCase(),
      },
    ],
    queryFn: async () =>
      await commonApiFetch<ApiProfileRaterCicState>({
        endpoint: `profiles/${profile.profile?.handle}/cic/rating/${address}`,
      }),
    enabled: !!profile.profile?.handle && !!address,
    staleTime: 0,
  });

  const updateCICMutation = useMutation({
    mutationFn: async (amount: number) =>
      await commonApiPost({
        endpoint: `profiles/${profile.profile?.handle}/cic/rating`,
        body: {
          amount,
        },
      }),
    onSuccess: () => {
      setToast({
        message: "CIC rating updated.",
        type: "success",
      });

      invalidateProfile(profile);
      invalidateProfileCICRatings(profile);
      if (connectedProfile) {
        invalidateProfileLogs({ profile: connectedProfile, keys: {} });
      }

      if (address) {
        invalidateProfileRaterCICState({
          profile,
          rater: address?.toLowerCase(),
        });
      }
    },
  });

  const [myCICRatings, setMyCICRatings] = useState<number>(
    myCICState?.cic_rating_by_rater ?? 0
  );

  const [myCICRatingsStr, setMyCICRatingsStr] = useState<string>(
    `${myCICRatings}`
  );

  const [myMaxCICRatings, setMyMaxCICRatings] = useState<number>(
    (myCICState?.cic_ratings_left_to_give_by_rater ?? 0) +
      Math.abs(myCICState?.cic_rating_by_rater ?? 0)
  );

  const getMyCICRatingsAsNumber = (cic: string) => {
    if (isNaN(parseInt(cic))) {
      return 0;
    }
    return parseInt(cic);
  };

  const getCICStrOrMaxStr = (strCIC: string): string => {
    const cicAsNumber = getMyCICRatingsAsNumber(strCIC);
    if (cicAsNumber > myMaxCICRatings) {
      return `${myMaxCICRatings}`;
    }

    if (cicAsNumber < -myMaxCICRatings) {
      return `-${myMaxCICRatings}`;
    }
    return strCIC;
  };

  useEffect(() => {
    setMyCICRatings(myCICState?.cic_rating_by_rater ?? 0);
    setMyCICRatingsStr(`${myCICState?.cic_rating_by_rater ?? 0}`);
    setMyMaxCICRatings(
      (myCICState?.cic_ratings_left_to_give_by_rater ?? 0) +
        Math.abs(myCICState?.cic_rating_by_rater ?? 0)
    );
  }, [myCICState]);

  const handleChange = (e: FormEvent<HTMLInputElement>) => {
    const inputValue = e.currentTarget.value;
    if (/^-?\d*$/.test(inputValue)) {
      const strCIC = inputValue === "-0" ? "-" : inputValue;
      const newCicValue = getCICStrOrMaxStr(strCIC);
      setMyCICRatingsStr(newCicValue);
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

    const newRating = getMyCICRatingsAsNumber(myCICRatingsStr);
    if (newRating === myCICRatings) {
      return;
    }

    await updateCICMutation.mutateAsync(newRating);
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await onSave();
  };

  return (
    <div>
      <form onSubmit={onSubmit}>
        <div className="tw-flex tw-items-end tw-space-x-3.5">
          <div>
            <label className="tw-block tw-text-sm tw-font-normal tw-text-iron-400">
              Your total CIC Rating of {profile.profile?.handle}:
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
                type="text"
                value={myCICRatingsStr}
                onChange={handleChange}
                required
                autoComplete="off"
                className={`${isTooltip? 'tw-max-w-[12rem]' : ''} tw-block tw-rounded-r-lg tw-border-0 tw-py-3 tw-px-3 tw-bg-iron-900 tw-text-iron-300 tw-font-medium tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-700 placeholder:tw-text-iron-500 focus:tw-outline-none  focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-300 tw-text-base tw-transition tw-duration-300 tw-ease-out`}
              />
            </div>
          </div>

          <div className="-tw-mt-1.5">
            <button
              type="submit"
              className="tw-cursor-pointer tw-bg-primary-500 tw-px-4 tw-py-3 tw-text-sm tw-font-medium tw-text-white 
              tw-border tw-border-solid tw-border-primary-500 tw-rounded-lg hover:tw-bg-primary-600 hover:tw-border-primary-600 tw-transition tw-duration-300 tw-ease-out"
            >
              Rate
            </button>
          </div>
        </div>
        <div className="tw-mt-3 tw-space-x-1 tw-inline-flex tw-items-center">
          <span className="tw-text-sm tw-font-semibold tw-text-iron-200">
            Your max/min CIC Rating:
          </span>
          <span className="tw-pl-1 tw-text-sm tw-font-semibold tw-text-iron-200">
            +/- {formatNumberWithCommas(myMaxCICRatings)}
          </span>
        </div>
      </form>
    </div>
  );
}
