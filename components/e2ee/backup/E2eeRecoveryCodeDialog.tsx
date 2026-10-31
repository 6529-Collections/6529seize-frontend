"use client";

import { useId, useState } from "react";
import Button from "@/components/utils/button/Button";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t, type MessageKey } from "@/i18n/messages";
import type { E2eeBackupManager, PreparedBackup } from "@/lib/e2ee/backup";
import { E2eeDialog } from "../ui/E2eeDialog";
import { getBackupErrorKey } from "./e2eeBackupErrors";

interface E2eeRecoveryCodeDialogProps {
  readonly manager: E2eeBackupManager;
  readonly prepared: PreparedBackup;
  /** True when this replaces an existing backup (new recovery code). */
  readonly replacing: boolean;
  readonly onClose: () => void;
  readonly onDone: () => void;
}

function downloadCode(
  locale: ReturnType<typeof useBrowserLocale>,
  code: string
) {
  const text = [
    t(locale, "e2ee.backup.code.fileHeading"),
    "",
    code,
    "",
    t(locale, "e2ee.backup.code.fileNote"),
    "",
  ].join("\n");
  const url = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = t(locale, "e2ee.backup.code.fileName");
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

/**
 * Shows a new recovery code once, with copy and download, and turns the
 * backup on only after the user confirms they saved it. The code is never
 * stored; closing the dialog discards it.
 */
export function E2eeRecoveryCodeDialog({
  manager,
  prepared,
  replacing,
  onClose,
  onDone,
}: E2eeRecoveryCodeDialogProps) {
  const locale = useBrowserLocale();
  const codeId = useId();
  const savedId = useId();
  const [saved, setSaved] = useState(false);
  const [pending, setPending] = useState(false);
  const [copyKey, setCopyKey] = useState<MessageKey | null>(null);
  const [errorKey, setErrorKey] = useState<MessageKey | null>(null);

  const close = () => {
    if (!pending) {
      onClose();
    }
  };

  const copy = async () => {
    // Clear first so a repeated identical status is announced again.
    setCopyKey(null);
    try {
      await navigator.clipboard.writeText(prepared.code);
      setCopyKey("e2ee.backup.code.copied");
    } catch {
      setCopyKey("e2ee.backup.code.copyFailed");
    }
  };

  const confirm = async () => {
    setPending(true);
    setErrorKey(null);
    try {
      await manager.confirmBackup(prepared);
      setPending(false);
      onDone();
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
      title={t(
        locale,
        replacing ? "e2ee.backup.code.newTitle" : "e2ee.backup.code.title"
      )}
      description={
        <>
          {t(locale, "e2ee.backup.code.description")}
          {replacing ? (
            <span className="tw-mt-2 tw-block">
              {t(locale, "e2ee.backup.code.replaceNote")}
            </span>
          ) : null}
        </>
      }
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
            variant="action"
            size="md"
            onClick={() => void confirm()}
            loading={pending}
            disabled={!saved}
          >
            {t(
              locale,
              replacing
                ? "e2ee.backup.code.confirmNew"
                : "e2ee.backup.code.confirm"
            )}
          </Button>
        </>
      }
    >
      <div className="tw-flex tw-flex-col tw-gap-4">
        <div>
          <p
            id={codeId}
            className="tw-m-0 tw-text-sm tw-font-semibold tw-text-iron-200"
          >
            {t(locale, "e2ee.backup.code.label")}
          </p>
          <p
            aria-labelledby={codeId}
            data-testid="e2ee-recovery-code"
            className="tw-m-0 tw-mt-2 tw-select-all tw-break-all tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-px-3 tw-py-3 tw-font-mono tw-text-base tw-leading-7 tw-tracking-wide tw-text-iron-50"
          >
            {prepared.code}
          </p>
        </div>
        <div className="tw-flex tw-flex-col tw-gap-2 sm:tw-flex-row">
          <Button variant="secondary" size="sm" onClick={() => void copy()}>
            {t(locale, "e2ee.backup.code.copy")}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => downloadCode(locale, prepared.code)}
          >
            {t(locale, "e2ee.backup.code.download")}
          </Button>
        </div>
        <output className="tw-block tw-min-h-5 tw-text-xs tw-text-iron-400">
          {copyKey ? t(locale, copyKey) : null}
        </output>
        <div className="tw-flex tw-items-start tw-gap-3">
          <input
            id={savedId}
            type="checkbox"
            checked={saved}
            onChange={(event) => setSaved(event.target.checked)}
            className="tw-mt-1 tw-size-4 tw-flex-shrink-0 tw-accent-primary-500"
          />
          <label htmlFor={savedId} className="tw-text-sm tw-text-iron-200">
            {t(locale, "e2ee.backup.code.saved")}
          </label>
        </div>
        {errorKey ? (
          <p role="alert" className="tw-m-0 tw-text-sm tw-text-rose-300">
            {t(locale, errorKey)}
          </p>
        ) : null}
      </div>
    </E2eeDialog>
  );
}
