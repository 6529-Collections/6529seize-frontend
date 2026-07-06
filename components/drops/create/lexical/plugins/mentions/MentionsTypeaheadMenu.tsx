"use client";

import { useKeyPressEvent } from "react-use";
import { useCallback, useEffect, useState } from "react";
import type { MentionTypeaheadOption } from "./MentionsPlugin";
import MentionsTypeaheadMenuItem from "./MentionsTypeaheadMenuItem";

export default function MentionsTypeaheadMenu({
  selectedIndex,
  options,
  setHighlightedIndex,
  selectOptionAndCleanUp,
  anchorElement,
}: {
  readonly selectedIndex: number | null;
  readonly options: MentionTypeaheadOption[];
  readonly setHighlightedIndex: (index: number) => void;
  readonly selectOptionAndCleanUp: (option: MentionTypeaheadOption) => void;
  readonly anchorElement: HTMLElement | null;
}) {
  const [position, setPosition] = useState<"top" | "bottom">("bottom");

  const updatePosition = useCallback(() => {
    if (globalThis.window === undefined || anchorElement === null) {
      return;
    }

    const visualViewport = globalThis.visualViewport;
    const viewportTop = visualViewport?.offsetTop ?? 0;
    const viewportHeight =
      visualViewport?.height ?? globalThis.window.innerHeight;
    const anchorRect = anchorElement.getBoundingClientRect();
    const spaceAbove = anchorRect.top - viewportTop;
    const spaceBelow = viewportTop + viewportHeight - anchorRect.bottom;
    const nextPosition: "top" | "bottom" =
      spaceBelow >= spaceAbove ? "bottom" : "top";

    setPosition((current) =>
      current === nextPosition ? current : nextPosition
    );
  }, [anchorElement]);

  useEffect(() => {
    if (globalThis.window === undefined || anchorElement === null) {
      return;
    }

    const win = globalThis.window;
    const doc = globalThis.document;
    const visualViewport = globalThis.visualViewport;
    const scrollListenerOptions = {
      passive: true,
    };
    const documentScrollListenerOptions = {
      passive: true,
      capture: true,
    };
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
    win.addEventListener("scroll", updatePosition, scrollListenerOptions);
    doc.addEventListener(
      "scroll",
      updatePosition,
      documentScrollListenerOptions
    );
    visualViewport?.addEventListener("resize", updatePosition);
    visualViewport?.addEventListener("scroll", updatePosition, {
      passive: true,
    });

    if (globalThis.ResizeObserver === undefined) {
      return () => {
        cancelInitialUpdate();
        win.removeEventListener("resize", updatePosition);
        win.removeEventListener("scroll", updatePosition);
        doc.removeEventListener("scroll", updatePosition, {
          capture: true,
        });
        visualViewport?.removeEventListener("resize", updatePosition);
        visualViewport?.removeEventListener("scroll", updatePosition);
      };
    }

    const resizeObserver = new globalThis.ResizeObserver(() => {
      updatePosition();
    });
    resizeObserver.observe(anchorElement);

    return () => {
      cancelInitialUpdate();
      win.removeEventListener("resize", updatePosition);
      win.removeEventListener("scroll", updatePosition);
      doc.removeEventListener("scroll", updatePosition, {
        capture: true,
      });
      visualViewport?.removeEventListener("resize", updatePosition);
      visualViewport?.removeEventListener("scroll", updatePosition);
      resizeObserver.disconnect();
    };
  }, [anchorElement, updatePosition]);

  useKeyPressEvent(" ", () => {
    if (typeof selectedIndex === "number" && options.length > 0) {
      setHighlightedIndex(selectedIndex);
      selectOptionAndCleanUp(options[selectedIndex]!);
    }
  });

  return (
    <div
      className={`tailwind-scope tw-absolute tw-z-50 tw-w-[20rem] tw-rounded-lg tw-bg-iron-800 tw-p-2 tw-shadow-xl tw-ring-1 tw-ring-black tw-ring-opacity-5 ${
        position === "top" ? "tw-bottom-full tw-mb-1" : "tw-top-full tw-mt-1"
      }`}
    >
      <ul className="tw-mx-0 tw-mb-0 tw-flex tw-list-none tw-flex-col tw-px-2">
        {options.map((option, i: number) => (
          <MentionsTypeaheadMenuItem
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
            handle={option.handle}
            display={option.display}
            picture={option.picture}
            setRefElement={option.setRefElement}
          />
        ))}
      </ul>
    </div>
  );
}
