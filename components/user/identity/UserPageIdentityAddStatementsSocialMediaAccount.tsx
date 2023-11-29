import FacebookIcon from "../utils/FacebookIcon";
import GithubIcon from "../utils/GithubIcon";
import InstagramIcon from "../utils/InstagramIcon";
import LinkedInIcon from "../utils/LinkedInIcon";
import MediumIcon from "../utils/MediumIcon";
import MirrorIcon from "../utils/MirrorIcon";
import RedditIcon from "../utils/RedditIcon";
import SubstackIcon from "../utils/SubstackIcon";
import TikTokIcon from "../utils/TikTokIcon";
import WeiboIcon from "../utils/WeiboIcon";
import XIcon from "../utils/XIcon";
import YoutubeIcon from "../utils/YoutubeIcon";

export default function UserPageIdentityAddStatementsSocialMediaAccount() {
  return (
    <div className="tw-relative tw-z-10" role="dialog">
      <div className="tw-fixed tw-inset-0 tw-bg-gray-500 tw-bg-opacity-75"></div>
      <div className="tw-fixed tw-inset-0 tw-z-10 tw-overflow-y-auto">
        <div className="tw-flex tw-min-h-full tw-items-end tw-justify-center tw-p-4 tw-text-center sm:tw-items-center sm:tw-p-0">
          <div className="tw-relative tw-w-full tw-transform tw-rounded-xl tw-bg-neutral-900 tw-text-left tw-shadow-xl tw-transition-all sm:tw-w-full tw-p-6 sm:tw-max-w-[420px]">
            <div className="tw-flex tw-justify-between">
              <div className="tw-max-w-xl tw-flex tw-items-center tw-space-x-4">
                <div>
                  <span className="tw-inline-flex tw-items-center tw-justify-center tw-rounded-xl tw-h-11 tw-w-11 tw-bg-neutral-700/60 tw-border tw-border-solid tw-border-neutral-600/20">
                    <svg
                      className="tw-flex-shrink-0 tw-h-6 tw-w-6 tw-text-neutral-50 group-hover:tw-scale-105 tw-transition tw-duration-300 tw-ease-out"
                      aria-hidden="true"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M16 3.46776C17.4817 4.20411 18.5 5.73314 18.5 7.5C18.5 9.26686 17.4817 10.7959 16 11.5322M18 16.7664C19.5115 17.4503 20.8725 18.565 22 20M2 20C3.94649 17.5226 6.58918 16 9.5 16C12.4108 16 15.0535 17.5226 17 20M14 7.5C14 9.98528 11.9853 12 9.5 12C7.01472 12 5 9.98528 5 7.5C5 5.01472 7.01472 3 9.5 3C11.9853 3 14 5.01472 14 7.5Z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                </div>
                <p className="tw-max-w-sm tw-text-lg tw-text-neutral-50 tw-font-medium tw-mb-0">
                  Add Social Media Account
                </p>
              </div>
              <div className="tw-absolute tw-right-4 tw-top-6 tw-flex tw-justify-between tw-items-center">
                <button
                  type="button"
                  className="tw-p-2.5 tw-flex tw-items-center tw-justify-center tw-rounded-full tw-bg-neutral-900 tw-border-0 tw-text-neutral-400 hover:tw-text-neutral-50 focus:tw-outline-none tw-transition tw-duration-300 tw-ease-out"
                >
                  <span className="tw-sr-only tw-text-sm">Close</span>
                  <svg
                    className="tw-h-6 tw-w-6"
                    aria-hidden="true"
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

            {/*  Button group */}
            <div className="tw-mt-8">
              <span className="tw-isolate tw-inline-flex tw-rounded-md tw-shadow-sm tw-w-full">
                <button
                  type="button"
                  className="tw-bg-neutral-800 tw-relative -tw-ml-px tw-flex tw-items-center tw-justify-center tw-rounded-l-md tw-flex-1 tw-py-3 tw-text-sm tw-font-semibold tw-text-neutral-50 tw-border-none tw-ring-1 tw-ring-inset tw-ring-neutral-700 hover:tw-bg-neutral-800 tw-transition tw-duration-300 tw-ease-out tw-focus:tw-z-10"
                >
                  <div className="tw-flex-shrink-0 tw-w-5 tw-h-5">
                    <XIcon aria-hidden="true" />
                  </div>
                  <span className="tw-sr-only">X (Twitter)</span>
                </button>
                <button
                  type="button"
                  className="tw-relative -tw-ml-px tw-flex tw-items-center tw-justify-center tw-bg-transparent tw-flex-1 tw-py-3 tw-text-sm tw-font-semibold tw-text-neutral-50 tw-border-none tw-ring-1 tw-ring-inset tw-ring-neutral-700 hover:tw-bg-neutral-800 tw-transition tw-duration-300 tw-ease-out tw-focus:tw-z-10"
                >
                  <div className="tw-flex-shrink-0 tw-w-5 tw-h-5">
                    <FacebookIcon aria-hidden="true" />
                  </div>
                  <span className="tw-sr-only">Facebook</span>
                </button>
                <button
                  type="button"
                  className="tw-relative -tw-ml-px tw-flex tw-items-center tw-justify-center tw-bg-transparent tw-flex-1 tw-py-3 tw-text-sm tw-font-semibold tw-text-neutral-50 tw-border-none tw-ring-1 tw-ring-inset tw-ring-neutral-700 hover:tw-bg-neutral-800 tw-transition tw-duration-300 tw-ease-out tw-focus:tw-z-10"
                >
                  <div className="tw-flex-shrink-0 tw-w-5 tw-h-5">
                    <LinkedInIcon aria-hidden="true" />
                  </div>
                  <span className="tw-sr-only">LinkedIn</span>
                </button>
                <button
                  type="button"
                  className="tw-relative -tw-ml-px tw-flex tw-items-center tw-justify-center tw-bg-transparent tw-flex-1 tw-py-3 tw-text-sm tw-font-semibold tw-text-neutral-50 tw-border-none tw-ring-1 tw-ring-inset tw-ring-neutral-700 hover:tw-bg-neutral-800 tw-transition tw-duration-300 tw-ease-out tw-focus:tw-z-10"
                >
                  <div className="tw-flex-shrink-0 tw-w-5 tw-h-5">
                    <InstagramIcon aria-hidden="true" />
                  </div>
                  <span className="tw-sr-only">Instagram</span>
                </button>
                <button
                  type="button"
                  className="tw-relative -tw-ml-px tw-flex tw-items-center tw-justify-center tw-bg-transparent tw-flex-1 tw-py-3 tw-text-sm tw-font-semibold tw-text-neutral-50 tw-border-none tw-ring-1 tw-ring-inset tw-ring-neutral-700 hover:tw-bg-neutral-800 tw-transition tw-duration-300 tw-ease-out tw-focus:tw-z-10"
                >
                  <div className="tw-flex-shrink-0 tw-w-5 tw-h-5">
                    <TikTokIcon aria-hidden="true" />
                  </div>
                  <span className="tw-sr-only">Tik Tok</span>
                </button>
                <button
                  type="button"
                  className="tw-relative -tw-ml-px tw-flex tw-items-center tw-justify-center tw-bg-transparent tw-flex-1 tw-py-3 tw-text-sm tw-font-semibold tw-text-neutral-50 tw-border-none tw-ring-1 tw-ring-inset tw-ring-neutral-700 hover:tw-bg-neutral-800 tw-transition tw-duration-300 tw-ease-out tw-focus:tw-z-10 tw-rounded-r-md"
                >
                  <div className="tw-flex-shrink-0 tw-w-5 tw-h-5">
                    <GithubIcon aria-hidden="true" />
                  </div>
                  <span className="tw-sr-only">Github</span>
                </button>
              </span>
              {/*  Button group */}
              <span className="tw-mt-2 tw-isolate tw-inline-flex tw-rounded-md tw-shadow-sm tw-w-full">
                <button
                  type="button"
                  className="tw-relative -tw-ml-px tw-flex tw-items-center tw-justify-center tw-bg-transparent tw-flex-1 tw-py-3 tw-text-sm tw-font-semibold tw-text-neutral-50 tw-border-none tw-ring-1 tw-ring-inset tw-ring-neutral-700 hover:tw-bg-neutral-800 tw-transition tw-duration-300 tw-ease-out tw-focus:tw-z-10 tw-rounded-l-md"
                >
                  <div className="tw-flex-shrink-0 tw-w-5 tw-h-5">
                    <RedditIcon aria-hidden="true" />
                  </div>
                  <span className="tw-sr-only">Reddit</span>
                </button>
                <button
                  type="button"
                  className="tw-relative -tw-ml-px tw-flex tw-items-center tw-justify-center tw-bg-transparent tw-flex-1 tw-py-3 tw-text-sm tw-font-semibold tw-text-neutral-50 tw-border-none tw-ring-1 tw-ring-inset tw-ring-neutral-700 hover:tw-bg-neutral-800 tw-transition tw-duration-300 tw-ease-out tw-focus:tw-z-10"
                >
                  <div className="tw-flex-shrink-0 tw-w-5 tw-h-5">
                    <WeiboIcon aria-hidden="true" />
                  </div>
                  <span className="tw-sr-only">Weibo</span>
                </button>
                <button
                  type="button"
                  className="tw-relative -tw-ml-px tw-flex tw-items-center tw-justify-center tw-bg-transparent tw-flex-1 tw-py-3 tw-text-sm tw-font-semibold tw-text-neutral-50 tw-border-none tw-ring-1 tw-ring-inset tw-ring-neutral-700 hover:tw-bg-neutral-800 tw-transition tw-duration-300 tw-ease-out tw-focus:tw-z-10"
                >
                  <div className="tw-flex-shrink-0 tw-w-5 tw-h-5">
                    <SubstackIcon aria-hidden="true" />
                  </div>
                  <span className="tw-sr-only">Substack</span>
                </button>
                <button
                  type="button"
                  className="tw-relative -tw-ml-px tw-flex tw-items-center tw-justify-center tw-bg-transparent tw-flex-1 tw-py-3 tw-text-sm tw-font-semibold tw-text-neutral-50 tw-border-none tw-ring-1 tw-ring-inset tw-ring-neutral-700 hover:tw-bg-neutral-800 tw-transition tw-duration-300 tw-ease-out tw-focus:tw-z-10"
                >
                  <div className="tw-flex-shrink-0 tw-w-5 tw-h-5">
                    <MediumIcon aria-hidden="true" />
                  </div>
                  <span className="tw-sr-only">Medium</span>
                </button>
                <button
                  type="button"
                  className="tw-relative -tw-ml-px tw-flex tw-items-center tw-justify-center tw-bg-transparent tw-flex-1 tw-py-3 tw-text-sm tw-font-semibold tw-text-neutral-50 tw-border-none tw-ring-1 tw-ring-inset tw-ring-neutral-700 hover:tw-bg-neutral-800 tw-transition tw-duration-300 tw-ease-out tw-focus:tw-z-10"
                >
                  <div className="tw-flex-shrink-0 tw-w-5 tw-h-5">
                    <MirrorIcon aria-hidden="true" />
                  </div>
                  <span className="tw-sr-only">Mirror.xyz</span>
                </button>
                <button
                  type="button"
                  className="tw-relative -tw-ml-px tw-flex tw-items-center tw-justify-center tw-bg-transparent tw-flex-1 tw-py-3 tw-text-sm tw-font-semibold tw-text-neutral-50 tw-border-none tw-ring-1 tw-ring-inset tw-ring-neutral-700 hover:tw-bg-neutral-800 tw-transition tw-duration-300 tw-ease-out tw-focus:tw-z-10 tw-rounded-r-md"
                >
                  <div className="tw-flex-shrink-0 tw-w-5 tw-h-5">
                    <YoutubeIcon aria-hidden="true" />
                  </div>
                  <span className="tw-sr-only">Youtube</span>
                </button>
              </span>
            </div>

            {/*  Input */}
            <div className="tw-mt-4">
              <form>
                <label className="tw-block tw-text-sm tw-font-normal tw-leading-5 tw-text-[#B0B0B0]">
                  Twitter Account
                </label>
                <div className="tw-relative tw-mt-2">
                  <div className="tw-pointer-events-none tw-absolute tw-inset-y-0 tw-left-0 tw-flex tw-items-center tw-pl-3">
                    <div className="tw-h-5 tw-w-5 tw-flex tw-items-center tw-flex-shrink-0">
                      <XIcon aria-hidden="true" />
                    </div>
                    {/*    <div className="tw-h-5 tw-w-5 tw-flex tw-items-center tw-flex-shrink-0">
                     <FacebookIcon aria-hidden="true" />
                    </div>
                    <div className="tw-h-5 tw-w-5 tw-flex tw-items-center tw-flex-shrink-0">
                    <LinkedInIcon aria-hidden="true" />
                    </div>
                    <div className="tw-h-5 tw-w-5 tw-flex tw-items-center tw-flex-shrink-0">
                    <InstagramIcon aria-hidden="true" />
                    </div>
                    <div className="tw-h-5 tw-w-5 tw-flex tw-items-center tw-flex-shrink-0">
                    <TikTokIcon aria-hidden="true" />
                    </div>
                    <div className="tw-h-5 tw-w-5 tw-flex tw-items-center tw-flex-shrink-0">
                    <GithubIcon aria-hidden="true" />
                    </div>
                    <div className="tw-h-5 tw-w-5 tw-flex tw-items-center tw-flex-shrink-0">
                    <RedditIcon aria-hidden="true" />
                    </div>
                    <div className="tw-h-5 tw-w-5 tw-flex tw-items-center tw-flex-shrink-0">
                    <WeiboIcon aria-hidden="true" />
                    </div>
                    <div className="tw-h-5 tw-w-5 tw-flex tw-items-center tw-flex-shrink-0">
                    <SubstackIcon aria-hidden="true" />
                    </div>
                    <div className="tw-h-5 tw-w-5 tw-flex tw-items-center tw-flex-shrink-0">
                    <MediumIcon aria-hidden="true" />
                    </div>
                    <div className="tw-h-5 tw-w-5 tw-flex tw-items-center tw-flex-shrink-0">
                    <MirrorIcon aria-hidden="true" />
                    </div>
                    <div className="tw-h-5 tw-w-5 tw-flex tw-items-center tw-flex-shrink-0">
                    <YoutubeIcon aria-hidden="true" />
                    </div> */}
                  </div>
                  <input
                    type="text"
                    required
                    autoComplete="off"
                    className="tw-form-input tw-block tw-w-full tw-rounded-lg tw-border-0 tw-py-3 tw-pl-10 tw-pr-3 tw-bg-neutral-700/40 tw-text-white tw-font-medium tw-caret-primary-300 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-white/5 placeholder:tw-text-neutral-500 focus:tw-outline-none focus:tw-bg-transparent focus:tw-ring-1 focus:tw-ring-inset hover:tw-ring-neutral-700 focus:tw-ring-primary-300 tw-text-base sm:tw-leading-6 tw-transition tw-duration-300 tw-ease-out"
                  />
                </div>
              </form>
            </div>

            <div className="tw-mt-8">
              <div className="tw-flex tw-items-center tw-justify-end tw-gap-x-3">
                <button
                  type="submit"
                  className="tw-cursor-pointer tw-bg-neutral-900 tw-px-4 tw-py-3 tw-text-sm tw-font-medium tw-text-white tw-border tw-border-solid tw-border-neutral-600 tw-rounded-lg hover:tw-bg-neutral-800 hover:tw-border-neutral-700 tw-transition tw-duration-300 tw-ease-out"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="tw-cursor-pointer tw-bg-primary-500 tw-px-4 tw-py-3 tw-text-sm tw-font-medium tw-text-white tw-border tw-border-solid tw-border-primary-500 tw-rounded-lg hover:tw-bg-primary-600 hover:tw-border-primary-600 tw-transition tw-duration-300 tw-ease-out"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
