"use client";

import { useId, useState, useSyncExternalStore, type ReactNode } from "react";
import Button from "@/components/utils/button/Button";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatInteger, formatList, formatNumber } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";
import type {
  E2eeBackupManager,
  E2eeBackupSnapshot,
  PreparedBackup,
} from "@/lib/e2ee/backup";
import { normalizeRecoveryCode } from "@/lib/e2ee/backup/recovery-code";
import { tCount } from "../e2eeFormat";
import { E2eeDialog } from "../ui/E2eeDialog";
import { getBackupErrorKey } from "./e2eeBackupErrors";

type Step = "why" | "save" | "check" | "upload";
type UploadState = "running" | "done" | "failed";

const STEP_NUMBER: Record<Step, number> = {
  why: 1,
  save: 2,
  check: 3,
  upload: 4,
};
/** After this many misses the check suggests saving the code again. */
const MISSES_BEFORE_HINT = 3;

/** Two different groups to type back, chosen once per dialog. */
function pickCheckGroups(count: number): readonly [number, number] {
  const first = Math.floor(Math.random() * count);
  const offset = 1 + Math.floor(Math.random() * (count - 1));
  return [first, (first + offset) % count].toSorted((a, b) => a - b) as [
    number,
    number,
  ];
}

function downloadCode(locale: SupportedLocale, code: string) {
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

/** "38 chats, 1,240 messages" from the snapshot, or null before a backup. */
export function formatBackupCounts(
  locale: SupportedLocale,
  snapshot: E2eeBackupSnapshot
): string | null {
  const counts = snapshot.counts;
  if (!counts) {
    return null;
  }
  return formatList(
    locale,
    [
      tCount(
        locale,
        {
          one: "e2ee.backup.counts.chats.one",
          other: "e2ee.backup.counts.chats.other",
        },
        counts.chats
      ),
      tCount(
        locale,
        {
          one: "e2ee.backup.counts.messages.one",
          other: "e2ee.backup.counts.messages.other",
        },
        counts.messages
      ),
    ],
    { style: "short", type: "unit" }
  );
}

/** Share of the current upload, or null when it can't be measured. */
export function getBackupPercent(snapshot: E2eeBackupSnapshot): number | null {
  const progress = snapshot.progress;
  if (!progress || progress.total <= 0) {
    return null;
  }
  return Math.min(1, progress.done / progress.total);
}

export function BackupProgressBar({
  locale,
  percent,
  label,
}: {
  readonly locale: SupportedLocale;
  readonly percent: number | null;
  readonly label: string;
}) {
  return (
    <div className="tw-flex tw-flex-col tw-gap-1.5">
      <div className="tw-flex tw-items-center tw-justify-between tw-gap-3 tw-text-xs tw-text-iron-300">
        <span>{label}</span>
        {percent === null ? null : (
          <span>{formatNumber(locale, percent, { style: "percent" })}</span>
        )}
      </div>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent === null ? undefined : Math.round(percent * 100)}
        className="tw-h-1.5 tw-overflow-hidden tw-rounded-full tw-bg-iron-800"
      >
        <div
          className={`tw-h-full tw-rounded-full tw-bg-primary-400 ${
            percent === null
              ? "tw-w-1/3 motion-safe:tw-animate-pulse"
              : "tw-transition-[width] motion-reduce:tw-transition-none"
          }`}
          style={
            percent === null
              ? undefined
              : { width: `${Math.max(4, Math.round(percent * 100))}%` }
          }
        />
      </div>
    </div>
  );
}

function StepLabel({ step }: { readonly step: Step }) {
  const locale = useBrowserLocale();
  return (
    <p className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide tw-text-iron-500">
      {t(locale, "e2ee.backup.setup.step", {
        step: formatInteger(locale, STEP_NUMBER[step]),
        total: formatInteger(locale, 4),
      })}
    </p>
  );
}

function Lines({ keys }: { readonly keys: readonly MessageKey[] }) {
  const locale = useBrowserLocale();
  return (
    <div className="tw-flex tw-flex-col tw-gap-2 tw-text-sm tw-leading-6 tw-text-iron-300">
      {keys.map((key) => (
        <p key={key} className="tw-m-0">
          {t(locale, key)}
        </p>
      ))}
    </div>
  );
}

interface CodeGroup {
  /** 1-based position, also the number shown and asked for. */
  readonly number: number;
  readonly value: string;
}

