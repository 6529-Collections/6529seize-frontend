import Link from "next/link";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";

export function MuseumPublicWorkTextFigure({
  title,
  href,
  byline,
}: {
  readonly title: string;
  readonly href: string;
  readonly byline?: string;
}) {
  return (
    <figure className="tw-m-0 tw-min-w-0">
      <div className="tw-flex tw-aspect-square tw-items-end tw-border-y tw-border-solid tw-border-iron-800 tw-bg-black tw-p-6">
        <p className="tw-m-0 tw-max-w-sm tw-text-sm tw-leading-6 tw-text-iron-400">
          {t(DEFAULT_LOCALE, "museum.network.objects.mediaUnavailable")}
        </p>
      </div>
      <figcaption className="tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800 tw-py-4">
        <Link
          href={href}
          className="hover:tw-text-primary-200 tw-text-base tw-font-semibold tw-text-iron-50 tw-no-underline focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
        >
          {title}
        </Link>
        {byline === undefined ? null : (
          <span className="tw-mt-1 tw-block tw-text-sm tw-text-iron-400">
            {byline}
          </span>
        )}
      </figcaption>
    </figure>
  );
}
