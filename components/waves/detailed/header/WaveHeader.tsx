import { Wave } from "../../../../generated/models/Wave";
import { getTimeUntil } from "../../../../helpers/Helpers";

export default function WaveHeader({ wave }: { readonly wave: Wave }) {
  const created = getTimeUntil(wave.created_at);
  const ending = wave.wave.period?.max
    ? getTimeUntil(wave.wave.period.max)
    : null;
  return (
    <div>
      <div>
        <div
          className="tw-h-32 tw-w-full tw-object-cover lg:tw-h-44"
          style={{
            background: `linear-gradient(45deg, ${wave.author.banner1_color} 0%, ${wave.author.banner2_color} 100%)`,
          }}
        ></div>
      </div>

      <div className="tw-max-w-5xl tw-mx-auto tw-px-6 md:tw-px-0">
        <div className="-tw-mt-12 tw-flex tw-space-x-5">
          <div className="tw-flex">
            {wave.picture ? (
              <img
                className="tw-h-24 tw-w-24 tw-object-contain tw-rounded-full tw-ring-4 tw-ring-iron-950 sm:tw-h-32 sm:tw-w-32 tw-bg-iron-900"
                src={wave.picture}
                alt=""
              />
            ) : (
              <div className="tw-h-24 tw-w-24 tw-rounded-full tw-ring-4 tw-ring-iron-950 sm:tw-h-32 sm:tw-w-32 tw-bg-iron-900" />
            )}
          </div>

          <div className="tw-mt-4 md:tw-mt-8 tw-flex tw-min-w-0 tw-flex-1 tw-items-center tw-justify-end tw-space-x-6 tw-pb-1">
            <div className="md:tw-mt-6 tw-min-w-0 tw-flex-1 tw-hidden md:tw-block">
              <h1 className="tw-truncate tw-text-xl sm:tw-text-2xl tw-font-semibold tw-text-white">
                {wave.name}
              </h1>
              <div className="tw-flex tw-items-center">
                <div className="tw-flex -tw-space-x-2">
                  {wave.contributors_overview.map((item) => (
                    <img
                      key={item.contributor_identity}
                      className="tw-inline-block tw-h-6 tw-w-6 tw-rounded-md tw-ring-2 tw-ring-black"
                      src={item.contributor_pfp}
                      alt=""
                    />
                  ))}
                </div>
                {wave.contributors_overview.length < 5 ? (
                  <span className="tw-font-normal tw-ml-2 tw-text-iron-400 tw-text-sm">
                    dropped
                  </span>
                ) : (
                  <span className="tw-font-normal tw-ml-2 tw-text-iron-400 tw-text-sm">
                    and others dropped
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="tw-mt-16 tw-flex tw-flex-col tw-items-end tw-gap-y-2">
            <div className="tw-hidden md:tw-flex tw-items-center tw-gap-x-2">
              <div className="tw-text-xs">
                <span className="tw-font-normal tw-text-iron-400 tw-pr-1">
                  Created
                </span>
                <span className="tw-font-normal tw-text-iron-400">
                  {created}
                </span>
              </div>
              {ending && (
                <>
                  <div className="tw-w-1 tw-h-1 tw-bg-iron-600 tw-rounded-full"></div>
                  <div className="tw-text-xs">
                    <span className="tw-font-normal tw-text-iron-400 tw-pr-1">
                      Ending
                    </span>
                    <span className="tw-font-normal tw-text-iron-400">
                      {ending}
                    </span>
                  </div>
                </>
              )}
            </div>
            <button
              type="button"
              className="tw-inline-flex tw-items-center tw-gap-x-2 tw-cursor-pointer tw-bg-primary-500 tw-px-3.5 tw-py-2.5 tw-text-sm tw-rounded-lg tw-font-semibold tw-text-white hover:tw-text-white tw-border-0 tw-ring-1 tw-ring-inset tw-ring-primary-500 hover:tw-ring-primary-600 placeholder:tw-text-iron-300 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset tw-shadow-sm hover:tw-bg-primary-600 tw-transition tw-duration-300 tw-ease-out"
            >
              <svg
                className="tw-h-5 tw-w-5 tw-flex-shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 15.5H7.5C6.10444 15.5 5.40665 15.5 4.83886 15.6722C3.56045 16.06 2.56004 17.0605 2.17224 18.3389C2 18.9067 2 19.6044 2 21M19 21V15M16 18H22M14.5 7.5C14.5 9.98528 12.4853 12 10 12C7.51472 12 5.5 9.98528 5.5 7.5C5.5 5.01472 7.51472 3 10 3C12.4853 3 14.5 5.01472 14.5 7.5Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span>Subscribe</span>
            </button>
          </div>
        </div>

        <div className="tw-mt-2 sm:tw-mt-4 md:tw-hidden tw-min-w-0 tw-flex-1">
          <h1 className="tw-truncate tw-text-xl sm:tw-text-2xl tw-font-semibold tw-text-white">
            {wave.name}
          </h1>
        </div>
      </div>
    </div>
  );
}
