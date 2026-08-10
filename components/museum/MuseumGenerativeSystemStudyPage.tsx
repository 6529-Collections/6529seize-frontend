import Link from "next/link";
import { MuseumArtworkFigure } from "./MuseumArtworkFigure";
import { MuseumPossibilitySpace } from "./MuseumPossibilitySpace";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import type { CaseyArtwork } from "@/lib/museum/casey";
import {
  GENERATIVE_STUDY_SHARED_NOTES,
  type MuseumGenerativeStudy,
  type MuseumMintedProjectIndex,
} from "@/lib/museum/generative-studies";

export function MuseumGenerativeSystemStudyPage({
  study,
  artworks,
  mintedIndex,
  initialWorkId,
  workHrefs,
}: {
  readonly study: MuseumGenerativeStudy;
  readonly artworks: readonly CaseyArtwork[];
  readonly mintedIndex: MuseumMintedProjectIndex;
  readonly initialWorkId?: string | undefined;
  readonly workHrefs: Readonly<Record<string, string>>;
}) {
  return (
    <article className="tw-min-w-0">
      <Link
        href={`/museum/network/projects/${study.projectSlug}`}
        className="tw-inline-flex tw-min-h-11 tw-items-center tw-text-sm tw-font-medium tw-text-iron-400 tw-underline tw-underline-offset-4 hover:tw-text-white focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
      >
        {t(DEFAULT_LOCALE, "museum.network.insideSystem.backToProject", {
          project: study.projectTitle,
        })}
      </Link>

      <header className="tw-mt-7 tw-max-w-5xl">
        <p className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.16em] tw-text-primary-300">
          {t(DEFAULT_LOCALE, "museum.network.insideSystem.eyebrow")}
        </p>
        <h1 className="tw-m-0 tw-mt-3 tw-text-4xl tw-font-semibold tw-leading-tight tw-tracking-tight tw-text-iron-50 sm:tw-text-6xl">
          {study.projectTitle}
        </h1>
        <p className="tw-m-0 tw-mt-4 tw-text-base tw-leading-7 tw-text-iron-400">
          {t(DEFAULT_LOCALE, "museum.network.insideSystem.byline", {
            artist: study.artistName,
          })}
        </p>
        <p className="tw-m-0 tw-mt-8 tw-max-w-4xl tw-text-2xl tw-font-medium tw-leading-9 tw-text-iron-100 sm:tw-text-3xl sm:tw-leading-[1.35]">
          {study.thesis}
        </p>
      </header>

      <section
        aria-label={t(
          DEFAULT_LOCALE,
          "museum.network.insideSystem.museumArtworks"
        )}
        className={`tw-mt-10 tw-grid tw-min-w-0 tw-gap-6 ${artworks.length > 1 ? "sm:tw-grid-cols-3" : "tw-max-w-3xl"}`}
      >
        {artworks.flatMap((artwork) => {
          const href = workHrefs[artwork.objectId];
          return href === undefined
            ? []
            : [
                <MuseumArtworkFigure
                  key={artwork.objectId}
                  artwork={artwork}
                  eager
                  href={href}
                  sizes={
                    artworks.length > 1
                      ? "(min-width: 640px) 33vw, 100vw"
                      : "(min-width: 768px) 48rem, 100vw"
                  }
                />,
              ];
        })}
      </section>

      <MuseumPossibilitySpace
        study={study}
        locale={DEFAULT_LOCALE}
        mintedIndex={mintedIndex}
        initialWorkId={initialWorkId}
        workHrefs={workHrefs}
      />

      <section
        className="tw-mt-16 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-pt-10"
        aria-labelledby="system-stages-title"
      >
        <p className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.16em] tw-text-primary-300">
          {t(DEFAULT_LOCALE, "museum.network.insideSystem.algorithmEyebrow")}
        </p>
        <h2
          id="system-stages-title"
          className="tw-m-0 tw-mt-3 tw-text-3xl tw-font-semibold tw-text-iron-50 sm:tw-text-4xl"
        >
          {t(DEFAULT_LOCALE, "museum.network.insideSystem.algorithmTitle")}
        </h2>
        <ol className="tw-m-0 tw-mt-8 tw-grid tw-list-none tw-gap-x-8 tw-gap-y-7 tw-p-0 md:tw-grid-cols-2">
          {study.stages.map((item, index) => (
            <li
              key={item.title}
              className="tw-grid tw-grid-cols-[2.25rem_minmax(0,1fr)] tw-gap-4"
            >
              <span className="tw-text-primary-200 tw-flex tw-size-9 tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-solid tw-border-primary-400 tw-font-mono tw-text-xs">
                {index + 1}
              </span>
              <div>
                <h3 className="tw-m-0 tw-text-lg tw-font-semibold tw-leading-7 tw-text-iron-100">
                  {item.title}
                </h3>
                <p className="tw-m-0 tw-mt-2 tw-text-sm tw-leading-6 tw-text-iron-400">
                  {item.description}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section
        className="tw-mt-16 tw-max-w-5xl tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-pt-10"
        aria-labelledby="system-finding-title"
      >
        <p className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.16em] tw-text-primary-300">
          {t(DEFAULT_LOCALE, "museum.network.insideSystem.findingEyebrow")}
        </p>
        <h2
          id="system-finding-title"
          className="tw-m-0 tw-mt-3 tw-text-3xl tw-font-semibold tw-text-iron-50"
        >
          {t(DEFAULT_LOCALE, "museum.network.insideSystem.findingTitle")}
        </h2>
        <p className="tw-m-0 tw-mt-6 tw-text-xl tw-leading-8 tw-text-iron-200 sm:tw-text-2xl sm:tw-leading-9">
          {study.finding}
        </p>
      </section>

      <section
        className="tw-mt-16 tw-max-w-5xl tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-pt-10"
        aria-labelledby="system-research-note-title"
      >
        <p className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.16em] tw-text-iron-500">
          {t(DEFAULT_LOCALE, "museum.network.insideSystem.apparatusEyebrow")}
        </p>
        <h2
          id="system-research-note-title"
          className="tw-m-0 tw-mt-3 tw-text-2xl tw-font-semibold tw-text-iron-100"
        >
          {t(DEFAULT_LOCALE, "museum.network.insideSystem.apparatusTitle")}
        </h2>
        <p className="tw-m-0 tw-mt-4 tw-text-sm tw-leading-6 tw-text-iron-400">
          {study.coverageStatement}
        </p>
        <ul className="tw-m-0 tw-mt-6 tw-space-y-3 tw-pl-5 tw-text-sm tw-leading-6 tw-text-iron-400">
          {[...study.caveats, ...GENERATIVE_STUDY_SHARED_NOTES].map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      </section>
    </article>
  );
}
