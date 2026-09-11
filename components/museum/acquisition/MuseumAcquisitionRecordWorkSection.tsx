import {
  AcquisitionWorkFigure,
  MuseumProposalPresentationMedia,
  type AcquisitionWorkCard,
} from "./MuseumAcquisitionExhibition";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import type { MuseumAcquisitionViewModel } from "@/lib/museum/publication/ia";
import { museumAcquisitionWorkCountLabel } from "./MuseumAcquisitionCopy";

export function MuseumAcquisitionRecordWorkSection({
  workCards,
  additionalPresentationMedia,
  artFirst,
}: {
  readonly workCards: readonly AcquisitionWorkCard[];
  readonly additionalPresentationMedia: MuseumAcquisitionViewModel["presentationMedia"];
  readonly artFirst: boolean;
}) {
  return (
    <>
      {workCards.length > 0 ? (
        <section
          id="acquisition-works"
          className="tw-mt-12 tw-scroll-mt-8"
          aria-labelledby="acquisition-works-title"
        >
          <div className="tw-flex tw-flex-col tw-gap-2 sm:tw-flex-row sm:tw-items-end sm:tw-justify-between">
            <h2
              id="acquisition-works-title"
              className="tw-m-0 tw-text-2xl tw-font-semibold tw-text-iron-50"
            >
              {t(DEFAULT_LOCALE, "museum.network.acquisitions.works")}
            </h2>
            <p className="tw-m-0 tw-text-sm tw-text-iron-500">
              {museumAcquisitionWorkCountLabel(workCards.length)}
            </p>
          </div>
          {artFirst ? (
            <>
              <div className="tw-mt-8">
                <AcquisitionWorkFigure
                  work={workCards[0] as AcquisitionWorkCard}
                  eager
                  exhibitionPresentation
                  featured
                />
              </div>
              {workCards.length > 1 ? (
                <div className="tw-mt-12 tw-grid tw-gap-x-6 tw-gap-y-10 sm:tw-grid-cols-2">
                  {workCards.slice(1).map((work) => (
                    <AcquisitionWorkFigure
                      key={work.id}
                      work={work}
                      exhibitionPresentation
                    />
                  ))}
                </div>
              ) : null}
            </>
          ) : (
            <div className="tw-mt-6 tw-grid tw-gap-5 md:tw-grid-cols-2 xl:tw-grid-cols-3">
              {workCards.map((work, index) => (
                <AcquisitionWorkFigure
                  key={work.id}
                  work={work}
                  eager={index === 0}
                />
              ))}
            </div>
          )}
        </section>
      ) : null}

      <MuseumProposalPresentationMedia
        media={additionalPresentationMedia}
        exhibitionPresentation={artFirst}
      />
    </>
  );
}
