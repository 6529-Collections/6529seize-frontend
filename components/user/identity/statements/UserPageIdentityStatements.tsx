import { IProfileAndConsolidations } from "../../../../entities/IProfile";
import DiscordIcon from "../../utils/icons/DiscordIcon";
import EthereumIcon from "../../utils/icons/EthereumIcon";
import EtherscanIcon from "../../utils/icons/EtherscanIcon";
import FacebookIcon from "../../utils/icons/FacebookIcon";
import GithubIcon from "../../utils/icons/GithubIcon";
import InstagramIcon from "../../utils/icons/InstagramIcon";
import LinkedInIcon from "../../utils/icons/LinkedInIcon";
import MediumIcon from "../../utils/icons/MediumIcon";
import MirrorIcon from "../../utils/icons/MirrorIcon";
import OpenseaIcon from "../../utils/icons/OpenseaIcon";
import RedditIcon from "../../utils/icons/RedditIcon";
import SubstackIcon from "../../utils/icons/SubstackIcon";
import TelegramIcon from "../../utils/icons/TelegramIcon";
import TikTokIcon from "../../utils/icons/TikTokIcon";
import WeChatIcon from "../../utils/icons/WeChatIcon";
import WeiboIcon from "../../utils/icons/WeiboIcon";
import XIcon from "../../utils/icons/XIcon";
import YoutubeIcon from "../../utils/icons/YoutubeIcon";
import UserPageIdentityAddStatementsHeader from "./header/UserPageIdentityAddStatementsHeader";

