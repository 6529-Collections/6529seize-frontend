import Link from "next/link";
import Image from "next/image";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { getCaseyArtwork } from "@/lib/museum/casey";
import type {
  MuseumGenerativeStudy,
  MuseumHeldPosition,
} from "@/lib/museum/generative-studies";

const linkClass =
  "hover:tw-text-primary-200 tw-inline-flex tw-min-h-11 tw-items-center tw-text-sm tw-font-semibold tw-text-primary-300 tw-underline tw-underline-offset-4 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400";

export function MuseumInTheSystem({
  study,
  position,
}: {
  readonly study: MuseumGenerativeStudy;
  readonly position: MuseumHeldPosition;
}) {
  return (
    <section
      aria-labelledby="museum-object-system-title"
      className="tw-mt-10 tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-iron-900/60 tw-p-5 sm:tw-p-7"
    >
      <div className="tw-grid tw-gap-7 lg:tw-grid-cols-[minmax(0,1fr)_minmax(15rem,0.7fr)]">
        <div>
          <p className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.16em] tw-text-primary-300">
            {t(DEFAULT_LOCALE, "museum.network.insideSystem.objectEyebrow")}
          </p>
          <h2
            id="museum-object-system-title"
            className="tw-m-0 tw-mt-3 tw-text-2xl tw-font-semibold tw-text-iron-50"
          >
            {t(DEFAULT_LOCALE, "museum.network.insideSystem.objectTitle")}
          </h2>
          <p className="tw-m-0 tw-mt-4 tw-max-w-2xl tw-text-base tw-leading-7 tw-text-iron-200">
            {position.reading}
          </p>
          <Link
            href={`/museum/network/projects/${study.projectSlug}/system?work=${encodeURIComponent(position.objectId)}#possibility-space`}
            className={`${linkClass} tw-mt-5`}
          >
            {t(DEFAULT_LOCALE, "museum.network.insideSystem.locateWork")}
          </Link>
        </div>
        <div className="tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-700 tw-pt-5 lg:tw-border-l lg:tw-border-t-0 lg:tw-pl-7 lg:tw-pt-0">
          <p className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.14em] tw-text-iron-500">
            {study.mapLabel}
          </p>
          <dl className="tw-m-0 tw-mt-4 tw-grid tw-gap-4 sm:tw-grid-cols-3 lg:tw-grid-cols-1">
            {position.coordinates.slice(0, 3).map((coordinate) => (
              <div key={coordinate.label}>
                <dt className="tw-text-xs tw-text-iron-500">
                  {coordinate.label}
                </dt>
                <dd className="tw-m-0 tw-mt-1 tw-text-sm tw-font-medium tw-leading-6 tw-text-iron-100">
                  {coordinate.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}

export function MuseumInsideSystemDirectory({
  studies,
}: {
  readonly studies: readonly MuseumGenerativeStudy[];
}) {
  return (
    <div className="tw-grid tw-gap-5 md:tw-grid-cols-2 xl:tw-grid-cols-3">
      {studies.map((study) => {
        const artworks = study.heldPositions
          .map((position) => getCaseyArtwork(position.objectId))
          .filter((artwork) => artwork !== null);
        return (
          <Link
            key={study.projectId}
            href={`/museum/network/projects/${study.projectSlug}/system`}
            prefetch={false}
            className="tw-group tw-flex tw-h-full tw-min-w-0 tw-flex-col tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-iron-950 tw-text-inherit tw-no-underline tw-transition-colors hover:tw-border-primary-400 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 motion-reduce:tw-transition-none"
          >
            <span
              className={`tw-grid tw-aspect-[4/3] tw-overflow-hidden tw-bg-black ${artworks.length > 1 ? "tw-grid-cols-3" : "tw-grid-cols-1"}`}
            >
              {artworks.map((artwork) => (
                <span
                  key={artwork.objectId}
                  className="tw-relative tw-min-w-0 tw-overflow-hidden"
                >
                  <Image
                    src={artwork.imageUrl}
                    alt=""
                    fill
                    sizes="(min-width: 1280px) 22vw, (min-width: 768px) 45vw, 100vw"
                    className="tw-object-contain tw-transition-transform tw-duration-500 group-hover:tw-scale-[1.025] motion-reduce:tw-transition-none"
                    unoptimized
                  />
                </span>
              ))}
            </span>
            <span className="tw-flex tw-flex-1 tw-flex-col tw-p-5">
              <span className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.14em] tw-text-primary-300">
                {study.mapLabel}
              </span>
              <span className="tw-mt-3 tw-text-xl tw-font-semibold tw-leading-7 tw-text-iron-50">
                {study.projectTitle}
              </span>
              <span className="tw-mt-3 tw-flex-1 tw-text-sm tw-leading-6 tw-text-iron-400">
                {study.thesis}
              </span>
              <span className="group-hover:tw-text-primary-200 tw-mt-4 tw-text-sm tw-font-semibold tw-text-primary-300 tw-underline tw-underline-offset-4">
                {t(DEFAULT_LOCALE, "museum.network.insideSystem.enterProject")}
              </span>
            </span>
          </Link>
        );
      })}
    </div>
  );
}
