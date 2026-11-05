import { getScaledImageUri, ImageScale } from "@/helpers/image.helpers";
import Image from "next/image";
import UserLevel from "@/components/user/utils/level/UserLevel";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";

export default function MentionsTypeaheadMenuItem({
  index,
  isSelected,
  onClick,
  onMouseEnter,
  handle,
  display,
  picture,
  level,
  setRefElement,
}: {
  readonly index: number;
  readonly isSelected: boolean;
  readonly onClick: () => void;
  readonly onMouseEnter: () => void;
  readonly handle: string;
  readonly display: string | null;
  readonly picture: string | null;
  readonly level: number | null | undefined;
  readonly setRefElement: (element: HTMLElement | null) => void;
}) {
  const locale = useBrowserLocale();
  const hasLevel =
    typeof level === "number" &&
    Number.isInteger(level) &&
    level >= 0 &&
    level <= 100;
  return (
    <li
      className="tw-h-full"
      ref={setRefElement}
      id={"typeahead-item-" + index}
    >
      <button
        onMouseEnter={onMouseEnter}
        onMouseDown={(event) => {
          event.preventDefault();
        }}
        onClick={onClick}
        type="button"
        className={`${
          isSelected ? "tw-bg-iron-700" : "tw-bg-transparent"
        } tw-relative tw-flex tw-h-full tw-w-full tw-cursor-pointer tw-select-none tw-items-center tw-justify-between tw-rounded-lg tw-border-none tw-px-2 tw-py-2 tw-text-left tw-text-white tw-transition tw-duration-300 tw-ease-out focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-primary-400`}
      >
        <div className="tw-flex tw-w-full tw-min-w-0 tw-items-center tw-gap-2">
          <div className="tw-flex tw-min-w-0 tw-flex-1 tw-items-center tw-gap-2">
            {picture && (
              <div className="tw-h-6 tw-w-6 tw-shrink-0 tw-overflow-hidden tw-rounded-md tw-bg-iron-900 tw-ring-1 tw-ring-white/10">
                <div className="tw-h-full tw-w-full tw-max-w-full">
                  <div className="tw-flex tw-h-full tw-items-center tw-justify-center tw-text-center">
                    {/* Typeahead avatar URLs can use hosts outside next/image remotePatterns, so this stays unoptimized. */}
                    <Image
                      src={getScaledImageUri(picture, ImageScale.W_AUTO_H_50)}
                      alt=""
                      width={24}
                      height={24}
                      unoptimized
                      className="tw-mx-auto tw-h-auto tw-max-h-full tw-w-auto tw-max-w-full tw-bg-transparent tw-object-contain"
                    />
                  </div>
                </div>
              </div>
            )}
            <div className="tw-min-w-0 tw-flex-1">
              <div className="tw-flex tw-h-5 tw-min-w-0 tw-items-center tw-gap-1.5">
                <span className="tw-truncate tw-text-sm tw-font-medium tw-text-white">
                  {handle}
                </span>
                {hasLevel && (
                  <span
                    className="tw-shrink-0"
                    role="img"
                    aria-label={t(locale, "waves.composer.mentions.level", {
                      level,
                    })}
                  >
                    <UserLevel
                      level={level}
                      size="xxs"
                      asSpan
                      showLabel={false}
                    />
                  </span>
                )}
              </div>
              <div className="tw-h-4 tw-truncate tw-text-xs tw-font-medium tw-text-iron-400">
                {display}
              </div>
            </div>
          </div>
          <span className="tw-h-5 tw-w-5 tw-shrink-0" aria-hidden="true">
            {isSelected && (
              <svg
                className="tw-h-5 tw-w-5 tw-text-primary-300 tw-transition tw-duration-300 tw-ease-out"
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
          </span>
        </div>
      </button>
    </li>
  );
}