function CodeGroups({
  groups,
  labelId,
}: {
  readonly groups: readonly CodeGroup[];
  readonly labelId: string;
}) {
  const locale = useBrowserLocale();
  return (
    <ol
      aria-labelledby={labelId}
      className="tw-m-0 tw-grid tw-list-none tw-grid-cols-2 tw-gap-2 tw-p-0 sm:tw-grid-cols-4"
    >
      {groups.map((group) => (
        <li
          key={group.number}
          className="tw-flex tw-items-baseline tw-gap-2 tw-rounded-lg tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-900 tw-px-2.5 tw-py-2"
        >
          <span className="tw-w-5 tw-text-right tw-text-xs tw-text-iron-500">
            {formatInteger(locale, group.number)}
          </span>
          <span className="tw-font-mono tw-text-base tw-tracking-wider tw-text-iron-50">
            {group.value}
          </span>
        </li>
      ))}
    </ol>
  );
}

const inputClass =
  "tw-mt-1 tw-w-full tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-px-3 tw-py-2 tw-font-mono tw-text-base tw-uppercase tw-tracking-wider tw-text-iron-100 focus:tw-border-primary-400 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-primary-400";

function Field({
  label,
  value,
  invalid,
  onChange,
  maxLength,
}: {
  readonly label: string;
  readonly value: string;
  readonly invalid: boolean;
  readonly onChange: (value: string) => void;
  readonly maxLength?: number;
}) {
  const id = useId();
  return (
    <div className="tw-min-w-0 tw-flex-1">
      <label
        htmlFor={id}
        className="tw-block tw-text-sm tw-font-semibold tw-text-iron-200"
      >
        {label}
      </label>
      <input
        id={id}
        value={value}
        maxLength={maxLength}
        autoComplete="off"
        autoCapitalize="characters"
        spellCheck={false}
        aria-invalid={invalid || undefined}
        onChange={(event) => onChange(event.target.value)}
        className={inputClass}
      />
    </div>
  );
}

interface StepContent {
  readonly title: string;
  readonly body: ReactNode;
  readonly footer: ReactNode;
}

const WHY_KEYS: readonly MessageKey[] = [
  "e2ee.backup.setup.why.risk",
  "e2ee.backup.setup.why.copy",
  "e2ee.backup.setup.why.auto",
  "e2ee.backup.setup.why.next",
];
const REPLACE_KEYS: readonly MessageKey[] = [
  "e2ee.backup.setup.replace.body",
  "e2ee.backup.setup.replace.loss",
  "e2ee.backup.setup.why.next",
];

/** Step 2: the code, with Copy, Download and the paper option. */
function SaveBody({
  code,
  groups,
  onPaper,
  canContinue,
  onSaved,
  onPaperChange,
}: {
  readonly code: string;
  readonly groups: readonly CodeGroup[];
  readonly onPaper: boolean;
  readonly canContinue: boolean;
  readonly onSaved: () => void;
  readonly onPaperChange: (onPaper: boolean) => void;
}) {
  const locale = useBrowserLocale();
  const labelId = useId();
  const [copyKey, setCopyKey] = useState<MessageKey | null>(null);
  const copy = async () => {
    setCopyKey(null);
    try {
      await navigator.clipboard.writeText(code);
      onSaved();
      setCopyKey("e2ee.backup.setup.save.copied");
    } catch {
      setCopyKey("e2ee.backup.code.copyFailed");
    }
  };
  return (
    <div className="tw-flex tw-flex-col tw-gap-3">
      <p className="tw-m-0 tw-text-sm tw-leading-6 tw-text-iron-300">
        {t(locale, "e2ee.backup.setup.save.body")}
      </p>
      <p id={labelId} className="tw-sr-only">
        {t(locale, "e2ee.backup.code.label")}
      </p>
      <CodeGroups groups={groups} labelId={labelId} />
      <div className="tw-flex tw-flex-wrap tw-gap-2">
        <Button variant="secondary" size="sm" onClick={() => void copy()}>
          {t(locale, "e2ee.backup.code.copy")}
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            downloadCode(locale, code);
            onSaved();
          }}
        >
          {t(locale, "e2ee.backup.code.download")}
        </Button>
      </div>
      <output className="tw-block tw-text-xs tw-text-iron-300">
        {copyKey ? t(locale, copyKey) : null}
      </output>
      <label className="tw-flex tw-items-center tw-gap-2 tw-text-sm tw-text-iron-200">
        <input
          type="checkbox"
          checked={onPaper}
          onChange={(event) => onPaperChange(event.target.checked)}
          className="tw-size-4 tw-accent-primary-500"
        />
        {t(locale, "e2ee.backup.setup.save.paper")}
      </label>
      <p className="tw-m-0 tw-rounded-lg tw-bg-amber-500/10 tw-p-3 tw-text-xs tw-leading-5 tw-text-amber-100">
        {t(locale, "e2ee.backup.setup.save.private")}
      </p>
      {canContinue ? null : (
        <p className="tw-m-0 tw-text-xs tw-text-iron-400">
          {t(locale, "e2ee.backup.setup.save.hint")}
        </p>
      )}
    </div>
  );
}

