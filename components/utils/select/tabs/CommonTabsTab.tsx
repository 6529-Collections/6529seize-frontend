import { useEffect, useState } from "react";
import { SortDirection } from "../../../../entities/ISort";
import CommonTableSortIcon from "../../../user/utils/icons/CommonTableSortIcon";
import { CommonSelectItemProps } from "../CommonSelect";

export default function CommonTabsTab<T, U = unknown>(
  props: Readonly<CommonSelectItemProps<T, U>>
) {
  const { item, activeItem, totalItems, itemIdx, setSelected, sortDirection } =
    props;

  const getIsActive = (): boolean => item.value === activeItem;
  const [isActive, setIsActive] = useState<boolean>(getIsActive());

  const isFirst = itemIdx === 0;
  const isLast = itemIdx === totalItems - 1;

  useEffect(() => {
    setIsActive(getIsActive());
  }, [activeItem]);

  const getDynamicClasses = (): string => {
    let response = "";
    if (isActive) {
      response += " tw-bg-iron-800 tw-text-iron-100";
    } else {
      response +=
        " tw-bg-iron-950 hover:tw-bg-iron-900 tw-text-iron-500 hover:tw-text-iron-100";
    }

    if (isFirst) {
      response += " tw-rounded-l-lg";
    }
    if (isLast) {
      response += " tw-rounded-r-lg";
    }
    return response;
  };

  const [dynamicClasses, setDynamicClasses] = useState<string>(
    getDynamicClasses()
  );
  useEffect(() => {
    setDynamicClasses(getDynamicClasses());
  }, [isActive, isFirst, isLast]);

  const [shouldRotate, setShouldRotate] = useState<boolean>(false);

  const onSelected = () => {
    setSelected(item.value);
    setShouldRotate(false);
  };

  return (
    <button
      type="button"
      onClick={onSelected}
      onMouseEnter={() => setShouldRotate(true)}
      onMouseLeave={() => setShouldRotate(false)}
      className={`${dynamicClasses}  tw-whitespace-nowrap tw-flex-1 sm:tw-flex-none tw-px-4 tw-py-2 tw-text-sm tw-font-semibold tw-border tw-border-solid tw-border-iron-700 tw-transition tw-duration-300 tw-ease-out`}
    >
      {item.label}
      {sortDirection && (
        <CommonTableSortIcon
          direction={isActive ? sortDirection : SortDirection.DESC}
          isActive={isActive}
          shouldRotate={isActive && shouldRotate}
        />
      )}
    </button>
  );
}
