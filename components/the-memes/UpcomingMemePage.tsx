import { MemeCalendarOverviewNextMint } from "@/components/meme-calendar/MemeCalendarOverview";
import LatestDropNextMintSubscribe from "@/components/home/now-minting/LatestDropNextMintSubscribe";
import NotFound from "@/components/not-found/NotFound";
import { DEFAULT_LOCALE, type SupportedLocale } from "@/i18n/locales";

export default function UpcomingMemePage({
  id,
  locale = DEFAULT_LOCALE,
}: {
  readonly id: string;
  readonly locale?: SupportedLocale;
}) {
  const numId = Number(id);
  if (Number.isInteger(numId)) {
    return (
      <div className="tw-mt-6 tw-flex tw-w-full tw-flex-col tw-gap-4">
        <LatestDropNextMintSubscribe tokenId={numId} />
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
