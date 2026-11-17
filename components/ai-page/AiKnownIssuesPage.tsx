import {
  CheckCircleIcon,
  GlobeAltIcon,
  WrenchIcon,
} from "@heroicons/react/24/outline";

import { formatDate } from "@/i18n/format";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import "@/i18n/namespaces/ai-download";
import {
  AI_FIXED_BUGS,
  AI_FIXED_IN,
  AI_KNOWN_BUGS,
  AI_KNOWN_ISSUES,
  AI_KNOWN_ISSUES_UPDATED,
  type AiKnownIssueGroup,
} from "@/lib/ai-page/content/knownIssues";
import AiCodeBlock from "./AiCodeBlock";
import AiPageFrame, { AI_CARD, AI_H2, AI_MUTED } from "./AiPageFrame";
import AiReportProblem from "./AiReportProblem";
import AiSystemLogo from "./AiSystemLogo";
import InlineText from "./InlineText";

// Rendered on the server, in the locale the server renders.
const LOCALE = DEFAULT_LOCALE;
const UPDATED_DATE: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "long",
  day: "numeric",
};

const IMAGES: Readonly<Partial<Record<AiKnownIssueGroup["key"], string>>> = {
  mac: "/macos.png",
  windows: "/windows.png",
  linux: "/linux.png",
};

function GroupIcon({ system }: { readonly system: AiKnownIssueGroup["key"] }) {
  const image = IMAGES[system];
  if (image) {
    return <AiSystemLogo src={image} />;
  }
  return (
    <span className="tw-flex tw-size-8 tw-flex-none tw-items-center tw-justify-center tw-rounded-lg tw-bg-white">
      <GlobeAltIcon aria-hidden="true" className="tw-size-5 tw-text-iron-900" />
    </span>
  );
}

/**
 * What hasn't been tested yet, by system: each issue in a line, with its
 * workaround and its commands under it when there is one. The lead says
 * the release is untested, so the page shows no separate notice.
 */
