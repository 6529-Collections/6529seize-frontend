export default function WaveDetailedFollowers({}) {
  return (
    <div>
      <button className="tw-py-2 tw-px-2 -tw-ml-2 tw-flex tw-items-center tw-gap-x-2 tw-justify-center tw-text-sm tw-font-semibold tw-border-0 tw-rounded-lg tw-transition tw-duration-300 tw-ease-out tw-cursor-pointer tw-text-iron-400 tw-bg-transparent hover:tw-text-iron-50">
        <svg
          className="tw-flex-shrink-0 tw-w-5 tw-h-5"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M20 12H4M4 12L10 18M4 12L10 6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          ></path>
        </svg>
        <span>Back</span>
      </button>
      <div className="tw-mt-4">
        <div className="tw-mb-0 tw-text-lg tw-text-white tw-font-semibold tw-tracking-tight">
          Followers
        </div>

        {/* wrapper for followers list */}
        <div className="tw-mt-4 tw-flex tw-flex-col tw-gap-y-4">
          {/* followers list item */}
          <div className="tw-flex tw-gap-x-3">
            <div className="tw-h-10 tw-w-10 tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-800 tw-relative tw-flex-shrink-0 tw-rounded-lg">
              <div className="tw-rounded-lg tw-h-full tw-w-full">
                <div className="tw-h-full tw-w-full tw-max-w-full tw-rounded-lg tw-overflow-hidden tw-bg-iron-800">
                  <div className="tw-h-full tw-text-center tw-flex tw-items-center tw-justify-center tw-rounded-lg tw-overflow-hidden">
                    <img
                      src="#"
                      alt=""
                      className="tw-bg-transparent tw-max-w-full tw-max-h-full tw-h-auto tw-w-auto tw-mx-auto tw-object-contain"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="tw-flex tw-flex-col">
              <div className="tw-flex tw-items-center tw-gap-x-1">
                <div className="tw-items-center tw-flex tw-gap-x-2">
                  <div className="tw-relative">
                    <div className="tw-h-4 tw-w-4 tw-text-[9px] tw-flex tw-items-center tw-justify-center tw-leading-3 tw-font-bold tw-rounded-full tw-ring-2 tw-ring-iron-300 tw-text-iron-300">
                      nr
                    </div>
                    <span className="-tw-top-[0.1875rem] tw-h-2 tw-w-2 tw-bg-[#FEDF89] tw-flex-shrink-0 tw-absolute -tw-right-1 tw-block tw-rounded-full"></span>
                  </div>
                  <p className="tw-text-md tw-mb-0 tw-leading-none tw-font-semibold tw-text-iron-50">
                    <a
                      href=""
                      className="tw-no-underline hover:tw-underline hover:tw-text-iron-500 tw-transition tw-duration-300 tw-ease-out"
                    >
                      punk6529
                    </a>
                  </p>
                </div>
                <button className="tw-text-iron-500 hover:tw-text-iron-50 tw-flex tw-border-none tw-bg-transparent tw-py-0 tw-px-2 tw-rounded-full tw-m-0 tw-transition tw-duration-300 tw-ease-out">
                  <svg
                    className="tw-h-3 tw-w-3"
                    width="17"
                    height="15"
                    viewBox="0 0 17 15"
                    fill="none"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M14.7953 0.853403L5.24867 10.0667L2.71534 7.36007C2.24867 6.92007 1.51534 6.8934 0.982005 7.26674C0.462005 7.6534 0.315338 8.3334 0.635338 8.88007L3.63534 13.7601C3.92867 14.2134 4.43534 14.4934 5.00867 14.4934C5.55534 14.4934 6.07534 14.2134 6.36867 13.7601C6.84867 13.1334 16.0087 2.2134 16.0087 2.2134C17.2087 0.986737 15.7553 -0.093263 14.7953 0.84007V0.853403Z"
                      fill="currentColor"
                    ></path>
                  </svg>
                </button>
              </div>
              <p className="tw-mt-2 tw-text-md tw-mb-0 tw-text-iron-50 tw-font-normal">
                fighting for an open metaverse. the most bullish person in the
                world about the incredible powers of NFTs.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
