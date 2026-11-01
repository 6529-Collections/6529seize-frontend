"use client";

import { useId, useMemo, useState } from "react";
import Button from "@/components/utils/button/Button";
import { ApiE2eeReportCategory } from "@/generated/models/ApiE2eeReportCategory";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatList } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";
import type {
  E2eeEngine,
  E2eeMessage,
  E2eeReportPreview,
  E2eeReportVersion,
} from "@/lib/e2ee/types";
import { getE2eeActionErrorKey } from "../e2eeErrors";
import { attachmentDisplayName } from "../e2eeFormat";
import { E2eeDialog } from "../ui/E2eeDialog";

const NOTES_MAX = 1000;
/** Longest text shown in the preview; the report still sends all of it. */
const PREVIEW_MAX_CHARS = 600;

/**
 * Severe or illegal harm only (owner decision; NC15). Everything else is
 * handled by blocking, muting and the "who can message you" setting.
 */
const CATEGORIES: readonly {
  readonly value: ApiE2eeReportCategory;
  readonly label: MessageKey;
}[] = [
  {
    value: ApiE2eeReportCategory.ChildSexualAbuseMaterial,
    label: "e2ee.report.category.CHILD_SEXUAL_ABUSE_MATERIAL",
  },
  {
    value: ApiE2eeReportCategory.CredibleThreatOfViolence,
    label: "e2ee.report.category.CREDIBLE_THREAT_OF_VIOLENCE",
  },
  {
    value: ApiE2eeReportCategory.NonConsensualIntimateImagery,
    label: "e2ee.report.category.NON_CONSENSUAL_INTIMATE_IMAGERY",
  },
  {
    value: ApiE2eeReportCategory.Doxxing,
    label: "e2ee.report.category.DOXXING",
  },
];

const EMPTY_PREVIEW: E2eeReportPreview = { latest: null, original: null };

function readPreview(
  engine: E2eeEngine,
  g: string,
  message: E2eeMessage | null
): E2eeReportPreview {
  if (!message) {
    return EMPTY_PREVIEW;
  }
  try {
    return engine.reportPreview(g, message.id);
  } catch {
    return EMPTY_PREVIEW;
  }
}

/** One payload the report sends: its text and attachment names. */
function ReportVersionPreview({
  locale,
  label,
  version,
}: {
  readonly locale: SupportedLocale;
  readonly label: string;
  readonly version: E2eeReportVersion;
}) {
  const chars = [...version.text];
  const text =
    chars.length > PREVIEW_MAX_CHARS
      ? `${chars.slice(0, PREVIEW_MAX_CHARS).join("")}…`
      : version.text;
  const names = version.attachmentNames.map((name) =>
    attachmentDisplayName(locale, name)
  );
  return (
    <figure className="tw-m-0 tw-rounded-lg tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-px-3 tw-py-2.5">
      <figcaption className="tw-text-xs tw-font-semibold tw-text-iron-300">
        {label}
      </figcaption>
      <blockquote className="tw-m-0 tw-mt-1 tw-max-h-40 tw-overflow-y-auto tw-whitespace-pre-wrap tw-break-words tw-text-sm tw-text-iron-100">
        {text || (
          <span className="tw-italic tw-text-iron-400">
            {t(locale, "e2ee.report.preview.noText")}
          </span>
        )}
      </blockquote>
      {names.length > 0 ? (
        <p className="tw-m-0 tw-mt-1.5 tw-break-words tw-text-xs tw-text-iron-300">
          {t(locale, "e2ee.report.preview.attachments", {
            names: formatList(locale, names),
          })}
        </p>
      ) : null}
    </figure>
  );
}

/**
 * Exactly what the report shares. An edited message sends the version the
 * reader sees; its original goes along only when the reporter chooses.
 */
function ReportPreview({
  locale,
  preview,
  includeOriginal,
  onIncludeOriginal,
}: {
  readonly locale: SupportedLocale;
  readonly preview: E2eeReportPreview;
  readonly includeOriginal: boolean;
  readonly onIncludeOriginal: (value: boolean) => void;
}) {
  const includeId = useId();
  if (!preview.latest) {
    return (
      <p className="tw-m-0 tw-text-sm tw-text-amber-200">
        {t(locale, "e2ee.report.preview.unavailable")}
      </p>
    );
  }
  const edited = preview.original !== null;
  return (
    <section className="tw-flex tw-flex-col tw-gap-2">
      <h3 className="tw-m-0 tw-text-sm tw-font-semibold tw-text-iron-200">
        {t(locale, "e2ee.report.preview.heading")}
      </h3>
      <ReportVersionPreview
        locale={locale}
        label={t(
          locale,
          edited ? "e2ee.report.preview.edited" : "e2ee.report.preview.message"
        )}
        version={preview.latest}
      />
      {preview.original ? (
        <>
          <div className="tw-flex tw-items-start tw-gap-3">
            <input
              id={includeId}
              type="checkbox"
              checked={includeOriginal}
              onChange={(event) => onIncludeOriginal(event.target.checked)}
              className="tw-mt-0.5 tw-size-4 tw-flex-shrink-0 tw-accent-primary-400"
            />
            <label
              htmlFor={includeId}
              className="tw-cursor-pointer tw-text-sm tw-text-iron-100"
            >
              {t(locale, "e2ee.report.includeOriginal")}
              <span className="tw-mt-0.5 tw-block tw-text-xs tw-text-iron-400">
                {t(locale, "e2ee.report.includeOriginalHint")}
              </span>
            </label>
          </div>
          {includeOriginal ? (
            <ReportVersionPreview
              locale={locale}
              label={t(locale, "e2ee.report.preview.original")}
              version={preview.original}
            />
          ) : null}
        </>
      ) : null}
    </section>
  );
}

