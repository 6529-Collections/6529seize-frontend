import { getUnderlineTabClasses } from "@/components/common/underlineTabStyles";

const BASE_TAB_BUTTON_CLASS_NAME =
  "tw-group -tw-mb-px tw-flex tw-min-h-10 tw-shrink-0 tw-items-center tw-justify-center tw-gap-1 tw-px-3 tw-py-2";
const BASE_TAB_TEXT_CLASS_NAME =
  "tw-max-w-36 tw-truncate tw-whitespace-nowrap tw-text-sm tw-font-medium tw-text-inherit sm:tw-max-w-44";

export const getTabButtonClassName = (isActive: boolean): string =>
  `${BASE_TAB_BUTTON_CLASS_NAME} ${getUnderlineTabClasses({ active: isActive })}`;

export const getTabTextClassName = ({
  additionalClasses,
}: {
  readonly isActive: boolean;
  readonly additionalClasses?: string | undefined;
}): string => {
  const additionalClassName = additionalClasses ? ` ${additionalClasses}` : "";

  return `${BASE_TAB_TEXT_CLASS_NAME}${additionalClassName}`;
};