/** Which typed group (or the whole code) doesn't match, if any. */
function findMismatch({
  pasting,
  code,
  whole,
  wanted,
  groups,
  entries,
}: {
  readonly pasting: boolean;
  readonly code: string;
  readonly whole: string;
  readonly wanted: readonly [number, number];
  readonly groups: readonly CodeGroup[];
  readonly entries: readonly [string, string];
}): number | "code" | null {
  if (pasting) {
    return normalizeRecoveryCode(whole) === normalizeRecoveryCode(code)
      ? null
      : "code";
  }
  const wrong = wanted.find(
    (groupIndex, slot) =>
      normalizeRecoveryCode(entries[slot] ?? "") !==
      normalizeRecoveryCode(groups[groupIndex]?.value ?? "")
  );
  return wrong ?? null;
}

/** Step 3: two groups (or the whole code), checked in the browser. */
function CheckForm({
  formId,
  code,
  groups,
  wanted,
  errorKey,
  onValid,
  onSeeAgain,
}: {
  readonly formId: string;
  readonly code: string;
  readonly groups: readonly CodeGroup[];
  readonly wanted: readonly [number, number];
  readonly errorKey: MessageKey | null;
  readonly onValid: () => void;
  readonly onSeeAgain: () => void;
}) {
  const locale = useBrowserLocale();
  const [pasting, setPasting] = useState(false);
  const [entries, setEntries] = useState<readonly [string, string]>(["", ""]);
  const [whole, setWhole] = useState("");
  const [mismatch, setMismatch] = useState<number | "code" | null>(null);
  const [misses, setMisses] = useState(0);
  const groupNumber = (index: number) => formatInteger(locale, index + 1);

  const check = () => {
    const wrong = findMismatch({
      pasting,
      code,
      whole,
      wanted,
      groups,
      entries,
    });
    setMismatch(wrong);
    if (wrong === null) {
      onValid();
    } else {
      setMisses((count) => count + 1);
    }
  };

  let mismatchText: string | null = null;
  if (mismatch === "code") {
    mismatchText = t(locale, "e2ee.backup.setup.check.wrongCode");
  } else if (mismatch !== null) {
    mismatchText = t(locale, "e2ee.backup.setup.check.wrongGroup", {
      number: groupNumber(mismatch),
    });
  }
  const giveUp =
    misses >= MISSES_BEFORE_HINT
      ? ` ${t(locale, "e2ee.backup.setup.check.giveUp")}`
      : "";

  return (
    <form
      id={formId}
      className="tw-flex tw-flex-col tw-gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        check();
      }}
    >
      <p className="tw-m-0 tw-text-sm tw-leading-6 tw-text-iron-300">
        {pasting
          ? t(locale, "e2ee.backup.setup.check.pasteBody")
          : t(locale, "e2ee.backup.setup.check.body", {
              first: groupNumber(wanted[0]),
              second: groupNumber(wanted[1]),
            })}
      </p>
      {pasting ? (
        <Field
          label={t(locale, "e2ee.backup.code.label")}
          value={whole}
          invalid={mismatch === "code"}
          onChange={(value) => {
            setWhole(value);
            setMismatch(null);
          }}
        />
      ) : (
        <div className="tw-flex tw-gap-3">
          {wanted.map((groupIndex, slot) => (
            <Field
              key={groupIndex}
              label={t(locale, "e2ee.backup.setup.check.group", {
                number: groupNumber(groupIndex),
              })}
              value={entries[slot] ?? ""}
              maxLength={9}
              invalid={mismatch === groupIndex}
              onChange={(value) => {
                setEntries((current) =>
                  slot === 0 ? [value, current[1]] : [current[0], value]
                );
                setMismatch(null);
              }}
            />
          ))}
        </div>
      )}
      {mismatchText ? (
        <p role="alert" className="tw-m-0 tw-text-sm tw-text-rose-300">
          {mismatchText}
          {giveUp}
        </p>
      ) : null}
      {errorKey ? (
        <p role="alert" className="tw-m-0 tw-text-sm tw-text-rose-300">
          {t(locale, errorKey)}
        </p>
      ) : null}
      <div className="tw-flex tw-flex-wrap tw-gap-x-4 tw-gap-y-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setPasting((value) => !value);
            setMismatch(null);
          }}
        >
          {t(
            locale,
            pasting
              ? "e2ee.backup.setup.check.typeGroups"
              : "e2ee.backup.setup.check.paste"
          )}
        </Button>
        <Button variant="ghost" size="sm" onClick={onSeeAgain}>
          {t(locale, "e2ee.backup.setup.check.seeAgain")}
        </Button>
      </div>
    </form>
  );
}

