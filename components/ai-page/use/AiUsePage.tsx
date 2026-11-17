import { ChevronDownIcon } from "@heroicons/react/24/outline";

import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import "@/i18n/namespaces/ai-download";
import {
  AI_USE_INTRO,
  AI_USE_LEAD,
  AI_USE_SECTIONS,
} from "@/lib/ai-page/content/use";
import AiPageFrame, { AI_H2 } from "../AiPageFrame";
import AiReportProblem from "../AiReportProblem";
import AiUseBlocks from "./AiUseBlocks";

// Rendered on the server, in the locale the server renders.
const LOCALE = DEFAULT_LOCALE;

function Contents({ className }: { readonly className: string }) {
  return (
    <ol className={`tw-m-0 tw-list-none tw-p-0 ${className}`}>
      {AI_USE_SECTIONS.map((section, index) => (
        <li key={section.id}>
          <a
            href={`#${section.id}`}
            className="tw-flex tw-min-h-9 tw-items-baseline tw-gap-2.5 tw-rounded-md tw-px-2 tw-py-1.5 tw-text-sm tw-leading-5 tw-text-iron-400 tw-no-underline tw-transition hover:tw-bg-white/[0.04] hover:tw-text-iron-100 focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
          >
            <span className="tw-w-5 tw-flex-none tw-text-right tw-text-xs tw-tabular-nums tw-text-iron-600">
              {index + 1}
            </span>
            <span>{section.title}</span>
          </a>
        </li>
      ))}
    </ol>
  );
}

/**
 * /ai/use: the walk-through from the download to real use, with its
 * contents beside it from 1024 px and folded above it on a phone.
 */
export default function AiUsePage() {
  return (
    <AiPageFrame
      current="use"
      wide
      eyebrow={t(LOCALE, "ai.use.eyebrow")}
      title={t(LOCALE, "ai.use.title")}
      lead={AI_USE_LEAD}
    >
      <div className="tw-mt-10 lg:tw-grid lg:tw-grid-cols-[13rem_minmax(0,1fr)] lg:tw-gap-12">
        <nav
          aria-label={t(LOCALE, "ai.use.contents")}
          className="tw-hidden lg:tw-block"
        >
          <div className="tw-sticky tw-top-6">
            <p className="tw-mb-2 tw-mt-0 tw-px-2 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wider tw-text-iron-500">
              {t(LOCALE, "ai.use.contents")}
            </p>
            <Contents className="tw-flex tw-flex-col" />
          </div>
        </nav>
        <div className="tw-min-w-0">
          <details className="tw-group tw-mb-8 tw-rounded-xl tw-border tw-border-solid tw-border-white/[0.08] tw-bg-iron-950/60 lg:tw-hidden">
            <summary className="tw-flex tw-min-h-12 tw-cursor-pointer tw-list-none tw-items-center tw-justify-between tw-px-4 tw-text-sm tw-font-semibold tw-text-iron-100 [&::-webkit-details-marker]:tw-hidden">
              {t(LOCALE, "ai.use.contents")}
              <ChevronDownIcon
                aria-hidden="true"
                className="tw-size-5 tw-text-iron-400 tw-transition group-open:tw-rotate-180"
              />
            </summary>
            <Contents className="tw-grid tw-px-2 tw-pb-3" />
          </details>
          <div className="tw-flex tw-flex-col tw-gap-4">
            <AiUseBlocks blocks={AI_USE_INTRO} />
          </div>
          {AI_USE_SECTIONS.map((section, index) => (
            <section
              key={section.id}
              aria-labelledby={section.id}
              className="tw-mt-16 tw-flex tw-flex-col tw-gap-4 tw-border-0 tw-border-t tw-border-solid tw-border-white/[0.06] tw-pt-10"
            >
              <h2
                id={section.id}
                className={`tw-mb-1 tw-flex tw-scroll-mt-24 tw-items-baseline tw-gap-3 ${AI_H2}`}
              >
                <span className="tw-text-base tw-font-medium tw-tabular-nums tw-text-iron-500">
                  {index + 1}
                </span>
                {section.title}
              </h2>
              <AiUseBlocks blocks={section.blocks} />
            </section>
          ))}
          <div className="tw-mt-16">
            <AiReportProblem />
          </div>
        </div>
      </div>
    </AiPageFrame>
  );
}
