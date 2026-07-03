import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck } from "@fortawesome/free-solid-svg-icons";
import type { CommunityMemberMinimal } from "@/entities/IProfile";
import { getScaledImageUri, ImageScale } from "@/helpers/image.helpers";

export default function CommonProfileSearchItem({
  profile,
  onProfileSelect,
  isSelected = false,
  isHighlighted = false,
  id,
}: {
  readonly profile: CommunityMemberMinimal;
  readonly onProfileSelect: (newV: CommunityMemberMinimal | null) => void;
  readonly isSelected?: boolean | undefined;
  readonly isHighlighted?: boolean | undefined;
  readonly id: string;
}) {
  const title = profile.display ?? profile.handle ?? profile.wallet;
  const avatarLabel = title;
  const avatarAltText = `${avatarLabel} avatar`;
  const secondaryText =
    [profile.handle, profile.wallet, profile.display].find(
      (value): value is string =>
        value !== null && value.length > 0 && value !== title
    ) ?? null;

  const onProfileClick = () => onProfileSelect(profile);

  return (
    <li
      id={id}
      role={
        "option" /* NOSONAR: custom combobox popup uses valid ARIA listbox/option semantics */
      }
      aria-selected={isSelected}
      className="tw-list-none"
    >
      <button
        type="button"
        onClick={onProfileClick}
        tabIndex={-1}
        className={`tw-relative tw-flex tw-h-full tw-w-full tw-cursor-pointer tw-select-none tw-items-center tw-justify-between tw-rounded-lg tw-border-none tw-bg-transparent tw-px-2 tw-py-2 tw-text-left tw-text-white tw-transition tw-duration-300 tw-ease-out hover:tw-bg-iron-700 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-primary-400 ${
          isHighlighted ? "tw-bg-iron-700" : "tw-bg-transparent"
        }`}
      >
        <div className="tw-flex tw-w-full tw-items-center tw-justify-between">
          <div className="tw-flex tw-items-center tw-space-x-2">
            {profile.pfp && (
              <div className="tw-h-6 tw-w-6 tw-overflow-hidden tw-rounded-md tw-bg-iron-900 tw-ring-1 tw-ring-inset tw-ring-white/10">
                <div className="tw-h-full tw-w-full tw-max-w-full">
                  <div className="tw-flex tw-h-full tw-items-center tw-justify-center tw-text-center">
                    {/* Keep img here because this lightweight search dropdown behaves like a typeahead. */}
                    <img
                      src={getScaledImageUri(
                        profile.pfp,
                        ImageScale.W_AUTO_H_50
                      )}
                      alt={avatarAltText}
                      className="tw-mx-auto tw-h-auto tw-max-h-full tw-w-auto tw-max-w-full tw-bg-transparent tw-object-contain"
                    />
                  </div>
                </div>
              </div>
            )}
            <div className="tw-w-[12rem] tw-truncate">
              <p className="tw-mb-0 tw-truncate tw-whitespace-nowrap tw-text-sm tw-font-medium tw-text-white">
                {title}
              </p>
              {secondaryText && (
                <p className="tw-mb-0 tw-truncate tw-whitespace-nowrap tw-text-xs tw-font-medium tw-text-iron-400">
                  {secondaryText}
                </p>
              )}
            </div>
          </div>
          {isSelected && (
            <FontAwesomeIcon
              icon={faCheck}
              className="tw-h-5 tw-w-5 tw-flex-shrink-0 tw-text-primary-300 tw-transition tw-duration-300 tw-ease-out"
              aria-hidden="true"
              focusable={false}
            />
          )}
        </div>
      </button>
    </li>
  );
}
