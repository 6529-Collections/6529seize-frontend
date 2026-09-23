import { getRouteHrefWithLocale } from "@/components/rememes/rememesRouteParams";
import type { PublishedMemesStatus } from "@/hooks/usePublishedMemes";
import type { SupportedLocale } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";
import Link from "next/link";

export function getArtworkStatusMessageKey(
  status: PublishedMemesStatus
): MessageKey {
  if (status === "loading") return "memeCalendar.artwork.checking";
  if (status === "error") return "memeCalendar.artwork.checkFailed";
  return "memeCalendar.artwork.notPublished";
}

export default function MemeCalendarArtworkAvailability({
  locale,
  memeNumber,
  publishedMemeIds,
  status,
}: {
  readonly locale: SupportedLocale;
  readonly memeNumber: number;
  readonly publishedMemeIds: ReadonlySet<number>;
  readonly status: PublishedMemesStatus;
}) {
  return (
    <div
      data-ignore-screenshot
      className="tw-mt-3 tw-flex tw-min-h-9 tw-items-center"
    >
      {publishedMemeIds.has(memeNumber) ? (
        <Link
          href={getRouteHrefWithLocale({
            href: `/the-memes/${memeNumber}`,
            locale,
          })}
          className="desktop-hover:hover:tw-text-primary-200 tw-inline-flex tw-min-h-9 tw-items-center tw-rounded-lg tw-text-sm tw-font-semibold tw-text-primary-300 tw-no-underline focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400"
        >
          {t(locale, "memeCalendar.artwork.open", { meme: memeNumber })}
        </Link>
      ) : (
        <span className="tw-text-sm tw-text-iron-500">
          {t(locale, getArtworkStatusMessageKey(status))}
        </span>
      )}
    </div>
  );
}
