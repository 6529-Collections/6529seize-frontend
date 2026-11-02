"use client";

import type { ApiWave } from "@/generated/models/ApiWave";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { useDropMessages } from "@/hooks/useDropMessages";
import { useMyStreamWaveMessages } from "@/contexts/wave/MyStreamContext";
import { getVisibleThreadReplies } from "./pending-replies";
import { t } from "@/i18n/messages";
import { useMemo } from "react";
import type { RenderThreadReply } from "./WaveDropReplyThread";

interface WaveDropReplyThreadListProps {
  readonly id: string;
  readonly waveId: string;
  readonly parentDropId: string;
  readonly wave: ApiWave;
  readonly renderReply: RenderThreadReply;
}

const THREAD_TEXT_BUTTON_CLASS_NAME =
  "tw-inline-flex tw-min-h-6 tw-items-center tw-rounded-md tw-border-0 tw-bg-transparent tw-px-1.5 tw-py-1 tw-text-xs tw-font-semibold tw-text-iron-300 tw-transition-colors tw-duration-200 desktop-hover:hover:tw-text-iron-100 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 disabled:tw-cursor-default disabled:tw-opacity-60";

/** Mounted only while a thread is open, so closed threads fetch nothing. */
export default function WaveDropReplyThreadList({
  id,
  waveId,
  parentDropId,
  wave,
  renderReply,
}: WaveDropReplyThreadListProps) {
  const locale = useBrowserLocale();
  const waveMessages = useMyStreamWaveMessages(waveId);
  const {
    data,
    drops,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    isError,
    refetch,
  } = useDropMessages(waveId, parentDropId, wave);
  const replies = useMemo(
    () =>
      getVisibleThreadReplies({
        pages: data?.pages,
        previous: drops,
        streamDrops: waveMessages?.drops ?? [],
        parentDropId,
      }),
    [data, drops, parentDropId, waveMessages]
  );

  return (
    <div
      id={id}
      className="tw-mt-1 tw-border-0 tw-border-l-2 tw-border-solid tw-border-iron-800"
    >
      {hasNextPage && (
        <div className="tw-pl-3">
          <button
            type="button"
            disabled={isFetchingNextPage}
            onClick={() => {
              fetchNextPage().catch(() => undefined);
            }}
            className={THREAD_TEXT_BUTTON_CLASS_NAME}
          >
            {t(locale, "waves.chat.replyThread.loadEarlier")}
          </button>
        </div>
      )}
      <ul
        aria-label={t(locale, "waves.chat.replyThread.regionLabel")}
        aria-busy={isFetching}
        className="tw-m-0 tw-list-none tw-p-0"
      >
        {replies.map((reply, index) => (
          <li key={reply.stableKey}>
            {renderReply({
              reply,
              previousReply: replies[index - 1] ?? null,
              nextReply: replies[index + 1] ?? null,
            })}
          </li>
        ))}
      </ul>
      {isError && (
        <div className="tw-py-1 tw-pl-3">
          <p role="alert" className="tw-m-0 tw-text-xs tw-text-iron-300">
            {t(locale, "waves.chat.replyThread.error")}
          </p>
          <button
            type="button"
            disabled={isFetching}
            onClick={() => {
              refetch().catch(() => undefined);
            }}
            className={THREAD_TEXT_BUTTON_CLASS_NAME}
          >
            {t(locale, "waves.chat.replyThread.retry")}
          </button>
        </div>
      )}
      {replies.length === 0 && (!isError || isFetching) && (
        <p className="tw-m-0 tw-py-1 tw-pl-3 tw-text-xs tw-text-iron-400">
          {isFetching
            ? t(locale, "waves.chat.replyThread.loading")
            : t(locale, "waves.chat.replyThread.empty")}
        </p>
      )}
    </div>
  );
}
