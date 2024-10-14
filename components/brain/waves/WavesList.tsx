import Link from "next/link";
import { ApiWave } from "../../../generated/models/ApiWave";
import { getScaledImageUri, ImageScale } from "../../../helpers/image.helpers";
import { useContext } from "react";
import { AuthContext } from "../../auth/Auth";

export enum WavesListType {
  MY_WAVES = "MY_WAVES",
  FOLLOWING = "FOLLOWING",
  POPULAR = "POPULAR",
}

export default function WavesList({
  waves,
  type,
}: {
  readonly waves: ApiWave[];
  readonly type: WavesListType;
}) {
  const { connectedProfile } = useContext(AuthContext);
  const TITLE: Record<WavesListType, string> = {
    [WavesListType.MY_WAVES]: "My Waves",
    [WavesListType.FOLLOWING]: "Following",
    [WavesListType.POPULAR]: "Popular Waves",
  };

  const SVG_ICONS: Record<WavesListType, JSX.Element> = {
    [WavesListType.MY_WAVES]: (
      <svg
        className="tw-flex-shrink-0 tw-inline tw-h-5 tw-w-5 tw-text-indigo-300"
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
    ),
    [WavesListType.FOLLOWING]: (
      <svg
        className="tw-flex-shrink-0 tw-inline tw-h-5 tw-w-5 tw-text-indigo-300"
        width="48"
        height="48"
        viewBox="0 0 48 48"
        fill="none"
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g clipPath="url(#clip0_9330_1241)">
          <path
            d="M36 2V22M26 12H46"
            stroke="currentColor"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M32 44.9997C32 45.4729 31.5221 45.8569 30.9333 45.8569C29.5701 45.8569 28.6827 46.2134 27.6565 46.6266C26.5557 47.0697 25.3088 47.5711 23.4667 47.5711C21.6149 47.5711 20.3627 47.068 19.2576 46.624C18.2336 46.2126 17.3493 45.8569 16 45.8569C14.6507 45.8569 13.7664 46.2126 12.7424 46.624C11.6373 47.068 10.3851 47.5711 8.53333 47.5711C6.6912 47.5711 5.44427 47.0697 4.34347 46.6266C3.31733 46.2134 2.42987 45.8569 1.06667 45.8569C0.477867 45.8569 0 45.4729 0 44.9997C0 44.5266 0.477867 44.1426 1.06667 44.1426C2.9344 44.1426 4.19093 44.6483 5.2992 45.094C6.3168 45.5029 7.19573 45.8569 8.53333 45.8569C9.8816 45.8569 10.7648 45.5011 11.7888 45.0906C12.8939 44.6457 14.1472 44.1426 16 44.1426C17.8528 44.1426 19.1061 44.6457 20.2112 45.0906C21.2352 45.5011 22.1184 45.8569 23.4667 45.8569C24.8043 45.8569 25.6832 45.5029 26.7008 45.094C27.8091 44.6483 29.0656 44.1426 30.9333 44.1426C31.5221 44.1426 32 44.5266 32 44.9997Z"
            fill="currentColor"
            stroke="currentColor"
          />
          <path
            d="M32 39.5711C32 40.2019 31.5221 40.7139 30.9333 40.7139C29.5701 40.7139 28.6827 41.1894 27.6565 41.7402C26.5557 42.3311 25.3088 42.9997 23.4667 42.9997C21.6149 42.9997 20.3627 42.3288 19.2576 41.7368C18.2336 41.1882 17.3493 40.7139 16 40.7139C14.6507 40.7139 13.7664 41.1882 12.7424 41.7368C11.6373 42.3288 10.3851 42.9997 8.53333 42.9997C6.6912 42.9997 5.44427 42.3311 4.34347 41.7402C3.31733 41.1894 2.42987 40.7139 1.06667 40.7139C0.477867 40.7139 0 40.2019 0 39.5711C0 38.9402 0.477867 38.4282 1.06667 38.4282C2.9344 38.4282 4.19093 39.1025 5.2992 39.6968C6.3168 40.2419 7.19573 40.7139 8.53333 40.7139C9.8816 40.7139 10.7648 40.2397 11.7888 39.6922C12.8939 39.0991 14.1472 38.4282 16 38.4282C17.8528 38.4282 19.1061 39.0991 20.2112 39.6922C21.2352 40.2397 22.1184 40.7139 23.4667 40.7139C24.8043 40.7139 25.6832 40.2419 26.7008 39.6968C27.8091 39.1025 29.0656 38.4282 30.9333 38.4282C31.5221 38.4282 32 38.9402 32 39.5711Z"
            fill="currentColor"
            stroke="currentColor"
          />
          <path
            d="M0 34.2474C0 33.6863 0.477867 33.2309 1.06667 33.2309C4.89387 33.2309 6.336 30.6541 8.16107 27.3912C10.2528 23.6525 12.8555 19 20.2667 19C23.9147 19 26.6667 21.1844 26.6667 24.0825C26.6667 26.4021 24.7253 28.1484 23.4667 28.1484C22.8779 28.1484 22.4 27.6931 22.4 27.132C22.4 26.8433 22.3307 26.4346 21.7301 26.2212C20.9323 25.9386 19.8059 26.1947 19.2736 26.7802C18.0373 28.1413 17.7963 30.3898 18.688 32.248C19.6032 34.1569 21.4912 35.2527 23.8677 35.2527C25.0272 35.2527 25.8421 34.8492 26.7851 34.3816C27.872 33.8428 29.1061 33.2309 30.9333 33.2309C31.5221 33.2309 32 33.6863 32 34.2474C32 34.8085 31.5221 35.2639 30.9333 35.2639C29.6267 35.2639 28.7659 35.6908 27.7685 36.1849C26.7275 36.7012 25.5477 37.2857 23.8667 37.2857C20.6197 37.2857 18.0245 35.7579 16.7467 33.0927C15.5008 30.4945 15.8677 27.4227 17.6597 25.4497C18.7733 24.2248 20.8448 23.7379 22.4747 24.3163C23.1584 24.5592 23.696 24.9689 24.0501 25.4954C24.3104 25.1508 24.5333 24.6741 24.5333 24.0825C24.5333 22.3443 22.6987 21.033 20.2667 21.033C14.1355 21.033 12.1483 24.5856 10.0437 28.3477C8.14187 31.7479 6.17493 35.2639 1.06667 35.2639C0.477867 35.2639 0 34.8085 0 34.2474Z"
            fill="currentColor"
            stroke="currentColor"
          />
        </g>
        <defs>
          <clipPath id="clip0_9330_1241">
            <rect width="48" height="48" fill="white" />
          </clipPath>
        </defs>
      </svg>
    ),
    [WavesListType.POPULAR]: (
      <svg
        className="tw-flex-shrink-0 tw-inline tw-h-5 tw-w-5 tw-text-indigo-300"
        viewBox="0 0 48 48"
        fill="none"
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M46.5 40.5C46.5 41.328 45.828 42 45 42C43.083 42 41.835 42.624 40.392 43.347C38.844 44.1225 37.0905 45 34.5 45C31.896 45 30.135 44.1195 28.581 43.3425C27.141 42.6225 25.8975 42 24 42C22.1025 42 20.859 42.6225 19.419 43.3425C17.865 44.1195 16.104 45 13.5 45C10.9095 45 9.156 44.1225 7.608 43.347C6.165 42.624 4.917 42 3 42C2.172 42 1.5 41.328 1.5 40.5C1.5 39.672 2.172 39 3 39C5.6265 39 7.3935 39.885 8.952 40.665C10.383 41.3805 11.619 42 13.5 42C15.396 42 16.638 41.3775 18.078 40.659C19.632 39.8805 21.3945 39 24 39C26.6055 39 28.368 39.8805 29.922 40.659C31.362 41.3775 32.604 42 34.5 42C36.381 42 37.617 41.3805 39.048 40.665C40.6065 39.885 42.3735 39 45 39C45.828 39 46.5 39.672 46.5 40.5Z"
          fill="currentColor"
        />
        <path
          d="M46.5 33C46.5 33.828 45.828 34.5 45 34.5C43.083 34.5 41.835 35.124 40.392 35.847C38.844 36.6225 37.0905 37.5 34.5 37.5C31.896 37.5 30.135 36.6195 28.581 35.8425C27.141 35.1225 25.8975 34.5 24 34.5C22.1025 34.5 20.859 35.1225 19.419 35.8425C17.865 36.6195 16.104 37.5 13.5 37.5C10.9095 37.5 9.156 36.6225 7.608 35.847C6.165 35.124 4.917 34.5 3 34.5C2.172 34.5 1.5 33.828 1.5 33C1.5 32.172 2.172 31.5 3 31.5C5.6265 31.5 7.3935 32.385 8.952 33.165C10.383 33.8805 11.619 34.5 13.5 34.5C15.396 34.5 16.638 33.8775 18.078 33.159C19.632 32.3805 21.3945 31.5 24 31.5C26.6055 31.5 28.368 32.3805 29.922 33.159C31.362 33.8775 32.604 34.5 34.5 34.5C36.381 34.5 37.617 33.8805 39.048 33.165C40.6065 32.385 42.3735 31.5 45 31.5C45.828 31.5 46.5 32.172 46.5 33Z"
          fill="currentColor"
        />
        <path
          d="M1.5 25.5C1.5 24.672 2.172 24 3 24C8.382 24 10.41 20.1975 12.9765 15.3825C15.918 9.8655 19.578 3 30 3C35.13 3 39 6.2235 39 10.5C39 13.923 36.27 16.5 34.5 16.5C33.672 16.5 33 15.828 33 15C33 14.574 32.9025 13.971 32.058 13.656C30.936 13.239 29.352 13.617 28.6035 14.481C26.865 16.4895 26.526 19.8075 27.78 22.5495C29.067 25.3665 31.722 26.9835 35.064 26.9835C36.6945 26.9835 37.8405 26.388 39.1665 25.698C40.695 24.903 42.4305 24 45 24C45.828 24 46.5 24.672 46.5 25.5C46.5 26.328 45.828 27 45 27C43.1625 27 41.952 27.63 40.5495 28.359C39.0855 29.121 37.4265 29.9835 35.0625 29.9835C30.4965 29.9835 26.847 27.729 25.05 23.796C23.298 19.962 23.814 15.429 26.334 12.5175C27.9 10.71 30.813 9.9915 33.105 10.845C34.0665 11.2035 34.8225 11.808 35.3205 12.585C35.6865 12.0765 36 11.373 36 10.5C36 7.935 33.42 6 30 6C21.378 6 18.5835 11.2425 15.624 16.794C12.9495 21.8115 10.1835 27 3 27C2.172 27 1.5 26.328 1.5 25.5Z"
          fill="currentColor"
        />
      </svg>
    ),
  };

  const getShowMoreLink = () => {
    if (type === WavesListType.MY_WAVES && connectedProfile?.profile?.handle) {
      return `/waves?identity=${connectedProfile.profile.handle}`;
    }
    return "/waves";
  };

  return (
    <div className="tw-mt-4">
      <div className="tw-rounded-xl tw-bg-gradient-to-b tw-p-[1px] tw-from-iron-700 tw-to-iron-800">
        <div className="tw-h-full tw-bg-iron-950 tw-rounded-xl tw-py-5 tw-px-5">
          <div className="tw-flex tw-items-center tw-gap-x-2">
            <div className="tw-flex tw-items-center tw-gap-x-3">
              <div className="tw-h-9 tw-w-9 tw-rounded-xl tw-bg-gradient-to-b tw-p-[1px] tw-from-iron-800 tw-via-indigo-300/40 tw-to-iron-800">
                <div className="tw-h-full tw-bg-iron-950 tw-rounded-xl tw-flex tw-items-center tw-justify-center">
                  {SVG_ICONS[type]}
                </div>
              </div>

              <p className="tw-mb-0 tw-text-lg tw-font-semibold tw-text-iron-50 tw-tracking-tight">
                {TITLE[type]}
              </p>
            </div>
          </div>
          <div className="tw-mt-4 tw-flex tw-flex-col tw-space-y-4">
            {waves.map((wave) => (
              <Link
                key={wave.id}
                href={`/waves/${wave.id}`}
                className="tw-no-underline tw-flex tw-items-center tw-text-white tw-font-medium tw-text-sm hover:tw-text-iron-400 tw-transition tw-duration-300 tw-ease-out"
              >
                {wave.picture && (
                  <img
                    src={getScaledImageUri(
                      wave.picture,
                      ImageScale.W_100_H_AUTO
                    )}
                    alt="#"
                    className="tw-mr-3 tw-flex-shrink-0 tw-object-contain tw-h-7 tw-w-7 tw-rounded-full tw-bg-iron-900 tw-ring-1  tw-ring-white/10"
                  />
                )}
                <span>{wave.name}</span>
              </Link>
            ))}
          </div>
          {waves.length >= 10 && (
            <div className="tw-mt-2 tw-text-right -tw-mb-2">
              <Link
                href={getShowMoreLink()}
                className="tw-group -tw-mr-1 tw-no-underline tw-inline-flex tw-bg-transparent tw-border-none tw-text-primary-400 hover:tw-text-primary-300 tw-text-xs tw-font-medium tw-cursor-pointer tw-transition tw-duration-300 tw-ease-out tw-items-center group"
              >
                <span className="group-hover:tw-translate-x-[-4px] tw-transition-transform tw-duration-300 tw-ease-out">
                  Show more
                </span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                  className="tw-w-4 tw-h-4 tw-ml-1 tw-opacity-0 group-hover:tw-opacity-100 tw-transition-opacity tw-duration-300 tw-ease-out"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m8.25 4.5 7.5 7.5-7.5 7.5"
                  />
                </svg>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
