"use client";

import Button from "@/components/utils/button/Button";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { useId, useRef, useState } from "react";
import { COLLECT_INPUT_CLASS } from "./CollectGoalForm";

export default function CollectTransactionRecovery({
  disabled,
  onRecover,
}: {
  readonly disabled: boolean;
  readonly onRecover: (hash: string) => Promise<void>;
}) {
  const locale = useBrowserLocale();
  const id = useId();
  const [hash, setHash] = useState("");
  const [invalid, setInvalid] = useState(false);
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);
  const inFlight = useRef(false);
  const recover = async () => {
    if (disabled || inFlight.current) return;
    const value = hash.trim();
    if (!/^0x[0-9a-fA-F]{64}$/.test(value)) {
      setInvalid(true);
      return;
    }
    inFlight.current = true;
    setPending(true);
    setFailed(false);
    try {
      await onRecover(value);
    } catch {
      setFailed(true);
    } finally {
      inFlight.current = false;
      setPending(false);
    }
  };
  return (
    <form
      className="tw-space-y-3 tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-p-4"
      onSubmit={(event) => {
        event.preventDefault();
        void recover();
      }}
    >
      <p
        id={`${id}-description`}
        className="tw-m-0 tw-text-sm tw-leading-6 tw-text-iron-300"
      >
        {t(locale, "collect.trade.broadcastUnknown")}
      </p>
      <label className="tw-block tw-space-y-2 tw-text-sm tw-text-iron-200">
        <span>{t(locale, "collect.trade.recoveryHash")}</span>
        <input
          autoComplete="off"
          spellCheck={false}
          maxLength={66}
          disabled={disabled || pending}
          value={hash}
          onChange={(event) => {
            setHash(event.target.value);
            setInvalid(false);
          }}
          aria-invalid={invalid}
          aria-describedby={invalid ? `${id}-error` : `${id}-description`}
          className={`${COLLECT_INPUT_CLASS} tw-font-mono tw-text-xs`}
        />
      </label>
      {invalid && (
        <p
          id={`${id}-error`}
          role="alert"
          className="tw-m-0 tw-text-sm tw-text-iron-300"
        >
          {t(locale, "collect.trade.recoveryHashInvalid")}
        </p>
      )}
      {failed && (
        <p role="alert" className="tw-m-0 tw-text-sm tw-text-iron-300">
          {t(locale, "collect.trade.recoveryCheckFailed")}
        </p>
      )}
      <Button
        type="submit"
        variant="secondary"
        fullWidth
        disabled={disabled}
        loading={pending}
      >
        {t(locale, "collect.trade.recoverHash")}
      </Button>
    </form>
  );
}
