import { useKeyPressEvent } from "react-use";
import { HashtagsTypeaheadOption } from "./HashtagsPlugin";
import HashtagsTypeaheadMenuItem from "./HashtagsTypeaheadMenuItem";

export default function HastahsTypeaheadMenu({
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
  useKeyPressEvent(" ", () => {
    if (typeof selectedIndex === "number" && options.length > 0) {
      setHighlightedIndex(selectedIndex);
      selectOptionAndCleanUp(options[selectedIndex]);
    }
  });
  return (
    <div className="tailwind-scope tw-absolute tw-z-50 tw-mt-1 tw-min-w-[17.4rem] tw-rounded-lg tw-shadow-xl tw-bg-iron-800 tw-ring-1 tw-ring-black tw-ring-opacity-5 tw-p-2">
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
