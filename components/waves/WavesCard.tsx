import { useRouter } from "next/router";
import { Wave } from "../../generated/models/Wave";
import { getTimeAgo, getTimeUntil } from "../../helpers/Helpers";

export default function zWavesCard({ wave }: { readonly wave: Wave }) {
  const router = useRouter();
  const goToWave = () => {
    router.push(`/waves/${wave.id}`);
  };
  return (
    <div className="tw-group tw-cursor-pointer" onClick={goToWave}>
      <div className="tw-relative tw-w-full tw-h-20 tw-rounded-t-2xl tw-translate-y-4 group-hover:tw-translate-y-3 tw-transiton tw-duration-500 tw-ease">
        <div
          className="tw-w-full tw-h-full tw-object-cover tw-rounded-t-2xl"
          style={{
            background: `linear-gradient(45deg, ${wave.author.banner1_color} 0%, ${wave.author.banner2_color} 100%)`,
          }}
        />
        <div className="tw-absolute tw-inset-0 tw-rounded-t-2xl tw-ring-2 tw-ring-white/20 tw-ring-inset tw-pointer-events-none"></div>
      </div>
      <div className="tw-bg-iron-900 tw-rounded-2xl tw-relative -tw-mt-4 tw-border tw-border-solid tw-border-t-0 tw-border-iron-700">
        <div className="tw-px-4 sm:tw-px-6 tw-flex tw-items-end tw-justify-between">
          {wave.author.pfp ? (
            <img
              className="-tw-mt-6 tw-h-14 tw-w-14 tw-rounded-full sm:tw-h-16 sm:tw-w-16 tw-bg-iron-700 tw-ring-2 tw-ring-iron-900 group-hover:tw-scale-105 tw-transform tw-transiton tw-duration-300 tw-ease"
              src={wave.author.pfp}
              alt="Profile Picture"
            />
          ) : (
            <div className="-tw-mt-6 tw-h-14 tw-w-14 tw-rounded-full sm:tw-h-16 sm:tw-w-16 tw-bg-iron-700 tw-ring-2 tw-ring-iron-900" />
          )}
          <div className="tw-pt-4 tw-flex tw-items-center tw-gap-x-3">
            <button
              type="button"
              aria-label="Open Wave"
              className="tw-group tw-flex tw-items-center tw-justify-center tw-rounded-lg tw-bg-iron-800 tw-ring-1 tw-ring-inset tw-ring-iron-700 tw-p-2.5 tw-border-0 tw-text-iron-300 hover:tw-text-iron-50 tw-shadow-sm hover:tw-bg-iron-700 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 tw-transition tw-duration-300 tw-ease-out"
            >
              <svg
                className="tw-h-5 tw-w-5 tw-flex-shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M7 17L17 7M17 7H7M17 7V17"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
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
        <div className="tw-pt-2 tw-pb-4 tw-space-y-4 tw-divide-y tw-divide-solid tw-divide-x-0 tw-divide-iron-700">
          <div className="tw-px-4 sm:tw-px-6 tw-flex tw-justify-between tw-items-start tw-gap-x-6">
            <div>
              <p className="tw-mb-0 tw-text-2xl tw-text-white tw-font-semibold">
                {wave.name}
              </p>
              <div className="tw-mt-2 tw-flex tw-items-center tw-gap-x-2">
                <div className="tw-flex -tw-space-x-0.5">
                  <div>
                    <img
                      className="tw-h-6 tw-w-6 tw-rounded-full tw-bg-gray-50 tw-ring-2 tw-ring-iron-900"
                      src="https://images.unsplash.com/photo-1505840717430-882ce147ef2d?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                      alt=""
                    />
                  </div>
                  <div>
                    <img
                      className="tw-h-6 tw-w-6 tw-rounded-full tw-bg-gray-50 tw-ring-2 tw-ring-iron-900"
                      src="https://images.unsplash.com/photo-1505840717430-882ce147ef2d?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                      alt="Emma Dorsey"
                    />
                  </div>
                  <div>
                    <img
                      className="tw-h-6 tw-w-6 tw-rounded-full tw-bg-gray-50 tw-ring-2 tw-ring-iron-900"
                      src="https://images.unsplash.com/photo-1505840717430-882ce147ef2d?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                      alt="Emma Dorsey"
                    />
                  </div>
                  <div>
                    <img
                      className="tw-h-6 tw-w-6 tw-rounded-full tw-bg-gray-50 tw-ring-2 tw-ring-iron-900"
                      src="https://images.unsplash.com/photo-1505840717430-882ce147ef2d?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                      alt="Emma Dorsey"
                    />
                  </div>
                </div>
                <p className="tw-text-sm tw-font-medium tw-text-iron-300 tw-mb-0">
                  +1,235 people dropped
                </p>
              </div>
            </div>
          </div>
          <div className="tw-pt-3 tw-px-4 sm:tw-px-6 tw-flex tw-items-center tw-justify-between">
            <div className="tw-text-sm tw-inline-flex tw-items-center tw-gap-x-2">
              <span className="tw-font-medium tw-text-iron-400">
                Created by
              </span>
              <div className="tw-flex tw-items-center tw-gap-x-2">
                {wave.author.pfp ? (
                  <img
                    className="tw-h-6 tw-w-6 tw-rounded-lg"
                    src={wave.author.pfp}
                    alt="Profile Picture"
                  />
                ) : (
                  <div className="tw-h-6 tw-w-6 tw-rounded-lg" />
                )}
                <span className="tw-font-semibold tw-text-iron-50">
                  {wave.author.handle}
                </span>
              </div>
            </div>
            <div className="tw-text-sm tw-inline-flex tw-items-center tw-gap-x-1.5">
              <svg
                className="tw-w-4 tw-h-4 tw-flex-shrink-0 tw-text-iron-300"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M21 10H3M16 2V6M8 2V6M9 16L11 18L15.5 13.5M7.8 22H16.2C17.8802 22 18.7202 22 19.362 21.673C19.9265 21.3854 20.3854 20.9265 20.673 20.362C21 19.7202 21 18.8802 21 17.2V8.8C21 7.11984 21 6.27976 20.673 5.63803C20.3854 5.07354 19.9265 4.6146 19.362 4.32698C18.7202 4 17.8802 4 16.2 4H7.8C6.11984 4 5.27976 4 4.63803 4.32698C4.07354 4.6146 3.6146 5.07354 3.32698 5.63803C3 6.27976 3 7.11984 3 8.8V17.2C3 18.8802 3 19.7202 3.32698 20.362C3.6146 20.9265 4.07354 21.3854 4.63803 21.673C5.27976 22 6.11984 22 7.8 22Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="tw-font-medium tw-text-iron-400">Created</span>
              <span className="tw-font-medium tw-text-iron-50">
                {getTimeAgo(wave.created_at)}
              </span>
            </div>
            <div className="tw-text-sm tw-inline-flex tw-items-center tw-gap-x-1.5">
              <svg
                className="tw-w-4 tw-h-4 tw-flex-shrink-0 tw-text-iron-300"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 12L7.72711 8.43926C7.09226 7.91022 6.77484 7.6457 6.54664 7.32144C6.34444 7.03413 6.19429 6.71354 6.10301 6.37428C6 5.99139 6 5.57819 6 4.7518V2M12 12L16.2729 8.43926C16.9077 7.91022 17.2252 7.6457 17.4534 7.32144C17.6556 7.03413 17.8057 6.71354 17.897 6.37428C18 5.99139 18 5.57819 18 4.7518V2M12 12L7.72711 15.5607C7.09226 16.0898 6.77484 16.3543 6.54664 16.6786C6.34444 16.9659 6.19429 17.2865 6.10301 17.6257C6 18.0086 6 18.4218 6 19.2482V22M12 12L16.2729 15.5607C16.9077 16.0898 17.2252 16.3543 17.4534 16.6786C17.6556 16.9659 17.8057 17.2865 17.897 17.6257C18 18.0086 18 18.4218 18 19.2482V22M4 2H20M4 22H20"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="tw-font-medium tw-text-iron-400">Ending in</span>
              <span className="tw-font-medium tw-text-iron-50">
                {wave.wave.period?.max
                  ? getTimeUntil(wave.wave.period.max)
                  : "Never"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
