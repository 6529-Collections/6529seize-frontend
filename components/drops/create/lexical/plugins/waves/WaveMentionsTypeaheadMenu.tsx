"use client";

import { useCallback, useRef, useSyncExternalStore } from "react";
import type { WaveMentionTypeaheadOption } from "./WaveMentionsPlugin";
import WaveMentionsTypeaheadMenuItem from "./WaveMentionsTypeaheadMenuItem";

export default function WaveMentionsTypeaheadMenu({
  selectedIndex,
  options,
  setHighlightedIndex,
  selectOptionAndCleanUp,
}: {
  readonly selectedIndex: number | null;
  readonly options: WaveMentionTypeaheadOption[];
  readonly setHighlightedIndex: (index: number) => void;
  readonly selectOptionAndCleanUp: (option: WaveMentionTypeaheadOption) => void;
}) {
  const menuRef = useRef<HTMLDivElement>(null);

  const getPositionSnapshot = useCallback(() => {
    if (typeof globalThis.window === "undefined") return "bottom";
    const win = globalThis.window;
    const element = menuRef.current;
    if (!element) return "bottom";
    const rect = element.getBoundingClientRect();
    const spaceAbove = rect.top;
    const spaceBelow = win.innerHeight - rect.bottom;
    return spaceBelow >= spaceAbove ? "bottom" : "top";
  }, []);

  const subscribeToPosition = useCallback((onStoreChange: () => void) => {
    if (typeof globalThis.window === "undefined") {
      return () => {};
    }
    const win = globalThis.window;
    const handleChange = () => onStoreChange();
    win.addEventListener("resize", handleChange);

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined" && menuRef.current) {
      resizeObserver = new ResizeObserver(handleChange);
      resizeObserver.observe(menuRef.current);
    }

    handleChange();

    return () => {
      win.removeEventListener("resize", handleChange);
      resizeObserver?.disconnect();
    };
  }, []);

  const position = useSyncExternalStore(
    subscribeToPosition,
    getPositionSnapshot,
    () => "bottom"
  );

  return (
    <div
      ref={menuRef}
      className={`tailwind-scope tw-absolute tw-z-50 tw-w-[20rem] tw-rounded-lg tw-bg-iron-800 tw-p-2 tw-shadow-xl tw-ring-1 tw-ring-black tw-ring-opacity-5 ${
        position === "top" ? "tw-bottom-full tw-mb-1" : "tw-top-full tw-mt-1"
      }`}
    >
      <ul className="tw-mx-0 tw-mb-0 tw-flex tw-list-none tw-flex-col tw-px-2">
        {options.map((option, i: number) => (
          <WaveMentionsTypeaheadMenuItem
            key={option.key}
            index={i}
            isSelected={selectedIndex === i}
            onClick={() => {
              setHighlightedIndex(i);
              selectOptionAndCleanUp(option);
            }}
            onMouseEnter={() => {
              setHighlightedIndex(i);
            }}
            name={option.name}
            picture={option.picture}
            setRefElement={(element) => option.setRefElement(element)}
          />
        ))}
      </ul>
    </div>
  );
}
