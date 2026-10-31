"use client";

import { useId, useState } from "react";
import Button from "@/components/utils/button/Button";
import { useE2ee } from "@/hooks/e2ee/useE2ee";
import { useE2eeBackup } from "@/hooks/e2ee/useE2eeBackup";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatNumber } from "@/i18n/format";
import { t, type MessageKey } from "@/i18n/messages";
import type {
  E2eeBackupManager,
  E2eeBackupSnapshot,
  PreparedBackup,
} from "@/lib/e2ee/backup";
import type { E2eeDeviceInfo } from "@/lib/e2ee/types";
import { formatE2eeDateTime, tCount } from "../e2eeFormat";
import { E2eeBanner } from "../ui/E2eeBanner";
import { E2eeConfirmDialog } from "../ui/E2eeConfirmDialog";
import { getBackupErrorKey } from "./e2eeBackupErrors";
import { E2eeRecoveryCodeDialog } from "./E2eeRecoveryCodeDialog";
import { E2eeRestoreDialog } from "./E2eeRestoreDialog";

type Locale = ReturnType<typeof useBrowserLocale>;

function formatMegabytes(locale: Locale, bytes: number): string {
  return formatNumber(locale, bytes / (1024 * 1024), {
    style: "unit",
    unit: "megabyte",
    maximumFractionDigits: 1,
  });
}

const STATUS_KEYS: Record<E2eeBackupSnapshot["phase"], MessageKey> = {
  loading: "e2ee.backup.status.loading",
  off: "e2ee.backup.status.off",
  available: "e2ee.backup.status.available",
  on: "e2ee.backup.status.on",
  error: "e2ee.backup.status.error",
};

/** A device revoked after the backup was set up still knew its key. */
function revokedSinceBackup(
  snapshot: E2eeBackupSnapshot,
  devices: readonly E2eeDeviceInfo[]
): boolean {
  const createdAt = snapshot.backupCreatedAt;
  return (
    snapshot.phase === "on" &&
    createdAt !== null &&
    devices.some(
      (device) => device.revokedAt !== null && device.revokedAt > createdAt
    )
  );
}

type Dialog =
  | { kind: "code"; prepared: PreparedBackup; replacing: boolean }
  | { kind: "restore" }
  | { kind: "turn-off" }
  | null;

function StatusDetails({
  snapshot,
  locale,
}: {
  readonly snapshot: E2eeBackupSnapshot;
  readonly locale: Locale;
}) {
  if (snapshot.phase !== "on") {
    return null;
  }
  return (
    <ul className="tw-m-0 tw-list-none tw-space-y-1 tw-p-0 tw-text-xs tw-text-iron-400">
      <li>
        {snapshot.uploading || snapshot.lastBackupAt === null
          ? t(locale, "e2ee.backup.status.uploading")
          : t(locale, "e2ee.backup.status.lastBackup", {
              time: formatE2eeDateTime(locale, snapshot.lastBackupAt),
            })}
      </li>
      {snapshot.quotaBytes > 0 ? (
        <li>
          {t(locale, "e2ee.backup.status.usage", {
            used: formatMegabytes(locale, snapshot.usedBytes),
            quota: formatMegabytes(locale, snapshot.quotaBytes),
          })}
        </li>
      ) : null}
    </ul>
  );
}

function Actions({
  snapshot,
  locale,
  pendingAction,
  onTurnOn,
  onRestore,
  onBackupNow,
  onTurnOff,
  onRetry,
}: {
  readonly snapshot: E2eeBackupSnapshot;
  readonly locale: Locale;
  readonly pendingAction: boolean;
  readonly onTurnOn: () => void;
  readonly onRestore: () => void;
  readonly onBackupNow: () => void;
  readonly onTurnOff: () => void;
  readonly onRetry: () => void;
}) {
  const busy = snapshot.busy || pendingAction;
  switch (snapshot.phase) {
    case "off":
      return (
        <Button
          variant="action"
          size="sm"
          onClick={onTurnOn}
          loading={pendingAction}
        >
          {t(locale, "e2ee.backup.action.turnOn")}
        </Button>
      );
    case "available":
      return (
        <>
          <Button variant="action" size="sm" onClick={onRestore}>
            {t(locale, "e2ee.backup.action.restore")}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={onTurnOn}
            loading={pendingAction}
          >
            {t(locale, "e2ee.backup.action.replace")}
          </Button>
        </>
      );
    case "on":
      return (
        <>
          <Button
            variant="secondary"
            size="sm"
            onClick={onBackupNow}
            loading={busy}
          >
            {t(locale, "e2ee.backup.action.backupNow")}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={onTurnOn}
            disabled={busy}
          >
            {t(locale, "e2ee.backup.action.newCode")}
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={onTurnOff}
            disabled={busy}
          >
            {t(locale, "e2ee.backup.action.turnOff")}
          </Button>
        </>
      );
    case "error":
      return (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          {t(locale, "e2ee.backup.action.retry")}
        </Button>
      );
    case "loading":
      return null;
  }
}

