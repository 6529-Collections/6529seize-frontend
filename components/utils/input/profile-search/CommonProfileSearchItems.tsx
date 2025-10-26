import { useEffect } from "react";
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

  const highlightedOptionId =
    highlightedIndex !== null &&
    highlightedIndex >= 0 &&
    highlightedIndex < profiles.length
      ? buildOptionId(profiles[highlightedIndex], highlightedIndex)
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
    listboxId && listboxId.length ? `${listboxId}-visual` : undefined;

  const buildOptionValue = (
    profile: CommunityMemberMinimal,
    index: number
  ): string => {
    return (
      getSelectableIdentity(profile) ??
      profile.wallet ??
      profile.primary_wallet ??
      profile.handle ??
      profile.display ??
      buildOptionId(profile, index)
    );
  };

  return (
    <>
      {listboxId && (
        <datalist id={listboxId}>
          {profiles.map((profile, index) => {
            const optionValue = buildOptionValue(profile, index);
            if (!optionValue) {
              return null;
            }
            const optionId = buildOptionId(profile, index);
            const optionLabel = profile.display ?? profile.handle ?? optionValue;
            return (
              <option
                key={optionId}
                id={optionId}
                value={optionValue}
                label={optionLabel}
              />
            );
          })}
        </datalist>
      )}
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
                {/* Visual dropdown list; accessible semantics provided by the datalist */}
                <ul
                  id={visualListboxId}
                  tabIndex={-1}
                  className="tw-flex tw-flex-col tw-gap-y-1 tw-px-2 tw-mx-0 tw-mb-0 tw-list-none"
                >
                  {profiles.length ? (
                    profiles.map((profile, index) => {
                      const optionId = buildOptionId(profile, index);
                      const visualOptionId = `${optionId}-visual`;
                      return (
                        <CommonProfileSearchItem
                          key={optionId}
                          id={visualOptionId}
                          profile={profile}
                          selected={selected}
                          isHighlighted={highlightedIndex === index}
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
