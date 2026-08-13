import Link from "next/link";
import type { MuseumMedia } from "@/lib/museum/publication/types";
import { MuseumPublicMediaFigure } from "../MuseumPublicMediaFigure";

export interface MuseumResearchStoryCardProps {
  readonly href: string;
  readonly eyebrow: string;
  readonly title: string;
  readonly description: string;
  readonly media: MuseumMedia | undefined;
  readonly actionLabel: string;
}

export function MuseumResearchStoryCard({
  href,
  eyebrow,
  title,
  description,
  media,
  actionLabel,
}: MuseumResearchStoryCardProps) {
  return (
    <article className="tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-iron-950">
      <div className="tw-grid tw-min-w-0 lg:tw-grid-cols-[minmax(0,1.15fr)_minmax(20rem,0.85fr)]">
        {media === undefined ? (
          <div className="tw-flex tw-min-h-64 tw-items-end tw-bg-iron-900 tw-p-6 sm:tw-p-8">
            <span className="tw-text-sm tw-text-iron-500">{eyebrow}</span>
          </div>
        ) : (
          <MuseumPublicMediaFigure
            src={media.url}
            width={media.width}
            height={media.height}
            alt={media.altText ?? title}
            href={href}
            title={title}
            eager
            sizes="(min-width: 1024px) 58vw, 100vw"
          />
        )}
        <div className="tw-flex tw-flex-col tw-justify-between tw-gap-8 tw-p-6 sm:tw-p-8">
          <div>
            <p className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.16em] tw-text-primary-300">
              {eyebrow}
            </p>
            <h2 className="tw-m-0 tw-mt-3 tw-text-2xl tw-font-semibold tw-leading-tight tw-text-iron-50 sm:tw-text-3xl">
              <Link
                href={href}
                className="hover:tw-text-primary-200 tw-text-inherit tw-no-underline focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
              >
                {title}
              </Link>
            </h2>
            <p className="tw-m-0 tw-mt-4 tw-text-base tw-leading-7 tw-text-iron-300">
              {description}
            </p>
          </div>
          <Link
            href={href}
            className="hover:tw-text-primary-200 tw-inline-flex tw-min-h-11 tw-items-center tw-self-start tw-text-sm tw-font-semibold tw-text-primary-300 tw-underline tw-underline-offset-4 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
          >
            {actionLabel}
          </Link>
        </div>
      </div>
    </article>
  );
}