/** Step 4: the upload, then done (with counts) or failed (with Try again). */
function uploadContent(
  locale: SupportedLocale,
  {
    upload,
    snapshot,
    errorKey,
    pending,
    onClose,
    onRetry,
  }: {
    readonly upload: UploadState;
    readonly snapshot: E2eeBackupSnapshot;
    readonly errorKey: MessageKey | null;
    readonly pending: boolean;
    readonly onClose: () => void;
    readonly onRetry: () => void;
  }
): StepContent {
  const close = (
    <Button variant="secondary" size="md" onClick={onClose}>
      {t(locale, "e2ee.action.close")}
    </Button>
  );
  if (upload === "running") {
    return {
      title: t(locale, "e2ee.backup.setup.upload.title"),
      body: (
        <div className="tw-flex tw-flex-col tw-gap-3">
          <BackupProgressBar
            locale={locale}
            percent={getBackupPercent(snapshot)}
            label={t(locale, "e2ee.backup.status.uploading")}
          />
          <p className="tw-m-0 tw-text-sm tw-leading-6 tw-text-iron-300">
            {t(locale, "e2ee.backup.setup.upload.background")}
          </p>
        </div>
      ),
      footer: close,
    };
  }
  if (upload === "done") {
    const counts = formatBackupCounts(locale, snapshot);
    return {
      title: t(locale, "e2ee.backup.setup.done.title"),
      body: (
        <div className="tw-flex tw-flex-col tw-gap-2 tw-text-sm tw-leading-6 tw-text-iron-300">
          <p className="tw-m-0 tw-text-iron-100">
            {counts
              ? t(locale, "e2ee.backup.setup.done.summary", { counts })
              : t(locale, "e2ee.backup.upToDate")}
          </p>
          <p className="tw-m-0">{t(locale, "e2ee.backup.setup.done.body")}</p>
        </div>
      ),
      footer: (
        <Button variant="action" size="md" onClick={onClose}>
          {t(locale, "e2ee.backup.setup.done.action")}
        </Button>
      ),
    };
  }
  return {
    title: t(locale, "e2ee.backup.setup.failed.title"),
    body: (
      <div className="tw-flex tw-flex-col tw-gap-2 tw-text-sm tw-leading-6 tw-text-iron-300">
        <p className="tw-m-0">{t(locale, "e2ee.backup.setup.failed.body")}</p>
        {errorKey ? (
          <p role="alert" className="tw-m-0 tw-text-rose-300">
            {t(locale, errorKey)}
          </p>
        ) : null}
      </div>
    ),
    footer: (
      <>
        {close}
        <Button variant="action" size="md" loading={pending} onClick={onRetry}>
          {t(locale, "e2ee.action.retry")}
        </Button>
      </>
    ),
  };
}

/**
 * Turning on (or replacing) encrypted backup in four steps: why, save the
 * code (Continue unlocks after Copy, Download or "on paper"), check two
 * groups (in the browser, nothing sent), then the upload, which keeps going
 * in the background if the dialog closes. The code is never stored.
 */