interface E2eeReportDialogProps {
  readonly engine: E2eeEngine;
  readonly g: string;
  readonly message: E2eeMessage | null;
  readonly onClose: () => void;
  readonly onReported: () => void;
}

/**
 * Reports one message to 6529's trust and safety team. The engine sends the
 * exact signed payload of the version shown (and the original, if chosen)
 * so the sender can be verified. Nothing else from the conversation is
 * shared, and the dialog previews what is.
 */
export function E2eeReportDialog({
  engine,
  g,
  message,
  onClose,
  onReported,
}: E2eeReportDialogProps) {
  const locale = useBrowserLocale();
  const legendId = useId();
  const notesId = useId();
  const [category, setCategory] = useState<ApiE2eeReportCategory | null>(null);
  const [notes, setNotes] = useState("");
  const [includeOriginal, setIncludeOriginal] = useState(false);
  const [pending, setPending] = useState(false);
  const [errorKey, setErrorKey] = useState<MessageKey | null>(null);
  const preview = useMemo(
    () => readPreview(engine, g, message),
    [engine, g, message]
  );

  const reset = () => {
    setCategory(null);
    setNotes("");
    setIncludeOriginal(false);
    setErrorKey(null);
  };

  const close = () => {
    if (pending) {
      return;
    }
    reset();
    onClose();
  };

  const submit = async () => {
    if (!message || !preview.latest) {
      return;
    }
    if (category === null) {
      setErrorKey("e2ee.report.chooseCategory");
      return;
    }
    setPending(true);
    setErrorKey(null);
    try {
      const trimmed = notes.trim();
      await engine.report(g, message.id, category, trimmed || undefined, {
        includeOriginal: includeOriginal && preview.original !== null,
      });
      setPending(false);
      reset();
      onReported();
      onClose();
    } catch (error) {
      setPending(false);
      setErrorKey(getE2eeActionErrorKey(error, "e2ee.report.failed"));
    }
  };

  return (
    <E2eeDialog
      open={message !== null}
      onClose={close}
      title={t(locale, "e2ee.report.title")}
      description={t(locale, "e2ee.report.description")}
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
            variant="destructive"
            size="md"
            loading={pending}
            disabled={!preview.latest}
            onClick={() => void submit()}
          >
            {t(locale, "e2ee.report.submit")}
          </Button>
        </>
      }
    >
      <div className="tw-flex tw-flex-col tw-gap-4">
        <ReportPreview
          locale={locale}
          preview={preview}
          includeOriginal={includeOriginal}
          onIncludeOriginal={setIncludeOriginal}
        />
        <fieldset
          aria-labelledby={legendId}
          className="tw-m-0 tw-min-w-0 tw-border-0 tw-p-0"
        >
          <legend
            id={legendId}
            className="tw-mb-2 tw-p-0 tw-text-sm tw-font-semibold tw-text-iron-200"
          >
            {t(locale, "e2ee.report.categoryLegend")}
          </legend>
          <div className="tw-flex tw-flex-col tw-gap-1.5">
            {CATEGORIES.map((item) => (
              <label
                key={item.value}
                className="tw-flex tw-cursor-pointer tw-items-center tw-gap-3 tw-rounded-lg tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-900 tw-px-3 tw-py-2.5 tw-text-sm tw-text-iron-100 has-[:checked]:tw-border-primary-400 has-[:focus-visible]:tw-ring-2 has-[:focus-visible]:tw-ring-primary-400"
              >
                <input
                  type="radio"
                  name={legendId}
                  value={item.value}
                  checked={category === item.value}
                  onChange={() => {
                    setCategory(item.value);
                    setErrorKey(null);
                  }}
                  className="tw-size-4 tw-flex-shrink-0 tw-accent-primary-400"
                />
                <span>{t(locale, item.label)}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <p className="tw-m-0 tw-text-xs tw-text-iron-400">
          {t(locale, "e2ee.report.otherTools")}
        </p>
        <div>
          <label
            htmlFor={notesId}
            className="tw-block tw-text-sm tw-font-semibold tw-text-iron-200"
          >
            {t(locale, "contentModeration.report.notesLabel")}
          </label>
          <textarea
            id={notesId}
            value={notes}
            maxLength={NOTES_MAX}
            rows={4}
            onChange={(event) => setNotes(event.target.value)}
            placeholder={t(locale, "contentModeration.report.notesPlaceholder")}
            className="tw-mt-2 tw-w-full tw-resize-y tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-px-3 tw-py-2.5 tw-text-sm tw-text-iron-100 placeholder:tw-text-iron-500 focus:tw-border-primary-400 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-primary-400"
          />
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
