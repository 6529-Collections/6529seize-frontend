import type { Metadata } from "next";
import Link from "next/link";
import { getAppMetadata } from "@/components/providers/metadata";
import { MuseumSectionHeading } from "@/components/museum/MuseumShell";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";
import { getMuseumView } from "@/lib/museum/normalize";
import { buildMuseumMainBlobUrl } from "@/lib/museum/publication/security";
import type { MuseumTextDocument } from "@/lib/museum/types";

export const metadata: Metadata = getAppMetadata({
  title: t(DEFAULT_LOCALE, "museum.network.methodology.title"),
  description: t(DEFAULT_LOCALE, "museum.network.methodology.description"),
});

interface MethodologyEntry {
  readonly path: string;
  readonly titleKey: MessageKey;
  readonly descriptionKey: MessageKey;
  readonly onsitePath?: string;
}

interface MethodologySection {
  readonly titleKey: MessageKey;
  readonly descriptionKey: MessageKey;
  readonly entries: readonly MethodologyEntry[];
}

const METHODOLOGY_SECTIONS: readonly MethodologySection[] = [
  {
    titleKey: "museum.network.methodology.sections.policy.title",
    descriptionKey: "museum.network.methodology.sections.policy.description",
    entries: [
      {
        path: "policies/founding-and-operating-principles.md",
        titleKey: "museum.network.methodology.documents.founding.title",
        descriptionKey:
          "museum.network.methodology.documents.founding.description",
      },
      {
        path: "policies/donation-acceptance.md",
        titleKey: "museum.network.methodology.documents.donations.title",
        descriptionKey:
          "museum.network.methodology.documents.donations.description",
      },
      {
        path: "policies/general-nft-collecting-scope.md",
        titleKey: "museum.network.methodology.documents.collecting.title",
        descriptionKey:
          "museum.network.methodology.documents.collecting.description",
      },
    ],
  },
  {
    titleKey: "museum.network.methodology.sections.standards.title",
    descriptionKey: "museum.network.methodology.sections.standards.description",
    entries: [
      {
        path: "docs/data-architecture.md",
        onsitePath: "/museum/network/methodology/data-architecture",
        titleKey: "museum.network.methodology.documents.dataArchitecture.title",
        descriptionKey:
          "museum.network.methodology.documents.dataArchitecture.description",
      },
      {
        path: "docs/accession-standard.md",
        titleKey: "museum.network.methodology.documents.accession.title",
        descriptionKey:
          "museum.network.methodology.documents.accession.description",
      },
      {
        path: "docs/record-model.md",
        titleKey: "museum.network.methodology.documents.records.title",
        descriptionKey:
          "museum.network.methodology.documents.records.description",
      },
      {
        path: "docs/standards-crosswalk.md",
        titleKey: "museum.network.methodology.documents.crosswalk.title",
        descriptionKey:
          "museum.network.methodology.documents.crosswalk.description",
      },
    ],
  },
  {
    titleKey: "museum.network.methodology.sections.research.title",
    descriptionKey: "museum.network.methodology.sections.research.description",
    entries: [
      {
        path: "docs/curatorial-publication-standard.md",
        titleKey: "museum.network.methodology.documents.curatorial.title",
        descriptionKey:
          "museum.network.methodology.documents.curatorial.description",
      },
      {
        path: "docs/generative-trait-analysis.md",
        titleKey: "museum.network.methodology.documents.generative.title",
        descriptionKey:
          "museum.network.methodology.documents.generative.description",
      },
    ],
  },
  {
    titleKey: "museum.network.methodology.sections.onchain.title",
    descriptionKey: "museum.network.methodology.sections.onchain.description",
    entries: [
      {
        path: "docs/open-museum.md",
        titleKey: "museum.network.methodology.documents.openMuseum.title",
        descriptionKey:
          "museum.network.methodology.documents.openMuseum.description",
      },
      {
        path: "docs/onchain-transition.md",
        titleKey: "museum.network.methodology.documents.transition.title",
        descriptionKey:
          "museum.network.methodology.documents.transition.description",
      },
      {
        path: "docs/external-works-registry.md",
        titleKey: "museum.network.methodology.documents.registry.title",
        descriptionKey:
          "museum.network.methodology.documents.registry.description",
      },
      {
        path: "docs/onchain-design.md",
        titleKey: "museum.network.methodology.documents.onchain.title",
        descriptionKey:
          "museum.network.methodology.documents.onchain.description",
      },
      {
        path: "docs/stream-interoperability.md",
        titleKey: "museum.network.methodology.documents.stream.title",
        descriptionKey:
          "museum.network.methodology.documents.stream.description",
      },
    ],
  },
  {
    titleKey: "museum.network.methodology.sections.archive.title",
    descriptionKey: "museum.network.methodology.sections.archive.description",
    entries: [
      {
        path: "docs/casey-accession-control.md",
        titleKey: "museum.network.methodology.documents.caseyControl.title",
        descriptionKey:
          "museum.network.methodology.documents.caseyControl.description",
      },
      {
        path: "docs/control-plane.md",
        titleKey: "museum.network.methodology.documents.validation.title",
        descriptionKey:
          "museum.network.methodology.documents.validation.description",
      },
      {
        path: "docs/implementation-roadmap.md",
        titleKey: "museum.network.methodology.documents.roadmap.title",
        descriptionKey:
          "museum.network.methodology.documents.roadmap.description",
      },
      {
        path: "docs/public-museum-experience-standard.md",
        titleKey: "museum.network.methodology.documents.experience.title",
        descriptionKey:
          "museum.network.methodology.documents.experience.description",
      },
    ],
  },
] as const;

