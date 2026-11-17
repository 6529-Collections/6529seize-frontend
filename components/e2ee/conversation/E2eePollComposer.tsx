"use client";

import { useId, useState } from "react";
import Button from "@/components/utils/button/Button";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatInteger } from "@/i18n/format";
import { t } from "@/i18n/messages";
import {
  MAX_POLL_OPTION,
  MAX_POLL_OPTIONS,
  MAX_POLL_QUESTION,
  parsePollDefinition,
  type PollDefinition,
} from "@/lib/e2ee/payload";
import { E2eeDialog } from "../ui/E2eeDialog";

const inputClass =
  "tw-w-full tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-px-3 tw-py-2 tw-text-base tw-text-iron-50 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400";

export function E2eePollComposer({
  onClose,
  onCreate,
}: {
  readonly onClose: () => void;
  readonly onCreate: (poll: PollDefinition) => Promise<void>;
}) {
  const locale = useBrowserLocale();
  const formId = useId();
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [multi, setMulti] = useState(false);
  const [sending, setSending] = useState(false);
  const [failed, setFailed] = useState(false);
  const poll = parsePollDefinition({ question, options, multi });

  async function submit() {
    if (!poll || sending) return;
    setSending(true);
    setFailed(false);
    try {
      await onCreate(poll);
      onClose();
    } catch {
      setFailed(true);
      setSending(false);
    }
  }

  return (
    <E2eeDialog
      open
      scrollBody
      onClose={() => {
        if (!sending) onClose();
      }}
      title={t(locale, "e2ee.poll.create")}
      closeLabel={t(locale, "e2ee.action.close")}
      hideCloseButton={sending}
      footer={
        <Button
          variant="action"
          type="submit"
          form={formId}
          disabled={!poll}
          loading={sending}
        >
          {t(locale, "e2ee.poll.post")}
        </Button>
      }
    >
      <form
        id={formId}
        className="tw-space-y-4 tw-overflow-y-auto tw-p-1"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <fieldset disabled={sending} className="tw-space-y-3">
          <label className="tw-block tw-space-y-1 tw-text-sm tw-text-iron-200">
            <span>{t(locale, "e2ee.poll.question")}</span>
            <input
              autoComplete="off"
              maxLength={MAX_POLL_QUESTION}
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              className={inputClass}
            />
          </label>
          {options.map((option, index) => (
            <label
              key={index}
              className="tw-block tw-space-y-1 tw-text-sm tw-text-iron-200"
            >
              <span>
                {t(locale, "e2ee.poll.option", {
                  number: formatInteger(locale, index + 1),
                })}
              </span>
              <input
                autoComplete="off"
                maxLength={MAX_POLL_OPTION}
                value={option}
                onChange={(event) =>
                  setOptions(
                    options.map((label, i) =>
                      i === index ? event.target.value : label
                    )
                  )
                }
                className={inputClass}
              />
            </label>
          ))}
          <div className="tw-flex tw-flex-wrap tw-gap-2">
            {options.length < MAX_POLL_OPTIONS && (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setOptions([...options, ""])}
              >
                {t(locale, "e2ee.poll.addOption")}
              </Button>
            )}
            {options.length > 2 && (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setOptions(options.slice(0, -1))}
              >
                {t(locale, "e2ee.poll.removeLastOption")}
              </Button>
            )}
          </div>
          <label className="tw-flex tw-min-h-10 tw-items-center tw-gap-2 tw-text-sm tw-text-iron-200">
            <input
              type="checkbox"
              checked={multi}
              onChange={(event) => setMulti(event.target.checked)}
            />
            {t(locale, "e2ee.poll.multiple")}
          </label>
        </fieldset>
        {failed && (
          <p role="alert" className="tw-text-sm tw-text-rose-300">
            {t(locale, "e2ee.composer.sendFailed")}
          </p>
        )}
      </form>
    </E2eeDialog>
  );
}
