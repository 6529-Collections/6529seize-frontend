import Link from "next/link";

import {
  VALIDATOR_GUIDE_PAGES,
  VALIDATOR_GUIDE_PATHS,
  type ValidatorGuidePageText,
  type ValidatorGuidePath,
} from "@/lib/validator-page/content/guidePages";
import ValidatorMarkdown, { getMarkdownSections } from "./ValidatorMarkdown";
import ValidatorPageFrame, { ValidatorPageHeader } from "./ValidatorPageFrame";
import { SECTION_HEADING } from "./validatorStyles";

const EYEBROW = "Validator guide";
// The start page's cards replace the Markdown table under this heading.
const PATHS_HEADING = "## Choose your path";

const pageHref = (page: ValidatorGuidePageText) =>
  page.slug ? `/validator/guide/${page.slug}` : "/validator/guide";

function PathIcon({ index }: { readonly index: number }) {
  const common = {
    width: 40,
    height: 40,
    viewBox: "0 0 40 40",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.75,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
    className: "tw-text-primary-300",
  };
  if (index === 0) {
    // A laptop.
    return (
      <svg {...common}>
        <rect x="8" y="9" width="24" height="16" rx="2" />
        <path d="M4 30h32l-2 3H6z" />
      </svg>
    );
  }
  if (index === 1) {
    // A small box on a shelf at home.
    return (
      <svg {...common}>
        <path d="M6 18 20 7l14 11" />
        <path d="M9 16v17h22V16" />
        <rect x="14" y="22" width="12" height="6" rx="1.5" />
        <path d="M17 25h2" />
      </svg>
    );
  }
  // A cloud.
  return (
    <svg {...common}>
      <path d="M12 29a7 7 0 0 1-.6-14A9 9 0 0 1 29 14.5a6.5 6.5 0 0 1 0 14.5z" />
    </svg>
  );
}

function PathCard({
  path,
  index,
}: {
  readonly path: ValidatorGuidePath;
  readonly index: number;
}) {
  return (
    <li className="tw-flex">
      <Link
        href={path.href}
        className="tw-group tw-flex tw-w-full tw-flex-col tw-gap-4 tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-iron-900/60 tw-p-5 tw-no-underline tw-transition hover:tw-border-primary-400/60 focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-300"
      >
        <PathIcon index={index} />
        <div>
          <p className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide tw-text-iron-400">
            Path {String.fromCodePoint(65 + index)}
          </p>
          <h3 className="tw-m-0 tw-mt-1 tw-text-lg tw-font-semibold tw-leading-7 tw-text-iron-50">
            {path.title}
          </h3>
          <p className="tw-m-0 tw-mt-2 tw-text-sm tw-leading-6 tw-text-iron-300">
            {path.summary}
          </p>
        </div>
        <dl className="tw-m-0 tw-grid tw-grid-cols-[auto_1fr] tw-gap-x-3 tw-gap-y-1.5 tw-text-sm tw-leading-6">
          {path.facts.map((fact) => (
            <div key={fact.label} className="tw-contents">
              <dt className="tw-text-iron-400">{fact.label}</dt>
              <dd className="tw-m-0 tw-text-iron-100">{fact.value}</dd>
            </div>
          ))}
        </dl>
        <span className="group-hover:tw-text-primary-200 tw-mt-auto tw-text-sm tw-font-semibold tw-text-primary-300">
          Start path {String.fromCodePoint(65 + index)}
        </span>
      </Link>
    </li>
  );
}

