import { AnimatePresence, LazyMotion, domAnimation, m } from "framer-motion";
import CircleLoader, {
  CircleLoaderSize,
} from "@/components/distribution-plan-tool/common/CircleLoader";
import type { ApiGroupFull } from "@/generated/models/ApiGroupFull";

export type CreateWaveGroupSearchResultsLayout = "popover" | "inline";

type HighlightedTextPart = {
  readonly isMatch: boolean;
  readonly startIndex: number;
  readonly value: string;
};

function getHighlightedTextParts(
  text: string,
  query: string
): readonly HighlightedTextPart[] {
  const trimmed = query.trim();
  if (!trimmed) {
    return [{ isMatch: false, startIndex: 0, value: text }];
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
        startIndex: partStartIndex,
        value: text.slice(partStartIndex, searchIndex),
      });
    }
    parts.push({ isMatch: true, startIndex: searchIndex, value: candidate });

    searchIndex += trimmed.length;
    partStartIndex = searchIndex;
  }

  if (partStartIndex < text.length) {
    parts.push({
      isMatch: false,
      startIndex: partStartIndex,
      value: text.slice(partStartIndex),
    });
  }

  return parts.length
    ? parts
    : [{ isMatch: false, startIndex: 0, value: text }];
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
      {parts.map((part) => (
        <span
          key={`${part.startIndex}-${part.value.length}-${
            part.isMatch ? "match" : "text"
          }`}
          className={part.isMatch ? "tw-text-primary-300" : "tw-text-inherit"}
        >
          {part.value}
        </span>
      ))}
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

function CreateWaveGroupSearchResultsList({
  isFetching,
  suggestions,
  selectedGroupId,
  activeIndex,
  listboxId,
  searchCriteria,
  showNoResults,
  helperText,
  onActiveIndexChange,
  onOptionSelect,
}: {
  readonly isFetching: boolean;
  readonly suggestions: readonly ApiGroupFull[];
  readonly selectedGroupId: string | null;
  readonly activeIndex: number;
  readonly listboxId: string;
  readonly searchCriteria: string;
  readonly showNoResults: boolean;
  readonly helperText: string;
  readonly onActiveIndexChange: (index: number) => void;
  readonly onOptionSelect: (group: ApiGroupFull) => void;
}) {
  if (isFetching) {
    return (
      <li
        role="option"
        aria-selected={false}
        aria-disabled="true"
        className="tw-flex tw-items-center tw-justify-center tw-py-4"
      >
        <div role="status" aria-live="polite">
          <span className="tw-sr-only">Loading groups</span>
          <CircleLoader size={CircleLoaderSize.SMALL} />
        </div>
      </li>
    );
  }

  if (suggestions.length > 0) {
    return (
      <>
        {suggestions.map((group, index) => (
          <CreateWaveGroupSearchResultOption
            key={group.id}
            group={group}
            index={index}
            listboxId={listboxId}
            searchCriteria={searchCriteria}
            isActive={index === activeIndex}
            isSelected={selectedGroupId === group.id}
            onHover={onActiveIndexChange}
            onSelect={onOptionSelect}
          />
        ))}
      </>
    );
  }

  return (
    <li
      role="option"
      aria-selected={false}
      aria-disabled="true"
      className="tw-relative tw-w-full tw-select-none tw-rounded-lg tw-px-4 tw-py-2 tw-text-sm tw-font-medium tw-text-white"
    >
      {showNoResults ? "No groups found" : helperText}
    </li>
  );
}

export default function CreateWaveGroupSearchResults({
  isOpen,
  disabled,
  layout = "popover",
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
  readonly layout?: CreateWaveGroupSearchResultsLayout;
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
  const wrapperClasses =
    layout === "inline"
      ? "tw-mt-1.5 tw-w-full tw-rounded-lg tw-bg-iron-800 tw-shadow-xl tw-ring-1 tw-ring-black tw-ring-opacity-5"
      : "tw-absolute tw-z-50 tw-mt-1.5 tw-w-full tw-rounded-lg tw-bg-iron-800 tw-shadow-xl tw-ring-1 tw-ring-black tw-ring-opacity-5";
  const panelClasses =
    layout === "inline"
      ? "tw-w-full tw-overflow-hidden tw-rounded-md tw-bg-iron-800 tw-shadow-2xl tw-ring-1 tw-ring-white/10"
      : "tw-absolute tw-w-full tw-overflow-hidden tw-rounded-md tw-bg-iron-800 tw-shadow-2xl tw-ring-1 tw-ring-white/10";

  return (
    <LazyMotion features={domAnimation}>
      <AnimatePresence mode="wait" initial={false}>
        {isOpen && !disabled && (
          <m.div
            className={wrapperClasses}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            <div className={panelClasses}>
              <div className="tw-flow-root tw-max-h-64 tw-overflow-y-auto tw-overflow-x-hidden tw-py-1">
                <ul
                  id={listboxId}
                  role="listbox"
                  className="tw-mx-0 tw-mb-0 tw-flex tw-list-none tw-flex-col tw-gap-y-1 tw-px-2"
                >
                  <CreateWaveGroupSearchResultsList
                    isFetching={isFetching}
                    suggestions={suggestions}
                    selectedGroupId={selectedGroup?.id ?? null}
                    activeIndex={activeIndex}
                    listboxId={listboxId}
                    searchCriteria={searchCriteria}
                    showNoResults={showNoResults}
                    helperText={helperText}
                    onActiveIndexChange={onActiveIndexChange}
                    onOptionSelect={onOptionSelect}
                  />
                </ul>
              </div>
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </LazyMotion>
  );
}
