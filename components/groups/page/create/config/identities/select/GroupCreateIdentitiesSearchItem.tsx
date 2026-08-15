import type { CommunityMemberMinimal } from "@/entities/IProfile";
import { getScaledImageUri, ImageScale } from "@/helpers/image.helpers";
import Image from "next/image";

export default function GroupCreateIdentitiesSearchItem({
  item,
  selected,
  onProfileSelect,
}: {
  readonly item: CommunityMemberMinimal;
  readonly selected: boolean;
  readonly onProfileSelect: (newV: CommunityMemberMinimal) => void;
}) {
  const title = item.handle ?? item.display;
  const onProfileClick = () => onProfileSelect(item);

  return (
    <li>
      <button
        type="button"
        aria-pressed={selected}
        className="tw-relative tw-flex tw-min-h-10 tw-w-full tw-cursor-pointer tw-select-none tw-items-center tw-justify-between tw-rounded-md tw-border-0 tw-bg-transparent tw-px-2.5 tw-py-2 tw-text-left tw-text-white tw-transition-colors tw-duration-200 focus-visible:tw-bg-iron-800 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:-tw-outline-offset-2 focus-visible:tw-outline-primary-400 desktop-hover:hover:tw-bg-iron-800"
        onClick={onProfileClick}
      >
        <div className="tw-flex tw-w-full tw-min-w-0 tw-items-center tw-justify-between tw-gap-2.5">
          <div className="tw-flex tw-min-w-0 tw-flex-1 tw-items-center tw-gap-2.5">
            <div className="tw-flex tw-size-6 tw-flex-shrink-0 tw-items-center tw-justify-center tw-overflow-hidden tw-rounded-md tw-bg-iron-900 tw-text-iron-500">
              {item.pfp ? (
                <Image
                  src={getScaledImageUri(item.pfp, ImageScale.W_AUTO_H_50)}
                  alt=""
                  width={24}
                  height={24}
                  unoptimized
                  className="tw-h-full tw-w-full tw-bg-transparent tw-object-cover"
                />
              ) : (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  aria-hidden="true"
                  className="tw-size-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.5 20.12a7.5 7.5 0 0 1 15 0A17.93 17.93 0 0 1 12 21.75a17.93 17.93 0 0 1-7.5-1.63Z"
                  />
                </svg>
              )}
            </div>
            <div className="tw-min-w-0 tw-flex-1">
              <p className="tw-mb-0 tw-mt-0 tw-truncate tw-whitespace-nowrap tw-text-sm tw-font-medium tw-leading-5 tw-text-iron-50">
                {title}
              </p>
              {item.display !== title && (
                <p className="tw-mb-0 tw-mt-0.5 tw-truncate tw-whitespace-nowrap tw-text-xs tw-font-medium tw-text-iron-400">
                  {item.display}
                </p>
              )}
            </div>
          </div>
          {selected && (
            <svg
              className="tw-size-4 tw-flex-shrink-0 tw-text-primary-300"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M20 6L9 17L4 12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </div>
      </button>
    </li>
  );
}
