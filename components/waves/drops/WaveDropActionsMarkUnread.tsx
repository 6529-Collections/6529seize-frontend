"use client";

import { useState, useCallback } from "react";
import { ApiDrop } from "@/generated/models/ApiDrop";
import { commonApiPost } from "@/services/api/common-api";
import { useQueryClient } from "@tanstack/react-query";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { Tooltip } from "react-tooltip";
import { useAuth } from "@/components/auth/Auth";
import { ApiMarkDropUnreadResponse } from "@/generated/models/ApiMarkDropUnreadResponse";
import { Spinner } from "@/components/dotLoader/DotLoader";
import { useUnreadDividerOptional } from "@/contexts/wave/UnreadDividerContext";
import MailUnreadIcon from "@/components/common/icons/MailUnreadIcon";
import { useMyStream } from "@/contexts/wave/MyStreamContext";

interface WaveDropActionsMarkUnreadProps {
  readonly drop: ApiDrop;
}

export default function WaveDropActionsMarkUnread({
  drop,
}: WaveDropActionsMarkUnreadProps) {
  const queryClient = useQueryClient();
  const { setToast } = useAuth();
  const [loading, setLoading] = useState(false);
  const unreadDividerContext = useUnreadDividerOptional();
  const { waves, directMessages } = useMyStream();

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

      waves.restoreWaveUnreadCount(drop.wave.id, response.your_unread_drops_count);
      directMessages.restoreWaveUnreadCount(drop.wave.id, response.your_unread_drops_count);

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
    } catch (error) {
      setToast({
        message:
          typeof error === "string" ? error : "Failed to mark as unread",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [drop.id, drop.wave.id, loading, queryClient, setToast, unreadDividerContext, waves, directMessages]);

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
        data-tooltip-id={`mark-unread-${drop.id}`}>
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
        }}>
        <span className="tw-text-xs">Mark as unread</span>
      </Tooltip>
    </>
  );
}

