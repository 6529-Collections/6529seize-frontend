"use client";

import { ExclamationCircleIcon } from "@heroicons/react/24/outline";
import { useId, useState } from "react";
import Button from "@/components/utils/button/Button";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import type { E2eeConversation, E2eeMessage } from "@/lib/e2ee/types";
import type { E2eeMessageActions } from "./E2eeMessageActionsMenu";
import { getRestartError, type RestartError } from "./e2eeRestartError";

interface E2eeUnsentNoticeProps {
  readonly message: E2eeMessage;
  readonly conversation: E2eeConversation;
  readonly selfProfileId: string | null;
  readonly actions: E2eeMessageActions;
}

/**
 * An own message that was still queued when its chat moved to stronger
 * encryption (D172, `unsent: "suite_upgrade"`). It never sends by itself:
 * say so in text (not colour alone) and offer to resend it in the upgraded
 * chat or delete it. Outcomes are announced by the conversation, since this
 * row leaves the timeline when either action succeeds.
 */
export function E2eeUnsentNotice({
  message,
  conversation,
  selfProfileId,
  actions,
}: E2eeUnsentNoticeProps) {
  const locale = useBrowserLocale();
  const labelId = useId();
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<RestartError | null>(null);
  const { onResendUnsent, onDiscardUnsent } = actions;

  const resend = async () => {
    if (!onResendUnsent) return;
    setResending(true);
    setError(null);
    try {
      await onResendUnsent(message);
    } catch (error_) {
      setError(
        getRestartError(
          locale,
          error_,
          conversation,
          selfProfileId,
          "e2ee.unsent.resendFailed"
        )
      );
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="tw-mt-1.5 tw-flex tw-flex-col tw-gap-1.5">
      <p
        id={labelId}
        className="tw-m-0 tw-inline-flex tw-items-start tw-gap-1.5 tw-text-xs tw-font-medium tw-leading-5 tw-text-amber-200"
      >
        <ExclamationCircleIcon
          aria-hidden="true"
          className="tw-mt-0.5 tw-size-3.5 tw-flex-shrink-0"
        />
        <span>{t(locale, "e2ee.unsent.label")}</span>
      </p>
      {onResendUnsent || onDiscardUnsent ? (
        <div className="tw-flex tw-flex-wrap tw-gap-2">
          {onResendUnsent ? (
            <Button
              variant="secondary"
              size="xs"
              loading={resending}
              aria-describedby={labelId}
              onClick={() => void resend()}
            >
              {t(locale, "e2ee.unsent.resend")}
            </Button>
          ) : null}
          {onDiscardUnsent ? (
            <Button
              variant="secondary"
              size="xs"
              disabled={resending}
              aria-label={t(locale, "e2ee.unsent.deleteLabel")}
              aria-describedby={labelId}
              onClick={() => onDiscardUnsent(message)}
            >
              {t(locale, "e2ee.unsent.delete")}
            </Button>
          ) : null}
        </div>
      ) : null}
      {error ? (
        <p
          role="alert"
          className="tw-m-0 tw-text-xs tw-leading-5 tw-text-rose-300"
        >
          {t(locale, error.key, error.params)}
        </p>
      ) : null}
    </div>
  );
}
