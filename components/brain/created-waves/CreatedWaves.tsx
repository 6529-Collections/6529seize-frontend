export default function CreatedWaves() {
  return (
    <div className="tw-mt-4">
      <div className="tw-rounded-xl tw-bg-gradient-to-b tw-p-[1px] tw-from-iron-700 tw-via-iron-700 tw-to-iron-800">
        <div className="tw-h-full tw-bg-iron-950 tw-rounded-xl  tw-py-5 tw-px-5">
          <div className="tw-flex tw-items-center tw-gap-x-2">
            <div className="tw-flex tw-items-center tw-gap-x-3">
              <div className="tw-h-9 tw-w-9 tw-rounded-xl tw-bg-gradient-to-b tw-p-[1px] tw-from-iron-800 tw-via-iron-800 tw-to-iron-900">
                <div className="tw-h-full tw-bg-iron-950 tw-rounded-xl tw-flex tw-items-center tw-justify-center">
                  <svg
                    className="tw-inline tw-h-5 tw-w-5 tw-text-indigo-300"
                    width="48"
                    height="48"
                    viewBox="0 0 48 48"
                    fill="none"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M33.8182 12.5455C33.8182 7.28209 29.5361 3 24.2727 3C19.0094 3 14.7273 7.28209 14.7273 12.5455C14.7273 17.8088 19.0094 22.0909 24.2727 22.0909C29.5361 22.0909 33.8182 17.8088 33.8182 12.5455ZM18.5455 12.5455C18.5455 9.38782 21.1151 6.81818 24.2727 6.81818C27.4304 6.81818 30 9.38782 30 12.5455C30 15.7031 27.4304 18.2727 24.2727 18.2727C21.1151 18.2727 18.5455 15.7031 18.5455 12.5455Z"
                      fill="currentColor"
                    />
                    <path
                      d="M37.6364 45H10.9091C9.85527 45 9 44.1447 9 43.0909V39.2727C9 30.8517 15.8517 24 24.2727 24C32.6937 24 39.5455 30.8517 39.5455 39.2727V43.0909C39.5455 44.1447 38.6902 45 37.6364 45ZM12.8182 41.1818H35.7273V39.2727C35.7273 32.9555 30.5899 27.8182 24.2727 27.8182C17.9555 27.8182 12.8182 32.9555 12.8182 39.2727V41.1818Z"
                      fill="currentColor"
                    />
                  </svg>
                </div>
              </div>

              <p className="-tw-mb-1 tw-mb-0 tw-text-lg tw-font-semibold tw-text-iron-50 tw-tracking-tight">
                My Waves
              </p>
            </div>
          </div>
          <div className="tw-mt-4 tw-flex tw-flex-col tw-space-y-4">
            <div className="tw-no-underline tw-flex tw-items-center tw-gap-x-3 tw-text-white tw-font-semibold tw-text-sm hover:tw-text-iron-400 tw-transition tw-duration-300 tw-ease-out">
              <img
                src="#"
                alt="#"
                className="tw-flex-shrink-0 tw-object-contain tw-h-7 tw-w-7 tw-rounded-full tw-bg-iron-700 tw-ring-1 tw-ring-inset tw-ring-white/20"
              />
              <span>Wave name</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
