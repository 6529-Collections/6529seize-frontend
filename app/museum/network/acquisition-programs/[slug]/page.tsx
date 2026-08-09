import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { MuseumBreadcrumbs } from "@/components/museum/MuseumBreadcrumbs";
import { MuseumEntityContext } from "@/components/museum/MuseumEntityContext";
import {
  MuseumJsonDisclosure,
  MuseumMarkdown,
} from "@/components/museum/MuseumMarkdown";
import { MuseumPublicationUnavailable } from "@/components/museum/MuseumPublicationUnavailable";
import { MuseumPublicMediaFigure } from "@/components/museum/MuseumPublicMediaFigure";
import { MuseumProgramImage } from "@/components/museum/MuseumProgramImage";
import { getAppMetadata } from "@/components/providers/metadata";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { getMuseumPublicationBundle } from "@/lib/museum/publication/runtimeBundle";
import {
  buildMuseumEntityContext,
} from "@/lib/museum/publication/ia";
import {
  museumAcquisitionProgramHref,
  museumAcquisitionsHref,
  museumApprovedCollectionSlug,
  museumWorkHref,
  museumWorkHrefForSourceId,
  museumWorkHrefIndex,
} from "@/lib/museum/publication/routes";
import type { MuseumPublicWork } from "@/lib/museum/publication/types";
import type { MuseumProgram, MuseumView } from "@/lib/museum/types";
import { displayMuseumPublicAcquisitionStatus } from "@/lib/museum/presentation";

interface MuseumAcquisitionProgramPageProps {
  readonly params: Promise<{ slug: string }>;
}

const GIFT_ACQUISITIONS_SOURCE_PATH =
  "records/collections/approved-collections.json";

function legacyGiftAcquisitionsProgram(
  view: MuseumView | null,
  slug: string
): MuseumProgram | undefined {
  if (
    slug !== "gift-acquisitions" ||
    view === null ||
    view.approvedCollections.length === 0
  ) {
    return undefined;
  }
  return {
    programId: "AP-GIFT-01",
    title: t(DEFAULT_LOCALE, "museum.network.acquisitionPrograms.giftTitle"),
    subtitle: t(
      DEFAULT_LOCALE,
      "museum.network.acquisitionPrograms.giftDescription"
    ),
    status: "pathway",
    statusAsOf: null,
    curatorialFrame: t(
      DEFAULT_LOCALE,
      "museum.network.acquisitionPrograms.giftDescription"
    ),
    rules: [],
    nonClaims: [],
    selectedWorks: [],
    sourcePath: GIFT_ACQUISITIONS_SOURCE_PATH,
    selectedWorksPath: null,
  };
}

function legacyAcquisitionProgram(
  view: MuseumView | null,
  slug: string
): MuseumProgram | undefined {
  return (
    view?.programs.find(
      (program) =>
        program.programId === slug ||
        (slug === "keys-and-gates" && program.programId === "6529NM-AP-01")
    ) ?? legacyGiftAcquisitionsProgram(view, slug)
  );
}

export async function generateMetadata({
  params,
}: MuseumAcquisitionProgramPageProps): Promise<Metadata> {
  const { slug } = await params;
  const { publicationState, view } = await getMuseumPublicationBundle();
  const typed = publicationState.publication?.acquisitionPrograms?.find(
    (program) =>
      program.slug === slug ||
      program.id === slug ||
      program.sourceAliases?.includes(slug) === true
  );
  const legacy = legacyAcquisitionProgram(view, slug);
  const metadata = getAppMetadata({
    title:
      typed?.title ??
      legacy?.title ??
      t(DEFAULT_LOCALE, "museum.network.acquisitionPrograms.title"),
    description: t(
      DEFAULT_LOCALE,
      "museum.network.acquisitionPrograms.description"
    ),
  });
  return typed?.slug !== slug
    ? metadata
    : {
        ...metadata,
        alternates: { canonical: museumAcquisitionProgramHref(typed.slug) },
      };
}

function publicWorkMedia(work: MuseumPublicWork) {
  const media = work.media[0];
  return media ?? null;
}

