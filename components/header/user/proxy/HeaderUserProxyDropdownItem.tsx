import { ProfileProxy } from "../../../../generated/models/ProfileProxy";

export default function HeaderUserProxyDropdownItem({
  profileProxy,
  activeProfileProxy,
  onActivateProfileProxy,
}: {
  readonly profileProxy: ProfileProxy;
  readonly activeProfileProxy: ProfileProxy | null;
  readonly onActivateProfileProxy: (profileProxy: ProfileProxy | null) => void;
}) {
  const isActive = profileProxy.id === activeProfileProxy?.id;

  return (
    <div className="tw-h-full">
      <button
        type="button"
        className={`${
          !isActive
            ? "tw-bg-transparent hover:tw-bg-iron-700"
            : "tw-bg-iron-700"
        } tw-group tw-py-2.5 tw-w-full tw-h-full tw-border-none tw-text-left tw-flex tw-items-center tw-gap-x-3 tw-text-white tw-rounded-lg tw-relative tw-cursor-pointer tw-select-none tw-px-3 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-primary-400 tw-transition tw-duration-300 tw-ease-out`}
        onClick={() => onActivateProfileProxy(isActive ? null : profileProxy)}
      >
        {profileProxy.created_by.pfp ? (
          <img
            src={profileProxy.created_by.pfp}
            alt="Profile Picture"
            className="tw-flex-shrink-0 tw-h-6 tw-w-6 tw-flex-none tw-rounded-lg tw-bg-iron-800"
          />
        ) : (
          <div
            className={`${
              isActive
                ? "tw-bg-iron-600"
                : "tw-bg-iron-700 group-hover:tw-bg-iron-600"
            } tw-flex-shrink-0 tw-h-6 tw-w-6 tw-flex-none tw-rounded-lg tw-transition tw-duration-300 tw-ease-out`}
          ></div>
        )}
        <div className="tw-flex tw-justify-between tw-items-center tw-w-full">
          <div className="tw-truncate tw-inline-flex tw-items-center tw-justify-between">
            <div className="tw-truncate tw-text-md tw-font-medium tw-text-white">
              {profileProxy.created_by.handle}
            </div>
            <span className="tw-pl-2 tw-pr-0.5 tw-italic tw-text-sm tw-text-iron-400 tw-font-normal">
              Proxy
            </span>
          </div>
          <div>
            {isActive && (
              <svg
                className="tw-flex-shrink-0 tw-h-5 tw-w-5 tw-ml-2 tw-text-primary-400 tw-transition tw-duration-300 tw-ease-out"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M20 6L9 17L4 12"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </div>
        </div>
      </button>
    </div>
  );
}
