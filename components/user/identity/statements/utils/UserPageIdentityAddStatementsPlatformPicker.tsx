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

export default function UserPageIdentityAddStatementsPlatformPicker<
  T extends STATEMENT_TYPE,
>({
  statementTypes,
  activeType,
  rowCount,
  labelOverrides,
  onSelect,
}: {
  readonly statementTypes: readonly T[];
  readonly activeType: T;
  readonly rowCount: number;
  readonly labelOverrides?: Readonly<Partial<Record<STATEMENT_TYPE, string>>>;
  readonly onSelect: (type: T) => void;
}) {
  const locale = useBrowserLocale();
  const isTouchScreen = useIsTouchDevice();
  const rowSize = Math.ceil(statementTypes.length / rowCount);
  const rows = Array.from({ length: rowCount }, (_, rowIndex) =>
    statementTypes.slice(rowIndex * rowSize, (rowIndex + 1) * rowSize)
  ).filter((row) => row.length > 0);
  const tooltipProps = {
    id: ADD_STATEMENT_PLATFORM_TOOLTIP_ID,
    place: "top",
    positionStrategy: "fixed",
    offset: 8,
    opacity: 1,
    clickable: false,
    style: TOOLTIP_STYLES,
  } as const;

  return (
    <div>
      <fieldset className="tw-m-0 tw-min-w-0 tw-border-0 tw-p-0">
        <legend className="tw-mb-2 tw-block tw-w-full tw-p-0 tw-text-sm tw-font-medium tw-leading-5 tw-text-iron-100">
          {t(locale, "user.profile.identity.statements.selectPlatform")}
        </legend>
        <div className="tw-grid tw-auto-rows-fr tw-grid-cols-1 tw-gap-y-3 md:tw-gap-y-2">
          {rows.map((row) => (
            <span
              key={row.join("-")}
              className="tw-isolate tw-inline-flex tw-w-full tw-min-w-0 tw-rounded-md tw-shadow-sm"
            >
              {row.map((type, index) => (
                <UserPageIdentityAddStatementsTypeButton
                  key={type}
                  statementType={type}
                  label={labelOverrides?.[type]}
                  isActive={activeType === type}
                  isFirst={index === 0}
                  isLast={index === row.length - 1}
                  onClick={() => onSelect(type)}
                />
              ))}
            </span>
          ))}
        </div>
      </fieldset>
      {isTouchScreen ? (
        <Tooltip
          {...tooltipProps}
          delayShow={0}
          clickable
          openEvents={{ click: true }}
          closeEvents={{ click: true }}
          globalCloseEvents={{ clickOutsideAnchor: true }}
        />
      ) : (
        <Tooltip {...tooltipProps} delayShow={250} />
      )}
    </div>
  );
}
