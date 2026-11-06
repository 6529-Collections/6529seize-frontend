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
  level = null,
  setRefElement,
}: {
  readonly index: number;
  readonly isSelected: boolean;
  readonly onClick: () => void;
  readonly onMouseEnter: () => void;
  readonly handle: string;
  readonly display: string | null;
  readonly picture: string | null;
  readonly level?: number | null | undefined;
  readonly setRefElement: (element: HTMLElement | null) => void;
}) {
  const locale = useBrowserLocale();
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
          isSelected ? "tw-bg-iron-800" : "tw-bg-transparent"
        } tw-relative tw-flex tw-min-h-11 tw-w-full tw-cursor-pointer tw-select-none tw-items-center tw-justify-between tw-rounded-lg tw-border-none tw-px-2 tw-py-1 tw-text-left tw-text-white tw-transition-colors tw-duration-150 tw-ease-out focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-primary-400`}
      >
        <div className="tw-inline-flex tw-w-full tw-min-w-0 tw-items-center tw-justify-between">
          <div className="tw-inline-flex tw-min-w-0 tw-flex-1 tw-items-center tw-gap-2">
            {picture && (
              <div className="tw-h-6 tw-w-6 tw-shrink-0 tw-overflow-hidden tw-rounded-md tw-bg-iron-900 tw-ring-1 tw-ring-white/10">
                <div className="tw-h-full tw-w-full tw-max-w-full">
                  <div className="tw-flex tw-h-full tw-items-center tw-justify-center tw-text-center">
                    {/* Typeahead avatar URLs can use hosts outside next/image remotePatterns, so this stays unoptimized. */}
                    <Image
                      src={getScaledImageUri(picture, ImageScale.W_AUTO_H_50)}
                      alt={t(locale, "waves.composer.mentions.profileAlt", {
                        handle,
                      })}
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
              <div className="tw-flex tw-min-w-0 tw-items-center tw-gap-2 tw-text-sm tw-font-medium tw-text-white">
                <span className="tw-truncate">{handle}</span>
                {typeof level === "number" && (
                  <div className="tw-shrink-0">
                    <span className="tw-sr-only">
                      {t(locale, "waves.composer.mentions.level", { level })}
                    </span>
                    <div
                      aria-hidden="true"
                      className="tw-flex [&_.tw-rounded-full]:tw-border-transparent [&_.tw-rounded-full]:tw-bg-iron-900 [&_.tw-rounded-full]:tw-ring-1 [&_.tw-rounded-full]:tw-ring-inset [&_.tw-rounded-full]:tw-ring-white/10"
                    >
                      <UserCICAndLevel
                        level={level}
                        size={UserCICAndLevelSize.SMALL}
                      />
                    </div>
                  </div>
                )}
              </div>
              <div className="tw-truncate tw-text-xs tw-font-medium tw-text-iron-400">
                {display}
              </div>
            </div>
          </div>
          {isSelected && (
            <svg
              className="tw-ml-2 tw-mt-0.5 tw-size-4 tw-shrink-0 tw-self-start tw-text-primary-300"
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
