"use client";

import { useCallback, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/components/auth/Auth";
import { removeTemporaryThreadReply } from "@/components/waves/drops/reply-threads/pending-replies";
import { useMyStreamActions } from "@/contexts/wave/MyStreamContext";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import {
  getStructuredApiErrorCode,
  getStructuredApiErrorStatus,
} from "@/services/api/common-api";
import type { DropMutationBody } from "./drop-submission.types";

const DROP_SAVED_REFRESH_ERROR_CODE = "DROP_SAVED_REFRESH";

/** The API saved the drop but could not read it back. */
const isSaved = (error: unknown): boolean =>
  getStructuredApiErrorStatus(error) === 409 &&
  getStructuredApiErrorCode(error) === DROP_SAVED_REFRESH_ERROR_CODE;

/**
 * The API answers 409 DROP_SAVED_REFRESH when it saved a drop but could not
 * read it back. The drop was posted and no realtime update follows, so
 * `recover` replaces the pending drop with a reload of the wave's newest
 * messages and says it was posted; it returns false for any other error.
 * `isSaved` tells the send queue to count such a drop as sent.
 */
export function useSavedDropRecovery() {
  const queryClient = useQueryClient();
  const { setToast } = useAuth();
  const { processDropRemoved, refreshWaveMessages } = useMyStreamActions();
  const locale = useBrowserLocale();

  const recover = useCallback(
    (error: unknown, body: DropMutationBody): boolean => {
      if (!isSaved(error)) return false;
      const waveId = body.drop.wave_id;
      if (body.dropId) {
        if (body.drop.reply_to) {
          removeTemporaryThreadReply(queryClient, waveId, body.dropId);
        }
        processDropRemoved(waveId, body.dropId);
      }
      refreshWaveMessages(waveId);
      body.onSuccess?.();
      setToast({
        type: "success",
        title: t(locale, "waves.chat.savedDropToast.title"),
        description: t(locale, "waves.chat.savedDropToast.description"),
      });
      return true;
    },
    [locale, processDropRemoved, queryClient, refreshWaveMessages, setToast]
  );
  return useMemo(() => ({ recover, isSaved }), [recover]);
}
