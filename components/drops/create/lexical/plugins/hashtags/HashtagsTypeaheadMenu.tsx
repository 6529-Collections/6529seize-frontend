"use client";

import { useKeyPressEvent } from "react-use";
import { useCallback, useEffect, useRef, useState } from "react";
import type { HashtagsTypeaheadOption } from "./HashtagsPlugin";
import HashtagsTypeaheadMenuItem from "./HashtagsTypeaheadMenuItem";

export default function HashtagsTypeaheadMenu({
  selectedIndex,
  options,
  setHighlightedIndex,
  selectOptionAndCleanUp,
}: {
  readonly selectedIndex: number | null;
  readonly options: HashtagsTypeaheadOption[];
  readonly setHighlightedIndex: (index: number) => void;
  readonly selectOptionAndCleanUp: (option: HashtagsTypeaheadOption) => void;
}) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<"top" | "bottom">("bottom");

  const updatePosition = useCallback(() => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const spaceAbove = rect.top;
      const spaceBelow = window.innerHeight - rect.bottom;
      setPosition(spaceBelow >= spaceAbove ? "bottom" : "top");
    }
  }, []);

  useEffect(() => {
    updatePosition();
    window.addEventListener("resize", updatePosition);
    return () => window.removeEventListener("resize", updatePosition);
  }, [updatePosition]);

  useKeyPressEvent(" ", () => {
    if (typeof selectedIndex === "number" && options.length > 0) {
      setHighlightedIndex(selectedIndex);
      selectOptionAndCleanUp(options[selectedIndex]!);
    }
  });

  return (
    <div
      ref={menuRef}
      className={`tailwind-scope tw-absolute tw-z-50 tw-min-w-[17.4rem] tw-rounded-lg tw-shadow-xl tw-bg-iron-800 tw-ring-1 tw-ring-black tw-ring-opacity-5 tw-p-2 ${
        position === "top" ? "tw-bottom-full tw-mb-1" : "tw-top-full tw-mt-1"
      }`}>
      <ul className="tw-flex tw-flex-col tw-px-2 tw-mx-0 tw-mb-0 tw-list-none">
        {options.map((option, i: number) => (
          <HashtagsTypeaheadMenuItem
            index={i}
            isSelected={selectedIndex === i}
            onClick={() => {
              setHighlightedIndex(i);
              selectOptionAndCleanUp(option);
            }}
            onMouseEnter={() => {
              setHighlightedIndex(i);
            }}
            key={option.key}
            option={option}
          />
        ))}
      </ul>
    </div>
  );
}
