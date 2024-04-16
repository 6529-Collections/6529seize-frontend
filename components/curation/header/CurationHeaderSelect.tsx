import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../auth/Auth";

export default function CurationHeaderSelect({
  onView,
}: {
  readonly onView: () => void;
}) {
  const { connectedProfile } = useContext(AuthContext);
  const getHaveProfile = (): boolean => !!connectedProfile?.profile?.handle;
  const [haveProfile, setHaveProfile] = useState(getHaveProfile());
  useEffect(() => setHaveProfile(getHaveProfile()), [connectedProfile]);

  const noProfileTitle =
    connectedProfile && !haveProfile
      ? "Please create a profile"
      : "Please connect a wallet";

  if (haveProfile) {
    return (
      <button
        type="button"
        onClick={onView}
        className="tw-w-full tw-flex tw-items-center tw-gap-x-2 tw-justify-center tw-px-3 tw-py-2 tw-text-sm tw-font-semibold tw-border tw-border-solid tw-rounded-lg tw-transition tw-duration-300 tw-ease-out tw-cursor-pointer tw-text-white tw-bg-primary-500 tw-border-primary-500 hover:tw-bg-primary-600 hover:tw-border-primary-600"
      >
        <svg
          className="tw-w-5 tw-h-5"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 5V19M5 12H19"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span>Create A Curation</span>
      </button>
    );
  }

  return (
    <div className="tw-w-full tw-inline-flex tw-items-center tw-rounded-lg tw-bg-primary-400/5 tw-border tw-border-solid tw-border-primary-400/30 tw-px-4 tw-py-3">
      <div className="tw-flex tw-items-center">
        <svg
          className="tw-flex-shrink-0 tw-self-center tw-w-5 tw-h-5 tw-text-primary-300"
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
          ></path>
        </svg>
        <div className="tw-ml-3 tw-self-center">
          <p className="tw-text-sm tw-mb-0 tw-font-semibold tw-text-primary-300">
            {noProfileTitle}
          </p>
        </div>
      </div>
    </div>
  );
}
