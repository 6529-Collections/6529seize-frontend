"use client";

import { ChartBarIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useEffect, useId, useRef, useState, type Ref } from "react";
import Button from "@/components/utils/button/Button";
import CreateDropPollModeSelector from "@/components/waves/CreateDropPollModeSelector";
import PollComposerOptions from "@/components/waves/PollComposerOptions";
import { COMPOSER_ACTION_ICON_CLASS_NAME } from "@/components/waves/composerPresentation";
import { useAndroidBackLayer } from "@/hooks/useAndroidBackLayer";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import {
  MAX_POLL_OPTION,
  MAX_POLL_OPTIONS,
  MAX_POLL_QUESTION,
  parsePollDefinition,
  type PollDefinition,
} from "@/lib/e2ee/payload";
import { E2eeComposerActionButton } from "./E2eeComposerActions";

export function E2eePollComposerButton({
  buttonRef,
  onClick,
  compact,
}: {
  readonly buttonRef: Ref<HTMLButtonElement>;
  readonly onClick: () => void;
  readonly compact: boolean;
}) {
  const locale = useBrowserLocale();
  const label = t(locale, "e2ee.poll.create");
  return (
    <E2eeComposerActionButton
      ref={buttonRef}
      onClick={onClick}
      tooltip={label}
      compactLabel={
        compact ? t(locale, "waves.composer.actions.poll") : undefined
      }
    >
      <ChartBarIcon
        aria-hidden="true"
        className={COMPOSER_ACTION_ICON_CLASS_NAME}
      />
    </E2eeComposerActionButton>
  );
}

export function E2eePollComposer({
  onClose,
  onCreate,
}: {
  readonly onClose: () => void;
  readonly onCreate: (poll: PollDefinition) => Promise<void>;
}) {
  const locale = useBrowserLocale();
  const titleId = useId();
  const modeDescriptionId = useId();
  const validationErrorId = useId();
  const titleRef = useRef<HTMLHeadingElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState([
    { id: 0, value: "" },
    { id: 1, value: "" },
  ]);
  const nextOptionId = useRef(2);
  const [multi, setMulti] = useState(false);
  const [sending, setSending] = useState(false);
  const [failed, setFailed] = useState(false);
  const choices = options.map((option) => option.value.trim()).filter(Boolean);
  const poll = parsePollDefinition({ question, options: choices, multi });
  const validationError = getValidationError(choices, question, locale);
  const dismiss = () => {
    if (!sending) onClose();
  };

  useEffect(() => {
    titleRef.current?.focus();
  }, []);
  useAndroidBackLayer(true, formRef, dismiss);

  function addOption() {
    const id = nextOptionId.current;
    nextOptionId.current += 1;
    setOptions((current) => [...current, { id, value: "" }]);
  }

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
    <form
      ref={formRef}
      aria-labelledby={titleId}
      aria-describedby={validationError ? validationErrorId : undefined}
      className="tw-bg-iron-900"
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.stopPropagation();
          dismiss();
        }
      }}
    >
      <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-x-3 tw-gap-y-1 tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-white/10 tw-px-4 tw-py-2.5">
        <h3
          ref={titleRef}
          id={titleId}
          tabIndex={-1}
          className="tw-m-0 tw-text-[13.5px] tw-font-bold tw-tracking-wide tw-text-iron-50 focus:tw-outline-none"
        >
          {t(locale, "e2ee.poll.create")}
        </h3>
        <CreateDropPollModeSelector
          multi={multi}
          disabled={sending}
          descriptionId={modeDescriptionId}
          locale={locale}
          onChange={setMulti}
        />
        <button
          type="button"
          aria-label={t(locale, "waves.poll.composer.remove")}
          disabled={sending}
          onClick={dismiss}
          className="tw-ml-auto tw-flex tw-size-8 tw-shrink-0 tw-items-center tw-justify-center tw-rounded-md tw-border-0 tw-bg-transparent tw-p-0 tw-text-iron-400 tw-transition-colors focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 disabled:tw-opacity-50 desktop-hover:hover:tw-bg-white/[0.04] desktop-hover:hover:tw-text-white"
        >
          <XMarkIcon className="tw-size-4" aria-hidden="true" />
        </button>
      </div>
      <div className="tw-flex tw-max-h-[min(48dvh,24rem)] tw-flex-col tw-gap-3 tw-overflow-y-auto tw-overscroll-contain tw-px-4 tw-py-3">
        <input
          type="text"
          autoComplete="off"
          maxLength={MAX_POLL_QUESTION}
          value={question}
          disabled={sending}
          onChange={(event) => setQuestion(event.target.value)}
          aria-label={t(locale, "e2ee.poll.question")}
          placeholder={t(locale, "waves.poll.composer.questionPlaceholder")}
          className="tw-w-full tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-800/80 tw-px-3 tw-py-2.5 tw-text-[13px] tw-font-medium tw-text-iron-50 tw-outline-none tw-transition-colors placeholder:tw-text-iron-500 hover:tw-border-iron-600 focus:tw-border-white/30 focus:tw-bg-iron-800 disabled:tw-opacity-60"
        />
        <p
          id={modeDescriptionId}
          className="tw-m-0 tw-text-xs tw-font-medium tw-leading-4 tw-text-iron-400"
        >
          {t(
            locale,
            multi
              ? "waves.poll.composer.mode.multipleDescription"
              : "waves.poll.composer.mode.singleDescription"
          )}
        </p>
        <PollComposerOptions
          caseSensitiveOptions
          options={options}
          multi={multi}
          disabled={sending}
          maxOptions={MAX_POLL_OPTIONS}
          maxOptionLength={MAX_POLL_OPTION}
          validationError={validationError}
          validationErrorId={validationErrorId}
          locale={locale}
          onAdd={addOption}
          onChange={(index, value) =>
            setOptions((current) =>
              current.map((option, i) =>
                i === index ? { ...option, value } : option
              )
            )
          }
          onRemove={(index) =>
            setOptions((current) => current.filter((_, i) => i !== index))
          }
        />
      </div>
      <div className="tw-mx-4 tw-flex tw-flex-wrap tw-items-center tw-justify-end tw-gap-3 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/10 tw-py-2.5">
        {failed && (
          <p
            role="alert"
            className="tw-m-0 tw-mr-auto tw-text-xs tw-text-rose-300"
          >
            {t(locale, "e2ee.composer.sendFailed")}
          </p>
        )}
        <Button
          variant="action"
          size="sm"
          type="submit"
          disabled={!poll}
          loading={sending}
        >
          {t(locale, "e2ee.poll.post")}
        </Button>
      </div>
    </form>
  );
}

function getValidationError(
  choices: readonly string[],
  question: string,
  locale: ReturnType<typeof useBrowserLocale>
): string | null {
  if (choices.length < 2) {
    return t(locale, "waves.poll.composer.validation.minimumOptions", {
      count: 2,
    });
  }
  if (new Set(choices).size !== choices.length) {
    return t(locale, "waves.poll.composer.validation.uniqueOptions");
  }
  return question.trim() === ""
    ? t(locale, "waves.poll.composer.questionRequired")
    : null;
}
