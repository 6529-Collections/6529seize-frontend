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
  const activePartNumber =
    editingPartIndex === null ? parts.length + 1 : editingPartIndex + 1;

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
        className="tw-mb-3 tw-flex tw-flex-col tw-overflow-hidden tw-rounded-[20px] tw-border tw-border-solid tw-border-white/[0.08] tw-bg-[#151518]/95 tw-shadow-[0_20px_40px_-10px_rgba(0,0,0,0.9),inset_0_1px_0_0_rgba(255,255,255,0.05)] tw-backdrop-blur-2xl tw-transition-all tw-duration-300"
      >
        <header className="tw-flex tw-min-w-0 tw-items-center tw-justify-between tw-gap-3 tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-white/[0.04] tw-bg-white/[0.01] tw-px-5 tw-py-4">
          <div className="tw-flex tw-min-w-0 tw-items-center tw-gap-3">
            <span className="tw-flex tw-size-8 tw-flex-none tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-white/5 tw-text-zinc-300">
              <svg
                className="tw-size-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 6.75h16M4 12h12M4 17.25h8"
                />
                <path strokeLinecap="round" d="M19 14.75v5M16.5 17.25h5" />
              </svg>
            </span>
            <div className="tw-flex tw-min-w-0 tw-flex-wrap tw-items-center tw-gap-2">
              <h2
                id={headingId}
                className="tw-m-0 tw-text-sm tw-font-bold tw-text-white"
              >
                {t(locale, "waves.stormComposer.draftTitle")}
              </h2>
              <span className="tw-rounded-full tw-border tw-border-solid tw-border-white/5 tw-bg-white/10 tw-px-2 tw-py-0.5 tw-text-[10px] tw-font-bold tw-tabular-nums tw-text-zinc-300">
                {partsLabel}
              </span>
              <span className="tw-sr-only">
                {t(locale, "waves.stormComposer.privateDraftHint")}
              </span>
            </div>
          </div>
          {!isConfirmingDiscard && (
            <button
              ref={discardTriggerRef}
              type="button"
              onClick={() => setIsConfirmingDiscard(true)}
              disabled={controlsDisabled}
              className="tw-inline-flex tw-flex-none tw-items-center tw-justify-center tw-rounded-lg tw-border-0 tw-bg-transparent tw-px-3 tw-py-1.5 tw-text-xs tw-font-bold tw-text-zinc-400 tw-transition-colors focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 disabled:tw-cursor-not-allowed disabled:tw-opacity-40 desktop-hover:hover:tw-bg-white/5 desktop-hover:hover:tw-text-white"
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

        <ol className="tw-m-0 tw-flex tw-max-h-[40vh] tw-list-none tw-flex-col tw-gap-3 tw-overflow-y-auto tw-px-5 tw-py-4">
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
        <footer className="tw-flex tw-items-center tw-justify-between tw-gap-3 tw-bg-gradient-to-t tw-from-[#151518] tw-to-transparent tw-p-4 tw-pt-1">
          <span className="tw-inline-flex tw-min-w-0 tw-items-center tw-gap-1.5 tw-truncate tw-pl-[42px] tw-text-xs tw-font-semibold tw-text-zinc-500">
            <span
              aria-hidden="true"
              className={`tw-size-1.5 tw-flex-none tw-rounded-full ${
                editingPartIndex === null
                  ? "tw-bg-zinc-600"
                  : "tw-bg-primary-400"
              }`}
            />
            <span className="tw-truncate">
              {t(
                locale,
                editingPartIndex === null
                  ? "waves.stormComposer.nextPart"
                  : "waves.stormComposer.editingPart",
                { number: activePartNumber }
              )}
            </span>
          </span>
          {editingPartIndex !== null && (
            <button
              type="button"
              onClick={onCancelPartEdit}
              disabled={controlsDisabled}
              className="tw-inline-flex tw-h-8 tw-flex-none tw-items-center tw-justify-center tw-rounded-lg tw-border-0 tw-bg-transparent tw-px-2 tw-text-xs tw-font-semibold tw-text-zinc-400 tw-transition-colors focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 disabled:tw-cursor-not-allowed disabled:tw-opacity-40 desktop-hover:hover:tw-bg-white/[0.04] desktop-hover:hover:tw-text-white"
            >
              {t(locale, "waves.stormComposer.cancelEdit")}
            </button>
          )}
        </footer>
      </section>
    </LazyMotion>
  );
};

export default memo(CreateDropStormParts);