function GuidePages({ current }: { readonly current: string }) {
  const index = VALIDATOR_GUIDE_PAGES.findIndex(
    (page) => page.slug === current
  );
  const previous = index > 0 ? VALIDATOR_GUIDE_PAGES[index - 1] : undefined;
  const next = VALIDATOR_GUIDE_PAGES[index + 1];
  return (
    <nav
      aria-labelledby="validator-guide-pages"
      className="tw-mt-16 tw-border-0 tw-border-t tw-border-solid tw-border-white/10 tw-pt-8"
    >
      {(previous ?? next) && (
        <div className="tw-mb-8 tw-flex tw-flex-wrap tw-justify-between tw-gap-4 tw-text-sm">
          {previous ? (
            <Link
              href={pageHref(previous)}
              className="hover:tw-text-primary-200 tw-font-medium tw-text-primary-300 tw-no-underline"
            >
              Previous: {previous.navTitle}
            </Link>
          ) : (
            <span />
          )}
          {next && (
            <Link
              href={pageHref(next)}
              className="hover:tw-text-primary-200 tw-font-medium tw-text-primary-300 tw-no-underline"
            >
              Next: {next.navTitle}
            </Link>
          )}
        </div>
      )}
      <h2
        id="validator-guide-pages"
        className="tw-m-0 tw-text-sm tw-font-semibold tw-uppercase tw-tracking-wide tw-text-iron-400"
      >
        The guide
      </h2>
      <ol className="tw-mb-0 tw-mt-3 tw-grid tw-list-none tw-gap-x-8 tw-gap-y-1.5 tw-p-0 tw-text-sm sm:tw-grid-cols-2">
        {VALIDATOR_GUIDE_PAGES.map((page) => (
          <li key={page.slug}>
            <Link
              href={pageHref(page)}
              aria-current={page.slug === current ? "page" : undefined}
              className={
                page.slug === current
                  ? "tw-font-semibold tw-text-iron-50 tw-no-underline"
                  : "tw-text-iron-300 tw-no-underline hover:tw-text-primary-300"
              }
            >
              {page.navTitle}
            </Link>
          </li>
        ))}
      </ol>
    </nav>
  );
}

function StartPage({ page }: { readonly page: ValidatorGuidePageText }) {
  const at = page.markdown.indexOf(PATHS_HEADING);
  const intro = at >= 0 ? page.markdown.slice(0, at) : page.markdown;
  const rest =
    at >= 0
      ? page.markdown.slice(at + PATHS_HEADING.length).replace(/^\n+/, "")
      : "";
  return (
    <>
      <ValidatorPageHeader eyebrow={EYEBROW} title={page.title}>
        <div className="tw-mt-4 tw-max-w-3xl [&_p]:tw-text-lg [&_p]:tw-leading-8">
          <ValidatorMarkdown markdown={intro} />
        </div>
      </ValidatorPageHeader>
      {at >= 0 && (
        <section aria-labelledby="choose-your-path" className="tw-mb-12">
          <h2 id="choose-your-path" className={SECTION_HEADING}>
            Choose your path
          </h2>
          <ul
            className={`tw-m-0 tw-mt-5 tw-grid tw-list-none tw-gap-4 tw-p-0 ${
              VALIDATOR_GUIDE_PATHS.length > 2
                ? "md:tw-grid-cols-3"
                : "md:tw-grid-cols-2"
            }`}
          >
            {VALIDATOR_GUIDE_PATHS.map((path, index) => (
              <PathCard key={path.href} path={path} index={index} />
            ))}
          </ul>
        </section>
      )}
      <article className="tw-max-w-3xl">
        <ValidatorMarkdown markdown={rest} />
      </article>
    </>
  );
}

function DocPage({ page }: { readonly page: ValidatorGuidePageText }) {
  const sections = getMarkdownSections(page.markdown);
  return (
    <>
      <ValidatorPageHeader eyebrow={EYEBROW} title={page.title} />
      {sections.length >= 3 && (
        <nav
          aria-labelledby="validator-guide-contents"
          className="tw-mb-10 tw-rounded-xl tw-border tw-border-solid tw-border-iron-800/50 tw-bg-iron-900/55 tw-p-5"
        >
          <h2
            id="validator-guide-contents"
            className="tw-m-0 tw-text-sm tw-font-semibold tw-uppercase tw-tracking-wide tw-text-iron-400"
          >
            On this page
          </h2>
          <ol className="tw-mb-0 tw-mt-3 tw-grid tw-list-none tw-gap-x-8 tw-gap-y-1.5 tw-p-0 tw-text-sm sm:tw-grid-cols-2">
            {sections.map((entry) => (
              <li key={entry.id}>
                <a
                  href={`#${entry.id}`}
                  className="tw-text-iron-200 tw-no-underline hover:tw-text-primary-300"
                >
                  {entry.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>
      )}
      <article className="tw-max-w-3xl">
        <ValidatorMarkdown markdown={page.markdown} />
      </article>
    </>
  );
}

/** One page of the setup guide: the start page with its path cards, or a doc page. */
export default function ValidatorGuidePage({
  page,
}: {
  readonly page: ValidatorGuidePageText;
}) {
  return (
    <ValidatorPageFrame current="guide">
      {page.slug ? <DocPage page={page} /> : <StartPage page={page} />}
      <GuidePages current={page.slug} />
    </ValidatorPageFrame>
  );
}
