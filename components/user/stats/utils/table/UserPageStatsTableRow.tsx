import Tippy from "@tippyjs/react";
import TooltipIcon from "../../../../utils/icons/TooltipIcon";
import { UserPageStatsTableItemData } from "./UserPageStatsTable";

export default function UserPageStatsTableRow({
  data,
}: {
  readonly data: UserPageStatsTableItemData;
}) {
  const mainClasses = data.isMain
    ? "tw-pt-2.5 tw-border-t tw-border-x-0 tw-border-b-0 tw-border-solid tw-border-iron-700 tw-text-iron-50"
    : "tw-text-iron-500";

  const lastClasses = data.isLast ? "tw-pb-2.5" : "";

  const classes = `${mainClasses} ${lastClasses}`;

  return (
    <>
      <td
        className={`${classes} tw-font-medium tw-px-4 sm:tw-px-6 lg:tw-pr-4 tw-whitespace-nowrap tw-text-sm sm:tw-text-base`}>
        {data.title}{" "}
        {data.tooltip && (
          <Tippy content={data.tooltip} theme="dark" placement="top">
            <span className="tw-ml-1 tw-text-iron-300">
              <TooltipIcon />
            </span>
          </Tippy>
        )}
      </td>

      <td
        className={`${classes} tw-font-medium tw-px-4 sm:tw-px-6 lg:tw-pl-4 tw-whitespace-nowrap tw-text-sm sm:tw-text-base tw-text-right`}>
        {data.total}
      </td>
      <td
        className={`${classes} tw-font-medium tw-px-4 sm:tw-px-6 lg:tw-pl-4 tw-whitespace-nowrap tw-text-sm sm:tw-text-base tw-text-right`}>
        {data.memes}
      </td>
      <td
        className={`${classes} tw-font-medium tw-px-4 sm:tw-px-6 lg:tw-pl-4 tw-whitespace-nowrap tw-text-sm sm:tw-text-base tw-text-right`}>
        {data.nextgen}
      </td>
      <td
        className={`${classes} tw-font-medium tw-px-4 sm:tw-px-6 lg:tw-pl-4 tw-whitespace-nowrap tw-text-sm sm:tw-text-base tw-text-right`}>
        {data.gradient}
      </td>
      <td
        className={`${classes} tw-font-medium tw-px-4 sm:tw-px-6 lg:tw-pl-4 tw-whitespace-nowrap tw-text-sm sm:tw-text-base tw-text-right`}>
        {data.memelab}
      </td>
    </>
  );
}
