"use client";

import { CLASSIFICATIONS } from "@/entities/IProfile";
import type { ApiProfileClassification } from "@/generated/models/ApiProfileClassification";
export default function UserSettingsClassificationItem({
  classification,
  selected,
  onClassification,
}: {
  readonly selected: ApiProfileClassification | null;
  readonly classification: ApiProfileClassification;
  readonly onClassification: (classification: ApiProfileClassification) => void;
}) {
  const isActive = classification === selected;

  return (
    <li>
      <button
        type="button"
        onClick={() => onClassification(classification)}
        className="tw-flex tw-w-full tw-cursor-pointer tw-select-none tw-items-center tw-justify-between tw-rounded-lg tw-border-0 tw-bg-transparent tw-p-2.5 tw-text-left tw-text-white tw-transition-colors tw-duration-150 focus:tw-outline-none focus-visible:tw-bg-iron-800 focus-visible:tw-ring-2 focus-visible:tw-ring-inset focus-visible:tw-ring-primary-400/60 desktop-hover:hover:tw-bg-iron-800"
      >
        <span className="tw-inline-block tw-text-sm tw-font-medium tw-text-iron-100">
          {CLASSIFICATIONS[classification].title}
        </span>
        {isActive && (
          <svg
            className="tw-ml-2 tw-h-5 tw-w-5 tw-text-primary-300"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M20 6L9 17L4 12"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>
    </li>
  );
}
