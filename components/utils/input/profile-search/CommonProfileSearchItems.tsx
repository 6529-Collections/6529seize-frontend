import { useEffect, useId } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { CommunityMemberMinimal } from "@/entities/IProfile";
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
  readonly highlightedIndex?: number | null | undefined;
  readonly onHighlightedOptionIdChange?:
    | ((optionId: string | undefined) => void)
    | undefined
    | undefined;
  readonly listboxId?: string | undefined;
}) {
  const generatedListboxId = useId();
  const resolvedListboxId = listboxId ?? generatedListboxId;
  const normalizedSelected = selected?.toLowerCase() ?? null;

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
        .replaceAll(/[^a-zA-Z0-9_-]+/g, "-")
        .replaceAll(/-+/g, "-")
        .replaceAll(/(^-|-$)/g, "") || "item";

    return `profile-search-item-${sanitized}-${index}`;
  };

  const optionMetadata = profiles.map((profile, index) => {
    const optionId = buildOptionId(profile, index);
    const identity = getSelectableIdentity(profile);

    return { profile, optionId, identity, index };
  });

  const highlightedOptionId =
    highlightedIndex !== null &&
    highlightedIndex >= 0 &&
    highlightedIndex < optionMetadata.length
      ? optionMetadata[highlightedIndex]?.optionId
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

  return (
    <AnimatePresence mode="wait" initial={false}>
      {open && (
        <motion.div
          className="tw-absolute tw-z-50 tw-mt-1.5 tw-w-full tw-rounded-lg tw-bg-iron-800 tw-shadow-xl tw-ring-1 tw-ring-black tw-ring-opacity-5"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
        >
          <div className="tw-absolute tw-w-full tw-overflow-hidden tw-rounded-md tw-bg-iron-800 tw-shadow-2xl tw-ring-1 tw-ring-white/10">
            <div className="tw-flow-root tw-overflow-y-auto tw-overflow-x-hidden tw-py-1">
              <ul
                id={resolvedListboxId}
                role="listbox"
                aria-label="Profile suggestions"
                className="tw-mx-0 tw-mb-0 tw-flex tw-list-none tw-flex-col tw-gap-y-1 tw-px-2"
              >
                {optionMetadata.length ? (
                  optionMetadata.map((meta) => {
                    const isOptionHighlighted = highlightedIndex === meta.index;
                    const isOptionSelected =
                      typeof meta.identity === "string" &&
                      normalizedSelected === meta.identity.toLowerCase();
                    return (
                      <CommonProfileSearchItem
                        key={meta.optionId}
                        id={meta.optionId}
                        profile={meta.profile}
                        isSelected={isOptionSelected}
                        isHighlighted={isOptionHighlighted}
                        onProfileSelect={onProfileSelect}
                      />
                    );
                  })
                ) : (
                  <li
                    id={`${resolvedListboxId}-empty`}
                    role="option"
                    aria-selected="false"
                    className="tw-relative tw-flex tw-h-full tw-w-full tw-select-none tw-items-center tw-justify-between tw-rounded-lg tw-px-2 tw-py-2 tw-text-sm tw-font-medium tw-text-white"
                  >
                    {noResultsText}
                  </li>
                )}
              </ul>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
