import { ChatBubbleLeftRightIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import "@/i18n/namespaces/ai-download";
import { AI_BUTTON } from "./AiPageFrame";

// Rendered on the server, in the locale the server renders.
const LOCALE = DEFAULT_LOCALE;
/** The 6529 AI wave, where testers and the support bot answer. */
const AI_WAVE = "/waves/46f873a7-6d5c-4dd0-b094-95fddca391b3";

/** "Report a problem", to the 6529 AI wave, and what to put in a report. */
export default function AiReportProblem({
  title,
}: {
  /** A line above the button, such as "Stuck, or something went wrong?". */
  readonly title?: string | undefined;
}) {
  return (
    <div className="tw-flex tw-flex-col tw-gap-3 sm:tw-flex-row sm:tw-items-center sm:tw-gap-5">
      <Link href={AI_WAVE} className={AI_BUTTON}>
        <ChatBubbleLeftRightIcon aria-hidden="true" className="tw-size-5" />
        {t(LOCALE, "ai.report.button")}
      </Link>
      <p className="tw-m-0 tw-text-sm tw-leading-6 tw-text-iron-400">
        {title && (
          <strong className="tw-font-semibold tw-text-iron-100">
            {title}{" "}
          </strong>
        )}
        {t(LOCALE, "ai.report.include")}
      </p>
    </div>
  );
}
