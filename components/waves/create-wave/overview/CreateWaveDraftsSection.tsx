"use client";

import { useState } from "react";
import DateAccordion from "@/components/common/DateAccordion";
import { getTimeAgo } from "@/helpers/Helpers";
import type { CreateWaveDraft } from "@/helpers/waves/create-wave-draft.helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";

export default function CreateWaveDraftsSection({
  drafts,
  onLoad,
  onDelete,
}: {
  readonly drafts: CreateWaveDraft[];
  readonly onLoad: (draft: CreateWaveDraft) => void;
  readonly onDelete: (id: string) => void;
}) {
  const locale = useBrowserLocale();
  // Resuming is the occasional path, so the list starts collapsed and stays
  // out of the way of the primary "New Wave" form below it.
  const [isExpanded, setIsExpanded] = useState(false);

  if (drafts.length === 0) {
    return null;
  }

  const draftName = (draft: CreateWaveDraft): string =>
    draft.config.overview.name.trim() ||
    t(locale, "wave.create.drafts.untitled");

  return (
    <DateAccordion
      title={t(locale, "wave.create.drafts.heading")}
      titleActions={
        <span className="tw-rounded-full tw-bg-iron-800 tw-px-2 tw-py-0.5 tw-text-xs tw-font-semibold tw-text-iron-300">
          {drafts.length}
        </span>
      }
      isExpanded={isExpanded}
      onToggle={() => setIsExpanded((previous) => !previous)}
    >
      <div className="tw-px-5 tw-pb-5">
        <p className="tw-mb-3 tw-mt-0 tw-text-xs tw-font-normal tw-text-iron-400">
          {t(locale, "wave.create.drafts.description")}
        </p>
        <ul
          aria-label={t(locale, "wave.create.drafts.heading")}
          className="tw-flex tw-list-none tw-flex-col tw-gap-y-2 tw-pl-0"
        >
          {drafts.map((draft) => (
            <li
              key={draft.id}
              className="tw-flex tw-items-center tw-gap-x-3 tw-rounded-lg tw-bg-iron-800/60 tw-py-2 tw-pl-4 tw-pr-2 tw-ring-1 tw-ring-inset tw-ring-iron-700"
            >
              <button
                type="button"
                onClick={() => onLoad(draft)}
                className="tw-flex tw-min-w-0 tw-flex-1 tw-flex-col tw-items-start tw-gap-y-0.5 tw-border-0 tw-bg-transparent tw-p-0 tw-text-left"
              >
                <span className="tw-w-full tw-truncate tw-text-sm tw-font-medium tw-text-white">
                  {draftName(draft)}
                </span>
                <span className="tw-text-xs tw-text-iron-400">
                  {t(locale, "wave.create.drafts.savedAt", {
                    timeAgo: getTimeAgo(draft.updatedAt),
                  })}
                </span>
              </button>
              <button
                type="button"
                onClick={() => onDelete(draft.id)}
                aria-label={t(locale, "wave.create.drafts.deleteLabel", {
                  name: draftName(draft),
                })}
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
      </div>
    </DateAccordion>
  );
}
