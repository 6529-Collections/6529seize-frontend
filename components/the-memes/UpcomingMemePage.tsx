import { MemeCalendarOverviewNextMint } from "@/components/meme-calendar/MemeCalendarOverview";
import LatestDropNextMintSubscribe from "@/components/home/now-minting/LatestDropNextMintSubscribe";
import NotFound from "@/components/not-found/NotFound";

export default function UpcomingMemePage({ id }: { readonly id: string }) {
  const numId = Number(id);
  if (Number.isInteger(numId)) {
    return (
      <div className="tw-mt-6 tw-flex tw-w-full tw-flex-col tw-gap-4">
        <MemeCalendarOverviewNextMint displayTz="local" id={numId} />
        <LatestDropNextMintSubscribe tokenId={numId} />
      </div>
    );
  }
  return <NotFound label="MEME" />;
}
