"use client";

import type { ApiGroupFull } from "@/generated/models/ApiGroupFull";
import { getRandomColorWithSeed, getTimeAgo } from "@/helpers/Helpers";
import { ImageScale, getScaledImageUri } from "@/helpers/image.helpers";
import clsx from "clsx";
import Image from "next/image";
import type { ReactNode } from "react";

const getGroupCreatorLabel = (group: ApiGroupFull): string =>
  group.created_by.handle
    ? `@${group.created_by.handle}`
    : group.created_by.primary_address;

export default function CurationGroupRow({
  group,
  onSelect,
  trailingContent,
  isSelected = false,
}: {
  readonly group: ApiGroupFull;
  readonly onSelect?: ((group: ApiGroupFull) => void) | undefined;
  readonly trailingContent?: ReactNode | undefined;
  readonly isSelected?: boolean | undefined;
}) {
  const isInteractive = onSelect !== undefined;
  const avatarAccentStart =
    group.created_by.banner1_color ??
    getRandomColorWithSeed(group.created_by.handle ?? "");
  const avatarAccentEnd =
    group.created_by.banner2_color ??
    getRandomColorWithSeed(group.created_by.handle ?? "");
  const timeAgo = getTimeAgo(new Date(group.created_at).getTime());
  const avatarFallbackLabel = getGroupCreatorLabel(group)
    .charAt(0)
    .toUpperCase();
  const hasTrailingContent =
    trailingContent !== undefined && trailingContent !== null;
  const avatarAlt = group.created_by.handle
    ? `${group.created_by.handle} profile picture`
    : "Group creator profile picture";
  const handleSelect = () => {
    if (onSelect === undefined) {
      return;
    }

    onSelect(group);
  };
  let rowClassName = "tw-border-white/[0.06] tw-bg-iron-900/40";

  if (isInteractive) {
    rowClassName = isSelected
      ? "tw-cursor-pointer tw-border-white/20 tw-bg-iron-900 tw-shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_10px_24px_rgba(0,0,0,0.28),0_0_18px_rgba(255,255,255,0.06)]"
      : "desktop-hover:hover:tw-border-white/12 tw-cursor-pointer tw-border-white/[0.06] tw-bg-iron-950/70 desktop-hover:hover:tw-bg-iron-900/70";
  }

  const selectionIndicatorClassName = isSelected
    ? "tw-border-iron-100 tw-bg-iron-100 tw-shadow-[0_0_10px_rgba(255,255,255,0.2)]"
    : "tw-border-white/10 tw-bg-transparent desktop-hover:group-hover:tw-border-white/30";
  const rowContent = (
    <>
      <div className="tw-flex tw-min-w-0 tw-flex-1 tw-items-center tw-gap-3">
        <div
          className="tw-relative tw-flex tw-h-9 tw-w-9 tw-flex-shrink-0 tw-items-center tw-justify-center tw-overflow-hidden tw-rounded-full tw-shadow-[inset_0_2px_4px_rgba(255,255,255,0.2),0_2px_8px_rgba(0,0,0,0.4)]"
          style={{
            background: `linear-gradient(135deg, ${avatarAccentStart} 0%, ${avatarAccentEnd} 100%)`,
          }}
        >
          {group.created_by.pfp ? (
            <Image
              src={getScaledImageUri(
                group.created_by.pfp,
                ImageScale.W_AUTO_H_50
              )}
              width={40}
              height={40}
              alt={avatarAlt}
              className="tw-h-full tw-w-full tw-object-cover"
            />
          ) : (
            <>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="tw-h-4 tw-w-4 tw-text-iron-50 tw-drop-shadow-md"
                stroke="currentColor"
                strokeWidth="2.5"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              <span className="tw-sr-only">{avatarFallbackLabel}</span>
            </>
          )}
        </div>
        <div className="tw-min-w-0 tw-flex-1">
          <p className="tw-mb-1 tw-mt-0 tw-truncate tw-text-sm tw-font-semibold tw-text-iron-50 group-data-[profile-typography=true]/curation-dialog:tw-font-medium group-data-[profile-typography=true]/curation-dialog:tw-text-iron-100">
            {group.name}
          </p>
          <div className="tw-flex tw-min-w-0 tw-items-center tw-gap-1.5 tw-text-[11px] group-data-[profile-typography=true]/curation-dialog:tw-text-meta group-data-[profile-typography=true]/curation-dialog:tw-font-normal group-data-[profile-typography=true]/curation-dialog:tw-tabular-nums">
            <span className="tw-inline-block tw-min-w-0 tw-max-w-[8rem] tw-truncate tw-font-medium tw-text-iron-400 group-data-[profile-typography=true]/curation-dialog:tw-font-normal group-data-[profile-typography=true]/curation-dialog:tw-text-iron-500">
              {getGroupCreatorLabel(group)}
            </span>
            {timeAgo && (
              <div className="tw-flex tw-flex-shrink-0 tw-items-center tw-gap-1.5 tw-whitespace-nowrap">
                <span className="tw-leading-none tw-text-iron-600">
                  &middot;
                </span>
                <span className="tw-text-iron-500">
                  <span className="tw-hidden sm:tw-inline">Created </span>
                  {timeAgo}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
      {hasTrailingContent && (
        <div className="tw-flex tw-flex-shrink-0 tw-items-center tw-gap-2">
          {trailingContent}
        </div>
      )}
      {!hasTrailingContent && (
        <div
          className={clsx(
            "tw-flex tw-h-[18px] tw-w-[18px] tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-solid tw-transition-all tw-duration-300",
            selectionIndicatorClassName
          )}
          aria-hidden="true"
        >
          {isSelected && (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="tw-h-3 tw-w-3 tw-flex-shrink-0 tw-text-iron-950"
              stroke="currentColor"
              strokeWidth="3.5"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
        </div>
      )}
    </>
  );
  const rowClassNames = clsx(
    "tw-group tw-flex tw-items-center tw-justify-between tw-gap-3 tw-rounded-xl tw-border tw-border-solid tw-p-4 tw-transition-all",
    rowClassName
  );

  if (isInteractive) {
    return (
      <button
        type="button"
        onClick={handleSelect}
        aria-pressed={isSelected}
        className={clsx(
          rowClassNames,
          "tw-w-full tw-bg-transparent tw-text-left"
        )}
      >
        {rowContent}
      </button>
    );
  }

  return <div className={rowClassNames}>{rowContent}</div>;
}
