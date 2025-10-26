import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck } from "@fortawesome/free-solid-svg-icons";
import type { KeyboardEvent } from "react";
import { CommunityMemberMinimal } from "@/entities/IProfile";
import { getScaledImageUri, ImageScale } from "@/helpers/image.helpers";
import { getSelectableIdentity } from "./getSelectableIdentity";

const LISTBOX_OPTION_ROLE = {
  role: "option" as const, // NOSONAR (S6819): WAI-ARIA listbox items must expose role="option"; native <option> cannot render the avatar-rich layout this picker requires.
};

export default function CommonProfileSearchItem({
  profile,
  selected,
  onProfileSelect,
  isHighlighted = false,
  id,
}: {
  readonly profile: CommunityMemberMinimal;
  readonly selected: string | null;
  readonly onProfileSelect: (newV: CommunityMemberMinimal | null) => void;
  readonly isHighlighted?: boolean;
  readonly id: string;
}) {
  const selectableValue = getSelectableIdentity(profile);
  const isSelected =
    typeof selectableValue === "string" &&
    selected?.toLowerCase() === selectableValue.toLowerCase();
  const title = profile.handle ?? profile.display;

  const onProfileClick = () => onProfileSelect(profile);
  const onProfileKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onProfileClick();
    }
  };

  return (
    <li role="presentation" className="tw-list-none">
      <button
        id={id}
        type="button"
        {...LISTBOX_OPTION_ROLE}
        aria-selected={isSelected}
        tabIndex={-1}
        className={`tw-h-full hover:tw-bg-iron-700 tw-py-2 tw-w-full tw-border-none tw-text-left tw-flex tw-items-center tw-justify-between tw-text-white tw-rounded-lg tw-relative tw-cursor-pointer tw-select-none tw-px-2 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-primary-400 tw-transition tw-duration-300 tw-ease-out ${
          isHighlighted ? "tw-bg-iron-700" : "tw-bg-transparent"
        }`}
        onClick={onProfileClick}
        onKeyDown={onProfileKeyDown}
      >
        <div className="tw-w-full tw-flex tw-justify-between tw-items-center">
          <div className="tw-flex tw-space-x-2 tw-items-center">
            {profile.pfp && (
              <div className="tw-h-6 tw-w-6 tw-rounded-md tw-overflow-hidden tw-ring-1 tw-ring-inset tw-ring-white/10 tw-bg-iron-900">
                <div className="tw-h-full tw-w-full tw-max-w-full">
                  <div className="tw-h-full tw-text-center tw-flex tw-items-center tw-justify-center">
                    <img
                      src={getScaledImageUri(
                        profile.pfp,
                        ImageScale.W_AUTO_H_50
                      )}
                      alt=""
                      aria-hidden="true"
                      className="tw-bg-transparent tw-max-w-full tw-max-h-full tw-h-auto tw-w-auto tw-mx-auto tw-object-contain"
                    />
                  </div>
                </div>
              </div>
            )}
            <div className="tw-w-[12rem] tw-truncate">
              <p className="tw-mb-0 tw-text-sm tw-font-medium tw-text-white tw-truncate tw-whitespace-nowrap">
                {title}
              </p>
              <p className="tw-mb-0 tw-text-xs tw-font-medium tw-text-iron-400 tw-truncate tw-whitespace-nowrap">
                {profile.display}
              </p>
            </div>
          </div>
          {isSelected && (
            <FontAwesomeIcon
              icon={faCheck}
              className="tw-flex-shrink-0 tw-h-5 tw-w-5 tw-text-primary-300 tw-transition tw-duration-300 tw-ease-out"
              aria-hidden="true"
              focusable={false}
            />
          )}
        </div>
      </button>
    </li>
  );
}
