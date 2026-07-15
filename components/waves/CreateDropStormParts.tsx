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
        className="tw-mb-3 tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-white/[0.06] tw-bg-black/20 tw-shadow-[0_10px_32px_rgba(0,0,0,0.14)] tw-ring-1 tw-ring-inset tw-ring-white/[0.02]"
      >
        <header className="tw-flex tw-min-w-0 tw-items-center tw-justify-between tw-gap-3 tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-white/[0.045] tw-bg-white/[0.018] tw-px-3 tw-py-2.5 sm:tw-px-3.5">
          <div className="tw-flex tw-min-w-0 tw-items-center tw-gap-3">
            <span className="tw-hidden tw-size-8 tw-flex-none tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-solid tw-border-white/[0.05] tw-bg-black/25 tw-text-iron-400 sm:tw-flex">
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
            <div className="tw-min-w-0">
              <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-x-2 tw-gap-y-1">
                <h2
                  id={headingId}
                  className="tw-m-0 tw-text-sm tw-font-semibold tw-text-iron-100"
                >
                  {t(locale, "waves.stormComposer.draftTitle")}
                </h2>
                <span className="tw-rounded-full tw-border tw-border-solid tw-border-white/[0.05] tw-bg-black/20 tw-px-2 tw-py-0.5 tw-text-[10px] tw-font-medium tw-tabular-nums tw-text-iron-500">
                  {partsLabel}
                </span>
              </div>
              <p className="tw-mb-0 tw-mt-0.5 tw-flex tw-items-center tw-gap-1.5 tw-text-[11px] tw-leading-4 tw-text-iron-500">
                <svg
                  className="tw-size-3 tw-flex-none"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16.5 10.5V6.75a4.5 4.5 0 0 0-9 0v3.75m-.75 0h10.5c.621 0 1.125.504 1.125 1.125v8.25c0 .621-.504 1.125-1.125 1.125H6.75a1.125 1.125 0 0 1-1.125-1.125v-8.25c0-.621.504-1.125 1.125-1.125Z"
                  />
                </svg>
                <span>{t(locale, "waves.stormComposer.privateDraftHint")}</span>
              </p>
            </div>
          </div>
          {!isConfirmingDiscard && (
            <button
              ref={discardTriggerRef}
              type="button"
              onClick={() => setIsConfirmingDiscard(true)}
              disabled={controlsDisabled}
              className="tw-inline-flex tw-h-9 tw-flex-none tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-solid tw-border-transparent tw-bg-transparent tw-px-2.5 tw-text-[11px] tw-font-semibold tw-text-iron-500 tw-transition-colors focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 disabled:tw-cursor-not-allowed disabled:tw-opacity-40 desktop-hover:hover:tw-border-white/5 desktop-hover:hover:tw-bg-white/[0.035] desktop-hover:hover:tw-text-iron-200"
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

        <ol className="tw-m-0 tw-flex tw-list-none tw-flex-col tw-gap-1.5 tw-p-2 sm:tw-p-3">
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
      </section>
    </LazyMotion>
  );
};

export default memo(CreateDropStormParts);
