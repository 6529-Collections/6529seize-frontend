"use client";

import type { WaveMentionTypeaheadOption } from "./WaveMentionsPlugin";
import WaveMentionsTypeaheadMenuItem from "./WaveMentionsTypeaheadMenuItem";
import { useTypeaheadMenuPosition } from "../useTypeaheadMenuPosition";

export default function WaveMentionsTypeaheadMenu({
  selectedIndex,
  options,
  setHighlightedIndex,
  selectOptionAndCleanUp,
  anchorElement,
}: {
  readonly selectedIndex: number | null;
  readonly options: WaveMentionTypeaheadOption[];
  readonly setHighlightedIndex: (index: number) => void;
  readonly selectOptionAndCleanUp: (option: WaveMentionTypeaheadOption) => void;
  readonly anchorElement: HTMLElement;
}) {
  const position = useTypeaheadMenuPosition(anchorElement);

  return (
    <div
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