export function BackupSetupDialog({
  manager,
  prepared,
  replacing,
  onClose,
  checkGroups,
}: {
  readonly manager: E2eeBackupManager;
  readonly prepared: PreparedBackup;
  /** Replacing an existing backup (a new recovery code). */
  readonly replacing: boolean;
  readonly onClose: () => void;
  /** Fixed groups to check, for tests; random otherwise. */
  readonly checkGroups?: readonly [number, number];
}) {
  const locale = useBrowserLocale();
  const formId = useId();
  const groups: readonly CodeGroup[] = prepared.code
    .split("-")
    .map((value, index) => ({ number: index + 1, value }));
  const [step, setStep] = useState<Step>("why");
  const [saved, setSaved] = useState(false);
  const [onPaper, setOnPaper] = useState(false);
  const [wanted] = useState(
    () => checkGroups ?? pickCheckGroups(groups.length)
  );
  const [errorKey, setErrorKey] = useState<MessageKey | null>(null);
  const [upload, setUpload] = useState<UploadState>("running");
  const [pending, setPending] = useState(false);
  const snapshot = useSyncExternalStore(
    manager.subscribe,
    manager.getSnapshot,
    manager.getSnapshot
  );
  const canContinue = saved || onPaper;

  const startUpload = async () => {
    setErrorKey(null);
    setStep("upload");
    setUpload("running");
    try {
      await manager.confirmBackup(prepared);
      setUpload("done");
    } catch (error) {
      setErrorKey(getBackupErrorKey(error));
      if (manager.getSnapshot().phase === "on") {
        // The backup exists; its first upload stopped and will carry on.
        setUpload("failed");
      } else {
        setStep("check");
      }
    }
  };

  const retry = async () => {
    setPending(true);
    setErrorKey(null);
    setUpload("running");
    try {
      await manager.backupNow();
      setUpload("done");
    } catch (error) {
      setUpload("failed");
      setErrorKey(getBackupErrorKey(error));
    } finally {
      setPending(false);
    }
  };

  const continueButton = (next: Step, disabled = false) => (
    <Button
      variant="action"
      size="md"
      disabled={disabled}
      onClick={() => setStep(next)}
    >
      {t(locale, "e2ee.backup.setup.continue")}
    </Button>
  );

  const contents: Record<Step, () => StepContent> = {
    why: () => ({
      title: t(
        locale,
        replacing
          ? "e2ee.backup.setup.replace.title"
          : "e2ee.backup.setup.why.title"
      ),
      body: <Lines keys={replacing ? REPLACE_KEYS : WHY_KEYS} />,
      footer: (
        <>
          <Button variant="secondary" size="md" onClick={onClose}>
            {t(
              locale,
              replacing ? "e2ee.action.cancel" : "e2ee.backup.setup.notNow"
            )}
          </Button>
          {continueButton("save")}
        </>
      ),
    }),
    save: () => ({
      title: t(
        locale,
        replacing ? "e2ee.backup.code.newTitle" : "e2ee.backup.code.title"
      ),
      body: (
        <SaveBody
          code={prepared.code}
          groups={groups}
          onPaper={onPaper}
          canContinue={canContinue}
          onSaved={() => setSaved(true)}
          onPaperChange={setOnPaper}
        />
      ),
      footer: (
        <>
          <Button variant="secondary" size="md" onClick={() => setStep("why")}>
            {t(locale, "e2ee.backup.setup.back")}
          </Button>
          {continueButton("check", !canContinue)}
        </>
      ),
    }),
    check: () => ({
      title: t(locale, "e2ee.backup.setup.check.title"),
      body: (
        <CheckForm
          formId={formId}
          code={prepared.code}
          groups={groups}
          wanted={wanted}
          errorKey={errorKey}
          onValid={() => void startUpload()}
          onSeeAgain={() => setStep("save")}
        />
      ),
      footer: (
        <>
          <Button variant="secondary" size="md" onClick={onClose}>
            {t(locale, "e2ee.action.cancel")}
          </Button>
          <Button variant="action" size="md" type="submit" form={formId}>
            {t(
              locale,
              replacing
                ? "e2ee.backup.code.confirmNew"
                : "e2ee.backup.code.confirm"
            )}
          </Button>
        </>
      ),
    }),
    upload: () =>
      uploadContent(locale, {
        upload,
        snapshot,
        errorKey,
        pending,
        onClose,
        onRetry: () => void retry(),
      }),
  };
  const content = contents[step]();
  const showStep = step !== "upload" || upload === "running";

  return (
    <E2eeDialog
      open
      onClose={onClose}
      title={content.title}
      closeLabel={t(locale, "e2ee.action.close")}
      size="md"
      scrollBody
      footer={content.footer}
    >
      <div className="tw-flex tw-flex-col tw-gap-3">
        {showStep ? <StepLabel step={step} /> : null}
        {content.body}
      </div>
    </E2eeDialog>
  );
}
