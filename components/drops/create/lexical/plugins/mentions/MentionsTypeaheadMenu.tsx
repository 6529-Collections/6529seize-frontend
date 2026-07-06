"use client";

import { useKeyPressEvent } from "react-use";
import type { MentionTypeaheadOption } from "./MentionsPlugin";
import MentionsTypeaheadMenuItem from "./MentionsTypeaheadMenuItem";
import { useTypeaheadMenuPosition } from "../useTypeaheadMenuPosition";

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
  const position = useTypeaheadMenuPosition(anchorElement);

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
