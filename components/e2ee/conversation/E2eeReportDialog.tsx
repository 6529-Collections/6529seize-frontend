"use client";

import { useId, useState } from "react";
import Button from "@/components/utils/button/Button";
import { ApiContentModerationReportReason } from "@/generated/models/ApiContentModerationReportReason";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t, type MessageKey } from "@/i18n/messages";
import type { E2eeEngine, E2eeMessage } from "@/lib/e2ee/types";
import { getE2eeActionErrorKey } from "../e2eeErrors";
import { E2eeDialog } from "../ui/E2eeDialog";

const NOTES_MAX = 1000;

/** Same reasons as drop reports (contract 4.1 ApiE2eeReportRequest.reason). */
const REASONS: readonly {
  readonly value: ApiContentModerationReportReason;
  readonly label: MessageKey;
}[] = [
  {
    value: ApiContentModerationReportReason.ScamOrPhishing,
    label: "contentModeration.report.reason.scam",
  },
  {
    value: ApiContentModerationReportReason.PrivateInformationOrDoxxing,
    label: "contentModeration.report.reason.privateInformation",
  },
  {
    value: ApiContentModerationReportReason.ThreatsOrTargetedHarassment,
    label: "contentModeration.report.reason.threats",
  },
  {
    value: ApiContentModerationReportReason.HateOrDiscrimination,
    label: "contentModeration.report.reason.hate",
  },
  {
    value: ApiContentModerationReportReason.SexualExploitationOrIllegalContent,
    label: "contentModeration.report.reason.illegal",
  },
  {
    value: ApiContentModerationReportReason.Spam,
    label: "contentModeration.report.reason.spam",
  },
  {
    value: ApiContentModerationReportReason.Other,
    label: "contentModeration.report.reason.other",
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
 * Reports one message. The engine sends that message's exact body and inner
 * signature so moderators can verify the sender; nothing else is shared.
 */
export function E2eeReportDialog({
  engine,
  g,
  message,
  onClose,
  onReported,
}: E2eeReportDialogProps) {
  const locale = useBrowserLocale();
  const reasonId = useId();
  const notesId = useId();
  const [reason, setReason] = useState<ApiContentModerationReportReason>(
    ApiContentModerationReportReason.ScamOrPhishing
  );
  const [notes, setNotes] = useState("");
  const [pending, setPending] = useState(false);
  const [errorKey, setErrorKey] = useState<MessageKey | null>(null);

  const close = () => {
    if (pending) {
      return;
    }
    setReason(ApiContentModerationReportReason.ScamOrPhishing);
    setNotes("");
    setErrorKey(null);
    onClose();
  };

  const submit = async () => {
    if (!message) {
      return;
    }
    setPending(true);
    setErrorKey(null);
    try {
      const trimmed = notes.trim();
      await engine.report(g, message.id, reason, trimmed || undefined);
      setPending(false);
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
        <div>
          <label
            htmlFor={reasonId}
            className="tw-block tw-text-sm tw-font-semibold tw-text-iron-200"
          >
            {t(locale, "contentModeration.report.reasonLabel")}
          </label>
          <select
            id={reasonId}
            value={reason}
            onChange={(event) =>
              setReason(event.target.value as ApiContentModerationReportReason)
            }
            className="tw-mt-2 tw-w-full tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-px-3 tw-py-2.5 tw-text-sm tw-text-iron-100 focus:tw-border-primary-400 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-primary-400"
          >
            {REASONS.map((item) => (
              <option key={item.value} value={item.value}>
                {t(locale, item.label)}
              </option>
            ))}
          </select>
        </div>
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
