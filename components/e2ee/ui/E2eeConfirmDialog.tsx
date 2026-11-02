"use client";

import { useState } from "react";
import Button from "@/components/utils/button/Button";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t, type MessageKey } from "@/i18n/messages";
import { getE2eeActionErrorKey } from "../e2eeErrors";
import { E2eeDialog } from "./E2eeDialog";

interface E2eeConfirmDialogProps {
  readonly open: boolean;
  readonly title: string;
  readonly body: string;
  readonly confirmLabel: string;
  readonly destructive?: boolean | undefined;
  readonly errorFallbackKey?: MessageKey | undefined;
  readonly onConfirm: () => Promise<void>;
  readonly onClose: () => void;
}

/** Confirmation for irreversible encrypted-chat actions (revoke, leave…). */
export function E2eeConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  destructive = true,
  errorFallbackKey = "e2ee.info.actionFailed",
  onConfirm,
  onClose,
}: E2eeConfirmDialogProps) {
  const locale = useBrowserLocale();
  const [pending, setPending] = useState(false);
  const [errorKey, setErrorKey] = useState<MessageKey | null>(null);

  const close = () => {
    if (pending) {
      return;
    }
    setErrorKey(null);
    onClose();
  };

  const confirm = async () => {
    setPending(true);
    setErrorKey(null);
    try {
      await onConfirm();
      setPending(false);
      onClose();
    } catch (error) {
      setPending(false);
      setErrorKey(getE2eeActionErrorKey(error, errorFallbackKey));
    }
  };

  return (
    <E2eeDialog
      open={open}
      onClose={close}
      title={title}
      description={body}
      closeLabel={t(locale, "e2ee.action.close")}
      footer={
        <>
          <Button
            variant="secondary"
            size="md"
            onClick={close}
            disabled={pending}
          >
            {t(locale, "e2ee.action.cancel")}
          </Button>
          <Button
            variant={destructive ? "destructive" : "action"}
            size="md"
            onClick={() => void confirm()}
            loading={pending}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      {errorKey ? (
        <p role="alert" className="tw-m-0 tw-text-sm tw-text-rose-300">
          {t(locale, errorKey)}
        </p>
      ) : null}
    </E2eeDialog>
  );
}
