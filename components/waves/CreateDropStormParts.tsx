"use client";

import Button from "@/components/utils/button/Button";
import type { CreateDropPart, ReferencedNft } from "@/entities/IDrop";
import type { ApiDropGroupMention } from "@/generated/models/ApiDropGroupMention";
import type { ApiDropMentionedUser } from "@/generated/models/ApiDropMentionedUser";
import type { ApiMentionedWave } from "@/generated/models/ApiMentionedWave";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatInteger } from "@/i18n/format";
import { t } from "@/i18n/messages";
import {
  AnimatePresence,
  domAnimation,
  LazyMotion,
  m,
  useReducedMotion,
} from "framer-motion";
import {
  memo,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type FC,
} from "react";
import CreateDropStormPart from "./CreateDropStormPart";

interface CreateDropStormPartsProps {
  readonly parts: CreateDropPart[];
  readonly mentionedUsers: ApiDropMentionedUser[];
  readonly mentionedGroups: ApiDropGroupMention[];
  readonly mentionedWaves: ApiMentionedWave[];
  readonly referencedNfts: ReferencedNft[];
  readonly editingPartIndex: number | null;
  readonly isCompactLayout?: boolean | undefined;
  readonly controlsDisabled: boolean;
  readonly canEditParts: boolean;
  readonly hasCurrentDraft: boolean;
  readonly onEditPart: (partIndex: number) => void;
  readonly onCancelPartEdit: () => void;
  readonly onMovePart: (partIndex: number, direction: -1 | 1) => void;
  readonly onRemovePart: (partIndex: number) => void;
  readonly onDiscardStorm: () => void;
}

const getPartKey = (part: CreateDropPart, index: number): string => {
  if (part.clientId) {
    return part.clientId;
  }
  if (part.id !== undefined) {
    return `${part.id}`;
  }
  if (part.quoted_drop) {
    return `quoted-${part.quoted_drop.drop_id}-${part.quoted_drop.drop_part_id}`;
  }
  return `part-${index}`;
};