function availablePaths(
  policies: readonly MuseumTextDocument[],
  methodology: readonly MuseumTextDocument[]
): ReadonlySet<string> {
  return new Set([...policies, ...methodology].map(({ path }) => path));
}

function MuseumMethodologyCard({
  entry,
}: {
  readonly entry: MethodologyEntry;
}) {
  const href = entry.onsitePath ?? buildMuseumMainBlobUrl(entry.path);
  if (href === null) {
    return null;
  }
  const title = t(DEFAULT_LOCALE, entry.titleKey);

  return (
    <article className="tw-flex tw-h-full tw-flex-col tw-rounded-2xl tw-border tw-border-white/10 tw-bg-iron-900/60 tw-p-5">
      <h3 className="tw-m-0 tw-text-lg tw-font-semibold tw-text-white">
        {title}
      </h3>
      <p className="tw-m-0 tw-mt-3 tw-flex-1 tw-text-sm tw-leading-6 tw-text-iron-300">
        {t(DEFAULT_LOCALE, entry.descriptionKey)}
      </p>
      <p className="tw-m-0 tw-mt-5 tw-break-all tw-text-xs tw-text-iron-500">
        {entry.path}
      </p>
      {entry.onsitePath === undefined ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:tw-text-primary-200 tw-mt-3 tw-inline-flex tw-min-h-11 tw-items-center tw-self-start tw-text-sm tw-font-semibold tw-text-primary-300 tw-underline tw-underline-offset-4 focus-visible:tw-rounded-sm focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
          aria-label={t(
            DEFAULT_LOCALE,
            "museum.network.methodology.sourceAccessible",
            { title }
          )}
        >
          {t(DEFAULT_LOCALE, "museum.network.methodology.source")}
        </a>
      ) : (
        <Link
          href={entry.onsitePath}
          prefetch={false}
          className="hover:tw-text-primary-200 tw-mt-3 tw-inline-flex tw-min-h-11 tw-items-center tw-self-start tw-text-sm tw-font-semibold tw-text-primary-300 tw-underline tw-underline-offset-4 focus-visible:tw-rounded-sm focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
          aria-label={t(
            DEFAULT_LOCALE,
            "museum.network.methodology.sourceAccessible",
            { title }
          )}
        >
          {t(DEFAULT_LOCALE, "museum.network.methodology.readInMuseum")}
        </Link>
      )}
    </article>
  );
}

export default async function MuseumMethodologyPage() {
  const view = await getMuseumView();
  const paths = availablePaths(view.policies, view.methodology);
  const sections = METHODOLOGY_SECTIONS.map((section) => ({
    ...section,
    entries: section.entries.filter(({ path }) => paths.has(path)),
  })).filter(({ entries }) => entries.length > 0);

  return (
    <section>
      <MuseumSectionHeading
        eyebrow={t(DEFAULT_LOCALE, "museum.network.nav.methodology")}
        title={t(DEFAULT_LOCALE, "museum.network.methodology.title")}
        description={t(
          DEFAULT_LOCALE,
          "museum.network.methodology.description"
        )}
      />
      {sections.length === 0 ? (
        <p className="tw-m-0 tw-rounded-xl tw-border tw-border-white/10 tw-bg-iron-900/60 tw-p-5 tw-text-sm tw-text-iron-300">
          {t(DEFAULT_LOCALE, "museum.network.methodology.empty")}
        </p>
      ) : (
        <div className="tw-space-y-12">
          {sections.map((section) => (
            <section key={section.titleKey}>
              <div className="tw-max-w-3xl">
                <h2 className="tw-m-0 tw-text-xl tw-font-semibold tw-text-white">
                  {t(DEFAULT_LOCALE, section.titleKey)}
                </h2>
                <p className="tw-m-0 tw-mt-2 tw-text-sm tw-leading-6 tw-text-iron-300">
                  {t(DEFAULT_LOCALE, section.descriptionKey)}
                </p>
              </div>
              <div className="tw-mt-5 tw-grid tw-gap-4 md:tw-grid-cols-2">
                {section.entries.map((entry) => (
                  <MuseumMethodologyCard key={entry.path} entry={entry} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </section>
  );
}
