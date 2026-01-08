"use client";

import { useAuth } from "@/components/auth/Auth";
import MailUnreadIcon from "@/components/common/icons/MailUnreadIcon";
import { Spinner } from "@/components/dotLoader/DotLoader";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { useMyStream } from "@/contexts/wave/MyStreamContext";
import { useUnreadDividerOptional } from "@/contexts/wave/UnreadDividerContext";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { ApiMarkDropUnreadResponse } from "@/generated/models/ApiMarkDropUnreadResponse";
import { commonApiPost } from "@/services/api/common-api";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { Tooltip } from "react-tooltip";

interface WaveDropActionsMarkUnreadProps {
  readonly drop: ApiDrop;
  readonly isMobile?: boolean | undefined;
  readonly onMarkUnread?: (() => void) | undefined;
}

export default function WaveDropActionsMarkUnread({
  drop,
  isMobile = false,
  onMarkUnread,
}: WaveDropActionsMarkUnreadProps) {
  const queryClient = useQueryClient();
  const { setToast, connectedProfile, activeProfileProxy } = useAuth();
  const [loading, setLoading] = useState(false);
  const unreadDividerContext = useUnreadDividerOptional();
  const { waves, directMessages } = useMyStream();

  const isAuthor =
    connectedProfile?.handle === drop.author.handle && !activeProfileProxy;

  const handleMarkUnread = useCallback(async () => {
    if (loading) return;

    setLoading(true);
    try {
      const response = await commonApiPost<
        Record<string, never>,
        ApiMarkDropUnreadResponse
      >({
        endpoint: `drops/${drop.id}/mark-unread`,
        body: {},
      });

      waves.restoreWaveUnreadCount(
        drop.wave.id,
        response.your_unread_drops_count
      );
      directMessages.restoreWaveUnreadCount(
        drop.wave.id,
        response.your_unread_drops_count
      );

      queryClient.invalidateQueries({
        queryKey: [QueryKey.WAVES_OVERVIEW],
      });

      queryClient.invalidateQueries({
        queryKey: [QueryKey.WAVE, { wave_id: drop.wave.id }],
      });

      if (response.first_unread_drop_serial_no != null) {
        unreadDividerContext?.setUnreadDividerSerialNo(
          response.first_unread_drop_serial_no
        );
      }

      setToast({
        message: "Marked as unread",
        type: "success",
      });

      onMarkUnread?.();
    } catch (error) {
      setToast({
        message: typeof error === "string" ? error : "Failed to mark as unread",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [
    drop.id,
    drop.wave.id,
    loading,
    queryClient,
    setToast,
    unreadDividerContext,
    waves,
    directMessages,
    onMarkUnread,
  ]);

  if (isAuthor || !connectedProfile) {
    return null;
  }

  if (isMobile) {
    return (
      <button
        onClick={handleMarkUnread}
        disabled={loading}
        className={`tw-border-0 tw-flex tw-items-center tw-gap-x-4 tw-p-4 tw-bg-iron-950 tw-rounded-xl ${
          loading ? "tw-opacity-50 tw-cursor-default" : "active:tw-bg-iron-800"
        } tw-transition-colors tw-duration-200`}
      >
        {loading ? (
          <Spinner dimension={20} />
        ) : (
          <MailUnreadIcon className="tw-size-5 tw-flex-shrink-0 tw-text-iron-300" />
        )}
        <span className="tw-text-iron-300 tw-font-semibold tw-text-base">
          Mark as unread
        </span>
      </button>
    );
  }

  return (
    <>
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleMarkUnread();
        }}
        disabled={loading}
        className="tw-text-iron-500 desktop-hover:hover:tw-text-iron-50 tw-px-2 tw-h-full tw-group tw-bg-transparent tw-rounded-full tw-border-0 tw-flex tw-items-center tw-gap-x-1.5 tw-text-xs tw-leading-5 tw-font-medium tw-transition tw-ease-out tw-duration-300 tw-cursor-pointer"
        aria-label="Mark as unread"
        data-tooltip-id={`mark-unread-${drop.id}`}
      >
        {loading ? (
          <Spinner dimension={20} />
        ) : (
          <MailUnreadIcon className="tw-flex-shrink-0 tw-w-5 tw-h-5 tw-transition tw-ease-out tw-duration-300" />
        )}
      </button>
      <Tooltip
        id={`mark-unread-${drop.id}`}
        place="top"
        style={{
          backgroundColor: "#1F2937",
          color: "white",
          padding: "4px 8px",
        }}
      >
        <span className="tw-text-xs">Mark as unread</span>
      </Tooltip>
    </>
  );
}
