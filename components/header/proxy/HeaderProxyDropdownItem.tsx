import { ProfileProxy } from "../../../generated/models/ProfileProxy";

export default function HeaderProxyDropdownItem({
  profileProxy,
  activeProfileProxy,
  setActiveProfileProxy,
}: {
  readonly profileProxy: ProfileProxy;
  readonly activeProfileProxy: ProfileProxy | null;
  readonly setActiveProfileProxy: (profileProxy: ProfileProxy | null) => void;
}) {
  const isActive = profileProxy.id === activeProfileProxy?.id;

  return (
    <li className="tw-h-full">
      <button
        type="button"
        className="hover:tw-bg-iron-700 tw-py-2 tw-w-full tw-h-full tw-bg-transparent tw-border-none tw-text-left tw-flex tw-items-center tw-justify-between tw-text-white tw-rounded-lg tw-relative tw-cursor-pointer tw-select-none tw-px-2  focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-primary-400 tw-transition tw-duration-300 tw-ease-out"
        onClick={() => setActiveProfileProxy(isActive ? null : profileProxy)}
      >
        <div className="tw-w-44 tw-truncate">
          <span className="tw-text-sm tw-font-medium tw-text-white">
            {profileProxy.created_by.handle}
          </span>

          {isActive && (
            <svg
              className="tw-h-5 tw-w-5 tw-ml-2 tw-text-primary-300 tw-transition tw-duration-300 tw-ease-out"
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
      </button>
    </li>
  );
}
