import Tippy from "@tippyjs/react";
import { MEMES_SEASON } from "../../../../../enums";
import { assertUnreachable } from "../../../../../helpers/AllowlistToolHelpers";
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

  const getSZNData = (szn: MEMES_SEASON) => {
    switch (szn) {
      case MEMES_SEASON.SZN1:
        return data.SZN1;
      case MEMES_SEASON.SZN2:
        return data.SZN2;
      case MEMES_SEASON.SZN3:
        return data.SZN3;
      case MEMES_SEASON.SZN4:
        return data.SZN4;
      case MEMES_SEASON.SZN5:
        return data.SZN5;
      case MEMES_SEASON.SZN6:
        return data.SZN6;
      default:
        assertUnreachable(szn);
        return null;
    }
  };

  return (
    <>
      <td
        className={`${classes} tw-font-medium tw-px-4 sm:tw-px-6 tw-whitespace-nowrap tw-text-md`}
      >
        {data.title}{" "}
        {data.tooltip && (
          <Tippy content={data.tooltip} theme="dark" placement="top">
            <span>
              <TooltipIcon />
            </span>
          </Tippy>
        )}
      </td>

      <td
        className={`${classes} tw-font-normal tw-px-4 sm:tw-px-6 tw-whitespace-nowrap tw-text-md tw-text-right`}
      >
        {data.total}
      </td>
      <td
        className={`${classes} tw-font-normal tw-px-4 sm:tw-px-6 tw-whitespace-nowrap tw-text-md tw-text-right`}
      >
        {data.memes}
      </td>
      {Object.values(MEMES_SEASON).map((season) => (
        <td
          key={season}
          className={`${classes} tw-font-normal tw-px-4 sm:tw-px-6 tw-whitespace-nowrap tw-text-md tw-text-right`}
        >
          {getSZNData(season)}
        </td>
      ))}

      <td
        className={`${classes} tw-font-normal tw-px-4 sm:tw-px-6 tw-whitespace-nowrap tw-text-md tw-text-right`}
      >
        {data.gradient}
      </td>
    </>
  );
}
