import { useCallback, useEffect, useRef, useState } from "react";
import clsx from "clsx";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import type { CommonSelectItem, CommonSelectProps } from "../CommonSelect";
import CommonTabsTab, { type CommonTabsActiveTone } from "./CommonTabsTab";

type CommonTabsProps<T, U> = CommonSelectProps<T, U> & {
  readonly isItemDisabled?:
    | ((item: CommonSelectItem<T, U>) => boolean)
    | undefined;
  readonly activeTone?: CommonTabsActiveTone | undefined;
};

export default function CommonTabs<T, U = unknown>(
  props: Readonly<CommonTabsProps<T, U>>
) {
  const {
    items,
    activeItem,
    setSelected,
    filterLabel,
    fill = true,
    isItemDisabled: isItemDisabledProp,
  } = props;
  const sortDirection =
    "sortDirection" in props ? props.sortDirection : undefined;
  const disabled = "disabled" in props ? (props.disabled ?? false) : false;
  const size = "size" in props ? props.size : undefined;
  const activeTone = props.activeTone ?? "neutral";
  const isItemDisabled = useCallback(
    (item: CommonSelectItem<T, U>) =>
      disabled || isItemDisabledProp?.(item) === true,
    [disabled, isItemDisabledProp]
  );

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const tabRefs = useRef<Map<string, HTMLButtonElement | null>>(new Map());
  const [showStartFade, setShowStartFade] = useState(false);
  const [showEndFade, setShowEndFade] = useState(false);

  const updateFadeIndicators = useCallback(() => {
    const node = scrollContainerRef.current;
    if (node === null) {
      return;
    }
    const { scrollLeft, scrollWidth, clientWidth } = node;
    setShowStartFade(scrollLeft > 0);
    setShowEndFade(scrollLeft + clientWidth < scrollWidth - 1);
  }, []);

  useEffect(() => {
    const frameId = globalThis.requestAnimationFrame(updateFadeIndicators);
    return () => globalThis.cancelAnimationFrame(frameId);
  }, [updateFadeIndicators, activeItem, items]);

  useEffect(() => {
    const node = scrollContainerRef.current;
    if (node === null) {
      return undefined;
    }

    const frameId = globalThis.requestAnimationFrame(updateFadeIndicators);
    node.addEventListener("scroll", updateFadeIndicators, { passive: true });
    globalThis.window.addEventListener("resize", updateFadeIndicators);

    return () => {
      globalThis.cancelAnimationFrame(frameId);
      node.removeEventListener("scroll", updateFadeIndicators);
      globalThis.window.removeEventListener("resize", updateFadeIndicators);
    };
  }, [updateFadeIndicators]);

  const focusTab = useCallback(
    (index: number, step: 1 | -1) => {
      const total = items.length;
      if (total === 0 || disabled) {
        return undefined;
      }

      for (let offset = 0; offset < total; offset += 1) {
        const candidateIndex = index + offset * step;
        const normalizedIndex = ((candidateIndex % total) + total) % total;
        const targetItem = items[normalizedIndex];
        if (!targetItem || isItemDisabled(targetItem)) {
          continue;
        }

        const tab = tabRefs.current.get(targetItem.key);
        tab?.focus();
        return targetItem;
      }

      return undefined;
    },
    [disabled, isItemDisabled, items]
  );

  const focusAndSelectTab = useCallback(
    (index: number, step: 1 | -1) => {
      const targetItem = focusTab(index, step);
      if (!targetItem || targetItem.value === activeItem) {
        return;
      }

      setSelected(targetItem.value);
    },
    [activeItem, focusTab, setSelected]
  );

  const handleKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLButtonElement>, currentIndex: number) => {
      switch (event.key) {
        case "ArrowRight":
        case "Right": {
          event.preventDefault();
          focusAndSelectTab(currentIndex + 1, 1);
          break;
        }
        case "ArrowLeft":
        case "Left": {
          event.preventDefault();
          focusAndSelectTab(currentIndex - 1, -1);
          break;
        }
        case "Home": {
          event.preventDefault();
          focusAndSelectTab(0, 1);
          break;
        }
        case "End": {
          event.preventDefault();
          focusAndSelectTab(items.length - 1, -1);
          break;
        }
        default:
          break;
      }
    },
    [focusAndSelectTab, items.length]
  );

  return (
    <div className="tw-relative tw-w-full">
      <div
        ref={scrollContainerRef}
        role="tablist"
        aria-label={filterLabel}
        aria-orientation="horizontal"
        className="tw-no-scrollbar tw-overflow-x-auto tw-scroll-smooth tw-scrollbar-thin tw-scrollbar-track-transparent tw-scrollbar-thumb-iron-700/60"
      >
        <div
          className={clsx(
            "tw-flex tw-flex-nowrap tw-gap-x-1 tw-rounded-lg tw-bg-iron-950 tw-p-1 tw-ring-1 tw-ring-inset tw-ring-iron-800",
            fill ? "tw-min-w-full" : "tw-w-fit"
          )}
        >
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
              disabled={isItemDisabled(item)}
              fill={fill}
              size={size}
              activeTone={activeTone}
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
