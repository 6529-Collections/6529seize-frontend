import { GlobeAltIcon, WrenchIcon } from "@heroicons/react/24/outline";

import { formatDate } from "@/i18n/format";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import "@/i18n/namespaces/ai-download";
import {
  AI_KNOWN_ISSUES,
  AI_KNOWN_ISSUES_UPDATED,
  type AiKnownIssueGroup,
} from "@/lib/ai-page/content/knownIssues";
import AiCodeBlock from "./AiCodeBlock";
import AiPageFrame, { AI_CARD } from "./AiPageFrame";
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

function GroupIcon({ group }: { readonly group: AiKnownIssueGroup }) {
  const image = IMAGES[group.key];
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

      <div className="tw-mt-10 tw-flex tw-flex-col tw-gap-4">
        {AI_KNOWN_ISSUES.map((group) => (
          <section
            key={group.key}
            aria-labelledby={`issues-${group.key}`}
            className={AI_CARD}
          >
            <div className="tw-flex tw-items-center tw-gap-3 tw-border-0 tw-border-b tw-border-solid tw-border-white/[0.06] tw-px-4 tw-py-3 sm:tw-px-5">
              <GroupIcon group={group} />
              <h2
                id={`issues-${group.key}`}
                className="tw-m-0 tw-text-base tw-font-semibold tw-leading-6 tw-text-iron-50"
              >
                {group.title}
              </h2>
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
