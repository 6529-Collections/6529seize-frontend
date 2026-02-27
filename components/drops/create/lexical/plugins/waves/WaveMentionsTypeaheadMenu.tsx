"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
  const [position, setPosition] = useState<"top" | "bottom">("bottom");

  const updatePosition = useCallback(() => {
    if (globalThis.window === undefined) return;
    const win = globalThis.window;
    const element = menuRef.current;
    if (!element) return;
    const rect = element.getBoundingClientRect();
    const spaceAbove = rect.top;
    const spaceBelow = win.innerHeight - rect.bottom;
    const nextPosition: "top" | "bottom" =
      spaceBelow >= spaceAbove ? "bottom" : "top";

    setPosition((current) =>
      current === nextPosition ? current : nextPosition
    );
  }, []);

  useEffect(() => {
    if (globalThis.window === undefined) return;

    const win = globalThis.window;
    const cancelInitialUpdate =
      typeof win.requestAnimationFrame === "function"
        ? (() => {
            const frame = win.requestAnimationFrame(() => {
              updatePosition();
            });
            return () => {
              win.cancelAnimationFrame(frame);
            };
          })()
        : (() => {
            const timeout = win.setTimeout(() => {
              updatePosition();
            }, 0);
            return () => {
              win.clearTimeout(timeout);
            };
          })();

    win.addEventListener("resize", updatePosition);

    if (typeof ResizeObserver === "undefined") {
      return () => {
        cancelInitialUpdate();
        win.removeEventListener("resize", updatePosition);
      };
    }

    const resizeObserver = new ResizeObserver(() => {
      updatePosition();
    });
    const element = menuRef.current;
    if (element) {
      resizeObserver.observe(element);
    }

    return () => {
      cancelInitialUpdate();
      win.removeEventListener("resize", updatePosition);
      resizeObserver.disconnect();
    };
  }, [updatePosition]);

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
            setRefElement={(element) => {
              option.setRefElement(element);
            }}
          />
        ))}
      </ul>
    </div>
  );
}
