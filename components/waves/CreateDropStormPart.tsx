"use client";

import type { CreateDropPart, ReferencedNft } from "@/entities/IDrop";
import type { ApiDropGroupMention } from "@/generated/models/ApiDropGroupMention";
import type { ApiDropMentionedUser } from "@/generated/models/ApiDropMentionedUser";
import type { ApiMentionedWave } from "@/generated/models/ApiMentionedWave";
import useIsMobileScreen from "@/hooks/isMobileScreen";
import { useObjectUrls } from "@/hooks/useObjectUrl";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import type React from "react";
import DropPartMarkdown from "../drops/view/part/DropPartMarkdown";
import CustomTooltip from "../utils/tooltip/CustomTooltip";

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
    <ul className="tw-m-0 tw-mt-2.5 tw-flex tw-list-none tw-flex-wrap tw-gap-2 tw-p-0">
      {files.map((file, index) => {
        const mediaUrl = mediaUrls[index];
        const key = `${file.name}-${file.size}-${file.lastModified}-${index}`;
        return (
          <li
            key={key}
            className="tw-flex tw-h-14 tw-min-w-0 tw-max-w-40 tw-items-center tw-overflow-hidden tw-rounded-md tw-border tw-border-solid tw-border-white/[0.05] tw-bg-black/25"
          >
            {file.type.startsWith("image/") && mediaUrl ? (
              <img
                src={mediaUrl}
                alt={file.name}
                className="tw-h-full tw-w-14 tw-flex-none tw-object-cover"
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
  const isMobileScreen = useIsMobileScreen();
  const partNumber = partIndex + 1;
  const editDisabled = controlsDisabled || !canEdit;
  const editTitle = canEdit
    ? t(locale, "waves.stormComposer.editPart", { number: partNumber })
    : t(locale, "waves.stormComposer.finishCurrentPartBeforeEditing");
  const iconButtonBaseClass =
    "tw-inline-flex tw-size-11 tw-flex-none tw-cursor-pointer tw-items-center tw-justify-center tw-rounded-md tw-border-0 tw-bg-transparent tw-p-1.5 tw-text-iron-500 tw-transition-colors focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 disabled:tw-cursor-not-allowed disabled:tw-opacity-35 sm:tw-size-7";
  const moveIconButtonClass = `${iconButtonBaseClass} desktop-hover:hover:tw-bg-white/[0.04] desktop-hover:hover:tw-text-iron-200`;
  const removeIconButtonClass = `${iconButtonBaseClass} disabled:tw-text-iron-600 desktop-hover:hover:tw-bg-error/[0.08] desktop-hover:hover:tw-text-error sm:tw-ml-1`;

  return (
    <article
      className={`tw-group tw-relative tw-overflow-hidden tw-rounded-none tw-border-0 tw-bg-transparent tw-px-3 tw-py-3.5 tw-transition-colors sm:tw-p-4 ${
        isEditing
          ? "tw-bg-primary-500/[0.025] tw-shadow-[inset_2px_0_0_rgba(82,139,255,0.55)]"
          : "desktop-hover:hover:tw-bg-white/[0.018]"
      }`}
      aria-label={t(locale, "waves.stormComposer.part", {
        number: partNumber,
      })}
    >
      <div className="tw-flex tw-min-w-0 tw-flex-col tw-gap-3 sm:tw-grid sm:tw-grid-cols-[minmax(0,1fr)_auto] sm:tw-items-start sm:tw-gap-4">
        <div className="tw-flex tw-w-full tw-min-w-0 tw-gap-3">
          <span className="tw-mt-0.5 tw-inline-flex tw-size-5 tw-flex-none tw-items-center tw-justify-center tw-rounded-md tw-bg-white/[0.045] tw-text-[10px] tw-font-medium tw-tabular-nums tw-text-iron-300">
            {partNumber}
          </span>
          <div className="tw-flex tw-min-w-0 tw-flex-1 tw-flex-col sm:tw-gap-2">
            {isEditing && (
              <span className="tw-text-primary-200 tw-mb-1 tw-w-fit tw-rounded-full tw-border tw-border-solid tw-border-primary-400/15 tw-bg-primary-500/10 tw-px-2 tw-py-0.5 tw-text-[10px] tw-font-medium">
                {t(locale, "waves.stormComposer.editing")}
              </span>
            )}
            <div className="tw-min-w-0 tw-overflow-hidden tw-text-sm tw-leading-5 tw-text-iron-100">
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
          </div>
        </div>
        <div className="tw-flex tw-w-full tw-flex-none tw-items-center tw-justify-end tw-gap-1 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/[0.035] tw-pt-2.5 tw-opacity-100 tw-transition-opacity focus-within:tw-opacity-100 group-hover:tw-opacity-100 sm:tw-w-auto sm:tw-justify-start sm:tw-border-0 sm:tw-pt-0 sm:tw-opacity-[0.55]">
          <CustomTooltip
            content={editTitle}
            disabled={isMobileScreen || canEdit}
          >
            <button
              type="button"
              onClick={() => {
                if (!editDisabled) {
                  onEditPart(partIndex);
                }
              }}
              aria-disabled={editDisabled}
              aria-label={editTitle}
              className="tw-mr-auto tw-inline-flex tw-h-11 tw-flex-none tw-cursor-pointer tw-items-center tw-justify-center tw-gap-1.5 tw-rounded-md tw-border-0 tw-bg-transparent tw-px-3 tw-text-xs tw-font-medium tw-text-iron-400 tw-transition-colors aria-disabled:tw-cursor-not-allowed aria-disabled:tw-opacity-35 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 desktop-hover:hover:tw-bg-white/[0.04] sm:tw-mr-0 sm:tw-h-auto sm:tw-px-2.5 sm:tw-py-1.5"
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
                  d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931ZM19.5 7.125 16.875 4.5M18 14.25v4.125c0 .621-.504 1.125-1.125 1.125H5.625A1.125 1.125 0 0 1 4.5 18.375V7.125C4.5 6.504 5.004 6 5.625 6H9.75"
                />
              </svg>
              <span>{t(locale, "waves.stormComposer.edit")}</span>
            </button>
          </CustomTooltip>
          <div className="tw-flex tw-items-center tw-border-x tw-border-y-0 tw-border-solid tw-border-white/[0.05] tw-px-1 sm:tw-mx-1">
            <CustomTooltip
              content={t(locale, "waves.stormComposer.moveEarlier")}
              disabled={isMobileScreen}
            >
              <button
                type="button"
                onClick={() => onMovePart(partIndex, -1)}
                disabled={controlsDisabled || partIndex === 0}
                aria-label={t(locale, "waves.stormComposer.movePartEarlier", {
                  number: partNumber,
                })}
                className={moveIconButtonClass}
              >
                <svg
                  className="tw-size-[18px]"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m6 15 6-6 6 6"
                  />
                </svg>
              </button>
            </CustomTooltip>
            <CustomTooltip
              content={t(locale, "waves.stormComposer.moveLater")}
              disabled={isMobileScreen}
            >
              <button
                type="button"
                onClick={() => onMovePart(partIndex, 1)}
                disabled={controlsDisabled || partIndex === partsCount - 1}
                aria-label={t(locale, "waves.stormComposer.movePartLater", {
                  number: partNumber,
                })}
                className={moveIconButtonClass}
              >
                <svg
                  className="tw-size-[18px]"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m18 9-6 6-6-6"
                  />
                </svg>
              </button>
            </CustomTooltip>
          </div>
          <CustomTooltip
            content={t(locale, "waves.stormComposer.remove")}
            disabled={isMobileScreen}
          >
            <button
              type="button"
              onClick={() => onRemovePart(partIndex)}
              disabled={controlsDisabled}
              aria-label={t(locale, "waves.stormComposer.removePart", {
                number: partNumber,
              })}
              className={removeIconButtonClass}
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
          </CustomTooltip>
        </div>
      </div>
    </article>
  );
};

export default CreateDropStormPart;
