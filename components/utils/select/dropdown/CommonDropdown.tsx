import { useEffect, useRef, useState } from "react";
import { useAnimate } from "framer-motion";
import { CommonSelectProps } from "../CommonSelect";
import CommonDropdownItemsWrapper from "./CommonDropdownItemsWrapper";
import CommonDropdownItem from "./CommonDropdownItem";
import { SortDirection } from "../../../../entities/ISort";
import CommonTableSortIcon from "../../../user/utils/icons/CommonTableSortIcon";

export default function CommonDropdown<T, U = unknown>(
  props: CommonSelectProps<T, U>
) {
  const {
    items,
    activeItem,
    noneLabel,
    filterLabel,
    setSelected,
    containerRef,
    renderItemChildren,
  } = props;
  const [isOpen, setIsOpen] = useState(false);
  const [iconScope, animateIcon] = useAnimate();

  useEffect(() => {
    if (isOpen) {
      animateIcon(iconScope.current, { rotate: 0 });
    } else {
      animateIcon(iconScope.current, { rotate: -90 });
    }
  }, [isOpen]);

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

  const buttonRef = useRef<HTMLButtonElement>(null);

  const getButtonPosition = () => {
    if (buttonRef.current) {
      const { bottom, right } = buttonRef.current.getBoundingClientRect();
      return { bottom, right };
    }
    return { bottom: 0, right: 0 };
  };

  const [buttonPosition, setButtonPosition] = useState(getButtonPosition());

  const onButtonPositionChange = () => {
    if (buttonRef.current) {
      setButtonPosition(getButtonPosition());
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    const container = containerRef?.current;
    if (container) {
      // Listen for scroll events on the parent container
      container.addEventListener("scroll", onButtonPositionChange);
      window.addEventListener("resize", onButtonPositionChange);
      onButtonPositionChange(); // Initial check

      // Cleanup
      return () => {
        container.removeEventListener("scroll", onButtonPositionChange);
        window.removeEventListener("resize", onButtonPositionChange);
      };
    } else {
      onButtonPositionChange();
    }
  }, [isOpen]);

  const [isMobile, setIsMobile] = useState<boolean>(false);

  return (
    <div>
      <div className="tw-relative">
        <button
          ref={buttonRef}
          type="button"
          aria-haspopup="true"
          onClick={() => setIsOpen(!isOpen)}
          className="tw-text-left tw-relative tw-block tw-whitespace-nowrap tw-rounded-lg tw-border-0 tw-py-2.5 tw-pl-3.5 tw-pr-10 tw-bg-iron-800 lg:tw-bg-iron-900 tw-text-iron-300 tw-font-semibold tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-700 
          focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 tw-text-sm hover:tw-bg-iron-800 tw-transition tw-duration-300 tw-ease-out tw-justify-between"
        >
          {label}
          {sortDirection && (
            <CommonTableSortIcon direction={sortDirection} isActive={true} />
          )}
          <div className="tw-pointer-events-none tw-absolute tw-inset-y-0 tw-right-0 tw-flex tw-items-center -tw-mr-1 tw-pr-3.5">
            <svg
              ref={iconScope}
              className="tw-h-5 tw-w-5 tw-text-white"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
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
        </button>
      </div>
      <CommonDropdownItemsWrapper
        isOpen={isOpen}
        setOpen={setIsOpen}
        buttonRef={buttonRef}
        buttonPosition={buttonPosition}
        filterLabel={filterLabel}
        onIsMobile={setIsMobile}
      >
        {Object.values(items).map((item, i) => (
          <CommonDropdownItem
            key={item.key}
            item={item}
            itemIdx={i}
            totalItems={items.length}
            activeItem={activeItem}
            sortDirection={sortDirection}
            isMobile={isMobile}
            setSelected={onSelect}
          >
            {renderItemChildren?.(item)}
          </CommonDropdownItem>
        ))}
      </CommonDropdownItemsWrapper>
    </div>
  );
}
