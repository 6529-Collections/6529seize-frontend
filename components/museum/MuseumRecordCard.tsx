import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

interface MuseumRecordCardProps {
  readonly href: string;
  readonly eyebrow?: string | undefined;
  readonly title: string;
  readonly description?: string | undefined;
  readonly meta?: string | undefined;
  readonly imageUrl?: string | undefined;
  readonly imageAlt?: string | undefined;
  readonly children?: ReactNode;
}

export function MuseumRecordCard({
  href,
  eyebrow,
  title,
  description,
  meta,
  imageUrl,
  imageAlt,
  children,
}: MuseumRecordCardProps) {
  return (
    <article className="tw-flex tw-h-full tw-flex-col tw-rounded-2xl tw-border tw-border-white/10 tw-bg-iron-900/60 tw-p-5 tw-transition-colors hover:tw-border-primary-400/40">
      {imageUrl && imageAlt && (
        <Link
          href={href}
          className="tw-relative -tw-mx-5 -tw-mt-5 tw-mb-5 tw-block tw-aspect-[4/3] tw-overflow-hidden tw-rounded-t-2xl tw-bg-black focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 focus-visible:tw-ring-offset-4 focus-visible:tw-ring-offset-black"
        >
          <Image
            src={imageUrl}
            alt={imageAlt}
            fill
            sizes="(min-width: 1280px) 30vw, (min-width: 768px) 45vw, 100vw"
            className="tw-object-cover tw-transition-transform tw-duration-300 hover:tw-scale-[1.01] motion-reduce:tw-transition-none"
            unoptimized
          />
        </Link>
      )}
      <div className="tw-flex tw-flex-1 tw-flex-col">
        {eyebrow && (
          <p className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.14em] tw-text-primary-300">
            {eyebrow}
          </p>
        )}
        <h3 className="tw-m-0 tw-mt-2 tw-text-lg tw-font-semibold tw-text-white">
          <Link
            href={href}
            className="hover:tw-text-primary-200 tw-text-inherit tw-no-underline focus-visible:tw-rounded-sm focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
          >
            {title}
          </Link>
        </h3>
        {description && (
          <p className="tw-m-0 tw-mt-3 tw-flex-1 tw-text-sm tw-leading-6 tw-text-iron-300">
            {description}
          </p>
        )}
        {children !== undefined && children !== null && (
          <div className="tw-mt-4">{children}</div>
        )}
      </div>
      {meta && (
        <p className="tw-m-0 tw-mt-5 tw-text-xs tw-text-iron-500">{meta}</p>
      )}
    </article>
  );
}
