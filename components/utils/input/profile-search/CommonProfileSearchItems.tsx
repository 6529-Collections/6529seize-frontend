import { ChangeEvent, useEffect, useId } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CommunityMemberMinimal } from "@/entities/IProfile";
import CommonProfileSearchItem from "./CommonProfileSearchItem";
import { getSelectableIdentity } from "./getSelectableIdentity";

export default function CommonProfileSearchItems({
  open,
  profiles,
  selected,
  searchCriteria,
  onProfileSelect,
  highlightedIndex = null,
  onHighlightedOptionIdChange,
  listboxId,
}: {
  readonly open: boolean;
  readonly profiles: CommunityMemberMinimal[];
  readonly selected: string | null;
  readonly searchCriteria: string | null;
  readonly onProfileSelect: (newV: CommunityMemberMinimal | null) => void;
  readonly highlightedIndex?: number | null;
  readonly onHighlightedOptionIdChange?: (optionId: string | undefined) => void;
  readonly listboxId?: string;
}) {
  const generatedListboxId = useId();
  const resolvedListboxId = listboxId ?? generatedListboxId;

  const buildOptionId = (
    profile: CommunityMemberMinimal,
    index: number
  ): string => {
    const rawId =
      profile.wallet ??
      profile.primary_wallet ??
      profile.handle ??
      profile.display ??
      "";

    const sanitized =
      String(rawId)
        .trim()
        .replaceAll(/[^a-zA-Z0-9_-]/g, "-")
        .replaceAll(/-+/g, "-")
        .replaceAll(/(^-|-$)/g, "") || "item";

    return `profile-search-item-${sanitized}-${index}`;
  };

  const optionMetadata = profiles.map((profile, index) => {
    const optionId = buildOptionId(profile, index);
    const identity = getSelectableIdentity(profile);
    const label =
      profile.display ??
      profile.handle ??
      profile.primary_wallet ??
      profile.wallet ??
      `Profile ${index + 1}`;

    return { profile, optionId, identity, label, index };
  });

  const highlightedOptionId =
    highlightedIndex !== null &&
    highlightedIndex >= 0 &&
    highlightedIndex < optionMetadata.length
      ? optionMetadata[highlightedIndex].optionId
      : undefined;

  useEffect(() => {
    if (!onHighlightedOptionIdChange) {
      return;
    }
    if (!open) {
      onHighlightedOptionIdChange(undefined);
      return;
    }
    onHighlightedOptionIdChange(highlightedOptionId);
  }, [highlightedOptionId, onHighlightedOptionIdChange, open]);

  const noResultsText =
    !searchCriteria || searchCriteria.length < 3
      ? "Type at least 3 characters"
      : "No results";
  const visualListboxId =
    resolvedListboxId?.length ? `${resolvedListboxId}-visual` : undefined;

  const normalizedSelected = selected?.toLowerCase() ?? null;
  const selectedOptionId = normalizedSelected
    ? optionMetadata.find(
        (meta) => meta.identity?.toLowerCase() === normalizedSelected
      )?.optionId
    : undefined;

  const activeOptionId = highlightedOptionId ?? selectedOptionId ?? "";
  const selectSize = Math.min(Math.max(optionMetadata.length, 1), 10);
  const nativePlaceholderLabel = optionMetadata.length
    ? "Navigate the suggestion list with your arrow keys"
    : noResultsText;

  const handleNativeSelectChange = (
    event: ChangeEvent<HTMLSelectElement>
  ): void => {
    const nextOptionId = event.target.value;
    if (!nextOptionId.length) {
      onProfileSelect(null);
      return;
    }

    const nextProfile = optionMetadata.find(
      (meta) => meta.optionId === nextOptionId
    )?.profile;

    if (nextProfile) {
      onProfileSelect(nextProfile);
    }
  };

  return (
    <>
      <select
        id={resolvedListboxId}
        size={selectSize}
        tabIndex={-1}
        className="tw-sr-only"
        aria-label="Profile search results"
        value={activeOptionId}
        onChange={handleNativeSelectChange}
      >
        <option value="">{nativePlaceholderLabel}</option>
        {optionMetadata.map((meta) => (
          <option key={meta.optionId} id={meta.optionId} value={meta.optionId}>
            {meta.label}
          </option>
        ))}
      </select>
      <AnimatePresence mode="wait" initial={false}>
        {open && (
          <motion.div
            className="tw-absolute tw-z-50 tw-mt-1.5 tw-w-full tw-rounded-lg tw-shadow-xl tw-bg-iron-800 tw-ring-1 tw-ring-black tw-ring-opacity-5"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            <div className="tw-absolute tw-overflow-hidden tw-w-full tw-rounded-md tw-bg-iron-800 tw-shadow-2xl tw-ring-1 tw-ring-white/10">
              <div className="tw-py-1 tw-flow-root tw-overflow-x-hidden tw-overflow-y-auto">
                <ul
                  id={visualListboxId}
                  tabIndex={-1}
                  role="listbox"
                  className="tw-flex tw-flex-col tw-gap-y-1 tw-px-2 tw-mx-0 tw-mb-0 tw-list-none"
                >
                  {optionMetadata.length ? (
                    optionMetadata.map((meta) => {
                      const visualOptionId = `${meta.optionId}-visual`;
                      const isOptionHighlighted = highlightedIndex === meta.index;
                      return (
                        <CommonProfileSearchItem
                          key={meta.optionId}
                          id={visualOptionId}
                          profile={meta.profile}
                          selected={selected}
                          isHighlighted={isOptionHighlighted}
                          onProfileSelect={onProfileSelect}
                        />
                      );
                    })
                  ) : (
                    <li className="tw-py-2 tw-w-full tw-h-full tw-flex tw-items-center tw-justify-between tw-text-sm tw-font-medium tw-text-white tw-rounded-lg tw-relative tw-select-none tw-px-2">
                      {noResultsText}
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