export default async function MuseumAcquisitionProgramPage({
  params,
}: MuseumAcquisitionProgramPageProps) {
  const { slug } = await params;
  const { publicationState, view } = await getMuseumPublicationBundle();
  const publication = publicationState.publication;
  if (publication === null) return <MuseumPublicationUnavailable />;
  const typed = publication.acquisitionPrograms?.find(
    (program) =>
      program.slug === slug ||
      program.id === slug ||
      program.sourceAliases?.includes(slug) === true
  );
  if (typed !== undefined && typed.slug !== slug) {
    permanentRedirect(museumAcquisitionProgramHref(typed.slug));
  }
  const legacy = legacyAcquisitionProgram(view, slug);
  if (typed === undefined && legacy === undefined) notFound();

  const typedWorks =
    typed === undefined
      ? []
      : (publication.works ?? []).filter(
          (work) =>
            work.programIds.includes(typed.id) ||
            typed.acquisitionIds.some((acquisitionId) =>
              work.acquisitionIds.includes(acquisitionId)
            )
        );
  const selectedWorks =
    typed === undefined ? (legacy?.selectedWorks ?? []) : [];
  const title = typed?.title ?? legacy?.title ?? "";
  const sourcePath = typed?.sourcePaths[0] ?? legacy?.sourcePath ?? null;
  const context = buildMuseumEntityContext({
    kind: "acquisition_program",
    id: typed?.id ?? legacy?.programId ?? slug,
    label: title,
    canonicalHref: museumAcquisitionProgramHref(
      typed?.slug ?? "keys-and-gates"
    ),
    breadcrumbs: [
      { label: "6529 Network Museum", href: "/museum/network" },
      {
        label: t(DEFAULT_LOCALE, "museum.network.acquisitionPrograms.title"),
        href: "/museum/network/acquisition-programs",
      },
      { label: title },
    ],
    ...(typedWorks[0]?.status === undefined
      ? {}
      : { status: displayMuseumPublicAcquisitionStatus(typedWorks[0].status) }),
    statusAsOf: typedWorks[0]?.statusAsOf ?? legacy?.statusAsOf ?? null,
    primaryRelations: typedWorks.flatMap((work) => {
      const relationSourcePath = work.sourcePaths[0];
      return relationSourcePath === undefined
        ? []
        : [
            {
              kind: "work" as const,
              id: work.id,
              label: work.title,
              href: museumWorkHref(work.id),
              relation: "Selected through",
              status: work.status,
              statusAsOf: work.statusAsOf,
              sourcePath: relationSourcePath,
              sourceCommit: publication.identity.commit,
            },
          ];
    }),
    secondaryRelations: [],
    sourcePath,
    sourceCommit: publication.identity.commit,
  });
  if (context === null) return <MuseumPublicationUnavailable />;
  const documents =
    typed === undefined
      ? []
      : publication.documents.filter((document) =>
          typed.sourceDocumentIds.includes(document.id)
        );
  const approvedCollections =
    legacy?.programId === "AP-GIFT-01" ? (view?.approvedCollections ?? []) : [];
  const workHrefs = museumWorkHrefIndex(publication, view);
  return (
    <article className="tw-min-w-0">
      <MuseumBreadcrumbs
        ariaLabel={t(
          DEFAULT_LOCALE,
          "museum.network.accessibility.breadcrumbs"
        )}
        items={context.breadcrumbs}
      />
      <Link
        href={museumAcquisitionsHref()}
        className="tw-mt-3 tw-inline-flex tw-min-h-11 tw-items-center tw-text-sm tw-font-medium tw-text-iron-400 tw-underline tw-underline-offset-4 hover:tw-text-white focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
      >
        {t(DEFAULT_LOCALE, "museum.network.acquisitions.back")}
      </Link>
      <header className="tw-mt-6 tw-max-w-4xl">
        <p className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.16em] tw-text-primary-300">
          {t(DEFAULT_LOCALE, "museum.network.acquisitionPrograms.eyebrow")}
        </p>
        <h1 className="tw-m-0 tw-mt-3 tw-text-4xl tw-font-semibold tw-leading-tight tw-text-iron-50 sm:tw-text-5xl">
          {title}
        </h1>
        <p className="tw-m-0 tw-mt-5 tw-max-w-3xl tw-text-base tw-leading-7 tw-text-iron-300">
          {typed
            ? t(
                DEFAULT_LOCALE,
                "museum.network.acquisitionPrograms.detailDescription"
              )
            : legacy?.curatorialFrame}
        </p>
      </header>
      <MuseumEntityContext
        context={context}
        labels={{
          ariaLabel: t(
            DEFAULT_LOCALE,
            "museum.network.accessibility.entityContext"
          ),
          statusAsOf: t(DEFAULT_LOCALE, "museum.network.entity.statusAsOf"),
          source: t(DEFAULT_LOCALE, "museum.network.entity.sources"),
        }}
      />
      {typedWorks.length > 0 ? (
        <section className="tw-mt-10" aria-labelledby="program-works-title">
          <h2
            id="program-works-title"
            className="tw-m-0 tw-text-2xl tw-font-semibold tw-text-iron-50"
          >
            {t(DEFAULT_LOCALE, "museum.network.acquisitionPrograms.works")}
          </h2>
          <div className="tw-mt-6 tw-grid tw-gap-x-6 tw-gap-y-10 sm:tw-grid-cols-2 xl:tw-grid-cols-3">
            {typedWorks.map((work) => {
              const media = publicWorkMedia(work);
              return media ? (
                <MuseumPublicMediaFigure
                  key={work.id}
                  src={media.url}
                  width={media.width}
                  height={media.height}
                  alt={media.altText ?? ""}
                  href={museumWorkHref(work.id)}
                  title={work.title}
                />
              ) : (
                <Link
                  key={work.id}
                  href={museumWorkHref(work.id)}
                  className="hover:tw-text-primary-200 tw-border-b tw-border-solid tw-border-iron-800 tw-py-4 tw-text-base tw-font-semibold tw-text-primary-300 tw-underline-offset-4 hover:tw-underline"
                >
                  {work.title}
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}
      {selectedWorks.length > 0 ? (
        <section
          className="tw-mt-10"
          aria-labelledby="legacy-program-works-title"
        >
          <h2
            id="legacy-program-works-title"
            className="tw-m-0 tw-text-2xl tw-font-semibold tw-text-iron-50"
          >
            {t(DEFAULT_LOCALE, "museum.network.acquisitionPrograms.works")}
          </h2>
          <div className="tw-mt-6 tw-grid tw-gap-6 sm:tw-grid-cols-2 xl:tw-grid-cols-3">
            {selectedWorks.map((work) => {
              const href = museumWorkHrefForSourceId(
                publication,
                work.recordId,
                view
              );
              const content = work.media ? (
                <>
                  <div className="tw-aspect-square tw-overflow-hidden tw-bg-black">
                    <MuseumProgramImage
                      media={work.media}
                      sizes="(min-width: 1280px) 30vw, (min-width: 640px) 50vw, 100vw"
                      className="tw-h-full tw-w-full tw-object-contain"
                    />
                  </div>
                  <p className="tw-m-0 tw-mt-3 tw-text-base tw-font-semibold tw-text-iron-50">
                    {work.title}
                  </p>
                  <p className="tw-m-0 tw-mt-1 tw-text-sm tw-text-iron-400">
                    {work.artist}
                  </p>
                </>
              ) : (
                <span className="tw-border-b tw-border-solid tw-border-iron-800 tw-py-4 tw-text-primary-300">
                  {work.title}
                </span>
              );
              return href === null ? (
                <article key={work.recordId} className="tw-min-w-0">
                  {content}
                </article>
              ) : (
                <Link
                  key={work.recordId}
                  href={href}
                  className="hover:tw-text-primary-200 tw-group tw-block tw-no-underline"
                >
                  {content}
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}
      {approvedCollections.length > 0 ? (
        <section
          className="tw-mt-10 tw-max-w-4xl"
          aria-labelledby="gift-acquisitions-collections-title"
        >
          <h2
            id="gift-acquisitions-collections-title"
            className="tw-m-0 tw-text-2xl tw-font-semibold tw-text-iron-50"
          >
            {t(DEFAULT_LOCALE, "museum.network.collections.title")}
          </h2>
          <p className="tw-m-0 tw-mt-3 tw-text-base tw-leading-7 tw-text-iron-300">
            {t(DEFAULT_LOCALE, "museum.network.collections.description")}
          </p>
          <ul className="tw-m-0 tw-mt-6 tw-list-none tw-border-y tw-border-solid tw-border-iron-800 tw-p-0">
            {approvedCollections.map((collection) => (
              <li
                key={collection.approvalId}
                id={museumApprovedCollectionSlug(collection.preferredName)}
                className="tw-scroll-mt-8 tw-border-b tw-border-solid tw-border-iron-800 tw-py-5 last:tw-border-b-0"
              >
                <h3 className="tw-m-0 tw-text-lg tw-font-semibold tw-text-iron-50">
                  {collection.preferredName}
                </h3>
                <p className="tw-m-0 tw-mt-2 tw-text-sm tw-leading-6 tw-text-iron-300">
                  {collection.scopeDefinition}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {documents.map((document) => (
        <section
          key={document.id}
          className="tw-mt-14 tw-max-w-4xl tw-border-t tw-border-solid tw-border-iron-800 tw-pt-10"
        >
          <h2 className="tw-m-0 tw-text-2xl tw-font-semibold tw-text-iron-50">
            {document.title}
          </h2>
          {document.kind === "source_record" ? (
            <div className="tw-mt-6">
              <MuseumJsonDisclosure
                label={document.title}
                sourceJson={document.markdown}
              />
            </div>
          ) : (
            <MuseumMarkdown
              className="tw-mt-6"
              embeddedDocument
              sourceCommit={publication.identity.commit}
              sourcePath={document.sourcePath}
              workHrefs={workHrefs}
            >
              {document.markdown}
            </MuseumMarkdown>
          )}
        </section>
      ))}
    </article>
  );
}
