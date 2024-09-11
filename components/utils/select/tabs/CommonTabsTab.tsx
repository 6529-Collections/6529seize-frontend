import { useEffect, useState } from "react";
import { SortDirection } from "../../../../entities/ISort";
import CommonTableSortIcon from "../../../user/utils/icons/CommonTableSortIcon";
import { CommonSelectItemProps } from "../CommonSelect";

export default function CommonTabsTab<T, U = unknown>(
  props: Readonly<CommonSelectItemProps<T, U>>
) {
  const { item, activeItem, setSelected, sortDirection } = props;

  const getIsActive = (): boolean => item.value === activeItem;
  const [isActive, setIsActive] = useState<boolean>(getIsActive());

  useEffect(() => {
    setIsActive(getIsActive());
  }, [activeItem]);

  const getDynamicClasses = (): string => {
    let response = "";
    if (isActive) {
      response += "tw-bg-iron-800 tw-text-iron-100";
    } else {
      response +=
        " tw-bg-iron-950 hover:tw-bg-iron-900 tw-text-iron-500 hover:tw-text-iron-100";
    }
    return response;
  };

  const [dynamicClasses, setDynamicClasses] = useState<string>(
    getDynamicClasses()
  );
  useEffect(() => {
    setDynamicClasses(getDynamicClasses());
  }, [isActive]);

  const [shouldRotate, setShouldRotate] = useState<boolean>(false);

  const onSelected = () => {
    setSelected(item.value);
    setShouldRotate(false);
  };

  return (
    <div className={isActive ? "tw-p-[1px] tw-flex tw-rounded-lg tw-bg-gradient-to-b tw-from-iron-700 tw-to-iron-800" : "tw-p-[1px] tw-flex tw-rounded-lg"}>
      <button
        type="button"
        onClick={onSelected}
        onMouseEnter={() => setShouldRotate(true)}
        onMouseLeave={() => setShouldRotate(false)}
        className={`${dynamicClasses} tw-whitespace-nowrap tw-flex-1 sm:tw-flex-none tw-px-3 tw-py-2 tw-text-sm tw-leading-5 tw-font-semibold tw-border-0 tw-rounded-lg tw-transition-all tw-duration-300 tw-ease-out`}
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
    </div>
  );
}
