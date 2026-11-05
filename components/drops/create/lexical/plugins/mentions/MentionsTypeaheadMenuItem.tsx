import { getScaledImageUri, ImageScale } from "@/helpers/image.helpers";
import Image from "next/image";
import UserCICAndLevel, {
  UserCICAndLevelSize,
} from "@/components/user/utils/UserCICAndLevel";
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
        } tw-relative tw-flex tw-min-h-10 tw-w-full tw-cursor-pointer tw-select-none tw-items-center tw-gap-2 tw-rounded-lg tw-border-none tw-px-2 tw-py-0.5 tw-text-left tw-text-white tw-transition tw-duration-300 tw-ease-out focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-primary-400`}
      >
        {picture && (
          <div className="tw-h-6 tw-w-6 tw-shrink-0 tw-overflow-hidden tw-rounded-md tw-bg-iron-900 tw-ring-1 tw-ring-white/10">
            {/* Typeahead avatar URLs can use hosts outside next/image remotePatterns, so this stays unoptimized. */}
            <Image
              src={getScaledImageUri(picture, ImageScale.W_AUTO_H_50)}
              alt=""
              width={24}
              height={24}
              unoptimized
              className="tw-h-full tw-w-full tw-object-contain"
            />
          </div>
        )}
        <div className="tw-min-w-0 tw-flex-1">
          <div className="tw-flex tw-h-5 tw-min-w-0 tw-items-center tw-gap-1.5">
            <span className="tw-truncate tw-text-sm tw-font-medium tw-text-white">
              {handle}
            </span>
            {hasLevel && (
              <div
                className="tw-inline-flex tw-shrink-0"
                role="img"
                aria-label={t(locale, "waves.composer.mentions.level", {
                  level,
                })}
              >
                <UserCICAndLevel
                  level={level}
                  size={UserCICAndLevelSize.SMALL}
                />
              </div>
            )}
            <span
              className="tw-ml-auto tw-h-4 tw-w-4 tw-shrink-0"
              aria-hidden="true"
            >
              {isSelected && (
                <svg
                  className="tw-h-4 tw-w-4 tw-text-primary-300"
                  viewBox="0 0 24 24"
                  fill="none"
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
          {display && (
            <div className="tw-truncate tw-text-xs tw-font-medium tw-text-iron-400">
              {display}
            </div>
          )}
        </div>
      </button>
    </li>
  );
}
