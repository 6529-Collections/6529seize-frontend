"use client";

import type { CreateDropPart, ReferencedNft } from "@/entities/IDrop";
import type { ApiDropGroupMention } from "@/generated/models/ApiDropGroupMention";
import type { ApiDropMentionedUser } from "@/generated/models/ApiDropMentionedUser";
import type { ApiMentionedWave } from "@/generated/models/ApiMentionedWave";
import { useObjectUrls } from "@/hooks/useObjectUrl";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import type React from "react";
import DropPartMarkdown from "../drops/view/part/DropPartMarkdown";

interface CreateDropStormPartProps {
  readonly partIndex: number;
  readonly partsCount: number;
  readonly part: CreateDropPart;
  readonly mentionedUsers: ApiDropMentionedUser[];
  readonly mentionedGroups: ApiDropGroupMention[];
  readonly mentionedWaves: ApiMentionedWave[];
  readonly referencedNfts: ReferencedNft[];
  readonly isEditing: boolean;
  readonly controlsDisabled: boolean;
  readonly canEdit: boolean;
  readonly onEditPart: (partIndex: number) => void;
  readonly onMovePart: (partIndex: number, direction: -1 | 1) => void;
  readonly onRemovePart: (partIndex: number) => void;
}

const StormPartMedia: React.FC<{ readonly files: File[] }> = ({ files }) => {
  const mediaUrls = useObjectUrls(files);

  if (files.length === 0) {
    return null;
  }

  return (
    <ul className="tw-m-0 tw-mt-3 tw-flex tw-list-none tw-flex-wrap tw-gap-2 tw-p-0">
      {files.map((file, index) => {
        const mediaUrl = mediaUrls[index];
        const key = `${file.name}-${file.size}-${file.lastModified}-${index}`;
        return (
          <li
            key={key}
            className="tw-flex tw-h-16 tw-min-w-0 tw-max-w-40 tw-items-center tw-overflow-hidden tw-rounded-lg tw-border tw-border-solid tw-border-white/5 tw-bg-black/30"
          >
            {file.type.startsWith("image/") && mediaUrl ? (
              <img
                src={mediaUrl}
                alt={file.name}
                className="tw-h-full tw-w-16 tw-flex-none tw-object-cover"
              />
            ) : (
              <svg
                className="tw-ml-3 tw-size-5 tw-flex-none tw-text-iron-400"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5A3.375 3.375 0 0 0 10.125 2.25H8.25m0 12.75h7.5m-7.5 3h4.5M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.625a9 9 0 0 0-9-9Z"
                />
              </svg>
            )}
            <span
              title={file.name}
              className="tw-min-w-0 tw-truncate tw-px-3 tw-text-xs tw-font-medium tw-text-iron-300"
            >
              {file.name}
            </span>
          </li>
        );
      })}
    </ul>
  );
};

