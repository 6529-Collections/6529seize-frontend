"use client";

import { useId, useState } from "react";
import Button from "@/components/utils/button/Button";
import { ApiE2eeReportCategory } from "@/generated/models/ApiE2eeReportCategory";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t, type MessageKey } from "@/i18n/messages";
import type { E2eeEngine, E2eeMessage } from "@/lib/e2ee/types";
import { getE2eeActionErrorKey } from "../e2eeErrors";
import { E2eeDialog } from "../ui/E2eeDialog";

const NOTES_MAX = 1000;

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

interface E2eeReportDialogProps {
  readonly engine: E2eeEngine;
  readonly g: string;
  readonly message: E2eeMessage | null;
  readonly onClose: () => void;
  readonly onReported: () => void;
}

/**
 * Reports one message to 6529's trust and safety team. The engine sends that
 * message's exact body and inner signature so the sender can be verified;
 * nothing else from the conversation is shared.
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
  const [pending, setPending] = useState(false);
  const [errorKey, setErrorKey] = useState<MessageKey | null>(null);

  const close = () => {
    if (pending) {
      return;
    }
    setCategory(null);
    setNotes("");
    setErrorKey(null);
    onClose();
  };

  const submit = async () => {
    if (!message) {
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
      await engine.report(g, message.id, category, trimmed || undefined);
      setPending(false);
      setCategory(null);
      setNotes("");
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
            onClick={() => void submit()}
          >
            {t(locale, "e2ee.report.submit")}
          </Button>
        </>
      }
    >
      <div className="tw-flex tw-flex-col tw-gap-4">
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
