import { useCallback, useEffect, useRef, useState } from "react";
import clsx from "clsx";
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
  const tabRefs = useRef<Map<string, HTMLButtonElement | null>>(new Map());
  const [showStartFade, setShowStartFade] = useState(false);
  const [showEndFade, setShowEndFade] = useState(false);

  useEffect(() => {
    const keysToKeep = new Set(items.map((item) => item.key));
    const staleKeys: string[] = [];

    tabRefs.current.forEach((_, key) => {
      if (!keysToKeep.has(key)) {
        staleKeys.push(key);
      }
    });

    staleKeys.forEach((key) => tabRefs.current.delete(key));
  }, [items]);

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
    if (globalThis.window !== undefined) {
      globalThis.window.addEventListener("resize", updateFadeIndicators);
    }

    return () => {
      if (node) {
        node.removeEventListener("scroll", updateFadeIndicators);
      }
      if (globalThis.window !== undefined) {
        globalThis.window.removeEventListener("resize", updateFadeIndicators);
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
      const targetItem = items[normalizedIndex];
      if (!targetItem) {
        return;
      }

      const tab = tabRefs.current.get(targetItem.key);
      tab?.focus();
    },
    [items],
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
        aria-label={filterLabel ?? "Filter options"}
        aria-orientation="horizontal"
        className="tw-overflow-x-auto tw-scroll-smooth tw-scrollbar-thin tw-scrollbar-track-transparent tw-scrollbar-thumb-iron-700/60 horizontal-menu-hide-scrollbar"
      >
        <div className={clsx(
          "tw-flex tw-flex-nowrap tw-gap-x-1 tw-rounded-lg tw-bg-iron-950 tw-p-1 tw-ring-1 tw-ring-inset tw-ring-iron-700",
          props.fill ?? true ? "tw-min-w-full" : "tw-w-fit"
        )}>
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
                if (!node) {
                  tabRefs.current.delete(item.key);
                  return;
                }

                tabRefs.current.set(item.key, node);
              }}
              disabled={disabled}
              fill={props.fill ?? true}
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
