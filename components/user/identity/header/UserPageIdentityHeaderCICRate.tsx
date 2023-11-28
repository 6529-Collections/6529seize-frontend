import { FormEvent, useContext, useEffect, useState } from "react";
import { IProfileAndConsolidations } from "../../../../entities/IProfile";
import { formatNumberWithCommas } from "../../../../helpers/Helpers";
import { AuthContext } from "../../../auth/Auth";
import { commonApiPost } from "../../../../services/api/common-api";

export default function UserPageIdentityHeaderCICRate({
  profile,
}: {
  profile: IProfileAndConsolidations;
}) {
  const { requestAuth, setToast } = useContext(AuthContext);
  const [myAvailableCIC, setMyAvailableCIC] = useState<number>(
    profile.cic.cic_left_for_authenticated_profile
  );

  const [myCICRatings, setMyCICRatings] = useState<number>(
    profile.cic.authenticated_profile_contribution
  );

  const [myCICRatingsStr, setMyCICRatingsStr] = useState<string>(
    `${myCICRatings}`
  );

  const [myMaxCICRatings, setMyMaxCICRatings] = useState<number>(
    profile.cic.cic_left_for_authenticated_profile +
      Math.abs(profile.cic.authenticated_profile_contribution)
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

  const getAvailableCIC = (newCicValue: string): number => {
    const cicAsNumber = getMyCICRatingsAsNumber(newCicValue);
    return myMaxCICRatings - Math.abs(cicAsNumber);
  };

  useEffect(() => {
    setMyAvailableCIC(profile.cic.cic_left_for_authenticated_profile);
    setMyCICRatings(profile.cic.authenticated_profile_contribution);
    setMyCICRatingsStr(`${profile.cic.authenticated_profile_contribution}`);
    setMyMaxCICRatings(
      profile.cic.cic_left_for_authenticated_profile +
        Math.abs(profile.cic.authenticated_profile_contribution)
    );
  }, [profile]);

  const handleChange = (e: FormEvent<HTMLInputElement>) => {
    const inputValue = e.currentTarget.value;
    if (/^-?\d*$/.test(inputValue)) {
      const strCIC = inputValue === "-0" ? "-" : inputValue;
      const newCicValue = getCICStrOrMaxStr(strCIC);
      setMyCICRatingsStr(newCicValue);
      setMyAvailableCIC(getAvailableCIC(newCicValue));
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

    const updatedTargetProfile = await commonApiPost({
      endpoint: `profiles/${profile.profile?.handle}/cic/rating`,
      body: {
        amount: getMyCICRatingsAsNumber(myCICRatingsStr),
      },
    });

    console.log(updatedTargetProfile);
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await onSave();
  };

  return (
    <div className="tw-mt-6">
      <form onSubmit={onSubmit}>
        <div className="tw-flex tw-items-center tw-space-x-3.5">
          <div>
            <div>
              <label className="tw-block tw-text-sm tw-font-normal tw-leading-5 tw-text-neutral-400">
                Your total CIC Rating of {profile.profile?.handle}:
              </label>
              <div className="tw-relative tw-flex tw-mt-1.5">
                <span className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-bg-neutral-700/40 tw-rounded-l-lg tw-border tw-border-solid tw-border-white/5 tw-px-3">
                  <svg
                    className="tw-w-3.5 tw-h-3.5 tw-flex-shrink-0 tw-text-neutral-500"
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
                    className="tw-w-3.5 tw-h-3.5 tw-flex-shrink-0 tw-text-neutral-500"
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
                  className="tw-block tw-w-[12.5rem] tw-rounded-r-lg tw-border-0 tw-py-3 tw-pl-4 tw-pr-10 tw-bg-neutral-700/40 tw-text-white tw-font-medium tw-text-right tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-white/5 placeholder:tw-text-neutral-500 focus:tw-outline-none focus:tw-bg-transparent focus:tw-ring-1 focus:tw-ring-inset hover:tw-ring-neutral-700 focus:tw-ring-primary-300 tw-text-base sm:tw-leading-6 tw-transition tw-duration-300 tw-ease-out"
                />
                <div className="tw-pointer-events-none tw-absolute tw-inset-y-0 tw-right-0 tw-flex tw-items-center tw-pr-3">
                  <svg
                    className="tw-h-5 tw-w-5 tw-text-neutral-400"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M12 16V12M12 8H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>
            </div>
            <div className="tw-mt-3.5 tw-space-x-1 tw-flex tw-items-center tw-justify-between tw-w-full">
              <span className="tw-text-sm tw-font-semibold tw-text-neutral-200">
                Your available CIC TDH:
              </span>
              <span className="tw-text-sm tw-font-semibold tw-text-neutral-200">
                {formatNumberWithCommas(myAvailableCIC)}
              </span>
            </div>
          </div>
          <div className="-tw-mt-1.5">
            <button
              type="submit"
              className="tw-cursor-pointer tw-bg-primary-500 tw-px-4 tw-py-3 tw-text-sm tw-font-medium tw-text-white tw-border tw-border-solid tw-border-primary-500 tw-rounded-lg hover:tw-bg-primary-600 hover:tw-border-primary-600 tw-transition tw-duration-300 tw-ease-out"
            >
              Rate
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