export default function AiKnownIssuesPage({
  version,
}: {
  /** The newest release's version, for the eyebrow. */
  readonly version: string | undefined;
}) {
  const workaround = t(LOCALE, "ai.knownIssues.workaround");
  return (
    <AiPageFrame
      current="known-issues"
      eyebrow={t(LOCALE, "ai.knownIssues.eyebrow")}
      version={version}
      title={t(LOCALE, "ai.knownIssues.title")}
      lead={t(LOCALE, "ai.knownIssues.lead")}
      notice={false}
    >
      <div className="tw-flex tw-flex-col tw-gap-2">
        <p className="tw-m-0 tw-text-sm tw-tabular-nums tw-text-iron-500">
          {t(LOCALE, "ai.knownIssues.updated", {
            date: formatDate(LOCALE, AI_KNOWN_ISSUES_UPDATED, UPDATED_DATE),
          })}
        </p>
        <AiReportProblem compact />
      </div>

      <section aria-labelledby="known-bugs" className="tw-mt-10">
        <h2 id="known-bugs" className={`tw-mb-1 ${AI_H2}`}>
          {t(LOCALE, "ai.knownIssues.bugs")}
        </h2>
        <p className={`tw-mb-5 tw-mt-0 ${AI_MUTED}`}>
          {t(LOCALE, "ai.knownIssues.bugsLead")}
        </p>
        <ul className="tw-m-0 tw-flex tw-list-none tw-flex-col tw-gap-3 tw-p-0">
          {AI_KNOWN_BUGS.map((bug) => (
            <li
              key={bug.symptom}
              className={`${AI_CARD} tw-flex tw-gap-3.5 tw-p-4 sm:tw-p-5`}
            >
              <GroupIcon system={bug.system} />
              <div className="tw-flex tw-min-w-0 tw-flex-1 tw-flex-col tw-gap-2">
                <p className="tw-m-0 tw-text-[15px] tw-font-medium tw-leading-6 tw-text-iron-50">
                  <InlineText text={bug.symptom} />
                </p>
                <p className="tw-m-0 tw-flex tw-gap-2 tw-text-sm tw-leading-6 tw-text-iron-300">
                  <WrenchIcon
                    aria-hidden="true"
                    className="tw-mt-1 tw-size-4 tw-flex-none tw-text-emerald-400"
                  />
                  <span className="tw-min-w-0">
                    <span className="tw-font-medium tw-text-iron-100">
                      {t(LOCALE, "ai.knownIssues.fix")}:{" "}
                    </span>
                    <InlineText text={bug.fix} />
                  </span>
                </p>
                {bug.code && (
                  <div className="tw-flex tw-flex-col tw-gap-2 sm:tw-pl-6">
                    {bug.code.map((block) => (
                      <AiCodeBlock
                        key={block.code}
                        code={block.code}
                        label={block.label}
                      />
                    ))}
                  </div>
                )}
                <p className="tw-m-0 tw-text-[13px] tw-leading-5 tw-text-iron-500">
                  <span className="tw-font-medium tw-text-iron-400">
                    {t(LOCALE, "ai.knownIssues.cause")}:{" "}
                  </span>
                  <InlineText text={bug.cause} />
                </p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section
        aria-labelledby="fixed"
        className={`${AI_CARD} tw-mt-4 tw-px-4 tw-py-4 sm:tw-px-5`}
      >
        <h3
          id="fixed"
          className="tw-m-0 tw-flex tw-items-center tw-gap-2 tw-text-[15px] tw-font-semibold tw-leading-6 tw-text-iron-50"
        >
          <CheckCircleIcon
            aria-hidden="true"
            className="tw-size-5 tw-flex-none tw-text-emerald-400"
          />
          {t(LOCALE, "ai.knownIssues.fixed", { version: AI_FIXED_IN })}
        </h3>
        <ul className="tw-mb-0 tw-mt-2 tw-flex tw-flex-col tw-gap-1.5 tw-pl-12">
          {AI_FIXED_BUGS.map((fixed) => (
            <li
              key={fixed}
              className="tw-text-sm tw-leading-6 tw-text-iron-300 marker:tw-text-iron-600"
            >
              <InlineText text={fixed} />
            </li>
          ))}
        </ul>
        <p className="tw-mb-0 tw-mt-2 tw-pl-7 tw-text-[13px] tw-leading-5 tw-text-iron-500">
          <InlineText text={t(LOCALE, "ai.knownIssues.fixedUpdate")} />
        </p>
      </section>

      <h2 id="not-tested" className={`tw-mb-1 tw-mt-14 ${AI_H2}`}>
        {t(LOCALE, "ai.knownIssues.notTested")}
      </h2>
      <p className={`tw-mb-5 tw-mt-0 ${AI_MUTED}`}>
        {t(LOCALE, "ai.knownIssues.notTestedLead")}
      </p>
      <div className="tw-flex tw-flex-col tw-gap-4">
        {AI_KNOWN_ISSUES.map((group) => (
          <section
            key={group.key}
            aria-labelledby={`issues-${group.key}`}
            className={AI_CARD}
          >
            <div className="tw-flex tw-items-center tw-gap-3 tw-border-0 tw-border-b tw-border-solid tw-border-white/[0.06] tw-px-4 tw-py-3 sm:tw-px-5">
              <GroupIcon system={group.key} />
              <h3
                id={`issues-${group.key}`}
                className="tw-m-0 tw-text-base tw-font-semibold tw-leading-6 tw-text-iron-50"
              >
                {group.title}
              </h3>
            </div>
            <ul className="tw-m-0 tw-list-none tw-p-0">
              {group.issues.map((item) => (
                <li
                  key={item.issue}
                  className="tw-border-0 tw-border-t tw-border-solid tw-border-white/[0.06] tw-px-4 tw-py-4 first:tw-border-t-0 sm:tw-px-5"
                >
                  <p className="tw-m-0 tw-text-[15px] tw-leading-6 tw-text-iron-100">
                    <InlineText text={item.issue} />
                  </p>
                  {item.workaround && (
                    <p className="tw-m-0 tw-mt-1.5 tw-flex tw-gap-2 tw-text-sm tw-leading-6 tw-text-iron-400">
                      <WrenchIcon
                        aria-hidden="true"
                        className="tw-mt-1 tw-size-4 tw-flex-none tw-text-iron-500"
                      />
                      <span className="tw-min-w-0">
                        <span className="tw-font-medium tw-text-iron-300">
                          {workaround}:{" "}
                        </span>
                        <InlineText text={item.workaround} />
                      </span>
                    </p>
                  )}
                  {item.code && (
                    <div className="tw-mt-3 tw-flex tw-flex-col tw-gap-2 sm:tw-pl-6">
                      {item.code.map((block) => (
                        <AiCodeBlock
                          key={block.code}
                          code={block.code}
                          label={block.label}
                        />
                      ))}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <div className="tw-mt-10">
        <AiReportProblem />
      </div>
    </AiPageFrame>
  );
}
