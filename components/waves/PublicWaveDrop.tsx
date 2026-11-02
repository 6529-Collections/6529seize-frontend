import Image from "next/image";
import Link from "next/link";

import type { PublicWaveDrop as PublicWaveDropData } from "@/app/waves/public-wave-drop.server";
import { formatUtcDate } from "@/i18n/format";
import { DEFAULT_LOCALE, type SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";

export default function PublicWaveDrop({
  drop,
  locale = DEFAULT_LOCALE,
}: {
  readonly drop: PublicWaveDropData;
  readonly locale?: SupportedLocale;
}) {
  const headingId = `public-wave-drop-${drop.id}`;
  const title =
    drop.title ||
    t(locale, "waves.publicDrop.title", { number: drop.serialNo });
  return (
    <section
      aria-labelledby={headingId}
      data-public-wave-drop={drop.id}
      className="tailwind-scope tw-min-h-full tw-bg-iron-950 tw-p-4 tw-text-iron-100 sm:tw-p-6"
    >
      <h2 id={headingId} className="tw-m-0 tw-text-lg tw-font-semibold">
        {drop.waveName}
      </h2>
      <article
        aria-labelledby={`${headingId}-title`}
        className="tw-mt-5 tw-break-words"
      >
        <h3 id={`${headingId}-title`} className="tw-text-base tw-font-semibold">
          <Link
            href={drop.href}
            prefetch={false}
            className="tw-text-iron-100 focus-visible:tw-outline focus-visible:tw-outline-primary-400"
          >
            {title}
          </Link>
        </h3>
        <p className="tw-text-sm tw-text-iron-300">{drop.author}</p>
        <time
          dateTime={drop.publishedAt}
          className="tw-text-xs tw-text-iron-400"
        >
          {t(locale, "waves.publicDrop.published", {
            date: formatUtcDate(locale, drop.publishedAt),
          })}
        </time>
        {drop.parts.map((part) => (
          <div key={part.partNo} className="tw-mt-4">
            {part.text ? (
              <p className="tw-whitespace-pre-wrap tw-text-sm tw-leading-6">
                {part.text}
              </p>
            ) : null}
            {part.media.map((media, index) => (
              <a
                key={`${media.url}-${index}`}
                href={media.url}
                rel="ugc nofollow noreferrer"
                className="tw-mt-3 tw-block tw-min-h-11 tw-min-w-11 tw-py-3 tw-text-primary-300 focus-visible:tw-outline focus-visible:tw-outline-primary-400"
              >
                {media.mimeType.startsWith("image/") ? (
                  <Image
                    src={media.url}
                    alt={t(locale, "waves.publicDrop.image", {
                      title,
                      number: index + 1,
                    })}
                    width={1200}
                    height={800}
                    unoptimized
                    className="tw-h-auto tw-max-h-96 tw-w-full tw-object-contain"
                  />
                ) : (
                  t(locale, "waves.publicDrop.media", {
                    number: index + 1,
                    type: media.mimeType,
                  })
                )}
              </a>
            ))}
          </div>
        ))}
        {drop.hasMoreParts ? (
          <p className="tw-text-sm tw-text-iron-300">
            {t(locale, "waves.publicDrop.moreParts")}
          </p>
        ) : null}
      </article>
    </section>
  );
}
