import Link from "next/link";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { formatInteger } from "@/i18n/format";
import { t } from "@/i18n/messages";
import type { MuseumAcquisitionViewModel } from "@/lib/museum/publication/ia";
import {
  museumAcquisitionProgramHref,
  museumAcquisitionProgramHrefForSourceId,
} from "@/lib/museum/publication/routes";
import type { MuseumPublication } from "@/lib/museum/publication/types";
import type { MuseumView } from "@/lib/museum/types";
import { museumDocumentKindLabelKey } from "@/lib/museum/publication/documentLabels";
import { MuseumJsonDisclosure, MuseumMarkdown } from "../MuseumMarkdown";

function acquisitionMethodLabel(
  method: string,
  programId: string | null
): string {
  switch (method) {
    case "gift":
    case "donation":
      return t(DEFAULT_LOCALE, "museum.network.acquisitions.methodGift");
    case "program_primary_mint_purchase":
      return t(DEFAULT_LOCALE, "museum.network.acquisitions.methodProgram");
    case "purchase":
      return t(
        DEFAULT_LOCALE,
        programId === null
          ? "museum.network.acquisitions.methodPurchase"
          : "museum.network.acquisitions.methodProgram"
      );
    case "commission":
      return t(DEFAULT_LOCALE, "museum.network.acquisitions.methodCommission");
    case "bequest":
      return t(DEFAULT_LOCALE, "museum.network.acquisitions.methodBequest");
    case "exchange":
      return t(DEFAULT_LOCALE, "museum.network.acquisitions.methodExchange");
    case "transfer":
      return t(DEFAULT_LOCALE, "museum.network.acquisitions.methodTransfer");
    default:
      return t(DEFAULT_LOCALE, "museum.network.acquisitions.methodOther");
  }
}

const CURATORIAL_DOCUMENT_KINDS = new Set([
  "acquisition_essay",
  "collection_essay",
  "program_essay",
  "gift_narrative",
  "project_essay",
  "artist_practice",
  "object_entry",
]);

export function isCuratorialDocument(
  document: MuseumPublication["documents"][number]
): boolean {
  return CURATORIAL_DOCUMENT_KINDS.has(document.kind);
}

export function AcquisitionDocumentSection({
  document,
  sourceCommit,
  workHrefs,
}: {
  readonly document: MuseumPublication["documents"][number];
  readonly sourceCommit: string;
  readonly workHrefs: Readonly<Record<string, string>>;
}) {
  return (
    <section
      className="tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-pt-8 first:tw-border-t-0 first:tw-pt-0"
      aria-labelledby={`acquisition-document-${document.id}`}
    >
      <p className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.16em] tw-text-primary-300">
        {t(DEFAULT_LOCALE, museumDocumentKindLabelKey(document.kind))}
      </p>
      <h3
        id={`acquisition-document-${document.id}`}
        className="tw-m-0 tw-mt-3 tw-text-2xl tw-font-semibold tw-text-iron-50"
      >
        {document.title}
      </h3>
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
          sourceCommit={sourceCommit}
          sourcePath={document.sourcePath}
          workHrefs={workHrefs}
        >
          {document.markdown}
        </MuseumMarkdown>
      )}
    </section>
  );
}

type AcquisitionProgram =
  | NonNullable<MuseumPublication["acquisitionPrograms"]>[number]
  | MuseumView["programs"][number];

export function AcquisitionRecordSummary({
  acquisition,
  program,
  publication,
}: {
  readonly acquisition: MuseumAcquisitionViewModel;
  readonly program: AcquisitionProgram | null;
  readonly publication: MuseumPublication;
}) {
  return (
    <section
      className="tw-grid tw-gap-6 sm:tw-grid-cols-2 lg:tw-grid-cols-3"
      aria-label={t(DEFAULT_LOCALE, "museum.network.acquisitions.context")}
    >
      <div>
        <p className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.12em] tw-text-iron-500">
          {t(DEFAULT_LOCALE, "museum.network.acquisitions.method")}
        </p>
        <p className="tw-m-0 tw-mt-2 tw-text-sm tw-leading-6 tw-text-iron-300">
          {acquisitionMethodLabel(
            acquisition.acquisitionMethod,
            acquisition.programId
          )}
        </p>
      </div>
      {program && (
        <div>
          <p className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.12em] tw-text-iron-500">
            {t(DEFAULT_LOCALE, "museum.network.acquisitions.program")}
          </p>
          {(() => {
            const programHref =
              "slug" in program
                ? museumAcquisitionProgramHref(program.slug)
                : museumAcquisitionProgramHrefForSourceId(
                    publication,
                    program.programId
                  );
            return programHref === null ? (
              <span className="tw-mt-2 tw-block tw-text-sm tw-text-iron-300">
                {program.title}
              </span>
            ) : (
              <Link
                href={programHref}
                className="hover:tw-text-primary-200 tw-mt-2 tw-inline-flex tw-min-h-11 tw-items-center tw-text-sm tw-text-primary-300 tw-underline tw-underline-offset-4 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
              >
                {program.title}
              </Link>
            );
          })()}
        </div>
      )}
      <div>
        <p className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.12em] tw-text-iron-500">
          {t(DEFAULT_LOCALE, "museum.network.acquisitions.works")}
        </p>
        <p className="tw-m-0 tw-mt-2 tw-text-sm tw-leading-6 tw-text-iron-300">
          {formatInteger(DEFAULT_LOCALE, acquisition.workIds.length)}
        </p>
      </div>
    </section>
  );
}
