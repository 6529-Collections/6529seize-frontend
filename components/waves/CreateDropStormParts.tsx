"use client";

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
import { memo, useEffect, useId, useRef, useState, type FC } from "react";
import CreateDropStormPart from "./CreateDropStormPart";

interface CreateDropStormPartsProps {
  readonly parts: CreateDropPart[];
  readonly mentionedUsers: ApiDropMentionedUser[];
  readonly mentionedGroups: ApiDropGroupMention[];
  readonly mentionedWaves: ApiMentionedWave[];
  readonly referencedNfts: ReferencedNft[];
  readonly editingPartIndex: number | null;
  readonly controlsDisabled: boolean;
  readonly canEditParts: boolean;
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
  controlsDisabled,
  canEditParts,
  onEditPart,
  onCancelPartEdit,
  onMovePart,
  onRemovePart,
  onDiscardStorm,
}) => {
  const locale = useBrowserLocale();
  const headingId = useId();
  const prefersReducedMotion = useReducedMotion();
  const [isConfirmingDiscard, setIsConfirmingDiscard] = useState(false);
  const [partsStatus, setPartsStatus] = useState("");
  const previousPartsCountRef = useRef(parts.length);
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
  useEffect(() => {
    if (previousPartsCountRef.current === parts.length) {
      return;
    }

    previousPartsCountRef.current = parts.length;
    setPartsStatus(partsLabel);
  }, [parts.length, partsLabel]);

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

  return (
    <LazyMotion features={domAnimation}>
      <section
        aria-labelledby={headingId}
        className="tw-mb-3 tw-flex tw-flex-col tw-overflow-hidden tw-rounded-xl tw-bg-iron-900/60 tw-shadow-lg tw-ring-1 tw-ring-white/[0.03] tw-transition-colors tw-duration-300"
      >
        <header className="tw-flex tw-min-w-0 tw-items-start tw-justify-between tw-gap-3 tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-white/[0.035] tw-px-3 tw-py-2.5 sm:tw-items-center sm:tw-px-4 sm:tw-py-3">
          <div className="tw-flex tw-min-w-0 tw-items-center tw-gap-3">
            <span className="tw-flex tw-size-8 tw-flex-none tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-solid tw-border-white/[0.06] tw-bg-white/[0.025] tw-text-iron-400">
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
            <div className="tw-flex tw-min-w-0 tw-flex-col tw-gap-0.5">
              <div className="tw-flex tw-min-w-0 tw-flex-wrap tw-items-center tw-gap-2">
                <h2
                  id={headingId}
                  className="tw-m-0 tw-text-sm tw-font-semibold tw-text-iron-100"
                >
                  {t(locale, "waves.stormComposer.draftTitle")}
                </h2>
                <span className="tw-rounded-full tw-bg-white/[0.045] tw-px-2 tw-py-0.5 tw-text-[10px] tw-font-medium tw-tabular-nums tw-text-iron-400">
                  {partsLabel}
                </span>
              </div>
              <p className="tw-m-0 tw-text-[11px] tw-leading-4 tw-text-iron-500 sm:tw-sr-only">
                {t(locale, "waves.stormComposer.privateDraftHint")}
              </p>
            </div>
          </div>
          {!isConfirmingDiscard && (
            <button
              ref={discardTriggerRef}
              type="button"
              onClick={() => setIsConfirmingDiscard(true)}
              disabled={controlsDisabled}
              className="tw-inline-flex tw-h-11 tw-flex-none tw-cursor-pointer tw-items-center tw-justify-center tw-rounded-lg tw-border-0 tw-bg-transparent tw-px-2.5 tw-text-xs tw-font-medium tw-text-iron-500 tw-transition-colors focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 disabled:tw-cursor-not-allowed disabled:tw-opacity-40 desktop-hover:hover:tw-bg-white/[0.035] desktop-hover:hover:tw-text-iron-200 sm:tw-h-auto sm:tw-py-1.5"
            >
              {t(locale, "waves.stormComposer.discard")}
            </button>
          )}
        </header>
        <span role="status" aria-live="polite" className="tw-sr-only">
          {partsStatus}
        </span>

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
                  <button
                    ref={keepDraftRef}
                    type="button"
                    onClick={handleKeepDraft}
                    className="tw-inline-flex tw-h-10 tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-solid tw-border-white/[0.08] tw-bg-white/[0.03] tw-px-3 tw-text-xs tw-font-semibold tw-text-iron-200 tw-transition-colors focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 desktop-hover:hover:tw-bg-white/[0.06]"
                  >
                    {t(locale, "waves.stormComposer.keepDraft")}
                  </button>
                  <button
                    type="button"
                    onClick={handleDiscard}
                    className="tw-inline-flex tw-h-10 tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-solid tw-border-error/40 tw-bg-error/10 tw-px-3 tw-text-xs tw-font-semibold tw-text-error tw-transition-colors focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-error desktop-hover:hover:tw-bg-error/15"
                  >
                    {t(locale, "waves.stormComposer.discardDraft")}
                  </button>
                </div>
              </div>
            </m.div>
          )}
        </AnimatePresence>

        <ol className="tw-m-0 tw-flex tw-max-h-[34dvh] tw-list-none tw-flex-col tw-divide-y tw-divide-white/[0.035] tw-overflow-y-auto tw-px-2 tw-py-1 sm:tw-max-h-[40vh]">
          <AnimatePresence mode="popLayout" initial={false}>
            {parts.map((part, partIndex) => (
              <m.li
                layout="position"
                key={getPartKey(part, partIndex)}
                initial={prefersReducedMotion ? false : { opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: prefersReducedMotion ? 0 : 0.18 }}
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
                  controlsDisabled={
                    controlsDisabled || editingPartIndex !== null
                  }
                  canEdit={canEditParts}
                  onEditPart={onEditPart}
                  onMovePart={onMovePart}
                  onRemovePart={onRemovePart}
                />
              </m.li>
            ))}
          </AnimatePresence>
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
