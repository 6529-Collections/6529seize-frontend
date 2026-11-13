"use client";

import {
  CheckCircleIcon,
  EllipsisHorizontalIcon,
} from "@heroicons/react/24/outline";
import { useEffect, useEffectEvent, useId, useState } from "react";
import { CompactMenu } from "@/components/compact-menu";
import Button from "@/components/utils/button/Button";
import { useE2ee } from "@/hooks/e2ee/useE2ee";
import { useE2eeBackup } from "@/hooks/e2ee/useE2eeBackup";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { useDisplayTimeZone } from "@/hooks/useDisplayTimeZone";
import { formatNumber } from "@/i18n/format";
import { t, type MessageKey } from "@/i18n/messages";
import type {
  E2eeBackupManager,
  E2eeBackupSnapshot,
  PreparedBackup,
} from "@/lib/e2ee/backup";
import type { E2eeDeviceInfo } from "@/lib/e2ee/types";
import { formatE2eeDate, formatE2eeDateTime, tCount } from "../e2eeFormat";
import { E2eeBanner } from "../ui/E2eeBanner";
import { E2eeConfirmDialog } from "../ui/E2eeConfirmDialog";
import {
  E2EE_BACKUP_SETUP_EVENT,
  takeE2eeBackupSetupRequest,
} from "./backupSetupRequest";
import { BackupStatusPill, type BackupPillState } from "./BackupStatusPill";
import { getBackupErrorKey } from "./e2eeBackupErrors";
import {
  BackupProgressBar,
  BackupSetupDialog,
  formatBackupCounts,
  getBackupPercent,
} from "./BackupSetupDialog";
import { E2eeRestoreDialog } from "./E2eeRestoreDialog";

type Locale = ReturnType<typeof useBrowserLocale>;

const KILOBYTE = 1024;
const MEGABYTE = 1024 * KILOBYTE;
const GIGABYTE = 1024 * MEGABYTE;
/** How long a backup or restore result stays in the status line. */
const RESULT_VISIBLE_MS = 6000;

/**
 * Size in sensible units: whole kilobytes (rounded up) under 1 MB, so a small
 * backup never reads as "0 MB", then megabytes or gigabytes.
 */
