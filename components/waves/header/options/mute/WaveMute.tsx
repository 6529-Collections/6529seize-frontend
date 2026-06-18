"use client";

import { useAuth } from "@/components/auth/Auth";
import { Spinner } from "@/components/dotLoader/DotLoader";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import type { ApiWave } from "@/generated/models/ApiWave";
import { getToastErrorDetails } from "@/helpers/toast.helpers";
import { commonApiDelete, commonApiPost } from "@/services/api/common-api";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";

export default function WaveMute({
  wave,
  onSuccess,
}: {
  readonly wave: ApiWave;
  readonly onSuccess?: (() => void) | undefined;
}) {
  const queryClient = useQueryClient();
  const { setToast } = useAuth();
  const [loading, setLoading] = useState(false);
  const isMuted = wave.metrics.muted;

  const handleToggleMute = useCallback(async () => {
    setLoading(true);
    try {
      if (isMuted) {
        await commonApiDelete({ endpoint: `waves/${wave.id}/mute` });
      } else {
        await commonApiPost({ endpoint: `waves/${wave.id}/mute`, body: {} });
      }
      queryClient.invalidateQueries({
        queryKey: [QueryKey.WAVE, { wave_id: wave.id }],
      });
      queryClient.invalidateQueries({
        queryKey: [QueryKey.WAVES_OVERVIEW],
      });
      queryClient
        .invalidateQueries({
          queryKey: [QueryKey.WAVES_V2],
        })
        .catch(() => undefined);
      queryClient
        .invalidateQueries({
          queryKey: [QueryKey.OFFICIAL_WAVES],
        })
        .catch(() => undefined);
      queryClient
        .invalidateQueries({
          queryKey: [QueryKey.WAVE_SUBWAVES],
        })
        .catch(() => undefined);
      onSuccess?.();
    } catch (error) {
      const defaultMessage = isMuted
        ? "Unable to unmute wave"
        : "Unable to mute wave";
      setToast({
        type: "error",
        title: isMuted ? "Couldn't unmute this wave." : "Couldn't mute this wave.",
        description: "Please try again.",
        details: getToastErrorDetails(error, defaultMessage),
      });
    } finally {
      setLoading(false);
    }
  }, [wave.id, isMuted, queryClient, setToast, onSuccess]);

  return (
    <button
      type="button"
      disabled={loading}
      onClick={(e) => {
        e.stopPropagation();
        void handleToggleMute();
      }}
      className="tw-flex tw-w-full tw-items-center tw-gap-2 tw-border-none tw-bg-transparent tw-px-3 tw-py-1 tw-text-left tw-text-sm tw-leading-6 tw-text-iron-300 tw-transition tw-duration-300 tw-ease-out hover:tw-bg-iron-800"
      role="menuitem"
      tabIndex={-1}
    >
      {loading && <Spinner dimension={14} />}
      {loading && (isMuted ? "Unmuting" : "Muting")}
      {!loading && (isMuted ? "Unmute" : "Mute")}
    </button>
  );
}
