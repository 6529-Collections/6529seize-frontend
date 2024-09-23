import {
  getScaledImageUri,
  ImageScale,
} from "../../../../../../helpers/image.helpers";
import { MentionTypeaheadOption } from "./MentionsPlugin";

export default function MentionsTypeaheadMenuItem({
  index,
  isSelected,
  onClick,
  onMouseEnter,
  option,
}: {
  readonly index: number;
  readonly isSelected: boolean;
  readonly onClick: () => void;
  readonly onMouseEnter: () => void;
  readonly option: MentionTypeaheadOption;
}) {
  return (
    <li
      className="tw-h-full"
      ref={option.setRefElement}
      id={"typeahead-item-" + index}>
      <button
        onMouseEnter={onMouseEnter}
        onClick={onClick}
        type="button"
        className={`${
          isSelected ? "tw-bg-iron-700" : "tw-bg-transparent"
        }  tw-py-2 tw-w-full tw-h-full  tw-border-none tw-text-left tw-flex tw-items-center tw-justify-between tw-text-white tw-rounded-lg tw-relative tw-cursor-pointer tw-select-none tw-px-2  focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-primary-400 tw-transition tw-duration-300 tw-ease-out`}>
        <div className="tw-w-full tw-inline-flex tw-justify-between tw-items-center">
          <div className="tw-inline-flex tw-space-x-2 tw-items-center">
            {option.picture && (
              <div className="tw-h-6 tw-w-6 tw-rounded-md tw-overflow-hidden tw-ring-1 tw-ring-white/10 tw-bg-iron-900">
                <div className="tw-h-full tw-w-full tw-max-w-full">
                  <div className="tw-h-full tw-text-center tw-flex tw-items-center tw-justify-center">
                    <img
                      src={getScaledImageUri(
                        option.picture,
                        ImageScale.W_AUTO_H_50
                      )}
                      alt="Network Table Profile"
                      className="tw-bg-transparent tw-max-w-full tw-max-h-full tw-h-auto tw-w-auto tw-mx-auto tw-object-contain"
                    />
                  </div>
                </div>
              </div>
            )}
            <div>
              <div className="tw-text-sm tw-w-[12rem] tw-font-medium tw-text-white tw-truncate tw-whitespace-nowrap">
                {option.handle}
              </div>
              <div className="tw-text-xs tw-w-[12rem] tw-font-medium tw-text-iron-400 tw-truncate tw-whitespace-nowrap">
                {option.display}
              </div>
            </div>
          </div>
          {isSelected && (
            <svg
              className="tw-h-5 tw-w-5 tw-ml-2 tw-text-primary-300 tw-transition tw-duration-300 tw-ease-out"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg">
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
