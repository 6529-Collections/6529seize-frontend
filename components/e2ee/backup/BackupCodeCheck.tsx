"use client";

import { useId, useState } from "react";
import Button from "@/components/utils/button/Button";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatInteger } from "@/i18n/format";
import { t, type MessageKey } from "@/i18n/messages";
import { normalizeRecoveryCode } from "@/lib/e2ee/backup/recovery-code";

export interface CodeGroup {
  /** 1-based position, also the number shown and asked for. */
  readonly number: number;
  readonly value: string;
}

/** After this many misses the check suggests saving the code again. */
const MISSES_BEFORE_HINT = 3;

const inputClass =
  "tw-mt-1 tw-w-full tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-px-3 tw-py-2 tw-font-mono tw-text-base tw-uppercase tw-tracking-wider tw-text-iron-100 focus:tw-border-primary-400 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-primary-400";

function Field({
  label,
  value,
  invalid,
  onChange,
  maxLength,
  describedBy,
}: {
  readonly label: string;
  readonly value: string;
  readonly invalid: boolean;
  readonly onChange: (value: string) => void;
  readonly maxLength?: number;
  /** The error that explains an invalid value. */
  readonly describedBy?: string | undefined;
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
        aria-describedby={invalid ? describedBy : undefined}
        onChange={(event) => onChange(event.target.value)}
        className={inputClass}
      />
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
export function CheckForm({
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
  const errorId = useId();
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
  const showGiveUp = misses >= MISSES_BEFORE_HINT;

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
          describedBy={errorId}
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
              describedBy={errorId}
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
        <div
          id={errorId}
          role="alert"
          className="tw-flex tw-flex-col tw-gap-1 tw-text-sm tw-text-rose-300"
        >
          <p className="tw-m-0">{mismatchText}</p>
          {showGiveUp ? (
            <p className="tw-m-0">
              {t(locale, "e2ee.backup.setup.check.giveUp")}
            </p>
          ) : null}
        </div>
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
