"use client";

import { getTimeAgo } from "@/helpers/Helpers";
import type { CreateWaveDraft } from "@/helpers/waves/create-wave-draft.helpers";

export default function CreateWaveDraftsSection({
  drafts,
  onLoad,
  onDelete,
}: {
  readonly drafts: CreateWaveDraft[];
  readonly onLoad: (draft: CreateWaveDraft) => void;
  readonly onDelete: (id: string) => void;
}) {
  if (drafts.length === 0) {
    return null;
  }

  return (
    <section aria-label="Draft waves">
      <p className="tw-mb-0 tw-text-sm tw-font-semibold tw-text-iron-200">
        Draft waves
      </p>
      <p className="tw-mb-0 tw-mt-1 tw-text-xs tw-font-normal tw-text-iron-400">
        Saved on this device as you work. Tap one to pick up where you left off
        — the wave picture and description aren&apos;t kept, everything else is.
      </p>
      <ul className="tw-mt-3 tw-flex tw-list-none tw-flex-col tw-gap-y-2 tw-pl-0">
        {drafts.map((draft) => (
          <li
            key={draft.id}
            className="tw-flex tw-items-center tw-gap-x-3 tw-rounded-lg tw-bg-iron-900 tw-py-2 tw-pl-4 tw-pr-2 tw-ring-1 tw-ring-inset tw-ring-iron-700"
          >
            <button
              type="button"
              onClick={() => onLoad(draft)}
              className="tw-flex tw-min-w-0 tw-flex-1 tw-flex-col tw-items-start tw-gap-y-0.5 tw-border-0 tw-bg-transparent tw-p-0 tw-text-left"
            >
              <span className="tw-w-full tw-truncate tw-text-sm tw-font-medium tw-text-white">
                {draft.config.overview.name.trim() || "Untitled wave"}
              </span>
              <span className="tw-text-xs tw-text-iron-400">
                Saved {getTimeAgo(draft.updatedAt)}
              </span>
            </button>
            <button
              type="button"
              onClick={() => onDelete(draft.id)}
              aria-label={`Delete draft "${
                draft.config.overview.name.trim() || "Untitled wave"
              }"`}
              className="tw-flex tw-h-8 tw-w-8 tw-shrink-0 tw-items-center tw-justify-center tw-rounded-full tw-border-0 tw-bg-transparent tw-text-error tw-transition tw-duration-300 tw-ease-out hover:tw-bg-error/10"
            >
              <svg
                className="tw-h-5 tw-w-5 tw-flex-shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M9 3H15M3 6H21M19 6L18.2987 16.5193C18.1935 18.0975 18.1409 18.8867 17.8 19.485C17.4999 20.0118 17.0472 20.4353 16.5017 20.6997C15.882 21 15.0911 21 13.5093 21H10.4907C8.90891 21 8.11803 21 7.49834 20.6997C6.95276 20.4353 6.50009 20.0118 6.19998 19.485C5.85911 18.8867 5.8065 18.0975 5.70129 16.5193L5 6M10 10.5V15.5M14 10.5V15.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
