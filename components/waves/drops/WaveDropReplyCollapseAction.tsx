"use client";

import { useAuth } from "@/components/auth/Auth";
import { useMyStreamActionsOptional } from "@/contexts/wave/MyStreamContext";
import { useWaveChatScrollOptional } from "@/contexts/wave/WaveChatScrollContext";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { ApiDropType } from "@/generated/models/ApiDropType";
import type { ApiSetDropReplyCollapseRequest } from "@/generated/models/ApiSetDropReplyCollapseRequest";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { commonApiPost } from "@/services/api/common-api";
import { ChatBubbleLeftRightIcon } from "@heroicons/react/24/outline";
import { useMutation } from "@tanstack/react-query";
import { useWaveReplyThreads } from "./reply-threads/WaveReplyThreadsContext";

export default function WaveDropReplyCollapseAction({
  drop,
  onSelected,
  mobile = false,
}: {
  readonly drop: ApiDrop;
  readonly onSelected: () => void;
  readonly mobile?: boolean;
}) {
  const locale = useBrowserLocale();
  const { connectedProfile, activeProfileProxy, setToast } = useAuth();
  const threads = useWaveReplyThreads();
  const stream = useMyStreamActionsOptional();
  const chatScroll = useWaveChatScrollOptional();
  const waveId = drop.wave.id;
  const mutation = useMutation({
    mutationFn: (collapsed: boolean) =>
      commonApiPost<ApiSetDropReplyCollapseRequest, ApiDrop>({
        endpoint: `drops/${drop.id}/collapse-replies`,
        body: { collapse_replies: collapsed },
      }),
    onSuccess: async (savedDrop, requestedCollapse) => {
      onSelected();
      const refreshed = await stream?.applyReplyPlacement({
        waveId,
        dropId: drop.id,
        collapseReplies: savedDrop.collapse_replies ?? requestedCollapse,
        hasReplies: savedDrop.reply_placement_has_replies,
      });
      if (refreshed) {
        chatScroll?.requestScrollToSerialNo({
          waveId,
          serialNo: drop.serial_no,
        });
      }
    },
    onError: () => {
      setToast({
        type: "error",
        message: t(locale, "waves.chat.replyThread.placementError"),
      });
    },
  });

  if (threads === null) return null;

  if (
    threads.waveId !== waveId ||
    threads.collapseAll ||
    activeProfileProxy ||
    connectedProfile?.id !== drop.author.id ||
    drop.id.startsWith("temp-") ||
    drop.drop_type !== ApiDropType.Chat ||
    drop.reply_to ||
    drop.collapse_replies === undefined
  ) {
    return null;
  }

  return (
    <button
      type="button"
      disabled={mutation.isPending}
      onClick={(event) => {
        event.stopPropagation();
        mutation.mutate(!drop.collapse_replies);
      }}
      className={
        mobile
          ? "tw-flex tw-items-center tw-gap-x-4 tw-rounded-xl tw-border-0 tw-bg-iron-950 tw-p-4 tw-text-left tw-text-base tw-font-semibold tw-text-iron-300 active:tw-bg-iron-800 disabled:tw-opacity-60"
          : "tw-flex tw-w-full tw-items-center tw-gap-x-3 tw-rounded-lg tw-border-0 tw-bg-transparent tw-px-3 tw-py-2 tw-text-left tw-text-sm tw-font-medium tw-text-iron-300 disabled:tw-opacity-60 desktop-hover:hover:tw-bg-iron-800"
      }
    >
      <ChatBubbleLeftRightIcon
        aria-hidden="true"
        className={mobile ? "tw-size-5 tw-shrink-0" : "tw-size-4 tw-shrink-0"}
      />
      {t(
        locale,
        drop.collapse_replies
          ? "waves.chat.replyThread.inline"
          : "waves.chat.replyThread.collapse"
      )}
    </button>
  );
}
