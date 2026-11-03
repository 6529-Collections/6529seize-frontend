"use client";

import { type FormEvent, useId, useState } from "react";
import Button from "@/components/utils/button/Button";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t, type MessageKey } from "@/i18n/messages";

const DEVICE_LABEL_MAX = 48;

export function RenameDevice({
  label,
  onRename,
}: {
  readonly label: string;
  readonly onRename: (name: string) => Promise<void>;
}) {
  const locale = useBrowserLocale();
  const inputId = useId();
  const [draft, setDraft] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [resultKey, setResultKey] = useState<MessageKey | null>(null);

  const value = draft ?? label;
  const trimmed = value.trim();

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!trimmed || trimmed === label) {
      return;
    }
    setPending(true);
    setResultKey(null);
    try {
      await onRename(trimmed);
      setDraft(null);
      setResultKey("e2ee.devices.rename.saved");
    } catch {
      setResultKey("e2ee.devices.rename.failed");
    } finally {
      setPending(false);
    }
  };

  return (
    <form
      onSubmit={(event) => void submit(event)}
      className="tw-flex tw-flex-col tw-gap-2 sm:tw-flex-row sm:tw-items-end"
    >
      <div className="tw-min-w-0 tw-flex-1">
        <label
          htmlFor={inputId}
          className="tw-block tw-text-sm tw-font-semibold tw-text-iron-200"
        >
          {t(locale, "e2ee.devices.rename.label")}
        </label>
        <input
          id={inputId}
          value={value}
          maxLength={DEVICE_LABEL_MAX}
          onChange={(event) => {
            setDraft(event.target.value);
            setResultKey(null);
          }}
          className="tw-mt-1 tw-w-full tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-px-3 tw-py-2 tw-text-sm tw-text-iron-100 focus:tw-border-primary-400 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-primary-400"
        />
      </div>
      <Button
        type="submit"
        variant="secondary"
        size="md"
        loading={pending}
        disabled={!trimmed || trimmed === label}
      >
        {t(locale, "e2ee.devices.rename.save")}
      </Button>
      <output className="tw-text-xs tw-text-iron-400 sm:tw-self-center">
        {resultKey ? t(locale, resultKey) : null}
      </output>
    </form>
  );
}
