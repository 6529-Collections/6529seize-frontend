"use client";

import { type FormEvent, useId, useState } from "react";
import Button from "@/components/utils/button/Button";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t, type MessageKey } from "@/i18n/messages";
import type { E2eeBackupManager, RestoreResult } from "@/lib/e2ee/backup";
import { E2eeDialog } from "../ui/E2eeDialog";
import { getBackupErrorKey } from "./e2eeBackupErrors";

interface E2eeRestoreDialogProps {
  readonly manager: E2eeBackupManager;
  readonly onClose: () => void;
  readonly onRestored: (result: RestoreResult) => void;
}

/** Restore past history on this device with the recovery code. */
export function E2eeRestoreDialog({
  manager,
  onClose,
  onRestored,
}: E2eeRestoreDialogProps) {
  const locale = useBrowserLocale();
  const inputId = useId();
  const errorId = useId();
  const [code, setCode] = useState("");
  const [pending, setPending] = useState(false);
  const [errorKey, setErrorKey] = useState<MessageKey | null>(null);

  const close = () => {
    if (!pending) {
      onClose();
    }
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);
    setErrorKey(null);
    try {
      const result = await manager.restore(code);
      setPending(false);
      onRestored(result);
    } catch (error) {
      setPending(false);
      setErrorKey(getBackupErrorKey(error));
    }
  };

  return (
    <E2eeDialog
      open
      onClose={close}
      size="md"
      title={t(locale, "e2ee.backup.restore.title")}
      description={t(locale, "e2ee.backup.restore.description")}
      closeLabel={t(locale, "e2ee.action.close")}
    >
      <form
        onSubmit={(event) => void submit(event)}
        className="tw-flex tw-flex-col tw-gap-3"
      >
        <label
          htmlFor={inputId}
          className="tw-text-sm tw-font-semibold tw-text-iron-200"
        >
          {t(locale, "e2ee.backup.restore.label")}
        </label>
        <textarea
          id={inputId}
          value={code}
          rows={3}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          aria-invalid={errorKey !== null}
          aria-describedby={errorKey ? errorId : undefined}
          onChange={(event) => {
            setCode(event.target.value);
            setErrorKey(null);
          }}
          className="tw-w-full tw-resize-none tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-px-3 tw-py-2 tw-font-mono tw-text-sm tw-text-iron-100 focus:tw-border-primary-400 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-primary-400"
        />
        {errorKey ? (
          <p
            id={errorId}
            role="alert"
            className="tw-m-0 tw-text-sm tw-text-rose-300"
          >
            {t(locale, errorKey)}
          </p>
        ) : null}
        <div className="tw-mt-2 tw-flex tw-flex-col-reverse tw-gap-3 sm:tw-flex-row sm:tw-justify-end">
          <Button
            variant="secondary"
            size="md"
            onClick={close}
            disabled={pending}
          >
            {t(locale, "e2ee.action.cancel")}
          </Button>
          <Button
            type="submit"
            variant="action"
            size="md"
            loading={pending}
            disabled={code.trim() === ""}
          >
            {t(locale, "e2ee.backup.restore.submit")}
          </Button>
        </div>
      </form>
    </E2eeDialog>
  );
}
