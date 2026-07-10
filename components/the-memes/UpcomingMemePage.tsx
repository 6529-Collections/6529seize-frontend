import { MemeCalendarOverviewNextMint } from "@/components/meme-calendar/MemeCalendarOverview";
import { getDistributionDetailHref } from "@/components/distribution/distributionRouteParams";
import LatestDropNextMintSubscribe from "@/components/home/now-minting/LatestDropNextMintSubscribe";
import NotFound from "@/components/not-found/NotFound";
import { DEFAULT_LOCALE, type SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { ArrowUpRightIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

function UpcomingMemeDistributionLink({
  id,
  locale,
}: {
  readonly id: number;
  readonly locale: SupportedLocale;
}) {
  return (
    <div className="tw-flex tw-w-full tw-justify-end">
      <Link
        href={getDistributionDetailHref({
          basePath: "/the-memes",
          id,
          locale,
        })}
        className="tw-inline-flex tw-w-full tw-items-center tw-justify-center tw-gap-2 tw-rounded-lg tw-bg-iron-900 tw-px-5 tw-py-3 tw-text-base tw-font-semibold tw-leading-6 tw-text-iron-100 tw-no-underline tw-transition-colors hover:tw-bg-iron-800 hover:tw-text-white focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 sm:tw-w-auto"
      >
        <span>{t(locale, "distribution.planLink")}</span>
        <ArrowUpRightIcon
          aria-hidden="true"
          className="-tw-mr-1 tw-h-5 tw-w-5 tw-flex-shrink-0 tw-text-iron-400"
        />
      </Link>
    </div>
  );
}

export default function UpcomingMemePage({
  id,
  locale = DEFAULT_LOCALE,
  showDistributionLink = true,
}: {
  readonly id: string;
  readonly locale?: SupportedLocale;
  readonly showDistributionLink?: boolean;
}) {
  const numId = Number(id);
  if (Number.isInteger(numId) && numId > 0) {
    return (
      <div className="tw-mt-6 tw-flex tw-w-full tw-flex-col tw-gap-4">
        <LatestDropNextMintSubscribe tokenId={numId} />
        {showDistributionLink && (
          <UpcomingMemeDistributionLink id={numId} locale={locale} />
        )}
        <MemeCalendarOverviewNextMint
          displayTz="local"
          id={numId}
          locale={locale}
        />
      </div>
    );
  }
  return <NotFound label="MEME" />;
}
