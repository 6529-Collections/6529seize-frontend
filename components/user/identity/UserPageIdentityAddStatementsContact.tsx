import DiscordIcon from "../utils/DiscordIcon";
import FacebookIcon from "../utils/FacebookIcon";
import GithubIcon from "../utils/GithubIcon";
import InstagramIcon from "../utils/InstagramIcon";
import LinkedInIcon from "../utils/LinkedInIcon";
import MediumIcon from "../utils/MediumIcon";
import MirrorIcon from "../utils/MirrorIcon";
import RedditIcon from "../utils/RedditIcon";
import SubstackIcon from "../utils/SubstackIcon";
import TelegramIcon from "../utils/TelegramIcon";
import TikTokIcon from "../utils/TikTokIcon";
import WeChatIcon from "../utils/WeChatIcon";
import WeiboIcon from "../utils/WeiboIcon";
import XIcon from "../utils/XIcon";
import YoutubeIcon from "../utils/YoutubeIcon";

export default function UserPageIdentityAddStatementsContact() {
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
                        d="M7 8.5H12M7 12H15M9.68375 18H16.2C17.8802 18 18.7202 18 19.362 17.673C19.9265 17.3854 20.3854 16.9265 20.673 16.362C21 15.7202 21 14.8802 21 13.2V7.8C21 6.11984 21 5.27976 20.673 4.63803C20.3854 4.07354 19.9265 3.6146 19.362 3.32698C18.7202 3 17.8802 3 16.2 3H7.8C6.11984 3 5.27976 3 4.63803 3.32698C4.07354 3.6146 3.6146 4.07354 3.32698 4.63803C3 5.27976 3 6.11984 3 7.8V20.3355C3 20.8684 3 21.1348 3.10923 21.2716C3.20422 21.3906 3.34827 21.4599 3.50054 21.4597C3.67563 21.4595 3.88367 21.2931 4.29976 20.9602L6.68521 19.0518C7.17252 18.662 7.41617 18.4671 7.68749 18.3285C7.9282 18.2055 8.18443 18.1156 8.44921 18.0613C8.74767 18 9.0597 18 9.68375 18Z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                </div>
                <p className="tw-max-w-sm tw-text-lg tw-text-neutral-50 tw-font-medium tw-mb-0">
                  Add Contact
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
                    <DiscordIcon aria-hidden="true" />
                  </div>
                  <span className="tw-sr-only">Discord</span>
                </button>
                <button
                  type="button"
                  className="tw-relative -tw-ml-px tw-flex tw-items-center tw-justify-center tw-bg-transparent tw-flex-1 tw-py-3 tw-text-sm tw-font-semibold tw-text-neutral-50 tw-border-none tw-ring-1 tw-ring-inset tw-ring-neutral-700 hover:tw-bg-neutral-800 tw-transition tw-duration-300 tw-ease-out tw-focus:tw-z-10"
                >
                  <div className="tw-flex-shrink-0 tw-w-5 tw-h-5">
                    <TelegramIcon aria-hidden="true" />
                  </div>
                  <span className="tw-sr-only">Telegram</span>
                </button>
                <button
                  type="button"
                  className="tw-relative -tw-ml-px tw-flex tw-items-center tw-justify-center tw-bg-transparent tw-flex-1 tw-py-3 tw-text-sm tw-font-semibold tw-text-neutral-50 tw-border-none tw-ring-1 tw-ring-inset tw-ring-neutral-700 hover:tw-bg-neutral-800 tw-transition tw-duration-300 tw-ease-out tw-focus:tw-z-10"
                >
                  <div className="tw-flex-shrink-0 tw-w-5 tw-h-5">
                    <WeChatIcon aria-hidden="true" />
                  </div>
                  <span className="tw-sr-only">WeChat</span>
                </button>
                <button
                  type="button"
                  className="tw-relative -tw-ml-px tw-flex tw-items-center tw-justify-center tw-bg-transparent tw-flex-1 tw-py-3 tw-text-sm tw-font-semibold tw-text-neutral-50 tw-border-none tw-ring-1 tw-ring-inset tw-ring-neutral-700 hover:tw-bg-neutral-800 tw-transition tw-duration-300 tw-ease-out tw-focus:tw-z-10"
                >
                  <svg
                    className="tw-flex-shrink-0 tw-h-5 tw-w-5 tw-text-neutral-100"
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M8.38028 8.85335C9.07627 10.303 10.0251 11.6616 11.2266 12.8632C12.4282 14.0648 13.7869 15.0136 15.2365 15.7096C15.3612 15.7694 15.4235 15.7994 15.5024 15.8224C15.7828 15.9041 16.127 15.8454 16.3644 15.6754C16.4313 15.6275 16.4884 15.5704 16.6027 15.4561C16.9523 15.1064 17.1271 14.9316 17.3029 14.8174C17.9658 14.3864 18.8204 14.3864 19.4833 14.8174C19.6591 14.9316 19.8339 15.1064 20.1835 15.4561L20.3783 15.6509C20.9098 16.1824 21.1755 16.4481 21.3198 16.7335C21.6069 17.301 21.6069 17.9713 21.3198 18.5389C21.1755 18.8242 20.9098 19.09 20.3783 19.6214L20.2207 19.779C19.6911 20.3087 19.4263 20.5735 19.0662 20.7757C18.6667 21.0001 18.0462 21.1615 17.588 21.1601C17.1751 21.1589 16.8928 21.0788 16.3284 20.9186C13.295 20.0576 10.4326 18.4332 8.04466 16.0452C5.65668 13.6572 4.03221 10.7948 3.17124 7.76144C3.01103 7.19699 2.93092 6.91477 2.9297 6.50182C2.92833 6.0436 3.08969 5.42311 3.31411 5.0236C3.51636 4.66357 3.78117 4.39876 4.3108 3.86913L4.46843 3.7115C4.99987 3.18006 5.2656 2.91433 5.55098 2.76999C6.11854 2.48292 6.7888 2.48292 7.35636 2.76999C7.64174 2.91433 7.90747 3.18006 8.43891 3.7115L8.63378 3.90637C8.98338 4.25597 9.15819 4.43078 9.27247 4.60655C9.70347 5.26945 9.70347 6.12403 9.27247 6.78692C9.15819 6.96269 8.98338 7.1375 8.63378 7.4871C8.51947 7.60142 8.46231 7.65857 8.41447 7.72538C8.24446 7.96281 8.18576 8.30707 8.26748 8.58743C8.29048 8.66632 8.32041 8.72866 8.38028 8.85335Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span className="tw-sr-only">Phone</span>
                </button>
                <button
                  type="button"
                  className="tw-relative -tw-ml-px tw-flex tw-items-center tw-justify-center tw-bg-transparent tw-flex-1 tw-py-3 tw-text-sm tw-font-semibold tw-text-neutral-50 tw-border-none tw-ring-1 tw-ring-inset tw-ring-neutral-700 hover:tw-bg-neutral-800 tw-transition tw-duration-300 tw-ease-out tw-focus:tw-z-10"
                >
                  <svg
                    className="tw-flex-shrink-0 tw-h-5 tw-w-5 tw-text-neutral-100"
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M2 7L10.1649 12.7154C10.8261 13.1783 11.1567 13.4097 11.5163 13.4993C11.8339 13.5785 12.1661 13.5785 12.4837 13.4993C12.8433 13.4097 13.1739 13.1783 13.8351 12.7154L22 7M6.8 20H17.2C18.8802 20 19.7202 20 20.362 19.673C20.9265 19.3854 21.3854 18.9265 21.673 18.362C22 17.7202 22 16.8802 22 15.2V8.8C22 7.11984 22 6.27976 21.673 5.63803C21.3854 5.07354 20.9265 4.6146 20.362 4.32698C19.7202 4 18.8802 4 17.2 4H6.8C5.11984 4 4.27976 4 3.63803 4.32698C3.07354 4.6146 2.6146 5.07354 2.32698 5.63803C2 6.27976 2 7.11984 2 8.8V15.2C2 16.8802 2 17.7202 2.32698 18.362C2.6146 18.9265 3.07354 19.3854 3.63803 19.673C4.27976 20 5.11984 20 6.8 20Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span className="tw-sr-only">Email</span>
                </button>
                <button
                  type="button"
                  className="tw-relative -tw-ml-px tw-flex tw-items-center tw-justify-center tw-bg-transparent tw-flex-1 tw-py-3 tw-text-sm tw-font-semibold tw-text-neutral-50 tw-border-none tw-ring-1 tw-ring-inset tw-ring-neutral-700 hover:tw-bg-neutral-800 tw-transition tw-duration-300 tw-ease-out tw-focus:tw-z-10 tw-rounded-r-md"
                >
                  <svg
                    className="tw-flex-shrink-0 tw-h-5 tw-w-5 tw-text-neutral-100"
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M12 2C14.5013 4.73835 15.9228 8.29203 16 12C15.9228 15.708 14.5013 19.2616 12 22M12 2C9.49872 4.73835 8.07725 8.29203 8 12C8.07725 15.708 9.49872 19.2616 12 22M12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22M12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22M2.50002 9H21.5M2.5 15H21.5"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span className="tw-sr-only">Website</span>
                </button>
              </span>
            </div>

            {/*  Input */}
            <div className="tw-mt-4">
              <form>
                <label className="tw-block tw-text-sm tw-font-normal tw-leading-5 tw-text-[#B0B0B0]">
                  Discord Account
                </label>
                <div className="tw-relative tw-mt-2">
                  <div className="tw-pointer-events-none tw-absolute tw-inset-y-0 tw-left-0 tw-flex tw-items-center tw-pl-3">
                    <div className="tw-h-5 tw-w-5 tw-flex tw-items-center tw-flex-shrink-0">
                      <DiscordIcon aria-hidden="true" />
                    </div>
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
