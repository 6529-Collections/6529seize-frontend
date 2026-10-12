const ACTIVE_TAB_BACKGROUND = "tw-border-primary-300 tw-bg-transparent";
const INACTIVE_TAB_BACKGROUND =
  "tw-border-transparent tw-bg-transparent active:tw-bg-white/[0.05]";
const ACTIVE_TAB_TEXT = "tw-text-white";
const INACTIVE_TAB_TEXT =
  "tw-text-iron-400 desktop-hover:group-hover:tw-text-iron-200 group-active:tw-text-iron-100";
const BASE_TAB_BUTTON_CLASS_NAME =
  "tw-group -tw-mb-px tw-flex tw-min-h-10 tw-shrink-0 tw-items-center tw-justify-center tw-gap-1 tw-border-x-0 tw-border-b-2 tw-border-t-0 tw-border-solid tw-px-3 tw-py-2 tw-no-underline tw-transition-colors tw-duration-150 tw-ease-out motion-reduce:tw-transition-none focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-inset focus-visible:tw-ring-primary-300";
const BASE_TAB_TEXT_CLASS_NAME =
  "tw-max-w-36 tw-truncate tw-whitespace-nowrap tw-text-sm tw-font-medium sm:tw-max-w-44";

export const getTabButtonClassName = (isActive: boolean): string =>
  `${BASE_TAB_BUTTON_CLASS_NAME} ${
    isActive ? ACTIVE_TAB_BACKGROUND : INACTIVE_TAB_BACKGROUND
  }`;

export const getTabTextClassName = ({
  isActive,
  additionalClasses,
}: {
  readonly isActive: boolean;
  readonly additionalClasses?: string | undefined;
}): string => {
  const additionalClassName = additionalClasses ? ` ${additionalClasses}` : "";
  const textColorClassName = isActive ? ACTIVE_TAB_TEXT : INACTIVE_TAB_TEXT;

  return `${BASE_TAB_TEXT_CLASS_NAME}${additionalClassName} ${textColorClassName}`;
};
