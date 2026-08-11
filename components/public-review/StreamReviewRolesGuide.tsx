import { ArrowRightIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

import { PublicReviewGuidePointList } from "@/components/public-review/PublicReviewGuidePointList";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";
import type {
  PublicReviewPageDefinition,
  PublicReviewSectionDefinition,
} from "@/lib/public-review/publicReviewTypes";
import { getStreamReviewPageHref } from "@/lib/public-review/streamReviewDefinition";

type RolesGuideItem = {
  readonly titleKey: MessageKey;
  readonly descriptionKey: MessageKey;
};

type PlannedRolesGuideItem = RolesGuideItem & {
  readonly statusKey: MessageKey;
};

const OPEN_STATUS_TITLE_KEY =
  "publicReview.rolesGuide.status.open.title" as const satisfies MessageKey;

const STATUS_ITEMS = [
  {
    titleKey: "publicReview.rolesGuide.status.working.title",
    descriptionKey: "publicReview.rolesGuide.status.working.description",
  },
  {
    titleKey: "publicReview.rolesGuide.status.connected.title",
    descriptionKey: "publicReview.rolesGuide.status.connected.description",
  },
  {
    titleKey: "publicReview.rolesGuide.status.source.title",
    descriptionKey: "publicReview.rolesGuide.status.source.description",
  },
  {
    titleKey: "publicReview.rolesGuide.status.planned.title",
    descriptionKey: "publicReview.rolesGuide.status.planned.description",
  },
  {
    titleKey: OPEN_STATUS_TITLE_KEY,
    descriptionKey: "publicReview.rolesGuide.status.open.description",
  },
] as const satisfies readonly RolesGuideItem[];

const CURRENT_ROLES = [
  {
    titleKey: "publicReview.rolesGuide.current.artist.title",
    descriptionKey: "publicReview.rolesGuide.current.artist.description",
  },
  {
    titleKey: "publicReview.rolesGuide.current.collector.title",
    descriptionKey: "publicReview.rolesGuide.current.collector.description",
  },
  {
    titleKey: "publicReview.rolesGuide.current.signer.title",
    descriptionKey: "publicReview.rolesGuide.current.signer.description",
  },
  {
    titleKey: "publicReview.rolesGuide.current.admins.title",
    descriptionKey: "publicReview.rolesGuide.current.admins.description",
  },
  {
    titleKey: "publicReview.rolesGuide.current.pause.title",
    descriptionKey: "publicReview.rolesGuide.current.pause.description",
  },
  {
    titleKey: "publicReview.rolesGuide.current.anyone.title",
    descriptionKey: "publicReview.rolesGuide.current.anyone.description",
  },
] as const satisfies readonly RolesGuideItem[];

const CONNECTED_ROLES = [
  {
    titleKey: "publicReview.rolesGuide.inactive.mint.title",
    descriptionKey: "publicReview.rolesGuide.inactive.mint.description",
  },
  {
    titleKey: "publicReview.rolesGuide.inactive.revenue.title",
    descriptionKey: "publicReview.rolesGuide.inactive.revenue.description",
  },
] as const satisfies readonly RolesGuideItem[];

const SOURCE_ROLES = [
  {
    titleKey: "publicReview.rolesGuide.inactive.governance.title",
    descriptionKey: "publicReview.rolesGuide.inactive.governance.description",
  },
  {
    titleKey: "publicReview.rolesGuide.inactive.records.title",
    descriptionKey: "publicReview.rolesGuide.inactive.records.description",
  },
  {
    titleKey: "publicReview.rolesGuide.inactive.modules.title",
    descriptionKey: "publicReview.rolesGuide.inactive.modules.description",
  },
  {
    titleKey: "publicReview.rolesGuide.inactive.randomness.title",
    descriptionKey: "publicReview.rolesGuide.inactive.randomness.description",
  },
] as const satisfies readonly RolesGuideItem[];

const PLANNED_ROLES = [
  {
    statusKey: "publicReview.rolesGuide.status.planned.title",
    titleKey: "publicReview.rolesGuide.future.revenueAdapter.title",
    descriptionKey: "publicReview.rolesGuide.future.revenueAdapter.description",
  },
  {
    statusKey: OPEN_STATUS_TITLE_KEY,
    titleKey: "publicReview.rolesGuide.future.artistAdapter.title",
    descriptionKey: "publicReview.rolesGuide.future.artistAdapter.description",
  },
  {
    statusKey: OPEN_STATUS_TITLE_KEY,
    titleKey: "publicReview.rolesGuide.future.artistRecovery.title",
    descriptionKey: "publicReview.rolesGuide.future.artistRecovery.description",
  },
  {
    statusKey: OPEN_STATUS_TITLE_KEY,
    titleKey: "publicReview.rolesGuide.future.finalityRecovery.title",
    descriptionKey:
      "publicReview.rolesGuide.future.finalityRecovery.description",
  },
] as const satisfies readonly PlannedRolesGuideItem[];

const OUTSIDE_RESPONSIBILITIES = [
  {
    titleKey: "publicReview.rolesGuide.outside.community.title",
    descriptionKey: "publicReview.rolesGuide.outside.community.description",
  },
  {
    titleKey: "publicReview.rolesGuide.outside.signing.title",
    descriptionKey: "publicReview.rolesGuide.outside.signing.description",
  },
  {
    titleKey: "publicReview.rolesGuide.outside.services.title",
    descriptionKey: "publicReview.rolesGuide.outside.services.description",
  },
  {
    titleKey: "publicReview.rolesGuide.outside.operations.title",
    descriptionKey: "publicReview.rolesGuide.outside.operations.description",
  },
  {
    titleKey: "publicReview.rolesGuide.outside.marketplaces.title",
    descriptionKey: "publicReview.rolesGuide.outside.marketplaces.description",
  },
] as const satisfies readonly RolesGuideItem[];

const MAIN_RISKS = [
  {
    titleKey: "publicReview.rolesGuide.risks.admin.title",
    descriptionKey: "publicReview.rolesGuide.risks.admin.description",
  },
  {
    titleKey: "publicReview.rolesGuide.risks.signer.title",
    descriptionKey: "publicReview.rolesGuide.risks.signer.description",
  },
  {
    titleKey: "publicReview.rolesGuide.risks.pause.title",
    descriptionKey: "publicReview.rolesGuide.risks.pause.description",
  },
  {
    titleKey: "publicReview.rolesGuide.risks.artist.title",
    descriptionKey: "publicReview.rolesGuide.risks.artist.description",
  },
  {
    titleKey: "publicReview.rolesGuide.risks.status.title",
    descriptionKey: "publicReview.rolesGuide.risks.status.description",
  },
  {
    titleKey: "publicReview.rolesGuide.risks.successor.title",
    descriptionKey: "publicReview.rolesGuide.risks.successor.description",
  },
] as const satisfies readonly RolesGuideItem[];

const REVIEW_QUESTIONS = [
  "publicReview.rolesGuide.questions.global",
  "publicReview.rolesGuide.questions.delay",
  "publicReview.rolesGuide.questions.artist",
  "publicReview.rolesGuide.questions.pause",
  "publicReview.rolesGuide.questions.successor",
] as const satisfies readonly MessageKey[];

export const STREAM_REVIEW_ROLES_GUIDE_SECTIONS = [
  {
    id: "start-with-status",
    title: t(DEFAULT_LOCALE, "publicReview.rolesGuide.status.heading"),
  },
  {
    id: "working-in-the-current-rehearsal",
    title: t(DEFAULT_LOCALE, "publicReview.rolesGuide.current.heading"),
  },
  {
    id: "built-but-not-active-in-the-current-path",
    title: t(DEFAULT_LOCALE, "publicReview.rolesGuide.inactive.heading"),
  },
  {
    id: "planned-or-still-open",
    title: t(DEFAULT_LOCALE, "publicReview.rolesGuide.future.heading"),
  },
  {
    id: "responsibilities-outside-the-contracts",
    title: t(DEFAULT_LOCALE, "publicReview.rolesGuide.outside.heading"),
  },
  {
    id: "main-risks",
    title: t(DEFAULT_LOCALE, "publicReview.rolesGuide.risks.heading"),
  },
  {
    id: "questions-for-reviewers",
    title: t(DEFAULT_LOCALE, "publicReview.rolesGuide.questions.heading"),
  },
] as const satisfies readonly PublicReviewSectionDefinition[];

function RolesGuideList({
  items,
}: {
  readonly items: readonly RolesGuideItem[];
}) {
  return (
    <ul className="tw-mb-0 tw-mt-7 tw-grid tw-list-none tw-gap-3 tw-p-0 sm:tw-grid-cols-2">
      {items.map((item) => (
        <li
          key={item.titleKey}
          className="tw-rounded-xl tw-border tw-border-solid tw-border-white/[0.09] tw-bg-iron-950/60 tw-p-5"
        >
          <h3 className="tw-m-0 tw-text-sm tw-font-semibold tw-text-iron-100">
            {t(DEFAULT_LOCALE, item.titleKey)}
          </h3>
          <p className="tw-mb-0 tw-mt-2 tw-text-sm tw-leading-6 tw-text-iron-400">
            {t(DEFAULT_LOCALE, item.descriptionKey)}
          </p>
        </li>
      ))}
    </ul>
  );
}

function SectionHeading({
  descriptionKey,
  section,
}: {
  readonly descriptionKey: MessageKey;
  readonly section: PublicReviewSectionDefinition;
}) {
  return (
    <>
      <h2
        id={section.id}
        className="tw-m-0 tw-text-xl tw-font-semibold tw-tracking-tight tw-text-iron-100 sm:tw-text-2xl"
      >
        {section.title}
      </h2>
      <p className="tw-mb-0 tw-mt-2 tw-text-sm tw-leading-6 tw-text-iron-300">
        {t(DEFAULT_LOCALE, descriptionKey)}
      </p>
    </>
  );
}

function PageLink({ page }: { readonly page: PublicReviewPageDefinition }) {
  return (
    <Link
      href={getStreamReviewPageHref({ page })}
      className="tw-group tw-inline-flex tw-min-h-11 tw-items-center tw-gap-2 tw-text-xs tw-font-semibold tw-text-primary-300 tw-no-underline focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400"
    >
      {t(DEFAULT_LOCALE, "publicReview.rolesGuide.evidence.readPage", {
        page: t(DEFAULT_LOCALE, page.titleKey),
      })}
      <ArrowRightIcon
        aria-hidden="true"
        className="tw-size-3.5 tw-flex-none tw-transition-transform group-hover:tw-translate-x-0.5"
      />
    </Link>
  );
}

export function StreamReviewRolesGuide({
  pages,
}: {
  readonly pages: readonly PublicReviewPageDefinition[];
}) {
  const governancePage = pages.find(
    (page) => page.id === "governance-pausing-and-successors"
  );
  const statusPage = pages.find(
    (page) => page.id === "security-testing-and-known-limitations"
  );

  return (
    <div className="tw-mt-12 tw-w-full tw-max-w-[52rem] sm:tw-mt-16">
      <section
        aria-labelledby={STREAM_REVIEW_ROLES_GUIDE_SECTIONS[0].id}
        className="tw-rounded-xl tw-border tw-border-solid tw-border-primary-400/20 tw-bg-primary-400/[0.06] tw-p-5 sm:tw-p-7"
      >
        <SectionHeading
          descriptionKey="publicReview.rolesGuide.status.description"
          section={STREAM_REVIEW_ROLES_GUIDE_SECTIONS[0]}
        />
        <ul className="tw-mb-0 tw-mt-6 tw-grid tw-list-none tw-gap-3 tw-p-0 sm:tw-grid-cols-2">
          {STATUS_ITEMS.map((status) => (
            <li
              key={status.titleKey}
              className="tw-rounded-lg tw-border tw-border-solid tw-border-white/[0.08] tw-bg-black/20 tw-p-4"
            >
              <h3 className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.08em] tw-text-primary-300">
                {t(DEFAULT_LOCALE, status.titleKey)}
              </h3>
              <p className="tw-mb-0 tw-mt-2 tw-text-sm tw-leading-6 tw-text-iron-300">
                {t(DEFAULT_LOCALE, status.descriptionKey)}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section
        aria-labelledby={STREAM_REVIEW_ROLES_GUIDE_SECTIONS[1].id}
        className="tw-mt-14"
      >
        <SectionHeading
          descriptionKey="publicReview.rolesGuide.current.description"
          section={STREAM_REVIEW_ROLES_GUIDE_SECTIONS[1]}
        />
        <RolesGuideList items={CURRENT_ROLES} />
      </section>

      <section
        aria-labelledby={STREAM_REVIEW_ROLES_GUIDE_SECTIONS[2].id}
        className="tw-mt-14"
      >
        <SectionHeading
          descriptionKey="publicReview.rolesGuide.inactive.description"
          section={STREAM_REVIEW_ROLES_GUIDE_SECTIONS[2]}
        />
        <p className="tw-mb-0 tw-mt-7 tw-text-sm tw-font-semibold tw-uppercase tw-tracking-[0.08em] tw-text-primary-300">
          {t(DEFAULT_LOCALE, "publicReview.rolesGuide.status.connected.title")}
        </p>
        <RolesGuideList items={CONNECTED_ROLES} />
        <p className="tw-mb-0 tw-mt-8 tw-text-sm tw-font-semibold tw-uppercase tw-tracking-[0.08em] tw-text-primary-300">
          {t(DEFAULT_LOCALE, "publicReview.rolesGuide.status.source.title")}
        </p>
        <RolesGuideList items={SOURCE_ROLES} />
      </section>

      <section
        aria-labelledby={STREAM_REVIEW_ROLES_GUIDE_SECTIONS[3].id}
        className="tw-mt-14"
      >
        <SectionHeading
          descriptionKey="publicReview.rolesGuide.future.description"
          section={STREAM_REVIEW_ROLES_GUIDE_SECTIONS[3]}
        />
        <ul className="tw-mb-0 tw-mt-7 tw-grid tw-list-none tw-gap-3 tw-p-0 sm:tw-grid-cols-2">
          {PLANNED_ROLES.map((item) => (
            <li
              key={item.titleKey}
              className="tw-rounded-xl tw-border tw-border-solid tw-border-white/[0.09] tw-bg-iron-950/60 tw-p-5"
            >
              <p className="tw-m-0 tw-text-[0.68rem] tw-font-semibold tw-uppercase tw-tracking-[0.1em] tw-text-primary-300">
                {t(DEFAULT_LOCALE, item.statusKey)}
              </p>
              <h3 className="tw-mb-0 tw-mt-2 tw-text-sm tw-font-semibold tw-text-iron-100">
                {t(DEFAULT_LOCALE, item.titleKey)}
              </h3>
              <p className="tw-mb-0 tw-mt-2 tw-text-sm tw-leading-6 tw-text-iron-400">
                {t(DEFAULT_LOCALE, item.descriptionKey)}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section
        aria-labelledby={STREAM_REVIEW_ROLES_GUIDE_SECTIONS[4].id}
        className="tw-mt-14"
      >
        <SectionHeading
          descriptionKey="publicReview.rolesGuide.outside.description"
          section={STREAM_REVIEW_ROLES_GUIDE_SECTIONS[4]}
        />
        <PublicReviewGuidePointList points={OUTSIDE_RESPONSIBILITIES} />
      </section>

      <section
        aria-labelledby={STREAM_REVIEW_ROLES_GUIDE_SECTIONS[5].id}
        className="tw-mt-14"
      >
        <SectionHeading
          descriptionKey="publicReview.rolesGuide.risks.description"
          section={STREAM_REVIEW_ROLES_GUIDE_SECTIONS[5]}
        />
        <PublicReviewGuidePointList points={MAIN_RISKS} />
      </section>

      <section
        aria-labelledby={STREAM_REVIEW_ROLES_GUIDE_SECTIONS[6].id}
        className="tw-mt-14"
      >
        <SectionHeading
          descriptionKey="publicReview.rolesGuide.questions.description"
          section={STREAM_REVIEW_ROLES_GUIDE_SECTIONS[6]}
        />
        <ol className="tw-mb-0 tw-mt-6 tw-space-y-3 tw-pl-5 tw-text-sm tw-leading-6 tw-text-iron-300 marker:tw-font-mono marker:tw-text-primary-300">
          {REVIEW_QUESTIONS.map((questionKey) => (
            <li key={questionKey} className="tw-pl-2">
              {t(DEFAULT_LOCALE, questionKey)}
            </li>
          ))}
        </ol>
        <aside
          aria-labelledby="stream-roles-evidence-heading"
          className="tw-mt-8 tw-rounded-xl tw-border tw-border-solid tw-border-primary-400/20 tw-bg-primary-400/[0.06] tw-p-5 sm:tw-p-6"
        >
          <h3
            id="stream-roles-evidence-heading"
            className="tw-m-0 tw-text-base tw-font-semibold tw-text-iron-100"
          >
            {t(DEFAULT_LOCALE, "publicReview.rolesGuide.evidence.heading")}
          </h3>
          <p className="tw-mb-0 tw-mt-2 tw-text-sm tw-leading-6 tw-text-iron-300">
            {t(DEFAULT_LOCALE, "publicReview.rolesGuide.evidence.description")}
          </p>
          <div className="tw-mt-3 tw-flex tw-flex-col tw-items-start sm:tw-flex-row sm:tw-flex-wrap sm:tw-gap-x-5">
            {statusPage ? <PageLink page={statusPage} /> : null}
            {governancePage ? <PageLink page={governancePage} /> : null}
          </div>
        </aside>
      </section>
    </div>
  );
}
