"use client";

import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatInteger } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { QueryKey } from "@/components/react-query-wrapper/query-keys";
import { WAVE_DROPS_PARAMS } from "@/components/react-query-wrapper/utils/query-utils";
import { useIsFetching } from "@tanstack/react-query";
import { useId, type ReactNode } from "react";
import WaveDropReplyThreadList from "./WaveDropReplyThreadList";
import {
  useReplyThreadExpanded,
  useWaveReplyThreads,
} from "./WaveReplyThreadsContext";

export type RenderThreadReply = (params: {
  readonly reply: ExtendedDrop;
  readonly previousReply: ExtendedDrop | null;
  readonly nextReply: ExtendedDrop | null;
}) => ReactNode;

interface WaveDropReplyThreadProps {
  readonly drop: ExtendedDrop;
  readonly renderReply: RenderThreadReply;
}

const getShowRepliesLabel = (locale: SupportedLocale, count: number): string =>
  count === 1
    ? t(locale, "waves.chat.replyThread.showOne")
    : t(locale, "waves.chat.replyThread.showMany", {
        count: formatInteger(locale, count),
      });

export default function WaveDropReplyThread({
  drop,
  renderReply,
}: WaveDropReplyThreadProps) {
  const locale = useBrowserLocale();
  const threads = useWaveReplyThreads();
  const expanded = useReplyThreadExpanded(threads, drop.id);
  const listId = useId();
  const repliesCount = drop.replies_count ?? 0;
  // Same key as useDropMessages, which loads the open thread.
  const fetchingThreadQueries = useIsFetching({
    queryKey: [
      QueryKey.DROPS,
      {
        waveId: threads?.waveId,
        limit: WAVE_DROPS_PARAMS.limit,
        dropId: drop.id,
      },
    ],
  });

  if (threads === null || (repliesCount === 0 && !expanded)) {
    return null;
  }

  return (
    <div className="tw-px-4 tw-pb-1">
      <div className="md:tw-ml-[3.25rem]">
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={expanded ? listId : undefined}
          onClick={() => threads.store.setExpanded(drop.id, !expanded)}
          className="tw-inline-flex tw-min-h-6 tw-items-center tw-gap-1.5 tw-rounded-md tw-border-0 tw-bg-transparent tw-px-1.5 tw-py-1 tw-text-xs tw-font-semibold tw-text-primary-400 tw-transition-colors tw-duration-200 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 desktop-hover:hover:tw-text-primary-300"
        >
          <svg
            aria-hidden="true"
            className={`tw-h-3.5 tw-w-3.5 tw-flex-shrink-0 tw-transition-transform tw-duration-200 ${
              expanded ? "tw-rotate-90" : ""
            }`}
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="2"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m9 5 7 7-7 7"
            />
          </svg>
          {expanded
            ? t(locale, "waves.chat.replyThread.hide")
            : getShowRepliesLabel(locale, repliesCount)}
        </button>
        {/* Always mounted so the loading message is announced on open. */}
        <output className="tw-sr-only">
          {expanded && fetchingThreadQueries > 0
            ? t(locale, "waves.chat.replyThread.loading")
            : ""}
        </output>
        {expanded && (
          <WaveDropReplyThreadList
            id={listId}
            waveId={threads.waveId}
            parentDropId={drop.id}
            wave={threads.getWave()}
            renderReply={renderReply}
          />
        )}
      </div>
    </div>
  );
}