const CreateDropStormParts: FC<CreateDropStormPartsProps> = ({
  parts,
  mentionedUsers,
  mentionedGroups,
  mentionedWaves,
  referencedNfts,
  editingPartIndex,
  isCompactLayout = false,
  controlsDisabled,
  canEditParts,
  hasCurrentDraft,
  onEditPart,
  onCancelPartEdit,
  onMovePart,
  onRemovePart,
  onDiscardStorm,
}) => {
  const locale = useBrowserLocale();
  const headingId = useId();
  const editBlockedHintId = useId();
  const prefersReducedMotion = useReducedMotion();
  const [isConfirmingDiscard, setIsConfirmingDiscard] = useState(false);
  const [partsStatus, setPartsStatus] = useState("");
  const previousPartsCountRef = useRef(parts.length);
  const previousScrolledPartsCountRef = useRef(parts.length);
  const partsListRef = useRef<HTMLOListElement>(null);
  const discardTriggerRef = useRef<HTMLButtonElement>(null);
  const keepDraftRef = useRef<HTMLButtonElement>(null);
  const shouldRestoreDiscardFocusRef = useRef(false);
  const pluralCategory = new Intl.PluralRules(locale).select(parts.length);
  const partsLabel = t(
    locale,
    pluralCategory === "one"
      ? "waves.stormComposer.partsCountOne"
      : "waves.stormComposer.partsCountOther",
    { count: formatInteger(locale, parts.length) }
  );
  const isPristineDraft = parts.length === 0 && !hasCurrentDraft;
  const showEditBlockedHint =
    parts.length > 0 &&
    editingPartIndex === null &&
    hasCurrentDraft &&
    !canEditParts;
  useEffect(() => {
    if (previousPartsCountRef.current === parts.length) {
      return;
    }

    previousPartsCountRef.current = parts.length;
    setPartsStatus(partsLabel);
  }, [parts.length, partsLabel]);

  useLayoutEffect(() => {
    const previousPartsCount = previousScrolledPartsCountRef.current;
    previousScrolledPartsCountRef.current = parts.length;
    if (parts.length <= previousPartsCount) {
      return;
    }

    const partsList = partsListRef.current;
    if (partsList) {
      partsList.scrollTo({
        top: partsList.scrollHeight,
        behavior: prefersReducedMotion ? "auto" : "smooth",
      });
    }
  }, [parts.length, prefersReducedMotion]);

  useEffect(() => {
    if (isConfirmingDiscard) {
      keepDraftRef.current?.focus();
      return;
    }

    if (shouldRestoreDiscardFocusRef.current) {
      shouldRestoreDiscardFocusRef.current = false;
      discardTriggerRef.current?.focus();
    }
  }, [isConfirmingDiscard]);

  const handleKeepDraft = () => {
    shouldRestoreDiscardFocusRef.current = true;
    setIsConfirmingDiscard(false);
  };

  const handleDiscard = () => {
    setIsConfirmingDiscard(false);
    onDiscardStorm();
  };

  const handleDiscardTrigger = () => {
    if (isPristineDraft) {
      onDiscardStorm();
      return;
    }
    setIsConfirmingDiscard(true);
  };

  return (
    <LazyMotion features={domAnimation}>
      <span role="status" aria-live="polite" className="tw-sr-only">
        {partsStatus}
      </span>
      <section
        aria-labelledby={headingId}
        className="create-drop-storm-surface -tw-mx-4 -tw-mt-2 tw-mb-3 tw-flex tw-min-h-0 tw-flex-col tw-border-b tw-border-l-2 tw-border-r-0 tw-border-t-0 tw-border-solid tw-border-iron-800 tw-bg-iron-900 tw-pb-2 tw-pl-3.5 tw-pr-4"
        style={{ borderLeftColor: "#406AFE" }}
      >
        <header className="tw-flex tw-min-w-0 tw-items-center tw-justify-between tw-gap-3 tw-px-0 tw-py-2.5 sm:tw-py-3">
          <div className="tw-flex tw-min-w-0 tw-items-center tw-gap-2">
            <span className="tw-flex tw-h-8 tw-w-4 tw-flex-none tw-items-center tw-text-primary-300">
              <svg
                className="tw-size-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 4H3M20 8H6M18 12H9M15 16H8M17 20H12"
                />
              </svg>
            </span>
            <div className="tw-flex tw-min-w-0 tw-flex-wrap tw-items-center tw-gap-2">
              <h2
                id={headingId}
                className="tw-m-0 tw-text-sm tw-font-semibold tw-text-iron-300"
              >
                {t(locale, "waves.stormComposer.draftTitle")}
              </h2>
              <span className="tw-text-primary-200 tw-rounded-full tw-bg-primary-500/15 tw-px-2 tw-py-0.5 tw-text-[10px] tw-font-medium tw-tabular-nums">
                {partsLabel}
              </span>
            </div>
          </div>
          {!isConfirmingDiscard && (
            <button
              ref={discardTriggerRef}
              type="button"
              onClick={handleDiscardTrigger}
              disabled={controlsDisabled}
              className={`tw-inline-flex tw-h-11 tw-flex-none tw-cursor-pointer tw-items-center tw-justify-center tw-gap-1 tw-rounded-lg tw-border-0 tw-bg-transparent tw-px-2.5 tw-text-xs tw-font-medium tw-text-iron-400 tw-transition-colors focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 disabled:tw-cursor-not-allowed disabled:tw-opacity-40 sm:tw-h-auto sm:tw-py-1.5 ${
                isPristineDraft
                  ? "desktop-hover:hover:tw-bg-white/[0.035] desktop-hover:hover:tw-text-iron-200"
                  : "desktop-hover:hover:tw-bg-error/[0.06] desktop-hover:hover:tw-text-error"
              }`}
            >
              {isPristineDraft && (
                <svg
                  className="tw-size-3.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 6l12 12M18 6L6 18"
                  />
                </svg>
              )}
              {t(
                locale,
                isPristineDraft
                  ? "waves.stormComposer.closeDraft"
                  : "waves.stormComposer.discard"
              )}
            </button>
          )}
        </header>
        <AnimatePresence initial={false}>
          {isConfirmingDiscard && (
            <m.div
              initial={prefersReducedMotion ? false : { opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.18 }}
              role="alert"
              className="tw-overflow-hidden"
            >
              <div className="tw-flex tw-flex-col tw-gap-3 tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-white/[0.045] tw-bg-error/[0.035] tw-px-3 tw-py-3 sm:tw-flex-row sm:tw-items-center sm:tw-justify-between sm:tw-px-3.5">
                <p className="tw-m-0 tw-text-sm tw-leading-5 tw-text-iron-200">
                  {t(locale, "waves.stormComposer.discardConfirmation")}
                </p>
                <div className="tw-flex tw-flex-none tw-items-center tw-justify-end tw-gap-2">
                  <Button
                    ref={keepDraftRef}
                    type="button"
                    onClick={handleKeepDraft}
                    variant="secondary"
                    size="md"
                  >
                    {t(locale, "waves.stormComposer.keepDraft")}
                  </Button>
                  <Button
                    type="button"
                    onClick={handleDiscard}
                    variant="destructive"
                    size="md"
                  >
                    {t(locale, "waves.stormComposer.discardDraft")}
                  </Button>
                </div>
              </div>
            </m.div>
          )}
        </AnimatePresence>

        {showEditBlockedHint && (
          <p
            id={editBlockedHintId}
            className={
              isCompactLayout
                ? "tw-m-0 tw-px-1 tw-pb-1.5 tw-text-[11px] tw-leading-4 tw-text-iron-400"
                : "tw-sr-only"
            }
          >
            {t(locale, "waves.stormComposer.finishCurrentPartBeforeEditing")}
          </p>
        )}

        <ol
          ref={partsListRef}
          className="tw-m-0 tw-flex tw-max-h-[30dvh] tw-min-h-0 tw-flex-1 tw-list-none tw-flex-col tw-gap-2 tw-overflow-y-auto tw-px-0 tw-py-1 sm:tw-max-h-[40vh]"
        >
          {parts.length === 0 && (
            <li className="tw-flex tw-min-h-14 tw-items-center tw-rounded-xl tw-bg-white/[0.025] tw-px-3 tw-py-3">
              <p className="tw-m-0 tw-text-sm tw-leading-5 tw-text-iron-500">
                {t(locale, "waves.stormComposer.emptyDraft")}
              </p>
            </li>
          )}
          {parts.map((part, partIndex) => (
            <m.li
              layout={prefersReducedMotion ? false : "position"}
              key={getPartKey(part, partIndex)}
              transition={{
                layout: { duration: 0.2, ease: [0.2, 0, 0, 1] },
              }}
            >
              <CreateDropStormPart
                partIndex={partIndex}
                partsCount={parts.length}
                part={part}
                mentionedUsers={mentionedUsers}
                mentionedGroups={mentionedGroups}
                mentionedWaves={mentionedWaves}
                referencedNfts={referencedNfts}
                isEditing={editingPartIndex === partIndex}
                controlsDisabled={controlsDisabled || editingPartIndex !== null}
                canEdit={canEditParts}
                editDisabledDescriptionId={
                  showEditBlockedHint ? editBlockedHintId : undefined
                }
                onEditPart={onEditPart}
                onMovePart={onMovePart}
                onRemovePart={onRemovePart}
              />
            </m.li>
          ))}
        </ol>
        {editingPartIndex !== null && (
          <footer className="tw-flex tw-items-center tw-justify-between tw-gap-3 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/[0.025] tw-bg-black/10 tw-px-3 tw-py-2.5 sm:tw-px-4 sm:tw-py-3">
            <span className="tw-truncate tw-text-xs tw-font-medium tw-text-iron-500 sm:tw-pl-10">
              {t(locale, "waves.stormComposer.editingPart", {
                number: editingPartIndex + 1,
              })}
            </span>
            <button
              type="button"
              onClick={onCancelPartEdit}
              disabled={controlsDisabled}
              className="tw-inline-flex tw-h-11 tw-flex-none tw-items-center tw-justify-center tw-rounded-lg tw-border-0 tw-bg-transparent tw-px-2 tw-text-xs tw-font-medium tw-text-iron-500 tw-transition-colors focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 disabled:tw-cursor-not-allowed disabled:tw-opacity-40 desktop-hover:hover:tw-bg-white/[0.035] desktop-hover:hover:tw-text-iron-200 sm:tw-h-8"
            >
              {t(locale, "waves.stormComposer.cancelEdit")}
            </button>
          </footer>
        )}
      </section>
    </LazyMotion>
  );
};

export default memo(CreateDropStormParts);
