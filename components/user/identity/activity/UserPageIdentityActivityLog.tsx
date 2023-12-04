import {  useState } from "react";
import { IProfileAndConsolidations, PROFILE_ACTIVITY_TYPE } from "../../../../entities/IProfile";
import DiscordIcon from "../../utils/icons/DiscordIcon";
import EthereumIcon from "../../utils/icons/EthereumIcon";
import XIcon from "../../utils/icons/XIcon";
import UserPageIdentityActivityLogHeader from "./UserPageIdentityActivityLogHeader";
import UserPageIdentityActivityLogFilter from "./filter/UserPageIdentityActivityLogFilter";



export default function UserPageIdentityActivityLog({
  profile,
}: {
  profile: IProfileAndConsolidations;
}) {
  const [selectedFilters, setSelectedFilters] = useState<
    PROFILE_ACTIVITY_TYPE[]
  >([]);

  const onFilter = (filter: PROFILE_ACTIVITY_TYPE) => {
    if (selectedFilters.includes(filter)) {
      setSelectedFilters(selectedFilters.filter((f) => f !== filter));
    } else {
      setSelectedFilters([...selectedFilters, filter]);
    }
  };

  return (
    <div className="tw-bg-neutral-900 tw-border tw-border-white/5 tw-border-solid tw-rounded-xl">
      <UserPageIdentityActivityLogHeader profile={profile} />
      <div className="tw-max-h-[28rem] tw-transform-gpu tw-scroll-py-3 tw-overflow-y-auto">
        <UserPageIdentityActivityLogFilter
          selected={selectedFilters}
          setSelected={onFilter}
        />

        <ul
          role="list"
          className="tw-mt-4 tw-px-8 tw-list-none tw-divide-y tw-divide-white/10 tw-divide-solid tw-divide-x-0"
        >
          {/*  Changed handle */}
          <li className="tw-py-4">
            <div className="tw-flex tw-items-center tw-justify-between tw-gap-x-3">
              <div className="tw-inline-flex tw-items-center tw-space-x-2">
                <svg
                  className="tw-flex-shrink-0 tw-h-5 tw-w-5 tw-text-neutral-100"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M16 7.99999V13C16 13.7956 16.3161 14.5587 16.8787 15.1213C17.4413 15.6839 18.2043 16 19 16C19.7956 16 20.5587 15.6839 21.1213 15.1213C21.6839 14.5587 22 13.7956 22 13V12C21.9999 9.74302 21.2362 7.55247 19.8333 5.78452C18.4303 4.01658 16.4705 2.77521 14.2726 2.26229C12.0747 1.74936 9.76793 1.99503 7.72734 2.95936C5.68676 3.92368 4.03239 5.54995 3.03325 7.57371C2.03411 9.59748 1.74896 11.8997 2.22416 14.1061C2.69936 16.3125 3.90697 18.2932 5.65062 19.7263C7.39428 21.1593 9.57143 21.9603 11.8281 21.9991C14.0847 22.0379 16.2881 21.3122 18.08 19.94M16 12C16 14.2091 14.2091 16 12 16C9.79086 16 8 14.2091 8 12C8 9.79085 9.79086 7.99999 12 7.99999C14.2091 7.99999 16 9.79085 16 12Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <div className="tw-inline-flex tw-space-x-1.5">
                  <span className="tw-text-sm tw-text-neutral-400 tw-font-semibold">
                    changed
                  </span>
                  <span className="tw-text-sm tw-text-neutral-400 tw-font-medium">
                    handle
                  </span>
                  <span className="tw-text-sm tw-font-semibold tw-text-neutral-100">
                    simo.eth
                  </span>
                  <svg
                    className="tw-flex-shrink-0 tw-h-5 tw-w-5 tw-text-neutral-400"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M4 12H20M20 12L14 6M20 12L14 18"
                      stroke="currentcOLOR"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>

                  <span className="tw-text-sm tw-font-semibold tw-text-neutral-100">
                    simoiscool.eth
                  </span>
                </div>
              </div>
              <span className="tw-flex-none tw-text-[0.8125rem] tw-leading-5 tw-text-neutral-500">
                <span>1h</span>
                <span className="tw-ml-1">ago</span>
              </span>
            </div>
          </li>

          {/*  Changed primary wallet */}
          <li className="tw-py-4">
            <div className="tw-flex tw-items-center tw-justify-between tw-gap-x-3">
              <div className="tw-inline-flex tw-items-center tw-space-x-2">
                <div className="tw-flex tw-items-center tw-flex-shrink-0 tw-h-5 tw-w-5 tw-text-neutral-100">
                  <EthereumIcon />
                </div>
                <div className="tw-inline-flex tw-space-x-1.5">
                  <span className="tw-text-sm tw-text-neutral-400 tw-font-semibold">
                    changed
                  </span>
                  <span className="tw-text-sm tw-text-neutral-400 tw-font-medium">
                    primary wallet
                  </span>
                  <span className="tw-text-sm tw-font-semibold tw-text-neutral-100">
                    simo.eth
                  </span>
                  <svg
                    className="tw-h-5 tw-w-5 tw-text-neutral-400"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M4 12H20M20 12L14 6M20 12L14 18"
                      stroke="currentcOLOR"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span className="tw-truncate tw-max-w-[12rem] tw-text-sm tw-font-semibold tw-text-neutral-100">
                    39529...f3a2
                  </span>
                </div>
              </div>
              <span className="tw-flex-none tw-text-[0.8125rem] tw-leading-5 tw-text-neutral-500">
                <span>1h</span>
                <span className="tw-ml-1">ago</span>
              </span>
            </div>
          </li>

          {/*  Deleted/Adding contact */}
          <li className="tw-py-4">
            <div className="tw-flex tw-items-center tw-justify-between tw-gap-x-3">
              <div className="tw-inline-flex tw-items-center tw-space-x-2">
                <svg
                  className="tw-flex-shrink-0 tw-h-5 tw-w-5 tw-text-neutral-100"
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
                <div className="tw-inline-flex tw-space-x-1.5">
                  <span className="tw-text-sm tw-text-neutral-400 tw-font-semibold">
                    deleted
                  </span>
                  <span className="tw-text-sm tw-text-neutral-400 tw-font-medium">
                    contact
                  </span>
                  <div className="tw-flex tw-items-center tw-flex-shrink-0 tw-h-5 tw-w-5 tw-text-neutral-100">
                    <DiscordIcon />
                  </div>
                  {/*    <div className="tw-flex tw-items-center tw-flex-shrink-0 tw-h-5 tw-w-5 tw-text-neutral-100">
                    <TelegramIcon />
                  </div>
                  <div className="tw-flex tw-items-center tw-flex-shrink-0 tw-h-5 tw-w-5 tw-text-neutral-100">
                    <WeChatIcon />
                  </div>
                  <div className="tw-flex tw-items-center tw-flex-shrink-0 tw-h-5 tw-w-5 tw-text-neutral-100">
                    <WeChatIcon />
                  </div>
                  <svg
                    className="tw-flex-shrink-0 tw-h-5 tw-w-5 tw-text-neutral-100"
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
                  <svg
                    className="tw-flex-shrink-0 tw-h-5 tw-w-5 tw-text-neutral-100"
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
                  <svg
                    className="tw-flex-shrink-0 tw-h-5 tw-w-5 tw-text-neutral-100"
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
                  </svg> */}
                  <span className="tw-text-sm tw-font-semibold tw-text-neutral-100">
                    contact name
                  </span>
                </div>
              </div>
              <span className="tw-flex-none tw-text-[0.8125rem] tw-leading-5 tw-text-neutral-500">
                <span>1h</span>
                <span className="tw-ml-1">ago</span>
              </span>
            </div>
          </li>

          {/*  Subtracked rating */}
          <li className="tw-py-4">
            <div className="tw-flex tw-items-center tw-justify-between tw-gap-x-3">
              <div className="tw-inline-flex tw-items-center tw-space-x-2">
                <svg
                  className="tw-flex-shrink-0 tw-h-5 tw-w-5 tw-text-neutral-100"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 15.5H7.5C6.10444 15.5 5.40665 15.5 4.83886 15.6722C3.56045 16.06 2.56004 17.0605 2.17224 18.3389C2 18.9067 2 19.6044 2 21M16 18L18 20L22 16M14.5 7.5C14.5 9.98528 12.4853 12 10 12C7.51472 12 5.5 9.98528 5.5 7.5C5.5 5.01472 7.51472 3 10 3C12.4853 3 14.5 5.01472 14.5 7.5Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <div className="tw-inline-flex tw-space-x-1.5">
                  <span className="tw-text-sm tw-text-neutral-400 tw-font-semibold">
                    subtracked
                  </span>
                  <span className="tw-text-sm tw-text-neutral-400 tw-font-medium">
                    rating from
                  </span>
                  <span className="tw-text-sm tw-font-semibold tw-text-neutral-100">
                    ThisIsFakeUser
                  </span>
                  <span className="tw-text-sm tw-font-semibold tw-text-neutral-100">
                    5,556
                  </span>
                </div>
              </div>
              <span className="tw-flex-none tw-text-[0.8125rem] tw-leading-5 tw-text-neutral-500">
                <span>1h</span>
                <span className="tw-ml-1">ago</span>
              </span>
            </div>
          </li>

          {/*  CIC ratings */}
          <li className="tw-py-4">
            <div className="tw-flex tw-items-center tw-justify-between tw-gap-x-3">
              <div className="tw-inline-flex tw-items-center tw-space-x-2">
                <svg
                  className="tw-flex-shrink-0 tw-h-5 tw-w-5 tw-text-neutral-100"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 15.5H7.5C6.10444 15.5 5.40665 15.5 4.83886 15.6722C3.56045 16.06 2.56004 17.0605 2.17224 18.3389C2 18.9067 2 19.6044 2 21M16 18L18 20L22 16M14.5 7.5C14.5 9.98528 12.4853 12 10 12C7.51472 12 5.5 9.98528 5.5 7.5C5.5 5.01472 7.51472 3 10 3C12.4853 3 14.5 5.01472 14.5 7.5Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <div className="tw-inline-flex tw-space-x-1.5">
                  <span className="tw-text-sm tw-text-neutral-400 tw-font-semibold">
                    rated
                  </span>
                  <span className="tw-text-sm tw-text-neutral-400 tw-font-medium">
                    user
                  </span>
                  <span className="tw-text-sm tw-font-semibold tw-text-neutral-100">
                    SpammyAccount
                  </span>
                  <span className="tw-text-sm tw-font-semibold tw-text-red">
                    -5,556
                    <span className="tw-ml-0.5 tw-text-[0.625rem] tw-leading-3 tw-text-neutral-400">
                      (5,556)
                    </span>
                  </span>
                  <span className="tw-text-sm tw-font-semibold tw-text-green">
                    +5,556
                    <span className="tw-ml-0.5 tw-text-[0.625rem] tw-leading-3 tw-text-neutral-400">
                      (5,556)
                    </span>
                  </span>
                </div>
              </div>
              <span className="tw-flex-none tw-text-[0.8125rem] tw-leading-5 tw-text-neutral-500">
                <span>1h</span>
                <span className="tw-ml-1">ago</span>
              </span>
            </div>
          </li>

          {/*  Deleted/Added social media account */}
          <li className="tw-py-4">
            <div className="tw-flex tw-items-center tw-justify-between tw-gap-x-3">
              <div className="tw-inline-flex tw-items-center tw-space-x-2">
                <svg
                  className="tw-flex-shrink-0 tw-h-5 tw-w-5 tw-text-neutral-100"
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
                <div className="tw-inline-flex tw-space-x-1.5">
                  <span className="tw-text-sm tw-text-neutral-400 tw-font-semibold">
                    added
                  </span>
                  <span className="tw-whitespace-nowrap tw-text-sm tw-text-neutral-400 tw-font-medium">
                    social media account
                  </span>
                  <div className="tw-flex tw-items-center tw-flex-shrink-0 tw-h-5 tw-w-5 tw-text-neutral-100">
                    <XIcon />
                  </div>
                  {/*   <div className="tw-flex tw-items-center tw-flex-shrink-0 tw-h-5 tw-w-5 tw-text-neutral-100">
                    <FacebookIcon />
                  </div>
                  <div className="tw-flex tw-items-center tw-flex-shrink-0 tw-h-5 tw-w-5 tw-text-neutral-100">
                    <LinkedInIcon />
                  </div>
                  <div className="tw-flex tw-items-center tw-flex-shrink-0 tw-h-5 tw-w-5 tw-text-neutral-100">
                    <InstagramIcon />
                  </div>
                  <div className="tw-flex tw-items-center tw-flex-shrink-0 tw-h-5 tw-w-5 tw-text-neutral-100">
                    <TikTokIcon />
                  </div>
                  <div className="tw-flex tw-items-center tw-flex-shrink-0 tw-h-5 tw-w-5 tw-text-neutral-100">
                    <GithubIcon />
                  </div>
                  <div className="tw-flex tw-items-center tw-flex-shrink-0 tw-h-5 tw-w-5 tw-text-neutral-100">
                    <RedditIcon />
                  </div>
                  <div className="tw-flex tw-items-center tw-flex-shrink-0 tw-h-5 tw-w-5 tw-text-neutral-100">
                    <WeiboIcon />
                  </div>
                  <div className="tw-flex tw-items-center tw-flex-shrink-0 tw-h-5 tw-w-5 tw-text-neutral-100">
                    <SubstackIcon />
                  </div>
                  <div className="tw-flex tw-items-center tw-flex-shrink-0 tw-h-5 tw-w-5 tw-text-neutral-100">
                    <MediumIcon />
                  </div>
                  <div className="tw-flex tw-items-center tw-flex-shrink-0 tw-h-5 tw-w-5 tw-text-neutral-100">
                    <MirrorIcon />
                  </div>
                  <div className="tw-flex tw-items-center tw-flex-shrink-0 tw-h-5 tw-w-5 tw-text-neutral-100">
                    <YoutubeIcon />
                  </div> */}
                  <span className="tw-text-sm tw-font-semibold tw-text-neutral-100">
                    simokas
                  </span>
                </div>
              </div>
              <span className="tw-flex-none tw-text-[0.8125rem] tw-leading-5 tw-text-neutral-500">
                <span>1h</span>
                <span className="tw-ml-1">ago</span>
              </span>
            </div>
          </li>

          {/*  Deleted/Added social media v post */}
          <li className="tw-py-4">
            <div className="tw-flex tw-items-center tw-justify-between tw-gap-x-3">
              <div className="tw-inline-flex tw-items-center tw-space-x-2">
                <svg
                  className="tw-flex-shrink-0 tw-h-5 tw-w-5 tw-text-neutral-100"
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
                <div className="tw-inline-flex tw-space-x-1.5">
                  <span className="tw-text-sm tw-text-neutral-400 tw-font-semibold">
                    added
                  </span>
                  <span className="tw-whitespace-nowrap tw-text-sm tw-text-neutral-400 tw-font-medium">
                    social media verification post
                  </span>

                  <span className="tw-truncate tw-max-w-[12rem] tw-text-sm tw-font-semibold tw-text-neutral-100">
                    twitter.com/status/12454658454445555
                  </span>
                </div>
              </div>
              <span className="tw-flex-none tw-text-[0.8125rem] tw-leading-5 tw-text-neutral-500">
                <span>1h</span>
                <span className="tw-ml-1">ago</span>
              </span>
            </div>
          </li>
        </ul>
      </div>
    </div>
  );
}
