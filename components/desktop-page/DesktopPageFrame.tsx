import Link from "next/link";

import ReleaseSectionFrame, {
  type ReleaseSectionLink,
  type ReleaseSectionPageProps,
} from "@/components/release-section/ReleaseSectionFrame";
import ReleaseSectionNotice from "@/components/release-section/ReleaseSectionNotice";
import { LINK } from "@/components/validator-page/validatorStyles";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t, tRich } from "@/i18n/messages";
import "@/i18n/namespaces/desktop-download";

export type DesktopSection = "download" | "guide" | "known-issues" | "releases";

// Rendered on the server, in the locale the server renders.
const LOCALE = DEFAULT_LOCALE;

const SECTIONS: readonly ReleaseSectionLink<DesktopSection>[] = [
  { key: "download", href: "/desktop", label: "desktopPage.nav.download" },
  { key: "guide", href: "/desktop/guide", label: "desktopPage.nav.guide" },
  {
    key: "known-issues",
    href: "/desktop/known-issues",
    label: "desktopPage.nav.knownIssues",
  },
  {
    key: "releases",
    href: "/desktop/releases",
    label: "desktopPage.nav.releases",
  },
];

/**
 * Under the title of every page under /desktop: this is a test release. On
 * the known issues page itself it does not link there.
 */
function DesktopNotice({ onKnownIssues }: { readonly onKnownIssues: boolean }) {
  return (
    <ReleaseSectionNotice
      id="desktop-test-release"
      title={t(LOCALE, "desktopPage.notice.title")}
    >
      {onKnownIssues
        ? t(LOCALE, "desktopPage.notice.bodyOnKnownIssues")
        : tRich(LOCALE, "desktopPage.notice.body", {
            knownIssues: (
              <Link
                key="known-issues"
                href="/desktop/known-issues"
                className={LINK}
              >
                {t(LOCALE, "desktopPage.notice.knownIssuesLink")}
              </Link>
            ),
          })}
    </ReleaseSectionNotice>
  );
}

/**
 * The menu of the /desktop pages, the page's title, the test-release
 * notice, then the page.
 */
export default function DesktopPageFrame(
  props: ReleaseSectionPageProps<DesktopSection>
) {
  return (
    <ReleaseSectionFrame
      {...props}
      navLabel="desktopPage.nav.label"
      links={SECTIONS}
      notice={
        <DesktopNotice onKnownIssues={props.current === "known-issues"} />
      }
    />
  );
}
