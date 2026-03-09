import type { ApiProfileProxy } from "@/generated/models/ApiProfileProxy";

export default function HeaderUserProxyDropdownItem({
  profileProxy,
  activeProfileProxy,
  onActivateProfileProxy,
}: {
  readonly profileProxy: ApiProfileProxy;
  readonly activeProfileProxy: ApiProfileProxy | null;
  readonly onActivateProfileProxy: (
    profileProxy: ApiProfileProxy | null
  ) => void;
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
        } tw-group tw-relative tw-flex tw-h-full tw-w-full tw-cursor-pointer tw-select-none tw-items-center tw-gap-x-3 tw-rounded-lg tw-border-none tw-px-3 tw-py-2.5 tw-text-left tw-text-white tw-transition tw-duration-300 tw-ease-out focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-primary-400`}
        onClick={() => onActivateProfileProxy(isActive ? null : profileProxy)}
      >
        {profileProxy.created_by.pfp ? (
          <img
            src={profileProxy.created_by.pfp}
            alt="Profile Picture"
            className="tw-h-6 tw-w-6 tw-flex-none tw-flex-shrink-0 tw-rounded-lg tw-bg-iron-800"
          />
        ) : (
          <div
            className={`${
              isActive
                ? "tw-bg-iron-600"
                : "tw-bg-iron-700 group-hover:tw-bg-iron-600"
            } tw-h-6 tw-w-6 tw-flex-none tw-flex-shrink-0 tw-rounded-lg tw-transition tw-duration-300 tw-ease-out`}
          ></div>
        )}
        <div className="tw-flex tw-w-full tw-items-center tw-justify-between">
          <div className="tw-inline-flex tw-items-center tw-justify-between tw-truncate">
            <div className="tw-truncate tw-text-md tw-font-medium tw-text-white">
              {profileProxy.created_by.handle}
            </div>
            <span className="tw-pl-2 tw-pr-0.5 tw-text-sm tw-font-normal tw-italic tw-text-iron-400">
              Proxy
            </span>
          </div>
          <div>
            {isActive && (
              <svg
                className="tw-ml-2 tw-h-5 tw-w-5 tw-flex-shrink-0 tw-text-primary-400 tw-transition tw-duration-300 tw-ease-out"
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
