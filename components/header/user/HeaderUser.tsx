export default function HeaderUser() {
  return (
    <div className="tailwind-scope">
      <div className="tw-flex tw-items-center tw-gap-x-3">
        <div className="tw-inline-flex tw-rounded-lg tw-shadow-sm" role="group">
          <button
            type="button"
            className="tw-px-4 tw-h-10 tw-inline-flex tw-items-center tw-gap-x-3 tw-text-base tw-font-semibold tw-border tw-border-solid tw-rounded-s-lg focus:tw-z-10 focus:tw-ring-2 focus:tw-ring-blue-700 focus:tw-text-blue-700 tw-bg-iron-800 tw-border-iron-700 tw-text-white hover:tw-bg-iron-700 tw-focus:ring-blue-500 tw-focus:text-white tw-transition tw-duration-300 tw-ease-out"
          >
            <img
              src=""
              alt="Profile Picture"
              className="tw-flex-shrink-0 tw-h-6 tw-w-6 tw-flex-none tw-rounded-lg tw-bg-iron-800 tw-ring-1 tw-ring-white/30"
            />
            <div className="tw-flex tw-gap-x-2 tw-items-center">
              <span>Simo</span>
              <span className="tw-text-sm tw-text-iron-300 tw-italic tw-font-normal">
                Proxy
              </span>
            </div>
          </button>
          <button
            type="button"
            aria-label="Choose proxy"
            title="Choose proxy"
            className="tw-flex tw-items-center tw-justify-center tw-rounded-r-lg tw-bg-iron-800 tw-px-2 tw-h-10 tw-border tw-border-solid tw-border-iron-700 tw-text-iron-300 tw-shadow-sm hover:tw-bg-iron-700 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 tw-transition tw-duration-300 tw-ease-out"
          >
            <svg
              className="tw-h-5 tw-w-5 tw-flex-shrink-0"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M6 9L12 15L18 9"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
        <button
          type="button"
          aria-label="Notifications"
          title="Notifications"
          className="tw-relative tw-flex tw-items-center tw-justify-center tw-rounded-lg tw-bg-iron-800 tw-h-10 tw-w-10 tw-border tw-border-solid tw-border-iron-700 tw-text-iron-300 hover:tw-text-iron-50 tw-shadow-sm hover:tw-bg-iron-700 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 tw-transition tw-duration-300 tw-ease-out"
        >
          <svg
            className="tw-w-5 tw-h-5 tw-flex-shrink-0"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M9.35419 21C10.0593 21.6224 10.9856 22 12 22C13.0145 22 13.9407 21.6224 14.6458 21M18 8C18 6.4087 17.3679 4.88258 16.2427 3.75736C15.1174 2.63214 13.5913 2 12 2C10.4087 2 8.8826 2.63214 7.75738 3.75736C6.63216 4.88258 6.00002 6.4087 6.00002 8C6.00002 11.0902 5.22049 13.206 4.34968 14.6054C3.61515 15.7859 3.24788 16.3761 3.26134 16.5408C3.27626 16.7231 3.31488 16.7926 3.46179 16.9016C3.59448 17 4.19261 17 5.38887 17H18.6112C19.8074 17 20.4056 17 20.5382 16.9016C20.6852 16.7926 20.7238 16.7231 20.7387 16.5408C20.7522 16.3761 20.3849 15.7859 19.6504 14.6054C18.7795 13.206 18 11.0902 18 8Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <div className="tw-absolute tw-rounded-full -tw-right-1 -tw-top-1 tw-bg-red tw-h-3 tw-w-3"></div>
        </button>
        <button
          type="button"
          aria-label="Search"
          title="Search"
          className="tw-flex tw-items-center tw-justify-center tw-rounded-lg tw-bg-iron-800 tw-h-10 tw-w-10 tw-border tw-border-solid tw-border-iron-700 tw-text-iron-300 hover:tw-text-iron-50 tw-shadow-sm hover:tw-bg-iron-700 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 tw-transition tw-duration-300 tw-ease-out"
        >
          <svg
            className="tw-h-5 tw-w-5 tw-flex-shrink-0"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M21 21L16.65 16.65M19 11C19 15.4183 15.4183 19 11 19C6.58172 19 3 15.4183 3 11C3 6.58172 6.58172 3 11 3C15.4183 3 19 6.58172 19 11Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <button
          type="button"
          aria-label="Disconnect"
          title="Disconnect"
          className="tw-flex tw-items-center tw-justify-center tw-rounded-lg tw-bg-iron-800 tw-h-10 tw-w-10 tw-border tw-border-solid tw-border-iron-700 tw-text-iron-300 hover:tw-text-iron-50 tw-shadow-sm hover:tw-bg-iron-700 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 tw-transition tw-duration-300 tw-ease-out"
        >
          <svg
            className="tw-h-5 tw-w-5 tw-flex-shrink-0"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M16 17L21 12M21 12L16 7M21 12H9M12 17C12 17.93 12 18.395 11.8978 18.7765C11.6204 19.8117 10.8117 20.6204 9.77646 20.8978C9.39496 21 8.92997 21 8 21H7.5C6.10218 21 5.40326 21 4.85195 20.7716C4.11687 20.4672 3.53284 19.8831 3.22836 19.1481C3 18.5967 3 17.8978 3 16.5V7.5C3 6.10217 3 5.40326 3.22836 4.85195C3.53284 4.11687 4.11687 3.53284 4.85195 3.22836C5.40326 3 6.10218 3 7.5 3H8C8.92997 3 9.39496 3 9.77646 3.10222C10.8117 3.37962 11.6204 4.18827 11.8978 5.22354C12 5.60504 12 6.07003 12 7"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
