import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAppMetadata } from "@/components/providers/metadata";
import { MuseumJsonDisclosure } from "@/components/museum/MuseumMarkdown";
import {
  MuseumSectionHeading,
  MuseumStatusBadge,
} from "@/components/museum/MuseumShell";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { formatDate, formatInteger } from "@/i18n/format";
import { t } from "@/i18n/messages";
import { getMuseumView } from "@/lib/museum/normalize";
import { buildMuseumRawUrl } from "@/lib/museum/source";
import {
  isAdoptedGovernanceEffect,
  museumSlug,
  museumSlugMatches,
} from "@/lib/museum/presentation";
import {
  displayGovernanceDecisionClass,
  displayGovernanceDisposition,
  displayGovernanceEffect,
  displayGovernanceWaveStatus,
} from "../presentation";

interface GovernanceDetailProps {
  readonly params: Promise<{ decisionId: string }>;
}

async function findDecision(decisionId: string) {
  const view = await getMuseumView();
  return view.governance.find((item) =>
    museumSlugMatches(item.decisionId, decisionId)
  );
}

export async function generateMetadata({
  params,
}: GovernanceDetailProps): Promise<Metadata> {
  const { decisionId } = await params;
  const decision = await findDecision(decisionId);
  const metadata = getAppMetadata({
    title:
      decision?.title ?? t(DEFAULT_LOCALE, "museum.network.governance.title"),
    description:
      decision === undefined
        ? t(DEFAULT_LOCALE, "museum.network.governance.description")
        : displayGovernanceEffect(decision.governanceEffect),
  });
  return decision === undefined ||
    museumSlug(decision.decisionId) !== decisionId
    ? metadata
    : {
        ...metadata,
        alternates: {
          canonical: `/museum/network/about/governance/${encodeURIComponent(museumSlug(decision.decisionId))}`,
        },
      };
}

export default async function MuseumAboutGovernanceDetailPage({
  params,
}: GovernanceDetailProps) {
  const { decisionId } = await params;
  const decision = await findDecision(decisionId);
  if (decision === undefined) notFound();
  const adopted = isAdoptedGovernanceEffect(decision.governanceEffect);
  return (
    <article>
      <Link
        href="/museum/network/about/governance"
        className="tw-inline-flex tw-min-h-11 tw-items-center tw-text-sm tw-font-medium tw-text-primary-300 tw-underline tw-underline-offset-4 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
      >
        {t(DEFAULT_LOCALE, "museum.network.governance.title")}
      </Link>
      <div className="tw-mt-8">
        <MuseumSectionHeading
          eyebrow={decision.decisionId}
          title={decision.title}
          description={displayGovernanceEffect(decision.governanceEffect)}
        />
        <div className="tw-flex tw-flex-wrap tw-gap-2">
          <MuseumStatusBadge
            label={
              adopted
                ? t(DEFAULT_LOCALE, "museum.network.governance.adopted")
                : t(DEFAULT_LOCALE, "museum.network.governance.notAdopted")
            }
            tone={adopted ? "success" : "warning"}
          />
          <MuseumStatusBadge
            label={displayGovernanceDecisionClass(decision.decisionClass)}
          />
        </div>
      </div>
      <dl className="tw-mt-8 tw-grid tw-gap-4 sm:tw-grid-cols-2">
        <div className="tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800 tw-pb-4">
          <dt className="tw-text-xs tw-uppercase tw-tracking-[0.12em] tw-text-iron-500">
            {t(DEFAULT_LOCALE, "museum.network.methodology.waveStatus")}
          </dt>
          <dd className="tw-m-0 tw-mt-2 tw-text-sm tw-text-iron-200">
            {displayGovernanceWaveStatus(decision.observedWaveStatus)}
          </dd>
        </div>
        <div className="tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800 tw-pb-4">
          <dt className="tw-text-xs tw-uppercase tw-tracking-[0.12em] tw-text-iron-500">
            {t(DEFAULT_LOCALE, "museum.network.methodology.recorded")}
          </dt>
          <dd className="tw-m-0 tw-mt-2 tw-text-sm tw-text-iron-200">
            {decision.createdAt
              ? formatDate(DEFAULT_LOCALE, decision.createdAt)
              : t(DEFAULT_LOCALE, "museum.network.governance.notRecorded")}
          </dd>
        </div>
        <div className="tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800 tw-pb-4">
          <dt className="tw-text-xs tw-uppercase tw-tracking-[0.12em] tw-text-iron-500">
            {t(DEFAULT_LOCALE, "museum.network.methodology.disposition")}
          </dt>
          <dd className="tw-m-0 tw-mt-2 tw-text-sm tw-text-iron-200">
            {decision.disposition === null
              ? t(DEFAULT_LOCALE, "museum.network.governance.notRecorded")
              : displayGovernanceDisposition(decision.disposition)}
          </dd>
        </div>
        <div className="tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800 tw-pb-4">
          <dt className="tw-text-xs tw-uppercase tw-tracking-[0.12em] tw-text-iron-500">
            {t(DEFAULT_LOCALE, "museum.network.methodology.rating")}
          </dt>
          <dd className="tw-m-0 tw-mt-2 tw-text-sm tw-text-iron-200">
            {decision.rating ??
              t(DEFAULT_LOCALE, "museum.network.governance.notRecorded")}
            {decision.ratersCount === null
              ? null
              : ` · ${t(DEFAULT_LOCALE, "museum.network.governance.raters", { count: formatInteger(DEFAULT_LOCALE, decision.ratersCount) })}`}
          </dd>
        </div>
      </dl>
      <div className="tw-mt-6">
        <MuseumJsonDisclosure
          label={t(DEFAULT_LOCALE, "museum.network.detail.technicalEvidence")}
          value={decision}
        />
      </div>
      <div className="tw-mt-4 tw-flex tw-flex-wrap tw-gap-4 tw-text-xs tw-text-iron-500">
        <a
          href={buildMuseumRawUrl(decision.sourcePath)}
          target="_blank"
          rel="noopener noreferrer"
          className="tw-underline tw-underline-offset-4 hover:tw-text-iron-300"
        >
          {t(DEFAULT_LOCALE, "museum.network.detail.sourceRecord")}
        </a>
        {decision.sourceUrl === null ? null : (
          <a
            href={decision.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="tw-underline tw-underline-offset-4 hover:tw-text-iron-300"
          >
            {t(DEFAULT_LOCALE, "museum.network.governance.sourceWave")}
          </a>
        )}
      </div>
    </article>
  );
}
