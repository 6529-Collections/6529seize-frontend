"use client";

import { Tooltip } from "react-tooltip";
import { TOOLTIP_STYLES } from "@/helpers/tooltip.helpers";
import type { STATEMENT_TYPE } from "@/helpers/Types";
import useIsTouchDevice from "@/hooks/useIsTouchDevice";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import UserPageIdentityAddStatementsTypeButton, {
  ADD_STATEMENT_PLATFORM_TOOLTIP_ID,
} from "./UserPageIdentityAddStatementsTypeButton";

const PLATFORM_PICKER_LABEL_ID = "add-statement-platform-picker-label";

export default function UserPageIdentityAddStatementsPlatformPicker<
  T extends STATEMENT_TYPE,
>({
  statementTypes,
  activeType,
  rowCount,
  onSelect,
}: {
  readonly statementTypes: readonly T[];
  readonly activeType: T;
  readonly rowCount: number;
  readonly onSelect: (type: T) => void;
}) {
  const locale = useBrowserLocale();
  const isTouchScreen = useIsTouchDevice();
  const rowSize = Math.ceil(statementTypes.length / rowCount);
  const rows = Array.from({ length: rowCount }, (_, rowIndex) =>
    statementTypes.slice(rowIndex * rowSize, (rowIndex + 1) * rowSize)
  ).filter((row) => row.length > 0);

  return (
    <div>
      <p
        id={PLATFORM_PICKER_LABEL_ID}
        className="tw-mb-2 tw-mt-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wider tw-text-iron-500"
      >
        {t(locale, "user.profile.identity.statements.selectPlatform")}
      </p>
      <div role="group" aria-labelledby={PLATFORM_PICKER_LABEL_ID}>
        {rows.map((row, rowIndex) => (
          <span
            key={row.join("-")}
            className={
              rowIndex === 0
                ? "tw-isolate tw-inline-flex tw-w-full tw-rounded-md tw-shadow-sm"
                : "tw-isolate tw-mt-3 tw-inline-flex tw-w-full tw-rounded-md tw-shadow-sm md:tw-mt-2"
            }
          >
            {row.map((type, index) => (
              <UserPageIdentityAddStatementsTypeButton
                key={type}
                statementType={type}
                isActive={activeType === type}
                isFirst={index === 0}
                isLast={index === row.length - 1}
                onClick={() => onSelect(type)}
              />
            ))}
          </span>
        ))}
      </div>
      {!isTouchScreen && (
        <Tooltip
          id={ADD_STATEMENT_PLATFORM_TOOLTIP_ID}
          place="top"
          positionStrategy="fixed"
          offset={8}
          opacity={1}
          delayShow={250}
          style={TOOLTIP_STYLES}
        />
      )}
    </div>
  );
}
