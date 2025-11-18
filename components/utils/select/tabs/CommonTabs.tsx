import { useCallback, useEffect, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import { CommonSelectProps } from "../CommonSelect";
import CommonTabsTab from "./CommonTabsTab";

export default function CommonTabs<T, U = unknown>(
  props: Readonly<CommonSelectProps<T, U>>
) {
  const {
    items,
    activeItem,
    setSelected,
    filterLabel,
  } = props;
  const sortDirection =
    "sortDirection" in props ? props.sortDirection : undefined;
  const disabled = "disabled" in props ? props.disabled ?? false : false;

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [showStartFade, setShowStartFade] = useState(false);
  const [showEndFade, setShowEndFade] = useState(false);

  useEffect(() => {
    tabRefs.current = tabRefs.current.slice(0, items.length);
  }, [items.length]);

  const updateFadeIndicators = useCallback(() => {
    const node = scrollContainerRef.current;
    if (!node) {
      setShowStartFade(false);
      setShowEndFade(false);
      return;
    }
    const { scrollLeft, scrollWidth, clientWidth } = node;
    setShowStartFade(scrollLeft > 0);
    setShowEndFade(scrollLeft + clientWidth < scrollWidth - 1);
  }, []);

  useEffect(() => {
    updateFadeIndicators();
  }, [updateFadeIndicators, activeItem, items]);

  useEffect(() => {
    const node = scrollContainerRef.current;
    if (!node) {
      return;
    }

    updateFadeIndicators();

    node.addEventListener("scroll", updateFadeIndicators);
    const canListenToGlobalResize =
      typeof globalThis.addEventListener === "function" &&
      typeof globalThis.removeEventListener === "function";
    if (canListenToGlobalResize) {
      globalThis.addEventListener("resize", updateFadeIndicators);
    }

    return () => {
      node.removeEventListener("scroll", updateFadeIndicators);
      if (canListenToGlobalResize) {
        globalThis.removeEventListener("resize", updateFadeIndicators);
      }
    };
  }, [updateFadeIndicators]);

  const focusTab = useCallback(
    (index: number) => {
      const total = items.length;
      if (!total) {
        return;
      }

      const normalizedIndex = ((index % total) + total) % total;
      const tab = tabRefs.current[normalizedIndex];
      tab?.focus();
    },
    [items.length],
  );

  const handleKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLButtonElement>, currentIndex: number) => {
      switch (event.key) {
        case "ArrowRight":
        case "Right": {
          event.preventDefault();
          focusTab(currentIndex + 1);
          break;
        }
        case "ArrowLeft":
        case "Left": {
          event.preventDefault();
          focusTab(currentIndex - 1);
          break;
        }
        case "Home": {
          event.preventDefault();
          focusTab(0);
          break;
        }
        case "End": {
          event.preventDefault();
          focusTab(items.length - 1);
          break;
        }
        default:
          break;
      }
    },
    [focusTab, items.length],
  );

  return (
    <div className="tw-relative tw-w-full">
      <div
        ref={scrollContainerRef}
        role="tablist"
        aria-label={filterLabel}
        aria-orientation="horizontal"
        className="tw-overflow-x-auto tw-scroll-smooth tw-scrollbar-thin tw-scrollbar-track-transparent tw-scrollbar-thumb-iron-700/60"
      >
        <div className="tw-flex tw-min-w-full tw-flex-nowrap tw-gap-x-1 tw-rounded-lg tw-bg-iron-950 tw-p-1 tw-ring-1 tw-ring-inset tw-ring-iron-700">
          {items.map((item, i) => (
            <CommonTabsTab
              key={item.key}
              item={item}
              itemIdx={i}
              totalItems={items.length}
              activeItem={activeItem}
              sortDirection={sortDirection}
              setSelected={setSelected}
              isMobile={false}
              onKeyDown={(event) => handleKeyDown(event, i)}
              buttonRef={(node) => {
                tabRefs.current[i] = node;
              }}
              disabled={disabled}
            />
          ))}
        </div>
      </div>
      {showStartFade && (
        <div className="tw-pointer-events-none tw-absolute tw-left-0 tw-top-0 tw-h-full tw-w-6 tw-bg-gradient-to-r tw-from-iron-950 tw-to-transparent" />
      )}
      {showEndFade && (
        <div className="tw-pointer-events-none tw-absolute tw-right-0 tw-top-0 tw-h-full tw-w-6 tw-bg-gradient-to-l tw-from-iron-950 tw-to-transparent" />
      )}
    </div>
  );
}
