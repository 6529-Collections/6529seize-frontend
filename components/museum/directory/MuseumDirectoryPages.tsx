import { MuseumSectionHeading } from "@/components/museum/MuseumShell";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import type { MuseumDirectoryModel } from "./MuseumDirectoryData";
import {
  MuseumDirectoryArtistCard,
  MuseumDirectoryWorkCard,
} from "./MuseumDirectoryMediaCard";

function MuseumDirectoryMetric({
  value,
  label,
}: {
  readonly value: number;
  readonly label: string;
}) {
  return (
    <div className="tw-border-l-2 tw-border-solid tw-border-primary-400 tw-pl-4">
      <p className="tw-m-0 tw-text-2xl tw-font-semibold tw-text-iron-50">
        {value}
      </p>
      <p className="tw-m-1 tw-text-xs tw-uppercase tw-tracking-[0.12em] tw-text-iron-500">
        {label}
      </p>
    </div>
  );
}

function MuseumDirectoryIntro({
  eyebrow,
  title,
  description,
  model,
}: {
  readonly eyebrow: string;
  readonly title: string;
  readonly description: string;
  readonly model: MuseumDirectoryModel;
}) {
  return (
    <>
      <MuseumSectionHeading
        eyebrow={eyebrow}
        title={title}
        description={description}
      />
      <div className="tw-mb-12 tw-grid tw-gap-5 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-py-6 sm:tw-grid-cols-3">
        <MuseumDirectoryMetric
          value={model.permanentWorks.length}
          label={t(DEFAULT_LOCALE, "museum.network.collection.eyebrow")}
        />
        <MuseumDirectoryMetric
          value={model.acquisitionWorks.length}
          label={t(
            DEFAULT_LOCALE,
            "museum.network.acquisitions.metricSelectedWorks"
          )}
        />
        <MuseumDirectoryMetric
          value={model.artists.length}
          label={t(DEFAULT_LOCALE, "museum.network.artists.eyebrow")}
        />
      </div>
    </>
  );
}

function MuseumDirectorySectionHeading({
  id,
  title,
  description,
}: {
  readonly id: string;
  readonly title: string;
  readonly description: string;
}) {
  return (
    <div className="tw-mb-6 tw-flex tw-flex-wrap tw-items-end tw-justify-between tw-gap-4">
      <div className="tw-max-w-3xl">
        <h2
          id={id}
          className="tw-m-0 tw-text-2xl tw-font-semibold tw-tracking-tight tw-text-iron-50"
        >
          {title}
        </h2>
        <p className="tw-m-0 tw-mt-2 tw-text-sm tw-leading-6 tw-text-iron-400">
          {description}
        </p>
      </div>
    </div>
  );
}

export function MuseumDirectoryArtistsPage({
  model,
}: {
  readonly model: MuseumDirectoryModel;
}) {
  return (
    <section>
      <MuseumDirectoryIntro
        eyebrow={t(DEFAULT_LOCALE, "museum.network.artists.eyebrow")}
        title={t(DEFAULT_LOCALE, "museum.network.artists.title")}
        description={t(DEFAULT_LOCALE, "museum.network.artists.description")}
        model={model}
      />

      {model.permanentArtists.length > 0 ? (
        <section aria-labelledby="museum-directory-permanent-artists-heading">
          <MuseumDirectorySectionHeading
            id="museum-directory-permanent-artists-heading"
            title={t(DEFAULT_LOCALE, "museum.network.artists.permanentTitle")}
            description={t(
              DEFAULT_LOCALE,
              "museum.network.artists.permanentDescription"
            )}
          />
          <div className="tw-grid tw-min-w-0 tw-gap-x-6 tw-gap-y-12 sm:tw-grid-cols-2 xl:tw-grid-cols-3">
            {model.permanentArtists.map((record, index) => (
              <MuseumDirectoryArtistCard
                key={record.artist.id}
                record={record}
                eager={index < 3}
              />
            ))}
          </div>
        </section>
      ) : null}

      {model.acquisitionArtists.length > 0 ? (
        <section
          aria-labelledby="museum-directory-acquisition-artists-heading"
          className="tw-mt-20 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-pt-10"
        >
          <MuseumDirectorySectionHeading
            id="museum-directory-acquisition-artists-heading"
            title={t(
              DEFAULT_LOCALE,
              "museum.network.artists.currentAcquisitionsTitle"
            )}
            description={t(
              DEFAULT_LOCALE,
              "museum.network.artists.currentAcquisitionsDescription"
            )}
          />
          <div className="tw-grid tw-min-w-0 tw-gap-x-6 tw-gap-y-12 sm:tw-grid-cols-2 xl:tw-grid-cols-3">
            {model.acquisitionArtists.map((record, index) => (
              <MuseumDirectoryArtistCard
                key={record.artist.id}
                record={record}
                eager={index < 3 && model.permanentArtists.length === 0}
              />
            ))}
          </div>
        </section>
      ) : null}
    </section>
  );
}

export function MuseumDirectoryWorksPage({
  model,
}: {
  readonly model: MuseumDirectoryModel;
}) {
  return (
    <section>
      <MuseumDirectoryIntro
        eyebrow={t(DEFAULT_LOCALE, "museum.network.works.eyebrow")}
        title={t(DEFAULT_LOCALE, "museum.network.works.title")}
        description={t(DEFAULT_LOCALE, "museum.network.works.description")}
        model={model}
      />

      {model.permanentWorks.length > 0 ? (
        <section aria-labelledby="museum-directory-permanent-works-heading">
          <MuseumDirectorySectionHeading
            id="museum-directory-permanent-works-heading"
            title={t(DEFAULT_LOCALE, "museum.network.works.permanentTitle")}
            description={t(
              DEFAULT_LOCALE,
              "museum.network.works.permanentDescription"
            )}
          />
          <div className="tw-grid tw-min-w-0 tw-gap-x-6 tw-gap-y-12 sm:tw-grid-cols-2 xl:tw-grid-cols-3">
            {model.permanentWorks.map((record, index) => (
              <MuseumDirectoryWorkCard
                key={record.work.id}
                record={record}
                eager={index < 3}
              />
            ))}
          </div>
        </section>
      ) : null}

      {model.acquisitionWorks.length > 0 ? (
        <section
          aria-labelledby="museum-directory-acquisition-works-heading"
          className="tw-mt-20 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-pt-10"
        >
          <MuseumDirectorySectionHeading
            id="museum-directory-acquisition-works-heading"
            title={t(
              DEFAULT_LOCALE,
              "museum.network.works.currentAcquisitionsTitle"
            )}
            description={t(
              DEFAULT_LOCALE,
              "museum.network.works.currentAcquisitionsDescription"
            )}
          />
          <div className="tw-grid tw-min-w-0 tw-gap-x-6 tw-gap-y-12 sm:tw-grid-cols-2 xl:tw-grid-cols-3">
            {model.acquisitionWorks.map((record, index) => (
              <MuseumDirectoryWorkCard
                key={record.work.id}
                record={record}
                eager={index < 3 && model.permanentWorks.length === 0}
              />
            ))}
          </div>
        </section>
      ) : null}
    </section>
  );
}
