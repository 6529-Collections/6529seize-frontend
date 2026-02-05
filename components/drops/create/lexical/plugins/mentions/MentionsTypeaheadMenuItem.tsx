import { getScaledImageUri, ImageScale } from "@/helpers/image.helpers";
import Image from "next/image";
export default function MentionsTypeaheadMenuItem({
  index,
  isSelected,
  onClick,
  onMouseEnter,
  handle,
  display,
  picture,
  setRefElement,
}: {
  readonly index: number;
  readonly isSelected: boolean;
  readonly onClick: () => void;
  readonly onMouseEnter: () => void;
  readonly handle: string;
  readonly display: string | null;
  readonly picture: string | null;
  readonly setRefElement: (element: HTMLElement | null) => void;
}) {
  return (
    <li
      className="tw-h-full"
      ref={setRefElement}
      id={"typeahead-item-" + index}
    >
      <button
        onMouseEnter={onMouseEnter}
        onClick={onClick}
        type="button"
        className={`${
          isSelected ? "tw-bg-iron-700" : "tw-bg-transparent"
        } tw-relative tw-flex tw-h-full tw-w-full tw-cursor-pointer tw-select-none tw-items-center tw-justify-between tw-rounded-lg tw-border-none tw-px-2 tw-py-2 tw-text-left tw-text-white tw-transition tw-duration-300 tw-ease-out focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-primary-400`}
      >
        <div className="tw-inline-flex tw-w-full tw-items-center tw-justify-between">
          <div className="tw-inline-flex tw-items-center tw-space-x-2">
            {picture && (
              <div className="tw-h-6 tw-w-6 tw-overflow-hidden tw-rounded-md tw-bg-iron-900 tw-ring-1 tw-ring-white/10">
                <div className="tw-h-full tw-w-full tw-max-w-full">
                  <div className="tw-flex tw-h-full tw-items-center tw-justify-center tw-text-center">
                    <Image
                      src={getScaledImageUri(picture, ImageScale.W_AUTO_H_50)}
                      alt={`Profile for ${handle}`}
                      width={24}
                      height={24}
                      className="tw-mx-auto tw-h-auto tw-max-h-full tw-w-auto tw-max-w-full tw-bg-transparent tw-object-contain"
                    />
                  </div>
                </div>
              </div>
            )}
            <div>
              <div className="tw-w-[12rem] tw-truncate tw-whitespace-nowrap tw-text-sm tw-font-medium tw-text-white">
                {handle}
              </div>
              <div className="tw-w-[12rem] tw-truncate tw-whitespace-nowrap tw-text-xs tw-font-medium tw-text-iron-400">
                {display}
              </div>
            </div>
          </div>
          {isSelected && (
            <svg
              className="tw-ml-2 tw-h-5 tw-w-5 tw-text-primary-300 tw-transition tw-duration-300 tw-ease-out"
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
