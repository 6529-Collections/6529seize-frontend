import { STATEMENT_ADD_VIEW } from "./UserPageIdentityAddStatements";

export default function UserPageIdentityAddStatementsSelect({
  onClose,
  onViewChange,
}: {
  readonly onClose: () => void;
  readonly onViewChange: (view: STATEMENT_ADD_VIEW) => void;
}) {
  const tileClassName =
    "tw-text-left tw-rounded-lg tw-group tw-relative tw-bg-iron-900 tw-border tw-border-solid tw-border-iron-700  hover:tw-bg-iron-800 tw-p-6 tw-transition tw-duration-300 tw-ease-out focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-inset focus:tw-ring-iron-600";
  const tileIconClassName =
    "tw-inline-flex tw-items-center tw-justify-center tw-rounded-xl tw-h-11 tw-w-11 tw-bg-iron-900 tw-border tw-border-solid tw-border-iron-700 group-hover:tw-bg-iron-800 tw-transition tw-duration-300 tw-ease-out";

  return (
    <>
      <div className="tw-flex tw-justify-between">
        <div className="tw-max-w-xl tw-flex tw-flex-col">
          <p className="tw-max-w-sm tw-text-lg tw-text-iron-100 tw-font-medium tw-mb-0">
            Add Statements About Your Identity
          </p>
          <p className="tw-mt-2 tw-text-sm tw-font-normal tw-text-iron-400 tw-mb-0">
            Seize users can make statements asserting their identity (eponymous,
            pseudonymous or organizational). It is up to the community to
            evaluate if they are accurate.
          </p>
        </div>
        <div className="tw-absolute tw-right-4 tw-top-4 tw-flex tw-justify-between tw-items-center">
          <button
            onClick={onClose}
            type="button"
            className="tw-p-2.5 tw-flex tw-items-center tw-justify-center tw-rounded-full tw-bg-iron-900 tw-border-0 tw-text-iron-400 hover:tw-text-iron-50 focus:tw-outline-none tw-transition tw-duration-300 tw-ease-out"
          >
            <span className="tw-sr-only tw-text-sm">Close</span>
            <svg
              className="tw-h-6 tw-w-6"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>

      {/*  Grid starts here */}
      <div className="tw-mt-8 tw-grid tw-grid-cols-1 md:tw-grid-cols-2 lg:tw-grid-cols-4 tw-gap-6">
        <button
          onClick={() => onViewChange(STATEMENT_ADD_VIEW.SOCIAL_MEDIA_ACCOUNT)}
          className={tileClassName}
        >
          <div>
            <span className={tileIconClassName}>
              <svg
                className="tw-flex-shrink-0 tw-h-6 tw-w-6 tw-text-iron-50 group-hover:tw-scale-105 tw-transition tw-duration-300 tw-ease-out"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M16 3.46776C17.4817 4.20411 18.5 5.73314 18.5 7.5C18.5 9.26686 17.4817 10.7959 16 11.5322M18 16.7664C19.5115 17.4503 20.8725 18.565 22 20M2 20C3.94649 17.5226 6.58918 16 9.5 16C12.4108 16 15.0535 17.5226 17 20M14 7.5C14 9.98528 11.9853 12 9.5 12C7.01472 12 5 9.98528 5 7.5C5 5.01472 7.01472 3 9.5 3C11.9853 3 14 5.01472 14 7.5Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </div>
          <div className="tw-mt-8 lg:tw-h-20">
            <p className="tw-mb-0 tw-text-sm tw-font-semibold tw-text-iron-100 group-hover:tw-text-white">
              Social Media Accounts
            </p>
            <p className="tw-mt-1 tw-mb-0 tw-text-sm tw-text-iron-500">
              Your handle on social media platforms.
            </p>
          </div>
        </button>
        <button
          onClick={() => onViewChange(STATEMENT_ADD_VIEW.NFT_ACCOUNT)}
          className={tileClassName}
        >
          <div>
            <span className={tileIconClassName}>
              <svg
                className="tw-flex-shrink-0 tw-h-6 tw-w-6 tw-text-iron-50 group-hover:tw-scale-105 tw-transition tw-duration-300 tw-ease-out"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M16 5L18 7L22 3M22 12V17.2C22 18.8802 22 19.7202 21.673 20.362C21.3854 20.9265 20.9265 21.3854 20.362 21.673C19.7202 22 18.8802 22 17.2 22H6.8C5.11984 22 4.27976 22 3.63803 21.673C3.07354 21.3854 2.6146 20.9265 2.32698 20.362C2 19.7202 2 18.8802 2 17.2V6.8C2 5.11984 2 4.27976 2.32698 3.63803C2.6146 3.07354 3.07354 2.6146 3.63803 2.32698C4.27976 2 5.11984 2 6.8 2H12M2.14551 19.9263C2.61465 18.2386 4.16256 17 5.99977 17H12.9998C13.9291 17 14.3937 17 14.7801 17.0769C16.3669 17.3925 17.6073 18.6329 17.9229 20.2196C17.9998 20.606 17.9998 21.0707 17.9998 22M14 9.5C14 11.7091 12.2091 13.5 10 13.5C7.79086 13.5 6 11.7091 6 9.5C6 7.29086 7.79086 5.5 10 5.5C12.2091 5.5 14 7.29086 14 9.5Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </div>
          <div className="tw-mt-8 lg:tw-h-20">
            <p className="tw-mb-0 tw-text-sm tw-font-semibold tw-text-iron-100 group-hover:tw-text-white">
              NFT Accounts
            </p>
            <p className="tw-mt-1 tw-mb-0 tw-text-sm tw-text-iron-500">
              Your handle on NFT platforms.
            </p>
          </div>
        </button>
        <button
          onClick={() => onViewChange(STATEMENT_ADD_VIEW.CONTACT)}
          className={tileClassName}
        >
          <div>
            <span className={tileIconClassName}>
              <svg
                className="tw-flex-shrink-0 tw-h-6 tw-w-6 tw-text-iron-50 group-hover:tw-scale-105 tw-transition tw-duration-300 tw-ease-out"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M7 8.5H12M7 12H15M9.68375 18H16.2C17.8802 18 18.7202 18 19.362 17.673C19.9265 17.3854 20.3854 16.9265 20.673 16.362C21 15.7202 21 14.8802 21 13.2V7.8C21 6.11984 21 5.27976 20.673 4.63803C20.3854 4.07354 19.9265 3.6146 19.362 3.32698C18.7202 3 17.8802 3 16.2 3H7.8C6.11984 3 5.27976 3 4.63803 3.32698C4.07354 3.6146 3.6146 4.07354 3.32698 4.63803C3 5.27976 3 6.11984 3 7.8V20.3355C3 20.8684 3 21.1348 3.10923 21.2716C3.20422 21.3906 3.34827 21.4599 3.50054 21.4597C3.67563 21.4595 3.88367 21.2931 4.29976 20.9602L6.68521 19.0518C7.17252 18.662 7.41617 18.4671 7.68749 18.3285C7.9282 18.2055 8.18443 18.1156 8.44921 18.0613C8.74767 18 9.0597 18 9.68375 18Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </div>
          <div className="tw-mt-8 lg:tw-h-20">
            <p className="tw-mb-0 tw-text-sm tw-font-semibold tw-text-iron-100 group-hover:tw-text-white">
              Contact
            </p>
            <p className="tw-mt-1 tw-mb-0 tw-text-sm tw-text-iron-500">
              Your handle on messaging platforms.
            </p>
          </div>
        </button>
        <button
          onClick={() =>
            onViewChange(STATEMENT_ADD_VIEW.SOCIAL_MEDIA_VERIFICATION_POST)
          }
          className={tileClassName}
        >
          <div>
            <span className={tileIconClassName}>
              <svg
                className="tw-flex-shrink-0 tw-h-6 tw-w-6 tw-text-iron-50 group-hover:tw-scale-105 tw-transition tw-duration-300 tw-ease-out"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M11 4H7.8C6.11984 4 5.27976 4 4.63803 4.32698C4.07354 4.6146 3.6146 5.07354 3.32698 5.63803C3 6.27976 3 7.11984 3 8.8V16.2C3 17.8802 3 18.7202 3.32698 19.362C3.6146 19.9265 4.07354 20.3854 4.63803 20.673C5.27976 21 6.11984 21 7.8 21H15.2C16.8802 21 17.7202 21 18.362 20.673C18.9265 20.3854 19.3854 19.9265 19.673 19.362C20 18.7202 20 17.8802 20 16.2V13M13 17H7M15 13H7M20.1213 3.87868C21.2929 5.05025 21.2929 6.94975 20.1213 8.12132C18.9497 9.29289 17.0503 9.29289 15.8787 8.12132C14.7071 6.94975 14.7071 5.05025 15.8787 3.87868C17.0503 2.70711 18.9497 2.70711 20.1213 3.87868Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </div>
          <div className="tw-mt-8 lg:tw-h-20">
            <p className="tw-mb-0 tw-text-sm tw-font-semibold tw-text-iron-100 group-hover:tw-text-white">
              Social Media Verification Posts
            </p>
            <p className="tw-mt-1 tw-mb-0 tw-text-sm tw-text-iron-500">
              Your posts verifying your profile here.
            </p>
          </div>
        </button>
      </div>
      {/* Bottom bullet points */}
      <div className="tw-px-4 tw-pt-5 tw-mt-5 tw-border-t tw-border-solid tw-border-iron-700 tw-border-x-0 tw-border-b-0">
        <ul className="tw-pl-0 tw-mb-0 tw-list-disc tw-text-iron-500 tw-text-xs tw-font-normal tw-space-y-1">
          <li>All statements are optional.</li>
          <li>All statements are fully and permanently public.</li>
          <li>
            Seize does not connect to social media accounts or verify posts.
          </li>
          <li>The community will rate the accuracy of statements.</li>
        </ul>
      </div>
    </>
  );
}