const CreateDropStormPart: React.FC<CreateDropStormPartProps> = ({
  partIndex,
  partsCount,
  part,
  mentionedUsers,
  mentionedGroups,
  mentionedWaves,
  referencedNfts,
  isEditing,
  controlsDisabled,
  canEdit,
  onEditPart,
  onMovePart,
  onRemovePart,
}) => {
  const locale = useBrowserLocale();
  const partNumber = partIndex + 1;
  const editDisabled = controlsDisabled || !canEdit;
  const editTitle = canEdit
    ? t(locale, "waves.stormComposer.editPart", { number: partNumber })
    : t(locale, "waves.stormComposer.finishCurrentPartBeforeEditing");
  const iconButtonClass =
    "tw-inline-flex tw-size-10 tw-flex-none tw-items-center tw-justify-center tw-rounded-lg tw-border-0 tw-bg-transparent tw-text-iron-400 tw-transition-colors focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 disabled:tw-cursor-not-allowed disabled:tw-opacity-35 desktop-hover:hover:tw-bg-white/5 desktop-hover:hover:tw-text-iron-100";

  return (
    <article
      className={`tw-rounded-lg tw-border tw-border-solid tw-p-3 tw-transition-colors sm:tw-p-4 ${
        isEditing
          ? "tw-border-primary-400/40 tw-bg-primary-500/[0.06]"
          : "tw-border-white/5 tw-bg-white/[0.025]"
      }`}
      aria-label={t(locale, "waves.stormComposer.part", {
        number: partNumber,
      })}
    >
      <div className="tw-flex tw-min-w-0 tw-items-start tw-justify-between tw-gap-2">
        <div className="tw-flex tw-min-w-0 tw-items-center tw-gap-2 tw-pt-1">
          <span className="tw-inline-flex tw-h-6 tw-min-w-6 tw-items-center tw-justify-center tw-rounded-full tw-bg-white/[0.06] tw-px-2 tw-text-[11px] tw-font-semibold tw-tabular-nums tw-text-iron-300">
            {partNumber}
          </span>
          <span className="tw-hidden tw-text-xs tw-font-medium tw-text-iron-400 sm:tw-inline">
            {t(locale, "waves.stormComposer.part", { number: partNumber })}
          </span>
          {isEditing && (
            <span className="tw-text-primary-200 tw-rounded-full tw-bg-primary-500/15 tw-px-2 tw-py-1 tw-text-[11px] tw-font-semibold">
              {t(locale, "waves.stormComposer.editing")}
            </span>
          )}
        </div>
        <div className="tw-flex tw-flex-none tw-items-center tw-gap-0.5">
          <button
            type="button"
            onClick={() => onEditPart(partIndex)}
            disabled={editDisabled}
            aria-label={editTitle}
            title={editTitle}
            className={`${iconButtonClass} tw-w-auto tw-gap-1.5 tw-px-2.5`}
          >
            <svg
              className="tw-size-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931ZM19.5 7.125 16.875 4.5M18 14.25v4.125c0 .621-.504 1.125-1.125 1.125H5.625A1.125 1.125 0 0 1 4.5 18.375V7.125C4.5 6.504 5.004 6 5.625 6H9.75"
              />
            </svg>
            <span className="tw-hidden tw-text-xs tw-font-semibold sm:tw-inline">
              {t(locale, "waves.stormComposer.edit")}
            </span>
          </button>
          <button
            type="button"
            onClick={() => onMovePart(partIndex, -1)}
            disabled={controlsDisabled || partIndex === 0}
            aria-label={t(locale, "waves.stormComposer.movePartEarlier", {
              number: partNumber,
            })}
            title={t(locale, "waves.stormComposer.moveEarlier")}
            className={iconButtonClass}
          >
            <svg
              className="tw-size-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m5 15 7-7 7 7"
              />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => onMovePart(partIndex, 1)}
            disabled={controlsDisabled || partIndex === partsCount - 1}
            aria-label={t(locale, "waves.stormComposer.movePartLater", {
              number: partNumber,
            })}
            title={t(locale, "waves.stormComposer.moveLater")}
            className={iconButtonClass}
          >
            <svg
              className="tw-size-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m19 9-7 7-7-7"
              />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => onRemovePart(partIndex)}
            disabled={controlsDisabled}
            aria-label={t(locale, "waves.stormComposer.removePart", {
              number: partNumber,
            })}
            title={t(locale, "waves.stormComposer.remove")}
            className={`${iconButtonClass} disabled:tw-text-iron-500 desktop-hover:hover:tw-bg-error/10 desktop-hover:hover:tw-text-error`}
          >
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
                d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
              />
            </svg>
          </button>
        </div>
      </div>
      <div className="tw-mt-2 tw-min-w-0 tw-overflow-hidden tw-pl-8 tw-pr-1 tw-text-iron-100">
        {(part.content?.trim().length ?? 0) > 0 ? (
          <DropPartMarkdown
            mentionedUsers={mentionedUsers}
            mentionedGroups={part.mentioned_groups ?? mentionedGroups}
            mentionedWaves={mentionedWaves}
            referencedNfts={referencedNfts}
            partContent={part.content ?? ""}
            onQuoteClick={() => {}}
          />
        ) : (
          <p className="tw-m-0 tw-text-sm tw-italic tw-text-iron-500">
            {t(locale, "waves.stormComposer.mediaOnlyPart")}
          </p>
        )}
        <StormPartMedia files={part.media} />
      </div>
    </article>
  );
};

export default CreateDropStormPart;