export default function UserPageIdentityStatements({
  profile,
}: {
  profile: IProfileAndConsolidations;
}) {
  return (
    <div className="tw-mt-10">
      <div className="tw-bg-neutral-800 tw-border tw-border-white/5 tw-border-solid tw-rounded-xl">
        <UserPageIdentityAddStatementsHeader profile={profile} />

        <div className="tw-p-8 tw-mx-auto tw-grid tw-max-w-2xl tw-grid-cols-1 tw-gap-x-8 tw-gap-y-16 tw-sm:gap-y-20 tw-lg:mx-0 lg:tw-max-w-none lg:tw-grid-cols-3">
          <div className="tw-col-span-2 tw-space-y-5">
            <div className="tw-grid tw-grid-cols-1 tw-gap-x-8 tw-gap-y-5 sm:tw-grid-cols-2">
              {/* Consolidated Addresses */}
              <div>
                <div className="tw-flex tw-items-center tw-space-x-4">
                  <div className="tw-flex tw-h-9 tw-w-9 tw-items-center tw-justify-center tw-rounded-lg tw-bg-neutral-700 tw-border tw-border-solid tw-border-neutral-600">
                    <div className="tw-flex tw-items-center tw-justify-center tw-flex-shrink-0 tw-h-5 tw-w-5 tw-text-neutral-50">
                      <EthereumIcon />
                    </div>
                  </div>
                  <span className="tw-text-base tw-font-semibold tw-text-neutral-50">
                    Consolidated Addresses
                  </span>
                </div>
                <ul className="tw-mt-6 tw-list-none tw-space-y-4 tw-pl-0 tw-text-base tw-leading-7 tw-text-gray-600">
                  <li className="tw-group tw-flex tw-items-center tw-group tw-cursor-pointer  tw-text-sm tw-font-medium tw-text-neutral-50 hover:tw-text-neutral-300 tw-transition tw-duration-300 tw-ease-out tw-space-x-3">
                    <div className="tw-cursor-pointer tw-flex-shrink-0 tw-h-6 tw-w-6 hover:tw-scale-110 tw-transition tw-duration-300 tw-ease-out">
                      <OpenseaIcon />
                    </div>
                    <div className="tw-cursor-pointer tw-flex-shrink-0 tw-h-6 tw-w-6  hover:tw-scale-110 tw-transition tw-duration-300 tw-ease-out">
                      <EtherscanIcon />
                    </div>
                    <div className="tw-space-x-3 tw-inline-flex tw-items-center">
                      <span>0xFD22</span>
                      <span>6529.eth</span>
                      <div className="tw-inline-flex tw-items-center">
                        <svg
                          className="tw-flex-shrink-0 tw-w-5 tw-h-5"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M20 6L9 17L4 12"
                            stroke="#3CCB7F"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <span className="tw-ml-1 tw-text-xs tw-font-bold tw-text-neutral-500">
                          Primary
                        </span>
                      </div>
                    </div>
                  </li>
                </ul>
              </div>
              {/* Social Media Accounts */}
              <div>
                <div className="tw-flex tw-items-center tw-space-x-4">
                  <div className="tw-flex tw-h-9 tw-w-9 tw-items-center tw-justify-center tw-rounded-lg tw-bg-neutral-700 tw-border tw-border-solid tw-border-neutral-600">
                    <div className="tw-flex tw-items-center tw-justify-center tw-flex-shrink-0 tw-h-5 tw-w-5 tw-text-neutral-50">
                      <svg
                        className="tw-flex-shrink-0 tw-h-5 tw-w-5 tw-text-neutral-50"
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
                    </div>
                  </div>
                  <span className="tw-text-base tw-font-semibold tw-text-neutral-50">
                    Social Media Accounts
                  </span>
                </div>
                <ul className="tw-mt-6 tw-list-none tw-space-y-4 tw-pl-0 tw-text-base tw-leading-7 tw-text-gray-600">
                  <li className="tw-group tw-cursor-pointer tw-flex tw-items-center tw-text-sm tw-font-medium tw-text-neutral-50 hover:tw-text-neutral-400 tw-transition tw-duration-300 tw-ease-out tw-space-x-3">
                    <div className="tw-cursor-pointer tw-w-6 tw-h-6 group-hover:tw-scale-110 tw-transition tw-duration-300 tw-ease-out">
                      <FacebookIcon />
                    </div>
                    <span className="tw-flex tw-items-center">
                      facebook account
                    </span>
                  </li>
                  <li className="tw-group tw-cursor-pointer tw-flex tw-items-center tw-text-sm tw-font-medium tw-text-neutral-50 hover:tw-text-neutral-400 tw-transition tw-duration-300 tw-ease-out tw-space-x-3">
                    <div className="tw-cursor-pointer tw-flex-shrink-0 tw-h-6 tw-w-6 group-hover:tw-scale-110 tw-transition tw-duration-300 tw-ease-out">
                      <XIcon />
                    </div>
                    <span className="tw-flex tw-items-center">x account</span>
                  </li>
                  <li className="tw-group tw-cursor-pointer tw-flex tw-items-center tw-text-sm tw-font-medium tw-text-neutral-50 hover:tw-text-neutral-400 tw-transition tw-duration-300 tw-ease-out tw-space-x-3">
                    <div className="tw-cursor-pointer tw-flex-shrink-0 tw-h-6 tw-w-6 group-hover:tw-scale-110 tw-transition tw-duration-300 tw-ease-out">
                      <LinkedInIcon />
                    </div>
                    <span className="tw-flex tw-items-center">
                      linkedin account
                    </span>
                  </li>
                  <li className="tw-group tw-cursor-pointer tw-flex tw-items-center tw-text-sm tw-font-medium tw-text-neutral-50 hover:tw-text-neutral-400 tw-transition tw-duration-300 tw-ease-out tw-space-x-3">
                    <div className="tw-cursor-pointer tw-flex-shrink-0 tw-h-6 tw-w-6 group-hover:tw-scale-110 tw-transition tw-duration-300 tw-ease-out">
                      <InstagramIcon />
                    </div>
                    <span className="tw-flex tw-items-center">
                      instagram account
                    </span>
                  </li>
                  <li className="tw-group tw-cursor-pointer tw-flex tw-items-center tw-text-sm tw-font-medium tw-text-neutral-50 hover:tw-text-neutral-400 tw-transition tw-duration-300 tw-ease-out tw-space-x-3">
                    <div className="tw-cursor-pointer tw-flex-shrink-0 tw-h-6 tw-w-6 group-hover:tw-scale-110 tw-transition tw-duration-300 tw-ease-out">
                      <TikTokIcon />
                    </div>
                    <span className="tw-flex tw-items-center">tiktok</span>
                  </li>
                  <li className="tw-group tw-cursor-pointer tw-flex tw-items-center tw-text-sm tw-font-medium tw-text-neutral-50 hover:tw-text-neutral-400 tw-transition tw-duration-300 tw-ease-out tw-space-x-3">
                    <div className="tw-cursor-pointer tw-flex-shrink-0 tw-h-6 tw-w-6 group-hover:tw-scale-110 tw-transition tw-duration-300 tw-ease-out">
                      <GithubIcon />
                    </div>
                    <span className="tw-flex tw-items-center">github</span>
                  </li>
                  <li className="tw-group tw-cursor-pointer tw-flex tw-items-center tw-text-sm tw-font-medium tw-text-neutral-50 hover:tw-text-neutral-400 tw-transition tw-duration-300 tw-ease-out tw-space-x-3">
                    <div className="tw-cursor-pointer tw-flex-shrink-0 tw-h-6 tw-w-6 group-hover:tw-scale-110 tw-transition tw-duration-300 tw-ease-out">
                      <RedditIcon />
                    </div>
                    <span className="tw-flex tw-items-center">reddit</span>
                  </li>
                  <li className="tw-group tw-cursor-pointer tw-flex tw-items-center tw-text-sm tw-font-medium tw-text-neutral-50 hover:tw-text-neutral-400 tw-transition tw-duration-300 tw-ease-out tw-space-x-3">
                    <div className="tw-cursor-pointer tw-flex-shrink-0 tw-h-6 tw-w-6 group-hover:tw-scale-110 tw-transition tw-duration-300 tw-ease-out">
                      <WeiboIcon />
                    </div>
                    <span className="tw-flex tw-items-center">weibo</span>
                  </li>
                  <li className="tw-group tw-cursor-pointer tw-flex tw-items-center tw-text-sm tw-font-medium tw-text-neutral-50 hover:tw-text-neutral-400 tw-transition tw-duration-300 tw-ease-out tw-space-x-3">
                    <div className="tw-cursor-pointer tw-flex-shrink-0 tw-h-6 tw-w-6 group-hover:tw-scale-110 tw-transition tw-duration-300 tw-ease-out">
                      <SubstackIcon />
                    </div>
                    <span className="tw-flex tw-items-center">substack</span>
                  </li>
                  <li className="tw-group tw-cursor-pointer tw-flex tw-items-center tw-text-sm tw-font-medium tw-text-neutral-50 hover:tw-text-neutral-400 tw-transition tw-duration-300 tw-ease-out tw-space-x-3">
                    <div className="tw-cursor-pointer tw-flex-shrink-0 tw-h-6 tw-w-6 group-hover:tw-scale-110 tw-transition tw-duration-300 tw-ease-out">
                      <MediumIcon />
                    </div>
                    <span className="tw-flex tw-items-center">medium</span>
                  </li>
                  <li className="tw-group tw-cursor-pointer tw-flex tw-items-center tw-text-sm tw-font-medium tw-text-neutral-50 hover:tw-text-neutral-400 tw-transition tw-duration-300 tw-ease-out tw-space-x-3">
                    <div className="tw-cursor-pointer tw-flex-shrink-0 tw-h-6 tw-w-6 group-hover:tw-scale-110 tw-transition tw-duration-300 tw-ease-out">
                      <MirrorIcon />
                    </div>
                    <span className="tw-flex tw-items-center">mirror.xyz</span>
                  </li>
                  <li className="tw-group tw-cursor-pointer tw-flex tw-items-center tw-text-sm tw-font-medium tw-text-neutral-50 hover:tw-text-neutral-400 tw-transition tw-duration-300 tw-ease-out tw-space-x-3">
                    <div className="tw-cursor-pointer tw-flex-shrink-0 tw-h-6 tw-w-6 group-hover:tw-scale-110 tw-transition tw-duration-300 tw-ease-out">
                      <YoutubeIcon />
                    </div>
                    <span className="tw-flex tw-items-center">youtube</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="tw-grid tw-grid-cols-1 tw-gap-x-8 tw-gap-y-5 sm:tw-grid-cols-2">
              {/* Contact */}
              <div>
                <div className="tw-flex tw-items-center tw-space-x-4">
                  <div className="tw-flex tw-h-9 tw-w-9 tw-items-center tw-justify-center tw-rounded-lg tw-bg-neutral-700 tw-border tw-border-solid tw-border-neutral-600">
                    <div className="tw-flex tw-items-center tw-justify-center tw-flex-shrink-0 tw-h-5 tw-w-5 tw-text-neutral-50">
                      <svg
                        className="tw-flex-shrink-0 tw-h-5 tw-w-5 tw-text-neutral-50"
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
                    </div>
                  </div>
                  <span className="tw-text-base tw-font-semibold tw-text-neutral-50">
                    Contact
                  </span>
                </div>
                <ul className="tw-mt-6 tw-list-none tw-space-y-4 tw-pl-0 tw-text-base tw-leading-7 tw-text-gray-600">
                  <li className="tw-group tw-cursor-pointer tw-flex tw-items-center tw-text-sm tw-font-medium tw-text-neutral-50 hover:tw-text-neutral-400 tw-transition tw-duration-300 tw-ease-out tw-space-x-3">
                    <div className="tw-cursor-pointer tw-flex-shrink-0 tw-h-6 tw-w-6 group-hover:tw-scale-110 tw-transition tw-duration-300 tw-ease-out">
                      <DiscordIcon />
                    </div>
                    <span className="tw-flex tw-items-center">
                      discord account
                    </span>
                  </li>
                  <li className="tw-group tw-cursor-pointer tw-flex tw-items-center tw-text-sm tw-font-medium tw-text-neutral-50 hover:tw-text-neutral-400 tw-transition tw-duration-300 tw-ease-out tw-space-x-3">
                    <div className="tw-cursor-pointer tw-flex-shrink-0 tw-h-6 tw-w-6 group-hover:tw-scale-110 tw-transition tw-duration-300 tw-ease-out">
                      <TelegramIcon />
                    </div>
                    <span className="tw-flex tw-items-center">
                      telegram account
                    </span>
                  </li>
                  <li className="tw-group tw-cursor-pointer tw-flex tw-items-center tw-text-sm tw-font-medium tw-text-neutral-50 hover:tw-text-neutral-400 tw-transition tw-duration-300 tw-ease-out tw-space-x-3">
                    <div className="tw-cursor-pointer tw-flex-shrink-0 tw-h-6 tw-w-6 group-hover:tw-scale-110 tw-transition tw-duration-300 tw-ease-out">
                      <WeChatIcon />
                    </div>
                    <span className="tw-flex tw-items-center">
                      wechat account
                    </span>
                  </li>
                  <li className="tw-group tw-cursor-pointer tw-flex tw-items-center tw-text-sm tw-font-medium tw-text-neutral-50 hover:tw-text-neutral-400 tw-transition tw-duration-300 tw-ease-out tw-space-x-3">
                    <svg
                      className="tw-h-5 tw-w-6 tw-text-neutral-100 group-hover:tw-scale-110 tw-transition tw-duration-300 tw-ease-out"
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
                    <span className="tw-flex tw-items-center">
                      phone number
                    </span>
                  </li>
                  <li className="tw-group tw-cursor-pointer tw-flex tw-items-center tw-text-sm tw-font-medium tw-text-neutral-50 hover:tw-text-neutral-400 tw-transition tw-duration-300 tw-ease-out tw-space-x-3">
                    <svg
                      className="tw-h-5 tw-w-6 tw-text-neutral-100 group-hover:tw-scale-110 tw-transition tw-duration-300 tw-ease-out"
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

                    <span className="tw-flex tw-items-center">email</span>
                  </li>
                  <li className="tw-group tw-cursor-pointer tw-flex tw-items-center tw-text-sm tw-font-medium tw-text-neutral-50 hover:tw-text-neutral-400 tw-transition tw-duration-300 tw-ease-out tw-space-x-3">
                    <svg
                      className="tw-h-5 tw-w-6 tw-text-neutral-100 group-hover:tw-scale-110 tw-transition tw-duration-300 tw-ease-out"
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
                    <span className="tw-flex tw-items-center">website</span>
                  </li>
                </ul>
              </div>
              {/* Social Media Verification Posts */}
              <div>
                <div className="tw-flex tw-items-center tw-space-x-4">
                  <div className="tw-flex tw-h-9 tw-w-9 tw-items-center tw-justify-center tw-rounded-lg tw-bg-neutral-700 tw-border tw-border-solid tw-border-neutral-600">
                    <svg
                      className="tw-flex-shrink-0 tw-h-5 tw-w-5 tw-text-neutral-50"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M11 4H7.8C6.11984 4 5.27976 4 4.63803 4.32698C4.07354 4.6146 3.6146 5.07354 3.32698 5.63803C3 6.27976 3 7.11984 3 8.8V16.2C3 17.8802 3 18.7202 3.32698 19.362C3.6146 19.9265 4.07354 20.3854 4.63803 20.673C5.27976 21 6.11984 21 7.8 21H15.2C16.8802 21 17.7202 21 18.362 20.673C18.9265 20.3854 19.3854 19.9265 19.673 19.362C20 18.7202 20 17.8802 20 16.2V13M13 17H7M15 13H7M20.1213 3.87868C21.2929 5.05025 21.2929 6.94975 20.1213 8.12132C18.9497 9.29289 17.0503 9.29289 15.8787 8.12132C14.7071 6.94975 14.7071 5.05025 15.8787 3.87868C17.0503 2.70711 18.9497 2.70711 20.1213 3.87868Z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <span className="tw-text-base tw-font-semibold tw-text-neutral-50">
                    Social Media Verification Posts
                  </span>
                </div>
                <ul className="tw-mt-6 tw-list-none tw-space-y-4 tw-pl-0 tw-text-base tw-leading-7 tw-text-gray-600">
                  <li className="tw-flex tw-items-center tw-text-sm tw-font-medium tw-text-neutral-50 tw-group tw-cursor-pointer  hover:tw-text-neutral-300 tw-transition tw-duration-300 tw-ease-out tw-space-x-3">
                    <svg
                      className="tw-h-5 tw-w-6 tw-text-neutral-100 group-hover:tw-scale-110 tw-transition tw-duration-300 tw-ease-out"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M9.99999 13C10.4294 13.5741 10.9773 14.0491 11.6065 14.3929C12.2357 14.7367 12.9315 14.9411 13.6466 14.9923C14.3618 15.0435 15.0796 14.9403 15.7513 14.6897C16.4231 14.4392 17.0331 14.047 17.54 13.54L20.54 10.54C21.4508 9.59695 21.9547 8.33394 21.9434 7.02296C21.932 5.71198 21.4061 4.45791 20.4791 3.53087C19.552 2.60383 18.298 2.07799 16.987 2.0666C15.676 2.0552 14.413 2.55918 13.47 3.46997L11.75 5.17997M14 11C13.5705 10.4258 13.0226 9.95078 12.3934 9.60703C11.7642 9.26327 11.0685 9.05885 10.3533 9.00763C9.63819 8.95641 8.9204 9.0596 8.24864 9.31018C7.57688 9.56077 6.96687 9.9529 6.45999 10.46L3.45999 13.46C2.5492 14.403 2.04522 15.666 2.05662 16.977C2.06801 18.288 2.59385 19.542 3.52089 20.4691C4.44793 21.3961 5.702 21.9219 7.01298 21.9333C8.32396 21.9447 9.58697 21.4408 10.53 20.53L12.24 18.82"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <div className="tw-inline-flex tw-items-center">
                      <span>twitter.com/status/12454658454445555</span>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="tw-col-span-1 tw-ml-auto">
            <ul className="tw-list-disc tw-text-neutral-500 tw-text-sm tw-font-normal tw-space-y-1">
              <li>All statements are optional.</li>
              <li>All statements are fully and permanently public.</li>
              <li>
                Seize does not connect to social media accounts or verify posts.
              </li>
              <li>The community will rate the accuracy of statements.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