function formatBackupSize(locale: Locale, bytes: number): string {
  const kilobytes = Math.ceil(Math.max(bytes, 0) / KILOBYTE);
  if (kilobytes < 1024) {
    return formatNumber(locale, kilobytes, {
      style: "unit",
      unit: "kilobyte",
    });
  }
  const large = bytes >= GIGABYTE;
  return formatNumber(locale, bytes / (large ? GIGABYTE : MEGABYTE), {
    style: "unit",
    unit: large ? "gigabyte" : "megabyte",
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

/**
 * Revoked devices that may still hold the backup key: any device revoked
 * after the backup was set up. A device can restore the backup and keep its
 * key without its last-seen time moving, so that time can't rule it out.
 */
function getRevokedKeyHolders(
  snapshot: E2eeBackupSnapshot,
  devices: readonly E2eeDeviceInfo[]
): E2eeDeviceInfo[] {
  const createdAt = snapshot.backupCreatedAt;
  if (snapshot.phase !== "on" || createdAt === null) {
    return [];
  }
  return devices.filter(
    (device) => device.revokedAt !== null && device.revokedAt > createdAt
  );
}

type Dialog =
  | { kind: "code"; prepared: PreparedBackup; replacing: boolean }
  | { kind: "restore" }
  | { kind: "turn-off" }
  | { kind: "start-over" }
  | null;

type DialogKind = NonNullable<Dialog>["kind"];

interface BackupResult {
  readonly text: string;
  /** A repeated result still restarts its timer. */
  readonly id: number;
}

function getPillState(snapshot: E2eeBackupSnapshot): BackupPillState | null {
  switch (snapshot.phase) {
    case "on":
      return snapshot.uploading ? "uploading" : "on";
    case "off":
      return "off";
    case "available":
      return "available";
    case "error":
      return "unknown";
    case "loading":
      return null;
  }
}

const OFF_STEPS = [
  {
    title: "devicesSecurity.backup.off.step1.title",
    body: "devicesSecurity.backup.off.step1.body",
  },
  {
    title: "devicesSecurity.backup.off.step2.title",
    body: "devicesSecurity.backup.off.step2.body",
  },
  {
    title: "devicesSecurity.backup.off.step3.title",
    body: "devicesSecurity.backup.off.step3.body",
  },
] as const satisfies readonly { title: MessageKey; body: MessageKey }[];

/** Backup off: the risk in plain words and what setting it up involves. */
function OffExplainer({ locale }: { readonly locale: Locale }) {
  return (
    <>
      <p className="tw-m-0 tw-text-sm tw-leading-6 tw-text-iron-200">
        {t(locale, "devicesSecurity.backup.off.body")}
      </p>
      <ol
        aria-label={t(locale, "devicesSecurity.backup.off.stepsLabel")}
        className="tw-m-0 tw-grid tw-list-none tw-gap-2 tw-p-0 sm:tw-grid-cols-3"
      >
        {OFF_STEPS.map((step, index) => (
          <li
            key={step.title}
            className="tw-flex tw-gap-2 tw-rounded-lg tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-900 tw-p-3"
          >
            <span
              aria-hidden="true"
              className="tw-flex tw-size-5 tw-shrink-0 tw-items-center tw-justify-center tw-rounded-full tw-bg-iron-800 tw-text-xs tw-font-semibold tw-text-iron-200"
            >
              {formatNumber(locale, index + 1)}
            </span>
            <span className="tw-min-w-0">
              <span className="tw-block tw-text-sm tw-font-semibold tw-text-iron-100">
                {t(locale, step.title)}
              </span>
              <span className="tw-mt-0.5 tw-block tw-text-xs tw-leading-5 tw-text-iron-400">
                {t(locale, step.body)}
              </span>
            </span>
          </li>
        ))}
      </ol>
    </>
  );
}

function StatusDetails({
  snapshot,
  locale,
}: {
  readonly snapshot: E2eeBackupSnapshot;
  readonly locale: Locale;
}) {
  const zone = useDisplayTimeZone();
  if (snapshot.phase !== "on") {
    return null;
  }
  // Null while the first upload (or a replacement) is still running.
  const lastBackupAt = snapshot.uploading ? null : snapshot.lastBackupAt;
  const running = lastBackupAt === null;
  const counts = formatBackupCounts(locale, snapshot);
  return (
    <div className="tw-flex tw-flex-col tw-gap-2">
      {running ? (
        <BackupProgressBar
          locale={locale}
          percent={getBackupPercent(snapshot)}
          label={t(locale, "e2ee.backup.status.uploading")}
        />
      ) : null}
      <ul className="tw-m-0 tw-flex tw-list-none tw-flex-wrap tw-gap-x-3 tw-gap-y-1 tw-p-0 tw-text-xs tw-text-iron-400">
        {lastBackupAt === null ? null : (
          <li>
            {t(locale, "e2ee.backup.status.lastBackup", {
              time: formatE2eeDateTime(locale, lastBackupAt, zone),
            })}
          </li>
        )}
        {counts ? <li>{counts}</li> : null}
        {snapshot.quotaBytes > 0 ? (
          <li>
            {t(locale, "e2ee.backup.status.usage", {
              used: formatBackupSize(locale, snapshot.usedBytes),
              quota: formatBackupSize(locale, snapshot.quotaBytes),
            })}
          </li>
        ) : null}
      </ul>
      {running ? (
        <p className="tw-m-0 tw-text-xs tw-text-iron-400">
          {t(locale, "e2ee.backup.status.keepOpen")}
        </p>
      ) : null}
    </div>
  );
}

function RotationWarning({
  holders,
  locale,
  disabled,
  onReplace,
}: {
  readonly holders: readonly E2eeDeviceInfo[];
  readonly locale: Locale;
  readonly disabled: boolean;
  readonly onReplace: () => void;
}) {
  const zone = useDisplayTimeZone();
  // One warning however many were revoked (a Clean up revokes several).
  const [only] = holders;
  const text =
    holders.length === 1 && only
      ? t(locale, "e2ee.backup.rotate.one", {
          label: only.label,
          date: formatE2eeDate(locale, only.revokedAt ?? 0, zone),
        })
      : tCount(
          locale,
          {
            one: "e2ee.backup.rotate.many.one",
            other: "e2ee.backup.rotate.many.other",
          },
          holders.length
        );
  return (
    <E2eeBanner
      tone="warning"
      live={false}
      action={
        <Button
          variant="secondary"
          size="sm"
          onClick={onReplace}
          disabled={disabled}
        >
          {t(locale, "e2ee.backup.action.newCode")}
        </Button>
      }
    >
      <p className="tw-m-0 tw-font-semibold">
        {t(locale, "e2ee.backup.rotate.title")}
      </p>
      <p className="tw-m-0 tw-mt-1">{text}</p>
    </E2eeBanner>
  );
}

function MoreMenu({
  locale,
  disabled,
  onTurnOff,
}: {
  readonly locale: Locale;
  readonly disabled: boolean;
  readonly onTurnOff: () => void;
}) {
  return (
    <CompactMenu
      aria-label={t(locale, "e2ee.backup.more")}
      autoFocusItem={false}
      triggerAsChild
      trigger={
        <button
          type="button"
          className="tw-flex tw-size-9 tw-shrink-0 tw-items-center tw-justify-center tw-rounded-lg tw-border-0 tw-bg-transparent tw-text-iron-400 tw-transition-colors focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 desktop-hover:hover:tw-bg-iron-800 desktop-hover:hover:tw-text-iron-100"
        >
          <EllipsisHorizontalIcon aria-hidden="true" className="tw-size-5" />
        </button>
      }
      menuWidthClassName="tw-w-56"
      itemClassName="tw-min-h-11"
      items={[
        {
          id: "turn-off",
          label: t(locale, "e2ee.backup.action.turnOffMenu"),
          onSelect: onTurnOff,
          disabled,
        },
      ]}
    />
  );
}

function Actions({
  snapshot,
  locale,
  pendingAction,
  showReplace,
  onTurnOn,
  onRestore,
  onStartOver,
  onBackupNow,
  onRetry,
}: {
  readonly snapshot: E2eeBackupSnapshot;
  readonly locale: Locale;
  readonly pendingAction: boolean;
  /** Hidden while the rotation warning offers the same action. */
  readonly showReplace: boolean;
  readonly onTurnOn: () => void;
  readonly onRestore: () => void;
  readonly onStartOver: () => void;
  readonly onBackupNow: () => void;
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
          <Button variant="ghost" size="sm" onClick={onStartOver}>
            {t(locale, "e2ee.backup.action.lostCode")}
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
          {showReplace ? (
            <Button
              variant="secondary"
              size="sm"
              onClick={onTurnOn}
              disabled={busy}
            >
              {t(locale, "e2ee.backup.action.newCode")}
            </Button>
          ) : null}
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
  onStartOver,
  onResult,
}: {
  readonly dialog: Dialog;
  readonly manager: E2eeBackupManager;
  readonly onClose: (kind: DialogKind) => void;
  readonly onStartOver: () => Promise<void>;
  readonly onResult: (message: string) => void;
}) {
  const locale = useBrowserLocale();
  if (dialog?.kind === "code") {
    return (
      <BackupSetupDialog
        manager={manager}
        prepared={dialog.prepared}
        replacing={dialog.replacing}
        onClose={() => onClose("code")}
      />
    );
  }
  if (dialog?.kind === "restore") {
    return (
      <E2eeRestoreDialog
        manager={manager}
        onClose={() => onClose("restore")}
        onRestored={(result) => {
          onClose("restore");
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
    <>
      <E2eeConfirmDialog
        open={dialog?.kind === "turn-off"}
        title={t(locale, "e2ee.backup.turnOff.title")}
        body={t(locale, "e2ee.backup.turnOff.body")}
        confirmLabel={t(locale, "e2ee.backup.action.turnOff")}
        errorKeyFor={getBackupErrorKey}
        onConfirm={() => manager.turnOff()}
        onClose={() => onClose("turn-off")}
      />
      <E2eeConfirmDialog
        open={dialog?.kind === "start-over"}
        title={t(locale, "e2ee.backup.startOver.title")}
        body={t(locale, "e2ee.backup.startOver.body")}
        confirmLabel={t(locale, "e2ee.backup.startOver.confirm")}
        errorKeyFor={getBackupErrorKey}
        onConfirm={onStartOver}
        onClose={() => onClose("start-over")}
      />
    </>
  );
}

/**
 * "Encrypted backup" on the devices page: turn on (recovery code shown
 * once), restore on this device, back up now and replace the recovery code.
 * Starting over without restoring and turning backup off are confirmed.
 */
export function E2eeBackupPanel() {
  const locale = useBrowserLocale();
  const { devices } = useE2ee();
  const { manager, snapshot } = useE2eeBackup();
  const titleId = useId();
  const [dialog, setDialog] = useState<Dialog>(null);
  const [preparing, setPreparing] = useState(false);
  const [actionErrorKey, setActionErrorKey] = useState<MessageKey | null>(null);
  const [result, setResult] = useState<BackupResult | null>(null);

  useEffect(() => {
    if (!result) {
      return undefined;
    }
    const timer = globalThis.setTimeout(
      () => setResult(null),
      RESULT_VISIBLE_MS
    );
    return () => globalThis.clearTimeout(timer);
  }, [result]);

  const run = async (task: () => Promise<void>) => {
    setActionErrorKey(null);
    setResult(null);
    try {
      await task();
    } catch (error) {
      setActionErrorKey(getBackupErrorKey(error));
    }
  };

  const showResult = (text: string) => setResult({ text, id: Date.now() });

  const turnOn = () => {
    if (!manager || !snapshot) {
      return;
    }
    const replacing = snapshot.phase !== "off";
    void run(async () => {
      setPreparing(true);
      try {
        const prepared = await manager.prepareBackup();
        setDialog({ kind: "code", prepared, replacing });
      } finally {
        setPreparing(false);
      }
    });
  };

  // "Set up backup" from elsewhere (revoke dialog, setup's last step, the
  // inbox reminder): start setup, or restore when a backup exists. A request
  // waits while backup is still loading.
  const phase = snapshot?.phase ?? null;
  const onSetupRequest = useEffectEvent(() => {
    if (phase !== "off" && phase !== "available" && phase !== "on") {
      return;
    }
    if (!takeE2eeBackupSetupRequest()) {
      return;
    }
    if (phase === "off") {
      turnOn();
    } else if (phase === "available") {
      setDialog({ kind: "restore" });
    }
  });
  useEffect(() => {
    const listener = () => onSetupRequest();
    globalThis.addEventListener(E2EE_BACKUP_SETUP_EVENT, listener);
    return () =>
      globalThis.removeEventListener(E2EE_BACKUP_SETUP_EVENT, listener);
  }, []);
  // A request made before this card mounted or before backup had loaded,
  // taken on the next tick (the request store is external to React).
  useEffect(() => {
    const timer = globalThis.setTimeout(() => onSetupRequest(), 0);
    return () => globalThis.clearTimeout(timer);
  }, [phase]);

  if (!manager || !snapshot) {
    return (
      <E2eeBanner tone="warning" live={false}>
        {t(locale, "e2ee.enroll.point.noBackup")}
      </E2eeBanner>
    );
  }

  const busy = snapshot.busy || preparing;
  const holders = getRevokedKeyHolders(snapshot, devices);
  const pill = getPillState(snapshot);
  const errorKey =
    actionErrorKey ??
    (snapshot.lastError ? getBackupErrorKey(snapshot.lastError) : null);

  return (
    <section
      aria-labelledby={titleId}
      className="tw-flex tw-flex-col tw-gap-3 tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-p-4"
    >
      <div className="tw-flex tw-items-start tw-justify-between tw-gap-3">
        <div className="tw-flex tw-min-w-0 tw-flex-wrap tw-items-center tw-gap-2">
          <h2
            id={titleId}
            className="tw-m-0 tw-text-base tw-font-semibold tw-text-iron-50"
          >
            {t(locale, "e2ee.backup.title")}
          </h2>
          {pill ? <BackupStatusPill locale={locale} state={pill} /> : null}
        </div>
        {snapshot.phase === "on" ? (
          <MoreMenu
            locale={locale}
            disabled={busy}
            onTurnOff={() => setDialog({ kind: "turn-off" })}
          />
        ) : null}
      </div>
      {snapshot.phase === "off" ? (
        <OffExplainer locale={locale} />
      ) : (
        <p className="tw-m-0 tw-text-sm tw-leading-6 tw-text-iron-300">
          {t(locale, "e2ee.backup.description")}
        </p>
      )}
      <div className="tw-flex tw-flex-col tw-gap-1">
        {snapshot.phase === "off" ? null : (
          <p className="tw-m-0 tw-text-sm tw-font-medium tw-text-iron-100">
            {t(locale, STATUS_KEYS[snapshot.phase])}
          </p>
        )}
        <StatusDetails snapshot={snapshot} locale={locale} />
        {/* Results join the status line briefly, then clear themselves. */}
        <output className="tw-flex tw-items-center tw-gap-1.5 tw-text-xs tw-font-medium tw-text-emerald-300">
          {result ? (
            <>
              <CheckCircleIcon
                aria-hidden="true"
                className="tw-size-4 tw-shrink-0"
              />
              {result.text}
            </>
          ) : null}
        </output>
      </div>
      {holders.length > 0 ? (
        <RotationWarning
          holders={holders}
          locale={locale}
          disabled={busy}
          onReplace={turnOn}
        />
      ) : null}
      <div className="tw-flex tw-flex-col tw-gap-2 sm:tw-flex-row sm:tw-flex-wrap">
        <Actions
          snapshot={snapshot}
          locale={locale}
          pendingAction={preparing}
          showReplace={holders.length === 0}
          onTurnOn={turnOn}
          onRestore={() => setDialog({ kind: "restore" })}
          onStartOver={() => setDialog({ kind: "start-over" })}
          onBackupNow={() =>
            void run(async () => {
              // Not complete (a repair run is queued): the status line says
              // it is still backing up until that run succeeds.
              if (await manager.backupNow()) {
                showResult(t(locale, "e2ee.backup.upToDate"));
              }
            })
          }
          onRetry={() => void run(() => manager.refresh())}
        />
      </div>
      {snapshot.phase === "off" ? (
        <p className="tw-m-0 tw-text-xs tw-leading-5 tw-text-iron-400">
          {t(locale, "devicesSecurity.backup.off.note")}
        </p>
      ) : null}
      {errorKey ? (
        <p role="alert" className="tw-m-0 tw-text-sm tw-text-rose-300">
          {t(locale, errorKey)}
        </p>
      ) : null}
      <BackupDialogs
        dialog={dialog}
        manager={manager}
        // Only closes the dialog that asked: the start-over confirmation has
        // already handed over to the code dialog when it closes.
        onClose={(kind) =>
          setDialog((current) => (current?.kind === kind ? null : current))
        }
        onStartOver={async () => {
          const prepared = await manager.prepareBackup();
          setDialog({ kind: "code", prepared, replacing: true });
        }}
        onResult={showResult}
      />
    </section>
  );
}