function BackupDialogs({
  dialog,
  manager,
  onClose,
  onResult,
}: {
  readonly dialog: Dialog;
  readonly manager: E2eeBackupManager;
  readonly onClose: () => void;
  readonly onResult: (message: string) => void;
}) {
  const locale = useBrowserLocale();
  if (dialog?.kind === "code") {
    return (
      <E2eeRecoveryCodeDialog
        manager={manager}
        prepared={dialog.prepared}
        replacing={dialog.replacing}
        onClose={onClose}
        onDone={() => {
          onClose();
          onResult(t(locale, "e2ee.backup.backedUp"));
        }}
      />
    );
  }
  if (dialog?.kind === "restore") {
    return (
      <E2eeRestoreDialog
        manager={manager}
        onClose={onClose}
        onRestored={(result) => {
          onClose();
          onResult(
            result.messages > 0
              ? tCount(
                  locale,
                  {
                    one: "e2ee.backup.restore.done.one",
                    other: "e2ee.backup.restore.done.other",
                  },
                  result.messages
                )
              : t(locale, "e2ee.backup.restore.doneNothing")
          );
        }}
      />
    );
  }
  return (
    <E2eeConfirmDialog
      open={dialog?.kind === "turn-off"}
      title={t(locale, "e2ee.backup.turnOff.title")}
      body={t(locale, "e2ee.backup.turnOff.body")}
      confirmLabel={t(locale, "e2ee.backup.action.turnOff")}
      errorFallbackKey="e2ee.backup.error.generic"
      onConfirm={() => manager.turnOff()}
      onClose={onClose}
    />
  );
}

/**
 * "Encrypted backup" on the devices page: turn on (recovery code shown
 * once), restore on this device, back up now, new recovery code, turn off.
 */
export function E2eeBackupPanel() {
  const locale = useBrowserLocale();
  const { devices } = useE2ee();
  const { manager, snapshot } = useE2eeBackup();
  const titleId = useId();
  const [dialog, setDialog] = useState<Dialog>(null);
  const [preparing, setPreparing] = useState(false);
  const [actionErrorKey, setActionErrorKey] = useState<MessageKey | null>(null);
  const [result, setResult] = useState<string | null>(null);

  if (!manager || !snapshot) {
    return (
      <E2eeBanner tone="warning" live={false}>
        {t(locale, "e2ee.enroll.point.noBackup")}
      </E2eeBanner>
    );
  }

  const run = async (task: () => Promise<void>) => {
    setActionErrorKey(null);
    setResult(null);
    try {
      await task();
    } catch (error) {
      setActionErrorKey(getBackupErrorKey(error));
    }
  };

  const turnOn = () =>
    void run(async () => {
      setPreparing(true);
      try {
        const prepared = await manager.prepareBackup();
        setDialog({
          kind: "code",
          prepared,
          replacing: snapshot.phase !== "off",
        });
      } finally {
        setPreparing(false);
      }
    });

  const errorKey =
    actionErrorKey ??
    (snapshot.lastError ? getBackupErrorKey(snapshot.lastError) : null);

  return (
    <section
      aria-labelledby={titleId}
      className="tw-flex tw-flex-col tw-gap-3 tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-p-4"
    >
      <h2
        id={titleId}
        className="tw-m-0 tw-text-base tw-font-semibold tw-text-iron-50"
      >
        {t(locale, "e2ee.backup.title")}
      </h2>
      <p className="tw-m-0 tw-text-sm tw-leading-6 tw-text-iron-300">
        {t(locale, "e2ee.backup.description")}
      </p>
      <p
        className={`tw-m-0 tw-text-sm tw-font-medium ${
          snapshot.phase === "off" ? "tw-text-amber-200" : "tw-text-iron-100"
        }`}
      >
        {t(locale, STATUS_KEYS[snapshot.phase])}
      </p>
      <StatusDetails snapshot={snapshot} locale={locale} />
      {revokedSinceBackup(snapshot, devices) ? (
        <E2eeBanner tone="warning" live={false}>
          {t(locale, "e2ee.backup.revokedWarning")}
        </E2eeBanner>
      ) : null}
      <div className="tw-flex tw-flex-col tw-gap-2 sm:tw-flex-row sm:tw-flex-wrap">
        <Actions
          snapshot={snapshot}
          locale={locale}
          pendingAction={preparing}
          onTurnOn={turnOn}
          onRestore={() => setDialog({ kind: "restore" })}
          onBackupNow={() => void run(() => manager.backupNow())}
          onTurnOff={() => setDialog({ kind: "turn-off" })}
          onRetry={() => void run(() => manager.refresh())}
        />
      </div>
      {errorKey ? (
        <p role="alert" className="tw-m-0 tw-text-sm tw-text-rose-300">
          {t(locale, errorKey)}
        </p>
      ) : null}
      <output className="tw-block tw-text-sm tw-text-iron-300">{result}</output>
      <BackupDialogs
        dialog={dialog}
        manager={manager}
        onClose={() => setDialog(null)}
        onResult={setResult}
      />
    </section>
  );
}
