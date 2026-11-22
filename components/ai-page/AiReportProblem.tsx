import {
  ArrowRightIcon,
  ChatBubbleLeftRightIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";

import { LINK } from "@/components/validator-page/validatorStyles";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import "@/i18n/namespaces/ai-download";
import { AI_BUTTON, AI_CARD } from "./AiPageFrame";

// Rendered on the server, in the locale the server renders.
const LOCALE = DEFAULT_LOCALE;
/** The 6529 AI wave, where testers and the support bot answer. */
const AI_WAVE = "/waves/46f873a7-6d5c-4dd0-b094-95fddca391b3";

/**
 * "Report a problem", the same everywhere: what to put in a report on the
 * left and the button to the 6529 AI wave on the right; on a phone the
 * button sits under the text.
 */
export default function AiReportProblem({
  compact = false,
}: {
  /** One line, for the top of a page; the full card goes at its end. */
  readonly compact?: boolean | undefined;
}) {
  if (compact) {
    return (
      <p className="tw-m-0 tw-text-sm tw-leading-6 tw-text-iron-400">
        {t(LOCALE, "ai.report.title")}{" "}
        <Link
          href={AI_WAVE}
          className={`tw-inline-flex tw-min-h-11 tw-items-center tw-gap-1 sm:tw-min-h-0 ${LINK}`}
        >
          {t(LOCALE, "ai.report.short")}
          <ArrowRightIcon aria-hidden="true" className="tw-size-4" />
        </Link>
      </p>
    );
  }
  return (
    <div
      className={`${AI_CARD} tw-flex tw-flex-col tw-gap-4 tw-p-5 sm:tw-flex-row sm:tw-items-center sm:tw-justify-between sm:tw-gap-6`}
    >
      <div className="tw-min-w-0">
        <p className="tw-m-0 tw-text-base tw-font-semibold tw-leading-6 tw-text-iron-50">
          {t(LOCALE, "ai.report.title")}
        </p>
        <p className="tw-m-0 tw-mt-1 tw-text-sm tw-leading-6 tw-text-iron-400">
          {t(LOCALE, "ai.report.include")}
        </p>
      </div>
      <Link
        href={AI_WAVE}
        className={`${AI_BUTTON} tw-self-start sm:tw-self-auto`}
      >
        <ChatBubbleLeftRightIcon aria-hidden="true" className="tw-size-5" />
        {t(LOCALE, "ai.report.button")}
      </Link>
    </div>
  );
}
