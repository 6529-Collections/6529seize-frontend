import { useEffect, useState } from "react";
import { useAnimate } from "framer-motion";
import { CommonSelectProps } from "../CommonSelect";
import CommonDropdownItemsWrapper from "./CommonDropdownItemsWrapper";
import CommonDropdownItem from "./CommonDropdownItem";
import { SortDirection } from "../../../../entities/ISort";
import CommonTableSortIcon from "../../../user/utils/icons/CommonTableSortIcon";
import { Inter } from "next/font/google";

const inter = Inter({
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal"],
  subsets: ["latin"],
  display: "swap",
});

export default function CommonDropdown<T>(props: CommonSelectProps<T>) {
  const { items, activeItem, noneLabel, filterLabel, setSelected } = props;
  const [isOpen, setIsOpen] = useState(false);
  const [iconScope, animateIcon] = useAnimate();

  useEffect(() => {
    if (isOpen) {
      animateIcon(iconScope.current, { rotate: 0 });
    } else {
      animateIcon(iconScope.current, { rotate: -90 });
    }
  });

  const getLabel = (): string => {
    const targetItem = items.find((item) => item.value === activeItem);
    return (
      targetItem?.mobileLabel ??
      targetItem?.label ??
      noneLabel ??
      "None Selected"
    );
  };

  const [label, setLabel] = useState<string>(getLabel());

  useEffect(() => {
    setLabel(getLabel());
  }, [activeItem]);

  const getSortDirection = (): SortDirection | undefined =>
    "sortDirection" in props ? props.sortDirection : undefined;

  const [sortDirection, setSortDirection] = useState<SortDirection | undefined>(
    getSortDirection()
  );

  useEffect(() => {
    setSortDirection(getSortDirection());
  }, [props]);

  const onSelect = (item: T) => {
    setIsOpen(false);
    setSelected(item);
  };

  return (
    <div className={`tw-relative ${inter.className}`}>
      <div className="tw-relative">
        <button
          type="button"
          aria-haspopup="true"
          onClick={() => setIsOpen(true)}
          className="tw-text-left tw-block tw-whitespace-nowrap tw-rounded-lg tw-border-0 tw-py-2.5 tw-pl-3.5 tw-pr-10 tw-bg-iron-800 lg:tw-bg-iron-900 focus:tw-bg-transparent tw-text-iron-300 tw-font-semibold tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-700 
          focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 tw-text-sm hover:tw-bg-iron-800 tw-transition tw-duration-300 tw-ease-out tw-justify-between"
        >
          <span>{label}</span>
          {sortDirection && (
            <CommonTableSortIcon direction={sortDirection} isActive={true} />
          )}
        </button>
        <div className="tw-pointer-events-none tw-absolute tw-inset-y-0 tw-right-0 tw-flex tw-items-center -tw-mr-1 tw-pr-3.5">
          <svg
            ref={iconScope}
            className="tw-h-5 tw-w-5 tw-text-white"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M6 9L12 15L18 9"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
      <CommonDropdownItemsWrapper
        isOpen={isOpen}
        setOpen={setIsOpen}
        filterLabel={filterLabel}
      >
        {Object.values(items).map((item, i) => (
          <CommonDropdownItem
            key={item.key}
            item={item}
            isFirst={i === 0}
            isLast={i === items.length - 1}
            activeItem={activeItem}
            sortDirection={sortDirection}
            setSelected={onSelect}
          />
        ))}
      </CommonDropdownItemsWrapper>
    </div>
  );
}
