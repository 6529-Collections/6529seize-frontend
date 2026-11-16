import { GlobeAltIcon, WrenchIcon } from "@heroicons/react/24/outline";
import Image from "next/image";

import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import "@/i18n/namespaces/ai-download";
import {
  AI_KNOWN_ISSUES,
  type AiKnownIssueGroup,
} from "@/lib/ai-page/content/knownIssues";
import AiCodeBlock from "./AiCodeBlock";
import AiPageFrame, { AI_CARD } from "./AiPageFrame";
import InlineText from "./InlineText";

// Rendered on the server, in the locale the server renders.
const LOCALE = DEFAULT_LOCALE;

const IMAGES: Readonly<Partial<Record<AiKnownIssueGroup["key"], string>>> = {
  mac: "/macos.png",
  windows: "/windows.png",
  linux: "/linux.png",
};

function GroupIcon({ group }: { readonly group: AiKnownIssueGroup }) {
  const image = IMAGES[group.key];
  return (
    <span className="tw-flex tw-size-8 tw-flex-none tw-items-center tw-justify-center tw-rounded-lg tw-bg-white">
      {image ? (
        <Image
          unoptimized
          src={image}
          alt=""
          width={18}
          height={18}
          className="tw-size-[18px] tw-object-contain"
        />
      ) : (
        <GlobeAltIcon
          aria-hidden="true"
          className="tw-size-5 tw-text-iron-900"
        />
      )}
    </span>
  );
}

/**
 * What nobody has tried yet, by system: each issue in a line, with its
 * workaround under it when there is one.
 */
export default function AiKnownIssuesPage() {
  const workaround = t(LOCALE, "ai.knownIssues.workaround");
  return (
    <AiPageFrame
      current="known-issues"
      eyebrow={t(LOCALE, "ai.knownIssues.eyebrow")}
      title={t(LOCALE, "ai.knownIssues.title")}
      lead={t(LOCALE, "ai.knownIssues.lead")}
    >
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
                      <span className="tw-min-w-0 tw-break-words">
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
    </AiPageFrame>
  );
}
