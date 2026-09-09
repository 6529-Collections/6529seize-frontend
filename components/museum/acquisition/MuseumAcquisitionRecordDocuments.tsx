import { MuseumEntityContext } from "../MuseumEntityContext";
import {
  AcquisitionDocumentSection,
  AcquisitionRecordSummary,
} from "./MuseumAcquisitionRecordSections";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import type {
  MuseumAcquisitionViewModel,
  MuseumEntityContextModel,
} from "@/lib/museum/publication/ia";
import type { MuseumPublication } from "@/lib/museum/publication/types";

type AcquisitionDocument = MuseumPublication["documents"][number];
type AcquisitionProgram = Parameters<
  typeof AcquisitionRecordSummary
>[0]["program"];

export function MuseumAcquisitionRecordDocuments({
  acquisition,
  acquisitionDocuments,
  curatorialDocuments,
  recordDocuments,
  context,
  program,
  publication,
  sourceCommit,
  workHrefs,
  artFirst,
}: {
  readonly acquisition: MuseumAcquisitionViewModel;
  readonly acquisitionDocuments: readonly AcquisitionDocument[];
  readonly curatorialDocuments: readonly AcquisitionDocument[];
  readonly recordDocuments: readonly AcquisitionDocument[];
  readonly context: MuseumEntityContextModel;
  readonly program: AcquisitionProgram;
  readonly publication: MuseumPublication;
  readonly sourceCommit: string;
  readonly workHrefs: Readonly<Record<string, string>>;
  readonly artFirst: boolean;
}) {
  return artFirst ? (
    <>
      {curatorialDocuments.length === 0 ? null : (
        <section
          id="acquisition-curatorial-reading"
          className="tw-mt-16 tw-max-w-4xl tw-scroll-mt-8"
          aria-labelledby="acquisition-curatorial-reading-title"
        >
          <p className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.16em] tw-text-primary-300">
            {t(
              DEFAULT_LOCALE,
              "museum.network.methodology.documents.curatorial.title"
            )}
          </p>
          <h2
            id="acquisition-curatorial-reading-title"
            className="tw-m-0 tw-mt-3 tw-text-3xl tw-font-semibold tw-text-iron-50"
          >
            {t(DEFAULT_LOCALE, "museum.network.acquisitions.curatorialReading")}
          </h2>
          <div className="tw-mt-8 tw-space-y-10">
            {curatorialDocuments.map((document) => (
              <AcquisitionDocumentSection
                key={document.id}
                document={document}
                sourceCommit={sourceCommit}
                workHrefs={workHrefs}
              />
            ))}
          </div>
        </section>
      )}

      <details
        id="acquisition-record"
        className="tw-mt-16 tw-scroll-mt-8 tw-rounded-xl tw-border tw-border-white/10 tw-bg-iron-950/40"
      >
        <summary className="tw-cursor-pointer tw-list-none tw-px-5 tw-py-5 tw-text-lg tw-font-semibold tw-text-iron-100 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 sm:tw-px-6">
          {t(
            DEFAULT_LOCALE,
            "museum.network.acquisitions.acquisitionRecordAndSources"
          )}
        </summary>
        <div className="tw-space-y-10 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/10 tw-px-5 tw-py-6 sm:tw-px-6">
          <MuseumEntityContext
            context={context}
            labels={{
              ariaLabel: t(
                DEFAULT_LOCALE,
                "museum.network.accessibility.entityContext"
              ),
              status: t(DEFAULT_LOCALE, "museum.network.entity.status"),
              statusAsOf: t(DEFAULT_LOCALE, "museum.network.entity.statusAsOf"),
              source: t(DEFAULT_LOCALE, "museum.network.entity.sources"),
            }}
          />
          <AcquisitionRecordSummary
            acquisition={acquisition}
            program={program}
            publication={publication}
          />
          {recordDocuments.map((document) => (
            <AcquisitionDocumentSection
              key={document.id}
              document={document}
              sourceCommit={sourceCommit}
              workHrefs={workHrefs}
            />
          ))}
        </div>
      </details>
    </>
  ) : (
    <>
      <MuseumEntityContext
        context={context}
        labels={{
          ariaLabel: t(
            DEFAULT_LOCALE,
            "museum.network.accessibility.entityContext"
          ),
          status: t(DEFAULT_LOCALE, "museum.network.entity.status"),
          statusAsOf: t(DEFAULT_LOCALE, "museum.network.entity.statusAsOf"),
          source: t(DEFAULT_LOCALE, "museum.network.entity.sources"),
        }}
      />
      <div className="tw-mt-10">
        <AcquisitionRecordSummary
          acquisition={acquisition}
          program={program}
          publication={publication}
        />
      </div>
      {acquisitionDocuments.map((document) => (
        <AcquisitionDocumentSection
          key={document.id}
          document={document}
          sourceCommit={sourceCommit}
          workHrefs={workHrefs}
          headingLevel="h2"
          sectionClassName="tw-mt-14 tw-max-w-4xl tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-pt-10"
        />
      ))}
    </>
  );
}
