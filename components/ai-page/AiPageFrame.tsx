import Link from "next/link";

import ReleaseSectionFrame, {
  type ReleaseSectionLink,
  type ReleaseSectionPageProps,
} from "@/components/release-section/ReleaseSectionFrame";
import ReleaseSectionNotice from "@/components/release-section/ReleaseSectionNotice";
import { LINK } from "@/components/validator-page/validatorStyles";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t, tRich } from "@/i18n/messages";
import "@/i18n/namespaces/ai-download";

export type AiSection = "download" | "guide" | "known-issues";

// Rendered on the server, in the locale the server renders.
const LOCALE = DEFAULT_LOCALE;

const SECTIONS: readonly ReleaseSectionLink<AiSection>[] = [
  { key: "download", href: "/ai", label: "ai.nav.download" },
  { key: "guide", href: "/ai/guide", label: "ai.nav.guide" },
  {
    key: "known-issues",
    href: "/ai/known-issues",
    label: "ai.nav.knownIssues",
  },
];

/**
 * The notice under the title of every page under /ai: 6529 AI is
 * untested, and this is a test release.
 */
function AiDisclaimer() {
  return (
    <ReleaseSectionNotice
      id="ai-untested"
      title={t(LOCALE, "ai.disclaimer.title")}
    >
      {tRich(LOCALE, "ai.disclaimer.body", {
        knownIssues: (
          <Link key="known-issues" href="/ai/known-issues" className={LINK}>
            {t(LOCALE, "ai.disclaimer.knownIssuesLink")}
          </Link>
        ),
      })}
    </ReleaseSectionNotice>
  );
}

/**
 * The menu of the /ai pages, the page's title, the untested notice, then
 * the page.
 */
export default function AiPageFrame(props: ReleaseSectionPageProps<AiSection>) {
  return (
    <ReleaseSectionFrame
      {...props}
      navLabel="ai.nav.label"
      links={SECTIONS}
      notice={<AiDisclaimer />}
    />
  );
}
