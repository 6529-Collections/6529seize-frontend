"use client";

import type { AppToastInput } from "@/components/utils/toast/AppToast";
import { ApiDropType } from "@/generated/models/ApiDropType";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { useCallback, useRef } from "react";
import type { DropMutationBody } from "./drop-submission.types";
import type { WaveGuidelinesAgreementResult } from "./useWaveGuidelinesAgreement";

const isTypedChatMessage = (drop: DropMutationBody["drop"]): boolean =>
  drop.drop_type === ApiDropType.Chat &&
  drop.parts.some(
    (part) => typeof part.content === "string" && part.content.trim().length > 0
  );

export function useWaveGuidelinesSubmission({
  enqueueDrop,
  requestGuidelinesAgreement,
  setToast,
}: {
  readonly enqueueDrop: (dropRequest: DropMutationBody) => boolean;
  readonly requestGuidelinesAgreement: (
    dropType: ApiDropType | undefined
  ) => Promise<WaveGuidelinesAgreementResult>;
  readonly setToast: (toast: AppToastInput) => void;
}) {
  const locale = useBrowserLocale();
  const pendingTypedSubmissionRef = useRef<Promise<boolean> | null>(null);

  return useCallback(
    (dropRequest: DropMutationBody): boolean | Promise<boolean> => {
      if (!isTypedChatMessage(dropRequest.drop)) {
        return enqueueDrop(dropRequest);
      }

      if (pendingTypedSubmissionRef.current !== null) {
        return pendingTypedSubmissionRef.current;
      }

      const submission = requestGuidelinesAgreement(dropRequest.drop.drop_type)
        .then((guidelinesAgreement) => {
          if (guidelinesAgreement === "accepted") {
            return enqueueDrop(dropRequest);
          }
          if (guidelinesAgreement === "unavailable") {
            setToast({
              type: "error",
              title: t(locale, "waves.chat.guidelinesDialog.loadErrorTitle"),
              description: t(
                locale,
                "waves.chat.guidelinesDialog.loadErrorDescription"
              ),
            });
          }
          return false;
        })
        .catch(() => {
          setToast({
            type: "error",
            title: t(locale, "waves.chat.guidelinesDialog.loadErrorTitle"),
            description: t(
              locale,
              "waves.chat.guidelinesDialog.loadErrorDescription"
            ),
          });
          return false;
        });

      pendingTypedSubmissionRef.current = submission;
      void submission.finally(() => {
        if (pendingTypedSubmissionRef.current === submission) {
          pendingTypedSubmissionRef.current = null;
        }
      });
      return submission;
    },
    [enqueueDrop, locale, requestGuidelinesAgreement, setToast]
  );
}
