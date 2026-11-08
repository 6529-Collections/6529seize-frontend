"use client";

import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/components/auth/Auth";
import { removeTemporaryThreadReply } from "@/components/waves/drops/reply-threads/pending-replies";
import { useMyStreamActions } from "@/contexts/wave/MyStreamContext";
import type { ApiWave } from "@/generated/models/ApiWave";
import { isWaveRepliesCollapsed } from "@/helpers/waves/collapsed-replies.helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import {
  getStructuredApiErrorCode,
  getStructuredApiErrorStatus,
} from "@/services/api/common-api";
import type { DropMutationBody } from "./drop-submission.types";

const DROP_SAVED_REFRESH_ERROR_CODE = "DROP_SAVED_REFRESH";

/**
 * The API answers 409 DROP_SAVED_REFRESH when it saved a drop but could not
 * read it back. The drop was posted and no realtime update follows, so this
 * replaces the pending drop with a reload of the wave's newest messages and
 * says it was posted. Returns false for any other error.
 */
export function useSavedDropRecovery(wave: ApiWave) {
  const queryClient = useQueryClient();
  const { setToast } = useAuth();
  const { processDropRemoved, refreshWaveMessages } = useMyStreamActions();
  const locale = useBrowserLocale();

  return useCallback(
    (error: unknown, body: DropMutationBody): boolean => {
      if (
        getStructuredApiErrorStatus(error) !== 409 ||
        getStructuredApiErrorCode(error) !== DROP_SAVED_REFRESH_ERROR_CODE
      ) {
        return false;
      }
      const waveId = body.drop.wave_id;
      if (body.dropId) {
        if (isWaveRepliesCollapsed(wave)) {
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
    [
      locale,
      processDropRemoved,
      queryClient,
      refreshWaveMessages,
      setToast,
      wave,
    ]
  );
}
