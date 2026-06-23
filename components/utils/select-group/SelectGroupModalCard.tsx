"use client";

import type { ApiGroupFull } from "@/generated/models/ApiGroupFull";
import { getRandomColorWithSeed, getTimeAgo } from "@/helpers/Helpers";
import { ImageScale, getScaledImageUri } from "@/helpers/image.helpers";
import Image from "next/image";
import Link from "next/link";

interface SelectGroupModalCardProps {
  readonly group: ApiGroupFull;
  readonly isSelected: boolean;
  readonly onSelect: (group: ApiGroupFull) => void;
  readonly onClear?: (() => void) | undefined;
}

export default function SelectGroupModalCard({
  group,
  isSelected,
  onSelect,
  onClear,
}: SelectGroupModalCardProps) {
  const creator =
    group.created_by ?? ({} as NonNullable<ApiGroupFull["created_by"]>);
  const avatarAccentStart =
    creator.banner1_color ?? getRandomColorWithSeed(creator.handle ?? "");
  const avatarAccentEnd =
    creator.banner2_color ?? getRandomColorWithSeed(creator.handle ?? "");
  const creatorIdentity = creator.handle ?? creator.primary_address ?? "";
  const timeAgo = getTimeAgo(new Date(group.created_at).getTime());
  const avatarFallbackLabel = (creatorIdentity.charAt(0) || "?").toUpperCase();
  const selectionIndicator =
    isSelected && onClear ? (
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onClear();
        }}
        className="tw-flex tw-h-[18px] tw-w-[18px] tw-flex-shrink-0 tw-appearance-none tw-items-center tw-justify-center tw-rounded-full tw-border-none tw-bg-iron-100 tw-p-0 tw-leading-none tw-shadow-[0_0_10px_rgba(255,255,255,0.2)] tw-transition-all tw-duration-300 hover:tw-scale-110 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-white/30"
        aria-label={`Clear selected group ${group.name}`}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="tw-h-3 tw-w-3 tw-flex-shrink-0 tw-text-iron-950"
          stroke="currentColor"
          strokeWidth="3.5"
          aria-hidden="true"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </button>
    ) : (
      <div
        className={`tw-flex tw-h-[18px] tw-w-[18px] tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-solid tw-transition-all tw-duration-300 ${
          isSelected
            ? "tw-border-iron-100 tw-bg-iron-100 tw-shadow-[0_0_10px_rgba(255,255,255,0.2)]"
            : "tw-border-white/10 tw-bg-transparent group-hover:tw-border-white/30"
        }`}
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
    );

  return (
    <div className="tw-relative tw-col-span-1">
      <div
        role="button"
        tabIndex={0}
        aria-pressed={isSelected}
        aria-label={`Select ${group.name}`}
        onClick={() => onSelect(group)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onSelect(group);
          }
        }}
        className={`tw-group tw-relative tw-flex tw-cursor-pointer tw-items-center tw-justify-between tw-gap-3 tw-rounded-xl tw-border tw-border-solid tw-p-3 tw-no-underline tw-outline-none tw-transition-all tw-duration-200 ${
          isSelected
            ? "tw-border-white/20 tw-bg-iron-900 tw-shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_10px_24px_rgba(0,0,0,0.28),0_0_18px_rgba(255,255,255,0.06)]"
            : "tw-border-white/[0.06] tw-bg-iron-950 hover:tw-border-white/10 hover:tw-bg-iron-900/60"
        } focus-visible:tw-border-white/30 focus-visible:tw-bg-iron-900 focus-visible:tw-outline-none focus-visible:tw-ring-1 focus-visible:tw-ring-white/30`}
      >
        <div className="tw-flex tw-min-w-0 tw-flex-1 tw-items-center tw-gap-3">
          <div
            className="tw-relative tw-flex tw-h-9 tw-w-9 tw-flex-shrink-0 tw-items-center tw-justify-center tw-overflow-hidden tw-rounded-full tw-shadow-[inset_0_2px_4px_rgba(255,255,255,0.2),0_2px_8px_rgba(0,0,0,0.4)]"
            style={{
              background: `linear-gradient(135deg, ${avatarAccentStart} 0%, ${avatarAccentEnd} 100%)`,
            }}
          >
            {creator.pfp ? (
              <Image
                src={getScaledImageUri(
                  creator.pfp,
                  ImageScale.W_AUTO_H_50
                )}
                width={40}
                height={40}
                alt={
                  creator.handle
                    ? `${creator.handle} profile picture`
                    : "Group creator profile picture"
                }
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

          <div className="tw-flex tw-min-w-0 tw-flex-col tw-justify-center">
            <p
              className={`tw-mb-0 tw-block tw-max-w-[12rem] tw-truncate tw-text-sm tw-font-semibold tw-leading-tight tw-transition-colors ${
                isSelected
                  ? "tw-text-iron-50"
                  : "tw-text-iron-200 group-hover:tw-text-iron-100"
              }`}
              title={group.name}
            >
              {group.name}
            </p>
            <div className="tw-mt-0.5 tw-flex tw-min-w-0 tw-items-center tw-gap-1.5 tw-text-[11px]">
              {creator.handle ? (
                <Link
                  href={`/${creator.handle}`}
                  onClick={(event) => {
                    event.stopPropagation();
                  }}
                  className={`tw-inline-block tw-max-w-[8rem] tw-truncate tw-font-medium tw-no-underline tw-transition-colors ${
                    isSelected
                      ? "tw-text-iron-300"
                      : "tw-text-iron-400 group-hover:tw-text-iron-300"
                  }`}
                >
                  {creator.handle}
                </Link>
              ) : (
                <span
                  className={`tw-inline-block tw-max-w-[8rem] tw-truncate tw-font-medium ${
                    isSelected
                      ? "tw-text-iron-300"
                      : "tw-text-iron-400 group-hover:tw-text-iron-300"
                  }`}
                >
                  {creatorIdentity}
                </span>
              )}
              {timeAgo && (
                <>
                  <span className="tw-leading-none tw-text-iron-600">
                    &middot;
                  </span>
                  <p className="tw-mb-0 tw-text-iron-500">Created {timeAgo}</p>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="tw-flex tw-flex-shrink-0 tw-items-center tw-justify-end tw-pl-2">
          {selectionIndicator}
        </div>
      </div>
    </div>
  );
}
