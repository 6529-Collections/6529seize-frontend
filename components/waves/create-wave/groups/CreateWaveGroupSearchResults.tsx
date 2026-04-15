import { AnimatePresence, motion } from "framer-motion";
import CircleLoader, {
  CircleLoaderSize,
} from "@/components/distribution-plan-tool/common/CircleLoader";
import type { ApiGroupFull } from "@/generated/models/ApiGroupFull";

type HighlightedTextPart = {
  readonly isMatch: boolean;
  readonly value: string;
};

function getHighlightedTextParts(
  text: string,
  query: string
): readonly HighlightedTextPart[] {
  const trimmed = query.trim();
  if (!trimmed) {
    return [{ isMatch: false, value: text }];
  }

  const parts: HighlightedTextPart[] = [];
  const lowerQuery = trimmed.toLowerCase();
  let partStartIndex = 0;
  let searchIndex = 0;

  while (searchIndex <= text.length - trimmed.length) {
    const candidate = text.slice(searchIndex, searchIndex + trimmed.length);
    if (candidate.toLowerCase() !== lowerQuery) {
      searchIndex += 1;
      continue;
    }

    if (partStartIndex < searchIndex) {
      parts.push({
        isMatch: false,
        value: text.slice(partStartIndex, searchIndex),
      });
    }
    parts.push({ isMatch: true, value: candidate });

    searchIndex += trimmed.length;
    partStartIndex = searchIndex;
  }

  if (partStartIndex < text.length) {
    parts.push({ isMatch: false, value: text.slice(partStartIndex) });
  }

  return parts.length ? parts : [{ isMatch: false, value: text }];
}

function HighlightedText({
  text,
  query,
}: {
  readonly text: string;
  readonly query: string;
}) {
  const trimmed = query.trim();
  if (!trimmed) {
    return <>{text}</>;
  }

  const parts = getHighlightedTextParts(text, trimmed);

  return (
    <>
      {parts.map((part, index) =>
        part.isMatch ? (
          <span key={`${part.value}-${index}`} className="tw-text-primary-300">
            {part.value}
          </span>
        ) : (
          <span key={`${part.value}-${index}`} className="tw-text-inherit">
            {part.value}
          </span>
        )
      )}
    </>
  );
}

function CreateWaveGroupSearchResultOption({
  group,
  index,
  listboxId,
  searchCriteria,
  isActive,
  isSelected,
  onHover,
  onSelect,
}: {
  readonly group: ApiGroupFull;
  readonly index: number;
  readonly listboxId: string;
  readonly searchCriteria: string;
  readonly isActive: boolean;
  readonly isSelected: boolean;
  readonly onHover: (index: number) => void;
  readonly onSelect: (group: ApiGroupFull) => void;
}) {
  const optionStateClasses =
    isActive || isSelected
      ? "tw-bg-iron-800 tw-text-white"
      : "tw-text-white hover:tw-bg-iron-800";

  return (
    <li
      id={`${listboxId}-option-${index}`}
      role="option"
      aria-selected={isSelected}
      className={`tw-relative tw-flex tw-w-full tw-select-none tw-items-center tw-justify-between tw-rounded-lg tw-px-2 tw-py-2 tw-text-sm tw-font-medium ${optionStateClasses}`}
      onMouseEnter={() => onHover(index)}
      onMouseDown={(event) => event.preventDefault()}
      onClick={() => onSelect(group)}
    >
      <div className="tw-flex tw-w-full tw-flex-col tw-gap-y-1">
        <span className="tw-truncate tw-text-sm tw-font-semibold tw-text-iron-50">
          <HighlightedText text={group.name} query={searchCriteria} />
        </span>
        <span className="tw-truncate tw-text-xs tw-text-iron-400">
          <HighlightedText
            text={`@${group.created_by.handle ?? "unknown"}`}
            query={searchCriteria}
          />
        </span>
      </div>
    </li>
  );
}

export default function CreateWaveGroupSearchResults({
  isOpen,
  disabled,
  listboxId,
  isFetching,
  suggestions,
  selectedGroup,
  activeIndex,
  searchCriteria,
  showNoResults,
  helperText,
  onActiveIndexChange,
  onOptionSelect,
}: {
  readonly isOpen: boolean;
  readonly disabled: boolean;
  readonly listboxId: string;
  readonly isFetching: boolean;
  readonly suggestions: readonly ApiGroupFull[];
  readonly selectedGroup: ApiGroupFull | null;
  readonly activeIndex: number;
  readonly searchCriteria: string;
  readonly showNoResults: boolean;
  readonly helperText: string;
  readonly onActiveIndexChange: (index: number) => void;
  readonly onOptionSelect: (group: ApiGroupFull) => void;
}) {
  function renderSearchResults() {
    if (isFetching) {
      return (
        <li className="tw-flex tw-items-center tw-justify-center tw-py-4">
          <CircleLoader size={CircleLoaderSize.SMALL} />
        </li>
      );
    }

    if (suggestions.length > 0) {
      return suggestions.map((group, index) => (
        <CreateWaveGroupSearchResultOption
          key={group.id}
          group={group}
          index={index}
          listboxId={listboxId}
          searchCriteria={searchCriteria}
          isActive={index === activeIndex}
          isSelected={selectedGroup?.id === group.id}
          onHover={onActiveIndexChange}
          onSelect={onOptionSelect}
        />
      ));
    }

    return (
      <li className="tw-relative tw-w-full tw-select-none tw-rounded-lg tw-px-4 tw-py-2 tw-text-sm tw-font-medium tw-text-white">
        {showNoResults ? "No groups found" : helperText}
      </li>
    );
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      {isOpen && !disabled && (
        <motion.div
          className="tw-absolute tw-z-50 tw-mt-1.5 tw-w-full tw-rounded-lg tw-bg-iron-800 tw-shadow-xl tw-ring-1 tw-ring-black tw-ring-opacity-5"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
        >
          <div className="tw-absolute tw-w-full tw-overflow-hidden tw-rounded-md tw-bg-iron-800 tw-shadow-2xl tw-ring-1 tw-ring-white/10">
            <div className="tw-flow-root tw-max-h-64 tw-overflow-y-auto tw-overflow-x-hidden tw-py-1">
              <ul
                id={listboxId}
                role="listbox"
                className="tw-mx-0 tw-mb-0 tw-flex tw-list-none tw-flex-col tw-gap-y-1 tw-px-2"
              >
                {renderSearchResults()}
              </ul>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
