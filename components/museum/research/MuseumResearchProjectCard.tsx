import Link from "next/link";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import type {
  MuseumExternalProposalPresentationMedia,
  MuseumMedia,
} from "@/lib/museum/publication/types";
import { museumMediaResponsiveImage } from "@/lib/museum/publication/mediaSelection";
import { MuseumProposalImage } from "../MuseumProposalImage";
import { MuseumPublicMediaFigure } from "../MuseumPublicMediaFigure";
import { museumResearchMediaAspectRatio } from "./museumResearchMediaAspectRatio";

export interface MuseumResearchProjectCardData {
  readonly id: string;
  readonly href: string;
  readonly title: string;
  readonly artistNames: readonly string[];
  readonly platform?: string;
  readonly releaseYear?: number;
  readonly workCount: number;
  readonly media?: MuseumMedia;
  readonly presentationMedia?: MuseumExternalProposalPresentationMedia;
}

export function MuseumResearchProjectCard({
  project,
}: {
  readonly project: MuseumResearchProjectCardData;
}) {
  const mediaAspectRatio = project.media
    ? museumResearchMediaAspectRatio(project.media.width, project.media.height)
    : undefined;
  const presentationAspectRatio = project.presentationMedia
    ? museumResearchMediaAspectRatio(
        project.presentationMedia.width,
        project.presentationMedia.height
      )
    : undefined;
  const mediaAspectRatioProps =
    mediaAspectRatio === undefined ? {} : { aspectRatio: mediaAspectRatio };
  const presentationStyleProps =
    presentationAspectRatio === undefined
      ? {}
      : { style: { aspectRatio: presentationAspectRatio } };
  const responsiveImage = project.media
    ? museumMediaResponsiveImage(project.media)
    : undefined;
  const responsiveSrcSetProps =
    responsiveImage?.srcSet === undefined
      ? {}
      : { srcSet: responsiveImage.srcSet };
  return (
    <article className="tw-flex tw-min-w-0 tw-flex-col tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-iron-950 tw-p-4 sm:tw-p-5">
      {project.media === undefined ? null : (
        <MuseumPublicMediaFigure
          src={responsiveImage?.src ?? project.media.url}
          {...responsiveSrcSetProps}
          width={project.media.width}
          height={project.media.height}
          alt={project.media.altText ?? project.title}
          href={project.href}
          title={project.title}
          sizes="(min-width: 1280px) 30vw, (min-width: 768px) 45vw, 100vw"
          {...mediaAspectRatioProps}
        />
      )}
      {project.media !== undefined ||
      project.presentationMedia === undefined ? null : (
        <div
          className="tw-relative tw-w-full tw-overflow-hidden tw-bg-black"
          {...presentationStyleProps}
        >
          <MuseumProposalImage
            src={project.presentationMedia.mediaUrl}
            width={project.presentationMedia.width}
            height={project.presentationMedia.height}
            alt={project.presentationMedia.altText.trim() || project.title}
            sourceByteSize={project.presentationMedia.sourceByteSize}
            variants={project.presentationMedia.variants}
            className="tw-h-full tw-w-full tw-object-contain"
          />
        </div>
      )}
      <div
        className={
          project.media === undefined && project.presentationMedia === undefined
            ? "tw-flex tw-flex-1 tw-flex-col"
            : "tw-mt-5"
        }
      >
        <p className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.14em] tw-text-primary-300">
          {t(DEFAULT_LOCALE, "museum.network.projects.project")}
        </p>
        {project.media === undefined ? (
          <h3 className="tw-m-0 tw-mt-2 tw-text-lg tw-font-semibold tw-leading-tight tw-text-iron-50">
            <Link
              href={project.href}
              className="hover:tw-text-primary-200 tw-text-inherit tw-no-underline focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
            >
              {project.title}
            </Link>
          </h3>
        ) : null}
        {project.artistNames.length === 0 ? null : (
          <p className="tw-m-0 tw-mt-2 tw-text-sm tw-text-iron-300">
            {project.artistNames.join(", ")}
          </p>
        )}
        {project.platform === undefined &&
        project.releaseYear === undefined ? null : (
          <dl className="tw-m-0 tw-mt-4 tw-grid tw-grid-cols-2 tw-gap-x-4 tw-gap-y-2 tw-text-xs tw-text-iron-500">
            {project.platform === undefined ? null : (
              <div>
                <dt className="tw-sr-only">
                  {t(DEFAULT_LOCALE, "museum.network.projects.platform")}
                </dt>
                <dd className="tw-m-0">{project.platform}</dd>
              </div>
            )}
            {project.releaseYear === undefined ? null : (
              <div>
                <dt className="tw-sr-only">
                  {t(DEFAULT_LOCALE, "museum.network.projects.releaseYear")}
                </dt>
                <dd className="tw-m-0 tw-text-right">{project.releaseYear}</dd>
              </div>
            )}
          </dl>
        )}
        <p className="tw-m-0 tw-mt-2 tw-text-xs tw-text-iron-500">
          {t(
            DEFAULT_LOCALE,
            project.workCount === 1
              ? "museum.network.projects.workCount.one"
              : "museum.network.projects.workCount.other",
            { count: project.workCount }
          )}
        </p>
      </div>
    </article>
  );
}
