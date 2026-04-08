"use client";

import GroupCardHeader from "@/components/groups/page/list/card/GroupCardHeader";
import type { ApiGroupFull } from "@/generated/models/ApiGroupFull";
import { getRandomColorWithSeed } from "@/helpers/Helpers";

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
  const banner1 =
    group.created_by.banner1_color ??
    getRandomColorWithSeed(group.created_by.handle ?? "");
  const banner2 =
    group.created_by.banner2_color ??
    getRandomColorWithSeed(group.created_by.handle ?? "");

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
        className={`tw-group tw-relative tw-cursor-pointer tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-bg-iron-950 tw-no-underline tw-shadow-sm tw-shadow-black/20 tw-backdrop-blur-sm tw-transition-all tw-duration-300 tw-ease-out desktop-hover:hover:tw-bg-iron-900 desktop-hover:hover:tw-shadow-md desktop-hover:hover:tw-shadow-black/25 ${
          isSelected
            ? "tw-shadow-primary-900/20 tw-border-primary-300 tw-shadow-md tw-ring-1 tw-ring-primary-400/25"
            : "tw-border-white/10"
        } focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-500`}
      >
        {isSelected && onClear && (
          <div className="tw-absolute tw-right-3 tw-top-3 tw-z-20">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onClear();
              }}
              className="tw-flex tw-h-7 tw-w-7 tw-items-center tw-justify-center tw-rounded-full tw-border-0 tw-bg-iron-800 tw-text-iron-400 tw-shadow-sm tw-shadow-black/30 tw-transition tw-duration-300 tw-ease-out desktop-hover:hover:tw-bg-iron-700 desktop-hover:hover:tw-text-iron-50"
              aria-label={`Clear selected group ${group.name}`}
            >
              <svg
                className="tw-h-4 tw-w-4"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M18 6L6 18M6 6L18 18"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        )}
        <div className="tw-absolute tw-inset-0 tw-h-1 tw-rounded-t-xl">
          <div
            className="tw-absolute tw-inset-0 tw-opacity-80 tw-transition-opacity tw-duration-300 tw-ease-out desktop-hover:group-hover:tw-opacity-95"
            style={{
              background: `linear-gradient(135deg, ${banner1} 0%, ${banner2} 100%)`,
            }}
          />
          <div className="from-black/25 via-black/10 to-transparent tw-absolute tw-inset-0 tw-bg-gradient-to-b" />
        </div>
        <div
          className={`tw-flex tw-flex-1 tw-flex-col tw-rounded-b-xl tw-transition-colors tw-duration-300 tw-ease-out ${
            isSelected
              ? "tw-bg-iron-900/90"
              : "tw-bg-iron-950 desktop-hover:group-hover:tw-bg-iron-900"
          }`}
        >
          <div className="tw-flex tw-flex-1 tw-flex-col tw-gap-y-4 tw-px-4 tw-py-4 sm:tw-px-5 sm:tw-py-5">
            <GroupCardHeader group={group} />
            <div className="tw-h-px tw-w-full tw-rounded-full tw-bg-white/10 tw-shadow-[0_1px_0_rgba(8,15,29,0.35)]" />
            <div className="tw-flex tw-flex-1 tw-flex-col tw-gap-y-3">
              <div className="tw-min-w-0 tw-flex-1">
                <p
                  className="tw-mb-0 tw-line-clamp-2 tw-block tw-max-w-full tw-text-base tw-font-semibold tw-leading-tight tw-text-iron-50"
                  title={group.name}
                >
                  {group.name}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
